import { PERMISSIVE_STATS } from './permissiveLicenses';

/** Marketing / UI copy for the commercial-safe catalog */
export const CATALOG = {
  totalIcons: PERMISSIVE_STATS.totalIcons,
  setCount: PERMISSIVE_STATS.setCount,
  totalLabel: `${PERMISSIVE_STATS.totalIcons.toLocaleString()}+`,
  setsLabel: `${PERMISSIVE_STATS.setCount}+`,
  shortTagline: `${PERMISSIVE_STATS.totalIcons.toLocaleString()}+ icons from ${PERMISSIVE_STATS.setCount} open-source sets`,
  licenseNote: 'MIT, Apache 2.0, ISC & CC0 — commercial use OK',
};
