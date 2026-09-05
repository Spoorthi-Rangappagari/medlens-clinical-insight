import { type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { LoaderCircle } from 'lucide-react';

export function Button({
  children, variant = 'primary', loading, className = '', ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'quiet' | 'outline' | 'danger'; loading?: boolean }) {
  const styles = {
    primary: 'bg-primary text-primary-foreground shadow-sm hover:brightness-105',
    quiet: 'bg-secondary/70 text-secondary-foreground hover:bg-secondary',
    outline: 'border border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/[.03]',
    danger: 'bg-destructive/10 text-destructive hover:bg-destructive/15',
  };
  return <button {...props} disabled={loading || props.disabled} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-all duration-200 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}>
    {loading && <LoaderCircle size={16} className="animate-spin" />}
    {children}
  </button>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-foreground">
    <span>{label}</span>
    {children}
    {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
  </label>;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`h-11 w-full rounded-lg border border-input bg-card px-3.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-muted-foreground ${props.className ?? ''}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`min-h-28 w-full resize-y rounded-lg border border-input bg-card px-3.5 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-muted-foreground ${props.className ?? ''}`} />;
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'teal' | 'amber' | 'red' | 'blue' }) {
  const colors = {
    neutral: 'bg-muted text-muted-foreground',
    teal: 'bg-primary/10 text-primary',
    amber: 'bg-accent/15 text-[#96631a]',
    red: 'bg-destructive/10 text-destructive',
    blue: 'bg-[#e0edf5] text-[#3c667e]',
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[.08em] ${colors[tone]}`}>{children}</span>;
}

export function SectionTitle({ eyebrow, title, detail, action }: { eyebrow?: string; title: string; detail?: string; action?: ReactNode }) {
  return <div className="mb-5 flex items-end justify-between gap-4">
    <div>
      {eyebrow && <div className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[.18em] text-primary">{eyebrow}</div>}
      <h2 className="font-serif text-2xl font-semibold tracking-[-.025em] text-foreground">{title}</h2>
      {detail && <p className="mt-1 text-sm text-muted-foreground">{detail}</p>}
    </div>
    {action}
  </div>;
}

export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
    <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-primary">
      <span className="h-2.5 w-2.5 rounded-full bg-primary" />
    </div>
    <h3 className="font-serif text-xl font-semibold">{title}</h3>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{detail}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>;
}

export function LoadingRows({ count = 4 }: { count?: number }) {
  return <div className="space-y-2" aria-label="Loading">
    {Array.from({ length: count }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-lg bg-muted/80" />)}
  </div>;
}

export function ErrorState({ onRetry, detail = 'We could not load this view right now.' }: { onRetry?: () => void; detail?: string }) {
  return <div className="rounded-xl border border-destructive/20 bg-destructive/[.04] px-6 py-10 text-center">
    <h3 className="font-serif text-xl font-semibold text-foreground">A careful pause</h3>
    <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    {onRetry && <Button variant="outline" onClick={onRetry} className="mt-5" data-testid="button-retry">Try again</Button>}
  </div>;
}
