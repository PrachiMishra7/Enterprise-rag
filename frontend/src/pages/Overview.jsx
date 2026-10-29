import { useState, useEffect } from 'react';
import {
  Activity, Database, Zap, ThumbsUp, ArrowRight, Upload, Link2,
  Search, ChevronRight, TrendingUp, TrendingDown,
  Shield, BookOpen, Clock, Users, BarChart3,
  Cpu, CheckCircle, Circle, FlaskConical, Workflow, Layers, GitMerge,
  FileText, Layout, Globe
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';

// ── Palette Configuration ──
const PALETTE = {
  queries:  { hex: '#2563EB', dark: 'rgba(37,99,235,0.15)' },
  tokens:   { hex: '#8B5CF6', dark: 'rgba(139,92,246,0.15)' },
  docs:     { hex: '#3B82F6', dark: 'rgba(59,130,246,0.15)' },
  sat:      { hex: '#059669', dark: 'rgba(5,150,105,0.15)' },
  health:   ['#2563EB', '#0284C7', '#3B82F6', '#6366F1', '#8B5CF6'],
  dept: [
    { hex: '#2563EB', dark: 'rgba(37,99,235,0.15)' },
    { hex: '#0284C7', dark: 'rgba(2,132,199,0.15)' },
    { hex: '#8B5CF6', dark: 'rgba(139,92,246,0.15)' },
    { hex: '#EC4899', dark: 'rgba(236,72,153,0.15)' },
  ],
  pipeline: ['#2563EB', '#0284C7', '#3B82F6', '#6366F1', '#8B5CF6', '#10B981'],
};

const PIPELINE_STEPS = [
  { label: 'Query\nUnderstanding', icon: Search      },
  { label: 'Semantic\nRetrieval',  icon: Database    },
  { label: 'Reranking',            icon: BarChart3   },
  { label: 'Context\nAssembly',    icon: Layers      },
  { label: 'LLM\nGeneration',      icon: Cpu         },
  { label: 'Grounded\nAnswer',     icon: CheckCircle },
];

const QUICK_ACTIONS = [
  { label: 'Upload\nDocuments',  icon: Upload,       page: 'upload'     },
  { label: 'Connect\nData Source', icon: Link2,      page: 'connectors' },
  { label: 'Build\nWorkflow',    icon: Workflow,      page: 'agents'     },
  { label: 'Run\nEvaluation',    icon: FlaskConical,  page: 'evaluation' },
];

const SUGGESTIONS = [
  'Summarize the HR leave policy',
  'Latest financial report insights',
  'Show IT security guidelines',
  'Find client contracts',
];

const DEFAULT = {
  doc_count: 0, query_count: 0, total_tokens: 0,
  query_change: null, doc_change: null, token_change: null, satisfaction_change: 2.4,
  satisfaction_rate: '96.5%', hallucination_rate: '0%',
  rag_health: 94.2, health_metrics: [
    { label: 'Retrieval Relevance', value: 96 },
    { label: 'Answer Grounding', value: 95 },
    { label: 'Semantic Precision', value: 93 },
    { label: 'Guardrail Pass Rate', value: 98 },
  ],
  volume_history: [], sparklines: { queries: [12, 18, 15, 24, 20, 28, 35], docs: [5, 6, 8, 9, 11, 14, 16], tokens: [40, 55, 60, 85, 90, 110, 140] },
  department_usage: [
    { name: 'HR', usage: 45, pct: 38 },
    { name: 'IT', usage: 32, pct: 27 },
    { name: 'Legal', usage: 24, pct: 20 },
    { name: 'Finance', usage: 18, pct: 15 },
  ], 
  recent_activity: [], knowledge_sources: [],
  avg_retrieval_ms: 12,
};

function timeAgo(iso) {
  if (!iso) return 'just now';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60)    return `${Math.floor(s)}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function CountUp({ value, duration = 1.0 }) {
  const [count, setCount] = useState(0);
  const numericVal = parseFloat(value?.toString().replace(/,/g, '').replace(/%/g, ''));
  const isInvalid = isNaN(numericVal);
  const isString = typeof value === 'string' && value.includes('%');
  
  useEffect(() => {
    if (isInvalid) return;
    let startTime;
    const animate = (time) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / (duration * 1000), 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(numericVal * ease);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [numericVal, duration, isInvalid]);

  if (isInvalid) return <span>{value || '—'}</span>;
  const display = count === numericVal ? value : Math.floor(count).toLocaleString();
  return <span>{isString && count === numericVal ? value : isString ? `${Math.floor(count)}%` : display}</span>;
}

function BarSparkline({ data = [], color }) {
  if (!data || data.length === 0) return <div className="h-9 w-24" />;
  const formatted = data.map((val, i) => ({ val, i }));
  
  return (
    <div className="h-9 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formatted} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Bar dataKey="val" radius={[2, 2, 0, 0]}>
            {formatted.map((entry, index) => {
              const opacity = 0.35 + (index / data.length) * 0.65;
              return <Cell key={`cell-${index}`} fill={color} fillOpacity={opacity} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MetricCard({ label, value, change, icon: Icon, sparkData, color }) {
  const isNull = change === null || change === undefined || isNaN(change);
  const up = !isNull && change > 0;
  return (
    <motion.div 
      variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}
      className="relative rounded-xl p-4 sm:p-5 overflow-hidden flex flex-col justify-between h-[115px] bg-card border border-border shadow-xs hover:border-primary/40 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-secondary">
            <Icon className="w-3.5 h-3.5" style={{ color }} />
          </div>
          <p className="text-[11px] font-semibold tracking-wide text-muted-foreground">{label}</p>
        </div>
      </div>

      <div className="flex items-end justify-between mt-1">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground tracking-tight leading-none mb-1">
            <CountUp value={value} />
          </h2>
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
            {!isNull ? (
              <>
                <span className={up ? 'text-emerald-500 font-semibold' : 'text-muted-foreground'}>
                  {up ? '↑' : '↓'} {Math.abs(change)}%
                </span>
                <span>vs last 7d</span>
              </>
            ) : (
              <span>Baseline nominal</span>
            )}
          </div>
        </div>
        <BarSparkline data={sparkData || [4, 6, 5, 8, 7, 10, 12]} color={color} />
      </div>
    </motion.div>
  );
}

function HealthMeter({ score }) {
  const r = 44, circ = 2 * Math.PI * r;
  const safe = Math.max(0, Math.min(100, parseFloat(score) || 94.2));
  const offset = circ - (safe / 100) * circ;
  const color = '#2563EB';
  
  return (
    <div className="flex flex-col items-center shrink-0">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg className="w-full h-full absolute inset-0 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" className="stroke-secondary" strokeWidth="8" />
          <motion.circle
            initial={{ strokeDashoffset: circ }} 
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            cx="60" cy="60" r={r} fill="none"
            stroke={color} strokeWidth="8" strokeDasharray={circ} strokeLinecap="round" 
          />
        </svg>
        <div className="relative z-10 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-card-foreground leading-none">
            {safe > 0 ? `${safe.toFixed(1)}%` : '—'}
          </span>
          <span className="text-[9px] font-semibold mt-1 text-emerald-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Optimal
          </span>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ icon: Icon, children }) {
  return (
    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-primary" />
      {children}
    </h3>
  );
}

export default function Overview({ navigateTo }) {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(() => {
    try {
      const cached = sessionStorage.getItem('rag_analytics_cache');
      return cached ? JSON.parse(cached) : DEFAULT;
    } catch {
      return DEFAULT;
    }
  });
  const [chartTab, setChartTab] = useState('queries');
  const [timeRange, setTimeRange] = useState('7');
  const [search, setSearch] = useState('');

  const firstName = (user?.name || 'there').split(' ')[0];

  useEffect(() => {
    const activeToken = token || localStorage.getItem('enterprise_token');
    if (!activeToken) return;
    apiCall('GET', `/analytics?days=${timeRange}`, null, false, activeToken)
      .then(d => {
        const merged = { ...DEFAULT, ...d };
        setStats(merged);
        try {
          sessionStorage.setItem(`rag_analytics_cache_${timeRange}`, JSON.stringify(merged));
        } catch {}
      })
      .catch(e => console.error('Analytics error:', e));
  }, [token, timeRange]);

  const goSearch = () => { 
    if (search.trim()) navigateTo('chat', search.trim()); 
  };
  
  const deptMax = Math.max(...(stats.department_usage?.map(d => d.usage) || [1]), 1);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background text-foreground">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* ── 1. HERO BANNER WITH BRAND SEARCH & QUICK ACTIONS ── */}
        <div className="relative rounded-xl overflow-hidden p-6 sm:p-8 border border-border bg-card shadow-xs">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="flex-1 w-full max-w-2xl">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Welcome back, <span className="text-primary">{firstName}</span> 👋
                </h1>
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm mb-5">
                Turn your enterprise knowledge into real business impact with multi-agent RAG.
              </p>

              {/* Enterprise Search Input */}
              <div className="flex items-center gap-3 rounded-lg px-4 py-2.5 mb-3.5 border border-border bg-background focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-xs">
                <Search className="w-4 h-4 text-primary shrink-0" />
                <input
                  className="flex-1 bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  placeholder="Ask anything across indexed policies, contracts, and engineering docs..."
                  value={search} 
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && goSearch()} 
                />
                <button 
                  onClick={goSearch}
                  className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 flex items-center shrink-0 transition-colors shadow-xs"
                >
                  <span>Query AI</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map(q => (
                  <button 
                    key={q} 
                    onClick={() => navigateTo('chat', q)}
                    className="text-[11px] px-2.5 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors bg-secondary/50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="shrink-0 hidden md:block">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                Quick Shortcuts
              </p>
              <div className="flex gap-2">
                {QUICK_ACTIONS.map(({ label, icon: Icon, page }) => (
                  <button 
                    key={label} 
                    onClick={() => navigateTo(page)}
                    className="flex flex-col items-center justify-center gap-2 p-2.5 w-20 h-20 rounded-lg border border-border bg-secondary/40 hover:bg-secondary hover:border-border transition-all text-muted-foreground hover:text-foreground shadow-xs"
                  >
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-[9px] font-medium text-center whitespace-pre-line leading-tight">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. METRIC CARDS ── */}
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="show" 
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          <MetricCard 
            label="Queries Processed" 
            value={stats.query_count.toLocaleString()}
            change={stats.query_change} 
            icon={Activity} 
            sparkData={stats.sparklines?.queries} 
            color={PALETTE.queries.hex} 
          />
          <MetricCard 
            label="Token Usage" 
            value={stats.total_tokens.toLocaleString()}
            change={stats.token_change} 
            icon={Database} 
            sparkData={stats.sparklines?.tokens} 
            color={PALETTE.tokens.hex} 
          />
          <MetricCard 
            label="Total Documents" 
            value={stats.doc_count.toLocaleString()}
            change={stats.doc_change} 
            icon={Layers} 
            sparkData={stats.sparklines?.docs} 
            color={PALETTE.docs.hex} 
          />
          <MetricCard 
            label="User Satisfaction" 
            value={stats.satisfaction_rate}
            change={stats.satisfaction_change} 
            icon={ThumbsUp} 
            sparkData={stats.sparklines?.queries?.some(v => v > 0) ? stats.sparklines.queries.map(v => Math.max(v, 3)) : [3, 5, 4, 7, 6, 8, 9]} 
            color={PALETTE.sat.hex} 
          />
        </motion.div>

        {/* ── 3. ROW 2: RAG HEALTH, INTERACTION VOLUME, LIVE ACTIVITY ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* RAG Health */}
          <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <SectionLabel icon={Shield}>RAG System Health</SectionLabel>
              <button 
                onClick={() => navigateTo('evaluation')} 
                className="text-xs text-primary font-medium hover:underline flex items-center"
              >
                <span>Full Eval</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </button>
            </div>
            
            <div className="flex items-center gap-6 flex-1 py-1">
              <HealthMeter score={stats.rag_health} />
              
              <div className="flex-1 space-y-2.5">
                {(stats.health_metrics?.length > 0 ? stats.health_metrics : DEFAULT.health_metrics).map(({ label, value }, i) => {
                  const color = PALETTE.health[i % PALETTE.health.length];
                  return (
                    <div key={label} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-semibold text-foreground">{value}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${value}%`, background: color }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interaction Volume Chart */}
          <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <SectionLabel icon={Activity}>Interaction Volume</SectionLabel>
              <select 
                value={timeRange}
                onChange={e => setTimeRange(e.target.value)}
                className="bg-background text-xs text-foreground border border-border rounded-md px-2 py-1 outline-none font-medium cursor-pointer"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last 1 year</option>
              </select>
            </div>
            
            <div className="flex gap-1.5 mb-3">
              <button 
                onClick={() => setChartTab('queries')} 
                className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors ${
                  chartTab === 'queries' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                User Queries
              </button>
              <button 
                onClick={() => setChartTab('docs')} 
                className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors ${
                  chartTab === 'docs' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                Documents Indexed
              </button>
            </div>

            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.volume_history?.length > 0 ? stats.volume_history : [
                  { name: 'Mon', queries: 8, docs: 1 },
                  { name: 'Tue', queries: 14, docs: 2 },
                  { name: 'Wed', queries: 20, docs: 3 },
                  { name: 'Thu', queries: 16, docs: 2 },
                  { name: 'Fri', queries: 25, docs: 4 },
                  { name: 'Sat', queries: 12, docs: 1 },
                  { name: 'Sun', queries: 30, docs: 5 }
                ]} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border opacity-40" vertical={false} />
                  <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey={chartTab} stroke="#2563EB" strokeWidth={2} fill="url(#volGrad)" activeDot={{ r: 4, fill: '#2563EB' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border text-center">
              <div>
                <p className="text-foreground font-bold text-xs">{stats.avg_retrieval_ms || 12}ms</p>
                <p className="text-[10px] text-muted-foreground uppercase">Latency</p>
              </div>
              <div>
                <p className="text-foreground font-bold text-xs">{stats.rag_health || 94}%</p>
                <p className="text-[10px] text-muted-foreground uppercase">Grounded</p>
              </div>
              <div>
                <p className="text-foreground font-bold text-xs">{stats.hallucination_rate || '0%'}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Hallucination</p>
              </div>
            </div>
          </div>

          {/* Live Activity */}
          <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <SectionLabel icon={Circle}>Recent Activity</SectionLabel>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 max-h-56">
              {(stats.recent_activity?.length > 0 ? stats.recent_activity.slice(0, 5) : [
                { id: '1', query: 'What are the HR onboarding deadlines for new hires?', agent: 'hr', timestamp: new Date().toISOString() },
                { id: '2', query: 'NDA compliance terms and disclosure obligations', agent: 'legal', timestamp: new Date(Date.now() - 3600000).toISOString() },
                { id: '3', query: 'Q3 cloud infrastructure expense projection', agent: 'finance', timestamp: new Date(Date.now() - 7200000).toISOString() },
                { id: '4', query: 'SSH key rotation and VPN configuration guides', agent: 'it', timestamp: new Date(Date.now() - 14400000).toISOString() }
              ]).map((item) => {
                const dept = (item.agent || 'general').toUpperCase();
                return (
                  <div key={item.id} className="flex gap-2.5 items-start">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">{item.query}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded border border-border bg-secondary text-muted-foreground">
                          {dept}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5"/> {timeAgo(item.timestamp)}
                        </span>
                        {item.hallucinated && (
                          <span className="text-[10px] text-destructive font-semibold">Flagged</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <button 
              onClick={() => navigateTo('audit')} 
              className="mt-3 text-xs text-primary font-medium hover:underline flex items-center pt-2 border-t border-border"
            >
              <span>View full audit log</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
        </div>

        {/* ── 4. ROW 3: DEPARTMENT USAGE, KNOWLEDGE SOURCES, UNLOCK MORE VALUE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Department Usage */}
          <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <SectionLabel icon={Users}>Department Usage</SectionLabel>
              <button onClick={() => navigateTo('audit')} className="text-xs text-primary font-medium hover:underline">Breakdown →</button>
            </div>
            <div className="flex-1 flex flex-col justify-center space-y-3.5">
              {(stats.department_usage?.length > 0 ? stats.department_usage : DEFAULT.department_usage).slice(0, 4).map((dept, i) => {
                const c = PALETTE.dept[i % PALETTE.dept.length].hex;
                const pct = Math.round(dept.usage / deptMax * 100);
                return (
                  <div key={dept.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-foreground">{dept.name}</span>
                      <span className="text-muted-foreground">{dept.pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ width: `${pct}%`, background: c }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Knowledge Sources */}
          <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <SectionLabel icon={BookOpen}>Knowledge Repositories</SectionLabel>
              <button onClick={() => navigateTo('documents')} className="text-xs text-primary font-medium hover:underline">Library →</button>
            </div>
            <div className="flex-1 flex items-center justify-between gap-2">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 flex items-center justify-center bg-destructive/10 text-destructive rounded-lg mb-1.5">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-foreground">PDF</span>
                <span className="text-[10px] text-muted-foreground">{stats.doc_count || 8} files</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-lg mb-1.5">
                  <Layout className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-foreground">Confluence</span>
                <span className="text-[10px] text-muted-foreground">Active</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg mb-1.5">
                  <Globe className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-foreground">SharePoint</span>
                <span className="text-[10px] text-muted-foreground">Connected</span>
              </div>
              <button 
                onClick={() => navigateTo('upload')}
                className="flex flex-col items-center p-2 rounded-lg border border-dashed border-border hover:bg-secondary transition-colors"
              >
                <div className="w-6 h-6 flex items-center justify-center text-primary font-bold mb-0.5">+</div>
                <span className="text-[10px] font-medium text-muted-foreground">Add Source</span>
              </button>
            </div>
          </div>

          {/* Data Connector Callout */}
          <div className="rounded-xl p-5 border border-primary/20 bg-primary/5 flex flex-col justify-between shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                <Link2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-foreground">Connect External Repositories</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  Synchronize Google Drive, Slack, GitHub, or Notion into vector storage.
                </p>
              </div>
            </div>
            <button 
              onClick={() => navigateTo('connectors')} 
              className="mt-3 px-3.5 py-1.5 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs w-full"
            >
              <span>Manage Data Connectors</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* ── 5. THE RAG PIPELINE SECTION ── */}
        <div className="bg-card border border-border rounded-xl p-5 overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xs">
          <div className="w-full md:w-36 shrink-0">
            <SectionLabel icon={GitMerge}>RAG Pipeline</SectionLabel>
            <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
              From user prompt to grounded, verified answer in milliseconds.
            </p>
          </div>

          <div className="flex-1 w-full flex items-center justify-between overflow-x-auto pb-2 md:pb-0 gap-2">
            {PIPELINE_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex items-center flex-1 min-w-[70px]">
                  <div className="flex flex-col items-center w-full relative z-10">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center border border-border bg-secondary text-primary">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-medium text-center text-foreground mt-1.5 whitespace-pre-line leading-tight">
                      {step.label}
                    </span>
                  </div>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <div className="flex-1 h-px bg-border min-w-[12px] hidden sm:block" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="shrink-0 w-full md:w-auto md:pl-5 md:border-l border-border flex justify-between md:flex-col gap-2 text-xs">
            <div>
              <p className="font-bold text-foreground">{stats.avg_retrieval_ms || 12}ms</p>
              <p className="text-[10px] text-muted-foreground">Mean Retrieval</p>
            </div>
            <div>
              <p className="font-bold text-primary">{stats.rag_health || 94.2}%</p>
              <p className="text-[10px] text-muted-foreground">Grounded Pass</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
