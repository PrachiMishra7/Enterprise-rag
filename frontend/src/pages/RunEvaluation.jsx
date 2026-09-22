import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';
import Loader from '../components/Loader';
import { 
  FlaskConical, CheckCircle2, AlertTriangle, Clock, 
  BarChart3, RefreshCw, Layers, Sparkles, XCircle, TrendingUp, TrendingDown, Database
} from 'lucide-react';

const METRICS = [
  {
    key: 'precision',
    label: 'Precision@5',
    description: 'Ratio of relevant chunks in top-5 retrieved results',
    icon: BarChart3,
    color: '#3b82f6',
    format: v => v.toFixed(3),
    higherIsBetter: true,
  },
  {
    key: 'recall',
    label: 'Recall@5',
    description: 'Whether the expected source appeared in top-5 results',
    icon: Layers,
    color: '#8b5cf6',
    format: v => v.toFixed(3),
    higherIsBetter: true,
  },
  {
    key: 'hallucination_rate',
    label: 'Hallucination Rate',
    description: 'Fraction of responses flagged as ungrounded',
    icon: AlertTriangle,
    color: '#f43f5e',
    format: v => `${(v * 100).toFixed(1)}%`,
    higherIsBetter: false,
  },
  {
    key: 'grounded_rate',
    label: 'Grounded Response Rate',
    description: 'Fraction of responses verified as grounded in context',
    icon: CheckCircle2,
    color: '#10b981',
    format: v => `${(v * 100).toFixed(1)}%`,
    higherIsBetter: true,
  },
  {
    key: 'latency',
    label: 'Average Latency',
    description: 'Mean end-to-end response time per query',
    icon: Clock,
    color: '#f59e0b',
    format: v => `${v.toFixed(3)}s`,
    higherIsBetter: false,
  },
];

function getDelta(baseline, proposed, higherIsBetter) {
  const diff = proposed - baseline;
  const pct = baseline !== 0 ? Math.abs(diff / baseline) * 100 : 0;
  const improved = higherIsBetter ? diff > 0 : diff < 0;
  return { diff, pct, improved };
}

