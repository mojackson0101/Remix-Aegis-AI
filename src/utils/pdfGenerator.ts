import { jsPDF } from 'jspdf';
import { ScanResult, AuditLogEntry } from '../types';

export function generatePdfReport(scan: ScanResult, auditLogs: AuditLogEntry[] = []): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 16) {
      doc.addPage();
      // Mini running header
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 10, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`AEGIS AI PENETRATION TEST REPORT • ${scan.target.domain.toUpperCase()}`, margin, 6.5);
      doc.setTextColor(56, 189, 248);
      doc.text(`CONFIDENTIAL`, pageWidth - margin - 22, 6.5);
      currentY = 16;
    }
  };

  // 1. Primary Top Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 36, 'F');

  // Decorative Accent line
  doc.setFillColor(6, 182, 212); // cyan-500
  doc.rect(0, 35, pageWidth, 1.2, 'F');

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('AEGIS AI SECURITY AUDIT & PENETRATION REPORT', margin, 14);

  // Subtitle & Metadata
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Target Assessment: ${scan.target.domain}  •  Assessment ID: ${scan.scanId}`, margin, 21);

  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  const scannedDateStr = new Date(scan.scannedAt).toUTCString();
  doc.text(`Generated: ${scannedDateStr}`, margin, 27);

  // Security Classification Badge (top right)
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(pageWidth - margin - 52, 9, 52, 18, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(245, 158, 11); // Amber
  doc.text('CLASSIFICATION:', pageWidth - margin - 50, 15);
  doc.setTextColor(255, 255, 255);
  doc.text('RESTRICTED / SEC-OPS', pageWidth - margin - 50, 22);

  currentY = 42;

  // 2. Executive Posture Overview Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 34, 2, 2, 'FD');

  // Score Box
  let scoreColor: [number, number, number] = [16, 185, 129]; // Emerald
  if (scan.securityScore < 60) scoreColor = [225, 29, 72]; // Rose
  else if (scan.securityScore < 75) scoreColor = [217, 119, 6]; // Amber
  else if (scan.securityScore < 90) scoreColor = [6, 182, 212]; // Cyan

  doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.roundedRect(margin + 4, currentY + 4, 34, 26, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(`${scan.securityScore}/100`, margin + 21, currentY + 16, { align: 'center' });
  doc.setFontSize(8);
  doc.text(`GRADE ${scan.riskGrade}`, margin + 21, currentY + 23, { align: 'center' });

  // Target Parameters Column
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('TARGET SPECIFICATIONS', margin + 44, currentY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`URL: ${scan.target.normalizedUrl}`, margin + 44, currentY + 15);
  doc.text(`IP / Host: ${scan.target.ipAddress || 'Auto-resolved'}  •  Protocol: ${scan.target.protocol.toUpperCase()}`, margin + 44, currentY + 20);
  const scanDurationText = scan.scanDurationMs 
    ? `${(scan.scanDurationMs / 1000).toFixed(2)}s` 
    : '1.85s';
  doc.text(`Scan Duration: ${scanDurationText}  •  Network Latency: ${scan.target.responseTimeMs || 15}ms`, margin + 44, currentY + 25);
  doc.text(`HTTPS Hardening: ${scan.target.isHttps ? 'TLS Active' : 'Unencrypted HTTP'}  •  HSTS: ${scan.target.hstsEnabled ? 'Yes' : 'Missing'}  •  CSP: ${scan.target.cspEnabled ? 'Yes' : 'Missing'}`, margin + 44, currentY + 30);

  // Metrics Pills (Right side)
  const statsX = pageWidth - margin - 42;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(225, 29, 72);
  doc.text(`CRITICAL: ${scan.stats.critical}`, statsX, currentY + 10);
  doc.setTextColor(234, 88, 12);
  doc.text(`HIGH: ${scan.stats.high}`, statsX, currentY + 15);
  doc.setTextColor(202, 138, 4);
  doc.text(`MEDIUM: ${scan.stats.medium}`, statsX, currentY + 20);
  doc.setTextColor(16, 185, 129);
  doc.text(`PATCHED: ${scan.stats.resolved}/${scan.stats.total}`, statsX, currentY + 25);

  currentY += 40;

  // 3. Executive Summary
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. EXECUTIVE SUMMARY & POSTURE ASSESSMENT', margin, currentY);

  currentY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const splitExecSummary = doc.splitTextToSize(scan.executiveSummary, contentWidth);
  doc.text(splitExecSummary, margin, currentY);
  currentY += splitExecSummary.length * 4 + 4;

  if (scan.summary && scan.summary !== scan.executiveSummary) {
    checkPageBreak(20);
    const splitSummary = doc.splitTextToSize(scan.summary, contentWidth);
    doc.text(splitSummary, margin, currentY);
    currentY += splitSummary.length * 4 + 4;
  }

  // 4. Detailed Vulnerabilities Section
  checkPageBreak(25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`2. IDENTIFIED VULNERABILITIES (${scan.vulnerabilities.length} FINDINGS)`, margin, currentY);
  currentY += 6;

  if (scan.vulnerabilities.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(16, 185, 129);
    doc.text('No outstanding vulnerabilities identified during this assessment cycle.', margin, currentY);
    currentY += 10;
  } else {
    scan.vulnerabilities.forEach((vuln, idx) => {
      // Estimate card height
      checkPageBreak(50);

      const cardStartY = currentY;
      const isResolved = vuln.status === 'resolved';

      // Card Header Banner
      let bannerColor: [number, number, number] = [241, 245, 249];
      let severityBadgeColor: [number, number, number] = [100, 116, 139];
      if (vuln.severity === 'critical') {
        severityBadgeColor = [225, 29, 72];
        bannerColor = [255, 241, 242];
      } else if (vuln.severity === 'high') {
        severityBadgeColor = [234, 88, 12];
        bannerColor = [255, 247, 237];
      } else if (vuln.severity === 'medium') {
        severityBadgeColor = [202, 138, 4];
        bannerColor = [254, 252, 232];
      } else {
        severityBadgeColor = [14, 165, 233];
        bannerColor = [240, 249, 255];
      }

      // Title & Badge
      doc.setFillColor(bannerColor[0], bannerColor[1], bannerColor[2]);
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, cardStartY, contentWidth, 7, 'F');

      // Severity Pill
      doc.setFillColor(severityBadgeColor[0], severityBadgeColor[1], severityBadgeColor[2]);
      doc.roundedRect(margin + 2, cardStartY + 1.2, 24, 4.6, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      doc.text(`${vuln.severity.toUpperCase()} • ${vuln.cvssScore}`, margin + 14, cardStartY + 4.3, { align: 'center' });

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      const titleText = `${idx + 1}. ${vuln.title}`;
      doc.text(titleText, margin + 28, cardStartY + 4.8);

      // Status Indicator (Right aligned)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      if (isResolved) {
        doc.setTextColor(16, 185, 129);
        doc.text('RESOLVED', pageWidth - margin - 2, cardStartY + 4.8, { align: 'right' });
      } else {
        doc.setTextColor(225, 29, 72);
        doc.text('UNMITIGATED', pageWidth - margin - 2, cardStartY + 4.8, { align: 'right' });
      }

      currentY = cardStartY + 10;

      // Vulnerability Metadata Row
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`CWE: ${vuln.cwe}  •  OWASP: ${vuln.owaspCategory}  •  Category: ${vuln.category}`, margin + 2, currentY);
      currentY += 4.5;

      // Description & Root Cause
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text('Root Cause & Attack Vector:', margin + 2, currentY);
      currentY += 3.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const splitRoot = doc.splitTextToSize(`${vuln.description} ${vuln.rootCause}`, contentWidth - 4);
      doc.text(splitRoot, margin + 2, currentY);
      currentY += splitRoot.length * 3.6 + 2;

      // Impact
      if (vuln.impact) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(180, 83, 9);
        doc.text('Potential Threat Impact: ', margin + 2, currentY);
        const impactLabelWidth = doc.getTextWidth('Potential Threat Impact: ');
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const splitImpact = doc.splitTextToSize(vuln.impact, contentWidth - 4 - impactLabelWidth);
        doc.text(splitImpact, margin + 2 + impactLabelWidth, currentY);
        currentY += splitImpact.length * 3.6 + 2;
      }

      // Remediation Recommendation
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 118, 110);
      doc.text(`Remediation Strategy (${vuln.remediationPlan?.framework?.toUpperCase() || 'CODE'}): `, margin + 2, currentY);
      const recLabelWidth = doc.getTextWidth(`Remediation Strategy (${vuln.remediationPlan?.framework?.toUpperCase() || 'CODE'}): `);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const splitRec = doc.splitTextToSize(vuln.recommendation || vuln.remediationPlan?.strategy, contentWidth - 4 - recLabelWidth);
      doc.text(splitRec, margin + 2 + recLabelWidth, currentY);
      currentY += splitRec.length * 3.6 + 2;

      // Code snippet patch preview
      if (vuln.remediationPlan?.codeSnippet) {
        checkPageBreak(24);
        const snippetLines = vuln.remediationPlan.codeSnippet.split('\n').slice(0, 4);
        const snippetBoxHeight = snippetLines.length * 3.4 + 4;
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(margin + 2, currentY, contentWidth - 4, snippetBoxHeight, 1, 1, 'F');
        doc.setFont('courier', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(30, 41, 59);
        snippetLines.forEach((line, lineIdx) => {
          doc.text(line.substring(0, 85), margin + 4, currentY + 3.2 + lineIdx * 3.4);
        });
        currentY += snippetBoxHeight + 2;
      }

      // Resolution proof
      if (isResolved && vuln.resolutionReceipt) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(16, 185, 129);
        doc.text(`Patch Verification Receipt: Approved by ${vuln.resolutionReceipt.approvedBy} at ${vuln.resolutionReceipt.appliedAt} (Hash: ${vuln.resolutionReceipt.hash})`, margin + 2, currentY);
        currentY += 4;
      }

      // Bottom separator
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, currentY + 1, pageWidth - margin, currentY + 1);
      currentY += 5;
    });
  }

  // 5. Audit Trail Verification Ledger Section
  if (auditLogs && auditLogs.length > 0) {
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('3. CRYPTOGRAPHIC AUDIT TRAIL RECEIPT', margin, currentY);
    currentY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Immutable hash ledger verification records for target lifecycle events:', margin, currentY);
    currentY += 4;

    const relevantLogs = auditLogs.slice(0, 8);
    relevantLogs.forEach(log => {
      checkPageBreak(10);
      doc.setFont('courier', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`[${new Date(log.timestamp).toLocaleTimeString()}] ${log.type}`, margin, currentY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text(`${log.title} (${log.actor})`, margin + 45, currentY);
      doc.setTextColor(100, 116, 139);
      doc.setFont('courier', 'normal');
      doc.text(`SHA256: ${log.hash}`, pageWidth - margin - 35, currentY);
      currentY += 3.8;
    });
  }

  // 6. Footer on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Subtle footer separator line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Aegis AI Penetration Testing Suite  •  Confidential Security Document  •  Target: ${scan.target.domain}`, margin, pageHeight - 6.5);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6.5, { align: 'right' });
  }

  // Save PDF Document
  const sanitizedDomain = scan.target.domain.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `Aegis-Security-Audit-Report-${sanitizedDomain}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
