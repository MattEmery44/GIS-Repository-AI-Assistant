import React from 'react';
import { Users, Gauge, Clock, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { TransitRecord, MetricSummary, TransitMetric } from '../types';
import { getMetricSummary } from '../data/transitData';

interface OverviewCardsProps {
  records: TransitRecord[];
  selectedAgencyId: string;
  selectedMonth: string;
}

export default function OverviewCards({
  records,
  selectedAgencyId,
  selectedMonth
}: OverviewCardsProps) {
  
  const metrics: { key: TransitMetric; title: string, subtitle: string, icon: React.ReactNode, uoms: string, badge: string, badgeStyle: string }[] = [
    {
      key: 'upt',
      title: 'Unlinked passenger Trips (UPT)',
      subtitle: 'Total passenger boardings/ridership across routes',
      icon: <Users className="w-5 h-5 text-green-600" id="upt-icon-svg" />,
      uoms: 'trips',
      badge: 'ACTIVE',
      badgeStyle: 'bg-green-100 text-green-700'
    },
    {
      key: 'vrm',
      title: 'Vehicle Revenue Miles (VRM)',
      subtitle: 'Miles traveled by vehicles in active service',
      icon: <Gauge className="w-5 h-5 text-blue-600" id="vrm-icon-svg" />,
      uoms: 'miles',
      badge: 'RELIABLE',
      badgeStyle: 'bg-blue-100 text-blue-700'
    },
    {
      key: 'vrh',
      title: 'Vehicle Revenue Hours (VRH)',
      subtitle: 'Hours spent operating passenger revenue service',
      icon: <Clock className="w-5 h-5 text-amber-600" id="vrh-icon-svg" />,
      uoms: 'hours',
      badge: 'STABLE',
      badgeStyle: 'bg-amber-100 text-amber-700'
    }
  ];

  // Helper to format large numbers cleanly
  const formatNum = (val: number) => {
    return new Intl.NumberFormat('en-US').format(val);
  };

  const renderTrendBadge = (pct: number | null) => {
    if (pct === null) return <span className="text-xs text-gray-400 font-mono">N/A</span>;
    const isPositive = pct >= 0;
    return (
      <div className={`inline-flex items-center gap-1 rounded text-xs font-bold ${
        isPositive ? 'text-green-600' : 'text-rose-600'
      }`}>
        <span className="font-mono">{isPositive ? '▲' : '▼'} {isPositive ? '+' : ''}{pct.toFixed(2)}%</span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="overview-cards-container">
      {metrics.map((m) => {
        const summary: MetricSummary = getMetricSummary(records, selectedAgencyId, selectedMonth, m.key);

        return (
          <div
            key={m.key}
            id={`card-${m.key}`}
            className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between"
          >
            {/* Upper row: icon and title */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                  {m.title}
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${m.badgeStyle}`}>
                  {m.badge}
                </span>
              </div>
              
              {/* Actual value */}
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight" id={`val-${m.key}`}>
                  {formatNum(summary.currentVal)}
                </span>
                <span className="text-slate-400 text-xs lowercase">
                  {m.uoms}
                </span>
              </div>
            </div>

            {/* Footer with MoM and YoY Trends built beautifully according to Sleek Interface */}
            <div className="border-t border-slate-50 mt-4 pt-4 flex flex-col gap-1.5 text-xs font-medium">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 uppercase tracking-wider text-[10px]">MoM Trend</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-700">delta:</span>
                  {renderTrendBadge(summary.momPercent)}
                </div>
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 uppercase tracking-wider text-[10px]">YoY Trend</span>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">delta:</span>
                  {renderTrendBadge(summary.yoyPercent)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
