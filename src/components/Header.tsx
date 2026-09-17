import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  Terminal, 
  Activity, 
  FileText, 
  History, 
  ChevronDown, 
  Radio, 
  RefreshCw, 
  Search,
  Bell,
  GitCompare
} from 'lucide-react';
import { ScanResult } from '../types';

interface HeaderProps {
  activeTab: 'dashboard' | 'vulnerabilities' | 'audit' | 'report';
  setActiveTab: (tab: 'dashboard' | 'vulnerabilities' | 'audit' | 'report') => void;
  hasGeminiKey: boolean;
  totalVulns: number;
  resolvedCount: number;
  scansHistory: ScanResult[];
  currentScan: ScanResult | null;
  onSelectScan: (scan: ScanResult) => void;
  onOpenHistoryPanel: () => void;
  isAutoPolling?: boolean;
  onToggleAutoPolling?: () => void;
  isServerOnline?: boolean;
  lastPolledAt?: Date | null;
  isPollingActive?: boolean;
  onTriggerTargetFocus?: () => void;
  onOpenNotificationConfig?: () => void;
  onOpenCompare?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  hasGeminiKey,
  totalVulns,
  resolvedCount,
  scansHistory,
  currentScan,
  onSelectScan,
  onOpenHistoryPanel,
  isAutoPolling = true,
  onToggleAutoPolling,
  isServerOnline = true,
  lastPolledAt = null,
  isPollingActive = false,
  onTriggerTargetFocus,
  onOpenNotificationConfig,
  onOpenCompare,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-950/40 border border-cyan-500/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">AEGIS</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 uppercase tracking-wider">
                  AI P-Tester
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Automated Web Penetration & Remediation Engine</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              id="nav-tab-vulnerabilities"
              onClick={() => setActiveTab('vulnerabilities')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 relative cursor-pointer ${
                activeTab === 'vulnerabilities'
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Vulnerabilities</span>
              {totalVulns > 0 && (
                <span className={`ml-1 px-1.5 py-0.2 text-xs rounded-full font-mono ${
                  resolvedCount === totalVulns
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}>
                  {resolvedCount}/{totalVulns}
                </span>
              )}
            </button>

            <button
              id="nav-tab-audit"
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Audit Trail</span>
            </button>

            <button
              id="nav-tab-report"
              onClick={() => setActiveTab('report')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'report'
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Reports</span>
            </button>
          </nav>

          {/* Right Header Utilities */}
          <div className="flex items-center space-x-2">
            {/* Live System Health Indicator */}
            <div 
              id="system-health-indicator"
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs"
              title={`Server Status: ${isServerOnline ? 'Operational (Online)' : 'Offline / Unreachable'}${lastPolledAt ? ` • Last health check: ${lastPolledAt.toLocaleTimeString()}` : ''}`}
            >
              <div className="relative flex items-center justify-center">
                {isServerOnline && isAutoPolling && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute opacity-75"></span>
                )}
                <span className={`w-2 h-2 rounded-full ${isServerOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </div>
              <span className="hidden sm:inline font-mono text-[11px] text-slate-300">
                {isServerOnline ? 'System Live' : 'Offline'}
              </span>
            </div>

            {/* Periodic Auto-Polling Toggle */}
            {onToggleAutoPolling && (
              <button
                id="toggle-auto-polling-btn"
                onClick={onToggleAutoPolling}
                className={`px-2 sm:px-2.5 py-1 rounded-lg border text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  isAutoPolling
                    ? 'bg-cyan-950/60 border-cyan-800/80 text-cyan-300 hover:bg-cyan-900/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={isAutoPolling ? "Auto-polling server health is active (every 5s). Click to pause." : "Auto-polling is paused. Click to resume."}
              >
                <RefreshCw className={`w-3 h-3 ${isPollingActive ? 'animate-spin text-cyan-400' : isAutoPolling ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span className="hidden sm:inline">Auto-Poll</span>
                <span className={`text-[10px] px-1 rounded ${isAutoPolling ? 'bg-cyan-900/70 text-cyan-200' : 'bg-slate-800 text-slate-400'}`}>
                  {isAutoPolling ? 'ON' : 'OFF'}
                </span>
              </button>
            )}

            {/* Quick Cmd+K trigger */}
            {onTriggerTargetFocus && (
              <button
                onClick={onTriggerTargetFocus}
                className="hidden xl:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-mono transition-colors cursor-pointer"
                title="Press ⌘K or Ctrl+K to jump to target assessment input"
              >
                <Search className="w-3 h-3 text-cyan-400" />
                <span>Target</span>
                <kbd className="px-1 text-[10px] bg-slate-800 border border-slate-700 rounded text-slate-300">⌘K</kbd>
              </button>
            )}

            {/* Notification Webhook & Email Alerts Config Button */}
            {onOpenNotificationConfig && (
              <button
                id="open-notifications-btn"
                onClick={onOpenNotificationConfig}
                className="px-2 sm:px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                title="Configure Incident Notification Webhook / Email Alerts"
              >
                <Bell className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden lg:inline">Alerts</span>
              </button>
            )}

            {/* Compare Recent Scans Button */}
            {onOpenCompare && scansHistory.length >= 2 && (
              <button
                id="header-compare-scans-btn"
                onClick={onOpenCompare}
                className="px-2 sm:px-2.5 py-1 rounded-lg border border-indigo-900/60 bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 hover:text-indigo-200 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                title="Compare Recent Scans Side-by-Side"
              >
                <GitCompare className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden md:inline">Compare</span>
              </button>
            )}

            {/* Assessment History Dropdown */}
            <div className="relative">
              <button
                id="history-dropdown-trigger"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center space-x-1.5 border ${
                  currentScan
                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800'
                } cursor-pointer`}
              >
                <History className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {currentScan ? currentScan.target.domain : 'Past Scans'}
                </span>
                <span className="sm:hidden">History</span>
                {scansHistory.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
                    {scansHistory.length}
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400">
                      <span>Previous Assessments</span>
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenHistoryPanel();
                        }}
                        className="text-cyan-400 hover:underline cursor-pointer"
                      >
                        View Side Panel →
                      </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60 py-1">
                      {scansHistory.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          No previous scans recorded yet.
                        </div>
                      ) : (
                        scansHistory.map((s) => (
                          <button
                            key={s.scanId}
                            onClick={() => {
                              onSelectScan(s);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-2 text-xs cursor-pointer ${
                              currentScan?.scanId === s.scanId ? 'bg-slate-800 text-cyan-300' : 'text-slate-300'
                            }`}
                          >
                            <div className="truncate flex-1">
                              <div className="font-mono font-bold text-white truncate">
                                {s.target.domain}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {new Date(s.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {s.stats.total} vulns
                              </div>
                            </div>
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-400 shrink-0">
                              {s.securityScore}/100
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};


