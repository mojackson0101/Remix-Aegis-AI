import React, { useState, useEffect } from 'react';
import { NotificationConfig } from '../types';
import { 
  Bell, 
  X, 
  Send, 
  Check, 
  AlertCircle, 
  Webhook, 
  Mail, 
  ShieldAlert, 
  Sliders,
  ExternalLink,
  HelpCircle,
  Loader2
} from 'lucide-react';

interface NotificationConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationSaved?: (config: NotificationConfig) => void;
}

export const NotificationConfigModal: React.FC<NotificationConfigModalProps> = ({
  isOpen,
  onClose,
  onNotificationSaved,
}) => {
  const [config, setConfig] = useState<NotificationConfig>({
    enabled: false,
    webhookUrl: '',
    webhookFormat: 'generic',
    emailAddress: '',
    notifyOnCriticalOnly: true,
    notifyOnScanComplete: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch current config on open
  useEffect(() => {
    if (!isOpen) return;

    const fetchConfig = async () => {
      setIsLoading(true);
      setTestResult(null);
      setSaveSuccess(false);
      try {
        const res = await fetch('/api/notifications/config');
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
        }
      } catch (err) {
        console.error('Failed to load notification config:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/notifications/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
        setSaveSuccess(true);
        if (onNotificationSaved) onNotificationSaved(updated);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const errData = await res.json().catch(() => ({}));
        setTestResult({
          success: false,
          message: errData.error || 'Failed to save configuration.',
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Network error communicating with server.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestAlert = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await res.json();
      if (res.ok) {
        setTestResult({
          success: true,
          message: data.message || 'Test alert dispatched successfully!',
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to dispatch test notification.',
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Failed to connect to test dispatch endpoint.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="notification-config-modal"
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 text-cyan-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Incident Notification Channels</span>
                {config.enabled ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                    ACTIVE
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                    DISABLED
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Automated webhook or email alerts for discovered critical threats
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              <p className="text-xs font-mono">Loading notification parameters...</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              {/* Master Enable Switch */}
              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Enable Automated Notifications</div>
                  <div className="text-[11px] text-slate-400">
                    Dispatch outbound payloads immediately when vulnerability thresholds trigger
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="notification-enabled-toggle"
                    checked={config.enabled}
                    onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              {/* Webhook Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Webhook className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Notification Webhook Endpoint</span>
                  </label>
                  
                  {/* Format switcher */}
                  <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, webhookFormat: 'generic' })}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        config.webhookFormat === 'generic'
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Generic HTTP
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, webhookFormat: 'slack' })}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        config.webhookFormat === 'slack'
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Slack / Discord
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="url"
                    id="notification-webhook-input"
                    value={config.webhookUrl}
                    onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                    placeholder="https://hooks.slack.com/services/... or https://api.endpoint.com/webhook"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Accepts Slack incoming webhook URLs, Discord webhook URLs, or enterprise SIEM webhook listeners.
                </p>
              </div>

              {/* Email Notification Section */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  <span>SecOps Email Recipient</span>
                </label>
                <input
                  type="email"
                  id="notification-email-input"
                  value={config.emailAddress}
                  onChange={(e) => setConfig({ ...config, emailAddress: e.target.value })}
                  placeholder="secops-alerts@yourdomain.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <p className="text-[11px] text-slate-500">
                  Automated security incident summaries and CVSS details will be dispatched to this mailbox.
                </p>
              </div>

              {/* Trigger Thresholds */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dispatch Conditions</span>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="notify-critical-only-toggle"
                      checked={config.notifyOnCriticalOnly}
                      onChange={(e) => setConfig({ ...config, notifyOnCriticalOnly: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500/20"
                    />
                    <span>Notify only on <strong className="text-rose-400">Critical Severity</strong> vulnerabilities (reduces alert fatigue)</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="notify-scan-complete-toggle"
                      checked={config.notifyOnScanComplete}
                      onChange={(e) => setConfig({ ...config, notifyOnScanComplete: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500/20"
                    />
                    <span>Dispatch executive summary notification upon every completed assessment</span>
                  </label>
                </div>
              </div>

              {/* Status or test result feedback */}
              {testResult && (
                <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  testResult.success 
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' 
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                }`}>
                  {testResult.success ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">{testResult.success ? 'Dispatch Verified' : 'Dispatch Failed'}</div>
                    <div className="text-[11px] opacity-90">{testResult.message}</div>
                  </div>
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-cyan-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Notification parameters saved to Aegis security daemon!</span>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            id="test-notification-btn"
            onClick={handleTestAlert}
            disabled={isTesting || (!config.webhookUrl && !config.emailAddress)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-40"
            title="Dispatch a test payload to configured webhook or email"
          >
            {isTesting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>{isTesting ? 'Sending Test...' : 'Send Test Notification'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              id="save-notification-config-btn"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-950/50 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
