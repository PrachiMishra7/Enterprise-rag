import { useState, useEffect } from 'react';
import { ArrowRight, Activity, ShieldAlert, Database, Zap } from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';

const areaData = [
  { name: 'Mon', queries: 4000, docs: 2400 },
  { name: 'Tue', queries: 3000, docs: 1398 },
  { name: 'Wed', queries: 2000, docs: 9800 },
  { name: 'Thu', queries: 2780, docs: 3908 },
  { name: 'Fri', queries: 1890, docs: 4800 },
  { name: 'Sat', queries: 2390, docs: 3800 },
  { name: 'Sun', queries: 3490, docs: 4300 },
];

function CircularProgress({ value, label, sublabel, color, trackColor }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-[#151c33]/80 backdrop-blur-md rounded-2xl border border-white/5 relative shadow-xl overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
      
      <div className="relative w-32 h-32 flex items-center justify-center mb-4 drop-shadow-2xl">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64" cy="64" r={radius} stroke={trackColor} strokeWidth="12" fill="none"
            className="opacity-20"
          />
          <circle
            cx="64" cy="64" r={radius} stroke={color} strokeWidth="12" fill="none"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white tracking-tighter">{value}%</span>
        </div>
      </div>
      <h3 className="text-[13px] font-semibold text-white tracking-wide uppercase">{label}</h3>
      <p className="text-[11px] text-[#6b7280] font-medium mt-1">{sublabel}</p>
    </div>
  );
}

export default function Overview({ navigateTo }) {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    doc_count: 0,
    query_count: 0,
    hallucination_rate: "0%",
    active_agents: 8,
    department_usage: []
  });

  useEffect(() => {
    if (token) {
      apiCall('GET', '/analytics', null, false, token)
        .then(data => setStats(data))
        .catch(e => console.error("Failed to load analytics", e));
    }
  }, [token]);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#0a0f1d] text-white">
      
      {/* Recharts SVG Gradients Definitions */}
      <svg width="0" height="0">
        <defs>
          <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Enterprise Analytics</h1>
            <p className="text-sm text-[#8b92a5] font-medium mt-1">Real-time LLM tracking and document processing metrics.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigateTo('upload')}
              className="px-4 py-2 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] hover:from-[#7c3aed] hover:to-[#db2777] text-white text-sm font-bold rounded-lg shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all flex items-center gap-2"
            >
              <Database className="w-4 h-4" /> Import Knowledge
            </button>
            <button 
              onClick={() => navigateTo('chat')}
              className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-white text-sm font-bold rounded-lg border border-white/10 transition-all flex items-center gap-2"
            >
              Start Chat <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Queries Processed", value: stats.query_count.toLocaleString(), icon: Activity, color: "text-[#a855f7]", bg: "bg-[#a855f7]/10" },
            { label: "Active Agents", value: stats.active_agents, icon: Zap, color: "text-[#eab308]", bg: "bg-[#eab308]/10" },
            { label: "Total Documents", value: stats.doc_count.toLocaleString(), icon: Database, color: "text-[#06b6d4]", bg: "bg-[#06b6d4]/10" },
            { label: "Hallucination Risk", value: stats.hallucination_rate, icon: ShieldAlert, color: "text-[#10b981]", bg: "bg-[#10b981]/10" }
          ].map((stat, i) => (
            <div key={i} className="p-6 bg-[#151c33]/60 backdrop-blur-xl border border-[#2d3748] rounded-2xl relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 -mr-4 -mt-4 transition-opacity group-hover:opacity-40 ${stat.bg.replace('/10', '')}`}></div>
              <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-[12px] font-bold text-[#8b92a5] uppercase tracking-wider mb-1">{stat.label}</p>
              <h2 className="text-3xl font-black text-white">{stat.value}</h2>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Area Chart */}
          <div className="lg:col-span-2 p-6 bg-[#151c33]/60 backdrop-blur-xl border border-[#2d3748] rounded-2xl shadow-xl">
            <h3 className="text-sm font-bold text-[#8b92a5] uppercase tracking-wider mb-6">Interaction Volume (7 Days)</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="docs" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorDocs)" />
                  <Area type="monotone" dataKey="queries" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorQueries)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart & Rings */}
          <div className="flex flex-col gap-6">
            <div className="p-6 bg-[#151c33]/60 backdrop-blur-xl border border-[#2d3748] rounded-2xl flex-1 shadow-xl">
              <h3 className="text-sm font-bold text-[#8b92a5] uppercase tracking-wider mb-4">Department Usage</h3>
              <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.department_usage.length ? stats.department_usage : [{name: 'Loading', usage: 0}]}>
                    <Tooltip 
                      cursor={{ fill: '#1e293b' }} 
                      contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }}
                    />
                    <Bar dataKey="usage" fill="url(#barGradient)" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <CircularProgress value={92} label="Data Coverage" sublabel="Index Freshness" color="#0ea5e9" trackColor="#0ea5e940" />
              <CircularProgress value={stats.hallucination_rate === '0%' ? 100 : 100 - parseFloat(stats.hallucination_rate)} label="Avg Accuracy" sublabel="Confidence Score" color="#a855f7" trackColor="#a855f740" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
