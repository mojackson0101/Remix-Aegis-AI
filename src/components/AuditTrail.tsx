import React, { useState, useMemo } from 'react';
import { AuditLogEntry, AuditCategory } from '../types';
import { 
  Terminal, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  Search, 
  Download, 
  Trash2, 
  Clock, 
  User, 
  Hash, 
  FileText,
  AlertCircle,
  Filter,
  Wrench,
  Server,
  Activity
} from 'lucide-react';

interface AuditTrailProps {
  logs: AuditLogEntry[];
  onClearLogs: () => Promise<void>;
  targetUrl?: string;
}

export const getLogCategory = (type: AuditLogEntry['type']): 'SCAN' | 'REMEDIATION' | 'SYSTEM' => {
  switch (type) {
    case 'SCAN_START':
    case 'VULN_DETECTED':
      return 'SCAN';
    case 'REMEDIATION_PROPOSED':
    case 'APPROVAL_GRANTED':
    case 'REMEDIATION_APPLIED':
    case 'RE_VERIFICATION_PASSED':
      return 'REMEDIATION';
    case 'AUDIT_EXPORTED':
    default:
      return 'SYSTEM';
  }
};

export const AuditTrail: React.FC<AuditTrailProps> = ({
  logs,
  onClearLogs,
  targetUrl,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AuditCategory>('ALL');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'SCAN_START' | 'VULN_DETECTED' | 'APPROVAL_GRANTED' | 'REMEDIATION_APPLIED' | 'RE_VERIFICATION_PASSED' | 'AUDIT_EXPORTED'>('ALL');

  // Category counts
  const categoryCounts = useMemo(() => {
    let scan = 0;
    let remediation = 0;
    let system = 0;
    logs.forEach((log) => {
      const cat = getLogCategory(log.type);
      if (cat === 'SCAN') scan++;
      else if (cat === 'REMEDIATION') remediation++;
      else system++;
    });
    return { all: logs.length, scan, remediation, system };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const category = getLogCategory(log.type);
      const matchesCategory = selectedCategory === 'ALL' || category === selectedCategory;
      const matchesFilter = selectedFilter === 'ALL' || log.type === selectedFilter;
      const matchesSearch = 
        log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesFilter && matchesSearch;
    });
  }, [logs, selectedCategory, selectedFilter, searchTerm]);

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `aegis-pentest-audit-trail-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getLogBadge = (type: AuditLogEntry['type']) => {
    switch (type) {
      case 'VULN_DETECTED':
        return {
          bg: 'bg-rose-950/80 text-rose-300 border-rose-800',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
          label: 'Vulnerability Detected',
        };
      case 'APPROVAL_GRANTED':
        return {
          bg: 'bg-indigo-950/80 text-indigo-300 border-indigo-800',
          icon: <User className="w-3.5 h-3.5 text-indigo-400" />,
          label: 'Approval Granted',
        };
      case 'REMEDIATION_APPLIED':
        return {
          bg: 'bg-cyan-950/80 text-cyan-300 border-cyan-800',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />,
          label: 'Remediation Applied',
        };
      case 'RE_VERIFICATION_PASSED':
        return {
          bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
          label: 'Re-Verification Passed',
        };
      case 'SCAN_START':
        return {
          bg: 'bg-blue-950/80 text-blue-300 border-blue-800',
          icon: <Terminal className="w-3.5 h-3.5 text-blue-400" />,
          label: 'Scan Initiated',
        };
      case 'AUDIT_EXPORTED':
        return {
          bg: 'bg-purple-950/80 text-purple-300 border-purple-800',
          icon: <Download className="w-3.5 h-3.5 text-purple-400" />,
          label: 'Audit Exported',
        };
      default:
        return {
          bg: 'bg-slate-900 text-slate-300 border-slate-700',
          icon: <FileText className="w-3.5 h-3.5 text-slate-400" />,
          label: type,
        };
    }
  };

  const getCategoryBadge = (category: 'SCAN' | 'REMEDIATION' | 'SYSTEM') => {
    switch (category) {
      case 'SCAN':
        return {
          label: 'Scan',
          color: 'bg-blue-950/80 text-blue-400 border-blue-800/80',
        };
      case 'REMEDIATION':
        return {
          label: 'Remediation',
          color: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80',
        };
      case 'SYSTEM':
      default:
        return {
          label: 'System',
          color: 'bg-purple-950/80 text-purple-400 border-purple-800/80',
        };
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            Immutable Audit Trail & Compliance Ledger
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Chronological, tamper-evident security operations log tracking probe events, detections, operator approvals, and automated patches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            disabled={logs.length === 0}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Log</span>
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Activity Category Filter:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              id="audit-cat-all-btn"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-950/50'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>All Activity</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                selectedCategory === 'ALL' ? 'bg-cyan-600 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
              }`}>
                {categoryCounts.all}
              </span>
            </button>

            <button
              id="audit-cat-scan-btn"
              onClick={() => setSelectedCategory('SCAN')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === 'SCAN'
                  ? 'bg-blue-500 text-white font-bold shadow-md shadow-blue-950/50'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
              <span>Scan ({categoryCounts.scan})</span>
            </button>

            <button
              id="audit-cat-remediation-btn"
              onClick={() => setSelectedCategory('REMEDIATION')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === 'REMEDIATION'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-950/50'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-emerald-400" />
              <span>Remediation ({categoryCounts.remediation})</span>
            </button>

            <button
              id="audit-cat-system-btn"
              onClick={() => setSelectedCategory('SYSTEM')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === 'SYSTEM'
                  ? 'bg-purple-500 text-white font-bold shadow-md shadow-purple-950/50'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Server className="w-3.5 h-3.5 text-purple-400" />
              <span>System ({categoryCounts.system})</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search audit trail by keyword, actor, or hash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Sub-type Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                selectedFilter === 'ALL'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setSelectedFilter('VULN_DETECTED')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                selectedFilter === 'VULN_DETECTED'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Detections
            </button>
            <button
              onClick={() => setSelectedFilter('APPROVAL_GRANTED')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                selectedFilter === 'APPROVAL_GRANTED'
                  ? 'bg-indigo-500 text-white font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Approvals
            </button>
            <button
              onClick={() => setSelectedFilter('REMEDIATION_APPLIED')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                selectedFilter === 'REMEDIATION_APPLIED'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Patches
            </button>
            <button
              onClick={() => setSelectedFilter('RE_VERIFICATION_PASSED')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                selectedFilter === 'RE_VERIFICATION_PASSED'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Verified
            </button>
          </div>
        </div>
      </div>

      {/* Log Feed */}
      <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400 font-medium">No audit records match your selected filters</p>
            <p className="text-xs text-slate-500">Try switching category tabs, clearing search keywords, or initiating a new assessment.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const badge = getLogBadge(log.type);
            const category = getLogCategory(log.type);
            const categoryBadge = getCategoryBadge(category);

            return (
              <div
                key={log.id}
                className="p-3 sm:p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition-all space-y-2 font-mono text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Category Tag */}
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-mono font-semibold uppercase tracking-wider ${categoryBadge.color}`}>
                      {categoryBadge.label}
                    </span>

                    {/* Action Type Badge */}
                    <span className={`text-xs px-2.5 py-0.5 rounded-md border font-semibold flex items-center gap-1.5 ${badge.bg}`}>
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>

                    <span className="font-semibold text-xs sm:text-sm text-white font-sans">{log.title}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-1 text-cyan-400/90">
                      <User className="w-3 h-3" />
                      {log.actor}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">{log.details}</p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-[11px] font-mono text-slate-400">
                  <span className="truncate max-w-xs">Target: <strong className="text-slate-300">{log.target}</strong></span>
                  <span className="flex items-center gap-1 text-slate-500 hover:text-slate-400 transition-colors">
                    <Hash className="w-3 h-3" />
                    <span>Receipt: <span className="text-cyan-400/80">{log.hash}</span></span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
