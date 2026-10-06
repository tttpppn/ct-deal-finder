import { DEAL_CONFIG } from '../config.js';
import { logger } from '../utils/logger.js';

export function calculateDealMetrics(properties) {
  return properties.map(prop => {
    const marketValue = parsePrice(prop.marketValue);
    const listPrice = parsePrice(prop.listPrice);
    const assessedValue = parsePrice(prop.assessedValue) || marketValue;

    // Calculate discount %
    const discountPercent = marketValue > 0
      ? ((marketValue - listPrice) / marketValue * 100).toFixed(2)
      : 0;

    // ARV (After-Repair Value) = market value
    const arv = marketValue;

    // Renovation cost estimate (12% of property value)
    const renovationCost = assessedValue * DEAL_CONFIG.renovationCostPercent;

    // Estimated monthly rental income (0.6% rule: monthly rent = 0.6% of property value)
    const monthlyRent = marketValue * DEAL_CONFIG.monthlyRentRule;
    const annualRent = monthlyRent * 12;

    // Cap rate = (annual rent / purchase price) * 100
    const capRate = listPrice > 0
      ? ((annualRent / listPrice) * 100).toFixed(2)
      : 0;

    // Cash-on-cash return (assume 20% down)
    const downPayment = listPrice * DEAL_CONFIG.downPaymentPercent;
    const annualCashFlow = annualRent - (listPrice * 0.05); // Rough estimate: 5% annual expenses
    const cashOnCash = downPayment > 0
      ? ((annualCashFlow / downPayment) * 100).toFixed(2)
      : 0;

    // Deal score (weighted: cap rate 50%, discount % 30%, cash-on-cash 20%)
    const dealScore = (
      (parseFloat(capRate) * 0.5) +
      (parseFloat(discountPercent) * 0.3) +
      (parseFloat(cashOnCash) * 0.2)
    ).toFixed(2);

    // Determine if it's a deal (>15% discount)
    const isDeal = parseFloat(discountPercent) >= DEAL_CONFIG.discountThreshold * 100;

    return {
      ...prop,
      marketValue: marketValue,
      listPrice: listPrice,
      assessedValue: assessedValue,
      discountPercent: discountPercent,
      arv: arv,
      renovationCost: renovationCost.toFixed(0),
      monthlyRent: monthlyRent.toFixed(0),
      annualRent: annualRent.toFixed(0),
      capRate: capRate,
      downPayment: downPayment.toFixed(0),
      cashOnCash: cashOnCash,
      dealScore: dealScore,
      isDeal: isDeal,
    };
  });
}

export function rankDeals(properties) {
  const deals = properties.filter(p => p.isDeal);
  return deals.sort((a, b) => parseFloat(b.dealScore) - parseFloat(a.dealScore));
}

function parsePrice(priceStr) {
  if (!priceStr) return 0;
  const cleaned = String(priceStr).replace(/[\$,\s]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}
