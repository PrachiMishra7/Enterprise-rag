import { useState, useEffect } from 'react';
import { ArrowRight, Activity, ShieldAlert, Database, Zap } from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
};

function CircularProgress({ value, label, sublabel, color, trackColor }) {
  // Ensure value is a valid number between 0 and 100
  const safeValue = isNaN(parseFloat(value)) ? 0 : Math.max(0, Math.min(100, parseFloat(value)));
  const displayValue = Math.round(safeValue);
  
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeValue / 100) * circumference;

  return (
    <motion.div 
      whileHover={{ y: -5, boxShadow: `0 20px 40px ${color}20` }}
      className="flex flex-col items-center justify-center p-6 glass-panel glass-panel-hover rounded-3xl relative overflow-hidden group transition-all"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] -mr-10 -mt-10 pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity`} style={{ backgroundColor: color }}></div>
      
      <div className="relative w-32 h-32 flex items-center justify-center mb-4 drop-shadow-2xl">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="64" cy="64" r={radius} stroke={trackColor} strokeWidth="12" fill="none" className="opacity-30" />
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: isNaN(offset) ? circumference : offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            cx="64" cy="64" r={radius} stroke={color} strokeWidth="12" fill="none"
            strokeDasharray={circumference}
            strokeLinecap="round"
            className="drop-shadow-lg"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="flex items-baseline gap-[2px]">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums leading-none">{displayValue}</span>
            <span className="text-sm font-bold text-slate-900/60 dark:text-white/60 leading-none">%</span>
          </div>
        </div>
      </div>
      <h3 className="text-[13px] font-bold text-slate-900 dark:text-white tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-white/70 text-center whitespace-nowrap">{label}</h3>
      <p className="text-[10px] text-[#8b92a5] font-semibold mt-1 uppercase tracking-widest text-center">{sublabel}</p>
    </motion.div>
  );
}

export default function Overview({ navigateTo }) {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    doc_count: 0,
    query_count: 0,
    hallucination_rate: "0%",
    active_agents: 8,
    department_usage: [],
    volume_history: []
  });

  useEffect(() => {
    if (token) {
      apiCall('GET', '/analytics', null, false, token)
        .then(data => setStats(data))
        .catch(e => console.error("Failed to load analytics", e));
    }
  }, [token]);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-transparent text-slate-900 dark:text-white relative">



      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible" 
        className="max-w-[1400px] mx-auto space-y-8 relative z-10"
      >
        
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-200 bg-clip-text text-transparent">Enterprise Analytics</h1>
            <p className="text-sm text-[#8b92a5] font-semibold mt-2 uppercase tracking-widest">Real-time LLM tracking & system health</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateTo('upload')}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-slate-900 dark:text-white text-sm font-black rounded-xl shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all flex items-center gap-3 border border-slate-200 dark:border-white/10"
            >
              <Database className="w-5 h-5" /> Import Knowledge
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateTo('chat')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-slate-900 dark:text-white text-sm font-black rounded-xl border border-blue-500/30 transition-all flex items-center gap-3 shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)]"
            >
              Start Chat <ArrowRight className="w-5 h-5 text-slate-900 dark:text-white/80" />
            </motion.button>
          </div>
        </motion.div>

        {/* Top Metric Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Queries Processed", value: stats.query_count.toLocaleString(), icon: Activity, color: "#c084fc", bg: "from-purple-600/20 to-transparent" },
            { label: "Active Agents", value: stats.active_agents, icon: Zap, color: "#facc15", bg: "from-yellow-500/20 to-transparent" },
            { label: "Total Documents", value: stats.doc_count.toLocaleString(), icon: Database, color: "#38bdf8", bg: "from-sky-500/20 to-transparent" },
            { label: "Hallucination Risk", value: stats.hallucination_rate, icon: ShieldAlert, color: "#34d399", bg: "from-emerald-500/20 to-transparent" }
          ].map((stat, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -5, scale: 1.02 }}
              className="p-6 glass-panel glass-panel-hover rounded-3xl relative overflow-hidden group"
            >
              <div className={`absolute top-0 right-0 w-[150%] h-[150%] bg-gradient-to-bl ${stat.bg} opacity-30 group-hover:opacity-70 transition-opacity pointer-events-none rounded-full blur-3xl -mr-[50%] -mt-[50%]`}></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center shadow-lg" style={{ color: stat.color, boxShadow: `0 0 20px ${stat.color}40` }}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <p className="text-[11px] font-black text-[#8b92a5] uppercase tracking-widest">{stat.label}</p>
                </div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter drop-shadow-md">{stat.value}</h2>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Main Area Chart */}
          <motion.div 
            whileHover={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
            className="xl:col-span-2 p-8 glass-panel rounded-3xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none group-hover:bg-purple-500/20 transition-all"></div>
            <h3 className="text-[13px] font-black text-[#8b92a5] uppercase tracking-widest mb-8 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" /> Interaction Volume (7 Days)
            </h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={stats.volume_history || []} 
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c084fc" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f472b6" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#ffffff" strokeOpacity={0.05} vertical={false} />
                  <XAxis dataKey="name" stroke="#8b92a5" fontSize={11} tickLine={false} axisLine={false} fontWeight="bold" dy={10} />
                  <YAxis stroke="#8b92a5" fontSize={11} tickLine={false} axisLine={false} fontWeight="bold" dx={-10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: '900', padding: '4px 0' }}
                    labelStyle={{ color: '#8b92a5', fontSize: '11px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}
                  />
                  <Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{ fontWeight: 'bold', color: '#8b92a5', fontSize: '12px', paddingBottom: '20px' }} />
                  <Area type="natural" name="Documents Indexed" dataKey="docs" stroke="#f472b6" strokeWidth={4} fillOpacity={1} fill="url(#colorDocs)" activeDot={{ r: 6, fill: "#0f172a", stroke: "#f472b6", strokeWidth: 3 }} />
                  <Area type="natural" name="User Queries" dataKey="queries" stroke="#c084fc" strokeWidth={4} fillOpacity={1} fill="url(#colorQueries)" activeDot={{ r: 6, fill: "#0f172a", stroke: "#c084fc", strokeWidth: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Bar Chart & Rings */}
          <div className="flex flex-col gap-6">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="p-8 glass-panel glass-panel-hover rounded-3xl flex-1 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/10 rounded-full blur-[60px] -mr-24 -mt-24 pointer-events-none group-hover:bg-sky-500/20 transition-all"></div>
              <h3 className="text-[13px] font-black text-[#8b92a5] uppercase tracking-widest mb-6 flex items-center gap-2">
                <Database className="w-4 h-4 text-sky-400" /> Department Usage
              </h3>
              <div className="h-[160px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={stats.department_usage || []} 
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#818cf8" />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#8b92a5" fontSize={10} tickLine={false} axisLine={false} fontWeight="bold" dy={10} />
                    <YAxis stroke="#8b92a5" fontSize={10} tickLine={false} axisLine={false} fontWeight="bold" dx={-10} width={30} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.02)' }} 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                      itemStyle={{ fontWeight: 'black', color: '#fff', fontSize: '13px' }}
                      labelStyle={{ color: '#8b92a5', fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase' }}
                    />
                    <Bar name="Queries by Dept" dataKey="usage" fill="url(#barGradient)" radius={[8, 8, 8, 8]} barSize={20} background={{ fill: 'rgba(255,255,255,0.02)', radius: 8 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <CircularProgress value={92} label="Data Coverage" sublabel="Index Freshness" color="#38bdf8" trackColor="#38bdf820" />
              <CircularProgress 
                value={
                  stats.hallucination_rate === '0%' ? 100 : 
                  (isNaN(parseFloat(stats.hallucination_rate)) ? 100 : 100 - parseFloat(stats.hallucination_rate))
                } 
                label="Avg Accuracy" 
                sublabel="Confidence Score" 
                color="#c084fc" 
                trackColor="#c084fc20" 
              />
            </div>
          </div>

        </motion.div>

        {/* New Section: Recent Activity & System Health */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
          
          {/* System Health */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="p-8 glass-panel glass-panel-hover rounded-3xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none group-hover:bg-emerald-500/20 transition-all"></div>
            <h3 className="text-[13px] font-black text-[#8b92a5] uppercase tracking-widest mb-6 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" /> System Health
            </h3>
            <div className="space-y-5">
              {[
                { label: "Vector DB (Chroma)", status: "Operational", ping: "12ms", color: "text-emerald-500 dark:text-emerald-400", dot: "bg-emerald-400" },
                { label: "LLM Provider (Groq)", status: "Operational", ping: "45ms", color: "text-emerald-500 dark:text-emerald-400", dot: "bg-emerald-400" },
                { label: "PostgreSQL Database", status: "Operational", ping: "8ms", color: "text-emerald-500 dark:text-emerald-400", dot: "bg-emerald-400" },
                { label: "Embedding Service", status: "Operational", ping: "45ms", color: "text-emerald-500 dark:text-emerald-400", dot: "bg-emerald-400" }
              ].map((service, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white/40 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={`w-2.5 h-2.5 rounded-full ${service.dot}`}></div>
                      <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${service.dot} animate-ping opacity-50`}></div>
                    </div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{service.label}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[11px] font-black uppercase tracking-wider ${service.color}`}>{service.status}</span>
                    <span className="text-[10px] text-slate-500 font-bold">{service.ping}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity Feed */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="xl:col-span-2 p-8 glass-panel glass-panel-hover rounded-3xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none group-hover:bg-indigo-500/20 transition-all"></div>
            <h3 className="text-[13px] font-black text-[#8b92a5] uppercase tracking-widest mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" /> Live Activity Feed
            </h3>
            <div className="space-y-4">
              {[
                { user: "Sarah L.", action: "queried the HR policy", time: "2 mins ago", icon: Activity, color: "text-purple-500 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-500/10" },
                { user: "System", action: "indexed 45 new documents", time: "15 mins ago", icon: Database, color: "text-sky-500 dark:text-sky-400", bg: "bg-sky-100 dark:bg-sky-500/10" },
                { user: "Mike R.", action: "created a new Data Connector", time: "1 hour ago", icon: Zap, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-500/10" },
                { user: "System", action: "flagged high hallucination risk on query #892", time: "2 hours ago", icon: ShieldAlert, color: "text-rose-500 dark:text-rose-400", bg: "bg-rose-100 dark:bg-rose-500/10" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bg}`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-800 dark:text-slate-200">
                      <span className="font-bold">{item.user}</span> {item.action}
                    </p>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </motion.div>
      </motion.div>
    </div>
  );
}

