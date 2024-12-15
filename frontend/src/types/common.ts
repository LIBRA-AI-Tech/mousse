import { Dayjs } from "dayjs";

export interface CountryType {
  code: string;
  label: string;
  suggested?: boolean;
}

export type PhaseOptionType = {
  kind: 'Season' | 'Month',
  value: '01'|'02'|'03'|'04'|'05'|'06'|'07'|'08'|'09'|'10'|'11'|'12'|'winter'|'spring'|'summer'|'autumn',
  label: string,
};

export type FilterValuesType = {
  country: CountryType[],
  startDate: Dayjs|null,
  endDate: Dayjs|null,
  phase: PhaseOptionType[],
};
