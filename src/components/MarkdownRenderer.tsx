import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative my-3 rounded-lg bg-slate-950 border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/10">
        <span className="text-xs text-slate-400 font-mono">{lang || 'code'}</span>
        <button onClick={copy} className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-xs">
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-sm text-slate-200 font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function MarkdownRenderer({ content }: { content: string }) {
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(renderInline(content.slice(lastIndex, match.index), key++));
    }
    parts.push(<CodeBlock key={key++} lang={match[1]} code={match[2].trim()} />);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push(renderInline(content.slice(lastIndex), key++));
  }

  return <div className="space-y-1">{parts}</div>;
}

function renderInline(text: string, key: number): React.ReactNode {
  const lines = text.split('\n');
  return (
    <div key={key}>
      {lines.map((line, i) => {
        const segments = parseInline(line);
        return (
          <p key={i} className="leading-relaxed">
            {segments.length ? segments : '\u00A0'}
          </p>
        );
      })}
    </div>
  );
}

function parseInline(line: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|`(.+?)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = regex.exec(line)) !== null) {
    if (m.index > last) nodes.push(line.slice(last, m.index));
    if (m[2]) {
      nodes.push(<strong key={k++} className="font-semibold text-white">{m[2]}</strong>);
    } else if (m[3]) {
      nodes.push(
        <code key={k++} className="px-1.5 py-0.5 rounded bg-slate-700/50 text-cyan-300 text-sm font-mono">
          {m[3]}
        </code>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < line.length) nodes.push(line.slice(last));
  return nodes;
}
