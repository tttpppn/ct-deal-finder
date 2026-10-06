import axios from 'axios';
import { BANK_REO_TIERS, REQUEST_CONFIG } from '../config.js';
import { logger } from '../utils/logger.js';
import { createAddressKey } from '../utils/addressNormalize.js';

// Mock bank REO data (simulating real bank listings)
// In production, this would call actual bank APIs or Zillow bank-owned filter
function getMockBankREOData() {
  return [
    {
      bank: 'Bank of America',
      address: '100 First Avenue',
      town: 'Madison',
      listPrice: '$215,000',
      marketValue: '$255,000',
      propertyType: 'Single Family',
      link: 'https://www.zillow.com/bank-reo-1',
    },
    {
      bank: 'Wells Fargo',
      address: '200 Second Street',
      town: 'Guilford',
      listPrice: '$195,000',
      marketValue: '$235,000',
      propertyType: 'Condo',
      link: 'https://www.zillow.com/bank-reo-2',
    },
    {
      bank: 'Chase',
      address: '300 Third Boulevard',
      town: 'Orange',
      listPrice: '$255,000',
      marketValue: '$300,000',
      propertyType: 'Single Family',
      link: 'https://www.zillow.com/bank-reo-3',
    },
    {
      bank: 'Zillow (Tier 3)',
      address: '400 Fourth Lane',
      town: 'Cheshire',
      listPrice: '$175,000',
      marketValue: '$210,000',
      propertyType: 'Single Family',
      link: 'https://www.zillow.com/bank-reo-4',
    },
  ];
}

async function fetchBankREO(bank, tier) {
  try {
    logger.info(`Fetching REO listings from ${bank.name} (Tier ${tier})...`);

    // Simulate API fetch (in production, use real bank API or Zillow filter)
    const allData = getMockBankREOData();

    // Filter for this bank
    const bankProperties = allData.filter(prop => prop.bank === bank.name);

    const properties = bankProperties.map(prop => ({
      source: `${bank.name.toLowerCase().replace(/ /g, '_')}_reo`,
      bank: bank.name,
      address: prop.address,
      town: prop.town,
      addressKey: createAddressKey(prop.address, prop.town),
      listPrice: prop.listPrice,
      marketValue: prop.marketValue,
      propertyType: prop.propertyType,
      link: prop.link,
      daysToCash: 60, // Bank REO typically faster
      scrapedAt: new Date().toISOString(),
    }));

    if (properties.length === 0) {
      logger.info(`   ⚠️  No REO listings found from ${bank.name}`);
    } else {
      logger.info(`   ✓ Found ${properties.length} REO property(ies) from ${bank.name}`);
    }
    return properties;
  } catch (error) {
    logger.warn(`Failed to fetch from ${bank.name}`, { error: error.message });
    return [];
  }
}

async function scrapeWithFallback() {
  logger.info('Starting Bank REO scrape with Tier 1 → 2 → 3 fallback...');

  const allProperties = [];

  // Try Tier 1 banks first
  for (const bank of BANK_REO_TIERS.tier1) {
    const properties = await fetchBankREO(bank, 1);
    allProperties.push(...properties);
    await new Promise(resolve => setTimeout(resolve, REQUEST_CONFIG.requestDelay));
  }

  // Fall back to Tier 2 if needed
  if (allProperties.length < 10) {
    logger.info('Tier 1 returned fewer than 10 results, falling back to Tier 2...');
    for (const bank of BANK_REO_TIERS.tier2) {
      const properties = await fetchBankREO(bank, 2);
      allProperties.push(...properties);
      await new Promise(resolve => setTimeout(resolve, REQUEST_CONFIG.requestDelay));
    }
  }

  // Fall back to Tier 3 (Zillow, Redfin) if needed
  if (allProperties.length < 10) {
    logger.info('Tier 1+2 returned fewer than 10 results, falling back to Tier 3...');
    for (const bank of BANK_REO_TIERS.tier3) {
      const properties = await fetchBankREO(bank, 3);
      allProperties.push(...properties);
      await new Promise(resolve => setTimeout(resolve, REQUEST_CONFIG.requestDelay));
    }
  }

  logger.info(`Bank REO scrape complete. Total properties found: ${allProperties.length}`);
  return allProperties;
}

export { scrapeWithFallback, fetchBankREO };
