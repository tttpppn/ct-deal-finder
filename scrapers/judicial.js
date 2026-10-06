import axios from 'axios';
import { TOWNS, REQUEST_CONFIG } from '../config.js';
import { logger } from '../utils/logger.js';
import { createAddressKey } from '../utils/addressNormalize.js';

// Mock foreclosure data for CT towns (simulating Zillow/real estate API data)
//
// REAL DATA SOURCES (to implement):
// 1. Zillow Foreclosure Filter: https://www.zillow.com/homes/for_sale/foreclosures/
// 2. CT Judicial System: https://sso.eservices.jud.ct.gov/foreclosures/
// 3. Redfin Bank-Owned: https://www.redfin.com/homes/for_sale/foreclosures/
//
// In production, replace this mock data with actual API calls to these sources
function getMockForeclosureData() {
  return [
    {
      address: '123 Main Street',
      town: 'Cheshire',
      listPrice: '$245,000',
      marketValue: '$290,000',
      propertyType: 'Single Family',
      link: 'https://www.zillow.com/example1',
      daysOnMarket: 45,
    },
    {
      address: '456 Oak Avenue',
      town: 'Madison',
      listPrice: '$185,000',
      marketValue: '$220,000',
      propertyType: 'Single Family',
      link: 'https://www.zillow.com/example2',
      daysOnMarket: 60,
    },
    {
      address: '789 Elm Court',
      town: 'Guilford',
      listPrice: '$215,000',
      marketValue: '$255,000',
      propertyType: 'Condo',
      link: 'https://www.zillow.com/example3',
      daysOnMarket: 35,
    },
    {
      address: '321 Pine Road',
      town: 'Orange',
      listPrice: '$275,000',
      marketValue: '$325,000',
      propertyType: 'Single Family',
      link: 'https://www.zillow.com/example4',
      daysOnMarket: 50,
    },
    {
      address: '654 Maple Lane',
      town: 'Cheshire',
      listPrice: '$195,000',
      marketValue: '$235,000',
      propertyType: 'Single Family',
      link: 'https://www.zillow.com/example5',
      daysOnMarket: 72,
    },
  ];
}

async function fetchForeclosureList(town) {
  try {
    logger.info(`Fetching foreclosure data for ${town}...`);

    // Get mock data (replace with actual API call in production)
    const allData = getMockForeclosureData();

    // Filter by town
    const townProperties = allData.filter(prop => prop.town === town);

    const properties = townProperties.map(prop => ({
      source: 'zillow_foreclosure',
      town: prop.town,
      address: prop.address,
      addressKey: createAddressKey(prop.address, prop.town),
      listPrice: prop.listPrice,
      marketValue: prop.marketValue,
      propertyType: prop.propertyType,
      link: prop.link,
      daysOnMarket: prop.daysOnMarket,
      daysToCash: 90,
      scrapedAt: new Date().toISOString(),
    }));

    if (properties.length === 0) {
      logger.info(`   ⚠️  No judicial foreclosures found in ${town}`);
    } else {
      logger.info(`   ✓ Found ${properties.length} foreclosure(s) in ${town}`);
    }
    return properties;
  } catch (error) {
    logger.error(`Failed to fetch foreclosures for ${town}`, { error: error.message });
    return [];
  }
}

async function scrapeAllTowns() {
  logger.info('Starting foreclosure data fetch (Zillow fallback)...');

  const allProperties = [];

  for (const town of TOWNS) {
    const properties = await fetchForeclosureList(town);
    allProperties.push(...properties);

    await new Promise(resolve => setTimeout(resolve, REQUEST_CONFIG.requestDelay));
  }

  logger.info(`Foreclosure fetch complete. Total properties found: ${allProperties.length}`);
  return allProperties;
}

export { scrapeAllTowns, fetchForeclosureList };
