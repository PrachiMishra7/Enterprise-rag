import { useAuth } from '../contexts/AuthContext';
import { Users, Scale, Landmark, Monitor, FileText, Bot, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Overview({ documents, navigateTo }) {
  const { user } = useAuth();
  const deptCounts = {};
  documents.forEach(d => { deptCounts[d.department] = (deptCounts[d.department] || 0) + 1; });

  const depts = [
    { dept: 'hr', icon: Users, name: 'Human Resources', desc: 'Leave policies, payroll, onboarding, conduct' },
    { dept: 'legal', icon: Scale, name: 'Legal & Compliance', desc: 'Contracts, NDAs, compliance, agreements' },
    { dept: 'finance', icon: Landmark, name: 'Finance', desc: 'Expenses, reimbursements, invoices, budgets' },
    { dept: 'it', icon: Monitor, name: 'IT Support', desc: 'Help desk, software, hardware, security' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Indexed Docs</span>
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold text-foreground">{documents.length}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Agents</span>
              <Bot className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold text-foreground">4</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Access Level</span>
              <ShieldCheck className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-lg font-bold text-foreground leading-tight">{user?.role.replace('_',' ').toUpperCase()}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hallucination Guard</span>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              Active
            </div>
          </div>
        </div>

        {/* Departments */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-6">Access-Controlled Departments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {depts.map(d => {
              const Icon = d.icon;
              return (
                <div 
                  key={d.dept} 
                  className="group bg-card border border-border rounded-xl p-6 shadow-sm cursor-pointer hover:border-primary hover:shadow-md transition-all flex flex-col"
                  onClick={() => navigateTo('chat', `Tell me about ${d.dept} policies`)}
                >
                  <div className="w-12 h-12 bg-secondary text-primary rounded-lg flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1">{d.name}</h3>
                  <p className="text-xs text-muted-foreground mb-6 flex-1 line-clamp-2">{d.desc}</p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <span className="inline-flex items-center px-2.5 py-1 rounded bg-secondary text-[10px] font-bold text-muted-foreground uppercase tracking-wider border border-border">
                      {deptCounts[d.dept] || 0} docs
                    </span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pipeline Architecture */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-6">System Architecture</h2>
          <div className="bg-card border border-border rounded-xl p-8 overflow-x-auto shadow-sm">
            <div className="flex items-center gap-3 min-w-max">
              {['User Query','→','Auth + RBAC','→','Agent Router','→','Hybrid Retrieval (BM25 + Dense)','→','LLM Processing','→','Hallucination Detection','→','Response + Citations'].map((s,i) =>
                s === '→'
                  ? <ArrowRight key={i} className="w-5 h-5 text-primary shrink-0 opacity-50" />
                  : <span key={i} className="px-4 py-2 bg-secondary rounded-lg border border-border text-xs font-semibold text-foreground shrink-0 shadow-sm">{s}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
