import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Grid3X3, 
  Network, 
  ShieldAlert, 
  AlertTriangle, 
  ShieldCheck, 
  Info, 
  ArrowRight, 
  ExternalLink,
  Zap,
  Server,
  Key,
  Globe,
  Database,
  Cpu,
  Eye
} from 'lucide-react';
import { ScanResult, Vulnerability, ArchitectureTier } from '../types';

interface ArchitectureHeatmapProps {
  scan: ScanResult;
  onSelectVulnerability?: (vuln: Vulnerability) => void;
  onFilterByTier?: (tier: ArchitectureTier) => void;
}

interface TierDefinition {
  id: ArchitectureTier;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  componentTags: string[];
}

const ARCHITECTURE_TIERS: TierDefinition[] = [
  {
    id: 'edge_proxy',
    title: 'Edge Proxy & TLS Transport',
    subtitle: 'WAF / SSL / HSTS / Routing',
    description: 'Perimeter ingress layer managing transport encryption, CDN edge caching, and protocol hardening.',
    icon: Globe,
    componentTags: ['HSTS', 'TLS 1.3', 'HTTP/2', 'WAF Rules', 'Certificate'],
  },
  {
    id: 'auth_gateway',
    title: 'Identity & Authentication Gateway',
    subtitle: 'Session Flags / Cookies / Tokens',
    description: 'Access boundary safeguarding session tokens, cookie attributes, credentials, and SSO auth state.',
    icon: Key,
    componentTags: ['Set-Cookie', 'HttpOnly', 'Secure Flag', 'SameSite', 'Session Store'],
  },
  {
    id: 'api_routing',
    title: 'API Gateway & CORS Routing',
    subtitle: 'REST / Headers / Verbs / CORS',
    description: 'Inter-service communication layer governing allowed HTTP verbs, CORS policies, and request routing.',
    icon: Network,
    componentTags: ['CORS', 'Access-Control', 'HTTP Verbs', 'Rate Limiter'],
  },
  {
    id: 'client_browser',
    title: 'Client & Browser Execution',
    subtitle: 'CSP / DOM / Frame Redressing',
    description: 'Frontend client environment enforcing CSP whitelists, clickjacking defenses, and MIME sniffing controls.',
    icon: Layers,
    componentTags: ['CSP', 'X-Frame-Options', 'X-Content-Type', 'DOM Scripts'],
  },
  {
    id: 'app_server',
    title: 'Application Server & Logic',
    subtitle: 'Server Engine / Tech Disclosure',
    description: 'Backend web application runtime handling request controllers, stack traces, and framework banners.',
    icon: Server,
    componentTags: ['Server Header', 'X-Powered-By', 'Tech Stack', 'Error Handling'],
  },
  {
    id: 'data_storage',
    title: 'Data Storage & Persistence',
    subtitle: 'SQL / Cloud Storage / Injection',
    description: 'Backend relational data repositories, sensitive record storage, and persistent database queries.',
    icon: Database,
    componentTags: ['SQL Injection', 'Storage Bucket', 'Sensitive State', 'Data Leak'],
  },
];

