"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icons";

const items = [{ href: "/", label: "Home", icon: "home" as const }, { href: "/blog", label: "Blog", icon: "book" as const }, { href: "/about", label: "About", icon: "person" as const }];
export function Navigation() {
  const path = usePathname();
  return <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white/95 px-4 py-1.5 backdrop-blur md:inset-y-0 md:bottom-auto md:left-[calc(50%-530px)] md:w-[180px] md:border-0 md:bg-transparent md:px-3 md:py-8">
    <Link href="/" className="mb-9 hidden items-center gap-2.5 md:flex"><span className="grid size-9 place-items-center rounded-full bg-zinc-900 text-xs font-semibold text-white">K</span><span className="text-[15px] font-semibold tracking-[-.035em]">Khushaank</span></Link>
    <div className="mx-auto flex max-w-md items-center justify-around md:mx-0 md:block md:space-y-1">
      {items.map((item) => <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition ${path === item.href ? "font-semibold text-zinc-950" : "text-zinc-500 hover:text-zinc-950"}`}><Icon name={item.icon} className="size-[18px]" /><span className="hidden md:inline">{item.label}</span></Link>)}
    </div>
  </nav>;
}
