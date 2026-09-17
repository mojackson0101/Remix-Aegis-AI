import React, { useState } from 'react';
import { 
  Activity, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Clock, 
  Wifi, 
  ShieldCheck, 
  Zap, 
  RefreshCw,
  Server,
  Lock,
  FileCode,
  Terminal,
  Info
} from 'lucide-react';
import { ScanResult, TestProbe } from '../types';

interface ProbeRetryManagerProps {
  scan: ScanResult;
  onScanUpdated: (updatedScan: ScanResult) => void;
}

export const ProbeRetryManager: React.FC<ProbeRetryManagerProps> = ({
  scan,
  onScanUpdated,
}) => {
  const [retryingProbeId, setRetryingProbeId] = useState<string | null>(null);
  const [isRetryingAll, setIsRetryingAll] = useState(false);
  const [isSimulatingFailure, setIsSimulatingFailure] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const probes: TestProbe[] = scan.testProbes || [];
  const failedProbes = probes.filter((p) => p.status === 'failed');
  const warningProbes = probes.filter((p) => p.status === 'warning');
  const passedProbes = probes.filter((p) => p.status === 'success');

  // Show temporary feedback toast
  const showFeedback = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4500);
  };

  // Trigger retry for a single probe or all failed probes
  const handleRetryProbe = async (probeId: string) => {
    try {
      if (probeId === 'all-failed') {
        setIsRetryingAll(true);
      } else {
        setRetryingProbeId(probeId);
      }

      const res = await fetch(`/api/scan/${scan.scanId}/retry-probe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          probeId,
          operatorName: 'SecOps Automated Diagnostics',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to re-scan probe');
      }

      const data = await res.json();
      if (data.scan) {
        onScanUpdated(data.scan);
        showFeedback(data.message || 'Probe re-scan completed successfully.', 'success');
      }
    } catch (err: any) {
      showFeedback(`Re-scan failed: ${err.message}`, 'error');
    } finally {
      setRetryingProbeId(null);
      setIsRetryingAll(false);
    }
  };

  // Simulate network probe failure to verify retry resilience
  const handleSimulateFailure = async () => {
    try {
      setIsSimulatingFailure(true);
      const res = await fetch(`/api/scan/${scan.scanId}/simulate-probe-failure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          probeId: 'probe-tls',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to simulate failure');
      }

      const data = await res.json();
      if (data.scan) {
        onScanUpdated(data.scan);
        showFeedback('Injected simulated TLS connection timeout. You can now trigger a re-scan.', 'info');
      }
    } catch (err: any) {
      showFeedback(`Simulation error: ${err.message}`, 'error');
    } finally {
      setIsSimulatingFailure(false);
    }
  };

  const getProbeIcon = (category: string) => {
    switch (category) {
      case 'dns':
        return Activity;
      case 'tls':
        return Lock;
      case 'headers':
      case 'cors':
        return Terminal;
      case 'auth':
        return ShieldCheck;
      default:
        return Server;
    }
  };

  return (
    <div id="probe-retry-manager-container" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-sky-950 to-indigo-900/60 border border-sky-800/60 rounded-xl text-sky-400">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                Network Test Probes & Diagnostic Retry Engine
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {probes.length} Probes Executed
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Granular inspection of individual network handshake probes with on-demand probe re-scanning
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            id="simulate-probe-failure-btn"
            onClick={handleSimulateFailure}
            disabled={isSimulatingFailure || isRetryingAll}
            className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Inject a test network drop to demo the re-scan retry mechanism"
          >
            {isSimulatingFailure ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>Simulate Probe Failure</span>
          </button>

          {failedProbes.length > 0 && (
            <button
              id="retry-all-failed-probes-btn"
              onClick={() => handleRetryProbe('all-failed')}
              disabled={isRetryingAll || retryingProbeId !== null}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-950 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isRetryingAll ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>Re-scan Failed Probes ({failedProbes.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Message Banner */}
      {feedbackMessage && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
              : feedbackMessage.type === 'error'
              ? 'bg-rose-950/80 border-rose-800 text-rose-200'
              : 'bg-sky-950/80 border-sky-800 text-sky-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {feedbackMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {feedbackMessage.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Warning Banner when failed probes exist */}
      {failedProbes.length > 0 && (
        <div className="p-3.5 bg-rose-950/40 border border-rose-800/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-xs sm:text-sm text-rose-200 block">
                {failedProbes.length} Network Test Probe{failedProbes.length > 1 ? 's' : ''} Encountered Execution Failure
              </span>
              <p className="text-xs text-rose-300/80 mt-0.5">
                Target endpoint either refused connection, timed out, or reset the transport handshake. You can re-execute individual failed probes without restarting the entire assessment.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleRetryProbe('all-failed')}
            disabled={isRetryingAll}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            {isRetryingAll ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Re-scan All Failed</span>
          </button>
        </div>
      )}

      {/* Probes Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">Total Probes</span>
          <span className="text-base font-bold font-mono text-white">{probes.length}</span>
        </div>
        <div className="p-2.5 bg-slate-950/60 border border-emerald-900/40 rounded-xl">
          <span className="text-[10px] font-mono text-emerald-400 block uppercase">Passed Probes</span>
          <span className="text-base font-bold font-mono text-emerald-400">{passedProbes.length}</span>
        </div>
        <div className="p-2.5 bg-slate-950/60 border border-amber-900/40 rounded-xl">
          <span className="text-[10px] font-mono text-amber-400 block uppercase">Warnings / Findings</span>
          <span className="text-base font-bold font-mono text-amber-400">{warningProbes.length}</span>
        </div>
        <div className="p-2.5 bg-slate-950/60 border border-rose-900/40 rounded-xl">
          <span className="text-[10px] font-mono text-rose-400 block uppercase">Failed Probes</span>
          <span className="text-base font-bold font-mono text-rose-400">{failedProbes.length}</span>
        </div>
      </div>

      {/* Probes Detailed Ledger */}
      <div className="space-y-2">
        {probes.map((probe) => {
          const Icon = getProbeIcon(probe.category);
          const isRetrying = retryingProbeId === probe.id || isRetryingAll;

          return (
            <div
              key={probe.id}
              id={`probe-card-${probe.id}`}
              className={`p-3 rounded-xl border transition-all ${
                probe.status === 'failed'
                  ? 'bg-rose-950/25 border-rose-800/80 hover:border-rose-700'
                  : probe.status === 'warning'
                  ? 'bg-amber-950/15 border-amber-800/60 hover:border-amber-700'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                {/* Probe Title & Category */}
                <div className="flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-lg mt-0.5 border ${
                    probe.status === 'failed'
                      ? 'bg-rose-950/80 border-rose-700 text-rose-400'
                      : probe.status === 'warning'
                      ? 'bg-amber-950/80 border-amber-700 text-amber-400'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">{probe.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-cyan-400">
                        {probe.method}
                      </span>
                      {probe.retryCount && probe.retryCount > 0 ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 border border-indigo-800 text-indigo-300">
                          Retry #{probe.retryCount}
                        </span>
                      ) : null}
                    </div>

                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {probe.details || `Probe category: ${probe.category.toUpperCase()}`}
                    </p>

                    {probe.errorMessage && (
                      <div className="mt-1 p-1.5 rounded bg-rose-950/60 border border-rose-900/80 text-[11px] font-mono text-rose-300 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span>{probe.errorMessage}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status, Latency & Re-scan Button */}
                <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                  {/* Latency badge */}
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {probe.latencyMs}ms
                  </span>

                  {/* Status Indicator */}
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                    probe.status === 'success'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : probe.status === 'failed'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}>
                    {probe.status}
                  </span>

                  {/* Re-scan Button */}
                  <button
                    id={`retry-probe-btn-${probe.id}`}
                    onClick={() => handleRetryProbe(probe.id)}
                    disabled={isRetrying}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                      probe.status === 'failed'
                        ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-950'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                    title="Re-execute this network test probe"
                  >
                    <RotateCw className={`w-3 h-3 ${isRetrying ? 'animate-spin text-cyan-400' : ''}`} />
                    <span>{isRetrying ? 'Scanning...' : 'Re-scan'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
