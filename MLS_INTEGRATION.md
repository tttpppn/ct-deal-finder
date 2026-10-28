# MLS Integration Guide

## Current Status
The scraper currently uses **mock data with active/inactive filtering** to demonstrate how real MLS status checking works. All listings are filtered to show only `status: 'active'`.

## How Active Listing Status is Checked

### Current Implementation (Mock Data)
```javascript
// In each scraper (judicial.js, bankReo.js, mls.js)
const filtered = allData.filter(prop => 
  prop.status === 'active'  // Only include active listings
);
```

### Real MLS Implementation
When you integrate with a real MLS source, the `status` field comes directly from the API:

```javascript
// From MLS API response
{
  address: '123 Main Street',
  town: 'Cheshire',
  status: 'active',  // ← From MLS: active, pending_sale, sold, off_market, expired
  listPrice: 245000,
  marketValue: 290000,
  ...
}
```

## Real MLS Data Sources for Connecticut

### Option 1: Zillow API (Free, Recommended)
- **URL:** https://www.zillow.com/webservice/GetSearchResults.htm
- **Setup:** Free registration
- **Status field:** `zillow_status` or `listing_status`
- **Example Integration:**
```javascript
const ZILLOW_API_KEY = process.env.ZILLOW_API_KEY;
const url = `http://www.zillow.com/webservice/GetSearchResults.htm?zws-id=${ZILLOW_API_KEY}&address=${address}&citystatezip=${town},CT`;
```

### Option 2: Redfin Public API
- **URL:** https://www.redfin.com/api/
- **Setup:** No authentication required
- **Status field:** `status` (active, pending, sold, off_market)
- **Limitation:** Rate-limited for public access

### Option 3: CT MLS Board RETS Server
- **Contact:** Connecticut Statewide MLS or local board (GHAR, etc.)
- **Requires:** MLS membership/credentials
- **Standard:** RETS (Real Estate Transaction Standard)
- **Status values:** ListingStatus, ActivateDate, CloseDate

### Option 4: RapidAPI Real Estate Endpoints
- **URL:** https://rapidapi.com/apicagey/api/realty-in-us
- **Setup:** Free tier available, API key required
- **Status field:** Property status included

## Implementation Steps

### 1. Get API Credentials
Choose one MLS source above and register for API access.

### 2. Update `config.js`
```javascript
export const MLS_CONFIG = {
  API_SOURCE: 'zillow', // or 'redfin', 'rets', 'rapidapi'
  API_KEY: process.env.MLS_API_KEY,
  API_TIMEOUT: 5000,
};
```

### 3. Replace Mock Data with Real API
Update `judicial.js`:
```javascript
async function fetchFromMLSPublicSource(town) {
  // Call real MLS API
  const response = await axios.get(mlsUrl, {
    params: {
      location: `${town}, CT`,
      type: 'foreclosure', // or 'bank_reo', 'mls'
      apiKey: MLS_CONFIG.API_KEY,
    }
  });
  
  // Parse response - status comes from API
  return response.data.listings.map(prop => ({
    status: prop.status, // ← From MLS API
    address: prop.address,
    marketValue: prop.zpid?.zestimate || prop.marketValue,
    ...
  }));
}
```

### 4. Filter for Active Listings
```javascript
// This filtering stays the same
const activeListings = allListings.filter(prop => 
  prop.status === 'active'
);
```

## Current Filtering Behavior

**Mock Data Test:**
- Judicial: 5 total → 4 active ✓ (filters out inactive)
- Bank REO: 4 total → 2 active ✓ (filters out inactive)
- MLS: 4 total → 3 active ✓ (filters out inactive)

**Expected with Real MLS:**
- Only properties with `status: 'active'` are included in results
- Properties that are `pending`, `sold`, `off_market`, or `expired` are excluded
- Dashboard always shows current, available listings

## Status Values by Source

### Zillow
- Active
- Pending
- Sold
- Off Market

### Redfin
- Active
- Pending
- Sold
- Off Market
- Expired

### MLS (RETS Standard)
- Active
- Pending
- Sold
- Expired
- Withdrawn

## Testing Your Integration

After implementing real MLS integration:

```bash
# Run scraper and verify status filtering
node index.js

# Check CSV has status column with only "active" values
grep -o '"active"' listings_10pct_below_market-*.csv | wc -l
```

## Next Steps
1. Choose an MLS API source above
2. Register for API access
3. Update `scrapers/judicial.js`, `bankReo.js`, `mls.js` with real API calls
4. Test filtering: should exclude all inactive listings
