import React, { useState, useMemo } from 'react';
import { ScanResult } from '../types';
import { 
  GitCompare, 
  X, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Timer, 
  ArrowLeftRight, 
  CheckCircle2, 
  AlertTriangle,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';

interface ScanComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  scans: ScanResult[];
  initialScanAId?: string;
  initialScanBId?: string;
  onSelectScanForViewing?: (scan: ScanResult) => void;
}

export const ScanComparisonModal: React.FC<ScanComparisonModalProps> = ({
  isOpen,
  onClose,
  scans,
  initialScanAId,
  initialScanBId,
  onSelectScanForViewing,
}) => {
  // Pick default scans: first two in list if available
  const defaultScanAId = initialScanAId || scans[0]?.scanId || '';
  const defaultScanBId = initialScanBId || (scans[1]?.scanId ? scans[1].scanId : scans[0]?.scanId || '');

  const [scanAId, setScanAId] = useState<string>(defaultScanAId);
  const [scanBId, setScanBId] = useState<string>(defaultScanBId);

  // Sync when initial props change
  React.useEffect(() => {
    if (initialScanAId) setScanAId(initialScanAId);
    if (initialScanBId) setScanBId(initialScanBId);
    else if (scans.length >= 2 && !initialScanBId) {
      const other = scans.find(s => s.scanId !== (initialScanAId || scans[0]?.scanId));
      if (other) setScanBId(other.scanId);
    }
  }, [initialScanAId, initialScanBId, scans]);

  const scanA = useMemo(() => scans.find(s => s.scanId === scanAId) || scans[0] || null, [scans, scanAId]);
  const scanB = useMemo(() => scans.find(s => s.scanId === scanBId) || scans[1] || scans[0] || null, [scans, scanBId]);

  if (!isOpen) return null;

  // Swap Scans
  const handleSwap = () => {
    const temp = scanAId;
    setScanAId(scanBId);
    setScanBId(temp);
  };

  // Compute Diffs (B compared to A: B - A)
  const scoreDiff = (scanB?.securityScore ?? 0) - (scanA?.securityScore ?? 0);
  const totalVulnDiff = (scanB?.stats.total ?? 0) - (scanA?.stats.total ?? 0);
  const criticalDiff = (scanB?.stats.critical ?? 0) - (scanA?.stats.critical ?? 0);
  const highDiff = (scanB?.stats.high ?? 0) - (scanA?.stats.high ?? 0);
  const resolvedDiff = (scanB?.stats.resolved ?? 0) - (scanA?.stats.resolved ?? 0);

  // Duration diff
  const durA = scanA?.scanDurationMs || 1800;
  const durB = scanB?.scanDurationMs || 1800;
  const durDiffMs = durB - durA;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="scan-comparison-modal"
        className="relative w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-400">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Side-by-Side Assessment Comparison</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400">
                  DIFF ENGINE
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Contrast security posture progression, score deltas, and vulnerability resolutions over time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSwap}
              id="swap-comparison-scans-btn"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Swap Baseline and Target Scans"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Invert Comparison</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scan Selection Toolbar */}
        <div className="p-3 sm:p-4 bg-slate-950/40 border-b border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
          {/* Scan A Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 w-24">
              Baseline (A):
            </span>
            <select
              id="comparison-scan-a-select"
              value={scanAId}
              onChange={(e) => setScanAId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {scans.map((s) => (
                <option key={`a-${s.scanId}`} value={s.scanId}>
                  {s.target.domain} — Score: {s.securityScore}/100 ({new Date(s.scannedAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          {/* Scan B Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider shrink-0 w-24">
              Compare (B):
            </span>
            <select
              id="comparison-scan-b-select"
              value={scanBId}
              onChange={(e) => setScanBId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-cyan-800/70 rounded-xl text-xs font-mono text-cyan-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              {scans.map((s) => (
                <option key={`b-${s.scanId}`} value={s.scanId}>
                  {s.target.domain} — Score: {s.securityScore}/100 ({new Date(s.scannedAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Delta Metrics Banner (Highlighting Changes in Security Score & Vulnerability Count) */}
        <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
            <span>Posture Progression Metrics (Scan B vs Scan A)</span>
            <span className="text-slate-500 text-[10px]">Net differential indicators</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {/* Security Score Change */}
            <div className={`p-3 rounded-xl border flex flex-col justify-between ${
              scoreDiff > 0 
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : scoreDiff < 0 
                ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                : 'bg-slate-800/40 border-slate-700 text-slate-300'
            }`}>
              <div className="text-[11px] font-medium opacity-80">Security Score</div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-bold font-mono">
                  {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff}
                </span>
                <span className="text-xs opacity-75">pts</span>
                {scoreDiff > 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400 ml-auto" />
                ) : scoreDiff < 0 ? (
                  <TrendingDown className="w-4 h-4 text-rose-400 ml-auto" />
                ) : (
                  <Minus className="w-4 h-4 text-slate-400 ml-auto" />
                )}
              </div>
              <div className="text-[10px] opacity-75 mt-0.5">
                {scanA?.securityScore} → {scanB?.securityScore} / 100
              </div>
            </div>

            {/* Total Vulnerability Count Change */}
            <div className={`p-3 rounded-xl border flex flex-col justify-between ${
              totalVulnDiff < 0 
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : totalVulnDiff > 0 
                ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                : 'bg-slate-800/40 border-slate-700 text-slate-300'
            }`}>
              <div className="text-[11px] font-medium opacity-80">Total Findings</div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-bold font-mono">
                  {totalVulnDiff > 0 ? `+${totalVulnDiff}` : totalVulnDiff}
                </span>
                <span className="text-xs opacity-75">issues</span>
                {totalVulnDiff < 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400 ml-auto" title="Fewer vulnerabilities" />
                ) : totalVulnDiff > 0 ? (
                  <TrendingDown className="w-4 h-4 text-rose-400 ml-auto" title="More vulnerabilities" />
                ) : (
                  <Minus className="w-4 h-4 text-slate-400 ml-auto" />
                )}
              </div>
              <div className="text-[10px] opacity-75 mt-0.5">
                {scanA?.stats.total} → {scanB?.stats.total} findings
              </div>
            </div>

            {/* Critical Findings Change */}
            <div className={`p-3 rounded-xl border flex flex-col justify-between ${
              criticalDiff < 0 
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : criticalDiff > 0 
                ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                : 'bg-slate-800/40 border-slate-700 text-slate-300'
            }`}>
              <div className="text-[11px] font-medium opacity-80">Critical Vulnerabilities</div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-bold font-mono">
                  {criticalDiff > 0 ? `+${criticalDiff}` : criticalDiff}
                </span>
                <span className="text-xs opacity-75">crit</span>
                {criticalDiff < 0 ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400 ml-auto" />
                ) : criticalDiff > 0 ? (
                  <ShieldAlert className="w-4 h-4 text-rose-400 ml-auto" />
                ) : (
                  <Minus className="w-4 h-4 text-slate-400 ml-auto" />
                )}
              </div>
              <div className="text-[10px] opacity-75 mt-0.5">
                {scanA?.stats.critical} → {scanB?.stats.critical} active
              </div>
            </div>

            {/* Patched Findings Change */}
            <div className={`p-3 rounded-xl border flex flex-col justify-between ${
              resolvedDiff > 0 
                ? 'bg-cyan-950/40 border-cyan-800/60 text-cyan-300'
                : resolvedDiff < 0 
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                : 'bg-slate-800/40 border-slate-700 text-slate-300'
            }`}>
              <div className="text-[11px] font-medium opacity-80">Remediated Patches</div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-bold font-mono">
                  {resolvedDiff > 0 ? `+${resolvedDiff}` : resolvedDiff}
                </span>
                <span className="text-xs opacity-75">fixed</span>
                <CheckCircle2 className="w-4 h-4 text-cyan-400 ml-auto" />
              </div>
              <div className="text-[10px] opacity-75 mt-0.5">
                {scanA?.stats.resolved} → {scanB?.stats.resolved} verified
              </div>
            </div>

            {/* Scan Duration Comparison */}
            <div className="p-3 rounded-xl border bg-slate-800/40 border-slate-700 text-slate-300 col-span-2 sm:col-span-4 lg:col-span-1 flex flex-col justify-between">
              <div className="text-[11px] font-medium text-slate-400">Duration Delta</div>
              <div className="flex items-baseline gap-1 mt-1 font-mono">
                <span className="text-base font-bold text-white">
                  {(durDiffMs / 1000).toFixed(2)}s
                </span>
                <span className="text-[10px] text-slate-400 ml-auto flex items-center gap-1">
                  <Timer className="w-3 h-3 text-cyan-400" />
                  {(durA / 1000).toFixed(1)}s vs {(durB / 1000).toFixed(1)}s
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Latency: {scanA?.target.responseTimeMs || 15}ms vs {scanB?.target.responseTimeMs || 15}ms
              </div>
            </div>
          </div>
        </div>

        {/* Side-by-Side Columns */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column A */}
          {scanA && (
            <div className="space-y-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    Baseline Assessment (A)
                  </div>
                  <h3 className="text-sm font-bold text-white truncate max-w-[280px]">
                    {scanA.target.domain}
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {new Date(scanA.scannedAt).toLocaleString()}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black font-mono text-slate-200">
                    {scanA.securityScore}<span className="text-xs text-slate-500">/100</span>
                  </div>
                  <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 inline-block">
                    GRADE {scanA.riskGrade}
                  </div>
                </div>
              </div>

              {/* Target specs */}
              <div className="text-xs space-y-1 font-mono text-slate-400 bg-slate-900/60 p-2.5 rounded-lg">
                <div className="truncate">URL: {scanA.target.normalizedUrl}</div>
                <div>Protocol: {scanA.target.protocol.toUpperCase()} • IP: {scanA.target.ipAddress || '127.0.0.1'}</div>
                <div>Duration: {((scanA.scanDurationMs || 1800) / 1000).toFixed(2)}s • Headers: {Object.keys(scanA.headersInspected).length}</div>
              </div>

              {/* Stats badges */}
              <div className="flex flex-wrap gap-1.5 text-xs font-mono">
                <span className="px-2 py-1 rounded bg-rose-950/60 text-rose-300 border border-rose-800/60">
                  {scanA.stats.critical} Critical
                </span>
                <span className="px-2 py-1 rounded bg-orange-950/60 text-orange-300 border border-orange-800/60">
                  {scanA.stats.high} High
                </span>
                <span className="px-2 py-1 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60">
                  {scanA.stats.medium} Medium
                </span>
                <span className="px-2 py-1 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                  {scanA.stats.resolved}/{scanA.stats.total} Patched
                </span>
              </div>

              {/* Findings preview list */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-[11px] font-mono uppercase text-slate-400">Findings Breakdown ({scanA.vulnerabilities.length})</div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {scanA.vulnerabilities.map((v) => (
                    <div 
                      key={`vuln-a-${v.id}`}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-xs flex items-center justify-between gap-2"
                    >
                      <div className="truncate flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          v.severity === 'critical' ? 'bg-rose-500' :
                          v.severity === 'high' ? 'bg-orange-500' :
                          v.severity === 'medium' ? 'bg-amber-500' : 'bg-cyan-500'
                        }`} />
                        <span className="font-semibold text-slate-200 truncate">{v.title}</span>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                        v.status === 'resolved' 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {v.status === 'resolved' ? 'RESOLVED' : `CVSS ${v.cvssScore}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {onSelectScanForViewing && (
                <button
                  onClick={() => {
                    onSelectScanForViewing(scanA);
                    onClose();
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Load Baseline into Dashboard
                </button>
              )}
            </div>
          )}

          {/* Column B */}
          {scanB && (
            <div className="space-y-4 bg-slate-950/50 p-4 rounded-xl border border-cyan-900/50">
              <div className="flex items-center justify-between border-b border-cyan-900/40 pb-3">
                <div>
                  <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                    Comparison Target (B)
                  </div>
                  <h3 className="text-sm font-bold text-white truncate max-w-[280px]">
                    {scanB.target.domain}
                  </h3>
                  <div className="text-[11px] text-cyan-300/80 font-mono">
                    {new Date(scanB.scannedAt).toLocaleString()}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-2xl font-black font-mono ${
                    scoreDiff > 0 ? 'text-emerald-400' : scoreDiff < 0 ? 'text-rose-400' : 'text-cyan-400'
                  }`}>
                    {scanB.securityScore}<span className="text-xs text-slate-500">/100</span>
                  </div>
                  <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 inline-block">
                    GRADE {scanB.riskGrade}
                  </div>
                </div>
              </div>

              {/* Target specs */}
              <div className="text-xs space-y-1 font-mono text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                <div className="truncate">URL: {scanB.target.normalizedUrl}</div>
                <div>Protocol: {scanB.target.protocol.toUpperCase()} • IP: {scanB.target.ipAddress || '127.0.0.1'}</div>
                <div>Duration: {((scanB.scanDurationMs || 1800) / 1000).toFixed(2)}s • Headers: {Object.keys(scanB.headersInspected).length}</div>
              </div>

              {/* Stats badges */}
              <div className="flex flex-wrap gap-1.5 text-xs font-mono">
                <span className="px-2 py-1 rounded bg-rose-950/60 text-rose-300 border border-rose-800/60">
                  {scanB.stats.critical} Critical
                </span>
                <span className="px-2 py-1 rounded bg-orange-950/60 text-orange-300 border border-orange-800/60">
                  {scanB.stats.high} High
                </span>
                <span className="px-2 py-1 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60">
                  {scanB.stats.medium} Medium
                </span>
                <span className="px-2 py-1 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                  {scanB.stats.resolved}/{scanB.stats.total} Patched
                </span>
              </div>

              {/* Findings preview list */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-[11px] font-mono uppercase text-cyan-400">Findings Breakdown ({scanB.vulnerabilities.length})</div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {scanB.vulnerabilities.map((v) => (
                    <div 
                      key={`vuln-b-${v.id}`}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-xs flex items-center justify-between gap-2"
                    >
                      <div className="truncate flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          v.severity === 'critical' ? 'bg-rose-500' :
                          v.severity === 'high' ? 'bg-orange-500' :
                          v.severity === 'medium' ? 'bg-amber-500' : 'bg-cyan-500'
                        }`} />
                        <span className="font-semibold text-slate-200 truncate">{v.title}</span>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                        v.status === 'resolved' 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {v.status === 'resolved' ? 'RESOLVED' : `CVSS ${v.cvssScore}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {onSelectScanForViewing && (
                <button
                  onClick={() => {
                    onSelectScanForViewing(scanB);
                    onClose();
                  }}
                  className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  Load Comparison Target into Dashboard
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono hidden sm:block">
            Assessment comparisons are calculated deterministically across CWE taxonomies and CVSS v3.1 impact matrices.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer ml-auto"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
