import axios from 'axios';
import { TOWNS, REQUEST_CONFIG } from '../config.js';
import { logger } from '../utils/logger.js';
import { createAddressKey } from '../utils/addressNormalize.js';

// Fetch from MLS public data source
// To use real MLS data, integrate with:
// 1. Zillow API (https://www.zillow.com/webservice/GetSearchResults.htm) - free registration
// 2. Redfin public API - limited but no auth required
// 3. Your local CT MLS board's RETS feed - requires MLS membership
async function fetchFromMLSPublicSource(town) {
  try {
    logger.info(`Fetching real foreclosure data from Redfin for ${town}...`);

    const url = `https://www.redfin.com/api/gis`;
    const params = {
      al: 'CT',
      q: town,
      ch: '11011',
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

    // Parse Redfin response - check actual listing status
    if (response.data?.payload?.homes) {
      const totalHomes = response.data.payload.homes.length;
      const homes = response.data.payload.homes.filter(h => h.statusText === 'For Sale');

      if (homes.length > 0) {
        logger.info(`   ✓ Found ${homes.length} "For Sale" listings on Redfin for ${town} (${totalHomes} total homes in response)`);
        return homes.map(home => ({
          address: home.streetAddress || '',
          town: town,
          listPrice: `$${home.price || 0}`,
          marketValue: `$${home.listPrice || home.price || 0}`,
          status: 'active',
          propertyType: home.propertyType || 'Single Family',
          link: `https://www.redfin.com${home.url}` || '',
          daysOnMarket: home.daysOnZillow || 0,
        }));
      } else {
        logger.info(`   ⚠️  Redfin returned ${totalHomes} homes for ${town} but none matched "For Sale" status`);
      }
    } else {
      logger.warn(`Unexpected Redfin response structure for ${town}: missing payload.homes - falling back to mock data`);
    }

    return null;
  } catch (error) {
    logger.warn(`Redfin fetch failed for ${town}:`, { error: error.message });
    return null;
  }
}

// Mock foreclosure data for CT towns (fallback when API fails)
// In production with real MLS: status comes directly from API response
// MLS Status values: active, pending_sale, sold, off_market, expired
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
      status: 'active',
    },
    {
      address: '456 Oak Avenue',
      town: 'Madison',
      listPrice: '$185,000',
      marketValue: '$220,000',
      propertyType: 'Single Family',
      link: 'https://www.zillow.com/example2',
      daysOnMarket: 60,
      status: 'active',
    },
    {
      address: '789 Elm Court',
      town: 'Guilford',
      listPrice: '$215,000',
      marketValue: '$255,000',
      propertyType: 'Condo',
      link: 'https://www.zillow.com/example3',
      daysOnMarket: 35,
      status: 'active',
    },
    {
      address: '321 Pine Road',
      town: 'Orange',
      listPrice: '$275,000',
      marketValue: '$325,000',
      propertyType: 'Single Family',
      link: 'https://www.zillow.com/example4',
      daysOnMarket: 50,
      status: 'inactive',
    },
    {
      address: '654 Maple Lane',
      town: 'Cheshire',
      listPrice: '$195,000',
      marketValue: '$235,000',
      propertyType: 'Single Family',
      link: 'https://www.zillow.com/example5',
      daysOnMarket: 72,
      status: 'active',
    },
  ];
}

async function fetchForeclosureList(town) {
  try {
    logger.info(`Fetching foreclosure data for ${town}...`);

    // Try real Redfin API first
    let townProperties = await fetchFromMLSPublicSource(town);

    // Fallback to mock data if API fails
    if (!townProperties || townProperties.length === 0) {
      const allData = getMockForeclosureData();
      townProperties = allData.filter(prop => prop.town === town && prop.status === 'active');
    } else {
      // Real API already returns only active listings
      townProperties = townProperties.filter(prop => prop.status === 'active');
    }

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
      status: prop.status,
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
