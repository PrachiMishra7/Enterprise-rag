import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, Bot, Users, Landmark, Monitor, Scale, Database, Server, Cpu, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const AGENT_NODES = [
  { id: 'master', type: 'core', name: 'Master Router', x: 50, y: 150, icon: Server, color: 'text-primary', bg: 'bg-primary/20', border: 'border-primary/50', out: ['hr', 'legal', 'finance', 'it'] },
  { id: 'hr', type: 'agent', name: 'HR Agent', x: 350, y: 50, icon: Users, color: 'text-green-400', bg: 'bg-green-400/20', border: 'border-green-400/50', out: ['guard'] },
  { id: 'legal', type: 'agent', name: 'Legal Agent', x: 350, y: 150, icon: Scale, color: 'text-purple-400', bg: 'bg-purple-400/20', border: 'border-purple-400/50', out: ['guard'] },
  { id: 'finance', type: 'agent', name: 'Finance Agent', x: 350, y: 250, icon: Landmark, color: 'text-blue-400', bg: 'bg-blue-400/20', border: 'border-blue-400/50', out: ['guard'] },
  { id: 'it', type: 'agent', name: 'IT Helpdesk', x: 350, y: 350, icon: Monitor, color: 'text-orange-400', bg: 'bg-orange-400/20', border: 'border-orange-400/50', out: ['guard'] },
  { id: 'guard', type: 'core', name: 'Hallucination Guard', x: 650, y: 150, icon: ShieldCheck, color: 'text-rose-500', bg: 'bg-rose-500/20', border: 'border-rose-500/50', out: ['output'] },
  { id: 'output', type: 'end', name: 'Final Response', x: 900, y: 150, icon: Bot, color: 'text-white', bg: 'bg-white/10', border: 'border-white/30', out: [] },
];

function BezierCurve({ startX, startY, endX, endY, isGlowing }) {
  const ctrlX1 = startX + (endX - startX) / 2;
  const ctrlY1 = startY;
  const ctrlX2 = startX + (endX - startX) / 2;
  const ctrlY2 = endY;
  const path = `M ${startX} ${startY} C ${ctrlX1} ${ctrlY1}, ${ctrlX2} ${ctrlY2}, ${endX} ${endY}`;
  
  return (
    <>
      <path d={path} stroke="#334155" strokeWidth="2" fill="none" />
      {isGlowing && (
        <motion.path 
          d={path} stroke="#60a5fa" strokeWidth="2" fill="none"
          initial={{ pathLength: 0, opacity: 0.8 }}
          animate={{ pathLength: 1, opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      )}
    </>
  );
}

function FlowNode({ node }) {
  const Icon = node.icon;
  return (
    <div 
      className={`absolute w-56 p-3 bg-[#0f172a]/90 backdrop-blur-xl border ${node.border} rounded-xl shadow-2xl flex flex-col gap-2 z-10 transition-transform hover:scale-105`}
      style={{ left: node.x, top: node.y }}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${node.bg} flex items-center justify-center border border-white/10`}>
          <Icon className={`w-5 h-5 ${node.color}`} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white tracking-tight">{node.name}</h4>
          <span className="text-[10px] font-mono text-muted-foreground uppercase">{node.type} node</span>
        </div>
      </div>
      
      {/* Node Ports */}
      {node.type !== 'core' && node.id !== 'output' && (
        <div className="mt-1 flex justify-between px-1 text-[9px] font-mono text-slate-500 uppercase">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div> IN
          </div>
          <div className="flex items-center gap-1">
            OUT <div className={`w-1.5 h-1.5 rounded-full ${node.bg.replace('/20', '')}`}></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Agents({ navigateTo }) {
  const { user } = useAuth();
  
  return (
    <div className="flex-1 flex flex-col bg-[#0a0f1d] text-white overflow-hidden relative">
      
      {/* Dotted Grid Background */}
      <div 
        className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      ></div>

      <div className="relative z-10 p-6 md:p-8 border-b border-white/5 bg-[#0a0f1d]/80 backdrop-blur-md flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">AI Flow Architecture</h1>
          <p className="text-sm text-slate-400 font-medium">Multi-agent routing and hallucination guarding pipeline.</p>
        </div>
        <button 
          onClick={() => navigateTo('chat')}
          className="px-4 py-2 bg-white hover:bg-slate-200 text-black text-sm font-bold rounded-lg transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
        >
          Execute Flow <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Node Editor Canvas */}
      <div className="flex-1 relative overflow-auto p-12">
        <div className="relative w-[1200px] h-[600px] mx-auto mt-10">
          
          {/* Draw SVG connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {AGENT_NODES.map(node => (
              node.out.map(targetId => {
                const targetNode = AGENT_NODES.find(n => n.id === targetId);
                // Calculate connection points
                const startX = node.x + 224; // Width of node
                const startY = node.y + 40;  // Half height approx
                const endX = targetNode.x;
                const endY = targetNode.y + 40;
                // Animate core paths
                const isGlowing = node.type === 'core' || targetNode.type === 'core';
                return <BezierCurve key={`${node.id}-${targetId}`} startX={startX} startY={startY} endX={endX} endY={endY} isGlowing={isGlowing} />;
              })
            ))}
          </svg>

          {/* Render Nodes */}
          {AGENT_NODES.map(node => (
            <FlowNode key={node.id} node={node} />
          ))}

        </div>
      </div>
    </div>
  );
}
