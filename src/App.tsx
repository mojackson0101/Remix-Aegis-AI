import React, { useState, useEffect, useMemo } from 'react';
import { ScanResult, AuditLogEntry, Vulnerability } from './types';
import { Header } from './components/Header';
import { ScanBar } from './components/ScanBar';
import { ScoreCard } from './components/ScoreCard';
import { VulnerabilityCard } from './components/VulnerabilityCard';
import { AuditTrail } from './components/AuditTrail';
import { ReportsView } from './components/ReportsView';
import { RemediationModal } from './components/RemediationModal';
import { TargetInfoModal } from './components/TargetInfoModal';
import { ScanHistoryPanel } from './components/ScanHistoryPanel';
import { SecurityScoreTrendChart } from './components/SecurityScoreTrendChart';
import { NotificationConfigModal } from './components/NotificationConfigModal';
import { ScanComparisonModal } from './components/ScanComparisonModal';
import { ThreatIntelWidget } from './components/ThreatIntelWidget';
import { ArchitectureHeatmap, categorizeVulnerabilityToTier } from './components/ArchitectureHeatmap';
import { ProbeRetryManager } from './components/ProbeRetryManager';
import { ArchitectureTier } from './types';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Filter, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
  History,
  GitCompare,
  Bell,
  Grid3X3,
  Wifi,
  Tag
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'vulnerabilities' | 'audit' | 'report'>('dashboard');
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [scansHistory, setScansHistory] = useState<ScanResult[]>([]);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgressText, setScanProgressText] = useState('');
  const [hasGeminiKey, setHasGeminiKey] = useState(true);

  // Filters for vulnerabilities tab
  const [sevFilter, setSevFilter] = useState<'ALL' | 'critical' | 'high' | 'medium' | 'low'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'detected' | 'pending' | 'resolved'>('ALL');
  const [selectedTierFilter, setSelectedTierFilter] = useState<ArchitectureTier | 'ALL'>('ALL');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  // Modals state
  const [selectedVulnForRemediation, setSelectedVulnForRemediation] = useState<Vulnerability | null>(null);
  const [isRemediationModalOpen, setIsRemediationModalOpen] = useState(false);
  const [isProcessingRemediation, setIsProcessingRemediation] = useState(false);
  const [isRemediatingAll, setIsRemediatingAll] = useState(false);
  const [isHeadersModalOpen, setIsHeadersModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Health and Auto-polling state
  const [isAutoPolling, setIsAutoPolling] = useState(true);
  const [isServerOnline, setIsServerOnline] = useState(true);
  const [lastPolledAt, setLastPolledAt] = useState<Date | null>(null);
  const [isPollingActive, setIsPollingActive] = useState(false);

  // Focus target assessment input helper
  const handleTriggerTargetFocus = () => {
    const inputEl = document.getElementById('target-input-field') as HTMLInputElement | null;
    if (inputEl) {
      inputEl.focus();
      inputEl.select();
      inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Global keyboard shortcut: Cmd+K / Ctrl+K to jump to assessment input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleTriggerTargetFocus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Periodic Auto-Polling of server health
  useEffect(() => {
    if (!isAutoPolling) return;

    const pollHealth = async () => {
      try {
        setIsPollingActive(true);
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setIsServerOnline(true);
          setHasGeminiKey(Boolean(data.hasGeminiKey));
        } else {
          setIsServerOnline(false);
        }
      } catch {
        setIsServerOnline(false);
      } finally {
        setIsPollingActive(false);
        setLastPolledAt(new Date());
      }
    };

    // Poll every 5 seconds
    const interval = setInterval(pollHealth, 5000);
    return () => clearInterval(interval);
  }, [isAutoPolling]);

  // Fetch initial health, history, and latest scan on mount
  useEffect(() => {
    fetchHealthAndLatestScan();
  }, []);

  const fetchScansHistory = async () => {
    try {
      const res = await fetch('/api/scans');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.scans)) {
          setScansHistory(data.scans);
          return data.scans;
        }
      }
    } catch (e) {
      console.warn('Error fetching scan history:', e);
    }
    return [];
  };

  const fetchHealthAndLatestScan = async () => {
    try {
      const healthRes = await fetch('/api/health');
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHasGeminiKey(healthData.hasGeminiKey);
      }

      const history = await fetchScansHistory();

      const scanRes = await fetch('/api/scan/latest');
      if (scanRes.ok) {
        const scanData = await scanRes.json();
        if (scanData.scan) {
          setScan(scanData.scan);
        } else if (history.length > 0) {
          setScan(history[0]);
        }
      } else if (history.length > 0) {
        setScan(history[0]);
      }

      fetchAuditLogs();
    } catch (e) {
      console.warn('Initial load error:', e);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit-trail');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.logs)) {
          setAuditLogs(data.logs);
        }
      }
    } catch (e) {
      console.warn('Error fetching audit logs:', e);
    }
  };

  // Select scan from history
  const handleSelectScan = (selectedScan: ScanResult) => {
    setScan(selectedScan);
  };

  // Delete scan from history
  const handleDeleteScan = async (scanId: string) => {
    try {
      const res = await fetch(`/api/scan/${scanId}`, { method: 'DELETE' });
      if (res.ok) {
        setScansHistory((prev) => prev.filter((s) => s.scanId !== scanId));
        if (scan?.scanId === scanId) {
          const remaining = scansHistory.filter((s) => s.scanId !== scanId);
          setScan(remaining[0] || null);
        }
      }
    } catch (e) {
      console.warn('Error deleting scan:', e);
    }
  };

  // Perform AI Pen-Test
  const handleRunScan = async (targetInput: string) => {
    setIsScanning(true);
    setScanProgressText('Connecting to target and performing network handshake...');

    const stageTimer1 = setTimeout(() => {
      setScanProgressText('Analyzing HTTP/HTTPS response headers, TLS ciphers, and CORS policy...');
    }, 1200);

    const stageTimer2 = setTimeout(() => {
      setScanProgressText('Executing OWASP Top 10 threat modeling and vulnerability identification...');
    }, 2400);

    const stageTimer3 = setTimeout(() => {
      setScanProgressText('Gemini AI synthesizing root-cause diagnoses and executable remediation patches...');
    }, 3800);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetInput }),
      });

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Penetration test failed to reach target.');
        return;
      }

      const data = await res.json();
      setScan(data.scan);
      await fetchScansHistory();
      await fetchAuditLogs();
      setActiveTab('dashboard');
    } catch (err: any) {
      console.error('Scan error:', err);
      alert(`Scan encountered an error: ${err.message}`);
    } finally {
      setIsScanning(false);
      setScanProgressText('');
    }
  };

  // Approve and Remediate Single Vulnerability
  const handleOpenRemediationModal = (vulnId: string) => {
    if (!scan) return;
    const vuln = scan.vulnerabilities.find((v) => v.id === vulnId);
    if (vuln) {
      setSelectedVulnForRemediation(vuln);
      setIsRemediationModalOpen(true);
    }
  };

  const handleConfirmRemediation = async (vulnId: string, operatorName: string) => {
    setIsProcessingRemediation(true);
    try {
      const res = await fetch('/api/remediate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vulnerabilityId: vulnId, scanId: scan?.scanId, operatorName }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Failed to apply remediation.');
        return;
      }

      const data = await res.json();

      // Update state in place
      if (scan) {
        const updatedVulns = scan.vulnerabilities.map((v) =>
          v.id === vulnId ? data.vulnerability : v
        );
        const updatedScan: ScanResult = {
          ...scan,
          vulnerabilities: updatedVulns,
          securityScore: data.securityScore,
          riskGrade: data.riskGrade,
          stats: data.stats,
        };
        setScan(updatedScan);
        setScansHistory((prev) =>
          prev.map((s) => (s.scanId === updatedScan.scanId ? updatedScan : s))
        );
      }

      await fetchAuditLogs();
      setIsRemediationModalOpen(false);
      setSelectedVulnForRemediation(null);
    } catch (err: any) {
      alert(`Remediation failed: ${err.message}`);
    } finally {
      setIsProcessingRemediation(false);
    }
  };

  // Batch Remediate All Vulnerabilities
  const handleRemediateAll = async () => {
    if (!scan) return;
    setIsRemediatingAll(true);
    try {
      const res = await fetch('/api/remediate-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId: scan?.scanId, operatorName: 'SecOps Administrator' }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Batch remediation failed.');
        return;
      }

      const data = await res.json();
      setScan(data.scan);
      setScansHistory((prev) =>
        prev.map((s) => (s.scanId === data.scan.scanId ? data.scan : s))
      );
      await fetchAuditLogs();
    } catch (e: any) {
      alert(`Batch remediation error: ${e.message}`);
    } finally {
      setIsRemediatingAll(false);
    }
  };

  // Schedule Remediation for Future Execution
  const handleScheduleRemediation = async (
    vulnId: string,
    scheduledFor: string,
    reason = 'Off-peak maintenance window',
    operator = 'SecOps Lead'
  ) => {
    if (!scan) return;
    try {
      const res = await fetch('/api/schedule-remediation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vulnerabilityId: vulnId,
          scanId: scan.scanId,
          scheduledFor,
          scheduledReason: reason,
          operatorName: operator,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Failed to schedule remediation.');
        return;
      }

      const data = await res.json();
      const updatedVuln = data.vulnerability;
      const updatedVulns = scan.vulnerabilities.map((v) =>
        v.id === vulnId ? { ...v, ...updatedVuln } : v
      );
      const updatedScan: ScanResult = { ...scan, vulnerabilities: updatedVulns };
      setScan(updatedScan);
      setScansHistory((prev) =>
        prev.map((s) => (s.scanId === updatedScan.scanId ? updatedScan : s))
      );
      await fetchAuditLogs();
    } catch (err: any) {
      alert(`Scheduling error: ${err.message}`);
    }
  };

  // Cancel Scheduled Remediation
  const handleCancelScheduleRemediation = async (vulnId: string) => {
    if (!scan) return;
    try {
      const res = await fetch('/api/cancel-scheduled-remediation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vulnerabilityId: vulnId,
          scanId: scan.scanId,
          operatorName: 'SecOps Operator',
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Failed to cancel schedule.');
        return;
      }

      const updatedVulns = scan.vulnerabilities.map((v) => {
        if (v.id === vulnId) {
          const copy = { ...v, status: 'detected' as const };
          delete copy.scheduledFor;
          delete copy.scheduledAt;
          delete copy.scheduledReason;
          delete copy.scheduledBy;
          return copy;
        }
        return v;
      });
      const updatedScan: ScanResult = { ...scan, vulnerabilities: updatedVulns };
      setScan(updatedScan);
      setScansHistory((prev) =>
        prev.map((s) => (s.scanId === updatedScan.scanId ? updatedScan : s))
      );
      await fetchAuditLogs();
    } catch (err: any) {
      alert(`Error cancelling schedule: ${err.message}`);
    }
  };

  // Clear Audit Trail
  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear the audit log ledger?')) return;
    try {
      await fetch('/api/audit-trail/clear', { method: 'POST' });
      setAuditLogs([]);
    } catch (e) {
      console.warn('Error clearing logs:', e);
    }
  };

  // Update vulnerability categorization tags (e.g. DevOps, Compliance)
  const handleUpdateVulnerabilityTags = async (vulnId: string, tags: string[]) => {
    if (!scan) return;
    try {
      // Optimistic update in client state
      const updatedVulns = scan.vulnerabilities.map((v) =>
        v.id === vulnId ? { ...v, tags } : v
      );
      const updatedScan: ScanResult = { ...scan, vulnerabilities: updatedVulns };
      setScan(updatedScan);
      setScansHistory((prev) =>
        prev.map((s) => (s.scanId === updatedScan.scanId ? updatedScan : s))
      );

      // Persist categorization change to backend audit ledger
      const res = await fetch(`/api/vulnerability/${vulnId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: scan.scanId,
          tags,
          operatorName: 'SecOps Lead',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.scan) {
          setScan(data.scan);
        }
      }
      await fetchAuditLogs();
    } catch (err) {
      console.warn('Failed to update vulnerability tags:', err);
    }
  };

  // Collect all unique tags across findings for quick filtering
  const availableTags = useMemo(() => {
    const defaultCategories = ['DevOps', 'Compliance', 'Frontend', 'Backend', 'Infrastructure', 'Security'];
    const tagsSet = new Set<string>(defaultCategories);
    if (scan?.vulnerabilities) {
      for (const vuln of scan.vulnerabilities) {
        if (Array.isArray(vuln.tags)) {
          for (const t of vuln.tags) {
            if (t && t.trim()) tagsSet.add(t.trim());
          }
        }
      }
    }
    return Array.from(tagsSet);
  }, [scan]);

  // Scan update handler from probe retry or remediation
  const handleScanUpdated = (updatedScan: ScanResult) => {
    setScan(updatedScan);
    setScansHistory((prev) =>
      prev.map((s) => (s.scanId === updatedScan.scanId ? updatedScan : s))
    );
    fetchAuditLogs();
  };

  // Filtered vulnerabilities for lists (including tags, tiers, status, severity, and search)
  const filteredVulnerabilities = (scan?.vulnerabilities || []).filter((v) => {
    const matchesSev = sevFilter === 'ALL' || v.severity === sevFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'detected' && v.status === 'detected') ||
      (statusFilter === 'pending' && (v.status === 'pending' || Boolean(v.scheduledFor && v.status !== 'resolved'))) ||
      (statusFilter === 'resolved' && v.status === 'resolved');
    const matchesTier =
      selectedTierFilter === 'ALL' || categorizeVulnerabilityToTier(v) === selectedTierFilter;
    const matchesTag =
      selectedTagFilter === 'ALL' ||
      (Array.isArray(v.tags) && v.tags.some((t) => t.toLowerCase() === selectedTagFilter.toLowerCase()));
    const matchesSearch =
      v.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      v.cwe.toLowerCase().includes(searchFilter.toLowerCase()) ||
      v.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
      v.rootCause.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (Array.isArray(v.tags) && v.tags.some((t) => t.toLowerCase().includes(searchFilter.toLowerCase())));
    return matchesSev && matchesStatus && matchesTier && matchesTag && matchesSearch;
  });

  const totalVulns = scan?.vulnerabilities.length || 0;
  const resolvedCount = scan?.vulnerabilities.filter((v) => v.status === 'resolved').length || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasGeminiKey={hasGeminiKey}
        totalVulns={totalVulns}
        resolvedCount={resolvedCount}
        scansHistory={scansHistory}
        currentScan={scan}
        onSelectScan={handleSelectScan}
        onOpenHistoryPanel={() => setIsHistoryPanelOpen(true)}
        isAutoPolling={isAutoPolling}
        onToggleAutoPolling={() => setIsAutoPolling((prev) => !prev)}
        isServerOnline={isServerOnline}
        lastPolledAt={lastPolledAt}
        isPollingActive={isPollingActive}
        onTriggerTargetFocus={handleTriggerTargetFocus}
        onOpenNotificationConfig={() => setIsNotificationModalOpen(true)}
        onOpenCompare={() => setIsCompareModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Target Assessment Console (Always Accessible) */}
        <ScanBar
          onScan={handleRunScan}
          isScanning={isScanning}
          scanProgressText={scanProgressText}
        />

        {/* Tab 1: Dashboard / Overview */}
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in duration-200">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
              {/* Main Dashboard Column */}
              <div className="xl:col-span-8 space-y-4 sm:space-y-6">
                {scan ? (
                  <>
                    {/* Posture Operations Bar: Compare Scans & Incident Notifications */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <span className="font-semibold text-white">Posture Fleet Operations:</span>
                        <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
                          {scansHistory.length} historical assessments recorded
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {scansHistory.length >= 2 && (
                          <button
                            id="dashboard-compare-scans-btn"
                            onClick={() => setIsCompareModalOpen(true)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-700/60 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                            title="Display two selected scan results side-by-side, highlighting changes in security score and total vulnerability count"
                          >
                            <GitCompare className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Compare Recent Scans</span>
                          </button>
                        )}

                        <button
                          id="dashboard-notification-btn"
                          onClick={() => setIsNotificationModalOpen(true)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Configure automated webhook or email alerts whenever a critical vulnerability is detected"
                        >
                          <Bell className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Incident Alerts</span>
                        </button>
                      </div>
                    </div>

                    {/* Security Score and High-Level Metrics */}
                    <ScoreCard
                      scan={scan}
                      onRemediateAll={handleRemediateAll}
                      isRemediatingAll={isRemediatingAll}
                      onViewHeaders={() => setIsHeadersModalOpen(true)}
                    />

                    {/* Target Network Test Probes & Diagnostic Retry Engine */}
                    <ProbeRetryManager
                      scan={scan}
                      onScanUpdated={handleScanUpdated}
                    />

                    {/* Target Architecture Vulnerability Density Heatmap */}
                    <ArchitectureHeatmap
                      scan={scan}
                      onSelectVulnerability={(vuln) => {
                        handleOpenRemediationModal(vuln);
                      }}
                      onFilterByTier={(tier) => {
                        setSelectedTierFilter(tier);
                        setActiveTab('vulnerabilities');
                      }}
                    />

                    {/* Section: Security Score Trends across previous scans using recharts */}
                    <SecurityScoreTrendChart
                      scans={scansHistory}
                      currentScan={scan}
                      onSelectScan={handleSelectScan}
                      onOpenHistoryPanel={() => setIsHistoryPanelOpen(true)}
                    />

                    {/* Executive Summary & Findings Preview */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                        <div>
                          <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            Penetration Test Findings & Remediation Advice
                          </h3>
                          <p className="text-xs text-slate-400">
                            Review root causes, simulate what-if posture gains, and approve or schedule hardening patches.
                          </p>
                        </div>

                        <button
                          onClick={() => setActiveTab('vulnerabilities')}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                        >
                          <span>Explore all {scan.vulnerabilities.length} findings →</span>
                        </button>
                      </div>

                      {/* Vulnerability Cards List */}
                      <div className="space-y-3 sm:space-y-3.5">
                        {scan.vulnerabilities.map((vuln) => (
                          <VulnerabilityCard
                            key={vuln.id}
                            vulnerability={vuln}
                            onApproveRemediation={handleOpenRemediationModal}
                            isRemediating={isProcessingRemediation}
                            currentScore={scan.securityScore}
                            currentGrade={scan.riskGrade}
                            onScheduleRemediation={handleScheduleRemediation}
                            onCancelSchedule={handleCancelScheduleRemediation}
                            onUpdateTags={handleUpdateVulnerabilityTags}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Welcome / Empty State */
                  <div className="space-y-6">
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center shadow-xl space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center mx-auto text-cyan-400 shadow-lg shadow-cyan-950/40">
                        <ShieldAlert className="w-8 h-8" />
                      </div>
                      <div className="space-y-1 max-w-lg mx-auto">
                        <h3 className="text-lg sm:text-xl font-bold text-white">
                          Aegis AI Penetration Testing & Remediation
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                          Provide any URL, IP, or domain name in the console above to begin passive security assessment, OWASP Top 10 analysis, root-cause diagnosis, and automated patch resolution.
                        </p>
                      </div>

                      <div className="pt-2 flex flex-wrap justify-center gap-3">
                        <button
                          onClick={() => handleRunScan('localhost/api/demo-target')}
                          className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-rose-950/50 flex items-center gap-2 cursor-pointer"
                        >
                          <span>Launch Audit on In-App Vulnerable Target</span>
                        </button>
                        {scansHistory.length > 0 && (
                          <button
                            onClick={() => setIsHistoryPanelOpen(true)}
                            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold rounded-xl text-xs sm:text-sm transition-all border border-slate-700 flex items-center gap-2 cursor-pointer"
                          >
                            <History className="w-4 h-4 text-cyan-400" />
                            <span>Browse Past Assessments ({scansHistory.length})</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {scansHistory.length > 0 && (
                      <SecurityScoreTrendChart
                        scans={scansHistory}
                        currentScan={scan}
                        onSelectScan={handleSelectScan}
                        onOpenHistoryPanel={() => setIsHistoryPanelOpen(true)}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Dynamic Cybersecurity Threat Intelligence Sidebar Widget */}
              <div className="xl:col-span-4 sticky top-6">
                <ThreatIntelWidget
                  targetDomain={scan?.target.domain}
                  onSearchInFindings={(query) => {
                    setSearchFilter(query);
                    setActiveTab('vulnerabilities');
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Vulnerabilities Explorer */}
        {activeTab === 'vulnerabilities' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {scan ? (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
                {/* Explorer Controls */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-cyan-400" />
                      Vulnerability & Remediation Manager
                    </h3>
                    <p className="text-xs text-slate-400">
                      Showing {filteredVulnerabilities.length} of {scan.vulnerabilities.length} vulnerabilities for {scan.target.domain}
                    </p>
                  </div>

                  {/* Quick Remediate All */}
                  {resolvedCount < totalVulns && (
                    <button
                      onClick={handleRemediateAll}
                      disabled={isRemediatingAll}
                      className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Remediate All ({totalVulns - resolvedCount})</span>
                    </button>
                  )}
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter by title, CWE, category, or root cause..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* Severity Filters */}
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                      {(['ALL', 'critical', 'high', 'medium', 'low'] as const).map((sev) => (
                        <button
                          key={sev}
                          onClick={() => setSevFilter(sev)}
                          className={`px-2 py-0.5 rounded capitalize text-[11px] font-medium transition-colors ${
                            sevFilter === sev
                              ? 'bg-slate-800 text-cyan-400 font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>

                    {/* Status Filters */}
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                      {(['ALL', 'detected', 'pending', 'resolved'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setStatusFilter(st)}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                            statusFilter === st
                              ? 'bg-slate-800 text-cyan-400 font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {st === 'ALL' ? 'All Status' : st === 'detected' ? 'Active Risk' : st === 'pending' ? 'Scheduled (Pending)' : 'Resolved'}
                        </button>
                      ))}
                    </div>

                    {/* Architecture Tier Filter */}
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                      <select
                        id="architecture-tier-filter-select"
                        value={selectedTierFilter}
                        onChange={(e) => setSelectedTierFilter(e.target.value as any)}
                        className="bg-transparent text-slate-300 text-[11px] font-medium px-1.5 py-0.5 focus:outline-none cursor-pointer"
                      >
                        <option value="ALL" className="bg-slate-900 text-white">All Architecture Tiers</option>
                        <option value="edge_proxy" className="bg-slate-900 text-white">Edge Proxy & TLS</option>
                        <option value="auth_gateway" className="bg-slate-900 text-white">Identity & Auth Gateway</option>
                        <option value="api_routing" className="bg-slate-900 text-white">API Gateway & CORS</option>
                        <option value="client_browser" className="bg-slate-900 text-white">Client & Browser (CSP)</option>
                        <option value="app_server" className="bg-slate-900 text-white">Application Server</option>
                        <option value="data_storage" className="bg-slate-900 text-white">Data Storage</option>
                      </select>
                      {selectedTierFilter !== 'ALL' && (
                        <button
                          onClick={() => setSelectedTierFilter('ALL')}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold px-1 cursor-pointer"
                          title="Clear tier filter"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Department / Project Tag Filter Dropdown */}
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                      <Tag className="w-3.5 h-3.5 text-cyan-400 ml-1 flex-shrink-0" />
                      <select
                        id="vulnerability-tag-filter-select"
                        value={selectedTagFilter}
                        onChange={(e) => setSelectedTagFilter(e.target.value)}
                        className="bg-transparent text-slate-300 text-[11px] font-medium px-1.5 py-0.5 focus:outline-none cursor-pointer"
                        title="Filter findings by Project or Department (e.g. DevOps, Compliance)"
                      >
                        <option value="ALL" className="bg-slate-900 text-white">All Dept & Project Tags</option>
                        {availableTags.map((tag) => (
                          <option key={tag} value={tag} className="bg-slate-900 text-white">
                            🏷️ {tag}
                          </option>
                        ))}
                      </select>
                      {selectedTagFilter !== 'ALL' && (
                        <button
                          id="clear-tag-filter-btn"
                          onClick={() => setSelectedTagFilter('ALL')}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold px-1 cursor-pointer"
                          title="Clear tag filter"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick Tag Filter Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/60">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium mr-1 select-none">
                      <Tag className="w-3 h-3 text-cyan-400" />
                      <span>Filter by Department / Project:</span>
                    </span>
                    <button
                      id="tag-filter-chip-all"
                      onClick={() => setSelectedTagFilter('ALL')}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                        selectedTagFilter === 'ALL'
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      All Findings ({scan.vulnerabilities.length})
                    </button>
                    {availableTags.map((tag) => {
                      const count = scan.vulnerabilities.filter((v) =>
                        Array.isArray(v.tags) && v.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
                      ).length;
                      const isSelected = selectedTagFilter.toLowerCase() === tag.toLowerCase();
                      return (
                        <button
                          key={`filter-chip-${tag}`}
                          id={`tag-filter-chip-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                          onClick={() => setSelectedTagFilter(isSelected ? 'ALL' : tag)}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer font-mono ${
                            isSelected
                              ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                              : 'bg-slate-950 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/50'
                          }`}
                        >
                          <span>{tag}</span>
                          <span
                            className={`text-[10px] px-1 rounded-full ${
                              isSelected
                                ? 'bg-slate-950/25 text-slate-950 font-bold'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cards */}
                <div className="space-y-4">
                  {filteredVulnerabilities.length === 0 ? (
                    <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                      <p className="text-sm text-slate-400">No vulnerabilities match your selected filters.</p>
                      <button
                        onClick={() => {
                          setSevFilter('ALL');
                          setStatusFilter('ALL');
                          setSelectedTierFilter('ALL');
                          setSelectedTagFilter('ALL');
                          setSearchFilter('');
                        }}
                        className="text-xs text-cyan-400 hover:underline cursor-pointer"
                      >
                        Reset all filters
                      </button>
                    </div>
                  ) : (
                    filteredVulnerabilities.map((vuln) => (
                      <VulnerabilityCard
                        key={vuln.id}
                        vulnerability={vuln}
                        onApproveRemediation={handleOpenRemediationModal}
                        isRemediating={isProcessingRemediation}
                        currentScore={scan.securityScore}
                        currentGrade={scan.riskGrade}
                        onScheduleRemediation={handleScheduleRemediation}
                        onCancelSchedule={handleCancelScheduleRemediation}
                        onUpdateTags={handleUpdateVulnerabilityTags}
                      />
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center shadow-xl space-y-3">
                <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">No Vulnerabilities to Display</h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
                  Scan a website or test the built-in vulnerable endpoint to explore identified vulnerabilities.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Audit Trail */}
        {activeTab === 'audit' && (
          <div className="animate-in fade-in duration-200">
            <AuditTrail
              logs={auditLogs}
              onClearLogs={handleClearLogs}
              targetUrl={scan?.target.normalizedUrl}
            />
          </div>
        )}

        {/* Tab 4: Reports */}
        {activeTab === 'report' && (
          <div className="animate-in fade-in duration-200">
            <ReportsView scan={scan} auditLogs={auditLogs} />
          </div>
        )}
      </main>

      {/* Side Panel: Scan History Ledger */}
      <ScanHistoryPanel
        isOpen={isHistoryPanelOpen}
        onClose={() => setIsHistoryPanelOpen(false)}
        scans={scansHistory}
        activeScanId={scan?.scanId || null}
        onSelectScan={handleSelectScan}
        onDeleteScan={handleDeleteScan}
        onNewScanClick={() => {
          setActiveTab('dashboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Remediation Approval Modal Dialog */}
      <RemediationModal
        isOpen={isRemediationModalOpen}
        onClose={() => {
          setIsRemediationModalOpen(false);
          setSelectedVulnForRemediation(null);
        }}
        vulnerability={selectedVulnForRemediation}
        onConfirmRemediation={handleConfirmRemediation}
        isProcessing={isProcessingRemediation}
      />

      {/* Raw Headers & Telemetry Modal */}
      {scan && (
        <TargetInfoModal
          isOpen={isHeadersModalOpen}
          onClose={() => setIsHeadersModalOpen(false)}
          target={scan.target}
          headers={scan.headersInspected}
          rawFindings={scan.rawFindings}
        />
      )}

      {/* Automated Incident Notification Configuration Modal */}
      <NotificationConfigModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />

      {/* Side-by-Side Scan Comparison Modal */}
      <ScanComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        scans={scansHistory}
        initialScanAId={scan?.scanId}
        onSelectScanForViewing={handleSelectScan}
      />
    </div>
  );
}
