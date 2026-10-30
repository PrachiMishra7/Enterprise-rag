import { useState, useEffect } from 'react';
import {
  Activity, Database, Zap, ThumbsUp, ArrowRight, Upload, Link2,
  Search, ChevronRight, TrendingUp, TrendingDown,
  Shield, BookOpen, Clock, Users, BarChart3,
  Cpu, CheckCircle, Circle, FlaskConical, Workflow, Layers, GitMerge,
  FileText, Layout, Globe, Lock, UserCheck, Briefcase, Scale, DollarSign,
  Download, FileSpreadsheet, Calendar, Table
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { apiCall, API_BASE } from '../utils/api';
import { hasPageAccess } from '../utils/permissions';

// ── VeriRAG Palette Configuration (Suits both Light & Dark modes) ──
const PALETTE = {
  queries:  { hex: '#10B981', dark: 'rgba(16,185,129,0.18)' },
  tokens:   { hex: '#06B6D4', dark: 'rgba(6,182,212,0.18)' },
  docs:     { hex: '#3B82F6', dark: 'rgba(59,130,246,0.18)' },
  sat:      { hex: '#059669', dark: 'rgba(5,150,105,0.18)' },
  health:   ['#10B981', '#34D399', '#06B6D4', '#3B82F6', '#8B5CF6'],
  dept: [
    { hex: '#10B981', dark: 'rgba(16,185,129,0.18)' },
    { hex: '#06B6D4', dark: 'rgba(6,182,212,0.18)' },
    { hex: '#8B5CF6', dark: 'rgba(139,92,246,0.18)' },
    { hex: '#F59E0B', dark: 'rgba(245,158,11,0.18)' },
  ],
  pipeline: ['#10B981', '#34D399', '#06B6D4', '#3B82F6', '#8B5CF6', '#10B981'],
};

const PIPELINE_STEPS = [
  { label: 'Query\nUnderstanding', icon: Search      },
  { label: 'Semantic\nRetrieval',  icon: Database    },
  { label: 'Reranking',            icon: BarChart3   },
  { label: 'Context\nAssembly',    icon: Layers      },
  { label: 'LLM\nGeneration',      icon: Cpu         },
  { label: 'Grounded\nAnswer',     icon: CheckCircle },
];

// Role-specific config presets
const ROLE_CONFIGS = {
  admin: {
    badge: 'Enterprise Administrator',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    icon: Shield,
    subtitle: 'Full visibility across corporate vector partitions, data connectors, and system governance.',
    quickActions: [
      { label: 'Upload\nDocs', icon: Upload, page: 'upload' },
      { label: 'Connect\nData Source', icon: Link2, page: 'connectors' },
      { label: 'Multi-Agent\nFlows', icon: Workflow, page: 'agents' },
      { label: 'System\nEvaluation', icon: FlaskConical, page: 'evaluation' },
    ],
    suggestions: [
      'Show enterprise query audit trends',
      'Review vector database capacity and latency',
      'List all user roles and permissions',
      'Check model hallucination rate'
    ]
  },
  manager: {
    badge: 'Operations & Team Lead',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    icon: Layers,
    subtitle: 'Team oversight, multi-agent workflow pipelines, and cross-departmental research.',
    quickActions: [
      { label: 'Ask\nAI Assistant', icon: Search, page: 'chat' },
      { label: 'Build\nWorkflow', icon: Workflow, page: 'agents' },
      { label: 'Knowledge\nGraph', icon: BookOpen, page: 'kg' },
      { label: 'System\nEvaluation', icon: FlaskConical, page: 'evaluation' },
    ],
    suggestions: [
      'Compare Q3 deliverables across teams',
      'Summarize workflow automation opportunities',
      'Search cross-department engineering and policy docs',
      'Test AI model reasoning on project briefs'
    ]
  },
  hr_admin: {
    badge: 'HR & People Operations',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    icon: Briefcase,
    subtitle: 'HR policies, employee onboarding, benefits intelligence, and confidential HR audit.',
    quickActions: [
      { label: 'Upload\nHR Policy', icon: Upload, page: 'upload' },
      { label: 'Ask\nHR AI', icon: Search, page: 'chat' },
      { label: 'Document\nLibrary', icon: BookOpen, page: 'documents' },
      { label: 'HR\nAudit Logs', icon: Shield, page: 'audit' },
    ],
    suggestions: [
      'Summarize the ACME 2026 leave policy',
      'What are the maternity and paternity allowances?',
      'Show healthcare and emergency assistance protocol',
      'Check standard remote work guidelines'
    ]
  },
  legal_admin: {
    badge: 'Legal & Compliance Officer',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    icon: Scale,
    subtitle: 'Contract governance, regulatory compliance, NDA analysis, and risk mitigation.',
    quickActions: [
      { label: 'Upload\nContract', icon: Upload, page: 'upload' },
      { label: 'Analyze\nClauses', icon: Search, page: 'chat' },
      { label: 'Knowledge\nGraph', icon: BookOpen, page: 'kg' },
      { label: 'Legal\nAudit Logs', icon: Shield, page: 'audit' },
    ],
    suggestions: [
      'Find client contracts with indemnity clauses',
      'Summarize confidentiality terms across recent NDAs',
      'Review intellectual property assignment language',
      'Check GDPR data handling compliance rules'
    ]
  },
  finance_admin: {
    badge: 'Finance & Treasury',
    badgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    icon: DollarSign,
    subtitle: 'Financial statements, budgeting intelligence, expense policies, and audit trails.',
    quickActions: [
      { label: 'Upload\nReport', icon: Upload, page: 'upload' },
      { label: 'Analyze\nFinancials', icon: Search, page: 'chat' },
      { label: 'Knowledge\nGraph', icon: BookOpen, page: 'kg' },
      { label: 'Audit\nTrails', icon: Shield, page: 'audit' },
    ],
    suggestions: [
      'Extract revenue trends from Q2 financial reports',
      'What is the employee travel reimbursement policy?',
      'Compare vendor spending thresholds',
      'Summarize fiscal year tax compliance guidance'
    ]
  },
  employee: {
    badge: 'Employee Workspace',
    badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    icon: UserCheck,
    subtitle: 'Your personal AI assistant for company policies, internal knowledge, and document search.',
    quickActions: [
      { label: 'Ask\nAI Assistant', icon: Search, page: 'chat' },
      { label: 'Browse\nCompany Docs', icon: BookOpen, page: 'documents' },
      { label: 'AI\nUtilities', icon: Zap, page: 'tools' },
      { label: 'Leave\nPolicy', icon: FileText, page: 'chat' },
    ],
    suggestions: [
      'How many annual leave days do I have?',
      'What are the standard health insurance benefits?',
      'Find the company code of conduct guide',
      'Help me draft a professional project proposal'
    ]
  }
};

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
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function MetricCard({ label, value, change, icon: Icon, sparkData, color }) {
  const isNull = change === null || change === undefined || isNaN(change);
  return (
    <motion.div 
      variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="relative rounded-2xl p-4 sm:p-5 overflow-hidden flex flex-col justify-between h-[122px] bg-card/90 backdrop-blur-md border border-border shadow-xs hover:border-[#10B981]/50 hover:shadow-md hover:shadow-[#10B981]/10 transition-all circuit-border group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-secondary/80 border border-border/60 group-hover:bg-[#10B981]/15 group-hover:border-[#10B981]/30 transition-colors">
            <Icon className="w-4 h-4 transition-transform group-hover:scale-110" style={{ color }} />
          </div>
          <p className="text-[11px] font-semibold tracking-wide text-muted-foreground">{label}</p>
        </div>
        {!isNull && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
            change >= 0 
              ? 'bg-[#10B981]/15 text-[#10B981] dark:text-[#34D399]' 
              : 'bg-rose-500/15 text-rose-500'
          }`}>
            {change >= 0 ? '↑' : '↓'}{Math.abs(change)}%
          </span>
        )}
      </div>

      <div className="flex items-end justify-between mt-2">
        <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
          {value || '—'}
        </div>
        {sparkData && sparkData.length > 0 && (
          <div className="h-7 w-20 opacity-80 group-hover:opacity-100 transition-opacity">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sparkData.map((val, i) => ({ val, i }))} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Bar dataKey="val" radius={[3, 3, 0, 0]}>
                  {sparkData.map((_, index) => (
                    <Cell key={index} fill={color} fillOpacity={0.45 + (index / sparkData.length) * 0.55} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
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
  const [stats, setStats] = useState(DEFAULT);
  const [chartTab, setChartTab] = useState('queries');
  const [timeRange, setTimeRange] = useState('7');
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  const userRole = user?.role || 'employee';
  const roleConfig = ROLE_CONFIGS[userRole] || ROLE_CONFIGS.employee;
  const firstName = (user?.name || 'Colleague').split(' ')[0];

  useEffect(() => {
    const activeToken = token || localStorage.getItem('enterprise_token');
    if (!activeToken) return;
    apiCall('GET', `/analytics?days=${timeRange}`, null, false, activeToken)
      .then(d => {
        setStats({ ...DEFAULT, ...d });
      })
      .catch(e => console.error('Analytics error:', e));
  }, [token, timeRange]);

  const handleExportAnalytics = async (format = 'csv') => {
    try {
      setExporting(true);
      const downloadUrl = `${API_BASE}/analytics/export?days=${timeRange}&format=${format}`;
      const activeToken = token || localStorage.getItem('enterprise_token');
      const res = await fetch(downloadUrl, {
        headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : {}
      });
      if (!res.ok) throw new Error("Executive report generation failed");
      const blob = await res.blob();
      const filename = `VeriRAG_Executive_Analytics_${timeRange}Days_${new Date().toISOString().slice(0,10)}.${format}`;
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert("Failed to export executive analytics: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const goSearch = () => { 
    if (search.trim()) navigateTo('chat', search.trim()); 
  };
  
  const deptMax = Math.max(...(stats.department_usage?.map(d => d.usage) || [1]), 1);

  // Filter department list to highlight current user department if applicable
  const displayDepartments = stats.department_usage || DEFAULT.department_usage;

  return (
    <div className="flex-1 overflow-y-auto bg-background text-foreground">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* ── 1. PERSONALIZED HERO BANNER (VERIRAG AMBIENT GLOW & CIRCUIT ACCENTS) ── */}
        <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8 border border-border bg-card/90 backdrop-blur-md shadow-xs circuit-border">
          {/* Subtle VeriRAG emerald radial background aura */}
          <div className="absolute top-0 right-0 w-[420px] h-[420px] rounded-full bg-[#10B981]/10 dark:bg-[#10B981]/15 blur-[120px] pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="flex-1 w-full max-w-2xl">
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  Welcome back, <span className="text-primary">{firstName}</span> 👋
                </h1>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs ${roleConfig.badgeClass}`}>
                  {roleConfig.badge}
                </span>
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm mb-5 leading-relaxed">
                {roleConfig.subtitle}
              </p>

              {/* Enterprise Search Input */}
              <div className="flex items-center gap-3 rounded-lg px-4 py-2.5 mb-3.5 border border-border bg-background focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-xs">
                <Search className="w-4 h-4 text-primary shrink-0" />
                <input
                  className="flex-1 bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  placeholder={`Search ${userRole === 'admin' ? 'all corporate documents' : user?.department ? user.department.toUpperCase() + ' knowledge partition' : 'company knowledge'}...`}
                  value={search} 
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && goSearch()} 
                />
                <button 
                  onClick={goSearch}
                  className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 flex items-center shrink-0 transition-colors shadow-xs cursor-pointer"
                >
                  <span>Query AI</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>

              {/* Role-tailored Suggestions */}
              <div className="flex flex-wrap gap-1.5">
                {roleConfig.suggestions.map(q => (
                  <button 
                    key={q} 
                    onClick={() => navigateTo('chat', q)}
                    className="text-[11px] px-2.5 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors bg-secondary/50 cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Role-Specific Quick Actions */}
            <div className="shrink-0 hidden md:block">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                Your Workspace Tools
              </p>
              <div className="flex gap-2">
                {roleConfig.quickActions.map(({ label, icon: Icon, page }) => (
                  <button 
                    key={label} 
                    onClick={() => navigateTo(page)}
                    className="flex flex-col items-center justify-center gap-2 p-2.5 w-20 h-20 rounded-lg border border-border bg-secondary/40 hover:bg-secondary hover:border-border transition-all text-muted-foreground hover:text-foreground shadow-xs cursor-pointer"
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

        {/* ── 2. ROLE-ADAPTIVE METRIC CARDS ── */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          {userRole === 'admin' ? (
            <>
              <MetricCard 
                label="Total System Queries" 
                value={stats.query_count.toLocaleString()}
                change={stats.query_change} 
                icon={Activity} 
                sparkData={stats.sparklines?.queries} 
                color={PALETTE.queries.hex} 
              />
              <MetricCard 
                label="Global Token Usage" 
                value={stats.total_tokens.toLocaleString()}
                change={stats.token_change} 
                icon={Database} 
                sparkData={stats.sparklines?.tokens} 
                color={PALETTE.tokens.hex} 
              />
              <MetricCard 
                label="Indexed Documents" 
                value={stats.doc_count.toLocaleString()}
                change={stats.doc_change} 
                icon={Layers} 
                sparkData={stats.sparklines?.docs} 
                color={PALETTE.docs.hex} 
              />
              <MetricCard 
                label="Overall System Health" 
                value={`${stats.rag_health}%`}
                change={stats.satisfaction_change} 
                icon={Shield} 
                sparkData={[92, 93, 94, 94, 95, 96, 97]} 
                color={PALETTE.sat.hex} 
              />
            </>
          ) : userRole === 'manager' ? (
            <>
              <MetricCard 
                label="Team Queries" 
                value={stats.query_count.toLocaleString()}
                change={stats.query_change} 
                icon={Activity} 
                sparkData={stats.sparklines?.queries} 
                color={PALETTE.queries.hex} 
              />
              <MetricCard 
                label="Active Workflow Agents" 
                value="4" 
                change={12.5} 
                icon={Workflow} 
                sparkData={[2, 3, 3, 4, 4, 4, 4]} 
                color={PALETTE.tokens.hex} 
              />
              <MetricCard 
                label="Accessible Knowledge" 
                value={stats.doc_count.toLocaleString()}
                change={stats.doc_change} 
                icon={Layers} 
                sparkData={stats.sparklines?.docs} 
                color={PALETTE.docs.hex} 
              />
              <MetricCard 
                label="Answer Accuracy" 
                value={stats.satisfaction_rate}
                change={stats.satisfaction_change} 
                icon={ThumbsUp} 
                sparkData={[88, 91, 92, 94, 95, 96, 97]} 
                color={PALETTE.sat.hex} 
              />
            </>
          ) : userRole === 'employee' ? (
            <>
              <MetricCard 
                label="Your Queries Asked" 
                value="24"
                change={8.3} 
                icon={Activity} 
                sparkData={[2, 4, 3, 5, 4, 3, 6]} 
                color={PALETTE.queries.hex} 
              />
              <MetricCard 
                label="Department Documents" 
                value={Math.max(stats.doc_count || 5, 5).toString()}
                change={null} 
                icon={BookOpen} 
                sparkData={[4, 4, 5, 5, 5, 5, 5]} 
                color={PALETTE.docs.hex} 
              />
              <MetricCard 
                label="Retrieved Citations" 
                value="86" 
                change={14.2} 
                icon={Layers} 
                sparkData={[8, 12, 10, 15, 14, 18, 22]} 
                color={PALETTE.tokens.hex} 
              />
              <MetricCard 
                label="Assistant Grounding" 
                value="98.2%"
                change={null} 
                icon={ThumbsUp} 
                sparkData={[95, 96, 96, 97, 98, 98, 98]} 
                color={PALETTE.sat.hex} 
              />
            </>
          ) : (
            // Department Admins (HR, Legal, Finance)
            <>
              <MetricCard 
                label={`${(user?.department || 'Department').toUpperCase()} Queries`} 
                value={stats.query_count.toLocaleString()}
                change={stats.query_change} 
                icon={Activity} 
                sparkData={stats.sparklines?.queries} 
                color={PALETTE.queries.hex} 
              />
              <MetricCard 
                label="Scoped Partition Docs" 
                value={stats.doc_count.toLocaleString()}
                change={stats.doc_change} 
                icon={Layers} 
                sparkData={stats.sparklines?.docs} 
                color={PALETTE.docs.hex} 
              />
              <MetricCard 
                label="Audit Trail Events" 
                value="42" 
                change={5.0} 
                icon={Shield} 
                sparkData={[5, 8, 10, 6, 7, 9, 12]} 
                color={PALETTE.tokens.hex} 
              />
              <MetricCard 
                label="Compliance Grounding" 
                value="99.1%"
                change={1.2} 
                icon={ThumbsUp} 
                sparkData={[97, 98, 98, 99, 99, 99, 99]} 
                color={PALETTE.sat.hex} 
              />
            </>
          )}
        </motion.div>

        {/* ── 3. ROW 2: DEPARTMENT SEGREGATION & HEALTH ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Department Partition / Security Scope Card */}
          <div className="bg-card/90 backdrop-blur-md border border-border hover:border-[#10B981]/40 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xs circuit-border transition-all hover:shadow-md hover:shadow-[#10B981]/5">
            <div className="flex items-center justify-between mb-4">
              <SectionLabel icon={Shield}>Department Partitioning</SectionLabel>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase font-mono shadow-2xs">
                {user?.department || 'general'}
              </span>
            </div>

            <div className="space-y-3 flex-1 flex flex-col justify-center">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Vector retrieval uses role-bounded PGVector filters. Chunks tagged with restricted departments cannot be leaked to other tiers.
              </p>

              <div className="p-3 rounded-lg bg-secondary/50 border border-border text-xs space-y-1.5 font-mono text-muted-foreground">
                <div className="flex justify-between">
                  <span>Current Scope:</span>
                  <strong className="text-foreground">{userRole}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Authorized Tiers:</span>
                  <span className="text-emerald-500 font-semibold">
                    {userRole === 'admin' ? 'All (hr, legal, finance, general)' : `${user?.department || 'general'}, employee`}
                  </span>
                </div>
              </div>

              {hasPageAccess(userRole, 'documents') && (
                <button 
                  onClick={() => navigateTo('documents')} 
                  className="text-xs text-primary font-medium hover:underline flex items-center pt-1"
                >
                  <span>Review scoped document library</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </button>
              )}
            </div>
          </div>

          {/* Interaction Volume Chart */}
          <div className="bg-card/90 backdrop-blur-md border border-border hover:border-[#10B981]/40 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xs circuit-border transition-all hover:shadow-md hover:shadow-[#10B981]/5">
            <div className="flex items-center justify-between mb-3">
              <SectionLabel icon={Activity}>Usage Activity</SectionLabel>
              <div className="flex items-center gap-1.5">
                <select 
                  value={timeRange}
                  onChange={e => setTimeRange(e.target.value)}
                  className="bg-background text-xs text-foreground border border-border rounded-md px-2 py-1 outline-none font-medium cursor-pointer"
                >
                  <option value="7">Last 7 days</option>
                  <option value="14">Last 14 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last 1 Year</option>
                </select>
                <button
                  onClick={() => handleExportAnalytics('csv')}
                  disabled={exporting}
                  className="px-2 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  title="Export datewise analytics to CSV"
                >
                  <FileSpreadsheet className="w-3 h-3" />
                  <span>{exporting ? '...' : 'Report'}</span>
                </button>
              </div>
            </div>
            
            <div className="flex gap-1.5 mb-3">
              <button 
                onClick={() => setChartTab('queries')} 
                className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  chartTab === 'queries' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                Queries
              </button>
              <button 
                onClick={() => setChartTab('docs')} 
                className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  chartTab === 'docs' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                Indexed Chunks
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
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={PALETTE[chartTab].hex} stopOpacity={0.35}/>
                      <stop offset="95%" stopColor={PALETTE[chartTab].hex} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="rgba(128,128,128,0.4)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="rgba(128,128,128,0.4)" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} 
                  />
                  <Area type="monotone" dataKey={chartTab} stroke={PALETTE[chartTab].hex} fill="url(#chartGradient)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Segregation Breakdown */}
          <div className="bg-card/90 backdrop-blur-md border border-border hover:border-[#10B981]/40 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xs circuit-border transition-all hover:shadow-md hover:shadow-[#10B981]/5">
            <div className="flex items-center justify-between mb-4">
              <SectionLabel icon={Users}>Department Breakdown</SectionLabel>
              <span className="text-[10px] text-muted-foreground font-mono">RBAC Isolated</span>
            </div>
            <div className="flex-1 flex flex-col justify-center space-y-3.5">
              {displayDepartments.slice(0, 4).map((dept, i) => {
                const c = PALETTE.dept[i % PALETTE.dept.length].hex;
                const pct = Math.round((dept.usage / deptMax) * 100);
                const isUserDept = user?.department?.toLowerCase() === dept.name.toLowerCase();
                return (
                  <div key={dept.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-foreground flex items-center gap-1.5">
                        <span>{dept.name}</span>
                        {isUserDept && (
                          <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-semibold">You</span>
                        )}
                      </span>
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

        </div>

        {/* ── 4. RAG PIPELINE SECTION ── */}
        <div className="bg-card border border-border rounded-xl p-5 overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xs">
          <div className="w-full md:w-44 shrink-0">
            <SectionLabel icon={GitMerge}>RAG Pipeline</SectionLabel>
            <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
              Role-verified contextual grounding across company vector stores.
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
              <p className="text-[10px] text-muted-foreground">Mean Latency</p>
            </div>
            <div>
              <p className="font-bold text-primary">{stats.rag_health || 94.2}%</p>
              <p className="text-[10px] text-muted-foreground">Grounding Pass</p>
            </div>
          </div>
        </div>

        {/* ── 5. ENTERPRISE DATEWISE ACTIVITY LEDGER (LIVE DB STREAM) ── */}
        <div className="bg-card/90 backdrop-blur-md border border-border rounded-2xl p-5 sm:p-6 shadow-xs circuit-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <SectionLabel icon={Table}>Datewise Activity Ledger</SectionLabel>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                  Live Database Stream
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Daily record of LLM queries, token consumption, and document uploads over the selected timeframe ({timeRange} days).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportAnalytics('csv')}
                disabled={exporting}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{exporting ? 'Generating...' : 'Export Datewise CSV'}</span>
              </button>

              <button
                onClick={() => handleExportAnalytics('json')}
                disabled={exporting}
                className="px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-secondary/50 border-b border-border text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                  <th className="py-2.5 px-4">Calendar Date</th>
                  <th className="py-2.5 px-4 text-center">Queries Processed</th>
                  <th className="py-2.5 px-4 text-center">Tokens Used</th>
                  <th className="py-2.5 px-4 text-center">Documents Uploaded</th>
                  <th className="py-2.5 px-4 text-center">System Status</th>
                  <th className="py-2.5 px-4 text-right">Audit Trail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.volume_history && stats.volume_history.length > 0 ? (
                  stats.volume_history.map((day, idx) => (
                    <tr key={day.date || idx} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{day.date || day.name}</span>
                          <span className="text-[10px] text-muted-foreground">({day.name})</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-center font-semibold text-foreground">
                        {day.queries}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono text-muted-foreground">
                        {day.tokens ? day.tokens.toLocaleString() : '0'}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-secondary text-foreground text-[11px] font-medium border border-border">
                          {day.docs || 0}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-semibold border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" /> Nominal
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => navigateTo('audit')}
                          className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Inspect Logs</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-muted-foreground">
                      No query volume recorded yet for this time window.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
