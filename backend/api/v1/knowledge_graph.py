from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from api.dependencies import get_current_user
from rag.knowledge_graph import KnowledgeGraph

router = APIRouter()

@router.get("/graph")
def get_knowledge_graph(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return the Knowledge Graph as nodes + edges for frontend visualization."""
    kg = KnowledgeGraph()
    kg.build_from_db(db)
    G = kg.graph

    type_colors = {
        "department": "#06b6d4",   # cyan
        "document":   "#a855f7",   # purple
        "role":       "#10b981",   # emerald
        "chunk":      "#f59e0b",   # amber
    }
    type_sizes = {
        "department": 32,
        "document":   24,
        "role":       20,
        "chunk":      12,
    }

    nodes = []
    for node_id, data in G.nodes(data=True):
        ntype = data.get("type", "chunk")
        label = node_id
        # Make labels human-readable
        if ":" in node_id:
            prefix, val = node_id.split(":", 1)
            if prefix == "Dept":
                label = val.upper()
            elif prefix == "Role":
                label = val.replace("_", " ").title()
            elif prefix == "Doc":
                label = data.get("filename", val)[:20] + ("…" if len(data.get("filename", val)) > 20 else "")
            elif prefix == "Chunk":
                label = f"Chunk {val[:6]}…"
        nodes.append({
            "id": node_id,
            "label": label,
            "type": ntype,
            "color": type_colors.get(ntype, "#94a3b8"),
            "size": type_sizes.get(ntype, 12),
        })

    edges = []
    for src, dst, data in G.edges(data=True):
        edges.append({
            "source": src,
            "target": dst,
            "relation": data.get("relation", ""),
        })

    return {
        "nodes": nodes,
        "edges": edges,
        "stats": {
            "total_nodes": G.number_of_nodes(),
            "total_edges": G.number_of_edges(),
            "departments": sum(1 for _, d in G.nodes(data=True) if d.get("type") == "department"),
            "documents":   sum(1 for _, d in G.nodes(data=True) if d.get("type") == "document"),
            "roles":       sum(1 for _, d in G.nodes(data=True) if d.get("type") == "role"),
            "chunks":      sum(1 for _, d in G.nodes(data=True) if d.get("type") == "chunk"),
        }
    }
