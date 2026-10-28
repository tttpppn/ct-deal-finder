import axios from 'axios';
import { REQUEST_CONFIG, TOWNS } from '../config.js';
import { logger } from '../utils/logger.js';
import { createAddressKey } from '../utils/addressNormalize.js';

// Fetch real MLS listings from Redfin API
async function fetchRealMLSListings(town) {
  try {
    const url = `https://www.redfin.com/api/gis`;
    const params = {
      al: 'CT',
      q: town,
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
      return response.data.payload.homes
        .filter(h => h.statusText === 'For Sale')
        .map(home => ({
          address: home.streetAddress || '',
          town: town,
          listPrice: `$${home.price || 0}`,
          marketValue: `$${home.listPrice || home.price || 0}`,
          propertyType: home.propertyType || 'Single Family',
          link: `https://www.redfin.com${home.url}` || '',
          daysOnMarket: home.daysOnZillow || 0,
          status: 'active',
        }));
    }
  } catch (error) {
    logger.debug(`MLS fetch failed for ${town}: ${error.message}`);
  }
  return [];
}

async function fetchMLSListings() {
  try {
    logger.info('Fetching MLS listings across all towns...');
    const allProperties = [];

    for (const town of TOWNS) {
      const townListings = await fetchRealMLSListings(town);

      const properties = townListings.map(prop => ({
        source: 'mls_listing',
        address: prop.address,
        town: prop.town,
        addressKey: createAddressKey(prop.address, prop.town),
        listPrice: prop.listPrice,
        marketValue: prop.marketValue,
        propertyType: prop.propertyType,
        daysOnMarket: prop.daysOnMarket,
        link: prop.link,
        daysToCash: 30, // MLS typically quick closing
        status: prop.status,
        scrapedAt: new Date().toISOString(),
      }));

      allProperties.push(...properties);
      await new Promise(resolve => setTimeout(resolve, REQUEST_CONFIG.requestDelay));
    }

    logger.info(`   ✓ Found ${allProperties.length} MLS listing(s)`);
    return allProperties;
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
