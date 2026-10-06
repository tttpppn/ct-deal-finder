import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';

export function exportToCSV(properties, filename = 'below_market_deals.csv') {
  try {
    if (!properties || properties.length === 0) {
      logger.warn('No properties to export');
      return;
    }

    // CSV header
    const headers = [
      'Address',
      'Town',
      'Source',
      'List Price',
      'Assessed Value',
      'Market Value',
      'Discount %',
      'ARV',
      'Cap Rate %',
      'Cash-on-Cash %',
      'Days to Cash',
      'Market Demand',
      'Property Type',
      'Link',
      'Scraped Date',
    ];

    // Convert properties to CSV rows
    const rows = properties.map(prop => [
      prop.address || '',
      prop.town || '',
      (prop.sources || [prop.source]).join(';') || '',
      prop.listPrice || prop.openingBid || '',
      prop.assessedValue || '',
      prop.marketValue || '',
      prop.discountPercent || '',
      prop.arv || '',
      prop.capRate || '',
      prop.cashOnCash || '',
      prop.daysToCash || '',
      prop.marketDemand || '',
      prop.propertyType || '',
      prop.link || '',
      prop.scrapedAt || new Date().toISOString(),
    ]);

    // Escape CSV fields (handle quotes and commas)
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(',')),
    ].join('\n');

    // Write to file
    fs.writeFileSync(filename, csvContent, 'utf8');
    logger.info(`✓ Exported ${properties.length} properties to ${filename}`);

    return filename;
  } catch (error) {
    logger.error('Failed to export CSV', { error: error.message });
    throw error;
  }
}

function escapeCSV(field) {
  if (field === null || field === undefined) return '';

  const str = String(field);

  // If field contains comma, newline, or quote, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}
