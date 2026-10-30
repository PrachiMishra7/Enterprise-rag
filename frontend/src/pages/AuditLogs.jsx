import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall, API_BASE } from '../utils/api';
import Loader from '../components/Loader';
import { 
  ShieldAlert, CheckCircle2, Clock, Shield, Search, 
  Filter, RefreshCw, Download, Calendar, User, Building,
  FileSpreadsheet, FileJson, ArrowDownToLine, Zap
} from 'lucide-react';

export default function AuditLogs() {
  const { token, user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activePreset, setActivePreset] = useState('all');

  const isAdmin = user?.role === 'admin';

  // Date Presets Handler
  const applyPreset = (preset) => {
    setActivePreset(preset);
    const today = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      const dStr = toYMD(today);
      setStartDate(dStr);
      setEndDate(dStr);
    } else if (preset === '7d') {
      const past = new Date(today);
      past.setDate(today.getDate() - 7);
      setStartDate(toYMD(past));
      setEndDate(toYMD(today));
    } else if (preset === '30d') {
      const past = new Date(today);
      past.setDate(today.getDate() - 30);
      setStartDate(toYMD(past));
      setEndDate(toYMD(today));
    }
  };

  const fetchAuditLogs = () => {
    if (!token) return;
    setLoading(true);

    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (selectedAgent && selectedAgent !== 'All') params.append('agent', selectedAgent);
    if (selectedStatus && selectedStatus !== 'All') params.append('status', selectedStatus);

    const queryString = params.toString() ? `?${params.toString()}` : '';

    apiCall('GET', `/audit${queryString}`, null, false, token)
      .then(data => {
        setLogs(data.logs || []);
      })
      .catch(e => {
        console.error("Failed to load audit logs", e);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [token, startDate, endDate, selectedAgent, selectedStatus]);

  // Client-side quick search & dept filtering for immediate UI feedback
  const filteredLogs = logs.filter(log => {
    const q = search.toLowerCase();
    const matchesSearch = !search || 
      (log.query && log.query.toLowerCase().includes(q)) ||
      (log.user && log.user.toLowerCase().includes(q)) ||
      (log.department && log.department.toLowerCase().includes(q)) ||
      (log.agent && log.agent.toLowerCase().includes(q));

    const matchesDept = selectedDept === 'All' || 
      (log.department && log.department.toLowerCase() === selectedDept.toLowerCase());

    return matchesSearch && matchesDept;
  });

  // Export report generator (direct stream from backend database)
  const handleExport = async (format = 'csv') => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      params.append('format', format);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const downloadUrl = `${API_BASE}/audit/export?${params.toString()}`;
      const res = await fetch(downloadUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!res.ok) throw new Error("Report generation failed");

      const blob = await res.blob();
      const filename = `VeriRAG_Security_Audit_Report_${new Date().toISOString().slice(0,10)}.${format}`;
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert("Failed to export report: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const agents = ['All', ...new Set(logs.map(l => l.agent).filter(Boolean))];
  const departments = ['All', 'hr', 'legal', 'finance', 'it', 'general'];

  // Summary counts
  const totalEvents = filteredLogs.length;
  const flaggedEvents = filteredLogs.filter(l => l.hallucinated).length;
  const safeEvents = totalEvents - flaggedEvents;
  const avgConfidence = totalEvents > 0 
    ? Math.round(filteredLogs.reduce((acc, l) => acc + (l.confidence * 100), 0) / totalEvents) 
    : 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background text-foreground">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Audit & Security Ledger
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase font-mono">
                {isAdmin ? 'Global Administrator View' : `${user?.department?.toUpperCase()} Partition`}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Immutable ledger of LLM queries, multi-agent dispatch routing, confidence scores, and guardrail validations across all dates.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={fetchAuditLogs}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Refresh ledger"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
              <span>Refresh</span>
            </button>

            {/* Export Report Actions */}
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Download Datewise CSV Report"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{exporting ? 'Generating...' : 'Export CSV Report'}</span>
            </button>

            <button
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Download JSON Report"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* ── Datewise Metrics Summary Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl border border-border bg-card/90 backdrop-blur-md shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
              <span>Total Audit Records</span>
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-extrabold text-foreground mt-2">{totalEvents}</div>
            <div className="text-[10px] text-muted-foreground mt-1">
              {startDate && endDate ? `${startDate} to ${endDate}` : 'All-time active records'}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card/90 backdrop-blur-md shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
              <span>Grounded & Verified</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">{safeEvents}</div>
            <div className="text-[10px] text-muted-foreground mt-1">Guardrail verified grounded</div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card/90 backdrop-blur-md shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
              <span>Flagged Hallucinations</span>
              <ShieldAlert className="w-4 h-4 text-destructive" />
            </div>
            <div className="text-2xl font-extrabold text-destructive mt-2">{flaggedEvents}</div>
            <div className="text-[10px] text-muted-foreground mt-1">Security mitigated queries</div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card/90 backdrop-blur-md shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
              <span>Mean Grounding Score</span>
              <Zap className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="text-2xl font-extrabold text-foreground mt-2">{avgConfidence}%</div>
            <div className="text-[10px] text-muted-foreground mt-1">Average response confidence</div>
          </div>
        </div>

        {/* ── Datewise Range & Filtering Toolbar ── */}
        <div className="p-4 rounded-xl border border-border bg-card/90 backdrop-blur-md shadow-xs space-y-3.5">
          {/* Date Presets Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date Filters:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All Dates' },
                { id: 'today', label: 'Today' },
                { id: '7d', label: 'Last 7 Days' },
                { id: '30d', label: 'Last 30 Days' },
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    activePreset === p.id 
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs' 
                      : 'bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Date Pickers */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1 bg-secondary/50 border border-border rounded-lg px-2 py-1">
                <span className="text-muted-foreground text-[11px]">From:</span>
                <input 
                  type="date"
                  value={startDate}
                  onChange={e => {
                    setStartDate(e.target.value);
                    setActivePreset('custom');
                  }}
                  className="bg-transparent text-foreground outline-none text-xs cursor-pointer font-mono"
                />
              </div>

              <div className="flex items-center gap-1 bg-secondary/50 border border-border rounded-lg px-2 py-1">
                <span className="text-muted-foreground text-[11px]">To:</span>
                <input 
                  type="date"
                  value={endDate}
                  onChange={e => {
                    setEndDate(e.target.value);
                    setActivePreset('custom');
                  }}
                  className="bg-transparent text-foreground outline-none text-xs cursor-pointer font-mono"
                />
              </div>

              {(startDate || endDate) && (
                <button
                  onClick={() => applyPreset('all')}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline ml-1 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Search & Attribute Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search audit trail by prompt, actor, or department..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-background border border-border rounded-lg text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 flex-wrap">
              {isAdmin && (
                <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground">
                  <Building className="w-3.5 h-3.5" />
                  <select 
                    value={selectedDept}
                    onChange={e => setSelectedDept(e.target.value)}
                    className="bg-transparent text-foreground outline-none text-xs font-medium cursor-pointer"
                  >
                    {departments.map(d => (
                      <option key={d} value={d} className="bg-card text-foreground">
                        {d === 'All' ? 'All Departments' : d.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground">
                <Filter className="w-3.5 h-3.5" />
                <select 
                  value={selectedAgent}
                  onChange={e => setSelectedAgent(e.target.value)}
                  className="bg-transparent text-foreground outline-none text-xs font-medium cursor-pointer"
                >
                  {agents.map(a => (
                    <option key={a} value={a} className="bg-card text-foreground">
                      {a === 'All' ? 'All Agents' : a.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5" />
                <select 
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="bg-transparent text-foreground outline-none text-xs font-medium cursor-pointer"
                >
                  <option value="All" className="bg-card text-foreground">All Security States</option>
                  <option value="safe" className="bg-card text-foreground">Safe / Grounded</option>
                  <option value="flagged" className="bg-card text-foreground">Flagged Hallucinations</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── Table Container ── */}
        <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-secondary/50 border-b border-border text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                  <th className="py-3 px-4">Date & Timestamp</th>
                  <th className="py-3 px-4">User & Department</th>
                  <th className="py-3 px-4">Prompt Query</th>
                  <th className="py-3 px-4">Routed Agent</th>
                  <th className="py-3 px-4 text-center">Tokens</th>
                  <th className="py-3 px-4 text-center">Confidence</th>
                  <th className="py-3 px-4 text-center">Security Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                        <Loader size="sm" />
                        <span>Querying live database audit ledger...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-muted-foreground">
                      No security audit records match your date range and search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const deptLower = (log.department || 'general').toLowerCase();
                    const deptBadgeColor = 
                      deptLower === 'hr' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                      deptLower === 'legal' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                      deptLower === 'finance' ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' :
                      deptLower === 'it' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' :
                      'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';

                    const confPct = Math.round(log.confidence * 100);

                    return (
                      <tr key={log.id} className="hover:bg-secondary/30 transition-colors">
                        {/* Timestamp */}
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap font-mono text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span>
                              {log.timestamp 
                                ? new Date(log.timestamp).toLocaleString(undefined, { 
                                    year: 'numeric', month: 'short', day: 'numeric', 
                                    hour: '2-digit', minute: '2-digit' 
                                  })
                                : log.date || '—'}
                            </span>
                          </div>
                        </td>

                        {/* User & Department */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-foreground flex items-center gap-1">
                              <User className="w-3 h-3 text-muted-foreground" />
                              {log.user || 'System'}
                            </span>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border w-fit ${deptBadgeColor}`}>
                              {log.department || 'general'}
                            </span>
                          </div>
                        </td>

                        {/* Prompt Query */}
                        <td className="py-3 px-4 font-medium text-foreground max-w-sm truncate" title={log.query}>
                          {log.query}
                        </td>

                        {/* Routed Agent */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-secondary text-foreground text-[10px] font-semibold uppercase tracking-wider border border-border">
                            {log.agent}
                          </span>
                        </td>

                        {/* Tokens */}
                        <td className="py-3 px-4 text-center font-mono text-[11px] text-muted-foreground">
                          {log.tokens_used || 0}
                        </td>

                        {/* Confidence */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-14 h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${confPct >= 70 ? 'bg-emerald-500' : confPct >= 45 ? 'bg-amber-500' : 'bg-destructive'}`} 
                                style={{ width: `${confPct}%` }}
                              />
                            </div>
                            <span className="font-mono font-semibold text-[11px] w-8 text-right">{confPct}%</span>
                          </div>
                        </td>

                        {/* Security Status */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex justify-center">
                            {log.hallucinated ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-full text-[10px] font-semibold">
                                <ShieldAlert className="w-3 h-3" /> Flagged
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-semibold">
                                <CheckCircle2 className="w-3 h-3" /> Grounded
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-3 bg-secondary/30 border-t border-border flex items-center justify-between text-xs text-muted-foreground px-4">
            <span>Showing {filteredLogs.length} datewise ledger records directly from database</span>
            <span className="font-mono text-[11px]">Strict RBAC & Audit Compliance</span>
          </div>
        </div>

      </div>
    </div>
  );
}
