import { scrapeAllTowns } from './scrapers/judicial.js';
import { scrapeWithFallback } from './scrapers/bankReo.js';
import { getRentalComps } from './scrapers/rentalComps.js';
import { consolidateProperties } from './utils/dedupe.js';
import { calculateDealMetrics, rankDeals } from './analysis/investmentScore.js';
import { exportToCSV } from './utils/csvExporter.js';
import { logger } from './utils/logger.js';

async function main() {
  try {
    logger.info('═'.repeat(60));
    logger.info('CT REAL ESTATE DEAL FINDER - PHASE 1-4');
    logger.info('═'.repeat(60));

    // Phase 1: Scrape foreclosures
    logger.info('\n📋 Step 1: Scraping foreclosure listings...');
    const judicialProperties = await scrapeAllTowns();
    logger.info(`✓ Scraped ${judicialProperties.length} foreclosure listings`);

    // Phase 1: Scrape Bank REO
    logger.info('\n🏦 Step 2: Scraping Bank REO listings...');
    const bankProperties = await scrapeWithFallback();
    logger.info(`✓ Scraped ${bankProperties.length} bank REO listings`);

    // Phase 1: Consolidate
    logger.info('\n🔄 Step 3: Consolidating and deduplicating...');
    const consolidatedProperties = consolidateProperties(judicialProperties, bankProperties);
    logger.info(`✓ Consolidated to ${consolidatedProperties.length} unique properties`);

    // Phase 3b: Get real rental comps
    logger.info('\n🏘️ Step 3b: Fetching real rental comps...');
    const rentalComps = await getRentalComps();
    logger.info(`✓ Got rental data for ${Object.keys(rentalComps).length} towns`);

    // Phase 4: Calculate investment metrics
    logger.info('\n💰 Step 4: Analyzing investment metrics (with real rental data)...');
    const analyzedProperties = calculateDealMetrics(consolidatedProperties, rentalComps);
    logger.info(`✓ Calculated ARV, cap rates, cash-on-cash returns`);

    // Phase 5: Filter and rank deals
    logger.info('\n⭐ Step 5: Filtering and ranking deals...');
    const rankedDeals = rankDeals(analyzedProperties);
    logger.info(`✓ Found ${rankedDeals.length} deals with >15% discount`);

    // Export to CSV with timestamp
    logger.info('\n📊 Step 6: Exporting to spreadsheet...');
    const timestamp = new Date().toISOString().split('T')[0];
    const csvFilename = `below_market_deals-${timestamp}.csv`;
    exportToCSV(rankedDeals, csvFilename);

    // Summary
    logger.info('\n' + '═'.repeat(60));
    logger.info('SUMMARY');
    logger.info('═'.repeat(60));
    logger.info(`Judicial foreclosures found: ${judicialProperties.length}`);
    logger.info(`Bank REO listings found: ${bankProperties.length}`);
    logger.info(`Total unique properties: ${consolidatedProperties.length}`);
    logger.info(`Deals found (>15% discount): ${rankedDeals.length}`);

    if (rankedDeals.length > 0) {
      logger.info('\nTop 3 deals by score:');
      rankedDeals.slice(0, 3).forEach((deal, idx) => {
        logger.info(`  ${idx + 1}. ${deal.address}, ${deal.town} - Score: ${deal.dealScore}, Cap Rate: ${deal.capRate}%`);
      });
    }

    logger.info('═'.repeat(60));
    logger.info('✅ Pipeline complete! Check below_market_deals.csv');

    return rankedDeals;
  } catch (error) {
    logger.error('Fatal error in main', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

main().then(deals => {
  process.exit(0);
});
