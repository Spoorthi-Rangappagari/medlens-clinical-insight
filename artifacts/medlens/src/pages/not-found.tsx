import { Link } from 'wouter';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return <div className="grid min-h-[100dvh] place-items-center bg-background px-6 text-center">
    <div>
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-primary"><Compass size={24} /></div>
      <div className="mt-6 font-mono text-[10px] uppercase tracking-[.2em] text-primary">404 · Outside the record</div>
      <h1 className="mt-3 font-serif text-5xl tracking-[-.05em]">This view is not here.</h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">Return to the overview and continue from the workspace.</p>
      <Link href="/" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground" data-testid="link-not-found-home"><ArrowLeft size={15} /> Back to overview</Link>
    </div>
  </div>;
}
