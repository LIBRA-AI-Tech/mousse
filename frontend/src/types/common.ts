export interface CountryType {
  code: string;
  label: string;
  suggested?: boolean;
}

export type PhaseOptionType = {
  kind: 'Season' | 'Month',
  value: string,
  label: string,
};
