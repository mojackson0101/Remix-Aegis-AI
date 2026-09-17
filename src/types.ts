export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type VulnerabilityStatus = 'detected' | 'remediating' | 'resolved' | 'ignored' | 'pending';

export interface RemediationPlan {
  strategy: string;
  framework: 'nginx' | 'apache' | 'express' | 'cloudflare' | 'docker' | 'code';
  codeSnippet: string;
  explanation: string;
  verificationStep: string;
  autoFixable: boolean;
}

export interface Vulnerability {
  id: string;
  title: string;
  severity: Severity;
  cvssScore: number;
  category: string; // e.g. "Security Misconfiguration", "Broken Access Control", "Injection", "Cryptographic Failure"
  cwe: string; // e.g. "CWE-1021"
  owaspCategory: string; // e.g. "A05:2021-Security Misconfiguration"
  description: string;
  rootCause: string; // What led to this vulnerability
  impact: string; // Potential damage or attack vector
  recommendation: string; // Advice or suggested fix
  remediationPlan: RemediationPlan;
  status: VulnerabilityStatus;
  detectedAt: string;
  resolvedAt?: string;
  scheduledFor?: string;
  scheduledAt?: string;
  scheduledReason?: string;
  scheduledBy?: string;
  resolutionReceipt?: {
    approvedBy: string;
    appliedAt: string;
    patchId: string;
    verificationProof: string;
    hash: string;
  };
  tags?: string[]; // Project or department categories, e.g. "DevOps", "Compliance", "Security"
}

export interface ThreatNewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  summary: string;
  category: 'Zero-Day' | 'Ransomware' | 'Critical CVE' | 'Cloud Security' | 'Advisory' | 'Data Breach';
  severity: 'critical' | 'high' | 'medium';
  cveIds?: string[];
  affectedSystems?: string;
}

export type ArchitectureTier =
  | 'edge_proxy'
  | 'auth_gateway'
  | 'api_routing'
  | 'client_browser'
  | 'app_server'
  | 'data_storage';

export interface TestProbe {
  id: string;
  name: string;
  category: 'dns' | 'tls' | 'headers' | 'auth' | 'cors' | 'methods' | 'fingerprint';
  status: 'success' | 'failed' | 'warning' | 'retrying';
  latencyMs: number;
  targetUrl: string;
  method: string;
  statusCode?: number | null;
  errorMessage?: string | null;
  retryCount: number;
  lastAttemptAt: string;
  details: string;
}

export interface TargetMetadata {
  rawInput: string;
  normalizedUrl: string;
  domain: string;
  ipAddress?: string;
  protocol: 'https' | 'http';
  statusCode?: number;
  responseTimeMs?: number;
  serverHeader?: string;
  isHttps: boolean;
  hstsEnabled: boolean;
  cspEnabled: boolean;
  xFrameOptions?: string;
  corsHeader?: string;
}

export interface ScanResult {
  scanId: string;
  target: TargetMetadata;
  scannedAt: string;
  securityScore: number; // 0-100
  riskGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
  executiveSummary: string;
  vulnerabilities: Vulnerability[];
  stats: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    resolved: number;
  };
  headersInspected: Record<string, string>;
  rawFindings: string[];
  scanDurationMs: number;
  networkDurationMs?: number;
  aiAnalysisDurationMs?: number;
  testProbes?: TestProbe[];
  failedProbesCount?: number;
}

export interface NotificationConfig {
  enabled: boolean;
  webhookUrl: string;
  emailAddress: string;
  notifyOnCriticalOnly: boolean;
  notifyOnScanComplete: boolean;
  slackWebhookFormat?: boolean;
  lastNotifiedAt?: string;
  lastNotificationStatus?: 'success' | 'failed' | 'simulated' | null;
  lastNotificationMessage?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  type: 'SCAN_START' | 'VULN_DETECTED' | 'REMEDIATION_PROPOSED' | 'APPROVAL_GRANTED' | 'REMEDIATION_APPLIED' | 'RE_VERIFICATION_PASSED' | 'AUDIT_EXPORTED' | 'NOTIFICATION_SENT';
  title: string;
  details: string;
  target: string;
  actor: string;
  severity?: Severity;
  vulnerabilityId?: string;
  hash: string;
}

export type AuditCategory = 'ALL' | 'SCAN' | 'REMEDIATION' | 'SYSTEM';

export interface HealthStatus {
  status: string;
  hasGeminiKey: boolean;
  activeScansCount: number;
  auditLogsCount: number;
  timestamp?: string;
  uptime?: number;
}
