import { logger } from './logger.js';

export function deduplicateProperties(properties) {
  const seen = new Map();
  const duplicates = [];

  for (const prop of properties) {
    const key = prop.addressKey || prop.address;

    if (seen.has(key)) {
      const existing = seen.get(key);
      duplicates.push({
        address: prop.address,
        sources: [existing.source, prop.source],
      });

      // Merge sources if not already tracking both
      if (existing.sources) {
        if (!existing.sources.includes(prop.source)) {
          existing.sources.push(prop.source);
        }
      } else {
        existing.sources = [existing.source, prop.source];
      }
    } else {
      // Mark first source
      prop.sources = [prop.source];
      seen.set(key, prop);
    }
  }

  if (duplicates.length > 0) {
    logger.info(`Found ${duplicates.length} duplicate addresses across sources`, {
      examples: duplicates.slice(0, 3),
    });
  }

  return Array.from(seen.values());
}

export function consolidateProperties(judicialProps, bankProps, mlsProps = []) {
  logger.info(`Consolidating ${judicialProps.length} judicial + ${bankProps.length} bank REO + ${mlsProps.length} MLS properties...`);

  const allProperties = [...judicialProps, ...bankProps, ...mlsProps];
  const deduped = deduplicateProperties(allProperties);

  logger.info(`Consolidated to ${deduped.length} unique properties after deduplication`);
  return deduped;
}
