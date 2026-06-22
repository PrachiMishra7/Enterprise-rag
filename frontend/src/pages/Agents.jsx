import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, Bot, Users, Landmark, Monitor, Scale, Server, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const INITIAL_NODES = [
  { id: 'master', type: 'core', name: 'Master Router', x: 50, y: 250, icon: Server, color: 'text-blue-400', bg: 'from-blue-500/20 to-blue-600/5', border: 'border-blue-400/50', shadow: 'shadow-blue-500/20', out: ['hr', 'legal', 'finance', 'it'] },
  { id: 'hr', type: 'agent', name: 'HR Agent', x: 350, y: 80, icon: Users, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-600/5', border: 'border-emerald-400/50', shadow: 'shadow-emerald-500/20', out: ['guard'] },
  { id: 'legal', type: 'agent', name: 'Legal Agent', x: 350, y: 190, icon: Scale, color: 'text-purple-400', bg: 'from-purple-500/20 to-purple-600/5', border: 'border-purple-400/50', shadow: 'shadow-purple-500/20', out: ['guard'] },
  { id: 'finance', type: 'agent', name: 'Finance Agent', x: 350, y: 300, icon: Landmark, color: 'text-amber-400', bg: 'from-amber-500/20 to-amber-600/5', border: 'border-amber-400/50', shadow: 'shadow-amber-500/20', out: ['guard'] },
  { id: 'it', type: 'agent', name: 'IT Helpdesk', x: 350, y: 410, icon: Monitor, color: 'text-orange-400', bg: 'from-orange-500/20 to-orange-600/5', border: 'border-orange-400/50', shadow: 'shadow-orange-500/20', out: ['guard'] },
  { id: 'guard', type: 'core', name: 'Hallucination Guard', x: 650, y: 250, icon: ShieldCheck, color: 'text-rose-400', bg: 'from-rose-500/20 to-rose-600/5', border: 'border-rose-400/50', shadow: 'shadow-rose-500/20', out: ['output'] },
  { id: 'output', type: 'end', name: 'Final Response', x: 950, y: 250, icon: Bot, color: 'text-white', bg: 'from-white/20 to-white/5', border: 'border-white/30', shadow: 'shadow-white/10', out: [] },
];

function BezierCurve({ startX, startY, endX, endY, isGlowing, color }) {
  const ctrlX1 = startX + (endX - startX) / 2;
  const ctrlY1 = startY;
  const ctrlX2 = startX + (endX - startX) / 2;
  const ctrlY2 = endY;
  const path = `M ${startX} ${startY} C ${ctrlX1} ${ctrlY1}, ${ctrlX2} ${ctrlY2}, ${endX} ${endY}`;
  
  return (
    <>
      <path d={path} stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
      {isGlowing && (
        <motion.path 
          d={path} stroke={color || "#60a5fa"} strokeWidth="2" fill="none"
          initial={{ pathLength: 0, opacity: 0.8 }}
          animate={{ pathLength: 1, opacity: 0 }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        />
      )}
    </>
  );
}

function FlowNode({ node, updateNodePosition }) {
  const Icon = node.icon;
  
  return (
    <motion.div 
      drag
      dragMomentum={false}
      onDrag={(e, info) => updateNodePosition(node.id, info.delta.x, info.delta.y)}
      whileHover={{ scale: 1.05, zIndex: 50 }}
      whileDrag={{ scale: 1.1, zIndex: 50, cursor: 'grabbing' }}
      className={`absolute w-64 p-4 bg-[#0a0f1d]/90 backdrop-blur-3xl border ${node.border} rounded-2xl shadow-xl hover:${node.shadow} flex flex-col gap-3 z-10 cursor-grab group transition-shadow`}
      style={{ left: node.x, top: node.y }}
    >
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${node.bg} opacity-50 pointer-events-none`}></div>
      
      <div className="flex items-center gap-4 relative z-10">
        <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner group-hover:shadow-[0_0_15px_currentColor] transition-shadow ${node.color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-md font-black text-white tracking-tight drop-shadow-md">{node.name}</h4>
          <div className="flex items-center gap-1 mt-0.5">
            <span className={`w-2 h-2 rounded-full animate-pulse ${node.color.replace('text-', 'bg-')}`}></span>
            <span className="text-[10px] font-bold text-[#8b92a5] uppercase tracking-widest">{node.type} node</span>
          </div>
        </div>
      </div>
      
      {/* Node Ports */}
      {node.type !== 'core' && node.id !== 'output' && (
        <div className="mt-2 pt-2 border-t border-white/10 flex justify-between px-1 text-[10px] font-black text-slate-500 uppercase tracking-widest relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-600 shadow-[0_0_5px_rgba(255,255,255,0.2)]"></div> IN
          </div>
          <div className="flex items-center gap-2 text-white">
            OUT <div className={`w-2 h-2 rounded-full ${node.color.replace('text-', 'bg-')} shadow-[0_0_8px_currentColor] animate-pulse`}></div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function Agents({ navigateTo }) {
  const { user } = useAuth();
  const [nodes, setNodes] = useState(INITIAL_NODES);

  const updateNodePosition = (id, dx, dy) => {
    setNodes(prev => prev.map(n => {
      if (n.id === id) {
        return { ...n, x: n.x + dx, y: n.y + dy };
      }
      return n;
    }));
  };
  
  return (
    <div className="flex-1 flex flex-col bg-[#060913] text-white overflow-hidden relative">
      
      {/* Dynamic Backgrounds */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Header */}
      <div className="relative z-20 p-6 md:p-8 border-b border-white/10 bg-[#0a0f1d]/80 backdrop-blur-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">AI Flow Builder</h1>
          </div>
          <p className="text-sm text-[#8b92a5] font-bold tracking-widest uppercase">Drag nodes to customize your multi-agent architecture.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(56, 189, 248, 0.4)" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigateTo('chat')}
          className="px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-sm font-black rounded-xl transition-all flex items-center gap-3 border border-sky-400/30 shadow-xl"
        >
          Execute Flow <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Node Editor Canvas */}
      <div className="flex-1 relative overflow-hidden bg-transparent">
        <div className="absolute inset-0 w-full h-full">
          
          {/* Draw SVG connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {nodes.map(node => (
              node.out.map(targetId => {
                const targetNode = nodes.find(n => n.id === targetId);
                // Calculate connection points dynamically
                const startX = node.x + 256; // Width of node approx
                const startY = node.y + 48;  // Half height approx
                const endX = targetNode.x;
                const endY = targetNode.y + 48;
                
                const isGlowing = true; // Make all flows glow
                
                // Extract color hex based on tailwind class name logic or default
                let lineColor = "#60a5fa"; // blue default
                if (node.color.includes('emerald')) lineColor = "#34d399";
                if (node.color.includes('purple')) lineColor = "#c084fc";
                if (node.color.includes('amber')) lineColor = "#fbbf24";
                if (node.color.includes('orange')) lineColor = "#fb923c";
                if (node.color.includes('rose')) lineColor = "#fb7185";

                return <BezierCurve key={`${node.id}-${targetId}`} startX={startX} startY={startY} endX={endX} endY={endY} isGlowing={isGlowing} color={lineColor} />;
              })
            ))}
          </svg>

          {/* Render Nodes */}
          {nodes.map(node => (
            <FlowNode key={node.id} node={node} updateNodePosition={updateNodePosition} />
          ))}

        </div>
      </div>
    </div>
  );
}
