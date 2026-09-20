import { useState, useEffect } from 'react';
import {
  Activity, Database, Zap, ThumbsUp, ArrowRight, Upload, Link2,
  Search, ChevronRight, TrendingUp, TrendingDown, Minus,
  Shield, BookOpen, Clock, Users, BarChart3,
  Cpu, CheckCircle, Circle, FlaskConical, Workflow, Layers, GitMerge,
  FileText, Layout, Globe
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';

// ─── Inspiration Replica Palette ──────────────────────────────────────────────
const PALETTE = {
  queries:  { hex: '#06b6d4', dark: 'rgba(6,182,212,0.15)' },  // Cyan
  tokens:   { hex: '#a855f7', dark: 'rgba(168,85,247,0.15)' }, // Purple
  docs:     { hex: '#3b82f6', dark: 'rgba(59,130,246,0.15)' }, // Blue
  sat:      { hex: '#94a3b8', dark: 'rgba(148,163,184,0.15)' },// Slate
  health:   ['#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6'], // Cyan to Purple
  dept: [
    { hex: '#3b82f6', dark: 'rgba(59,130,246,0.15)' },
    { hex: '#06b6d4', dark: 'rgba(6,182,212,0.15)' },
    { hex: '#a855f7', dark: 'rgba(168,85,247,0.15)' },
    { hex: '#ec4899', dark: 'rgba(236,72,153,0.15)' },
  ],
  pipeline: ['#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef'],
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
  { label: 'Run\nEvaluation',    icon: FlaskConical,  page: 'tools'      },
];
const SUGGESTIONS = [
  'Summarize the HR leave policy',
  'Latest financial report insights',
  'Show IT security guidelines',
  'Find client contracts',
];

const DEFAULT = {
  doc_count:0, query_count:0, total_tokens:0,
  query_change:null, doc_change:null, token_change:null, satisfaction_change:null,
  satisfaction_rate:'—', hallucination_rate:'0%',
  rag_health:0, health_metrics:[],
  volume_history:[], sparklines:{ queries:[], docs:[], tokens:[] },
  department_usage:[], recent_activity:[], knowledge_sources:[],
  avg_retrieval_ms:12,
};

// ─── helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso) {
  if (!iso) return 'just now';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60)    return `${Math.floor(s)}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function CountUp({ value, duration = 1.2 }) {
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

// ─── Bar Sparkline (Matching inspiration) ─────────────────────────────────────
function BarSparkline({ data = [], color }) {
  if (!data || data.length === 0) return <div className="h-10 w-24" />;
  const formatted = data.map((val, i) => ({ val, i }));
  
  return (
    <div className="h-10 w-28">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formatted} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Bar dataKey="val" radius={[2, 2, 0, 0]}>
            {formatted.map((entry, index) => {
              // Fade out older bars (lower index) to simulate the gradient fade in inspiration
              const opacity = 0.3 + (index / data.length) * 0.7;
              return <Cell key={`cell-${index}`} fill={color} fillOpacity={opacity} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({ label, value, change, icon: Icon, sparkData, color }) {
  const isNull = change === null || change === undefined || isNaN(change);
  const up = !isNull && change > 0;
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ y: -4, boxShadow: `0 10px 30px ${color}15` }} transition={{ type: 'spring', stiffness: 280 }}
      className="relative rounded-2xl p-5 overflow-hidden flex flex-col justify-between h-[120px] transition-shadow duration-300 bg-card border border-border">
      
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/5 dark:bg-white/5">
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <p className="text-[11px] font-bold tracking-wide text-muted-foreground">{label}</p>
        </div>
      </div>

      <div className="flex items-end justify-between mt-2">
        <div>
          <h2 className="text-3xl font-bold text-card-foreground tracking-tight leading-none mb-1">
            <CountUp value={value} />
          </h2>
          <div className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: up ? '#10b981' : '#64748b' }}>
            {!isNull ? (
              <><span>{up ? '↑' : '↓'} {Math.abs(change)}%</span><span className="text-muted-foreground/80 font-medium">vs last 7 days</span></>
            ) : (
              <span className="text-muted-foreground/60 font-medium">— no prior data</span>
            )}
          </div>
        </div>
        <BarSparkline data={sparkData || []} color={color} />
      </div>
    </motion.div>
  );
}

// ─── RAG Health Gauge (Cyan matching inspiration) ──────────────────────────────
function HealthMeter({ score }) {
  const r = 48, circ = 2 * Math.PI * r;
  const safe   = Math.max(0, Math.min(100, parseFloat(score) || 0));
  const offset = circ - (safe / 100) * circ;
  const color = '#06b6d4'; // Cyan
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Glow */}
        <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)' }} />
        <svg className="w-full h-full absolute inset-0 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" className="stroke-border" strokeWidth="8" />
          <motion.circle
            initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            cx="60" cy="60" r={r} fill="none"
            stroke={color} strokeWidth="8" strokeDasharray={circ} strokeLinecap="round" />
        </svg>
        <div className="relative z-10 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-card-foreground leading-none">
            {safe > 0 ? `${safe.toFixed(1)}%` : '—'}
          </span>
          <span className="text-[9px] font-bold mt-1 text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span> Excellent
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ icon: Icon, children }) {
  return (
    <h3 className="text-xs font-bold text-muted-foreground flex items-center gap-2">
      <Icon className="w-4 h-4 text-muted-foreground/80" />
      {children}
    </h3>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
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
  const [search, setSearch]     = useState('');

  const firstName = (user?.name || 'there').split(' ')[0];

  useEffect(() => {
    const activeToken = token || localStorage.getItem('enterprise_token');
    if (!activeToken) return;
    apiCall('GET', '/analytics', null, false, activeToken)
      .then(d => {
        const merged = { ...DEFAULT, ...d };
        setStats(merged);
        try {
          sessionStorage.setItem('rag_analytics_cache', JSON.stringify(merged));
        } catch {}
      })
      .catch(e => console.error('Analytics:', e));
  }, [token]);

  const goSearch = () => { if (search.trim()) navigateTo('chat', search.trim()); };
  const deptMax  = Math.max(...(stats.department_usage?.map(d => d.usage) || [0]), 1);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background text-foreground">
      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-4">

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[20px] overflow-hidden p-8 border border-border group bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-[#0f172a] dark:to-[#1e1b4b]"
          style={{ backgroundSize: '200% 200%' }}>
          <motion.div animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                      transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 z-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-[#0f172a] dark:to-[#1e1b4b]" style={{ backgroundSize: '200% 200%' }} />
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
            <div className="flex-1 w-full max-w-2xl">
              <h1 className="text-[28px] font-bold text-foreground mb-1">
                Welcome back, <span className="text-cyan-600 dark:text-cyan-400">{firstName} 👋</span>
              </h1>
              <p className="text-muted-foreground text-sm mb-6">
                Turn your enterprise knowledge into real business impact.
              </p>

              {/* Glassmorphism Search */}
              <div className="flex items-center gap-3 rounded-full px-5 py-3 mb-4 backdrop-blur-md transition-all focus-within:ring-2 focus-within:ring-cyan-500/50 hover:bg-black/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 bg-white/50 dark:bg-slate-800/50">
                <Search className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                <input
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/80 outline-none"
                  placeholder="Ask anything across your organization's knowledge..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && goSearch()} />
                <button onClick={goSearch}
                  className="px-4 py-1.5 rounded-full text-xs font-bold text-white flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(59,130,246,0.3)] bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-purple-600">
                  Enterprise <ChevronRight className="w-3 h-3 ml-1" />
                </button>
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map(q => (
                  <button key={q} onClick={() => navigateTo('chat', q)}
                    className="text-[10px] px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 text-muted-foreground hover:text-foreground hover:border-black/20 dark:hover:border-white/20 transition-all bg-black/5 dark:bg-white/5">
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions (Matching screenshot cards) */}
            <div className="flex-shrink-0 z-10 hidden md:block">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</p>
              <div className="flex gap-2">
                {QUICK_ACTIONS.map(({ label, icon: Icon, page }) => (
                  <motion.button key={label} whileHover={{ y: -2 }} onClick={() => navigateTo(page)}
                    className="flex flex-col items-center justify-center gap-2 p-3 w-[85px] h-[85px] rounded-xl border border-black/10 dark:border-white/5 bg-white/60 dark:bg-slate-900/60 hover:bg-white/90 dark:hover:bg-slate-800/80 transition-all">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <span className="text-[9px] font-medium text-center text-muted-foreground/80 whitespace-pre-line leading-tight">{label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── METRIC CARDS ─────────────────────────────────────────────── */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Queries Processed" value={stats.query_count.toLocaleString()}
            change={stats.query_change} icon={Activity} sparkData={stats.sparklines?.queries} color={PALETTE.queries.hex} />
          <MetricCard label="Token Usage" value={stats.total_tokens.toLocaleString()}
            change={stats.token_change} icon={Database} sparkData={stats.sparklines?.tokens} color={PALETTE.tokens.hex} />
          <MetricCard label="Total Documents" value={stats.doc_count.toLocaleString()}
            change={stats.doc_change} icon={Layers} sparkData={stats.sparklines?.docs} color={PALETTE.docs.hex} />
          <MetricCard label="User Satisfaction" value={stats.satisfaction_rate}
            change={stats.satisfaction_change} icon={Users} sparkData={stats.sparklines?.queries?.map(v => v * 0.9)} color={PALETTE.sat.hex} />
        </motion.div>

        {/* ── ROW 2 ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 h-[320px]">

          {/* RAG Health */}
          <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <SectionLabel icon={Shield}>RAG System Health</SectionLabel>
              <button onClick={() => navigateTo('tools')} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center">
                View Details <ArrowRight className="w-3 h-3 ml-1" />
              </button>
            </div>
            
            <div className="flex items-center gap-8 flex-1">
              <HealthMeter score={stats.rag_health} />
              
              <div className="flex-1 space-y-4">
                {stats.health_metrics?.length > 0
                  ? stats.health_metrics.map(({ label, value }, i) => {
                      const color = PALETTE.health[i % PALETTE.health.length];
                      return (
                        <div key={label} className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-sm flex items-center justify-center shrink-0" style={{ background: `${color}20` }}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground flex-1">{label}</span>
                          <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden shrink-0">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1 }}
                              className="h-full rounded-full" style={{ background: color }} />
                          </div>
                          <span className="text-[10px] font-bold text-card-foreground w-8 text-right">{value}%</span>
                        </div>
                      );
                    })
                  : <p className="text-muted-foreground/60 text-xs">No data</p>}
              </div>
            </div>
          </div>

          {/* Interaction Volume */}
          <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <SectionLabel icon={Activity}>Interaction Volume</SectionLabel>
              <select className="bg-transparent text-xs text-muted-foreground border border-border rounded p-1 outline-none">
                <option>Last 7 days</option>
              </select>
            </div>
            
            <div className="flex gap-2 mb-4">
              <button onClick={() => setChartTab('queries')} className={`text-[10px] px-3 py-1 rounded-full border ${chartTab==='queries'?'border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10':'border-border text-muted-foreground'}`}>User Queries</button>
              <button onClick={() => setChartTab('docs')} className={`text-[10px] px-3 py-1 rounded-full border ${chartTab==='docs'?'border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10':'border-border text-muted-foreground'}`}>Documents Indexed</button>
            </div>

            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.volume_history || []} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-foreground)' }} />
                  <Area type="monotone" dataKey={chartTab} stroke="#3b82f6" strokeWidth={2} fill="url(#volGrad)" activeDot={{ r: 4, fill: '#fff' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom stat summary inside chart card */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
               <div>
                 <p className="text-card-foreground font-bold text-sm">{stats.avg_retrieval_ms}ms</p>
                 <p className="text-[9px] text-muted-foreground/80 uppercase">Avg Retrieval</p>
               </div>
               <div>
                 <p className="text-card-foreground font-bold text-sm">{stats.rag_health}%</p>
                 <p className="text-[9px] text-muted-foreground/80 uppercase">Grounded</p>
               </div>
               <div>
                 <p className="text-card-foreground font-bold text-sm">{stats.hallucination_rate}</p>
                 <p className="text-[9px] text-muted-foreground/80 uppercase">Hallucination</p>
               </div>
            </div>
          </div>

          {/* Live Activity */}
          <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden flex flex-col h-full">
            <div className="flex items-center justify-between mb-5">
              <SectionLabel icon={Circle}>Live Activity</SectionLabel>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span> Live
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
              {stats.recent_activity?.slice(0,5).map((item, i) => {
                const colors = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'];
                const c = colors[i % colors.length];
                const dept = (item.agent || 'general').toUpperCase();
                return (
                  <div key={item.id} className="flex gap-3 items-start">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${c}20` }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }}></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{item.query}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border border-border text-muted-foreground/80">{dept}</span>
                        <span className="text-[9px] text-muted-foreground/80 flex items-center gap-1"><Clock className="w-2 h-2"/> {timeAgo(item.timestamp)}</span>
                        {item.hallucinated && <span className="text-[9px] text-red-500 dark:text-red-400">⚠ Flagged</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <button onClick={() => navigateTo('audit')} className="mt-4 text-[10px] text-muted-foreground hover:text-foreground flex items-center">
              View all activity <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
        </div>

        {/* ── ROW 3 ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[220px]">
          
          {/* Department Usage */}
          <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden flex flex-col h-full lg:col-span-1">
            <div className="flex items-center justify-between mb-5">
              <SectionLabel icon={Users}>Department Usage</SectionLabel>
              <button onClick={() => navigateTo('audit')} className="text-[10px] text-muted-foreground hover:text-foreground">View Breakdown →</button>
            </div>
            <div className="flex-1 flex flex-col justify-center space-y-5">
              {stats.department_usage?.filter(d=>d.usage>0).slice(0,4).map((dept, i) => {
                const c = PALETTE.dept[i % PALETTE.dept.length].hex;
                const pct = Math.round(dept.usage / deptMax * 100);
                return (
                  <div key={dept.name} className="flex items-center gap-3">
                    <span className="text-[10px] font-medium text-muted-foreground/80 w-8">{dept.name}</span>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }}
                        className="h-full rounded-full" style={{ background: c }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground/80 w-6 text-right">{dept.pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Knowledge Sources */}
          <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden flex flex-col h-full lg:col-span-1">
            <div className="flex items-center justify-between mb-5">
              <SectionLabel icon={BookOpen}>Top Knowledge Sources</SectionLabel>
              <button onClick={() => navigateTo('documents')} className="text-[10px] text-muted-foreground hover:text-foreground">View Sources →</button>
            </div>
            <div className="flex-1 flex items-center justify-between gap-2">
              <div className="flex flex-col items-center">
                 <div className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-500 rounded-lg mb-2"><FileText className="w-4 h-4" /></div>
                 <span className="text-[10px] font-bold text-card-foreground">PDF</span>
                 <span className="text-[9px] text-muted-foreground/80">8 docs</span>
              </div>
              <div className="flex flex-col items-center">
                 <div className="w-8 h-8 flex items-center justify-center bg-blue-500/10 text-blue-500 rounded-lg mb-2"><Layout className="w-4 h-4" /></div>
                 <span className="text-[10px] font-bold text-card-foreground">Confluence</span>
                 <span className="text-[9px] text-muted-foreground/80">1 space</span>
              </div>
              <div className="flex flex-col items-center">
                 <div className="w-8 h-8 flex items-center justify-center bg-emerald-500/10 text-emerald-500 rounded-lg mb-2"><Globe className="w-4 h-4" /></div>
                 <span className="text-[10px] font-bold text-card-foreground">SharePoint</span>
                 <span className="text-[9px] text-muted-foreground/80">1 site</span>
              </div>
              <div className="flex flex-col items-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-2 rounded-xl border border-dashed border-border transition-colors" onClick={() => navigateTo('upload')}>
                 <div className="w-6 h-6 flex items-center justify-center text-muted-foreground/80 mb-1">+</div>
                 <span className="text-[9px] text-muted-foreground/80">Add Source</span>
              </div>
            </div>
          </div>

          {/* Unlock more value banner */}
          <div className="rounded-2xl p-6 relative overflow-hidden flex flex-col h-full justify-center lg:col-span-1 border border-blue-500/20 bg-blue-50/50 dark:bg-transparent"
               style={{ background: 'linear-gradient(135deg, var(--color-card) 0%, var(--color-background) 100%)' }}>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 100% 100%, #3b82f6 0%, transparent 50%)' }} />
            
            <div className="relative z-10 flex items-start gap-4">
               <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                 <Link2 className="w-5 h-5 text-white" />
               </div>
               <div>
                 <h3 className="text-sm font-bold text-card-foreground mb-1">Unlock more value</h3>
                 <p className="text-[10px] text-muted-foreground mb-4 leading-relaxed">
                   Connect more data sources to improve coverage and answer quality.
                 </p>
                 <button onClick={() => navigateTo('connectors')} className="text-[10px] font-bold text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-full transition-colors flex items-center">
                   Add Data Source <ArrowRight className="w-3 h-3 ml-1" />
                 </button>
               </div>
            </div>
          </div>

        </div>

        {/* ── RAG PIPELINE ─────────────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden flex items-center gap-6">
          <div className="w-32 shrink-0">
             <SectionLabel icon={GitMerge}>The RAG Pipeline</SectionLabel>
             <p className="text-[9px] text-muted-foreground/80 mt-2 leading-relaxed">From your question to a grounded answer, in seconds.</p>
          </div>

          <div className="flex-1 flex items-center justify-between">
            {PIPELINE_STEPS.map((step, i) => {
              const active = stats.query_count > 0;
              const color = PALETTE.pipeline[i];
              return (
                <div key={step.label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center w-full relative z-10">
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.1 }}
                      className="w-10 h-10 rounded-full flex items-center justify-center border-2 bg-card"
                      style={{ borderColor: active ? color : 'var(--color-border)', boxShadow: active ? `0 0 15px ${color}30` : 'none' }}>
                      <step.icon className="w-4 h-4" style={{ color: active ? color : 'var(--color-muted-foreground)' }} />
                    </motion.div>
                    <span className="text-[9px] font-bold text-center mt-2 leading-tight" style={{ color: active ? 'var(--color-foreground)' : 'var(--color-muted-foreground)' }}>
                      {step.label}
                    </span>
                  </div>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <div className="flex-1 h-px relative -ml-4 -mr-4 z-0 overflow-hidden">
                      <div className="absolute inset-0" style={{ background: active ? `linear-gradient(to right, ${color}, ${PALETTE.pipeline[i+1]})` : 'var(--color-border)' }} />
                      
                      {active && (
                        <motion.div
                          animate={{ x: ['-10%', '110%'] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: i * 0.4 }}
                          className="absolute top-1/2 -translate-y-1/2 w-4 h-1 blur-[1px] rounded-full"
                          style={{ background: '#fff', boxShadow: `0 0 10px ${color}` }}
                        />
                      )}
                      
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t border-r rotate-45" style={{ borderColor: active ? PALETTE.pipeline[i+1] : 'var(--color-border)' }}></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="shrink-0 pl-6 border-l border-border flex gap-6">
            <div>
              <p className="text-card-foreground font-bold text-lg">{stats.avg_retrieval_ms}ms</p>
              <p className="text-[9px] text-muted-foreground/80">Avg. retrieval time</p>
            </div>
            <div>
              <p className="text-cyan-600 dark:text-cyan-400 font-bold text-lg">{stats.rag_health}%</p>
              <p className="text-[9px] text-muted-foreground/80">Answer grounded</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
