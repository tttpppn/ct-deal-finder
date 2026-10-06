export function normalizeAddress(address) {
  if (!address || typeof address !== 'string') return '';

  return address
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
    // Standardize street abbreviations
    .replace(/\bST\b/g, 'STREET')
    .replace(/\bRD\b/g, 'ROAD')
    .replace(/\bAVE\b/g, 'AVENUE')
    .replace(/\bBLVD\b/g, 'BOULEVARD')
    .replace(/\bLN\b/g, 'LANE')
    .replace(/\bCT\b/g, 'COURT')
    .replace(/\bDR\b/g, 'DRIVE')
    .replace(/\bPL\b/g, 'PLACE')
    .replace(/\bPKWY\b/g, 'PARKWAY')
    .replace(/\bCIR\b/g, 'CIRCLE')
    .replace(/\bWAY\b/g, 'WAY')
    .replace(/\bTER\b/g, 'TERRACE')
    .replace(/\bN\s/g, 'NORTH ')
    .replace(/\bS\s/g, 'SOUTH ')
    .replace(/\bE\s/g, 'EAST ')
    .replace(/\bW\s/g, 'WEST ')
    // Remove punctuation
    .replace(/[#.,]/g, '')
    // Handle suite/apartment variations
    .replace(/\bAPT\b/g, 'APARTMENT')
    .replace(/\bSTE\b/g, 'SUITE')
    .replace(/\bFL\b/g, 'FLOOR');
}

export function createAddressKey(street, town, state = 'CT') {
  const normalizedStreet = normalizeAddress(street);
  const normalizedTown = (town || '').trim().toUpperCase();
  const normalizedState = (state || 'CT').trim().toUpperCase();

  return `${normalizedStreet}|${normalizedTown}|${normalizedState}`;
}

export function compareAddresses(addr1, addr2) {
  return normalizeAddress(addr1) === normalizeAddress(addr2);
}
