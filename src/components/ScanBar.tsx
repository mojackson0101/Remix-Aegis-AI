import React, { useState } from 'react';
import { Search, Globe, Shield, RefreshCw, Zap, Server, AlertCircle, Clock, Trash2, ArrowUpRight } from 'lucide-react';

interface ScanBarProps {
  onScan: (target: string) => Promise<void>;
  isScanning: boolean;
  scanProgressText: string;
}

const STORAGE_KEY = 'aegis_recent_scans';

export const ScanBar: React.FC<ScanBarProps> = ({
  onScan,
  isScanning,
  scanProgressText,
}) => {
  const [targetInput, setTargetInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Store and display the last 5 scanned target URLs for quick access
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 5);
        }
      }
    } catch {
      // Fall back to default recent targets
    }
    return [
      'localhost/api/demo-target',
      'https://payment-hub.finance-prod.io',
      'https://auth-sso.cloudsec.dev',
      'https://api.core-gateway.internal',
      'https://owasp.org',
    ];
  });

  const saveRecentSearch = (target: string) => {
    const trimmed = target.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 5);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
      return updated;
    });
  };

  const handleClearRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInput.trim()) {
      setErrorMsg('Please enter a target URL, domain name, or IP address.');
      return;
    }
    setErrorMsg('');
    const target = targetInput.trim();
    saveRecentSearch(target);
    await onScan(target);
  };

  const handleSelectPreset = async (preset: string) => {
    setTargetInput(preset);
    setErrorMsg('');
    saveRecentSearch(preset);
    await onScan(preset);
  };

  const handleSelectRecent = async (target: string) => {
    setTargetInput(target);
    setErrorMsg('');
    saveRecentSearch(target);
    await onScan(target);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Background ambient pattern */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="mb-3">
        <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-400" />
          Target Assessment Console
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Enter a website link, domain name, or IP address to initiate an AI-driven penetration test and vulnerability remediation audit.
        </p>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-3">
        <div className="relative flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-5 h-5" />
            </div>
            <input
              id="target-input-field"
              type="text"
              value={targetInput}
              onChange={(e) => {
                setTargetInput(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="e.g. https://example.com, mycorp.io, 192.168.1.1, or demo"
              disabled={isScanning}
              className="w-full pl-10 pr-16 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-mono"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <kbd 
                className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-400 bg-slate-900/90 border border-slate-700 rounded-md shadow-inner"
                title="Press ⌘K or Ctrl+K anywhere to jump to this assessment input"
              >
                ⌘K
              </kbd>
            </div>
          </div>

          <button
            id="launch-pentest-btn"
            type="submit"
            disabled={isScanning}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium rounded-xl text-sm sm:text-base transition-all shadow-md shadow-cyan-950/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Auditing Target...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 text-cyan-200" />
                <span>Run AI Pen-Test</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="text-xs text-rose-400 flex items-center gap-1.5 mt-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> Quick Targets:
          </span>

          <button
            id="preset-demo-target"
            type="button"
            disabled={isScanning}
            onClick={() => handleSelectPreset('localhost/api/demo-target')}
            className="text-xs px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 font-mono transition-colors flex items-center gap-1 cursor-pointer"
            title="Deliberately vulnerable test endpoint with exposed headers, missing CSP/HSTS, and insecure cookies"
          >
            <Server className="w-3 h-3 text-rose-400" />
            <span>Demo Vulnerable Portal (Live In-App)</span>
          </button>

          <button
            id="preset-owasp"
            type="button"
            disabled={isScanning}
            onClick={() => handleSelectPreset('https://owasp.org')}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono transition-colors cursor-pointer"
          >
            owasp.org
          </button>

          <button
            id="preset-httpbin"
            type="button"
            disabled={isScanning}
            onClick={() => handleSelectPreset('https://httpbin.org')}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono transition-colors cursor-pointer"
          >
            httpbin.org
          </button>

          <button
            id="preset-example"
            type="button"
            disabled={isScanning}
            onClick={() => handleSelectPreset('https://example.com')}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono transition-colors cursor-pointer"
          >
            example.com
          </button>
        </div>

        {/* Feature: Recent Searches (Last 5 scanned target URLs for quick access) */}
        {recentSearches.length > 0 && (
          <div
            id="recent-searches-container"
            className="pt-2.5 mt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-200"
          >
            <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
              <span className="text-xs text-slate-400 flex items-center gap-1 font-medium mr-1 select-none">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Recent Searches:</span>
              </span>

              {recentSearches.map((url, idx) => (
                <button
                  key={`recent-${url}-${idx}`}
                  id={`recent-search-${idx}`}
                  type="button"
                  disabled={isScanning}
                  onClick={() => handleSelectRecent(url)}
                  className="group px-2.5 py-1 rounded-lg bg-slate-950/90 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-200 text-xs font-mono transition-all flex items-center gap-1.5 max-w-[210px] truncate shadow-sm disabled:opacity-50 cursor-pointer"
                  title={`Click to re-scan: ${url}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 group-hover:bg-cyan-300 group-hover:scale-125 transition-transform flex-shrink-0"></span>
                  <span className="truncate">{url}</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </button>
              ))}
            </div>

            <button
              id="clear-recent-searches-btn"
              type="button"
              onClick={handleClearRecentSearches}
              className="text-[11px] text-slate-500 hover:text-rose-400 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-800/40 transition-colors cursor-pointer select-none"
              title="Clear stored recent target searches"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
        )}

        {/* Live scanning status ticker */}
        {isScanning && (
          <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-cyan-900/50 flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-ping absolute"></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
            </div>
            <div className="text-xs text-cyan-300 font-mono flex-1">
              {scanProgressText || 'AI Pen-Tester probing target headers, DNS records, and OWASP Top 10 vulnerabilities...'}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
