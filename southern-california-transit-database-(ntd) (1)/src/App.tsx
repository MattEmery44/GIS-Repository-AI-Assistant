import React, { useEffect, useState } from 'react';
import { Bus, Train, Loader2, RefreshCw, Layers, Database, Compass, CheckCircle2 } from 'lucide-react';
import { TransitRecord, AgencyMetadata } from './types';
import Dashboard from './components/Dashboard';
import CensusDashboard from './components/CensusDashboard';

export default function App() {
  const [records, setRecords] = useState<TransitRecord[]>([]);
  const [agencies, setAgencies] = useState<AgencyMetadata[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'transit' | 'census'>('transit');

  useEffect(() => {
    async function initData() {
      try {
        // Fetch agencies metadata
        const agenciesRes = await fetch('/api/transit/agencies');
        const agenciesData = await agenciesRes.json();

        // Fetch historical records
        const recordsRes = await fetch('/api/transit/records');
        const recordsData = await recordsRes.json();

        if (agenciesData.status === 'ok' && recordsData.status === 'ok') {
          setAgencies(agenciesData.agencies);
          setRecords(recordsData.records);
          setAvailableMonths(recordsData.availableMonths);
        } else {
          throw new Error("Invalid format returned from API.");
        }
      } catch (err: any) {
        console.error("Failed to boot database:", err);
        setErrorStatus("Failed to establish secure handshake with full-stack analytics engine. Please ensure the local Dev server has restarted.");
      } finally {
        setIsLoading(false);
      }
    }
    initData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between" id="app-viewport">
      
      {/* HEADER BAR */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-xs" id="app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-18 py-3 md:py-0 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo and title with Sleek Interface theme branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/10">
              <svg className="w-5.5 h-5.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-800 font-display tracking-tight leading-tight">
                  SoCal Transit Intelligence
                </h1>
                <div className="hidden sm:inline-flex bg-slate-100 text-slate-500 text-[9px] px-2 py-0.5 rounded-full font-bold font-mono border border-slate-200">
                  SANDBOX v4.0
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-sans tracking-wide uppercase font-semibold">
                FTA National Transit Database • Southern California
              </p>
            </div>
          </div>

          {/* Core Multi-Module navigation Switcher tabs */}
          <div className="flex bg-slate-100 border border-slate-200/50 p-1 rounded-lg" id="app-nav-tabs">
            <button
              onClick={() => setActiveTab('transit')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold font-sans transition-all cursor-pointer ${
                activeTab === 'transit'
                  ? 'bg-white text-blue-600 shadow-sm border-none'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🚌 Transit Analytics
            </button>
            <button
              onClick={() => setActiveTab('census')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold font-sans transition-all cursor-pointer ${
                activeTab === 'census'
                  ? 'bg-white text-blue-600 shadow-sm border-none'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📊 Census Demographics & Equity
            </button>
          </div>

          {/* Quick status counters */}
          <div className="hidden md:flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-[9px] text-slate-400 font-medium font-sans uppercase">DATABASE STATUS</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  <span className="text-slate-700 font-mono font-semibold">720 Records</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-[9px] text-slate-400 font-medium font-sans uppercase">REGION WEIGHT</p>
                <p className="text-slate-700 font-bold font-mono">18 Transit Authorities</p>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* CORE WRAPPER SCREEN */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" id="app-main-content">
        
        {isLoading ? (
          /* Loading component */
          <div className="flex flex-col items-center justify-center py-32 space-y-4" id="app-loading-state">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
              <Layers className="w-5 h-5 text-indigo-500 absolute top-3.5 left-3.5 animate-pulse" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-700 font-display">Grounded NTD Handshake...</h3>
              <p className="text-xs text-slate-400 font-sans mt-1">Downloading historical records for Unlinked Passenger Trips, Miles, and Operational Hours</p>
            </div>
          </div>
        ) : errorStatus ? (
          /* Error scenario */
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center max-w-2xl mx-auto my-16 space-y-4" id="app-error-state">
            <h3 className="text-red-800 font-bold text-lg font-display">Handshake Failed</h3>
            <p className="text-slate-600 text-sm font-sans">{errorStatus}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Fetch
            </button>
          </div>
        ) : activeTab === 'transit' ? (
          /* Main Analytical Dashboard */
          <Dashboard
            records={records}
            agencies={agencies}
            availableMonths={availableMonths}
          />
        ) : (
          /* Demographic & Socio-Economic Tab */
          <CensusDashboard />
        )}

      </main>

      {/* COMPLIANT FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-6" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 font-sans">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sky-600" />
            <span>Southern California National Transit Database (NTD) Analytics Portal • © 2026</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-600 cursor-pointer">FTA Guidelines</span>
            <span className="hover:text-slate-600 cursor-pointer">UPT Overview</span>
            <span className="hover:text-slate-600 cursor-pointer text-slate-500 font-medium">Compliance: Safe / Decoupled Client Secrets</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
