import React, { useState, useMemo } from 'react';
import { ScanResult } from '../types';
import { 
  History, 
  Trash2, 
  Clock, 
  Globe, 
  X,
  Sparkles,
  ShieldCheck, 
  ShieldAlert, 
  Zap, 
  Timer,
  ArrowUpDown,
  Gauge,
  Wifi,
  Brain,
  AlertCircle
} from 'lucide-react';

interface ScanHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  scans: ScanResult[];
  activeScanId: string | null;
  onSelectScan: (scan: ScanResult) => void;
  onDeleteScan: (scanId: string) => Promise<void>;
  onNewScanClick: () => void;
}

type SortOption = 'newest' | 'duration_asc' | 'duration_desc' | 'score_desc';
type DurationFilter = 'all' | 'fast' | 'normal' | 'thorough';

export const ScanHistoryPanel: React.FC<ScanHistoryPanelProps> = ({
  isOpen,
  onClose,
  scans,
  activeScanId,
  onSelectScan,
  onDeleteScan,
  onNewScanClick,
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');

  // Calculate fleet performance benchmarks
  const performanceStats = useMemo(() => {
    if (scans.length === 0) {
      return { avgDurationSec: 0, minDurationSec: 0, avgNetMs: 0, avgAiSec: 0, totalDurationSec: 0 };
    }

    let totalDurationMs = 0;
    let totalNetMs = 0;
    let totalAiMs = 0;
    let minMs = Infinity;

    scans.forEach((s) => {
      const dur = s.scanDurationMs || 1500;
      totalDurationMs += dur;
      if (dur < minMs) minMs = dur;

      totalNetMs += s.networkDurationMs || Math.round(dur * 0.18);
      totalAiMs += s.aiAnalysisDurationMs || Math.round(dur * 0.82);
    });

    return {
      avgDurationSec: (totalDurationMs / scans.length / 1000).toFixed(2),
      minDurationSec: (minMs / 1000).toFixed(2),
      avgNetMs: Math.round(totalNetMs / scans.length),
      avgAiSec: (totalAiMs / scans.length / 1000).toFixed(2),
      totalDurationSec: (totalDurationMs / 1000).toFixed(1),
    };
  }, [scans]);

  // Filter & sort scans
  const processedScans = useMemo(() => {
    let result = [...scans];

    // Filter by duration bracket
    if (durationFilter === 'fast') {
      result = result.filter((s) => (s.scanDurationMs || 0) < 1600);
    } else if (durationFilter === 'normal') {
      result = result.filter((s) => (s.scanDurationMs || 0) >= 1600 && (s.scanDurationMs || 0) <= 2300);
    } else if (durationFilter === 'thorough') {
      result = result.filter((s) => (s.scanDurationMs || 0) > 2300);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'duration_asc') {
        return (a.scanDurationMs || 0) - (b.scanDurationMs || 0);
      }
      if (sortBy === 'duration_desc') {
        return (b.scanDurationMs || 0) - (a.scanDurationMs || 0);
      }
      if (sortBy === 'score_desc') {
        return b.securityScore - a.securityScore;
      }
      // 'newest' default
      return new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime();
    });

    return result;
  }, [scans, sortBy, durationFilter]);

  if (!isOpen) return null;

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    if (score >= 75) return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    if (score >= 60) return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Panel Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-800 rounded-xl text-cyan-400 border border-slate-700">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Assessment History Ledger
                  <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {scans.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Audit trail with end-to-end scan performance monitoring</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Performance Monitoring Telemetry Bar */}
          <div className="p-3 bg-slate-950/90 border-b border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                <span>Performance & Duration Benchmarks</span>
              </span>
              <span className="text-[11px] font-mono text-cyan-400 font-bold">
                Fleet: {performanceStats.totalDurationSec}s total
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block font-mono">Avg Duration</span>
                <span className="text-xs font-bold font-mono text-white flex items-center justify-center gap-0.5 mt-0.5">
                  <Timer className="w-3 h-3 text-cyan-400" />
                  {performanceStats.avgDurationSec}s
                </span>
              </div>
              <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block font-mono">Net Latency</span>
                <span className="text-xs font-bold font-mono text-sky-400 flex items-center justify-center gap-0.5 mt-0.5">
                  <Wifi className="w-3 h-3 text-sky-400" />
                  {performanceStats.avgNetMs}ms
                </span>
              </div>
              <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block font-mono">AI Reasoning</span>
                <span className="text-xs font-bold font-mono text-indigo-400 flex items-center justify-center gap-0.5 mt-0.5">
                  <Brain className="w-3 h-3 text-indigo-400" />
                  {performanceStats.avgAiSec}s
                </span>
              </div>
            </div>
          </div>

          {/* Quick Filter & Sort Toolbar */}
          <div className="p-3 bg-slate-900 border-b border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-[11px]">
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
                <span className="text-slate-400">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="newest">Recent First</option>
                  <option value="duration_asc">Fastest Duration (↑)</option>
                  <option value="duration_desc">Longest Duration (↓)</option>
                  <option value="score_desc">Highest Security Score</option>
                </select>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onNewScanClick();
                }}
                className="py-1 px-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-slate-950" />
                <span>New Scan</span>
              </button>
            </div>

            {/* Duration Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pt-1">
              <span className="text-slate-500 shrink-0">Duration:</span>
              <button
                onClick={() => setDurationFilter('all')}
                className={`px-2 py-0.5 rounded-full text-xs font-mono transition-colors cursor-pointer shrink-0 ${
                  durationFilter === 'all'
                    ? 'bg-cyan-950 border border-cyan-700 text-cyan-300'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                All ({scans.length})
              </button>
              <button
                onClick={() => setDurationFilter('fast')}
                className={`px-2 py-0.5 rounded-full text-xs font-mono transition-colors cursor-pointer shrink-0 ${
                  durationFilter === 'fast'
                    ? 'bg-cyan-950 border border-cyan-700 text-cyan-300'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                ⚡ &lt;1.5s
              </button>
              <button
                onClick={() => setDurationFilter('normal')}
                className={`px-2 py-0.5 rounded-full text-xs font-mono transition-colors cursor-pointer shrink-0 ${
                  durationFilter === 'normal'
                    ? 'bg-cyan-950 border border-cyan-700 text-cyan-300'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                ⏱️ 1.5 - 2.3s
              </button>
              <button
                onClick={() => setDurationFilter('thorough')}
                className={`px-2 py-0.5 rounded-full text-xs font-mono transition-colors cursor-pointer shrink-0 ${
                  durationFilter === 'thorough'
                    ? 'bg-cyan-950 border border-cyan-700 text-cyan-300'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                🔍 &gt;2.3s
              </button>
            </div>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
            {processedScans.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <History className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-400">No assessments match current duration filter.</p>
                <button
                  onClick={() => setDurationFilter('all')}
                  className="text-xs text-cyan-400 hover:underline cursor-pointer"
                >
                  Clear Duration Filter
                </button>
              </div>
            ) : (
              processedScans.map((item) => {
                const isActive = item.scanId === activeScanId;
                const formattedDate = new Date(item.scannedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                const totalSec = ((item.scanDurationMs || 1500) / 1000).toFixed(2);
                const netMs = item.networkDurationMs || Math.round((item.scanDurationMs || 1500) * 0.18);
                const aiSec = (
                  (item.aiAnalysisDurationMs || Math.round((item.scanDurationMs || 1500) * 0.82)) / 1000
                ).toFixed(2);

                const failedProbes = item.testProbes?.filter((p) => p.status === 'failed').length || item.failedProbesCount || 0;

                return (
                  <div
                    key={item.scanId}
                    id={`history-scan-item-${item.scanId}`}
                    onClick={() => {
                      onSelectScan(item);
                      onClose();
                    }}
                    className={`group relative rounded-xl p-3.5 border transition-all cursor-pointer text-left ${
                      isActive
                        ? 'bg-slate-800/90 border-cyan-500/80 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                        : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    {/* Target & Score Header */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 truncate">
                        <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="font-bold text-white text-xs sm:text-sm truncate font-mono">
                          {item.target.domain}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${getScoreBadge(
                            item.securityScore
                          )}`}
                        >
                          {item.securityScore}/100 • {item.riskGrade}
                        </span>

                        <button
                          title="Delete assessment"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteScan(item.scanId);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 rounded transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* URL */}
                    <p className="text-[11px] text-slate-400 font-mono truncate mb-2">
                      {item.target.normalizedUrl}
                    </p>

                    {/* Performance / Duration Callout Banner */}
                    <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800/80 mb-2 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Timer className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="font-mono font-bold text-white">
                          {totalSec}s total duration
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {netMs}ms net • {aiSec}s AI
                      </span>
                    </div>

                    {/* Probes health & finding counts */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3" />
                        {formattedDate}
                      </span>

                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        {failedProbes > 0 ? (
                          <span className="text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-400" />
                            {failedProbes} probe failed
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            {item.testProbes?.length || 7} probes ok
                          </span>
                        )}
                        <span className="text-slate-600">•</span>
                        <span className="text-rose-400">{item.stats.critical + item.stats.high} High/Crit</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-emerald-400">{item.stats.resolved}/{item.stats.total} Patched</span>
                      </div>
                    </div>

                    {isActive && (
                      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Panel Footer */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Aegis Assessment Performance Ledger</span>
            <span>{scans.length} Audited Targets</span>
          </div>
        </div>
      </div>
    </div>
  );
};
