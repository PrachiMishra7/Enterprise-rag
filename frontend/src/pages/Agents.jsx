import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  ShieldCheck, Bot, Users, Landmark, Monitor, Scale, 
  Server, ArrowRight, Sparkles, Plus, Trash2, X, Sliders, 
  Play, RotateCcw, CheckCircle2, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_NODES = [
  { id: 'master', type: 'core', name: 'Master Query Router', x: 40, y: 240, icon: Server, color: 'text-primary', out: ['hr', 'legal', 'finance', 'it'], model: 'llama-3.1-70b', temperature: 0.0, maxTokens: 100 },
  { id: 'hr', type: 'agent', name: 'HR Policy Agent', x: 380, y: 30, icon: Users, color: 'text-emerald-500', out: ['guard'], model: 'llama-3.1-8b', temperature: 0.2, maxTokens: 512 },
  { id: 'legal', type: 'agent', name: 'Legal Compliance Agent', x: 380, y: 170, icon: Scale, color: 'text-primary', out: ['guard'], model: 'llama-3.1-70b', temperature: 0.1, maxTokens: 1024 },
  { id: 'finance', type: 'agent', name: 'Finance Agent', x: 380, y: 310, icon: Landmark, color: 'text-amber-500', out: ['guard'], model: 'llama-3.1-8b', temperature: 0.2, maxTokens: 512 },
  { id: 'it', type: 'agent', name: 'IT Helpdesk Agent', x: 380, y: 450, icon: Monitor, color: 'text-blue-500', out: ['guard'], model: 'llama-3.1-8b', temperature: 0.4, maxTokens: 256 },
  { id: 'guard', type: 'core', name: 'Hallucination Guardrail', x: 720, y: 240, icon: ShieldCheck, color: 'text-rose-500', out: ['output'], model: 'guard-rail-v2', temperature: 0.0, maxTokens: 50 },
  { id: 'output', type: 'end', name: 'Verified Response Output', x: 1060, y: 240, icon: Bot, color: 'text-foreground', out: [], model: 'system', temperature: 0.2, maxTokens: 1000 },
];

