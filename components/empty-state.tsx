export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-16 text-center"><p className="text-sm font-medium text-zinc-700">Nothing published yet.</p><p className="mx-auto mt-2 max-w-60 text-xs leading-5 text-zinc-500">{children}</p></div>;
}
