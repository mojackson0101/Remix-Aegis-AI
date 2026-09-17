import React from 'react';
import { TargetMetadata } from '../types';
import { X, Server, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

interface TargetInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: TargetMetadata;
  headers: Record<string, string>;
  rawFindings: string[];
}

export const TargetInfoModal: React.FC<TargetInfoModalProps> = ({
  isOpen,
  onClose,
  target,
  headers,
  rawFindings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-800 rounded-lg text-cyan-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Target Telemetry & Raw Headers</h3>
              <p className="text-xs text-slate-400 font-mono">{target.normalizedUrl}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Diagnostic Probes */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-cyan-400" />
              Observed Diagnostic Probes
            </h4>
            <div className="space-y-1.5">
              {rawFindings.length === 0 ? (
                <div className="p-3 bg-emerald-950/30 border border-emerald-800/60 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>No primary header defects observed during initial socket probe.</span>
                </div>
              ) : (
                rawFindings.map((finding, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-slate-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{finding}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Raw HTTP Response Headers */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-cyan-400" />
              Raw Received HTTP Response Headers ({Object.keys(headers).length})
            </h4>
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 max-h-64 overflow-y-auto font-mono text-xs space-y-1">
              {Object.keys(headers).length === 0 ? (
                <span className="text-slate-500">No response headers captured.</span>
              ) : (
                Object.entries(headers).map(([key, val]) => (
                  <div key={key} className="flex items-start gap-2 py-0.5 border-b border-slate-900/60 last:border-0">
                    <span className="text-cyan-400 font-semibold shrink-0 select-all">{key}:</span>
                    <span className="text-slate-300 break-all select-all">{val}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
