import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';
import Loader from '../components/Loader';
import { 
  ShieldAlert, CheckCircle2, Clock, Shield, Search, 
  Filter, RefreshCw, AlertTriangle, ArrowUpDown 
} from 'lucide-react';

export default function AuditLogs() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const fetchAuditLogs = () => {
    if (token) {
      setLoading(true);
      apiCall('GET', '/audit', null, false, token)
        .then(data => {
          setLogs(data.logs || []);
        })
        .catch(e => {
          console.error("Failed to load audit logs", e);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [token]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.query.toLowerCase().includes(search.toLowerCase()) ||
                          log.agent.toLowerCase().includes(search.toLowerCase());
    const matchesAgent = selectedAgent === 'All' || log.agent === selectedAgent;
    const matchesStatus = selectedStatus === 'All' || 
                          (selectedStatus === 'flagged' ? log.hallucinated : !log.hallucinated);
    return matchesSearch && matchesAgent && matchesStatus;
  });

  const agents = ['All', ...new Set(logs.map(l => l.agent).filter(Boolean))];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background text-foreground">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Audit & Security Logs
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Immutable ledger of LLM queries, multi-agent dispatch routing, confidence scores, and guardrail validations.
            </p>
          </div>

          <button 
            onClick={fetchAuditLogs}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs w-fit"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search audit trail by query or actor..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-card border border-border rounded-lg text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground">
              <Filter className="w-3.5 h-3.5" />
              <select 
                value={selectedAgent}
                onChange={e => setSelectedAgent(e.target.value)}
                className="bg-transparent text-foreground outline-none text-xs font-medium cursor-pointer"
              >
                {agents.map(a => (
                  <option key={a} value={a} className="bg-card text-foreground">{a === 'All' ? 'All Agents' : a.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground">
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

        {/* Table Container */}
        <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-secondary/50 border-b border-border text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Prompt Query</th>
                  <th className="py-3 px-4">Routed Agent</th>
                  <th className="py-3 px-4 text-center">Confidence</th>
                  <th className="py-3 px-4 text-center">Security Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                        <Loader size="sm" />
                        <span>Fetching security audit records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-muted-foreground">
                      No security audit records match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span>{new Date(log.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground max-w-md truncate" title={log.query}>
                        {log.query}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-secondary text-foreground text-[10px] font-semibold uppercase tracking-wider border border-border">
                          {log.agent}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-14 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${log.confidence >= 70 ? 'bg-emerald-500' : log.confidence >= 45 ? 'bg-amber-500' : 'bg-destructive'}`} 
                              style={{ width: `${log.confidence}%` }}
                            />
                          </div>
                          <span className="font-mono font-semibold text-[11px] w-7 text-right">{log.confidence}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
