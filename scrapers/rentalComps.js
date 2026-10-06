import axios from 'axios';
import * as cheerio from 'cheerio';
import { TOWNS, REQUEST_CONFIG } from '../config.js';
import { logger } from '../utils/logger.js';

async function scrapeApartmentsComRentals(town) {
  try {
    logger.info(`  Fetching Apartments.com rentals for ${town}...`);
    const url = `https://www.apartments.com/${town.toLowerCase()}-ct/apartments/`;
    const response = await axios.get(url, {
      timeout: REQUEST_CONFIG.timeout,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const $ = cheerio.load(response.data);
    const rents = [];
    $('.placard-price').each((index, el) => {
      const priceText = $(el).text().trim();
      const price = parseInt(priceText.replace(/\D/g, ''), 10);
      if (!isNaN(price) && price > 0) rents.push(price);
    });
    if (rents.length > 0) logger.info(`    Found ${rents.length} listings on Apartments.com`);
    return rents;
  } catch (error) {
    logger.warn(`Failed to scrape Apartments.com for ${town}`, { error: error.message });
    return [];
  }
}

async function scrapeCligslistRentals(town) {
  try {
    logger.info(`  Fetching Craigslist rentals for ${town}...`);
    const url = `https://newhaven.craigslist.org/search/apt?query=${town}&max_price=3000`;
    const response = await axios.get(url, {
      timeout: REQUEST_CONFIG.timeout,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const $ = cheerio.load(response.data);
    const rents = [];
    $('.result-price').each((index, el) => {
      const priceText = $(el).text().trim();
      const price = parseInt(priceText.replace(/\D/g, ''), 10);
      if (!isNaN(price) && price > 0 && price < 5000) rents.push(price);
    });
    if (rents.length > 0) logger.info(`    Found ${rents.length} listings on Craigslist`);
    return rents;
  } catch (error) {
    logger.warn(`Failed to scrape Craigslist for ${town}`, { error: error.message });
    return [];
  }
}

function calculateAverageRent(rents) {
  if (rents.length === 0) return 0;
  const sum = rents.reduce((a, b) => a + b, 0);
  return Math.round(sum / rents.length);
}

async function getRentalComps() {
  const rentalData = {};
  logger.info('\n🏘️ Scraping rental comps (Apartments.com + Craigslist)...');

  for (const town of TOWNS) {
    const apartmentsRents = await scrapeApartmentsComRentals(town);
    await new Promise(resolve => setTimeout(resolve, REQUEST_CONFIG.requestDelay));
    const craigslistRents = await scrapeCligslistRentals(town);
    await new Promise(resolve => setTimeout(resolve, REQUEST_CONFIG.requestDelay));

    const allRents = [...apartmentsRents, ...craigslistRents];
    const avgRent = calculateAverageRent(allRents);

    rentalData[town] = {
      averageMonthlyRent: avgRent,
      totalListings: allRents.length,
      apartmentsComListings: apartmentsRents.length,
      craigslistListings: craigslistRents.length,
      minRent: allRents.length > 0 ? Math.min(...allRents) : 0,
      maxRent: allRents.length > 0 ? Math.max(...allRents) : 0,
    };

    if (avgRent > 0) {
      logger.info(`   ✓ ${town}: Avg $${avgRent}/mo (${allRents.length} listings)`);
    } else {
      logger.info(`   ⚠️  ${town}: No rental data found`);
    }
  }

  return rentalData;
}

export { getRentalComps, calculateAverageRent };
