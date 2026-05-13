/**
 * Skala Linguistik Fuzzy untuk opsi dropdown risiko halal.
 * Setiap opsi memiliki TFN (l, m, u) dan nilai defuzzifikasi.
 * Defuzzifikasi: D = (l + m + u) / 3
 */

export type TFN = [number, number, number];

export interface DropdownOption {
  value: string;
  label: string;
  tfn: TFN;
  risk: number; // defuzzified
}

export interface CriteriaDropdown {
  key: string;
  criteriaCode: string;
  label: string;
  options: DropdownOption[];
}

export interface CPDropdownGroup {
  cpId: string;
  cpLabel: string;
  criteria: CriteriaDropdown[];
}

// Skala linguistik umum (dipakai sebagai fallback)
export const RISK_SCALE: DropdownOption[] = [
  { value: "sangat_patuh",   label: "Sangat Patuh / Sempurna",       tfn: [0, 0.05, 0.15],  risk: 0.07 },
  { value: "patuh",          label: "Patuh / Baik",                  tfn: [0.10, 0.25, 0.35], risk: 0.23 },
  { value: "cukup",          label: "Cukup / Sebagian Patuh",        tfn: [0.30, 0.45, 0.55], risk: 0.43 },
  { value: "tidak_patuh",    label: "Tidak Patuh / Buruk",           tfn: [0.50, 0.65, 0.80], risk: 0.65 },
  { value: "sangat_buruk",   label: "Sangat Tidak Patuh / Kritis",   tfn: [0.75, 0.90, 1.00], risk: 0.88 },
];
