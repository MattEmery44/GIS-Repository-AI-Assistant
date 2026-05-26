import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { TransitRecord, TransitMetric } from '../types';
import { Eye, BarChart3, LineChart as LineIcon, Layers } from 'lucide-react';

interface TrendChartsProps {
  records: TransitRecord[];
  selectedAgencyId: string;
  selectedMonth: string;
  agencies: { id: string; name: string; shortName: string }[];
}

export default function TrendCharts({
  records,
  selectedAgencyId,
  selectedMonth,
  agencies
}: TrendChartsProps) {
  const [activeMetric, setActiveMetric] = useState<TransitMetric>('upt');
  const [viewType, setViewType] = useState<'line' | 'area'>('area');

  const agencyName = useMemo(() => {
    if (selectedAgencyId === 'all') return 'All SoCal Combined';
    return agencies.find(a => a.id === selectedAgencyId)?.shortName || selectedAgencyId;
  }, [selectedAgencyId, agencies]);

  // Metric info helpers
  const metricInfo = {
    upt: { label: 'Unlinked Passenger Trips (UPT)', color: '#38bdf8', shortLabel: 'UPT Ridership', uom: 'Trips' },
    vrm: { label: 'Vehicle Revenue Miles (VRM)', color: '#34d399', shortLabel: 'Revenue Miles', uom: 'Miles' },
    vrh: { label: 'Vehicle Revenue Hours (VRH)', color: '#fbbf24', shortLabel: 'Revenue Hours', uom: 'Hours' }
  };

  // 1. Data for temporal trend analysis (historically from Jan 2023 to April 2026)
  const temporalData = useMemo(() => {
    // Filter by selected agency (or sum up all agencies for each month if 'all' is picked)
    const monthMap: Record<string, { monthLabel: string; upt: number; vrm: number; vrh: number }> = {};

    records.forEach(r => {
      if (selectedAgencyId !== 'all' && r.agencyId !== selectedAgencyId) return;

      if (!monthMap[r.monthLabel]) {
        monthMap[r.monthLabel] = {
          monthLabel: r.monthLabel,
          upt: 0,
          vrm: 0,
          vrh: 0
        };
      }

      monthMap[r.monthLabel].upt += r.upt;
      monthMap[r.monthLabel].vrm += r.vrm;
      monthMap[r.monthLabel].vrh += r.vrh;
    });

    return Object.values(monthMap).sort((a, b) => a.monthLabel.localeCompare(b.monthLabel));
  }, [records, selectedAgencyId]);

  // 2. Data for comparative analysis (all 18 agencies compared for the chosen Month/Year)
  const comparativeData = useMemo(() => {
    // Filter records for the selected month, excluding transit agencies that aren't single items
    return records
      .filter(r => r.monthLabel === selectedMonth)
      .map(r => {
        const agencyMeta = agencies.find(a => a.id === r.agencyId);
        return {
          id: r.agencyId,
          name: agencyMeta?.shortName || r.agencyName,
          upt: r.upt,
          vrm: r.vrm,
          vrh: r.vrh
        };
      })
      .sort((a, b) => b[activeMetric] - a[activeMetric]); // Sort highest first for easy comparison
  }, [records, selectedMonth, agencies, activeMetric]);

  // Helper to format values on axis or tooltips
  const formatYAxisValue = (val: number): string => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
    return String(val);
  };

  const formatTooltipValue = (value: number) => {
    return [new Intl.NumberFormat('en-US').format(value), metricInfo[activeMetric].uom];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="charts-main-grid">
      
      {/* SECTION 1: HISTORICAL TREND ANALYSIS CHART */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between" id="trend-line-container">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-[10px] font-bold text-sky-600 font-display tracking-widest uppercase">
                TEMPORAL ANALYSIS
              </span>
              <h3 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2 mt-0.5">
                <LineIcon className="w-5 h-5 text-slate-500" />
                {metricInfo[activeMetric].shortLabel} Trend
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Historical monthly stats for <span className="text-slate-600 font-medium">{agencyName}</span> (Jan 2010 - Apr 2026)
              </p>
            </div>

            {/* View type handles Line / Area toggle */}
            <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-md self-start">
              <button
                onClick={() => setViewType('area')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold font-sans transition-all ${
                  viewType === 'area'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Area Chart
              </button>
              <button
                onClick={() => setViewType('line')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold font-sans transition-all ${
                  viewType === 'line'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Line Chart
              </button>
            </div>
          </div>

          <div className="h-[280px] w-full" id="history-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              {viewType === 'area' ? (
                <AreaChart data={temporalData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id={`colorGrad-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={metricInfo[activeMetric].color} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={metricInfo[activeMetric].color} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickFormatter={(v) => v.slice(2)} // Show YY-MM
                  />
                  <YAxis
                    tickFormatter={formatYAxisValue}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                    labelFormatter={(label) => `Period: ${label}`}
                    formatter={formatTooltipValue}
                  />
                  <Area
                    type="monotone"
                    dataKey={activeMetric}
                    stroke={metricInfo[activeMetric].color}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill={`url(#colorGrad-${activeMetric})`}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              ) : (
                <LineChart data={temporalData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                    tickFormatter={(v) => v.slice(2)}
                  />
                  <YAxis
                    tickFormatter={formatYAxisValue}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    formatter={formatTooltipValue}
                  />
                  <Line
                    type="monotone"
                    dataKey={activeMetric}
                    stroke={metricInfo[activeMetric].color}
                    strokeWidth={3}
                    dot={{ r: 3, strokeWidth: 1 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Floating Metric selectors */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 font-sans uppercase tracking-wider mr-2">Active Metric:</span>
          {(Object.keys(metricInfo) as TransitMetric[]).map((key) => (
            <button
              key={key}
              onClick={() => setActiveMetric(key)}
              style={{
                borderColor: activeMetric === key ? metricInfo[key].color : undefined,
                color: activeMetric === key ? '#1e293b' : undefined,
                backgroundColor: activeMetric === key ? `${metricInfo[key].color}0f` : undefined
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold border border-slate-200 bg-white transition-all hover:border-slate-300 ${
                activeMetric === key ? 'border-2 ring-1' : 'text-slate-500'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full inline-block mr-1.5" style={{ backgroundColor: metricInfo[key].color }}></span>
              {key.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 2: COMPARATIVE BAR CHART */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between" id="comparative-bar-container">
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[10px] font-bold text-emerald-600 font-display tracking-widest uppercase">
                REGIONAL BENCHMARKING
              </span>
              <h3 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2 mt-0.5">
                <BarChart3 className="w-5 h-5 text-slate-500" />
                Agency Comparison
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparing {metricInfo[activeMetric].shortLabel} across agencies for <span className="text-slate-600 font-bold font-mono">{selectedMonth}</span>
              </p>
            </div>
            
            <div className="bg-emerald-50 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 font-mono">
              Records: {comparativeData.length}
            </div>
          </div>

          <div className="h-[280px] w-full" id="bar-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparativeData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 8, fill: '#475569', fontWeight: 500 }}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                />
                <YAxis
                  tickFormatter={formatYAxisValue}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  formatter={formatTooltipValue}
                />
                <Bar
                  dataKey={activeMetric}
                  fill={metricInfo[activeMetric].color}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick explanatory footer */}
        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400 font-sans">
          <span>💡 Ordered highest to lowest performance metrics</span>
          <span className="font-medium text-slate-500">Selected Month: {selectedMonth}</span>
        </div>
      </div>

    </div>
  );
}