function BezierCurve({ startX, startY, endX, endY, color }) {
  const ctrlX1 = startX + (endX - startX) / 2;
  const ctrlY1 = startY;
  const ctrlX2 = startX + (endX - startX) / 2;
  const ctrlY2 = endY;
  const path = `M ${startX} ${startY} C ${ctrlX1} ${ctrlY1}, ${ctrlX2} ${ctrlY2}, ${endX} ${endY}`;
  
  return (
    <>
      <path d={path} stroke="currentColor" strokeWidth="2" fill="none" className="text-border opacity-60" />
      <motion.path 
        d={path} 
        stroke={color || "#2563EB"} 
        strokeWidth="2" 
        fill="none"
        strokeDasharray="6, 8"
        animate={{ strokeDashoffset: [-28, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
        className="opacity-80"
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
      className={`absolute w-64 p-3.5 bg-card border rounded-xl flex flex-col gap-2.5 z-10 cursor-grab shadow-xs transition-shadow ${
        isSelected 
          ? 'border-primary ring-2 ring-primary/20 shadow-md' 
          : 'border-border hover:border-border/90'
      }`}
      style={{ left: node.x, top: node.y }}
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0 ${node.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-foreground truncate">{node.name}</h4>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
            {node.type} node
          </span>
        </div>
      </div>
      
      <div className="text-[11px] text-muted-foreground font-mono flex justify-between bg-secondary/50 px-2.5 py-1 rounded-md border border-border">
        <span className="truncate max-w-[130px]">{node.model}</span>
        <span>t={node.temperature.toFixed(1)}</span>
      </div>
      
      {node.type !== 'core' && node.id !== 'output' && (
        <div className="pt-2 border-t border-border flex justify-between px-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span> In
          </span>
          <span className="flex items-center gap-1 text-foreground">
            Out <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default function Agents() {
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
      x: 380,
      y: 100 + (nodes.filter(n => n.type === 'agent').length * 140) % 500,
      icon: Bot,
      color: 'text-primary',
      out: ['guard'],
      model: 'llama-3.1-8b',
      temperature: 0.2,
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
      setSuccessMsg('Multi-agent pipeline compiled and deployed to runtime successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    }, 1500);
  };

  const handleResetFlow = () => {
    if (window.confirm('Reset flow to the default enterprise pipeline?')) {
      setNodes(INITIAL_NODES);
      setSelectedNode(null);
    }
  };

  return (
    <div className="flex-1 flex bg-background text-foreground overflow-hidden relative" onClick={() => setSelectedNode(null)}>
      
      {/* Background Dot Grid */}
      <div 
        className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}
      />

      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        
        {/* Header Toolbar */}
        <div className="p-4 sm:p-5 border-b border-border bg-card/80 backdrop-blur-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              AI Flow Builder
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Visual multi-agent routing topology, guardrails, and orchestration parameters.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={handleResetFlow}
              className="p-2 bg-card hover:bg-secondary border border-border rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              title="Reset Flow to Default"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button 
              onClick={handleAddAgentNode}
              className="px-3 py-1.5 bg-card hover:bg-secondary border border-border rounded-lg text-xs font-semibold text-foreground transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-primary" /> Add Agent Node
            </button>
            <button 
              onClick={handleExecuteFlow}
              disabled={executing}
              className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${executing ? 'animate-spin' : ''}`} />
              <span>{executing ? 'Compiling Pipeline...' : 'Deploy Pipeline'}</span>
            </button>
          </div>
        </div>

        {/* Success Banner */}
        <AnimatePresence>
          {successMsg && (
            <motion.div 
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 12, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-card border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 w-full h-full">
            
            {/* SVG Connecting Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {nodes.map(node => (
                node.out.map(targetId => {
                  const targetNode = nodes.find(n => n.id === targetId);
                  if (!targetNode) return null;
                  
                  const startX = node.x + 256; 
                  const startY = node.y + 44;  
                  const endX = targetNode.x;
                  const endY = targetNode.y + 44;
                  
                  let lineColor = "#2563EB";
                  if (node.color.includes('emerald')) lineColor = "#059669";
                  if (node.color.includes('amber')) lineColor = "#D97706";
                  if (node.color.includes('rose')) lineColor = "#DC2626";

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

            {/* Draggable Nodes */}
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

          <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-card/90 border border-border rounded-lg text-[11px] font-medium text-muted-foreground pointer-events-none shadow-xs">
            Interactive Canvas • Drag nodes to reorder layout • Click to configure
          </div>
        </div>
      </div>

      {/* Inspector Sidebar Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div 
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            onClick={(e) => e.stopPropagation()}
            className="w-80 bg-card border-l border-border z-30 flex flex-col relative shadow-lg h-full"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">Node Configuration</h3>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">Node Display Name</label>
                <input 
                  type="text" 
                  value={selectedNode.name}
                  onChange={(e) => handleUpdateNodeProp('name', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Enter node name..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">Inference LLM Model</label>
                <select 
                  value={selectedNode.model}
                  onChange={(e) => handleUpdateNodeProp('model', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="llama-3.1-8b">Llama 3.1 8B (Groq Fast Inference)</option>
                  <option value="llama-3.1-70b">Llama 3.1 70B (High Reasoning)</option>
                  <option value="mixtral-8x7b">Mixtral 8x7B (MoE Architecture)</option>
                  <option value="guard-rail-v2">Hallucination Guardrail v2</option>
                  <option value="system">System Default</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-foreground">
                  <span>Temperature</span>
                  <span className="font-mono text-primary">{selectedNode.temperature.toFixed(1)}</span>
                </div>
                <input 
                  type="range" 
                  min="0.0" 
                  max="1.0" 
                  step="0.1"
                  value={selectedNode.temperature}
                  onChange={(e) => handleUpdateNodeProp('temperature', parseFloat(e.target.value))}
                  className="w-full accent-primary"
                />
                <span className="text-[11px] text-muted-foreground block">Lower temperature ensures factual, deterministic responses.</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">Max Response Tokens</label>
                <input 
                  type="number" 
                  value={selectedNode.maxTokens}
                  onChange={(e) => handleUpdateNodeProp('maxTokens', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

            </div>

            {!['master', 'guard', 'output'].includes(selectedNode.id) && (
              <div className="p-4 border-t border-border bg-secondary/30">
                <button
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  className="w-full py-2 bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 text-destructive text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Node</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
