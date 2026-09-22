import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { apiCall } from "../utils/api";
import Loader from "../components/Loader";
import {
  Share2, ZoomIn, ZoomOut, Maximize2, Search, X, Network, Info
} from "lucide-react";

// ── Palette drawn from the app theme (cyan=primary, blue, purple, slate-amber) ──
const TYPE_META = {
  department: { color: "#0ea5e9", glow: "#0ea5e940", label: "Department", size: 26 },
  document:   { color: "#8b5cf6", glow: "#8b5cf640", label: "Document",   size: 18 },
  role:       { color: "#06b6d4", glow: "#06b6d440", label: "Role",       size: 16 },
  chunk:      { color: "#64748b", glow: "#64748b40", label: "Chunk",      size: 10 },
};

// ── Force layout ──────────────────────────────────────────────────────────────
function computeLayout(nodes, edges, W, H) {
  if (!nodes.length) return {};
  const pos = {};
  nodes.forEach(n => {
    pos[n.id] = { x: W/2+(Math.random()-.5)*W*.6, y: H/2+(Math.random()-.5)*H*.6, vx:0, vy:0 };
  });
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
  for (let iter = 0; iter < 260; iter++) {
    const ids = Object.keys(pos);
    for (let i = 0; i < ids.length; i++) {
      for (let j = i+1; j < ids.length; j++) {
        const a=pos[ids[i]], b=pos[ids[j]], dx=a.x-b.x, dy=a.y-b.y;
        const dist=Math.sqrt(dx*dx+dy*dy)||1, force=3200/(dist*dist);
        a.vx+=(dx/dist)*force; a.vy+=(dy/dist)*force;
        b.vx-=(dx/dist)*force; b.vy-=(dy/dist)*force;
      }
    }
    edges.forEach(e => {
      const a=pos[e.source],b=pos[e.target];
      if (!a||!b) return;
      const dx=b.x-a.x,dy=b.y-a.y,dist=Math.sqrt(dx*dx+dy*dy)||1;
      const ideal=140+(nodeMap[e.source]?.size||10)*3, stretch=(dist-ideal)*0.032;
      a.vx+=(dx/dist)*stretch; a.vy+=(dy/dist)*stretch;
      b.vx-=(dx/dist)*stretch; b.vy-=(dy/dist)*stretch;
    });
    ids.forEach(id => {
      const p=pos[id];
      p.vx+=(W/2-p.x)*0.005; p.vy+=(H/2-p.y)*0.005;
      p.vx*=0.78; p.vy*=0.78;
      p.x=Math.max(40,Math.min(W-40,p.x+p.vx));
      p.y=Math.max(40,Math.min(H-40,p.y+p.vy));
    });
  }
  const out={};
  Object.keys(pos).forEach(id => { out[id]={x:pos[id].x,y:pos[id].y}; });
  return out;
}

function useForceLayout(nodes, edges, W, H) {
  const [positions, setPositions] = useState({});
  useEffect(() => {
    if (!nodes.length) return;
    setPositions(computeLayout(nodes, edges, W, H));
  }, [nodes, edges, W, H]);
  return [positions, setPositions];
}

function GraphDefs() {
  return (
    <defs>
      {Object.entries(TYPE_META).map(([type, meta]) => (
        <filter key={type} id={"glow-"+type} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      ))}
      {Object.entries(TYPE_META).map(([type, meta]) => (
        <radialGradient key={"g-"+type} id={"grad-"+type} cx="35%" cy="35%">
          <stop offset="0%" stopColor="white" stopOpacity="0.4"/>
          <stop offset="100%" stopColor={meta.color} stopOpacity="0.88"/>
        </radialGradient>
      ))}
    </defs>
  );
}

