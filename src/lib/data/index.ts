export { RISK_SCALE } from "./dropdown-scale";
export type { TFN, DropdownOption, CriteriaDropdown, CPDropdownGroup } from "./dropdown-scale";

import { CP1_OPTIONS, CP2_OPTIONS, CP3_OPTIONS, CP4_OPTIONS, CP5_OPTIONS } from "./cp-options-1-5";
import { CP6_OPTIONS, CP7_OPTIONS, CP8_OPTIONS, CP9_OPTIONS, CP10_OPTIONS } from "./cp-options-6-10";

export {
  CP1_OPTIONS, CP2_OPTIONS, CP3_OPTIONS, CP4_OPTIONS, CP5_OPTIONS,
  CP6_OPTIONS, CP7_OPTIONS, CP8_OPTIONS, CP9_OPTIONS, CP10_OPTIONS,
};

export const ALL_CP_OPTIONS = [
  CP1_OPTIONS, CP2_OPTIONS, CP3_OPTIONS, CP4_OPTIONS, CP5_OPTIONS,
  CP6_OPTIONS, CP7_OPTIONS, CP8_OPTIONS, CP9_OPTIONS, CP10_OPTIONS,
];

/** Lookup: cpId → CPDropdownGroup */
export const CP_OPTIONS_MAP: Record<string, typeof CP1_OPTIONS> = {
  CP1: CP1_OPTIONS, CP2: CP2_OPTIONS, CP3: CP3_OPTIONS, CP4: CP4_OPTIONS, CP5: CP5_OPTIONS,
  CP6: CP6_OPTIONS, CP7: CP7_OPTIONS, CP8: CP8_OPTIONS, CP9: CP9_OPTIONS, CP10: CP10_OPTIONS,
};

/**
 * Mengambil risk value dari opsi dropdown yang dipilih.
 * @param cpId - e.g. "CP1"
 * @param fieldKey - e.g. "asalUsulRisk"
 * @param optionValue - e.g. "f1_2"
 * @returns risk value (0-1) atau 0 jika tidak ditemukan
 */
export function getRiskFromOption(cpId: string, fieldKey: string, optionValue: string): number {
  const cp = CP_OPTIONS_MAP[cpId];
  if (!cp) return 0;
  const criteria = cp.criteria.find((c) => c.key === fieldKey);
  if (!criteria) return 0;
  const option = criteria.options.find((o) => o.value === optionValue);
  return option?.risk ?? 0;
}
