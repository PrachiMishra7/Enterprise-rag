import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';
import { ShieldAlert, CheckCircle, Clock } from 'lucide-react';

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
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#0a0f1d] text-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Audit & Security Logs</h1>
          <p className="text-sm text-[#8b92a5] font-medium mt-1">Real-time track of all LLM queries, multi-agent routing, and hallucination events.</p>
        </div>

        <div className="bg-[#151c33]/60 backdrop-blur-xl border border-[#2d3748] rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1e293b]/50 border-b border-[#2d3748] text-[10px] uppercase tracking-widest text-[#8b92a5]">
                  <th className="p-4 font-bold">Timestamp</th>
                  <th className="p-4 font-bold">Query</th>
                  <th className="p-4 font-bold">Agent</th>
                  <th className="p-4 font-bold text-center">Confidence</th>
                  <th className="p-4 font-bold text-center">Hallucination</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-[#2d3748]/50">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">Loading secure logs...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">No query logs found. Start asking questions to generate audit trails.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#1e293b]/50 transition-colors">
                      <td className="p-4 text-slate-400 whitespace-nowrap text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </td>
                      <td className="p-4 font-medium text-white max-w-md truncate" title={log.query}>
                        {log.query}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded bg-[#1e293b] border border-[#2d3748] text-xs font-bold uppercase tracking-wider text-slate-300">
                          {log.agent}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${log.confidence >= 70 ? 'bg-green-500' : log.confidence >= 45 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                              style={{ width: `${log.confidence}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold w-8">{log.confidence}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          {log.hallucinated ? (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded text-xs font-bold">
                              <ShieldAlert className="w-3 h-3" /> Flagged
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded text-xs font-bold">
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
