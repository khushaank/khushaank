"use client";
import Prism from "prismjs";
import { Icon } from "./icons";

export function CodeBlock({ source, language = "javascript" }: { source: string; language?: string }) {
  const grammar = Prism.languages[language] || Prism.languages.javascript;
  const html = Prism.highlight(source, grammar, language);
  return <div className="code overflow-hidden rounded-xl bg-[#1e1e1e] text-[#d4d4d4]"><div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs text-zinc-400"><span>{language}</span><button onClick={() => navigator.clipboard.writeText(source)} className="flex items-center gap-1 rounded px-1.5 py-1 hover:bg-white/10"><Icon name="copy" className="size-3.5" />Copy</button></div><pre><code dangerouslySetInnerHTML={{ __html: html }} /></pre></div>;
}
