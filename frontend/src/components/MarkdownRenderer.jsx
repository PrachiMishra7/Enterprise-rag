import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const components = {
  // Headings
  h1: ({ children }) => (
    <h1 className="text-xl font-bold text-white mt-6 mb-3 pb-2 border-b border-white/10">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-bold text-white mt-5 mb-2.5 pb-1.5 border-b border-white/10">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-slate-100 mt-4 mb-2">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold text-slate-200 mt-3 mb-1.5">{children}</h4>
  ),

  // Paragraph
  p: ({ children }) => (
    <p className="text-sm text-slate-300 leading-relaxed mb-3 last:mb-0">{children}</p>
  ),

  // Strong / Bold
  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),

  // Emphasis / Italic
  em: ({ children }) => (
    <em className="italic text-slate-200">{children}</em>
  ),

  // Unordered list
  ul: ({ children }) => (
    <ul className="my-3 ml-1 space-y-1.5 list-none">{children}</ul>
  ),

  // Ordered list
  ol: ({ children }) => (
    <ol className="my-3 ml-1 space-y-1.5 list-decimal list-inside">{children}</ol>
  ),

  // List item
  li: ({ children, ordered }) => (
    <li className="flex items-start gap-2.5 text-sm text-slate-300 leading-relaxed">
      {!ordered && (
        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
      )}
      <span>{children}</span>
    </li>
  ),

  // Inline code
  code: ({ inline, children, className }) => {
    if (inline) {
      return (
        <code className="px-1.5 py-0.5 rounded-md bg-white/10 text-cyan-300 text-xs font-mono border border-white/10">
          {children}
        </code>
      );
    }
    return (
      <code className="block w-full text-xs font-mono text-emerald-300 leading-relaxed">
        {children}
      </code>
    );
  },

  // Code block
  pre: ({ children }) => (
    <div className="my-4 rounded-xl overflow-hidden border border-white/10">
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-black/40 border-b border-white/10">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
      </div>
      <pre className="p-4 bg-black/30 overflow-x-auto text-xs leading-relaxed">
        {children}
      </pre>
    </div>
  ),

  // Blockquote
  blockquote: ({ children }) => (
    <blockquote className="my-4 pl-4 border-l-2 border-cyan-500/50 bg-cyan-500/5 py-2 pr-3 rounded-r-lg text-sm text-slate-300 italic">
      {children}
    </blockquote>
  ),

  // Horizontal rule
  hr: () => (
    <hr className="my-5 border-white/10" />
  ),

  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300 transition-colors"
    >
      {children}
    </a>
  ),

  // TABLE components
  table: ({ children }) => (
    <div className="my-4 w-full overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-white/5">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-white/5">{children}</tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-white/[0.03] transition-colors">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-white/10">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-sm text-slate-300 leading-relaxed align-top">
      {children}
    </td>
  ),
};

export default function MarkdownRenderer({ children, className = '' }) {
  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
