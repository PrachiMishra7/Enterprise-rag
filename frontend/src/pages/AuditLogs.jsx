import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';
import Loader from '../components/Loader';
import { ShieldAlert, CheckCircle, Clock, Shield } from 'lucide-react';

export default function AuditLogs() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      apiCall('GET', '/audit', null, false, token)
        .then(data => {
          setLogs(data.logs || []);
          setLoading(false);
        })
        .catch(e => {
          console.error("Failed to load audit logs", e);
          setLoading(false);
        });
    }
  }, [token]);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-background text-foreground">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Audit & Security Logs</h1>
          </div>
          <p className="text-xs text-muted-foreground ml-12">Real-time track of all LLM queries, multi-agent routing, and hallucination events.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/40 border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="p-4 font-bold">Timestamp</th>
                  <th className="p-4 font-bold">Query</th>
                  <th className="p-4 font-bold">Agent</th>
                  <th className="p-4 font-bold text-center">Confidence</th>
                  <th className="p-4 font-bold text-center">Hallucination</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-12">
                      <Loader size="md" text="Fetching security audit logs…" />
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-muted-foreground">
                      No query logs found. Start asking questions in Chat to generate audit trails.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-4 text-muted-foreground whitespace-nowrap text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </td>
                      <td className="p-4 font-medium text-foreground max-w-md truncate" title={log.query}>
                        {log.query}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full bg-secondary border border-border text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {log.agent}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${log.confidence >= 70 ? 'bg-emerald-500' : log.confidence >= 45 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                              style={{ width: `${log.confidence}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold w-8">{log.confidence}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          {log.hallucinated ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full text-xs font-bold">
                              <ShieldAlert className="w-3 h-3" /> Flagged
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full text-xs font-bold">
                              <CheckCircle className="w-3 h-3" /> Safe
                            </div>
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

