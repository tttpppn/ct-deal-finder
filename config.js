export const TOWNS = ['Cheshire', 'Madison', 'Guilford', 'Orange'];

export const CT_JUDICIAL_BASE_URL = 'https://sso.eservices.jud.ct.gov/foreclosures/Public/PendPostbyTownList.aspx';

// Bank REO tiers for scraping priority
export const BANK_REO_TIERS = {
  tier1: [
    { name: 'Bank of America', url: 'https://www.bankofamerica.com/real-estate/' },
    { name: 'Wells Fargo', url: 'https://www.wellsfargo.com/real-estate/' },
    { name: 'Chase', url: 'https://www.chase.com/real-estate/' },
    { name: 'HSBC', url: 'https://www.hsbc.com/real-estate/' },
    { name: 'Berkshire Bank', url: 'https://www.berkshirebank.com/real-estate/' },
    { name: "People's Bank", url: 'https://www.peoples.com/real-estate/' },
  ],
  tier2: [
    { name: 'Citi', url: 'https://www.citibank.com/real-estate/' },
    { name: 'US Bank', url: 'https://www.usbank.com/real-estate/' },
    { name: 'KeyBank', url: 'https://www.keybank.com/real-estate/' },
    { name: 'PNC Bank', url: 'https://www.pncbank.com/real-estate/' },
    { name: 'M&T Bank', url: 'https://www.mtb.com/real-estate/' },
  ],
  tier3: [
    { name: 'Zillow', url: 'https://www.zillow.com/homes/for_sale/foreclosures/' },
    { name: 'Redfin', url: 'https://www.redfin.com/homes/for_sale/foreclosures/' },
  ],
};

// Deal configuration thresholds
export const DEAL_CONFIG = {
  discountThreshold: 0.15, // 15% below market = 0.85x multiplier
  renovationCostPercent: 0.12, // 12% of property value
  monthlyRentRule: 0.006, // 0.6% monthly rent rule-of-thumb
  downPaymentPercent: 0.20, // 20% down for cash-on-cash calc

  // Timeline expectations (days to cash)
  judicalForecastureTimeline: { min: 90, max: 180 },
  bankREOTimeline: { min: 30, max: 90 },
};

// Cache and logging
export const CACHE_DIR = './cache';
export const LOGS_DIR = './logs';

// Request settings (respectful scraping)
export const REQUEST_CONFIG = {
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second initial backoff
  requestDelay: 3000, // 3 second delay between requests to same domain
};
