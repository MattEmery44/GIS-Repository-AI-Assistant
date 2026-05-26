export interface TransitRecord {
  agencyId: string;
  agencyName: string;
  year: number;
  month: number;
  monthLabel: string; // e.g. "2023-01"
  monthName: string; // e.g. "January"
  upt: number; // Ridership
  vrm: number; // Mileage
  vrh: number; // Hours
}

export interface AgencyMetadata {
  id: string;
  name: string;
  shortName: string;
  primaryMode: string;
  serviceArea: string;
}

export type TransitMetric = 'upt' | 'vrm' | 'vrh';

export type GeographyLevel = 'county' | 'city' | 'neighborhood';

export interface CensusProfile {
  id: string;
  name: string;
  level: GeographyLevel;
  parent: string; // e.g. "Los Angeles County" or "City of LA"
  population: number;
  medianIncome: number;
  povertyRate: number; // percentage, e.g. 14.5
  transitCommuteRate: number; // percentage, e.g. 8.2
  vehiclesPerHousehold: number; // average e.g. 1.2
  minorityRate: number; // percentage, e.g. 74.2
  medianAge: number; // e.g. 35.6
  description: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  systemNotice?: boolean;
}

export interface MetricSummary {
  currentVal: number;
  prevMoVal: number;
  prevYearVal: number;
  momPercent: number | null;
  yoyPercent: number | null;
}