// Helper to categorize any vulnerability into one of the 6 target architectural tiers
export function categorizeVulnerabilityToTier(vuln: Vulnerability): ArchitectureTier {
  const text = `${vuln.title} ${vuln.cwe} ${vuln.category} ${vuln.description} ${vuln.rootCause}`.toLowerCase();

  // 1. Edge & Reverse Proxy
  if (
    text.includes('hsts') || 
    text.includes('strict-transport-security') || 
    text.includes('transport') || 
    text.includes('ssl') || 
    text.includes('tls') || 
    text.includes('cwe-319') ||
    text.includes('insecure protocol')
  ) {
    return 'edge_proxy';
  }

  // 2. Identity & Authentication Gateway
  if (
    text.includes('cookie') || 
    text.includes('httponly') || 
    text.includes('samesite') || 
    text.includes('session') || 
    text.includes('auth') || 
    text.includes('cwe-384') || 
    text.includes('cwe-613') ||
    text.includes('cwe-287') ||
    text.includes('a07')
  ) {
    return 'auth_gateway';
  }

  // 3. API & Routing Tier
  if (
    text.includes('cors') || 
    text.includes('access-control') || 
    text.includes('wildcard origin') || 
    text.includes('method') || 
    text.includes('options') || 
    text.includes('trace') ||
    text.includes('cwe-942') ||
    text.includes('api')
  ) {
    return 'api_routing';
  }

  // 4. Client & Browser Execution
  if (
    text.includes('csp') || 
    text.includes('content-security-policy') || 
    text.includes('xss') || 
    text.includes('cross-site scripting') || 
    text.includes('frame') || 
    text.includes('clickjacking') || 
    text.includes('mime') || 
    text.includes('sniffing') ||
    text.includes('cwe-1021') ||
    text.includes('cwe-79')
  ) {
    return 'client_browser';
  }

  // 5. Application Server & Logic
  if (
    text.includes('server banner') || 
    text.includes('x-powered-by') || 
    text.includes('server header') || 
    text.includes('disclosure') || 
    text.includes('fingerprint') ||
    text.includes('cwe-200') ||
    text.includes('a05')
  ) {
    return 'app_server';
  }

  // 6. Data Storage & Persistence
  if (
    text.includes('sql') || 
    text.includes('injection') || 
    text.includes('database') || 
    text.includes('storage') || 
    text.includes('cwe-89')
  ) {
    return 'data_storage';
  }

  return 'app_server';
}

