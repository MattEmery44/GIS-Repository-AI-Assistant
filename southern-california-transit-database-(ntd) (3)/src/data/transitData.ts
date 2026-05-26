/**
 * Southern California Transit Database (NTD)
 * Realistic historical monthly statistics (UPT, VRM, VRH)
 * Years: 2023, 2024, 2025, and 2026 (up to April)
 */

export interface TransitRecord {
  agencyId: string;
  agencyName: string;
  year: number;
  month: number; // 1 to 12
  monthLabel: string; // e.g. "2023-01"
  monthName: string; // e.g. "January"
  upt: number; // Unlinked Passenger Trips (Total Ridership)
  vrm: number; // Vehicle Revenue Miles
  vrh: number; // Vehicle Revenue Hours
}

export interface AgencyMetadata {
  id: string;
  name: string;
  primaryMode: string;
  serviceArea: string;
  shortName: string;
}

export const SO_CAL_AGENCIES: AgencyMetadata[] = [
  { id: "la-metro", name: "LA Metro", shortName: "LA Metro", primaryMode: "Bus & Rail", serviceArea: "Los Angeles County" },
  { id: "metrolink", name: "Metrolink", shortName: "Metrolink", primaryMode: "Commuter Rail", serviceArea: "Southern California Region" },
  { id: "santa-monica", name: "Santa Monica (Big Blue Bus)", shortName: "Santa Monica", primaryMode: "Bus", serviceArea: "Santa Monica & Westside LA" },
  { id: "omnitrans", name: "Omnitrans", shortName: "Omnitrans", primaryMode: "Bus", serviceArea: "San Bernardino County" },
  { id: "riverside-transit", name: "Riverside Transit (RTA)", shortName: "Riverside Transit", primaryMode: "Bus", serviceArea: "Riverside County" },
  { id: "foothill-transit", name: "Foothill Transit", shortName: "Foothill Transit", primaryMode: "Bus", serviceArea: "San Gabriel Valley" },
  { id: "long-beach-transit", name: "Long Beach Transit (LBT)", shortName: "Long Beach Transit", primaryMode: "Bus & Water Taxi", serviceArea: "Long Beach & South Bay" },
  { id: "octa", name: "OCTA (Orange County Transportation Authority)", shortName: "OCTA", primaryMode: "Bus", serviceArea: "Orange County" },
  { id: "gold-coast-transit", name: "Gold Coast Transit", shortName: "Gold Coast Transit", primaryMode: "Bus", serviceArea: "Western Ventura County" },
  { id: "imperial-valley-transit", name: "Imperial Valley Transit (IVT)", shortName: "Imperial Valley Transit", primaryMode: "Bus", serviceArea: "Imperial County" },
  { id: "norwalk-transit", name: "Norwalk Transit", shortName: "Norwalk Transit", primaryMode: "Bus", serviceArea: "Norwalk & Southeast LA" },
  { id: "culver-city-bus", name: "Culver CityBus", shortName: "Culver CityBus", primaryMode: "Bus", serviceArea: "Culver City & Westside LA" },
  { id: "montebello-bus-lines", name: "Montebello Bus Lines", shortName: "Montebello Bus Lines", primaryMode: "Bus", serviceArea: "Montebello & East LA" },
  { id: "gardena-gtrans", name: "Gardena GTrans", shortName: "Gardena GTrans", primaryMode: "Bus", serviceArea: "Gardena & South LA" },
  { id: "ladot", name: "LADOT (Los Angeles Dept of Transportation)", shortName: "LADOT", primaryMode: "Bus (DASH/Commuter)", serviceArea: "Los Angeles City" },
  { id: "pasadena-transit", name: "Pasadena Transit", shortName: "Pasadena Transit", primaryMode: "Bus", serviceArea: "Pasadena" },
  { id: "beach-cities-transit", name: "Beach Cities Transit", shortName: "Beach Cities Transit", primaryMode: "Bus", serviceArea: "Redondo, Hermosa & Manhattan Beach" },
  { id: "san-diego-mts", name: "San Diego MTS", shortName: "San Diego MTS", primaryMode: "Bus & Light Rail", serviceArea: "San Diego County" }
];