export default function RunEvaluation() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [datasetSize, setDatasetSize] = useState(null);
  const [error, setError] = useState(null);

  const runSuite = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    setDatasetSize(null);
    try {
      const data = await apiCall('GET', '/eval/run', null, false, token);
      setResults(data.metrics);
      setDatasetSize(data.dataset_size || 6);
    } catch (e) {
      setError(e.message || 'Failed to run evaluation suite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background text-foreground overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full p-6 md:p-10 flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">System Evaluation</h1>
            </div>
            <p className="text-sm text-muted-foreground ml-12">
              Automated benchmark — Baseline RAG vs Proposed Multi-Agent Framework
            </p>
          </div>
          {results && !loading && (
            <button
              onClick={runSuite}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Re-run
            </button>
          )}
        </div>

        {/* Dataset info strip */}
        {results && (
          <div className="flex items-center gap-6 px-5 py-3 rounded-xl bg-card border border-border text-xs font-semibold text-muted-foreground">
            <div className="flex items-center gap-2"><Database className="w-3.5 h-3.5 text-primary" /> Dataset: <span className="text-foreground">{datasetSize} queries</span></div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-primary" /> Top-K: <span className="text-foreground">5 chunks</span></div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Status: <span className="text-emerald-500">Completed</span></div>
          </div>
        )}

        {/* Start button */}
        {!results && !loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-6"
          >
            <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <FlaskConical className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-foreground mb-1">Ready to Benchmark</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Compares retrieval precision, recall, hallucination rate, and latency across 6 test queries.
              </p>
            </div>
            <button
              onClick={runSuite}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary hover:opacity-90 text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" /> Start Evaluation Suite
            </button>
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <Loader size="full" text="Running Benchmarks…" subtext="Evaluating retrieval precision, recall, hallucination rate, and latency across test queries…" />
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center gap-4 py-16">
            <XCircle className="w-10 h-10 text-destructive" />
            <p className="text-sm text-destructive font-semibold">{error}</p>
            <button onClick={runSuite} className="px-5 py-2 rounded-xl bg-destructive text-white text-xs font-bold hover:opacity-90 transition-all">Try Again</button>
          </div>
        )}

        {/* Results Table */}
        {results && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Precision Gain', value: `+${((results.proposed.precision - results.baseline.precision) * 100).toFixed(0)}%`, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                { label: 'Recall Gain', value: `+${((results.proposed.recall - results.baseline.recall) * 100).toFixed(0)}%`, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
                { label: 'Hallucination ↓', value: `${((results.baseline.hallucination_rate - results.proposed.hallucination_rate) * 100).toFixed(0)}% less`, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                { label: 'Latency ↓', value: `${((results.baseline.latency - results.proposed.latency)).toFixed(3)}s faster`, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
              ].map(card => (
                <div key={card.label} className={`rounded-xl p-4 border ${card.bg} ${card.border}`}>
                  <div className={`text-xl font-black ${card.color}`}>{card.value}</div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{card.label}</div>
                </div>
              ))}
            </div>

            {/* Main Comparison Table */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-black text-foreground uppercase tracking-wider">Metric Comparison</h2>
                <span className="ml-auto text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Precision@5 · Recall@5 · Hallucination · Latency</span>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="px-6 py-3 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest w-1/3">Metric</th>
                    <th className="px-6 py-3 text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest">Baseline RAG</th>
                    <th className="px-6 py-3 text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest">Proposed Framework</th>
                    <th className="px-6 py-3 text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest">Δ Change</th>
                    <th className="px-6 py-3 text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {METRICS.map((m, i) => {
                    const Icon = m.icon;
                    const b = results.baseline[m.key];
                    const p = results.proposed[m.key];
                    const { diff, pct, improved } = getDelta(b, p, m.higherIsBetter);
                    const sign = diff > 0 ? '+' : '';

                    return (
                      <motion.tr
                        key={m.key}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="hover:bg-secondary/20 transition-colors"
                      >
                        {/* Metric name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${m.color}18` }}>
                              <Icon className="w-4 h-4" style={{ color: m.color }} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-foreground">{m.label}</div>
                              <div className="text-[10px] text-muted-foreground leading-tight mt-0.5 max-w-[200px]">{m.description}</div>
                            </div>
                          </div>
                        </td>

                        {/* Baseline */}
                        <td className="px-6 py-4 text-center">
                          <span className="font-mono text-sm font-semibold text-muted-foreground">{m.format(b)}</span>
                        </td>

                        {/* Proposed */}
                        <td className="px-6 py-4 text-center">
                          <span className={`font-mono text-sm font-black ${improved ? 'text-foreground' : 'text-muted-foreground'}`}>{m.format(p)}</span>
                        </td>

                        {/* Delta */}
                        <td className="px-6 py-4 text-center">
                          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${improved ? 'bg-emerald-500/10 text-emerald-500' : diff === 0 ? 'bg-secondary text-muted-foreground' : 'bg-rose-500/10 text-rose-500'}`}>
                            {improved ? <TrendingUp className="w-3 h-3" /> : diff < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                            {diff === 0 ? '—' : `${sign}${pct.toFixed(1)}%`}
                          </div>
                        </td>

                        {/* Status badge */}
                        <td className="px-6 py-4 text-center">
                          {improved ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                              <CheckCircle2 className="w-3 h-3" /> Improved
                            </span>
                          ) : diff === 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary border border-border text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                              Unchanged
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold uppercase tracking-wider">
                              <XCircle className="w-3 h-3" /> Regressed
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Footer note */}
              <div className="px-6 py-3 border-t border-border bg-secondary/20 text-[10px] text-muted-foreground font-medium">
                Evaluation run on <span className="font-bold text-foreground">{datasetSize} queries</span> · Retrieval top-K = 5 · RBAC enforced in Proposed framework
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
