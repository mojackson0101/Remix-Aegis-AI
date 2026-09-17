import React, { useState, useEffect } from 'react';
import { ThreatNewsItem } from '../types';
import { 
  Radio, 
  RefreshCw, 
  ExternalLink, 
  AlertTriangle, 
  ShieldAlert, 
  Search, 
  Copy, 
  Check, 
  Clock, 
  Filter, 
  ChevronDown, 
  ChevronUp,
  Flame,
  Globe,
  Tag
} from 'lucide-react';

interface ThreatIntelWidgetProps {
  onSearchInFindings?: (query: string) => void;
  targetDomain?: string;
}

export const ThreatIntelWidget: React.FC<ThreatIntelWidgetProps> = ({
  onSearchInFindings,
  targetDomain,
}) => {
  const [headlines, setHeadlines] = useState<ThreatNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sourceInfo, setSourceInfo] = useState<string>('Live Public Security Intelligence');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedCve, setCopiedCve] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const fetchThreatIntel = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const url = forceRefresh ? '/api/threat-intelligence?refresh=true' : '/api/threat-intelligence';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.headlines && Array.isArray(data.headlines)) {
          setHeadlines(data.headlines);
          if (data.source) setSourceInfo(data.source);
          setLastUpdated(new Date());
        }
      }
    } catch (err) {
      console.warn('Threat intelligence fetch warning:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchThreatIntel();
    // Auto-poll threat intel feed every 5 minutes
    const interval = setInterval(() => {
      fetchThreatIntel(false);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyCve = (cve: string) => {
    navigator.clipboard.writeText(cve);
    setCopiedCve(cve);
    setTimeout(() => setCopiedCve(null), 2000);
  };

  // Filter headlines
  const filteredHeadlines = headlines.filter((item) => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCategory;

    const matchesSearch =
      item.title.toLowerCase().includes(query) ||
      item.summary.toLowerCase().includes(query) ||
      item.source.toLowerCase().includes(query) ||
      (item.cveIds && item.cveIds.some((c) => c.toLowerCase().includes(query)));

    return matchesCategory && matchesSearch;
  });

  const categories = ['ALL', 'Zero-Day', 'Critical CVE', 'Ransomware', 'Cloud Security', 'Advisory'];

  const getRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <aside 
      id="threat-intelligence-sidebar-widget"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-full transition-all"
    >
      {/* Widget Header */}
      <div className="p-4 border-b border-slate-800/90 bg-slate-950/70">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <div className="flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white tracking-tight">Threat Intelligence Radar</h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="refresh-threat-intel-btn"
              onClick={() => fetchThreatIntel(true)}
              disabled={isRefreshing || isLoading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              title="Fetch latest threat intelligence advisories"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer lg:hidden"
              title={isCollapsed ? 'Expand threat intel widget' : 'Collapse threat intel widget'}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Source info subtext */}
        <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
          <span className="truncate max-w-[200px]" title={sourceInfo}>
            Feed: {sourceInfo}
          </span>
          <span className="font-mono text-slate-500 shrink-0">
            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Expandable / Collapsible Container */}
      {!isCollapsed && (
        <div className="p-3.5 sm:p-4 space-y-3 flex-1 flex flex-col min-h-0">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search threat advisories, CVEs, or APTs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950/90 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition-colors"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded-md whitespace-nowrap font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-semibold'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Headlines Scroll Area */}
          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[480px] lg:max-h-[520px] pr-1">
            {isLoading ? (
              <div className="p-8 text-center space-y-2">
                <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Connecting to live threat feeds...</p>
              </div>
            ) : filteredHeadlines.length === 0 ? (
              <div className="p-6 text-center bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-2">
                <ShieldAlert className="w-5 h-5 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">No threat advisories match filter.</p>
                <button
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setSearchQuery('');
                  }}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              filteredHeadlines.map((item) => {
                const isItemExpanded = expandedId === item.id;
                const isCritical = item.severity === 'critical';
                const isHigh = item.severity === 'high';

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all text-xs space-y-2 ${
                      isCritical
                        ? 'bg-rose-950/20 border-rose-900/40 hover:border-rose-700/60'
                        : isHigh
                        ? 'bg-orange-950/20 border-orange-900/40 hover:border-orange-700/60'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Header Row: Category Tag, Severity & Time */}
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                            isCritical
                              ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                              : isHigh
                              ? 'bg-orange-950/80 text-orange-300 border-orange-800'
                              : 'bg-amber-950/80 text-amber-300 border-amber-800'
                          }`}
                        >
                          {item.severity}
                        </span>

                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                          {item.category}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 shrink-0">
                        <Clock className="w-2.5 h-2.5 text-slate-500" />
                        {getRelativeTime(item.publishedAt)}
                      </span>
                    </div>

                    {/* Headline Title */}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-slate-100 hover:text-cyan-300 leading-snug flex items-start justify-between gap-1.5 group cursor-pointer"
                    >
                      <span className="line-clamp-2">{item.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0 mt-0.5" />
                    </a>

                    {/* Source attribution & CVE tag */}
                    <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-400">
                      <span className="text-slate-400 font-mono text-[10px] truncate max-w-[160px]">
                        {item.source}
                      </span>

                      {item.cveIds && item.cveIds.length > 0 && (
                        <div className="flex items-center gap-1">
                          {item.cveIds.slice(0, 2).map((cve) => (
                            <button
                              key={cve}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyCve(cve);
                              }}
                              className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-rose-300 hover:bg-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
                              title="Click to copy CVE ID"
                            >
                              {copiedCve === cve ? (
                                <Check className="w-2.5 h-2.5 text-emerald-400" />
                              ) : (
                                <Tag className="w-2.5 h-2.5 text-rose-400" />
                              )}
                              <span>{cve}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Summary & Affected Systems */}
                    <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-3">
                      {item.summary}
                    </p>

                    {/* Affected systems footer */}
                    {item.affectedSystems && (
                      <div className="text-[10px] text-slate-500 font-mono bg-slate-900/80 px-2 py-1 rounded border border-slate-800/80 flex items-center justify-between">
                        <span className="text-slate-400">Target:</span>
                        <span className="text-slate-300 truncate max-w-[190px]">{item.affectedSystems}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