export default function KnowledgeGraphPage() {
  const { token } = useAuth();
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [search, setSearch] = useState("");
  const [filterTypes, setFilterTypes] = useState({ department:true, document:true, role:true, chunk:true });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x:0, y:0 });
  const [tooltip, setTooltip] = useState(null);
  const isPanning = useRef(false);
  const panStart = useRef(null);
  const draggingNode = useRef(null);
  const svgRef = useRef(null);
  const W=1000, H=620;

  useEffect(() => {
    apiCall("GET","/kg/graph",null,false,token)
      .then(d=>setGraphData(d)).catch(console.error).finally(()=>setLoading(false));
  }, [token]);

  const filteredNodes = useMemo(() =>
    graphData?.nodes.filter(n=>filterTypes[n.type])||[], [graphData,filterTypes]);
  const filteredNodeIds = useMemo(()=>new Set(filteredNodes.map(n=>n.id)),[filteredNodes]);
  const filteredEdges = useMemo(() =>
    graphData?.edges.filter(e=>filteredNodeIds.has(e.source)&&filteredNodeIds.has(e.target))||[],
    [graphData,filteredNodeIds]);

  const searchedNodes = useMemo(() => {
    if (!search.trim()) return filteredNodes;
    const q=search.toLowerCase();
    return filteredNodes.filter(n=>n.label.toLowerCase().includes(q)||n.type.includes(q));
  },[filteredNodes,search]);
  const searchHighlightIds = useMemo(()=>new Set(searchedNodes.map(n=>n.id)),[searchedNodes]);

  const [positions, setPositions] = useForceLayout(filteredNodes, filteredEdges, W, H);

  const neighbours = useMemo(() => {
    const active=hovered||selected;
    if (!active) return null;
    const nbrs=new Set([active.id]);
    filteredEdges.forEach(e=>{
      if(e.source===active.id) nbrs.add(e.target);
      if(e.target===active.id) nbrs.add(e.source);
    });
    return nbrs;
  },[hovered,selected,filteredEdges]);

  const getSVGPoint = useCallback((cx,cy)=>{
    const svg=svgRef.current; if(!svg) return null;
    const rect=svg.getBoundingClientRect();
    return { x:(cx-rect.left-pan.x)/zoom, y:(cy-rect.top-pan.y)/zoom };
  },[pan,zoom]);

  const onSVGMouseDown = useCallback(e=>{
    if(e.target.closest("[data-node]")) return;
    isPanning.current=true;
    panStart.current={x:e.clientX-pan.x, y:e.clientY-pan.y};
  },[pan]);

  const onSVGMouseMove = useCallback(e=>{
    if(draggingNode.current) {
      const pt=getSVGPoint(e.clientX,e.clientY); if(!pt) return;
      setPositions(prev=>({...prev,[draggingNode.current]:{x:pt.x,y:pt.y}}));
      return;
    }
    if(isPanning.current&&panStart.current) {
      setPan({x:e.clientX-panStart.current.x, y:e.clientY-panStart.current.y});
    }
  },[getSVGPoint]);

  const onSVGMouseUp = useCallback(()=>{
    isPanning.current=false; draggingNode.current=null;
  },[]);

  const onWheel = useCallback(e=>{
    e.preventDefault();
    setZoom(z=>Math.max(0.3,Math.min(3,z*(1-e.deltaY*0.001))));
  },[]);

  const resetView = ()=>{ setZoom(1); setPan({x:0,y:0}); };

  const zoomTo = useCallback((node)=>{
    const pos=positions[node.id]; if(!pos) return;
    const svg=svgRef.current; if(!svg) return;
    const rect=svg.getBoundingClientRect();
    setPan({x:rect.width/2-pos.x*zoom, y:rect.height/2-pos.y*zoom});
  },[positions,zoom]);

  if (loading) return (
    <Loader size="full" text="Building Knowledge Graph…" subtext="Mapping relationships across departments, documents, roles, and chunks" />
  );

  const stats=graphData?.stats||{};

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      <style>{`
        @keyframes dashflow { to { stroke-dashoffset: -16; } }
      `}</style>

      {/* ── Top bar — matches Header style ───────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card/80 backdrop-blur-sm shrink-0 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Share2 className="w-4 h-4 text-primary"/>
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">Knowledge Graph</h1>
            <p className="text-[10px] text-muted-foreground">Dept → Document → Role → Chunk</p>
          </div>
        </div>

        {/* search */}
        <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5 w-44">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search nodes…"
            className="bg-transparent text-xs text-foreground placeholder-muted-foreground outline-none w-full"/>
          {search && <button onClick={()=>setSearch("")}><X className="w-3 h-3 text-muted-foreground"/></button>}
        </div>

        {/* filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(TYPE_META).map(([type,meta])=>(
            <button key={type}
              onClick={()=>setFilterTypes(f=>({...f,[type]:!f[type]}))}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 border"
              style={filterTypes[type]
                ?{background:meta.color+"18",borderColor:meta.color+"44",color:meta.color}
                :{background:"transparent",borderColor:"var(--color-border)",color:"var(--color-muted-foreground)"}}>
              <span className="w-1.5 h-1.5 rounded-full"
                style={{background:filterTypes[type]?meta.color:"var(--color-muted-foreground)"}}/>
              {meta.label}
              <span className="opacity-60">({stats[type+"s"]??stats[type+"es"]??0})</span>
            </button>
          ))}
        </div>

        {/* zoom controls */}
        <div className="flex items-center gap-1">
          {[[ZoomIn,()=>setZoom(z=>Math.min(3,z+0.2))],[ZoomOut,()=>setZoom(z=>Math.max(0.3,z-0.2))],[Maximize2,resetView]].map(([Icon,action],i)=>(
            <button key={i} onClick={action}
              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors bg-background">
              <Icon className="w-3.5 h-3.5"/>
            </button>
          ))}
          <span className="text-[10px] text-muted-foreground ml-1.5 font-mono">{Math.round(zoom*100)}%</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Canvas ───────────────────────────────────────────────── */}
        <div className="flex-1 relative overflow-hidden select-none bg-background"
          style={{cursor:draggingNode.current?"grabbing":isPanning.current?"grabbing":"grab"}}
          onMouseDown={onSVGMouseDown} onMouseMove={onSVGMouseMove}
          onMouseUp={onSVGMouseUp} onMouseLeave={onSVGMouseUp} onWheel={onWheel}>

          {/* subtle grid */}
          <div className="absolute inset-0 opacity-30"
            style={{backgroundImage:"radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",backgroundSize:"28px 28px"}}/>

          {/* ambient primary glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute w-80 h-80 -top-20 -left-20 rounded-full"
              style={{background:"radial-gradient(circle, rgba(14,165,233,0.06), transparent 70%)"}}/>
            <div className="absolute w-64 h-64 bottom-0 right-10 rounded-full"
              style={{background:"radial-gradient(circle, rgba(139,92,246,0.05), transparent 70%)"}}/>
          </div>

          <svg ref={svgRef} width="100%" height="100%" style={{position:"absolute",inset:0}}>
            <GraphDefs/>
            <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>

              {/* EDGES */}
              {filteredEdges.map((e,i)=>{
                const src=positions[e.source], dst=positions[e.target];
                if(!src||!dst) return null;
                const srcNode=filteredNodes.find(n=>n.id===e.source);
                const color=TYPE_META[srcNode?.type]?.color||"hsl(var(--muted-foreground))";
                const isActive=neighbours?neighbours.has(e.source)&&neighbours.has(e.target):true;
                const isFaded=neighbours&&!isActive;
                const isSearchFaded=search.trim()&&!(searchHighlightIds.has(e.source)||searchHighlightIds.has(e.target));
                const opacity=isFaded||isSearchFaded?0.04:isActive&&neighbours?1:0.25;
                return (
                  <g key={i} opacity={opacity} style={{transition:"opacity 0.25s"}}>
                    <line x1={src.x} y1={src.y} x2={dst.x} y2={dst.y}
                      stroke={color} strokeWidth={isActive&&neighbours?4:2} strokeOpacity="0.12"/>
                    <line x1={src.x} y1={src.y} x2={dst.x} y2={dst.y}
                      stroke={color} strokeWidth={isActive&&neighbours?1.5:1}
                      strokeDasharray="7 7"
                      style={{animation:`dashflow ${isActive&&neighbours?"1.2s":"3s"} linear infinite`}}/>
                  </g>
                );
              })}

              {/* NODES */}
              {filteredNodes.map(node=>{
                const pos=positions[node.id]; if(!pos) return null;
                const meta=TYPE_META[node.type]||TYPE_META.chunk;
                const isSelected=selected?.id===node.id;
                const isHovered=hovered?.id===node.id;
                const isNeighbor=neighbours?neighbours.has(node.id):true;
                const isSearchMatch=search.trim()?searchHighlightIds.has(node.id):true;
                const opacity=(!isNeighbor||!isSearchMatch)?0.08:1;
                const r=meta.size;
                return (
                  <g key={node.id} data-node="true"
                    transform={`translate(${pos.x},${pos.y})`}
                    style={{cursor:"pointer",opacity,transition:"opacity 0.2s"}}
                    onClick={ev=>{ev.stopPropagation();setSelected(isSelected?null:node);}}
                    onMouseEnter={ev=>{
                      setHovered(node);
                      const rect=svgRef.current?.getBoundingClientRect();
                      if(rect) setTooltip({node,x:ev.clientX-rect.left+14,y:ev.clientY-rect.top-12});
                    }}
                    onMouseLeave={()=>{setHovered(null);setTooltip(null);}}
                    onMouseDown={ev=>{ev.stopPropagation();draggingNode.current=node.id;}}>

                    {/* selection ring */}
                    {isSelected&&(
                      <circle r={r+16} fill="none" stroke={meta.color} strokeWidth="1.5" strokeOpacity="0.4"/>
                    )}

                    {/* glow halo */}
                    <circle r={r+(isSelected?12:isHovered?8:4)}
                      fill={meta.color}
                      fillOpacity={isSelected?0.18:isHovered?0.12:0.05}
                      style={{transition:"all 0.2s"}}/>

                    {/* main circle */}
                    <circle r={r}
                      fill={`url(#grad-${node.type})`}
                      stroke={meta.color}
                      strokeWidth={isSelected?2.5:isHovered?2:1}
                      strokeOpacity={isSelected?1:isHovered?0.9:0.5}
                      filter={isSelected||isHovered?`url(#glow-${node.type})`:"none"}
                      style={{transition:"all 0.18s"}}/>

                    {/* shine dot */}
                    <circle cx={-r*0.28} cy={-r*0.28} r={r*0.3} fill="white" fillOpacity="0.15"/>

                    {/* label */}
                    {(node.type!=="chunk"||isSelected||isHovered)&&(
                      <text y={r+(node.type==="department"?16:13)}
                        textAnchor="middle"
                        fontSize={node.type==="department"?11:node.type==="document"?9.5:8.5}
                        fontWeight={node.type==="department"?700:500}
                        fill={meta.color}
                        fillOpacity="0.9"
                        className="pointer-events-none">
                        {node.label.length>18?node.label.slice(0,18)+"…":node.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
            <rect width="100%" height="100%" fill="transparent"
              onClick={()=>setSelected(null)} style={{pointerEvents:selected?"all":"none"}}/>
          </svg>

          {/* TOOLTIP */}
          <AnimatePresence>
            {tooltip&&!selected&&(
              <motion.div key={tooltip.node.id}
                initial={{opacity:0,scale:0.9,y:4}}
                animate={{opacity:1,scale:1,y:0}}
                exit={{opacity:0,scale:0.9}}
                transition={{duration:0.1}}
                className="absolute pointer-events-none z-50 rounded-xl px-3 py-2 text-xs border border-border bg-card shadow-lg"
                style={{
                  left:tooltip.x,top:tooltip.y,
                  borderColor:TYPE_META[tooltip.node.type]?.color+"44",
                  boxShadow:`0 4px 20px ${TYPE_META[tooltip.node.type]?.glow}`,
                }}>
                <div className="font-semibold text-foreground text-xs mb-0.5">{tooltip.node.label}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest"
                  style={{color:TYPE_META[tooltip.node.type]?.color}}>
                  {tooltip.node.type}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {filteredEdges.filter(e=>e.source===tooltip.node.id||e.target===tooltip.node.id).length} connections
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute bottom-3 left-4 flex items-center gap-1.5 text-[10px] text-muted-foreground/50 pointer-events-none">
            <Info className="w-3 h-3"/>
            Drag nodes · Scroll to zoom · Click to inspect
          </div>
        </div>

        {/* ── Side Panel ─── matches card style ─────────────────── */}
        <div className="w-64 shrink-0 flex flex-col overflow-y-auto no-scrollbar bg-card border-l border-border">
          <AnimatePresence mode="wait">
            {selected?(
              <motion.div key={selected.id}
                initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} exit={{opacity:0}}
                className="p-4 flex flex-col gap-4">

                {/* header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
                      style={{
                        background:TYPE_META[selected.type]?.color+"15",
                        borderColor:TYPE_META[selected.type]?.color+"40",
                      }}>
                      <span className="w-2.5 h-2.5 rounded-full"
                        style={{background:TYPE_META[selected.type]?.color}}/>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{selected.type}</div>
                      <div className="text-sm font-semibold text-foreground leading-tight mt-0.5 break-all">{selected.label}</div>
                    </div>
                  </div>
                  <button onClick={()=>setSelected(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-4 h-4"/>
                  </button>
                </div>

                {(()=>{
                  const outEdges=filteredEdges.filter(e=>e.source===selected.id);
                  const inEdges=filteredEdges.filter(e=>e.target===selected.id);
                  const nbrs=[...new Set([...outEdges.map(e=>e.target),...inEdges.map(e=>e.source)])];
                  const relations=[...new Set(outEdges.map(e=>e.relation))];
                  const col=TYPE_META[selected.type]?.color;
                  return (<>
                    {/* stats */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {[{label:"In",value:inEdges.length},{label:"Out",value:outEdges.length},{label:"Total",value:outEdges.length+inEdges.length}].map(s=>(
                        <div key={s.label} className="rounded-lg p-2 text-center border border-border bg-background">
                          <div className="text-lg font-bold" style={{color:col}}>{s.value}</div>
                          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* relation tags */}
                    {relations.length>0&&(
                      <div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Relations</div>
                        <div className="flex flex-wrap gap-1.5">
                          {relations.map(r=>(
                            <span key={r} className="px-2 py-0.5 rounded-full text-[10px] font-medium border"
                              style={{background:col+"12",borderColor:col+"35",color:col}}>
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* connected nodes */}
                    {nbrs.length>0&&(
                      <div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                          Connected ({nbrs.length})
                        </div>
                        <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
                          {nbrs.slice(0,12).map(nid=>{
                            const nd=filteredNodes.find(n=>n.id===nid); if(!nd) return null;
                            const m=TYPE_META[nd.type];
                            return (
                              <button key={nid}
                                onClick={()=>{setSelected(nd);zoomTo(nd);}}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors hover:bg-secondary border border-transparent hover:border-border">
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{background:m.color}}/>
                                <span className="text-[11px] text-foreground font-medium truncate">{nd.label}</span>
                                <span className="text-[9px] ml-auto shrink-0 text-muted-foreground">{nd.type}</span>
                              </button>
                            );
                          })}
                          {nbrs.length>12&&<div className="text-[10px] text-muted-foreground text-center">+{nbrs.length-12} more</div>}
                        </div>
                      </div>
                    )}

                    <button onClick={()=>zoomTo(selected)}
                      className="w-full py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80 border"
                      style={{background:col+"15",borderColor:col+"40",color:col}}>
                      Center in View
                    </button>
                  </>);
                })()}
              </motion.div>
            ):(
              <motion.div key="summary"
                initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                className="p-4 flex flex-col gap-4">

                {/* stats grid */}
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Graph Overview</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {label:"Nodes", value:stats.total_nodes,  color:"var(--color-muted-foreground)"},
                      {label:"Edges", value:stats.total_edges,  color:"var(--color-muted-foreground)"},
                      {label:"Depts", value:stats.departments,  color:TYPE_META.department.color},
                      {label:"Docs",  value:stats.documents,    color:TYPE_META.document.color},
                      {label:"Roles", value:stats.roles,        color:TYPE_META.role.color},
                      {label:"Chunks",value:stats.chunks,       color:TYPE_META.chunk.color},
                    ].map(s=>(
                      <div key={s.label} className="rounded-lg p-2.5 border border-border bg-background">
                        <div className="text-lg font-bold" style={{color:s.color}}>{s.value??"-"}</div>
                        <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* legend */}
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Legend</div>
                  <div className="space-y-2">
                    {Object.entries(TYPE_META).map(([type,meta])=>(
                      <div key={type} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 border"
                          style={{background:meta.color+"18",borderColor:meta.color+"44"}}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{background:meta.color}}/>
                        </div>
                        <div className="flex-1">
                          <div className="text-[11px] font-medium text-foreground capitalize">{type}</div>
                          <div className="text-[9px] text-muted-foreground">
                            {type==="department"?"Top-level grouping":type==="document"?"Indexed file":type==="role"?"Access permission":"Text segment"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* search results */}
                {search.trim()&&(
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                      Results ({searchedNodes.length})
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
                      {searchedNodes.slice(0,14).map(nd=>{
                        const m=TYPE_META[nd.type];
                        return (
                          <button key={nd.id}
                            onClick={()=>{setSelected(nd);zoomTo(nd);}}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-secondary transition-colors border border-transparent hover:border-border">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{background:m.color}}/>
                            <span className="text-[11px] text-foreground font-medium truncate">{nd.label}</span>
                            <span className="text-[9px] ml-auto shrink-0 text-muted-foreground">{nd.type}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-muted-foreground/60 border-t border-border pt-3 leading-relaxed">
                  Click node to inspect • Drag to rearrange • Scroll to zoom
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
