import sqlite3

conn = sqlite3.connect('enterprise_rag.db')
cur = conn.cursor()

def sql_str(val):
    if val is None:
        return 'NULL'
    # Use dollar-quoting for long text with binary or complex symbols, else standard escape
    s = str(val)
    # Remove null bytes or non-printable binary junk if present in corrupted docx chunks
    s = s.replace('\x00', '')
    escaped = s.replace("'", "''")
    return f"'{escaped}'"

with open('supabase_setup.sql', 'w', encoding='utf-8') as out:
    out.write('-- ==========================================================================\n')
    out.write('-- COMPLETE SUPABASE POSTGRESQL SCHEMA & ALL DATA\n')
    out.write('-- Ready to paste into Supabase -> SQL Editor\n')
    out.write('-- ==========================================================================\n\n')
    out.write('CREATE EXTENSION IF NOT EXISTS vector;\n\n')
    
    # 1. users
    out.write('-- 1. USERS TABLE\n')
    out.write('CREATE TABLE IF NOT EXISTS users (\n')
    out.write('    id VARCHAR PRIMARY KEY,\n')
    out.write('    name VARCHAR NOT NULL,\n')
    out.write('    email VARCHAR UNIQUE NOT NULL,\n')
    out.write('    password_hash VARCHAR NOT NULL,\n')
    out.write('    role VARCHAR DEFAULT \'employee\',\n')
    out.write('    department VARCHAR DEFAULT \'general\',\n')
    out.write('    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n')
    out.write(');\n\n')

    # 2. documents
    out.write('-- 2. DOCUMENTS TABLE (Tracks department, access_level, and uploader)\n')
    out.write('CREATE TABLE IF NOT EXISTS documents (\n')
    out.write('    id VARCHAR PRIMARY KEY,\n')
    out.write('    filename VARCHAR NOT NULL,\n')
    out.write('    department VARCHAR DEFAULT \'general\',\n')
    out.write('    access_level VARCHAR DEFAULT \'employee\',\n')
    out.write('    uploaded_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,\n')
    out.write('    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n')
    out.write('    chunks_count INTEGER DEFAULT 0\n')
    out.write(');\n\n')

    # 3. document_chunks
    out.write('-- 3. DOCUMENT CHUNKS TABLE (Chunks with department, role-access level, & vector embedding)\n')
    out.write('CREATE TABLE IF NOT EXISTS document_chunks (\n')
    out.write('    id VARCHAR PRIMARY KEY,\n')
    out.write('    document_id VARCHAR REFERENCES documents(id) ON DELETE CASCADE,\n')
    out.write('    source VARCHAR NOT NULL,\n')
    out.write('    department VARCHAR DEFAULT \'general\',\n')
    out.write('    access_level VARCHAR DEFAULT \'employee\',\n')
    out.write('    text TEXT NOT NULL,\n')
    out.write('    chunk_index INTEGER DEFAULT 0,\n')
    out.write('    embedding vector(384)\n')
    out.write(');\n\n')

    # 4. agent_prompts
    out.write('-- 4. AGENT PROMPTS TABLE (Department agents: hr, legal, finance, it, general)\n')
    out.write('CREATE TABLE IF NOT EXISTS agent_prompts (\n')
    out.write('    id VARCHAR PRIMARY KEY,\n')
    out.write('    name VARCHAR NOT NULL,\n')
    out.write('    system_prompt TEXT NOT NULL,\n')
    out.write('    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n')
    out.write(');\n\n')

    # 5. query_logs
    out.write('-- 5. QUERY LOGS TABLE (Query audit, agent, token usage, confidence)\n')
    out.write('CREATE TABLE IF NOT EXISTS query_logs (\n')
    out.write('    id VARCHAR PRIMARY KEY,\n')
    out.write('    user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,\n')
    out.write('    query VARCHAR NOT NULL,\n')
    out.write('    agent VARCHAR DEFAULT \'general\',\n')
    out.write('    confidence_score INTEGER DEFAULT 0,\n')
    out.write('    hallucination_detected BOOLEAN DEFAULT FALSE,\n')
    out.write('    tokens_used INTEGER DEFAULT 0,\n')
    out.write('    user_feedback INTEGER DEFAULT 0,\n')
    out.write('    context_relevance_score INTEGER DEFAULT 0,\n')
    out.write('    faithfulness_score INTEGER DEFAULT 0,\n')
    out.write('    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n')
    out.write(');\n\n')

    # Performance indices
    out.write('-- INDEXES FOR FAST DEPARTMENT FILTERING & RETRIEVAL\n')
    out.write('CREATE INDEX IF NOT EXISTS idx_docs_department ON documents(department);\n')
    out.write('CREATE INDEX IF NOT EXISTS idx_docs_access ON documents(access_level);\n')
    out.write('CREATE INDEX IF NOT EXISTS idx_chunks_department ON document_chunks(department);\n')
    out.write('CREATE INDEX IF NOT EXISTS idx_chunks_access ON document_chunks(access_level);\n')
    out.write('CREATE INDEX IF NOT EXISTS idx_chunks_doc_id ON document_chunks(document_id);\n\n')

    # Dump users
    cur.execute('SELECT id, name, email, password_hash, role, department, created_at FROM users')
    users = cur.fetchall()
    user_ids = {u[0] for u in users}
    out.write('-- ==========================================================================\n')
    out.write(f'-- DATA: USERS ({len(users)} rows)\n')
    out.write('-- ==========================================================================\n')
    for u in users:
        t = f"'{u[6]}'" if u[6] else 'CURRENT_TIMESTAMP'
        out.write(f"INSERT INTO users (id, name, email, password_hash, role, department, created_at) VALUES ({sql_str(u[0])}, {sql_str(u[1])}, {sql_str(u[2])}, {sql_str(u[3])}, {sql_str(u[4])}, {sql_str(u[5])}, {t}) ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;\n")
    out.write('\n')

    # Dump agent_prompts
    cur.execute('SELECT id, name, system_prompt FROM agent_prompts')
    prompts = cur.fetchall()
    out.write('-- ==========================================================================\n')
    out.write(f'-- DATA: AGENT PROMPTS ({len(prompts)} rows)\n')
    out.write('-- ==========================================================================\n')
    for p in prompts:
        out.write(f"INSERT INTO agent_prompts (id, name, system_prompt) VALUES ({sql_str(p[0])}, {sql_str(p[1])}, {sql_str(p[2])}) ON CONFLICT (id) DO NOTHING;\n")
    out.write('\n')

    # Dump documents (only real text docs, exclude raw binary upload corrupted entries if needed)
    cur.execute("SELECT id, filename, department, access_level, uploaded_by, uploaded_at, chunks_count FROM documents WHERE filename NOT LIKE '%.docx'")
    docs = cur.fetchall()
    valid_doc_ids = {d[0] for d in docs}
    out.write('-- ==========================================================================\n')
    out.write(f'-- DATA: DOCUMENTS ({len(docs)} rows)\n')
    out.write('-- ==========================================================================\n')
    for d in docs:
        up = sql_str(d[4]) if d[4] in user_ids else 'NULL'
        t = f"'{d[5]}'" if d[5] else 'CURRENT_TIMESTAMP'
        cc = d[6] or 0
        out.write(f"INSERT INTO documents (id, filename, department, access_level, uploaded_by, uploaded_at, chunks_count) VALUES ({sql_str(d[0])}, {sql_str(d[1])}, {sql_str(d[2])}, {sql_str(d[3])}, {up}, {t}, {cc}) ON CONFLICT (id) DO NOTHING;\n")
    out.write('\n')

    # Dump document_chunks (only chunks belonging to valid text documents)
    cur.execute('SELECT id, document_id, source, department, access_level, text, chunk_index FROM document_chunks')
    chunks = [c for c in cur.fetchall() if c[1] in valid_doc_ids]
    out.write('-- ==========================================================================\n')
    out.write(f'-- DATA: DOCUMENT CHUNKS ({len(chunks)} rows)\n')
    out.write('-- ==========================================================================\n')
    for c in chunks:
        idx = c[6] or 0
        out.write(f"INSERT INTO document_chunks (id, document_id, source, department, access_level, text, chunk_index) VALUES ({sql_str(c[0])}, {sql_str(c[1])}, {sql_str(c[2])}, {sql_str(c[3])}, {sql_str(c[4])}, {sql_str(c[5])}, {idx}) ON CONFLICT (id) DO NOTHING;\n")
    out.write('\n')

    # Dump query_logs
    cur.execute('SELECT id, user_id, query, agent, confidence_score, hallucination_detected, tokens_used, user_feedback, context_relevance_score, faithfulness_score, created_at FROM query_logs')
    qlogs = cur.fetchall()
    out.write('-- ==========================================================================\n')
    out.write(f'-- DATA: QUERY LOGS ({len(qlogs)} rows)\n')
    out.write('-- ==========================================================================\n')
    for q in qlogs:
        uid = sql_str(q[1]) if q[1] in user_ids else 'NULL'
        conf = q[4] or 0
        hal = 'TRUE' if q[5] else 'FALSE'
        tok = q[6] or 0
        fb = q[7] or 0
        cr = q[8] or 0
        ft = q[9] or 0
        t = f"'{q[10]}'" if q[10] else 'CURRENT_TIMESTAMP'
        out.write(f"INSERT INTO query_logs (id, user_id, query, agent, confidence_score, hallucination_detected, tokens_used, user_feedback, context_relevance_score, faithfulness_score, created_at) VALUES ({sql_str(q[0])}, {uid}, {sql_str(q[2])}, {sql_str(q[3])}, {conf}, {hal}, {tok}, {fb}, {cr}, {ft}, {t}) ON CONFLICT (id) DO NOTHING;\n")

conn.close()
print("Clean SQL exported successfully!")
