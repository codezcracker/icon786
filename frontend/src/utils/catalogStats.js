import { PERMISSIVE_STATS } from './permissiveLicenses';

/** Catalog size stats (internal / optional UI use) */
export const CATALOG = {
  totalIcons: PERMISSIVE_STATS.totalIcons,
  setCount: PERMISSIVE_STATS.setCount,
  totalLabel: `${PERMISSIVE_STATS.totalIcons.toLocaleString()}+`,
  setsLabel: `${PERMISSIVE_STATS.setCount}+`,
};
