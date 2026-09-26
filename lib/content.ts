import type { ArticleBlock } from "@/types/content";

export function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `article-${Date.now()}`; }
export function detectLanguage(source: string) { if (/^\s*</.test(source)) return "html"; if (/^\s*(def |import |from )/.test(source)) return "python"; if (/^\s*\{[\s\S]*\}\s*$/.test(source)) return "json"; if (/^\s*(interface |type |const .*:)/.test(source)) return "typescript"; return "javascript"; }

// ponytail: markdown subset; replace with a block editor only if writing friction proves it necessary.
export function articleBlocks(body: string): ArticleBlock[] {
  const lines = body.replace(/\r/g, "").split("\n");
  const blocks: ArticleBlock[] = [];
  let paragraph: string[] = [], code: string[] = [], language = "javascript", inCode = false;
  const flush = () => { if (paragraph.join(" ").trim()) blocks.push({ type: "paragraph", text: paragraph.join(" ").trim() }); paragraph = []; };
  for (const line of lines) {
    if (line.startsWith("```")) { if (inCode) { blocks.push({ type: "code", text: code.join("\n"), language }); code = []; } else { flush(); language = line.slice(3).trim() || "javascript"; } inCode = !inCode; continue; }
    if (inCode) { code.push(line); continue; }
    if (!line.trim()) { flush(); continue; }
    const image = line.match(/^!\[([^\]]*)\]\((https?:\/\/[^)]+)\)$/);
    if (image) { flush(); blocks.push({ type: "image", text: "", alt: image[1], src: image[2] }); continue; }
    if (line.startsWith("# ")) { flush(); blocks.push({ type: "heading", text: line.slice(2) }); continue; }
    if (line.startsWith("> ")) { flush(); blocks.push({ type: "quote", text: line.slice(2) }); continue; }
    if (line.startsWith("- ")) { flush(); const previous = blocks.at(-1); if (previous?.type === "list") previous.text += `\n${line}`; else blocks.push({ type: "list", text: line }); continue; }
    paragraph.push(line);
  }
  flush(); if (code.length) blocks.push({ type: "code", text: code.join("\n"), language }); return blocks;
}
