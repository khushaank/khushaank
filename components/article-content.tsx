import type { ArticleBlock } from "@/types/content";
import { CodeBlock } from "./code-block";

export function ArticleContent({ blocks = [] }: { blocks?: ArticleBlock[] }) {
  const linked = (text: string) => {
    const parts = text.split(/(\[[^\]]+\]\(https?:\/\/[^)]+\))/g);
    return parts.map((part, index) => { const match = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/); return match ? <a key={index} href={match[2]} target="_blank" rel="noreferrer">{match[1]}</a> : part; });
  };
  return <div className="prose-content">{blocks.map((block, index) => {
    if (block.type === "heading") return <h2 key={index}>{block.text}</h2>;
    if (block.type === "quote") return <blockquote key={index}>{block.text}</blockquote>;
    if (block.type === "list") return <ul key={index}>{block.text.split("\n").filter(Boolean).map((item) => <li key={item}>{item.replace(/^[-*]\s*/, "")}</li>)}</ul>;
    if (block.type === "code") return <div key={index} className="not-prose my-6"><CodeBlock source={block.text} language={block.language} /></div>;
    if (block.type === "image" && block.src) return <figure key={index} className="my-7"><img src={block.src} alt={block.alt || "Article image"} className="w-full rounded-xl" />{block.alt && <figcaption className="mt-2 text-center text-xs text-zinc-500">{block.alt}</figcaption>}</figure>;
    return <p key={index}>{linked(block.text)}</p>;
  })}</div>;
}