const MONTHS: { name: string; key: string }[] = [
  { name: "January", key: "01" },
  { name: "February", key: "02" },
  { name: "March", key: "03" },
  { name: "April", key: "04" },
  { name: "May", key: "05" },
  { name: "June", key: "06" },
  { name: "July", key: "07" },
  { name: "August", key: "08" },
  { name: "September", key: "09" },
  { name: "October", key: "10" },
  { name: "November", key: "11" },
  { name: "December", key: "12" }
];

// Helper to generate deterministic pseudo-random numbers
function getDeterministicNoise(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Generates the base values for each agency
const AGENCY_BASES: Record<string, { upt: number; vrm: number; vrh: number }> = {
  "la-metro": { upt: 21500000, vrm: 6200000, vrh: 495000 },
  "metrolink": { upt: 380000, vrm: 390000, vrh: 11200 },
  "santa-monica": { upt: 920000, vrm: 310000, vrh: 29500 },
  "omnitrans": { upt: 640000, vrm: 460000, vrh: 36500 },
  "riverside-transit": { upt: 420000, vrm: 530000, vrh: 41000 },
  "foothill-transit": { upt: 710000, vrm: 560000, vrh: 48500 },
  "long-beach-transit": { upt: 1380000, vrm: 580000, vrh: 56500 },
  "octa": { upt: 2550000, vrm: 1450000, vrh: 104500 },
  "gold-coast-transit": { upt: 2350000 / 10, vrm: 152000, vrh: 13900 },
  "imperial-valley-transit": { upt: 41000, vrm: 72000, vrh: 4600 },
  "norwalk-transit": { upt: 56000, vrm: 41000, vrh: 4100 },
  "culver-city-bus": { upt: 235000, vrm: 102000, vrh: 10400 },
  "montebello-bus-lines": { upt: 275000, vrm: 121000, vrh: 11200 },
  "gardena-gtrans": { upt: 185000, vrm: 101000, vrh: 9500 },
  "ladot": { upt: 760000, vrm: 480000, vrh: 51000 },
  "pasadena-transit": { upt: 92000, vrm: 37000, vrh: 3900 },
  "beach-cities-transit": { upt: 26000, vrm: 13500, vrh: 1650 },
  "san-diego-mts": { upt: 5200000, vrm: 2100000, vrh: 161000 }
};

export function generateTransitDatabase(): TransitRecord[] {
  const records: TransitRecord[] = [];
  let seedIndex = 1;

  const years: number[] = [];
  for (let y = 2010; y <= 2026; y++) {
    years.push(y);
  }

  for (const agency of SO_CAL_AGENCIES) {
    const base = AGENCY_BASES[agency.id] || { upt: 100000, vrm: 50000, vrh: 5000 };

    for (const year of years) {
      // 2026 only goes up to April
      const maxMonth = year === 2026 ? 4 : 12;

      for (let m = 1; m <= maxMonth; m++) {
        const monthObj = MONTHS[m - 1];
        const monthLabel = `${year}-${monthObj.key}`;

        // Year growth modifier
        // 2023 as baseline (1.0). In 2013 we had historic peak ridership (1.25), followed by slight drop.
        // COVID hit hard in 2020 (0.54), slowly rebuilding in 2021-2022, then standard post-pandemic recovery 2024-2026.
        let yearModifier = 1.0;
        switch (year) {
          case 2010: yearModifier = 1.15; break;
          case 2011: yearModifier = 1.18; break;
          case 2012: yearModifier = 1.22; break;
          case 2013: yearModifier = 1.25; break;
          case 2014: yearModifier = 1.24; break;
          case 2015: yearModifier = 1.22; break;
          case 2016: yearModifier = 1.19; break;
          case 2017: yearModifier = 1.15; break;
          case 2018: yearModifier = 1.12; break;
          case 2019: yearModifier = 1.08; break;
          case 2020: yearModifier = 0.54; break;
          case 2021: yearModifier = 0.70; break;
          case 2022: yearModifier = 0.85; break;
          case 2023: yearModifier = 1.00; break;
          case 2024: yearModifier = 1.085; break;
          case 2025: yearModifier = 1.142; break;
          case 2026: yearModifier = 1.185; break;
          default: yearModifier = 1.00; break;
        }

        // Seasonal modifier:
        // Jan: -6%, Feb: -3%, Mar: +4%, Apr: +3%, May: +7%, Jun: -2%, Jul: -5% (schools out), Aug: -3%, Sep: +8% (school back), Oct: +9% (highest), Nov: -4%, Dec: -12% (holidays)
        let seasonalModifier = 1.0;
        switch (m) {
          case 1: seasonalModifier = 0.94; break;
          case 2: seasonalModifier = 0.97; break;
          case 3: seasonalModifier = 1.04; break;
          case 4: seasonalModifier = 1.03; break;
          case 5: seasonalModifier = 1.07; break;
          case 6: seasonalModifier = 0.98; break;
          case 7: seasonalModifier = 0.93; break;
          case 8: seasonalModifier = 0.97; break;
          case 9: seasonalModifier = 1.08; break;
          case 10: seasonalModifier = 1.09; break;
          case 11: seasonalModifier = 0.96; break;
          case 12: seasonalModifier = 0.86; break;
        }

        // Add small deterministic noise (to make actual data unique each month and realistic)
        const noiseText = getDeterministicNoise(seedIndex++);
        const noiseUPT = 0.97 + noiseText * 0.06; // +/- 3%
        const noiseVRM = 0.98 + getDeterministicNoise(seedIndex++) * 0.04; // +/- 2%
        const noiseVRH = 0.985 + getDeterministicNoise(seedIndex++) * 0.03; // +/- 1.5%

        const finalUPT = Math.round(base.upt * yearModifier * seasonalModifier * noiseUPT);
        const finalVRM = Math.round(base.vrm * (1.0 + (yearModifier - 1) * 0.2) * noiseVRM); // VRM doesn't grow as fast as ridership
        const finalVRH = Math.round(base.vrh * (1.0 + (yearModifier - 1) * 0.15) * noiseVRH); // VRH doesn't grow as fast as ridership

        records.push({
          agencyId: agency.id,
          agencyName: agency.name,
          year,
          month: m,
          monthLabel,
          monthName: monthObj.name,
          upt: finalUPT,
          vrm: finalVRM,
          vrh: finalVRH
        });
      }
    }
  }

  return records;
}

// Extract available months for selection
export function getAvailableMonths(records: TransitRecord[]): string[] {
  const months = new Set<string>();
  for (const r of records) {
    months.add(r.monthLabel);
  }
  return Array.from(months).sort();
}

// Calculate Month-over-Month (MoM) and Year-over-Year (YoY) for an agency
export interface MetricSummary {
  currentVal: number;
  prevMoVal: number;
  prevYearVal: number;
  momPercent: number | null;
  yoyPercent: number | null;
}

export function getMetricSummary(
  records: TransitRecord[],
  agencyId: string | "all",
  targetMonthLabel: string,
  metric: "upt" | "vrm" | "vrh"
): MetricSummary {
  // Parse target
  const year = parseInt(targetMonthLabel.substring(0, 4));
  const month = parseInt(targetMonthLabel.substring(5, 7));

  // Determine previous month
  let prevMoYear = year;
  let prevMoMonth = month - 1;
  if (prevMoMonth === 0) {
    prevMoMonth = 12;
    prevMoYear = year - 1;
  }
  const prevMonthLabel = `${prevMoYear}-${prevMoMonth < 10 ? '0' + prevMoMonth : prevMoMonth}`;

  // Determine previous year
  const prevYearYear = year - 1;
  const prevYearLabel = `${prevYearYear}-${month < 10 ? '0' + month : month}`;

  // Fetch all matching items
  const currentItems = records.filter(r => (agencyId === "all" || r.agencyId === agencyId) && r.monthLabel === targetMonthLabel);
  const prevMoItems = records.filter(r => (agencyId === "all" || r.agencyId === agencyId) && r.monthLabel === prevMonthLabel);
  const prevYearItems = records.filter(r => (agencyId === "all" || r.agencyId === agencyId) && r.monthLabel === prevYearLabel);

  const currentVal = currentItems.reduce((acc, curr) => acc + curr[metric], 0);
  const prevMoVal = prevMoItems.reduce((acc, curr) => acc + curr[metric], 0);
  const prevYearVal = prevYearItems.reduce((acc, curr) => acc + curr[metric], 0);

  const momPercent = prevMoVal > 0 ? ((currentVal - prevMoVal) / prevMoVal) * 100 : null;
  const yoyPercent = prevYearVal > 0 ? ((currentVal - prevYearVal) / prevYearVal) * 100 : null;

  return {
    currentVal,
    prevMoVal,
    prevYearVal,
    momPercent,
    yoyPercent
  };
}
