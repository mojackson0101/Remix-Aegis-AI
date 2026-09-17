import React, { useState } from 'react';
import { ScanResult, AuditLogEntry } from '../types';
import { generatePdfReport } from '../utils/pdfGenerator';
import { 
  FileText, 
  Download, 
  Printer, 
  ShieldCheck, 
  ShieldAlert, 
  Award, 
  Calendar, 
  Globe, 
  CheckCircle, 
  AlertTriangle,
  FileCheck,
  ChevronDown,
  FileCode,
  FileSpreadsheet,
  Check
} from 'lucide-react';

interface ReportsViewProps {
  scan: ScanResult | null;
  auditLogs: AuditLogEntry[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ scan, auditLogs }) => {
  const [reportType, setReportType] = useState<'executive' | 'technical'>('executive');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  if (!scan) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-12 text-center shadow-xl space-y-3">
        <FileText className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-lg font-bold text-white">No Penetration Test Report Available</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Please enter a target URL, domain, or IP address in the assessment bar above and run an AI Pen-test to generate formal audit reports.
        </p>
      </div>
    );
  }

  const handleDownloadPdf = () => {
    try {
      setIsGeneratingPdf(true);
      generatePdfReport(scan, auditLogs);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const exportPayload = {
      reportTitle: "Aegis AI Penetration Testing & Vulnerability Remediation Report",
      scanId: scan.scanId,
      scannedAt: scan.scannedAt,
      exportedAt: new Date().toISOString(),
      target: scan.target,
      securityScore: scan.securityScore,
      riskGrade: scan.riskGrade,
      executiveSummary: scan.executiveSummary,
      summary: scan.summary,
      stats: scan.stats,
      vulnerabilities: scan.vulnerabilities,
      auditTrail: auditLogs.filter(
        l => l.target === scan.target.domain || 
             l.target === scan.target.normalizedUrl || 
             l.target === scan.target.rawInput
      ),
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Aegis-Report-${scan.target.domain}-${scan.scanId.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'Vulnerability ID',
      'Title',
      'Severity',
      'CVSS Score',
      'Status',
      'CWE',
      'OWASP Category',
      'Category',
      'Root Cause',
      'Threat Impact',
      'Recommendation',
      'Remediation Framework',
      'Code Snippet',
      'Detected At',
      'Resolved At'
    ];

    const rows = scan.vulnerabilities.map(v => [
      escapeCsv(v.id),
      escapeCsv(v.title),
      escapeCsv(v.severity.toUpperCase()),
      escapeCsv(v.cvssScore),
      escapeCsv(v.status.toUpperCase()),
      escapeCsv(v.cwe),
      escapeCsv(v.owaspCategory),
      escapeCsv(v.category),
      escapeCsv(v.rootCause),
      escapeCsv(v.impact),
      escapeCsv(v.recommendation),
      escapeCsv(v.remediationPlan.framework),
      escapeCsv(v.remediationPlan.codeSnippet),
      escapeCsv(v.detectedAt),
      escapeCsv(v.resolvedAt || 'Unmitigated')
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Aegis-Findings-${scan.target.domain}-${scan.scanId.slice(0, 8)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    let md = `# Aegis AI Penetration Testing & Vulnerability Remediation Report\n\n`;
    md += `**Target:** ${scan.target.normalizedUrl}\n`;
    md += `**Domain / Host:** ${scan.target.domain} (${scan.target.ipAddress || 'Dynamic'})\n`;
    md += `**Date:** ${new Date(scan.scannedAt).toUTCString()}\n`;
    md += `**Overall Posture Score:** ${scan.securityScore}/100 (Grade ${scan.riskGrade})\n\n`;
    md += `## Executive Summary\n${scan.executiveSummary}\n\n`;
    md += `## Vulnerability Metrics\n`;
    md += `- Total Discovered: ${scan.stats.total}\n`;
    md += `- Critical: ${scan.stats.critical}\n`;
    md += `- High: ${scan.stats.high}\n`;
    md += `- Medium: ${scan.stats.medium}\n`;
    md += `- Low: ${scan.stats.low}\n`;
    md += `- Remediated & Verified: ${scan.stats.resolved}\n\n`;
    md += `## Detailed Findings & Root Cause Analysis\n\n`;
    scan.vulnerabilities.forEach((v, idx) => {
      md += `### ${idx + 1}. ${v.title} [${v.severity.toUpperCase()} - CVSS ${v.cvssScore}]\n`;
      md += `**CWE:** ${v.cwe} | **OWASP:** ${v.owaspCategory} | **Status:** ${v.status.toUpperCase()}\n\n`;
      md += `**Description:** ${v.description}\n\n`;
      md += `**Root Cause (What led to this):** ${v.rootCause}\n\n`;
      md += `**Threat Impact:** ${v.impact}\n\n`;
      md += `**Recommendation:** ${v.recommendation}\n\n`;
      md += `**Remediation Patch (${v.remediationPlan.framework}):**\n\`\`\`\n${v.remediationPlan.codeSnippet}\n\`\`\`\n\n`;
      if (v.resolutionReceipt) {
        md += `**Mitigation Receipt:** Approved by ${v.resolutionReceipt.approvedBy} at ${v.resolutionReceipt.appliedAt} (Hash: ${v.resolutionReceipt.hash})\n\n`;
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Aegis-Pentest-Report-${scan.target.domain}-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl space-y-6">
      {/* Action Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              OFFICIAL AUDIT REPORT
            </span>
            <span className="text-xs text-slate-500 font-mono">ID: {scan.scanId}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Penetration Testing & Remediation Audit
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Generated by Aegis AI P-Tester for {scan.target.normalizedUrl}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center text-xs">
            <button
              onClick={() => setReportType('executive')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                reportType === 'executive'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Executive Summary
            </button>
            <button
              onClick={() => setReportType('technical')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                reportType === 'technical'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Technical Breakdown
            </button>
          </div>

          {/* Primary Download PDF Report Button */}
          <button
            id="download-pdf-report-btn"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-rose-950/40 cursor-pointer disabled:opacity-50"
            title="Download formal security audit summary document in PDF format"
          >
            {pdfSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-300" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-rose-100" />
            )}
            <span>{isGeneratingPdf ? 'Generating PDF...' : pdfSuccess ? 'PDF Downloaded!' : 'Download PDF Report'}</span>
          </button>

          {/* Export Report Main Dropdown Button */}
          <div className="relative">
            <button
              id="export-report-btn"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-950/50 cursor-pointer"
              title="Download findings for offline analysis"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Report</span>
              <ChevronDown className="w-3 h-3 ml-0.5 opacity-80" />
            </button>

            {isExportMenuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsExportMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 p-1.5 space-y-1 font-sans text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    Offline Analysis Formats
                  </div>
                  <button
                    id="export-report-pdf-item"
                    onClick={() => {
                      handleDownloadPdf();
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-2 text-left hover:bg-slate-800 text-slate-200 hover:text-rose-300 rounded-lg transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>Formal PDF Document</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-400 border border-rose-800 font-mono">.pdf</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Formal audit document with executive summary & findings</div>
                    </div>
                  </button>
                  <button
                    id="export-report-json-item"
                    onClick={() => {
                      handleDownloadJson();
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-2 text-left hover:bg-slate-800 text-slate-200 hover:text-cyan-300 rounded-lg transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>JSON Findings</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">.json</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Structured data with CVE, CVSS & patches</div>
                    </div>
                  </button>
                  <button
                    id="export-report-csv-item"
                    onClick={() => {
                      handleDownloadCsv();
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-2 text-left hover:bg-slate-800 text-slate-200 hover:text-emerald-300 rounded-lg transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>CSV Spreadsheet</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">.csv</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Spreadsheet table for Excel / Google Sheets</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Quick format action triggers */}
          <button
            onClick={handleDownloadPdf}
            id="quick-export-pdf-btn"
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 text-xs font-mono font-medium transition-colors flex items-center gap-1 cursor-pointer"
            title="Download PDF directly"
          >
            <span>PDF</span>
          </button>

          <button
            onClick={handleDownloadJson}
            id="quick-export-json-btn"
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-mono font-medium transition-colors flex items-center gap-1 cursor-pointer"
            title="Download JSON directly"
          >
            <span>JSON</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            id="quick-export-csv-btn"
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-xs font-mono font-medium transition-colors flex items-center gap-1 cursor-pointer"
            title="Download CSV directly"
          >
            <span>CSV</span>
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download Markdown summary"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.MD</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Target Metadata Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono">
        <div>
          <span className="text-slate-500 block">Assessment Target:</span>
          <span className="text-white font-bold truncate block">{scan.target.domain}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Target IP:</span>
          <span className="text-cyan-400 font-bold block">{scan.target.ipAddress || '127.0.0.1'}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Audit Timestamp:</span>
          <span className="text-slate-300 block">{new Date(scan.scannedAt).toLocaleDateString()}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Compliance Status:</span>
          <span className="text-emerald-400 font-bold block">
            {scan.stats.resolved === scan.stats.total ? 'Fully Remediated' : 'Action Required'}
          </span>
        </div>
      </div>

      {reportType === 'executive' ? (
        /* Executive View */
        <div className="space-y-6">
          {/* Executive Overview Box */}
          <div className="p-5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
            <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4" />
              Executive Security Posture Assessment
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              {scan.executiveSummary}
            </p>
          </div>

          {/* Key Risk Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-1">
              <span className="text-xs text-slate-400 uppercase font-bold">Posture Rating</span>
              <div className="text-3xl font-black text-white font-mono">{scan.securityScore}/100</div>
              <span className="text-xs text-cyan-400 font-mono">Grade {scan.riskGrade}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-1">
              <span className="text-xs text-slate-400 uppercase font-bold">Exposure Profile</span>
              <div className="text-3xl font-black text-rose-400 font-mono">{scan.stats.critical + scan.stats.high}</div>
              <span className="text-xs text-slate-400">High / Critical Exposures</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-1">
              <span className="text-xs text-slate-400 uppercase font-bold">Remediation Velocity</span>
              <div className="text-3xl font-black text-emerald-400 font-mono">
                {Math.round((scan.stats.resolved / (scan.stats.total || 1)) * 100)}%
              </div>
              <span className="text-xs text-emerald-400 font-mono">{scan.stats.resolved} of {scan.stats.total} Patched</span>
            </div>
          </div>

          {/* OWASP Top 10 Alignment Summary */}
          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              OWASP Top 10 & CWE Risk Mapping
            </h4>
            <div className="space-y-2">
              {scan.vulnerabilities.map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      v.severity === 'critical' ? 'bg-rose-500' : v.severity === 'high' ? 'bg-orange-500' : 'bg-amber-500'
                    }`}></span>
                    <span className="font-bold text-white">{v.title}</span>
                    <span className="text-slate-400 font-mono">({v.cwe})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-mono">{v.owaspCategory}</span>
                    <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                      v.status === 'resolved'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}>
                      {v.status === 'resolved' ? 'Mitigated' : 'Unmitigated'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Technical Findings Breakdown */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
            <span className="font-bold text-cyan-400">Technical Overview: </span>
            {scan.summary}
          </div>

          <div className="space-y-4">
            {scan.vulnerabilities.map((v, i) => (
              <div key={v.id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-900">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-400 font-bold">#{i + 1}</span>
                    <span className="font-bold text-white text-sm">{v.title}</span>
                    <span className="px-2 py-0.5 rounded font-mono text-[11px] uppercase bg-slate-800 text-slate-300">
                      CVSS {v.cvssScore}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                    v.status === 'resolved' ? 'text-emerald-400 bg-emerald-950 border border-emerald-800' : 'text-rose-400 bg-rose-950 border border-rose-800'
                  }`}>
                    {v.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 font-bold block mb-1">What Led To That (Root Cause):</span>
                    <p className="text-slate-300 leading-relaxed">{v.rootCause}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block mb-1">Threat Impact:</span>
                    <p className="text-slate-300 leading-relaxed">{v.impact}</p>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 font-bold block mb-1">Prescribed Remediation Advice:</span>
                  <p className="text-slate-300 leading-relaxed">{v.recommendation}</p>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px]">
                  <span className="text-cyan-400 block mb-1">Virtual Patch Recipe ({v.remediationPlan.framework}):</span>
                  <code className="text-slate-300 whitespace-pre-wrap">{v.remediationPlan.codeSnippet}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
