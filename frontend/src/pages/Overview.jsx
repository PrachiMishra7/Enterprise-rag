import { useState, useEffect } from 'react';
import { ArrowRight, Activity, ShieldAlert, Database, Zap } from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { motion } from 'framer-motion';
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
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <motion.div 
      whileHover={{ y: -5, boxShadow: `0 20px 40px ${color}20` }}
      className="flex flex-col items-center justify-center p-6 bg-white/[0.03] backdrop-blur-3xl rounded-3xl border border-white/10 relative shadow-2xl overflow-hidden group transition-all"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] -mr-10 -mt-10 pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity`} style={{ backgroundColor: color }}></div>
      
      <div className="relative w-32 h-32 flex items-center justify-center mb-4 drop-shadow-2xl">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="64" cy="64" r={radius} stroke={trackColor} strokeWidth="12" fill="none" className="opacity-30" />
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            cx="64" cy="64" r={radius} stroke={color} strokeWidth="12" fill="none"
            strokeDasharray={circumference}
            strokeLinecap="round"
            className="drop-shadow-lg"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white tracking-tighter">{value}%</span>
        </div>
      </div>
      <h3 className="text-[14px] font-bold text-white tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">{label}</h3>
      <p className="text-[11px] text-[#8b92a5] font-semibold mt-1 uppercase tracking-widest">{sublabel}</p>
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
    <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#060913] text-white relative">
      
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Recharts SVG Gradients Definitions */}
      <svg width="0" height="0">
        <defs>
          <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#c084fc" stopOpacity={0.6} />
            <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f472b6" stopOpacity={0.6} />
            <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>
      </svg>

      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible" 
        className="max-w-[1400px] mx-auto space-y-8 relative z-10"
      >
        
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">Enterprise Analytics</h1>
            <p className="text-sm text-[#8b92a5] font-semibold mt-2 uppercase tracking-widest">Real-time LLM tracking & system health</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateTo('upload')}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm font-black rounded-xl shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all flex items-center gap-3 border border-white/10"
            >
              <Database className="w-5 h-5" /> Import Knowledge
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateTo('chat')}
              className="px-6 py-3 bg-white/5 backdrop-blur-md text-white text-sm font-black rounded-xl border border-white/10 transition-all flex items-center gap-3 shadow-xl"
            >
              Start Chat <ArrowRight className="w-5 h-5 text-purple-400" />
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
              className="p-6 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl relative overflow-hidden group shadow-2xl"
            >
              <div className={`absolute top-0 right-0 w-[150%] h-[150%] bg-gradient-to-bl ${stat.bg} opacity-30 group-hover:opacity-70 transition-opacity pointer-events-none rounded-full blur-3xl -mr-[50%] -mt-[50%]`}></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg" style={{ color: stat.color, boxShadow: `0 0 20px ${stat.color}40` }}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <p className="text-[11px] font-black text-[#8b92a5] uppercase tracking-widest">{stat.label}</p>
                </div>
                <h2 className="text-4xl font-black text-white tracking-tighter drop-shadow-md">{stat.value}</h2>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Main Area Chart */}
          <motion.div 
            whileHover={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
            className="xl:col-span-2 p-8 bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none group-hover:bg-purple-500/20 transition-all"></div>
            <h3 className="text-[13px] font-black text-[#8b92a5] uppercase tracking-widest mb-8 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" /> Interaction Volume (7 Days)
            </h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.volume_history.length ? stats.volume_history : areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#8b92a5" fontSize={12} tickLine={false} axisLine={false} fontWeight="bold" />
                  <YAxis stroke="#8b92a5" fontSize={12} tickLine={false} axisLine={false} fontWeight="bold" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: '900' }}
                    labelStyle={{ color: '#8b92a5', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontWeight: 'bold', color: '#8b92a5', fontSize: '12px' }} />
                  <Area type="monotone" name="Documents Indexed" dataKey="docs" stroke="#f472b6" strokeWidth={4} fillOpacity={1} fill="url(#colorDocs)" activeDot={{ r: 8, fill: "#f472b6", stroke: "#fff", strokeWidth: 2 }} />
                  <Area type="monotone" name="User Queries" dataKey="queries" stroke="#c084fc" strokeWidth={4} fillOpacity={1} fill="url(#colorQueries)" activeDot={{ r: 8, fill: "#c084fc", stroke: "#fff", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Bar Chart & Rings */}
          <div className="flex flex-col gap-6">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="p-8 bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-3xl flex-1 shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/10 rounded-full blur-[60px] -mr-24 -mt-24 pointer-events-none group-hover:bg-sky-500/20 transition-all"></div>
              <h3 className="text-[13px] font-black text-[#8b92a5] uppercase tracking-widest mb-6 flex items-center gap-2">
                <Database className="w-4 h-4 text-sky-400" /> Department Usage
              </h3>
              <div className="h-[160px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.department_usage.length ? stats.department_usage : [{name: 'Loading', usage: 0}]} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#8b92a5" fontSize={11} tickLine={false} axisLine={false} fontWeight="bold" />
                    <YAxis stroke="#8b92a5" fontSize={11} tickLine={false} axisLine={false} fontWeight="bold" />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ fontWeight: 'black', color: '#fff' }}
                    />
                    <Bar name="Queries by Dept" dataKey="usage" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-6">
              <CircularProgress value={92} label="Data Coverage" sublabel="Index Freshness" color="#38bdf8" trackColor="#38bdf820" />
              <CircularProgress value={stats.hallucination_rate === '0%' ? 100 : 100 - parseFloat(stats.hallucination_rate)} label="Avg Accuracy" sublabel="Confidence Score" color="#c084fc" trackColor="#c084fc20" />
            </div>
          </div>

        </motion.div>
      </motion.div>
    </div>
  );
}

