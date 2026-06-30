import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 relative overflow-hidden">
      
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-fade-in" />
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none animate-fade-in" style={{ animationDelay: '0.2s' }} />

      <div className="z-10 max-w-5xl w-full flex flex-col items-center text-center gap-8 animate-fade-in">
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-sm font-medium text-slate-300 hover-lift mb-4">
          <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
          Next.js App Router &bull; High Performance
        </div>

        <h1 className="text-5xl md:text-7xl font-outfit font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40">
          Enterprise RAG <br/> <span className="text-primary">Intelligence</span>
        </h1>
        
        <p className="max-w-2xl text-lg md:text-xl text-slate-400 font-inter leading-relaxed">
          Unleash the power of Hallucination-Aware Multi-Agent systems. Query your enterprise knowledge securely, quickly, and with absolute confidence.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full sm:w-auto justify-center">
          <Link href="/login" className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all hover-lift shadow-lg shadow-primary/25 flex items-center justify-center gap-2 group">
            Get Started
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>
          <Link href="/docs" className="px-8 py-4 glass-panel hover:bg-white/10 text-white font-semibold rounded-xl transition-all hover-lift flex items-center justify-center">
            View Documentation
          </Link>
        </div>

      </div>

      {/* Feature Grid */}
      <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl z-10 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        {[
          { title: "Multi-Agent Routing", desc: "Queries automatically route to specialized agents like Legal, HR, or Finance." },
          { title: "Hallucination Defense", desc: "Cross-checks LLM responses against citations to guarantee accuracy." },
          { title: "Role-Based Access", desc: "Strict document boundaries based on employee roles and department clearance." }
        ].map((feature, i) => (
          <div key={i} className="glass-card rounded-2xl p-8 hover-lift border-t border-l border-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <h3 className="text-xl font-bold text-white mb-3 font-outfit">{feature.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
