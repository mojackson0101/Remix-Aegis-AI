import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { ScanResult } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Calendar, 
  Filter, 
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface SecurityScoreTrendChartProps {
  scans: ScanResult[];
  currentScan: ScanResult | null;
  onSelectScan: (scan: ScanResult) => void;
  onOpenHistoryPanel?: () => void;
}

export const SecurityScoreTrendChart: React.FC<SecurityScoreTrendChartProps> = ({
  scans,
  currentScan,
  onSelectScan,
  onOpenHistoryPanel,
}) => {
  const [filterDomain, setFilterDomain] = useState<string>('all');

  // Unique domains in history for optional filtering
  const uniqueDomains = useMemo(() => {
    const domains = new Set<string>();
    scans.forEach((s) => {
      if (s.target?.domain) domains.add(s.target.domain);
    });
    return Array.from(domains);
  }, [scans]);

  // Filtered and chronologically sorted scans (oldest to newest for left-to-right timeline)
  const chartData = useMemo(() => {
    let filtered = scans;
    if (filterDomain !== 'all') {
      filtered = scans.filter((s) => s.target?.domain === filterDomain);
    }

    return [...filtered]
      .sort((a, b) => new Date(a.scannedAt).getTime() - new Date(b.scannedAt).getTime())
      .map((item, index) => {
        const d = new Date(item.scannedAt);
        const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isCurrent = currentScan?.scanId === item.scanId;

        return {
          scanId: item.scanId,
          domain: item.target.domain,
          url: item.target.normalizedUrl,
          score: item.securityScore,
          grade: item.riskGrade,
          totalVulns: item.stats.total,
          criticalHigh: item.stats.critical + item.stats.high,
          resolved: item.stats.resolved,
          dateStr,
          timeStr,
          displayLabel: `#${index + 1} ${dateStr}`,
          fullItem: item,
          isCurrent,
        };
      });
  }, [scans, filterDomain, currentScan]);

  // Analytical Metrics
  const metrics = useMemo(() => {
    if (chartData.length === 0) {
      return {
        latestScore: 0,
        latestGrade: 'F',
        delta: 0,
        average: 0,
        compliantRate: 0,
      };
    }

    const scores = chartData.map((d) => d.score);
    const latest = chartData[chartData.length - 1];
    const earliest = chartData[0];
    const delta = chartData.length > 1 ? latest.score - earliest.score : 0;
    const sum = scores.reduce((acc, s) => acc + s, 0);
    const average = Math.round(sum / scores.length);
    const compliantCount = scores.filter((s) => s >= 75).length;
    const compliantRate = Math.round((compliantCount / scores.length) * 100);

    return {
      latestScore: latest.score,
      latestGrade: latest.grade,
      delta,
      average,
      compliantRate,
    };
  }, [chartData]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-cyan-500/40 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[200px] z-50">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
            <span className="font-bold text-white font-mono truncate max-w-[140px]">
              {data.domain}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/50">
              Grade {data.grade}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">Security Score:</span>
            <span className="font-mono font-bold text-base text-cyan-300">
              {data.score}
              <span className="text-[11px] text-slate-400 font-normal">/100</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
            <div>
              <span className="text-slate-500 block">Threats</span>
              <span className="font-mono text-rose-400 font-medium">
                {data.criticalHigh} Crit/High
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Patched</span>
              <span className="font-mono text-emerald-400 font-medium">
                {data.resolved}/{data.totalVulns}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
            <span>{data.dateStr} at {data.timeStr}</span>
            <span className="text-cyan-400 font-semibold">Click point to view →</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Dot renderer highlighting current scan
  const renderCustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const isCurrent = payload.isCurrent;
    const isGood = payload.score >= 75;

    return (
      <g
        key={`dot-${payload.scanId}`}
        onClick={() => onSelectScan(payload.fullItem)}
        className="cursor-pointer"
      >
        {isCurrent && (
          <circle
            cx={cx}
            cy={cy}
            r={10}
            fill="none"
            stroke="#06b6d4"
            strokeWidth={2}
            className="animate-ping opacity-60"
          />
        )}
        <circle
          cx={cx}
          cy={cy}
          r={isCurrent ? 6 : 4}
          fill={isCurrent ? '#22d3ee' : isGood ? '#10b981' : '#f43f5e'}
          stroke="#0f172a"
          strokeWidth={2}
          className="transition-transform hover:scale-150"
        />
      </g>
    );
  };

  return (
    <section 
      id="security-score-trends-section"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5 transition-all"
    >
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/90">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-cyan-950/80 rounded-lg text-cyan-400 border border-cyan-800/50">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Security Score Trends & Historical Progression
            </h3>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {chartData.length} assessments
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time trajectory tracking vulnerability mitigations and risk posture changes across previous penetration tests.
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {uniqueDomains.length > 1 && (
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
              <select
                id="trend-chart-domain-filter"
                value={filterDomain}
                onChange={(e) => setFilterDomain(e.target.value)}
                className="bg-transparent text-slate-300 focus:outline-none cursor-pointer pr-1"
              >
                <option value="all" className="bg-slate-900 text-slate-200">All Target Domains ({uniqueDomains.length})</option>
                {uniqueDomains.map((d) => (
                  <option key={d} value={d} className="bg-slate-900 text-slate-200">
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {onOpenHistoryPanel && (
            <button
              onClick={onOpenHistoryPanel}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Past Scans List</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Latest Posture */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Latest Score
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold font-mono text-white">
              {metrics.latestScore}
            </span>
            <span className="text-xs text-slate-400">/100</span>
            <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 ml-auto">
              Grade {metrics.latestGrade}
            </span>
          </div>
        </div>

        {/* Score Trajectory */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Score Trajectory
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className={`text-2xl font-bold font-mono ${metrics.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {metrics.delta >= 0 ? `+${metrics.delta}` : metrics.delta}
            </span>
            <span className="text-xs text-slate-400">pts</span>
            <div className="ml-auto">
              {metrics.delta >= 0 ? (
                <div className="p-1 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="p-1 rounded bg-rose-950/60 text-rose-400 border border-rose-800/50">
                  <TrendingDown className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fleet Average */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Historical Average
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold font-mono text-white">
              {metrics.average}
            </span>
            <span className="text-xs text-slate-400">/100</span>
            <span className="text-[11px] text-slate-500 ml-auto font-mono">
              Across timeline
            </span>
          </div>
        </div>

        {/* Compliance Pass Rate */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Compliance Pass Rate
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold font-mono text-cyan-400">
              {metrics.compliantRate}%
            </span>
            <span className="text-[11px] text-slate-500 ml-auto font-mono">
              Score ≥ 75
            </span>
          </div>
        </div>
      </div>

      {/* Recharts Line Chart Container */}
      <div className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3 font-mono">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 bg-cyan-400 inline-block"></span>
              <span className="text-slate-300">Security Score (0-100)</span>
            </div>
            <div className="hidden sm:flex items-center space-x-1.5 text-slate-500">
              <span className="w-3 h-0.5 border-t border-dashed border-emerald-500 inline-block"></span>
              <span>80 Pt Compliance Benchmark</span>
            </div>
          </div>
          <span className="text-slate-500 text-[11px]">Click point to toggle assessment</span>
        </div>

        {chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center space-y-2 text-slate-500">
            <Activity className="w-8 h-8 opacity-40 text-cyan-400" />
            <p className="text-xs">No scan trend records match the active filter.</p>
          </div>
        ) : (
          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length > 0) {
                    onSelectScan(e.activePayload[0].payload.fullItem);
                  }
                }}
              >
                <CartesianGrid 
                  stroke="#1e293b" 
                  strokeDasharray="3 3" 
                  vertical={false} 
                />
                
                <XAxis 
                  dataKey="displayLabel"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#334155' }}
                  axisLine={{ stroke: '#334155' }}
                />
                
                <YAxis 
                  domain={[0, 100]} 
                  ticks={[0, 20, 40, 60, 80, 100]}
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#334155' }}
                  axisLine={{ stroke: '#334155' }}
                />

                {/* Benchmark line for 80 (Grade B+ / Good Posture) */}
                <ReferenceLine 
                  y={80} 
                  stroke="#10b981" 
                  strokeDasharray="4 4" 
                  strokeOpacity={0.6}
                  label={{ 
                    value: 'Hardened (80)', 
                    fill: '#10b981', 
                    fontSize: 10, 
                    position: 'insideTopRight',
                    fontFamily: 'monospace'
                  }} 
                />

                <Tooltip content={<CustomTooltip />} />

                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={renderCustomDot}
                  activeDot={{ 
                    r: 8, 
                    fill: '#22d3ee', 
                    stroke: '#0f172a', 
                    strokeWidth: 2 
                  }}
                  isAnimationActive={true}
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Target Points Quick Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-white">Timeline Nodes:</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {chartData.map((d) => (
              <button
                key={`btn-${d.scanId}`}
                onClick={() => onSelectScan(d.fullItem)}
                className={`px-2 py-1 rounded-md text-[11px] font-mono transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                  d.isCurrent
                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/70 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${d.score >= 75 ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                <span>{d.domain}</span>
                <span className="font-bold text-slate-300">({d.score})</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
