import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  ShieldCheck, Bot, Users, Landmark, Monitor, Scale, 
  Server, ArrowRight, Sparkles, Plus, Trash2, X, Sliders, 
  Compass, Play, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_NODES = [
  { id: 'master', type: 'core', name: 'Master Router', x: 80, y: 240, icon: Server, color: 'text-blue-400', bg: 'from-blue-500/20 to-blue-600/5', border: 'border-blue-400/50', shadow: 'shadow-blue-500/20', out: ['hr', 'legal', 'finance', 'it'], model: 'llama-3.1-70b', temperature: 0.0, maxTokens: 100 },
  { id: 'hr', type: 'agent', name: 'HR Agent', x: 420, y: 50, icon: Users, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-600/5', border: 'border-emerald-400/50', shadow: 'shadow-emerald-500/20', out: ['guard'], model: 'llama-3.1-8b', temperature: 0.2, maxTokens: 512 },
  { id: 'legal', type: 'agent', name: 'Legal Agent', x: 420, y: 170, icon: Scale, color: 'text-purple-400', bg: 'from-purple-500/20 to-purple-600/5', border: 'border-purple-400/50', shadow: 'shadow-purple-500/20', out: ['guard'], model: 'llama-3.1-70b', temperature: 0.1, maxTokens: 1024 },
  { id: 'finance', type: 'agent', name: 'Finance Agent', x: 420, y: 290, icon: Landmark, color: 'text-amber-400', bg: 'from-amber-500/20 to-amber-600/5', border: 'border-amber-400/50', shadow: 'shadow-amber-500/20', out: ['guard'], model: 'llama-3.1-8b', temperature: 0.2, maxTokens: 512 },
  { id: 'it', type: 'agent', name: 'IT Helpdesk', x: 420, y: 410, icon: Monitor, color: 'text-orange-400', bg: 'from-orange-500/20 to-orange-600/5', border: 'border-orange-400/50', shadow: 'shadow-orange-500/20', out: ['guard'], model: 'llama-3.1-8b', temperature: 0.4, maxTokens: 256 },
  { id: 'guard', type: 'core', name: 'Hallucination Guard', x: 760, y: 240, icon: ShieldCheck, color: 'text-rose-400', bg: 'from-rose-500/20 to-rose-600/5', border: 'border-rose-400/50', shadow: 'shadow-rose-500/20', out: ['output'], model: 'guard-rail-v2', temperature: 0.0, maxTokens: 50 },
  { id: 'output', type: 'end', name: 'Final Response', x: 1080, y: 240, icon: Bot, color: 'text-white', bg: 'from-white/20 to-white/5', border: 'border-white/30', shadow: 'shadow-white/10', out: [], model: 'system', temperature: 0.2, maxTokens: 1000 },
];

function BezierCurve({ startX, startY, endX, endY, color }) {
  const ctrlX1 = startX + (endX - startX) / 2;
  const ctrlY1 = startY;
  const ctrlX2 = startX + (endX - startX) / 2;
  const ctrlY2 = endY;
  const path = `M ${startX} ${startY} C ${ctrlX1} ${ctrlY1}, ${ctrlX2} ${ctrlY2}, ${endX} ${endY}`;
  
  return (
    <>
      <path d={path} stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" fill="none" />
      <path d={path} stroke={color || "#60a5fa"} strokeWidth="1.5" fill="none" className="opacity-30" />
      <motion.path 
        d={path} 
        stroke={color || "#60a5fa"} 
        strokeWidth="2" 
        fill="none"
        strokeDasharray="8, 12"
        animate={{ strokeDashoffset: [-40, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="opacity-75"
      />
    </>
  );
}

function FlowNode({ node, updateNodePosition, isSelected, onClick }) {
  const Icon = node.icon || Bot;
  
  return (
    <motion.div 
      drag
      dragMomentum={false}
      onDrag={(e, info) => updateNodePosition(node.id, info.delta.x, info.delta.y)}
      onClick={(e) => {
        e.stopPropagation();
        onClick(node);
      }}
      whileHover={{ scale: 1.02 }}
      whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
      className={`absolute w-64 p-4 bg-[#0a0f1d]/90 backdrop-blur-3xl border rounded-2xl shadow-2xl flex flex-col gap-3 z-10 cursor-grab group transition-all duration-150 ${
        isSelected 
          ? 'border-blue-500 ring-2 ring-blue-500/30' 
          : `${node.border} hover:border-white/20`
      }`}
      style={{ left: node.x, top: node.y }}
    >
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${node.bg} opacity-30 pointer-events-none`}></div>
      
      <div className="flex items-center gap-4 relative z-10">
        <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner group-hover:shadow-[0_0_12px_currentColor] transition-all duration-300 ${node.color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-white tracking-tight truncate">{node.name}</h4>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${node.color.replace('text-', 'bg-')}`}></span>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{node.type}</span>
          </div>
        </div>
      </div>
      
      <div className="text-[10px] text-slate-400 font-semibold relative z-10 flex justify-between bg-black/20 px-2.5 py-1.5 rounded-lg border border-white/5">
        <span className="truncate max-w-[120px]">{node.model}</span>
        <span>t={node.temperature.toFixed(1)}</span>
      </div>
      
      {node.type !== 'core' && node.id !== 'output' && (
        <div className="pt-2 border-t border-white/5 flex justify-between px-1 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest relative z-10">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div> IN
          </div>
          <div className="flex items-center gap-1.5 text-white">
            OUT <div className={`w-1.5 h-1.5 rounded-full ${node.color.replace('text-', 'bg-')} shadow-[0_0_6px_currentColor] animate-pulse`}></div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function Agents({ navigateTo }) {
  const { user } = useAuth();
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [selectedNode, setSelectedNode] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const updateNodePosition = (id, dx, dy) => {
    setNodes(prev => prev.map(n => {
      if (n.id === id) {
        return { ...n, x: Math.max(20, n.x + dx), y: Math.max(20, n.y + dy) };
      }
      return n;
    }));
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  const handleUpdateNodeProp = (key, value) => {
    if (!selectedNode) return;
    setNodes(prev => prev.map(n => {
      if (n.id === selectedNode.id) {
        const updated = { ...n, [key]: value };
        setSelectedNode(updated);
        return updated;
      }
      return n;
    }));
  };

  const handleAddAgentNode = () => {
    const id = `agent_${Date.now().toString().slice(-4)}`;
    const newNode = {
      id,
      type: 'agent',
      name: `Custom Agent ${nodes.filter(n => n.type === 'agent').length + 1}`,
      x: 420,
      y: 200 + (nodes.filter(n => n.type === 'agent').length * 40) % 200,
      icon: Bot,
      color: 'text-indigo-400',
      bg: 'from-indigo-500/20 to-indigo-600/5',
      border: 'border-indigo-400/50',
      shadow: 'shadow-indigo-500/20',
      out: ['guard'],
      model: 'llama-3.1-8b',
      temperature: 0.3,
      maxTokens: 512
    };

    setNodes(prev => {
      return prev.map(n => {
        if (n.id === 'master') {
          return { ...n, out: [...n.out, id] };
        }
        return n;
      }).concat(newNode);
    });

    setSelectedNode(newNode);
  };

  const handleDeleteNode = (id) => {
    if (['master', 'guard', 'output'].includes(id)) return;
    
    setNodes(prev => {
      let filtered = prev.filter(n => n.id !== id);
      filtered = filtered.map(n => {
        if (n.out.includes(id)) {
          return { ...n, out: n.out.filter(outId => outId !== id) };
        }
        return n;
      });
      return filtered;
    });

    setSelectedNode(null);
  };

  const handleExecuteFlow = () => {
    setExecuting(true);
    setSuccessMsg('');
    setTimeout(() => {
      setExecuting(false);
      setSuccessMsg('Multi-agent pipeline compiled and deployed to production environment successfully!');
      setTimeout(() => setSuccessMsg(''), 5000);
    }, 2000);
  };

  const handleResetFlow = () => {
    if (window.confirm('Reset flow to the default enterprise pipeline?')) {
      setNodes(INITIAL_NODES);
      setSelectedNode(null);
    }
  };

  return (
    <div className="flex-1 flex bg-[#060913] text-white overflow-hidden relative" onClick={() => setSelectedNode(null)}>
      
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        
        <div className="p-6 border-b border-white/5 bg-[#0a0f1d]/85 backdrop-blur-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">AI Flow Builder</h1>
            </div>
            <p className="text-xs text-[#8b92a5] font-bold tracking-widest uppercase">Design & coordinate multi-agent routing rules.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={handleResetFlow}
              className="p-3 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/5 rounded-xl transition-all text-slate-400 hover:text-white"
              title="Reset Flow to Default"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button 
              onClick={handleAddAgentNode}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-300 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-blue-400" /> Add Agent Node
            </button>
            <button 
              onClick={handleExecuteFlow}
              disabled={executing}
              className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 border border-sky-400/20 shadow-lg shadow-blue-500/10 disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${executing ? 'animate-spin' : ''}`} />
              {executing ? 'Compiling...' : 'Execute Flow'}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {successMsg && (
            <motion.div 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 20, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-[#0c1b33] border border-emerald-500/30 text-emerald-400 px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 shadow-2xl"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 relative overflow-hidden bg-transparent">
          <div className="absolute inset-0 w-full h-full">
            
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {nodes.map(node => (
                node.out.map(targetId => {
                  const targetNode = nodes.find(n => n.id === targetId);
                  if (!targetNode) return null;
                  
                  const startX = node.x + 256; 
                  const startY = node.y + 48;  
                  const endX = targetNode.x;
                  const endY = targetNode.y + 48;
                  
                  let lineColor = "#3b82f6";
                  if (node.color.includes('emerald')) lineColor = "#10b981";
                  if (node.color.includes('purple')) lineColor = "#a855f7";
                  if (node.color.includes('amber')) lineColor = "#f59e0b";
                  if (node.color.includes('orange')) lineColor = "#f97316";
                  if (node.color.includes('indigo')) lineColor = "#6366f1";
                  if (node.color.includes('rose')) lineColor = "#f43f5e";

                  return (
                    <BezierCurve 
                      key={`${node.id}-${targetId}`} 
                      startX={startX} 
                      startY={startY} 
                      endX={endX} 
                      endY={endY} 
                      color={lineColor} 
                    />
                  );
                })
              ))}
            </svg>

            {nodes.map(node => (
              <FlowNode 
                key={node.id} 
                node={node} 
                updateNodePosition={updateNodePosition}
                isSelected={selectedNode?.id === node.id}
                onClick={handleNodeClick}
              />
            ))}

          </div>

          <div className="absolute bottom-6 left-6 p-4 bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-2xl flex items-center gap-3.5 text-xs font-bold text-slate-500 uppercase tracking-widest pointer-events-none select-none">
            <Compass className="w-4 h-4 text-blue-500 animate-spin" />
            <span>Interactive Sandbox • Draggable Canvas</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedNode && (
          <motion.div 
            initial={{ x: 350, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 350, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="w-80 bg-[#0a0f1d] border-l border-white/10 z-30 flex flex-col relative shadow-2xl h-full"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-blue-400" />
                <h3 className="text-md font-black tracking-tight text-white uppercase">Node Config</h3>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-[#8b92a5] uppercase tracking-wider">Node Name</label>
                <input 
                  type="text" 
                  value={selectedNode.name}
                  onChange={(e) => handleUpdateNodeProp('name', e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500/50 text-white"
                  placeholder="Enter node name..."
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-[#8b92a5] uppercase tracking-wider">LLM Model</label>
                <select 
                  value={selectedNode.model}
                  onChange={(e) => handleUpdateNodeProp('model', e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0a0f1d] border border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500/50 text-white"
                >
                  <option value="llama-3.1-8b">Llama 3.1 8B (Groq Fast)</option>
                  <option value="llama-3.1-70b">Llama 3.1 70B (Groq Quality)</option>
                  <option value="mixtral-8x7b">Mixtral 8x7B (MoE)</option>
                  <option value="guard-rail-v2">Hallucination Guardrail v2</option>
                  <option value="system">System Default</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[10px] font-bold text-[#8b92a5] uppercase tracking-wider">
                  <span>Temperature</span>
                  <span className="text-white">{selectedNode.temperature.toFixed(1)}</span>
                </div>
                <input 
                  type="range" 
                  min="0.0" 
                  max="1.0" 
                  step="0.1"
                  value={selectedNode.temperature}
                  onChange={(e) => handleUpdateNodeProp('temperature', parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <span className="text-[9px] text-slate-500 font-medium">Lower values are more deterministic and precise.</span>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-[#8b92a5] uppercase tracking-wider">Max Gen Tokens</label>
                <input 
                  type="number" 
                  value={selectedNode.maxTokens}
                  onChange={(e) => handleUpdateNodeProp('maxTokens', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500/50 text-white"
                />
              </div>

            </div>

            {!['master', 'guard', 'output'].includes(selectedNode.id) && (
              <div className="p-6 border-t border-white/5 bg-black/10">
                <button
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/25 border border-red-500/30 hover:border-red-500/55 text-red-400 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Node
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
