import React, { useState } from 'react';
import { Vulnerability } from '../types';
import { ShieldCheck, Check, X, Wrench, AlertTriangle, FileCode } from 'lucide-react';

interface RemediationModalProps {
  isOpen: boolean;
  onClose: () => void;
  vulnerability: Vulnerability | null;
  onConfirmRemediation: (vulnId: string, operatorName: string) => Promise<void>;
  isProcessing: boolean;
}

export const RemediationModal: React.FC<RemediationModalProps> = ({
  isOpen,
  onClose,
  vulnerability,
  onConfirmRemediation,
  isProcessing,
}) => {
  const [operatorName, setOperatorName] = useState('SecOps Lead (You)');

  if (!isOpen || !vulnerability) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirmRemediation(vulnerability.id, operatorName.trim() || 'SecOps Lead');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-950 border border-emerald-800 rounded-xl text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Approve & Deploy AI Remediation</h3>
              <p className="text-xs text-slate-400">Authorize automated patch injection and verification</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
          {/* Target Vulnerability Summary */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{vulnerability.title}</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                {vulnerability.severity.toUpperCase()}
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              {vulnerability.remediationPlan.explanation}
            </p>
          </div>

          {/* Strategy & Framework */}
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500 block">Remediation Strategy:</span>
              <span className="text-cyan-400 font-semibold truncate block">
                {vulnerability.remediationPlan.strategy}
              </span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500 block">Target Framework:</span>
              <span className="text-emerald-400 font-semibold uppercase block">
                {vulnerability.remediationPlan.framework}
              </span>
            </div>
          </div>

          {/* Patch Preview */}
          <div>
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              Automated Patch Payload to be Enforced:
            </span>
            <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto max-h-32">
              {vulnerability.remediationPlan.codeSnippet}
            </pre>
          </div>

          {/* Operator Sign-off Input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Approving Operator / Security Authority:
            </label>
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              placeholder="e.g. Jane Doe (SecOps Team)"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-cyan-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              This approval will be cryptographically signed into the immutable audit trail.
            </span>
          </div>

          {/* Verification Probe Notice */}
          <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs flex items-start gap-2">
            <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>
              Upon approval, the system will apply the remediation patch and execute automated verification ({vulnerability.remediationPlan.verificationStep}) to confirm the vulnerability is halted.
            </span>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              id="confirm-remediate-btn"
              type="submit"
              disabled={isProcessing}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg text-xs transition-all shadow-md shadow-emerald-950/50 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <span>Verifying & Mitigating...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Grant Approval & Remediate</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