const SEVERITY_COLUMNS = [
  { key: 'critical', label: 'Critical', color: 'text-rose-400', border: 'border-rose-500/40', bg: 'bg-rose-950/20' },
  { key: 'high', label: 'High', color: 'text-orange-400', border: 'border-orange-500/40', bg: 'bg-orange-950/20' },
  { key: 'medium', label: 'Medium', color: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-950/20' },
  { key: 'low', label: 'Low', color: 'text-sky-400', border: 'border-sky-500/40', bg: 'bg-sky-950/20' },
  { key: 'resolved', label: 'Resolved', color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-950/20' },
] as const;

export const ArchitectureHeatmap: React.FC<ArchitectureHeatmapProps> = ({
  scan,
  onSelectVulnerability,
  onFilterByTier,
}) => {
  const [viewMode, setViewMode] = useState<'matrix' | 'topology'>('matrix');
  const [selectedTierId, setSelectedTierId] = useState<ArchitectureTier | null>(null);

  // Group vulnerabilities by tier
  const tierVulnerabilityMap = useMemo(() => {
    const map: Record<ArchitectureTier, Vulnerability[]> = {
      edge_proxy: [],
      auth_gateway: [],
      api_routing: [],
      client_browser: [],
      app_server: [],
      data_storage: [],
    };

    scan.vulnerabilities.forEach((vuln) => {
      const tier = categorizeVulnerabilityToTier(vuln);
      map[tier].push(vuln);
    });

    return map;
  }, [scan.vulnerabilities]);

  // Compute severity density matrix: Tier x Severity
  const matrixData = useMemo(() => {
    const data: Record<ArchitectureTier, { critical: number; high: number; medium: number; low: number; resolved: number; total: number; unresolved: number }> = {
      edge_proxy: { critical: 0, high: 0, medium: 0, low: 0, resolved: 0, total: 0, unresolved: 0 },
      auth_gateway: { critical: 0, high: 0, medium: 0, low: 0, resolved: 0, total: 0, unresolved: 0 },
      api_routing: { critical: 0, high: 0, medium: 0, low: 0, resolved: 0, total: 0, unresolved: 0 },
      client_browser: { critical: 0, high: 0, medium: 0, low: 0, resolved: 0, total: 0, unresolved: 0 },
      app_server: { critical: 0, high: 0, medium: 0, low: 0, resolved: 0, total: 0, unresolved: 0 },
      data_storage: { critical: 0, high: 0, medium: 0, low: 0, resolved: 0, total: 0, unresolved: 0 },
    };

    scan.vulnerabilities.forEach((v) => {
      const tier = categorizeVulnerabilityToTier(v);
      data[tier].total += 1;
      if (v.status === 'resolved') {
        data[tier].resolved += 1;
      } else {
        data[tier].unresolved += 1;
        if (v.severity === 'critical') data[tier].critical += 1;
        else if (v.severity === 'high') data[tier].high += 1;
        else if (v.severity === 'medium') data[tier].medium += 1;
        else if (v.severity === 'low') data[tier].low += 1;
      }
    });

    return data;
  }, [scan.vulnerabilities]);

  // Determine highest risk architectural tier
  const highestRiskTier = useMemo(() => {
    let topTier: TierDefinition = ARCHITECTURE_TIERS[0];
    let maxWeightedScore = -1;

    ARCHITECTURE_TIERS.forEach((tier) => {
      const counts = matrixData[tier.id];
      // Weighted impact score: Critical*10 + High*5 + Medium*2 + Low*1
      const score = counts.critical * 10 + counts.high * 5 + counts.medium * 2 + counts.low * 1;
      if (score > maxWeightedScore) {
        maxWeightedScore = score;
        topTier = tier;
      }
    });

    return { tier: topTier, score: maxWeightedScore };
  }, [matrixData]);

  // Total findings across target
  const totalFindings = scan.vulnerabilities.length;
  const activeFindings = scan.vulnerabilities.filter((v) => v.status !== 'resolved').length;

  // Intensity color generator for heatmap cells
  const getCellIntensityStyle = (count: number, severity: 'critical' | 'high' | 'medium' | 'low' | 'resolved') => {
    if (count === 0) {
      return 'bg-slate-950/40 text-slate-700 border-slate-900 font-mono';
    }

    if (severity === 'resolved') {
      return 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300 font-bold shadow-sm shadow-emerald-950';
    }

    if (severity === 'critical') {
      if (count >= 2) return 'bg-rose-600/90 border-rose-400 text-white font-black animate-pulse shadow-md shadow-rose-950';
      return 'bg-rose-900/80 border-rose-600 text-rose-100 font-black shadow-sm shadow-rose-950';
    }

    if (severity === 'high') {
      if (count >= 3) return 'bg-orange-600 border-orange-400 text-white font-black';
      if (count >= 2) return 'bg-orange-800/90 border-orange-500/80 text-orange-100 font-bold';
      return 'bg-orange-950/80 border-orange-700/60 text-orange-200 font-bold';
    }

    if (severity === 'medium') {
      if (count >= 3) return 'bg-amber-700 border-amber-400 text-white font-bold';
      if (count >= 2) return 'bg-amber-900/90 border-amber-600/70 text-amber-100 font-semibold';
      return 'bg-amber-950/80 border-amber-800/60 text-amber-200 font-medium';
    }

    // Low
    if (count >= 2) return 'bg-sky-900/80 border-sky-600/70 text-sky-100 font-medium';
    return 'bg-sky-950/80 border-sky-800/60 text-sky-300 font-medium';
  };

  const selectedTierVulns = selectedTierId ? tierVulnerabilityMap[selectedTierId] : null;
  const selectedTierDef = selectedTierId ? ARCHITECTURE_TIERS.find((t) => t.id === selectedTierId) : null;

  return (
    <div id="architecture-heatmap-container" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Header & View Mode Switch */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-cyan-950 to-blue-900/60 border border-cyan-800/60 rounded-xl text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Target Architecture Vulnerability Density Heatmap
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">
                  6-Tier Topology
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Visualizing risk concentration, exposure hot-spots, and mitigation density across target infrastructure
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              id="heatmap-view-matrix-btn"
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Density Matrix</span>
            </button>
            <button
              id="heatmap-view-topology-btn"
              onClick={() => setViewMode('topology')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'topology'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Tier Topology</span>
            </button>
          </div>
        </div>
      </div>

      {/* Highest Density Warning & Distribution Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Highest Risk Tier Banner */}
        <div className="md:col-span-2 p-3.5 bg-gradient-to-r from-rose-950/40 via-amber-950/20 to-slate-950/60 border border-rose-900/50 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-950/80 border border-rose-800 rounded-lg text-rose-400 shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-rose-300 uppercase tracking-wider block">
                Highest Risk Concentration Tier
              </span>
              <span className="text-xs sm:text-sm font-bold text-white">
                {highestRiskTier.tier.title}
              </span>
              <span className="text-[11px] text-slate-400 block">
                {matrixData[highestRiskTier.tier.id].unresolved} active exposures ({matrixData[highestRiskTier.tier.id].critical} critical, {matrixData[highestRiskTier.tier.id].high} high)
              </span>
            </div>
          </div>

          <button
            onClick={() => setSelectedTierId(highestRiskTier.tier.id)}
            className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800/80 border border-rose-700 text-rose-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>Inspect Tier</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Global Architectural Health Ratio */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
              Architecture Health
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-bold font-mono text-cyan-400">
                {Math.round(((totalFindings - activeFindings) / Math.max(1, totalFindings)) * 100)}%
              </span>
              <span className="text-xs text-slate-400">mitigated</span>
            </div>
            <span className="text-[11px] text-slate-500">
              {activeFindings} unresolved / {totalFindings} mapped
            </span>
          </div>

          <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 font-mono text-xs font-bold">
            {scan.riskGrade}
          </div>
        </div>
      </div>

      {/* VIEW 1: Matrix Heatmap Mode */}
      {viewMode === 'matrix' && (
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-mono text-slate-400">
                  <th className="py-2.5 px-3 font-semibold text-slate-300 min-w-[220px]">Architectural Component Tier</th>
                  {SEVERITY_COLUMNS.map((col) => (
                    <th key={col.key} className="py-2.5 px-3 text-center min-w-[80px]">
                      <span className={`${col.color} font-semibold`}>{col.label}</span>
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-center min-w-[90px] font-semibold text-slate-300">Density Total</th>
                  <th className="py-2.5 px-3 text-right min-w-[90px] font-semibold text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {ARCHITECTURE_TIERS.map((tier) => {
                  const counts = matrixData[tier.id];
                  const Icon = tier.icon;
                  const isSelected = selectedTierId === tier.id;

                  return (
                    <tr 
                      key={tier.id}
                      className={`hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-slate-800/60' : ''}`}
                    >
                      {/* Tier Column */}
                      <td className="py-3 px-3">
                        <div className="flex items-start gap-2.5">
                          <div className={`p-1.5 rounded-lg mt-0.5 border ${
                            counts.unresolved > 0 
                              ? counts.critical > 0 
                                ? 'bg-rose-950/60 border-rose-800 text-rose-400' 
                                : 'bg-amber-950/60 border-amber-800 text-amber-400'
                              : 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <span>{tier.title}</span>
                              {counts.unresolved === 0 && counts.total > 0 && (
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1">{tier.subtitle}</p>
                            {/* Component Tags */}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {tier.componentTags.slice(0, 3).map((tag) => (
                                <span key={tag} className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-950 rounded border border-slate-800 text-slate-400">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Severity Cells (Heatmap Intensity) */}
                      {(['critical', 'high', 'medium', 'low', 'resolved'] as const).map((sevKey) => {
                        const count = counts[sevKey];
                        const cellStyle = getCellIntensityStyle(count, sevKey);

                        return (
                          <td key={sevKey} className="py-3 px-2 text-center">
                            <button
                              onClick={() => setSelectedTierId(tier.id)}
                              className={`w-10 h-8 mx-auto rounded-lg border flex items-center justify-center transition-all transform hover:scale-105 cursor-pointer ${cellStyle}`}
                              title={`${tier.title}: ${count} ${sevKey} findings`}
                            >
                              <span className="text-xs font-mono">{count}</span>
                            </button>
                          </td>
                        );
                      })}

                      {/* Density Total */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`font-mono font-bold text-xs ${counts.unresolved > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                            {counts.unresolved} active
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {counts.total} total
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedTierId(isSelected ? null : tier.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-950 border-cyan-700 text-cyan-300'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {isSelected ? 'Close' : 'Inspect'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Heatmap Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">Density Gradient:</span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-slate-950 border border-slate-800"></span> Clean (0)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-amber-950 border border-amber-800"></span> Moderate (1-2)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-orange-800 border border-orange-500"></span> High (3+)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-rose-600 border border-rose-400"></span> Critical Flare
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-950 border border-emerald-700"></span> Mitigated
              </span>
            </div>

            <span className="text-slate-500 italic">
              Click any density block or inspect button to drill down into vulnerability remediations
            </span>
          </div>
        </div>
      )}

      {/* VIEW 2: Architecture Flow Topology Mode */}
      {viewMode === 'topology' && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center justify-between">
            <span>Flow represents packet trajectory from External Internet Ingress through application tiers:</span>
            <span className="text-cyan-400 font-mono text-[11px]">Ingress → Edge → Gateway → API → Server → Storage</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ARCHITECTURE_TIERS.map((tier, idx) => {
              const counts = matrixData[tier.id];
              const Icon = tier.icon;
              const isSelected = selectedTierId === tier.id;

              return (
                <div
                  key={tier.id}
                  onClick={() => setSelectedTierId(isSelected ? null : tier.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected 
                      ? 'bg-slate-800 border-cyan-500 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500' 
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  {/* Top Step Number and Icon */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      Tier 0{idx + 1}
                    </span>
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      counts.unresolved === 0 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : counts.critical > 0
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {counts.unresolved === 0 ? 'Hardened' : `${counts.unresolved} Active Exposures`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-sm text-white">{tier.title}</h4>
                  </div>

                  <p className="text-xs text-slate-400 mb-3">{tier.description}</p>

                  {/* Mini Severity Breakdown */}
                  <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono pt-2 border-t border-slate-800/80">
                    <div className="p-1 rounded bg-slate-900 border border-slate-800/60">
                      <span className="text-rose-400 font-bold block">{counts.critical}</span>
                      <span className="text-slate-500">Crit</span>
                    </div>
                    <div className="p-1 rounded bg-slate-900 border border-slate-800/60">
                      <span className="text-orange-400 font-bold block">{counts.high}</span>
                      <span className="text-slate-500">High</span>
                    </div>
                    <div className="p-1 rounded bg-slate-900 border border-slate-800/60">
                      <span className="text-amber-400 font-bold block">{counts.medium}</span>
                      <span className="text-slate-500">Med</span>
                    </div>
                    <div className="p-1 rounded bg-slate-900 border border-slate-800/60">
                      <span className="text-emerald-400 font-bold block">{counts.resolved}</span>
                      <span className="text-slate-500">Fixed</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Tier Findings Drawer / Breakdown */}
      {selectedTierDef && selectedTierVulns && (
        <div className="p-4 bg-slate-950 border border-cyan-900/60 rounded-xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <selectedTierDef.icon className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white">
                {selectedTierDef.title} Findings ({selectedTierVulns.length})
              </h4>
              <span className="text-xs text-slate-400">
                • {selectedTierVulns.filter(v => v.status !== 'resolved').length} Unmitigated
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onFilterByTier && (
                <button
                  onClick={() => onFilterByTier(selectedTierDef.id)}
                  className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                  <span>View in Vulnerability Explorer</span>
                </button>
              )}
              <button
                onClick={() => setSelectedTierId(null)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1"
              >
                Close Tier
              </button>
            </div>
          </div>

          {selectedTierVulns.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">
              No vulnerabilities detected in this architectural tier. Component is hardened according to security heuristics.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {selectedTierVulns.map((vuln) => (
                <div
                  key={vuln.id}
                  onClick={() => onSelectVulnerability && onSelectVulnerability(vuln)}
                  className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg hover:border-cyan-500/60 transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-white truncate">{vuln.title}</span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                      vuln.status === 'resolved'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : vuln.severity === 'critical'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : vuln.severity === 'high'
                        ? 'bg-orange-950 text-orange-400 border border-orange-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {vuln.status === 'resolved' ? 'Resolved' : vuln.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{vuln.description}</p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                    <span>{vuln.cwe}</span>
                    <span className="text-cyan-400 flex items-center gap-0.5">
                      Strategy: {vuln.remediationPlan.strategy.substring(0, 30)}...
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
