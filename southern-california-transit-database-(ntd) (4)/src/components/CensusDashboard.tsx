import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  Search, 
  Users, 
  DollarSign, 
  TrendingDown, 
  Car, 
  Percent, 
  Sparkles, 
  Layers, 
  CheckSquare, 
  Square, 
  Compass,
  ArrowRight,
  Info
} from 'lucide-react';
import { 
  ComposedChart,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter, 
  ZAxis, 
  Cell
} from 'recharts';
import { censusProfiles } from '../data/censusData';
import { CensusProfile, GeographyLevel } from '../types';
import CensusChatbot from './CensusChatbot';

export default function CensusDashboard() {
  const [selectedLevel, setSelectedLevel] = useState<GeographyLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>(['westlake', 'la-county', 'torrance', 'santa-monica']);
  const [activeProfileId, setActiveProfileId] = useState<string>('westlake');

  // Calculate Transit Dependency Index (TDI)
  // Formula: (Poverty % * 1.2) + (Transit Commute % * 1.2) + (Max(0, 2 - Vehicles per Households) * 24)
  const calculateTDI = (profile: CensusProfile): number => {
    const povertyWeight = profile.povertyRate * 1.25;
    const transitWeight = profile.transitCommuteRate * 1.15;
    const vehicleFactor = Math.max(0, 2.2 - profile.vehiclesPerHousehold) * 20;
    const rawVal = povertyWeight + transitWeight + vehicleFactor;
    return Math.min(100, Math.round(rawVal));
  };

  const filteredProfiles = useMemo(() => {
    return censusProfiles.filter((p) => {
      const matchesLevel = selectedLevel === 'all' || p.level === selectedLevel;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }, [selectedLevel, searchQuery]);

  const activeProfile = useMemo(() => {
    return censusProfiles.find(p => p.id === activeProfileId) || censusProfiles[0];
  }, [activeProfileId]);

  const activeProfileTDI = useMemo(() => {
    return calculateTDI(activeProfile);
  }, [activeProfile]);

  const toggleProfileComparison = (id: string) => {
    if (selectedProfiles.includes(id)) {
      if (selectedProfiles.length > 2) {
        setSelectedProfiles(selectedProfiles.filter(pId => pId !== id));
      }
    } else {
      if (selectedProfiles.length < 8) {
        setSelectedProfiles([...selectedProfiles, id]);
      }
    }
  };

  const comparisonData = useMemo(() => {
    return censusProfiles
      .filter((p) => selectedProfiles.includes(p.id))
      .map((p) => ({
        name: p.name,
        poverty: p.povertyRate,
        transitCommute: p.transitCommuteRate,
        income: p.medianIncome,
        tdi: calculateTDI(p)
      }));
  }, [selectedProfiles]);

  const scatterData = useMemo(() => {
    return censusProfiles.map((p) => ({
      x: p.vehiclesPerHousehold,
      y: p.transitCommuteRate,
      z: calculateTDI(p),
      name: p.name,
      poverty: p.povertyRate,
      level: p.level,
      id: p.id
    }));
  }, []);

  const formatIncome = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6" id="census-analysis-tab">
      
      {/* 1. INTRO INFO */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 text-white p-6 relative overflow-hidden shadow-lg" id="census-hero-panel">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-400 font-bold font-mono text-[9px] px-2.5 py-0.5 rounded-full border border-blue-500/30 uppercase tracking-widest">Demographics Module</span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-slate-300 font-mono text-xs">ACS 5-Year Estimates (LA County context)</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white font-display">
              American Community Survey (ACS) Socioeconomic Profiles
            </h2>
            <p className="text-slate-400 text-xs md:text-sm max-w-3xl leading-relaxed">
              Explore transit equity, ridership dependency, and community characteristics. Toggle between micro <strong>neighborhoods</strong>, municipal <strong>cities</strong>, and macro <strong>county-wide</strong> scales to examine how poverty rates, income disparities, and vehicle saturation predict local Southern California transit reliance.
            </p>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700/60 max-w-xs shrink-0" id="tdi-methodology-tip">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none">EQUITY FORMULA</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Our custom <strong>Transit Dependency Index (TDI)</strong> measures population density, public transit commute share, and low-car ownership on a scale from 0 to 100.
            </p>
          </div>
        </div>
      </div>

      {/* 2. MAIN LAYOUT: SIDEPANELS AND GRAPHS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="census-grid-row">
        
        {/* LEFT COMPONENT (COL-SPAN-8 for filters, lists, and comparative tools) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* BAR FOR SEARCH AND FILTERS */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs" id="census-controls-header">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              
              {/* Scale Toggles */}
              <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-md" id="geo-scale-toggles">
                <button
                  onClick={() => setSelectedLevel('all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold font-sans transition-all cursor-pointer ${
                    selectedLevel === 'all'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All Geographies
                </button>
                <button
                  onClick={() => setSelectedLevel('county')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold font-sans transition-all cursor-pointer ${
                    selectedLevel === 'county'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  County
                </button>
                <button
                  onClick={() => setSelectedLevel('city')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold font-sans transition-all cursor-pointer ${
                    selectedLevel === 'city'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Cities
                </button>
                <button
                  onClick={() => setSelectedLevel('neighborhood')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold font-sans transition-all cursor-pointer ${
                    selectedLevel === 'neighborhood'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  LA City Neighborhoods
                </button>
              </div>

              {/* Text search */}
              <div className="relative flex-1 max-w-full sm:max-w-xs" id="geo-text-search-div">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter census dataset..."
                  className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-md pl-9 pr-4 py-2 text-xs font-sans text-slate-800 transition-colors shadow-xs"
                />
              </div>

            </div>
          </div>

          {/* LEDGER OF GEOGRAPHICAL COMMENSURATES */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" id="geo-elements-ledger">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 font-display">Socioeconomic Ledger & Comparisons</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select rows to preview demographic highlights (RHS) or check boxes to plot in the comparative chart below.
                </p>
              </div>
              <div className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider font-mono">
                {selectedProfiles.length} of 8 Compared
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs bg-white">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50">
                    <th className="py-3 px-4 w-12 text-center select-none">Plot</th>
                    <th className="py-3 px-4">Geography Name</th>
                    <th className="py-3 px-4">Scale</th>
                    <th className="py-3 px-4 text-right">Population</th>
                    <th className="py-3 px-4 text-right">Median Income</th>
                    <th className="py-3 px-4 text-right">Poverty %</th>
                    <th className="py-3 px-4 text-right">Transit %</th>
                    <th className="py-3 px-4 text-right">Vehicles/HH</th>
                    <th className="py-3 px-4 text-center">TDI Index</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProfiles.map((profile) => {
                    const isSelectedPlot = selectedProfiles.includes(profile.id);
                    const isCurrentlyActive = profile.id === activeProfileId;
                    const computedIndex = calculateTDI(profile);
                    
                    // Style scale category
                    let scaleColor = "bg-purple-100 text-purple-700";
                    if (profile.level === 'county') scaleColor = "bg-rose-100 text-rose-700 animate-pulse";
                    else if (profile.level === 'city') scaleColor = "bg-blue-100 text-blue-700";
                    
                    return (
                      <tr 
                        key={profile.id}
                        className={`group cursor-pointer hover:bg-slate-50 transition-colors ${
                          isCurrentlyActive ? 'bg-blue-50/60 font-semibold' : ''
                        }`}
                        onClick={() => setActiveProfileId(profile.id)}
                      >
                        {/* Selector checkbox */}
                        <td 
                          className="py-2.5 px-4 text-center cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProfileComparison(profile.id);
                          }}
                        >
                          <div className="flex justify-center items-center">
                            {isSelectedPlot ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 hover:text-slate-400" />
                            )}
                          </div>
                        </td>

                        {/* Name */}
                        <td className="py-2.5 px-4 font-bold text-slate-800">
                          <div className="flex items-center gap-1.5">
                            {profile.name}
                            {isCurrentlyActive && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0" />}
                          </div>
                        </td>

                        {/* Scale label */}
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${scaleColor}`}>
                            {profile.level}
                          </span>
                        </td>

                        {/* Population */}
                        <td className="py-2.5 px-4 text-right text-slate-700 font-mono">
                          {new Intl.NumberFormat('en-US').format(profile.population)}
                        </td>

                        {/* Median Income */}
                        <td className="py-2.5 px-4 text-right text-slate-700 font-mono font-medium">
                          {formatIncome(profile.medianIncome)}
                        </td>

                        {/* Poverty Rate */}
                        <td className="py-2.5 px-4 text-right text-slate-700 font-mono">
                          {profile.povertyRate.toFixed(1)}%
                        </td>

                        {/* Transit Commute Rate */}
                        <td className="py-2.5 px-4 text-right text-slate-700 font-mono font-semibold text-blue-600">
                          {profile.transitCommuteRate.toFixed(1)}%
                        </td>

                        {/* Vehicles per Household */}
                        <td className="py-2.5 px-4 text-right text-slate-700 font-mono">
                          {profile.vehiclesPerHousehold.toFixed(2)}
                        </td>

                        {/* TDI index meter */}
                        <td className="py-2.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded font-bold font-mono ${
                            computedIndex >= 70 ? 'bg-red-100 text-red-700' :
                            computedIndex >= 50 ? 'bg-amber-100 text-amber-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {computedIndex}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredProfiles.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-400 font-sans">
                        No demographics match your search parameters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* DUAL DATA VISUALIZATION CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="demographic-charts-grid">
            
            {/* COMPARE PLOT: BAR CHART FOR CHOSEN GEOGRAPHIES */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-800 font-display">Comparative Demographic Indicators</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Plots checked geographies. Compares Transit Dependency (0-100 Index) against Poverty Rate (%).
                </p>
                
                {/* Visualizer chart */}
                <div className="h-64 mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }}
                        labelStyle={{ fontWeight: 'bold', color: '#ffffff' }}
                      />
                      <Legend verticalAlign="bottom" height={24} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                      <Bar name="TDI (Dependency Index)" dataKey="tdi" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      <Bar name="Poverty Rate (%)" dataKey="poverty" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 bg-slate-50 p-2 text-center rounded border border-slate-100 mt-4 leading-normal">
                💡 High <strong>Transit Dependency Indices</strong> typically correspond with lower vehicle ownership densities. Check boxes on entries in the grid to instantly render them here.
              </div>
            </div>

            {/* DISTRIBUTION PATH: SCATTER PLOT ANALYSIS OF LA COUNTY DEPENDENCY */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-800 font-display">Commute share vs Vehicle ownership</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Distribution mapping: Transit Commuter Share (%) vs Average Vehicles per Household.
                </p>

                {/* Recharts Scatter graph */}
                <div className="h-64 mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        type="number" 
                        dataKey="x" 
                        name="Vehicles/HH" 
                        stroke="#94a3b8" 
                        fontSize={9} 
                        domain={[0.4, 2.0]}
                        tickFormatter={(val) => `${val} cars`}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="y" 
                        name="Transit %" 
                        stroke="#94a3b8" 
                        fontSize={9}
                        domain={[0, 35]}
                        tickFormatter={(val) => `${val}%`}
                      />
                      <ZAxis type="number" dataKey="z" range={[80, 240]} name="TDI Score" />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border-none text-slate-200 p-2.5 rounded-lg shadow-lg text-xs space-y-1">
                                <p className="font-bold text-white">{data.name}</p>
                                <p className="text-slate-400 uppercase text-[9px] font-bold">Category: {data.level}</p>
                                <hr className="border-slate-800 my-1" />
                                <p><span className="text-slate-400">Avg Vehicles:</span> <strong className="text-white">{data.x.toFixed(2)} / HH</strong></p>
                                <p><span className="text-slate-400">Transit Commute:</span> <strong className="text-white">{data.y.toFixed(1)}%</strong></p>
                                <p><span className="text-slate-400">Poverty Rate:</span> <strong className="text-white">{data.poverty.toFixed(1)}%</strong></p>
                                <p className="text-blue-400 font-mono font-bold mt-1">TDI Equity Rating: {data.z}/100</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter 
                        name="Geographies" 
                        data={scatterData} 
                        fill="#3b82f6" 
                        onClick={(node: any) => {
                          if (node && node.id) {
                            setActiveProfileId(node.id);
                          }
                        }}
                      >
                        {scatterData.map((entry, index) => {
                          const isActive = entry.id === activeProfileId;
                          let dotColor = "#3b82f6";
                          if (isActive) dotColor = "#dc2626"; // Active is red
                          else if (entry.z >= 75) dotColor = "#e11d48"; // Critical is pink-red
                          else if (entry.z >= 50) dotColor = "#f59e0b"; // Medium is yellow
                          else if (entry.level === 'county') dotColor = "#6366f1"; // County is Indigo
                          return <Cell key={`cell-${index}`} fill={dotColor} stroke={isActive ? "#000" : "none"} strokeWidth={2} className="cursor-pointer" />;
                        })}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-50 text-[10px] text-slate-500 justify-center">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#e11d48]"></span> Critical Dependency (TDI 75+)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span> Moderate (TDI 50-74)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span> Lower (TDI &lt; 50)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#dc2626]"></span> Row Selection</span>
              </div>
            </div>

          </div>

        </div>

        {/* RIGHTSIDE BAR: SINGLE ACTIVE PROFILE SUMMARY AND TRANSIT IMPACT */}
        <div className="lg:col-span-4 space-y-6" id="equity-profiler-sidebar">
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 relative" id="active-profile-card">
            
            {/* Header profile title */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{activeProfile.level} profile</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-slate-800 font-display">
                {activeProfile.name}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                Contained in: <strong className="text-slate-600">{activeProfile.parent}</strong>
              </p>
            </div>

            {/* DIAL DIAGRAM: Transit Dependency index score */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">TRANSIT DEPENDENCY</p>
                <h4 className="text-4xl font-black font-mono tracking-tighter text-slate-800">
                  {activeProfileTDI}<span className="text-lg text-slate-400 font-normal">/100</span>
                </h4>
                <div className="mt-2.5 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${
                    activeProfileTDI >= 75 ? 'bg-red-500 animate-ping' :
                    activeProfileTDI >= 50 ? 'bg-amber-500' :
                    'bg-green-500'
                  }`} />
                  <span className="text-[10px] font-bold text-slate-600 uppercase">
                    {activeProfileTDI >= 75 ? 'CRITICAL REQUIREMENT' :
                     activeProfileTDI >= 50 ? 'STABLE MODERATE' :
                     'LOWER SYSTEM DEP.'}
                  </span>
                </div>
              </div>

              {/* Progress Circle Visualizer */}
              <div className="relative w-18 h-18 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={`${
                      activeProfileTDI >= 75 ? 'text-red-500' :
                      activeProfileTDI >= 50 ? 'text-amber-500' :
                      'text-green-500'
                    }`}
                    strokeDasharray={`${activeProfileTDI}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[11px] font-bold text-slate-700 font-mono">
                  {activeProfileTDI}%
                </span>
              </div>
            </div>

            {/* DESCRIPTION */}
            <p className="text-slate-600 text-xs leading-relaxed italic border-l-2 border-blue-600/50 pl-3">
              "{activeProfile.description}"
            </p>

            {/* SPECIFIC METRIC STACKS */}
            <div className="space-y-3.5 pt-2">
              
              {/* Population item */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 text-slate-500 rounded">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-slate-500 font-medium">Population Size</span>
                </div>
                <span className="font-mono font-bold text-slate-800">
                  {new Intl.NumberFormat('en-US').format(activeProfile.population)}
                </span>
              </div>

              {/* Income item */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 text-slate-500 rounded">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-slate-500 font-medium">Median Household Income</span>
                </div>
                <span className="font-mono font-bold text-slate-800 text-right">
                  {formatIncome(activeProfile.medianIncome)}
                </span>
              </div>

              {/* Poverty Rate */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 text-slate-500 rounded">
                    <TrendingDown className="w-3.5 h-3.5 text-orange-500" />
                  </div>
                  <span className="text-slate-500 font-medium">Poverty Prevalence Rate</span>
                </div>
                <span className="font-mono font-bold text-slate-800">
                  {activeProfile.povertyRate.toFixed(1)}%
                </span>
              </div>

              {/* Transit Commute */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 text-slate-500 rounded">
                    <Percent className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <span className="text-slate-500 font-medium">Public Transit Commuters</span>
                </div>
                <span className="font-mono font-bold text-blue-600">
                  {activeProfile.transitCommuteRate.toFixed(1)}%
                </span>
              </div>

              {/* Vehicles */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 text-slate-500 rounded">
                    <Car className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-slate-500 font-medium">Avg Vehicles/Household</span>
                </div>
                <span className="font-mono font-bold text-slate-800">
                  {activeProfile.vehiclesPerHousehold.toFixed(2)} cars
                </span>
              </div>

              {/* Minorities */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 text-slate-500 rounded">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                  <span className="text-slate-500 font-medium">Minority Cohort</span>
                </div>
                <span className="font-mono font-bold text-slate-800">
                  {activeProfile.minorityRate.toFixed(1)}%
                </span>
              </div>

            </div>

            {/* DYNAMIC TRANSIT STRATEGY IMPLICATION */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 space-y-2 mt-4 text-[11px]" id="transit-impact-implication">
              <div className="flex items-center gap-1 text-blue-800 font-bold uppercase tracking-wider">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Transit Strategy Implication</span>
              </div>
              <p className="text-slate-600 leading-normal">
                {activeProfileTDI >= 75 ? (
                  <span>
                    <strong>Critical Core Priority:</strong> Low car ownership ({activeProfile.vehiclesPerHousehold} vehicles/HH) combined with high poverty yields massive transit dependency. This geography requires frequent local bus, BRT, and rail corridors to support basic employment trips. System changes here highly influence economic mobility.
                  </span>
                ) : activeProfileTDI >= 50 ? (
                  <span>
                    <strong>Targeted Grid Maintenance:</strong> Moderate dependency indicates solid localized transit demand. Emphasize micro-transit, regional feed connections, and basic shelter maintenance to serve commuters without access to high-wealth options.
                  </span>
                ) : (
                  <span>
                    <strong>Suburban / Commuter Focus:</strong> Lower transit dependency and high vehicle availability ({activeProfile.vehiclesPerHousehold} vehicles/HH) suggests routes should focus on long-distance high-speed rail/express bus structures designed to compete with auto travel times rather than baseline survival mobility.
                  </span>
                )}
              </p>
            </div>

          </div>

          {/* Census Chatbot Portal Integration — Moved up here into the sidebar */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3" id="census-chatbot-section">
            <div className="flex items-center gap-2">
              <div className="p-1 px-1.5 bg-sky-50 rounded-lg text-sky-600">
                <Sparkles className="w-4 h-4 text-sky-600 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold font-display text-slate-800 tracking-tight">
                  Demographics & Equity AI Advisor
                </h4>
                <p className="text-[10px] text-slate-400">
                  Interrogate neighborhood profiles & ACS statistics
                </p>
              </div>
            </div>

            <CensusChatbot />
          </div>

        </div>

      </div>

    </div>
  );
}
