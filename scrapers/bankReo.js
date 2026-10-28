import axios from 'axios';
import { BANK_REO_TIERS, REQUEST_CONFIG } from '../config.js';
import { logger } from '../utils/logger.js';
import { createAddressKey } from '../utils/addressNormalize.js';

// Fetch real bank-owned (REO) properties from Redfin API
async function fetchRealBankREOData(town) {
  try {
    const url = `https://www.redfin.com/api/gis`;
    const params = {
      al: 'CT',
      q: town,
      ch: '11011', // Bank-owned filter
      num_homes: 50,
      v: 8,
    };

    const response = await axios.get(url, {
      params,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: REQUEST_CONFIG.timeout,
    });

    if (response.data?.payload?.homes) {
      return response.data.payload.homes.map(home => ({
        bank: 'Bank-Owned',
        address: home.streetAddress || '',
        town: town,
        listPrice: `$${home.price || 0}`,
        marketValue: `$${home.listPrice || home.price || 0}`,
        propertyType: home.propertyType || 'Single Family',
        link: `https://www.redfin.com${home.url}` || '',
        status: home.statusText === 'For Sale' ? 'active' : 'inactive',
      }));
    }
  } catch (error) {
    logger.debug(`Bank REO fetch failed for ${town}: ${error.message}`);
  }
  return [];
}

async function fetchBankREO(town) {
  try {
    logger.info(`Fetching bank-owned (REO) listings for ${town}...`);

    const bankREOData = await fetchRealBankREOData(town);

    const properties = bankREOData.map(prop => ({
      source: 'bank_reo',
      bank: prop.bank,
      address: prop.address,
      town: prop.town,
      addressKey: createAddressKey(prop.address, prop.town),
      listPrice: prop.listPrice,
      marketValue: prop.marketValue,
      propertyType: prop.propertyType,
      link: prop.link,
      daysToCash: 60, // Bank REO typically faster closing
      status: prop.status,
      scrapedAt: new Date().toISOString(),
    }));

    if (properties.length === 0) {
      logger.info(`   ⚠️  No bank-owned listings found in ${town}`);
    } else {
      logger.info(`   ✓ Found ${properties.length} bank-owned property(ies) in ${town}`);
    }
    return properties;
  } catch (error) {
    logger.warn(`Failed to fetch bank REO for ${town}`, { error: error.message });
    return [];
  }
}

async function scrapeWithFallback() {
  logger.info('Starting Bank REO scrape across all towns...');

  const allProperties = [];
  const { TOWNS } = await import('../config.js');

  for (const town of TOWNS) {
    const properties = await fetchBankREO(town);
    allProperties.push(...properties);
    await new Promise(resolve => setTimeout(resolve, REQUEST_CONFIG.requestDelay));
  }

  logger.info(`Bank REO scrape complete. Total properties found: ${allProperties.length}`);
  return allProperties;
}

export { scrapeWithFallback, fetchBankREO };
