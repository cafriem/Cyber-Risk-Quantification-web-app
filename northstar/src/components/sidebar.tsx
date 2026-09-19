import Link from "next/link";

const navItems = [
  { href: "/", label: "Dashboard", icon: "◒" },
  { href: "/risks", label: "Risk Register", icon: "▤" },
  { href: "/risks/new", label: "Create Risk", icon: "+" },
  { href: "/controls", label: "Controls", icon: "⛨" },
  { href: "/reports", label: "Reports", icon: "◧" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function Sidebar() {
  return (
    <aside className="flex w-56 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-2 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 font-bold text-white">N</div>
        <div>
          <p className="text-sm font-bold leading-tight text-zinc-900 dark:text-zinc-50">northstar</p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">risk intelligence</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 rounded px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
