import axios from 'axios';
import { REQUEST_CONFIG } from '../config.js';
import { logger } from '../utils/logger.js';
import { createAddressKey } from '../utils/addressNormalize.js';

// Mock MLS data (simulating real MLS listings)
// In production, this would call actual MLS API or aggregator
function getMockMLSData() {
  return [
    {
      mls_id: 'MLS001',
      address: '150 Oak Street',
      town: 'New Haven',
      listPrice: '$180,000',
      marketValue: '$205,000',
      propertyType: 'Single Family',
      yearBuilt: 1985,
      beds: 3,
      baths: 1.5,
      sqft: 1200,
      daysOnMarket: 45,
      link: 'https://www.zillow.com/mls-001',
    },
    {
      mls_id: 'MLS002',
      address: '250 Elm Avenue',
      town: 'Wallingford',
      listPrice: '$225,000',
      marketValue: '$260,000',
      propertyType: 'Single Family',
      yearBuilt: 1995,
      beds: 4,
      baths: 2,
      sqft: 1800,
      daysOnMarket: 60,
      link: 'https://www.zillow.com/mls-002',
    },
    {
      mls_id: 'MLS003',
      address: '350 Maple Drive',
      town: 'Durham',
      listPrice: '$165,000',
      marketValue: '$195,000',
      propertyType: 'Condo',
      yearBuilt: 2000,
      beds: 2,
      baths: 2,
      sqft: 950,
      daysOnMarket: 75,
      link: 'https://www.zillow.com/mls-003',
    },
    {
      mls_id: 'MLS004',
      address: '450 Pine Road',
      town: 'Berlin',
      listPrice: '$210,000',
      marketValue: '$250,000',
      propertyType: 'Single Family',
      yearBuilt: 1980,
      beds: 3,
      baths: 2,
      sqft: 1400,
      daysOnMarket: 90,
      link: 'https://www.zillow.com/mls-004',
    },
  ];
}

async function fetchMLSListings() {
  try {
    logger.info('Fetching MLS listings...');

    // Simulate API fetch (in production, use real MLS API like ShowingTime, CoreLogic, etc.)
    const allData = getMockMLSData();

    const properties = allData.map(prop => ({
      source: 'mls_listing',
      mls_id: prop.mls_id,
      address: prop.address,
      town: prop.town,
      addressKey: createAddressKey(prop.address, prop.town),
      listPrice: prop.listPrice,
      marketValue: prop.marketValue,
      propertyType: prop.propertyType,
      yearBuilt: prop.yearBuilt,
      beds: prop.beds,
      baths: prop.baths,
      sqft: prop.sqft,
      daysOnMarket: prop.daysOnMarket,
      link: prop.link,
      daysToCash: 30, // MLS typically quick closing
      scrapedAt: new Date().toISOString(),
    }));

    logger.info(`   ✓ Found ${properties.length} MLS listing(s)`);
    return properties;
  } catch (error) {
    logger.warn('Failed to fetch MLS listings', { error: error.message });
    return [];
  }
}

export async function scrapeMLSListings() {
  logger.info('Starting MLS scrape...');
  const properties = await fetchMLSListings();
  await new Promise(resolve => setTimeout(resolve, REQUEST_CONFIG.requestDelay));
  return properties;
}
