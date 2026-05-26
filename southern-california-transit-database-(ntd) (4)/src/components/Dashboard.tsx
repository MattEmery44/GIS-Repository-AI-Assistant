import React, { useState, useMemo } from 'react';
import {
  Download,
  Search,
  Filter,
  CheckCircle,
  HelpCircle,
  Bus,
  Train,
  Check,
  ChevronDown,
  Info,
  Calendar,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { TransitRecord, AgencyMetadata, TransitMetric } from '../types';
import OverviewCards from './OverviewCards';
import TrendCharts from './TrendCharts';
import Chatbot from './Chatbot';

interface DashboardProps {
  records: TransitRecord[];
  agencies: AgencyMetadata[];
  availableMonths: string[];
}

export default function Dashboard({ records, agencies, availableMonths }: DashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(availableMonths[availableMonths.length - 1]); // Default to latest month (e.g. 2026-04)
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('all');
  const [agencySearchText, setAgencySearchText] = useState<string>('');
  const [tableSearchText, setTableSearchText] = useState<string>('');
  const [sortField, setSortField] = useState<'upt' | 'vrm' | 'vrh' | 'agencyName'>('upt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isLedgerExpanded, setIsLedgerExpanded] = useState<boolean>(false);

  // Find currently selected agency metadata details
  const selectedAgencyMeta = useMemo(() => {
    return agencies.find(a => a.id === selectedAgencyId);
  }, [selectedAgencyId, agencies]);

  // Convert month key (e.g. "2024-03") to human-readable month name ("March 2024")
  const formatMonthLabelHuman = (label: string) => {
    const parts = label.split('-');
    const year = parts[0];
    const monthIndex = parseInt(parts[1]) - 1;
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `${monthNames[monthIndex]} ${year}`;
  };

  // Filter Southern California transit agencies based on user search box
  const filteredAgenciesList = useMemo(() => {
    return agencies.filter(a =>
      a.name.toLowerCase().includes(agencySearchText.toLowerCase()) ||
      a.serviceArea.toLowerCase().includes(agencySearchText.toLowerCase())
    );
  }, [agencies, agencySearchText]);

  // Data for comparative leaderboard list for the chosen month
  const leaderboardData = useMemo(() => {
    let raw = records.filter(r => r.monthLabel === selectedMonth);

    // Apply search filter if typed
    if (tableSearchText.trim()) {
      raw = raw.filter(r =>
        r.agencyName.toLowerCase().includes(tableSearchText.toLowerCase())
      );
    }

    // Sort the dataset
    return [...raw].sort((a, b) => {
      let valA: any = a[sortField as keyof TransitRecord];
      let valB: any = b[sortField as keyof TransitRecord];

      if (typeof valA === 'string') {
        return sortDirection === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });

  }, [records, selectedMonth, tableSearchText, sortField, sortDirection]);

  // Exporter: Month-wide CSV stats
  const handleExportMonthCSV = () => {
    const headers = ['Agency ID', 'Agency Name', 'Transit Mode', 'Year', 'Month', 'Unlinked Passenger Trips (UPT)', 'Vehicle Revenue Miles (VRM)', 'Vehicle Revenue Hours (VRH)'];
    
    const rows = records
      .filter(r => r.monthLabel === selectedMonth)
      .map(r => {
        const agencyMeta = agencies.find(a => a.id === r.agencyId);
        return [
          r.agencyId,
          `"${r.agencyName}"`,
          `"${agencyMeta?.primaryMode || 'Bus'}"`,
          r.year,
          r.month,
          r.upt,
          r.vrm,
          r.vrh
        ];
      });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    downloadBlob(csvContent, `ntd_socal_${selectedMonth}_stats.csv`, 'text/csv;charset=utf-8;');
  };

  // Exporter: Selected agency historical trend CSV
  const handleExportAgencyCSV = () => {
    const targetId = selectedAgencyId === 'all' ? 'all' : selectedAgencyId;
    const headers = ['Year', 'Month', 'Month Label', 'Agency Short Name', 'Ridership (UPT)', 'Veh Revenue Miles (VRM)', 'Veh Revenue Hours (VRH)'];
    
    let filteredRecords = records;
    if (targetId !== 'all') {
      filteredRecords = records.filter(r => r.agencyId === selectedAgencyId);
    }

    const rows = filteredRecords.map(r => [
      r.year,
      r.month,
      r.monthLabel,
      `"${r.agencyName}"`,
      r.upt,
      r.vrm,
      r.vrh
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const filename = targetId === 'all' ? `ntd_all_socal_trends_historical.csv` : `ntd_trend_${targetId}_historical.csv`;
    downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
  };

  // Trigger browser downloader
  const downloadBlob = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sort helper
  const triggerSort = (field: 'upt' | 'vrm' | 'vrh' | 'agencyName') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="space-y-8" id="dashboard-main-view">
      
      {/* 1. SELECTION FILTERS BAR */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6" id="dashboard-filters-card">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          {/* Main Select Options */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            
            {/* MONTH SELECTOR */}
            <div className="flex flex-col gap-1.5 min-w-[200px]" id="month-selector-div">
              <label className="text-[10px] font-bold text-slate-500 font-sans uppercase tracking-widest flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                REPORTING MONTH
              </label>
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-md px-3 py-2 text-sm font-bold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors cursor-pointer appearance-none shadow-xs"
                  id="target-month-dropdown"
                >
                  {availableMonths.map((m) => (
                    <option key={m} value={m} className="font-semibold text-slate-800">
                      {formatMonthLabelHuman(m)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* QUICK REGIONAL SELECTOR */}
            <div className="flex flex-col gap-1.5 min-w-[240px]" id="regional-selector-div">
              <label className="text-[10px] font-bold text-slate-500 font-sans uppercase tracking-widest flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                FOCUS TRANSIT AGENCY
              </label>
              <div className="relative">
                <select
                  value={selectedAgencyId}
                  onChange={(e) => setSelectedAgencyId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-md px-3 py-2 text-sm font-bold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors cursor-pointer appearance-none shadow-xs"
                  id="agency-focus-dropdown"
                >
                  <option value="all" className="font-semibold text-blue-700">All SoCal Combined (18 Authorities)</option>
                  {agencies.map((a) => (
                    <option key={a.id} value={a.id} className="font-semibold text-slate-800">
                      {a.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

          </div>

          {/* EXPORTS AREA - Styled according to the Export Data sleek design theme spec */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto" id="export-actions-wrap">
            <button
              onClick={handleExportMonthCSV}
              className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-md hover:bg-slate-700 transition-colors flex items-center gap-2 cursor-pointer shadow-xs border-none"
              id="export-active-month-btn"
            >
              <Download className="w-3.5 h-3.5" />
              Export Month
            </button>
            <button
              onClick={handleExportAgencyCSV}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              id="export-historical-trends-btn"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Trends Trend CSV
            </button>
          </div>

        </div>

        {/* Selected focus agency status bar details with Sleek Minimal Card style */}
        <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-md flex items-start gap-3 text-slate-700 text-xs" id="focus-agency-details">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <div>
            {selectedAgencyId === 'all' ? (
              <p className="font-sans leading-relaxed text-slate-600">
                Exploring summed transit statistics representing the entire <strong className="text-slate-800">Southern California Region</strong> (commuter rails, regional transit tracks, and local city bus transit options). 18 certified physical transit authorities contribute records reporting.
              </p>
            ) : (
              <p className="font-sans leading-relaxed text-slate-600">
                Active focal agency details: <strong className="text-slate-800">{selectedAgencyMeta?.name}</strong>. Primary Transit Class: <span className="font-semibold text-blue-700">{selectedAgencyMeta?.primaryMode}</span>. Dedicated Service Area: <span className="font-semibold text-slate-800">{selectedAgencyMeta?.serviceArea}</span>. Focus graphs and MoM thresholds correspond to this selection.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. SPLIT LAYOUT: ANALYTICS VS ASSISTANT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8" id="analytics-chatbot-split-grid">
        
        {/* LEFT COLUMN: VISUAL DASHBOARD PANELS (xl: col-span-8) */}
        <div className="xl:col-span-8 space-y-8" id="dashboard-analytics-left-panel">
          
          {/* Section Heading */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-display text-slate-800 tracking-tight">
                Reporting Month Metrics & Trends
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculations for the chosen month of <strong className="text-slate-600">{formatMonthLabelHuman(selectedMonth)}</strong>
              </p>
            </div>
            <div className="bg-white/80 p-1 rounded-xl text-slate-500 text-xs border border-slate-100 flex items-center gap-1.5 font-mono">
              <Layers className="w-3.5 h-3.5" />
              {selectedMonth}
            </div>
          </div>

          {/* OVERVIEW METRICS RECHARTS & SUMMARY */}
          <OverviewCards
            records={records}
            selectedAgencyId={selectedAgencyId}
            selectedMonth={selectedMonth}
          />

          {/* INTERACTIVE LINE CHOP & BAR CHARTS */}
          <TrendCharts
            records={records}
            selectedAgencyId={selectedAgencyId}
            selectedMonth={selectedMonth}
            agencies={agencies}
          />

          {/* 3. DETAILED MONTHLY LEDGER FOR THE ACTIVE MONTH */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" id="regional-table-ledger">
            {/* Clickable toggle dropdown header */}
            <button
              onClick={() => setIsLedgerExpanded(!isLedgerExpanded)}
              className="w-full text-left p-4 sm:p-5 flex items-center justify-between bg-slate-50 hover:bg-slate-100/70 transition-colors focus:outline-none cursor-pointer"
              id="ledger-dropdown-header"
              type="button"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 font-display text-sm sm:text-base">Regional Transit Authorities Ledger</h3>
                    <span className="bg-blue-100 text-blue-700 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full">
                      {selectedMonth}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isLedgerExpanded 
                      ? "Direct database metrics for all agencies (Click to collapse)" 
                      : `Click to expand and view detailed table comparison of all ${leaderboardData.length} active agencies`
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-wider font-sans hidden sm:inline">
                  {isLedgerExpanded ? 'Collapse' : 'Expand Ledger'}
                </span>
                <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-500 transition-transform duration-300 ${isLedgerExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Dropdown collapsible container */}
            {isLedgerExpanded && (
              <div className="p-4 sm:p-6 pt-0 border-t border-slate-100 space-y-4" id="ledger-expanded-contents">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
                  <div>
                    <h4 className="font-bold text-slate-800 font-display text-xs sm:text-sm">Detailed Reporting Metrics</h4>
                    <span className="text-[10px] text-slate-400 font-sans">
                      Unlinked Passenger Trips (UPT), Vehicle Revenue Miles (VRM), and Vehicle Revenue Hours (VRH) for {selectedMonth}
                    </span>
                  </div>

                  {/* Table search filter */}
                  <div className="relative max-w-full sm:max-w-xs w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={tableSearchText}
                      onChange={(e) => setTableSearchText(e.target.value)}
                      placeholder="Filter by agency..."
                      className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-md pl-9 pr-4 py-2 text-xs font-sans text-slate-800 transition-all shadow-xs"
                      id="ledger-agency-search-input"
                    />
                  </div>
                </div>

                {/* Interactive table */}
                <div className="overflow-x-auto" id="table-scroll-wrapper">
                  <table className="w-full border-collapse text-left" id="regional-transit-table">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 text-[10px] font-bold font-sans uppercase tracking-wider bg-slate-50">
                        <th
                          onClick={() => triggerSort('agencyName')}
                          className="py-3 px-4 cursor-pointer hover:bg-slate-100 select-none rounded-l-md transition-colors"
                        >
                          <div className="flex items-center gap-1">
                            Transit Agency
                            <ArrowUpDown className="w-3" />
                          </div>
                        </th>
                        <th
                          onClick={() => triggerSort('upt')}
                          className="py-3 px-4 cursor-pointer hover:bg-slate-100 select-none text-right transition-colors"
                        >
                          <div className="flex items-center justify-end gap-1">
                            UPT (Ridership)
                            <ArrowUpDown className="w-3" />
                          </div>
                        </th>
                        <th
                          onClick={() => triggerSort('vrm')}
                          className="py-3 px-4 cursor-pointer hover:bg-slate-100 select-none text-right transition-colors"
                        >
                          <div className="flex items-center justify-end gap-1">
                            VRM (Rev Miles)
                            <ArrowUpDown className="w-3" />
                          </div>
                        </th>
                        <th
                          onClick={() => triggerSort('vrh')}
                          className="py-3 px-4 cursor-pointer hover:bg-slate-100 select-none text-right rounded-r-md transition-colors"
                        >
                          <div className="flex items-center justify-end gap-1">
                            VRH (Rev Hours)
                            <ArrowUpDown className="w-3" />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {leaderboardData.length > 0 ? (
                        leaderboardData.map((row) => {
                          const agencyMeta = agencies.find(a => a.id === row.agencyId);
                          const isCurrentlyFocused = row.agencyId === selectedAgencyId;

                          return (
                            <tr
                              key={row.agencyId}
                              onClick={() => setSelectedAgencyId(row.agencyId)}
                              className={`group hover:bg-slate-50 transition-colors cursor-pointer ${
                                isCurrentlyFocused ? 'bg-blue-50/60 border-l-2 border-blue-600' : ''
                              }`}
                            >
                              {/* Agency short name and info */}
                              <td className="py-3 px-4 font-sans font-medium text-slate-700">
                                <div>
                                  <span className="text-slate-800 font-bold group-hover:text-blue-600 transition-colors">
                                    {agencyMeta?.name || row.agencyName}
                                  </span>
                                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-normal">
                                    <span className="bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-semibold uppercase font-mono">
                                      {agencyMeta?.primaryMode === 'Bus' ? '🚌 Bus' : agencyMeta?.primaryMode === 'Commuter Rail' ? '🚆 Rail' : '🚌/🚆 Multiple'}
                                    </span>
                                    <span>{agencyMeta?.serviceArea}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Ridership data */}
                              <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                                {new Intl.NumberFormat('en-US').format(row.upt)}
                              </td>

                              {/* Vehicle mileage */}
                              <td className="py-3 px-4 text-right font-mono text-slate-600">
                                {new Intl.NumberFormat('en-US').format(row.vrm)}
                              </td>

                              {/* Operational hours */}
                              <td className="py-3 px-4 text-right font-mono text-slate-600">
                                {new Intl.NumberFormat('en-US').format(row.vrh)}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-xs text-slate-400">
                            No transit records found matching keyword filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] sm:text-[11px] text-slate-400 font-sans pt-1 gap-2">
                  <span>💡 Click any agency row to focus trend graphs on that agency</span>
                  <span>Showing {leaderboardData.length} of {agencies.length} agencies</span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: AI TRANIST BOT PANEL (xl: col-span-4) */}
        <div className="xl:col-span-4 h-full" id="chatbot-sidebar-panel">
          
          <div className="sticky top-6 space-y-4">
            
            {/* Header info */}
            <div>
              <h2 className="text-xl font-bold font-display text-slate-800 tracking-tight">
                Transit AI Consultant
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Chatbot with instant data query capability over the 18 regional authorities
              </p>
            </div>

            <Chatbot
              selectedAgencyId={selectedAgencyId}
              selectedMonth={selectedMonth}
            />

          </div>

        </div>

      </div>

    </div>
  );
}
