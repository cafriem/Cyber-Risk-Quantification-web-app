export function Topbar() {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-1.5 dark:border-zinc-700">
        <span className="text-sm text-zinc-400">⌕</span>
        <input
          className="w-64 bg-transparent text-sm outline-none placeholder:text-zinc-400"
          placeholder="Search risks, assets, controls..."
        />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">MC</span>
      </div>
    </header>
  );
}
