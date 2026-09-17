import React from 'react';
import { ScanResult } from '../types';
import { Shield, ShieldAlert, CheckCircle2, AlertTriangle, Globe, Lock, Unlock, Server, Wrench, Timer } from 'lucide-react';

interface ScoreCardProps {
  scan: ScanResult;
  onRemediateAll: () => Promise<void>;
  isRemediatingAll: boolean;
  onViewHeaders: () => void;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  scan,
  onRemediateAll,
  isRemediatingAll,
  onViewHeaders,
}) => {
  const { target, securityScore, riskGrade, stats } = scan;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30';
    if (score >= 75) return 'text-cyan-400 border-cyan-500/40 bg-cyan-950/30';
    if (score >= 60) return 'text-amber-400 border-amber-500/40 bg-amber-950/30';
    return 'text-rose-400 border-rose-500/40 bg-rose-950/30';
  };

  const getGradeBadge = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    if (grade === 'B') return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    if (grade === 'C') return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  };

  const unresolvedCount = stats.total - stats.resolved;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Target Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700">
            <Globe className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-white">{target.domain}</span>
              <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-slate-800 text-slate-400 border border-slate-700">
                {target.ipAddress || 'IP: Auto'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono truncate max-w-md">{target.normalizedUrl}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Protocol Badge */}
          <span className={`text-xs px-2.5 py-1 rounded-lg border font-mono flex items-center gap-1 ${
            target.isHttps
              ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/60 border-rose-800/60 text-rose-300'
          }`}>
            {target.isHttps ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            {target.isHttps ? 'HTTPS / TLS' : 'Plain HTTP (Insecure)'}
          </span>

          {/* Latency */}
          {target.responseTimeMs !== undefined && target.responseTimeMs > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 font-mono">
              ⚡ {target.responseTimeMs}ms
            </span>
          )}

          {/* Assessment Duration */}
          <span 
            id="scan-duration-badge"
            className="text-xs px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 font-mono flex items-center gap-1.5"
            title="Total End-to-End Penetration Assessment Duration"
          >
            <Timer className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Duration: <strong className="text-cyan-200">{scan.scanDurationMs ? `${(scan.scanDurationMs / 1000).toFixed(2)}s` : '1.85s'}</strong></span>
          </span>

          {/* Headers Inspector Trigger */}
          <button
            id="inspect-headers-btn"
            onClick={onViewHeaders}
            className="text-xs px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Server className="w-3 h-3" />
            <span>Raw Headers ({Object.keys(scan.headersInspected).length})</span>
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 items-stretch">
        {/* Security Score Meter */}
        <div className={`col-span-1 sm:col-span-2 p-4 rounded-xl border flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-4 text-center sm:text-left ${getScoreColor(securityScore)}`}>
          <div className="relative flex items-center justify-center w-20 h-20 shrink-0">
            {/* Circular score gauge */}
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                className="opacity-20"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={213.6}
                strokeDashoffset={213.6 - (213.6 * securityScore) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black font-mono leading-none">{securityScore}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 mt-0.5">/ 100</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Posture Score</span>
              <span className={`text-xs px-2 py-0.5 rounded font-black border uppercase ${getGradeBadge(riskGrade)}`}>
                Grade {riskGrade}
              </span>
            </div>
            <p className="text-sm font-semibold text-white">
              {securityScore >= 90 ? 'Hardened & Compliant' : securityScore >= 70 ? 'Moderate Protection' : 'Critical Exposure Detected'}
            </p>
            <p className="text-xs text-slate-400">
              {stats.resolved} of {stats.total} vulnerabilities remediated
            </p>
          </div>
        </div>

        {/* Severity Metrics Bento */}
        <div className="col-span-1 p-3 sm:p-3.5 rounded-xl bg-slate-950/60 border border-rose-900/40 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-rose-400 mb-1">
            <span className="font-semibold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> Critical
            </span>
            <span className="text-xs font-mono font-bold text-rose-300">{stats.critical}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-white">{stats.critical}</p>
          <span className="text-[10px] text-slate-500">Immediate threat</span>
        </div>

        <div className="col-span-1 p-3 sm:p-3.5 rounded-xl bg-slate-950/60 border border-amber-900/40 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-amber-400 mb-1">
            <span className="font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> High / Med
            </span>
            <span className="text-xs font-mono font-bold text-amber-300">{stats.high + stats.medium}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-white">{stats.high + stats.medium}</p>
          <span className="text-[10px] text-slate-500">{stats.high} High, {stats.medium} Med</span>
        </div>

        <div className="col-span-1 p-3 sm:p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Low / Info
            </span>
            <span className="text-xs font-mono font-bold text-slate-300">{stats.low + stats.info}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-white">{stats.low + stats.info}</p>
          <span className="text-[10px] text-slate-500">Hardening advice</span>
        </div>

        <div className="col-span-1 p-3 sm:p-3.5 rounded-xl bg-slate-950/60 border border-emerald-900/40 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
            <span className="font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
            </span>
            <span className="text-xs font-mono font-bold text-emerald-300">{stats.resolved}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">{stats.resolved}</p>
          <span className="text-[10px] text-emerald-500/80 font-medium">Mitigated & verified</span>
        </div>
      </div>

      {/* Batch Remediation Bar */}
      {unresolvedCount > 0 ? (
        <div className="p-3.5 bg-gradient-to-r from-cyan-950/60 via-blue-950/50 to-indigo-950/60 border border-cyan-800/60 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Wrench className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-xs sm:text-sm text-cyan-200">
              <strong className="text-white font-semibold">{unresolvedCount}</strong> vulnerabilities identified awaiting your remediation approval.
            </span>
          </div>

          <button
            id="remediate-all-btn"
            onClick={onRemediateAll}
            disabled={isRemediatingAll}
            className="w-full sm:w-auto px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs sm:text-sm transition-all shadow-md shadow-cyan-900/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isRemediatingAll ? (
              <span>Deploying Virtual Patches...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Remediate All ({unresolvedCount})</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center gap-2.5 text-xs sm:text-sm text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>All discovered vulnerabilities have been approved, mitigated, and verified with tamper-evident audit receipts!</span>
        </div>
      )}
    </div>
  );
};
