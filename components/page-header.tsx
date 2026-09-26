"use client";
export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return <header className="sticky top-0 z-10 flex min-h-14 items-center border-b border-zinc-200 bg-white/90 px-5 backdrop-blur"><div><h1 className="text-[17px] font-semibold tracking-[-.04em]">{title}</h1>{subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}</div></header>;
}
