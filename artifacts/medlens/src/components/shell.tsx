import { Link, useLocation } from 'wouter';
import { Activity, ClipboardList, LayoutDashboard, Plus, Settings, ShieldCheck, Users, Menu, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/patients', label: 'Patients', icon: Users },
  { href: '/settings', label: 'Workspace settings', icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  return <div className="noise app-shell min-h-[100dvh] md:flex">
    <button className="fixed right-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar text-sidebar-foreground md:hidden" onClick={() => setOpen(!open)} data-testid="button-toggle-navigation" aria-label="Toggle navigation">
      {open ? <X size={18} /> : <Menu size={18} />}
    </button>
    <aside className={`fixed inset-y-0 left-0 z-30 flex w-[264px] flex-col bg-sidebar px-5 py-6 text-sidebar-foreground transition-transform duration-300 md:relative md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center gap-3 px-2">
        <div className="grid h-9 w-9 place-items-center rounded-[11px] bg-sidebar-primary text-sidebar-primary-foreground">
          <Activity size={19} strokeWidth={2.5} />
        </div>
        <div>
          <div className="font-serif text-[22px] leading-none tracking-[-.03em]">MedLens</div>
          <div className="mt-1 font-mono text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/55">Clinical insight</div>
        </div>
      </div>
      <div className="mt-12 px-2 font-mono text-[10px] uppercase tracking-[.18em] text-sidebar-foreground/45">Workspace</div>
      <nav className="mt-3 space-y-1" aria-label="Primary navigation">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? location === '/' : location.startsWith(href);
          return <Link href={href} key={href} onClick={() => setOpen(false)} className={`group flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
            <Icon size={17} className={active ? 'text-sidebar-primary' : 'text-sidebar-foreground/45 group-hover:text-sidebar-primary'} />
            <span>{label}</span>
            {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}
          </Link>;
        })}
      </nav>
      <div className="mt-auto">
        <Link href="/patients/new" className="flex items-center justify-center gap-2 rounded-lg bg-sidebar-primary px-4 py-3 text-sm font-bold text-sidebar-primary-foreground transition hover:brightness-110" data-testid="link-add-patient">
          <Plus size={16} /> Add patient
        </Link>
        <div className="mt-5 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3.5">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={16} className="text-sidebar-primary" />
            <span className="text-xs font-semibold">Review boundary active</span>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-sidebar-foreground/50">MedLens organizes evidence for clinical review. It does not diagnose or recommend treatment.</p>
        </div>
        <div className="mt-5 flex items-center gap-2 px-1 text-[11px] text-sidebar-foreground/40">
          <ClipboardList size={13} /> <span>Private clinical workspace</span>
        </div>
      </div>
    </aside>
    <main className="min-w-0 flex-1 md:min-h-[100dvh]">{children}</main>
  </div>;
}
