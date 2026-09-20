import networkx as nx
from typing import List, Dict, Set
from sqlalchemy.orm import Session
from models.database import Document, DocumentChunk

class KnowledgeGraph:
    def __init__(self):
        self.graph = nx.DiGraph()
        
    def build_from_db(self, db: Session):
        """Builds a lightweight in-memory knowledge graph from the documents database."""
        self.graph.clear()
        
        # We model relationships between Departments, Roles, Documents, and Chunks
        documents = db.query(Document).all()
        
        for doc in documents:
            # Nodes
            dept_node = f"Dept:{doc.department}"
            role_node = f"Role:{doc.access_level}"
            doc_node = f"Doc:{doc.id}"
            
            self.graph.add_node(dept_node, type="department")
            self.graph.add_node(role_node, type="role")
            self.graph.add_node(doc_node, type="document", filename=doc.filename)
            
            # Edges
            self.graph.add_edge(dept_node, doc_node, relation="owns")
            self.graph.add_edge(doc_node, role_node, relation="applies_to")
            
        chunks = db.query(DocumentChunk).all()
        for chunk in chunks:
            doc_node = f"Doc:{chunk.document_id}"
            chunk_node = f"Chunk:{chunk.id}"
            self.graph.add_node(chunk_node, type="chunk")
            self.graph.add_edge(doc_node, chunk_node, relation="contains")
            
    def get_boosted_chunks(self, query: str, db: Session) -> Set[int]:
        """
        Extracts implicit intent (e.g. mentions of a department) from the query
        and uses the graph to find all related document chunks.
        Returns a set of Chunk IDs to boost during retrieval.
        """
        if self.graph.number_of_nodes() == 0:
            self.build_from_db(db)
            
        query_lower = query.lower()
        boosted_chunks = set()
        
        # Very simple entity extraction based on known departments in this mock
        departments = ["hr", "legal", "finance", "it"]
        mentioned_depts = [d for d in departments if d in query_lower]
        
        # If user asks about a department, find all chunks owned by that department
        for dept in mentioned_depts:
            dept_node = f"Dept:{dept}"
            if self.graph.has_node(dept_node):
                # Find all docs owned by dept
                for doc_node in self.graph.successors(dept_node):
                    if self.graph.nodes[doc_node].get("type") == "document":
                        # Find all chunks in doc
                        for chunk_node in self.graph.successors(doc_node):
                            if self.graph.nodes[chunk_node].get("type") == "chunk":
                                # Extract chunk ID
                                chunk_id = chunk_node.split(":")[1]
                                boosted_chunks.add(chunk_id)
                                
        return boosted_chunks
