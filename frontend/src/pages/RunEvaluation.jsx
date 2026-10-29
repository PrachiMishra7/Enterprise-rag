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
    color: '#2563EB',
    format: v => v.toFixed(3),
    higherIsBetter: true,
  },
  {
    key: 'recall',
    label: 'Recall@5',
    description: 'Whether expected source appeared in top-5 results',
    icon: Layers,
    color: '#2563EB',
    format: v => v.toFixed(3),
    higherIsBetter: true,
  },
  {
    key: 'hallucination_rate',
    label: 'Hallucination Rate',
    description: 'Fraction of responses flagged as ungrounded',
    icon: AlertTriangle,
    color: '#DC2626',
    format: v => `${(v * 100).toFixed(1)}%`,
    higherIsBetter: false,
  },
  {
    key: 'grounded_rate',
    label: 'Grounded Response Rate',
    description: 'Fraction of responses verified as grounded in context',
    icon: CheckCircle2,
    color: '#059669',
    format: v => `${(v * 100).toFixed(1)}%`,
    higherIsBetter: true,
  },
  {
    key: 'latency',
    label: 'Average Latency',
    description: 'Mean end-to-end response time per query',
    icon: Clock,
    color: '#D97706',
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
      setError(e.message || 'Failed to execute evaluation suite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background text-foreground overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 flex-1 flex flex-col">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              System Evaluation & Quality Benchmarks
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Empirical retrieval accuracy, ground-truth recall, hallucination rate, and inference latency benchmarks.
            </p>
          </div>
          {results && !loading && (
            <button
              onClick={runSuite}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-semibold text-foreground hover:bg-secondary transition-colors shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-primary" />
              <span>Re-run Benchmark</span>
            </button>
          )}
        </div>

        {/* Dataset metadata strip */}
        {results && (
          <div className="flex items-center gap-6 px-4 py-2.5 rounded-xl bg-card border border-border text-xs font-medium text-muted-foreground shadow-xs overflow-x-auto">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-primary" />
              <span>Dataset Size: <strong className="text-foreground">{datasetSize} queries</strong></span>
            </div>
            <div className="w-px h-3.5 bg-border" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Retrieval Top-K: <strong className="text-foreground">5 chunks</strong></span>
            </div>
            <div className="w-px h-3.5 bg-border" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Status: <strong className="text-emerald-500">Benchmark Completed</strong></span>
            </div>
          </div>
        )}

        {/* Initial Empty State */}
        {!results && !loading && !error && (
          <div className="bg-card border border-border rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div className="max-w-md space-y-1">
              <h2 className="text-sm font-semibold text-foreground">Automated Evaluation Suite Ready</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Executes standardized test queries across indexed corporate policies, measuring retrieval precision, recall@5, hallucination detection, and round-trip latency.
              </p>
            </div>
            <button
              onClick={runSuite}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Start Evaluation Suite</span>
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-card border border-border rounded-xl p-12 flex flex-col items-center justify-center space-y-3">
            <Loader size="md" />
            <p className="text-xs text-muted-foreground">Evaluating retrieval precision, recall, hallucination rate, and latency across test queries...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3 text-destructive">
            <XCircle className="w-8 h-8" />
            <p className="text-xs font-medium">{error}</p>
            <button 
              onClick={runSuite} 
              className="px-3.5 py-1.5 rounded-lg bg-destructive text-white text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Retry Benchmark
            </button>
          </div>
        )}

        {/* Results Overview & Table */}
        {results && !loading && (
          <div className="space-y-6">

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: 'Precision Gain', value: `+${((results.proposed.precision - results.baseline.precision) * 100).toFixed(0)}%`, color: 'text-primary' },
                { label: 'Recall Gain', value: `+${((results.proposed.recall - results.baseline.recall) * 100).toFixed(0)}%`, color: 'text-primary' },
                { label: 'Hallucination Reduction', value: `${((results.baseline.hallucination_rate - results.proposed.hallucination_rate) * 100).toFixed(0)}% less`, color: 'text-emerald-500' },
                { label: 'Latency Improvement', value: `${((results.baseline.latency - results.proposed.latency)).toFixed(3)}s faster`, color: 'text-amber-500' },
              ].map(card => (
                <div key={card.label} className="bg-card border border-border rounded-xl p-4 shadow-xs">
                  <div className="text-xs font-medium text-muted-foreground">{card.label}</div>
                  <div className={`text-xl font-bold tracking-tight mt-1 ${card.color}`}>{card.value}</div>
                </div>
              ))}
            </div>

            {/* Comparison Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-secondary/30">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">Benchmark Metrics</h2>
                </div>
                <span className="text-[11px] text-muted-foreground">Standardized Test Corpus</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      <th className="py-3 px-5 w-1/3">Metric</th>
                      <th className="py-3 px-5 text-center">Baseline RAG</th>
                      <th className="py-3 px-5 text-center">Proposed Multi-Agent</th>
                      <th className="py-3 px-5 text-center">Delta</th>
                      <th className="py-3 px-5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {METRICS.map((m) => {
                      const Icon = m.icon;
                      const b = results.baseline[m.key];
                      const p = results.proposed[m.key];
                      const { diff, pct, improved } = getDelta(b, p, m.higherIsBetter);
                      const sign = diff > 0 ? '+' : '';

                      return (
                        <tr key={m.key} className="hover:bg-secondary/30 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                                <Icon className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">{m.label}</div>
                                <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{m.description}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-5 text-center font-mono text-muted-foreground font-medium">
                            {m.format(b)}
                          </td>

                          <td className="py-3.5 px-5 text-center font-mono font-semibold text-foreground">
                            {m.format(p)}
                          </td>

                          <td className="py-3.5 px-5 text-center">
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                              improved ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : diff === 0 ? 'bg-secondary text-muted-foreground' : 'bg-destructive/10 text-destructive'
                            }`}>
                              {improved ? <TrendingUp className="w-3 h-3" /> : diff < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                              {diff === 0 ? '—' : `${sign}${pct.toFixed(1)}%`}
                            </div>
                          </td>

                          <td className="py-3.5 px-5 text-center">
                            {improved ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Improved
                              </span>
                            ) : diff === 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground text-[10px] font-semibold">
                                Unchanged
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-semibold">
                                <XCircle className="w-2.5 h-2.5" /> Regressed
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-5 py-2.5 border-t border-border bg-secondary/20 text-[11px] text-muted-foreground font-medium">
                Tested against <span className="font-semibold text-foreground">{datasetSize} synthetic ground-truth queries</span> • Cosine retrieval threshold 0.75
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
