import { Link } from 'wouter';
import { ArrowRight, ClipboardCheck, FileText, Plus, Users, Waves } from 'lucide-react';
import { useGetDashboard, useListActivity } from '@workspace/api-client-react';
import type { ReactNode } from 'react';
import { formatDateTime, formatDate, initials } from '@/lib/format';
import { Badge, EmptyState, ErrorState, LoadingRows, SectionTitle } from '@/components/ui';

export function DashboardPage() {
  const dashboard = useGetDashboard();
  const activity = useListActivity({ limit: 7 });
  const d = dashboard.data;
  const activities = activity.data ?? [];
  return <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
    <header className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div className="animate-rise-in">
        <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em] text-primary"><Waves size={13} /> Workspace overview</div>
        <h1 className="max-w-xl font-serif text-[clamp(2.5rem,5vw,4.2rem)] leading-[.96] tracking-[-.055em]">A clearer view of<br /><em className="text-primary">what needs a second look.</em></h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">Trace patient history, report evidence, and human review in one quiet workspace.</p>
      </div>
      <Link href="/patients/new" className="animate-rise-in delay-1 inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm transition hover:brightness-105 sm:self-auto" data-testid="link-dashboard-add-patient"><Plus size={16} /> Add patient</Link>
    </header>

    {dashboard.isLoading ? <LoadingRows count={2} /> : dashboard.isError ? <ErrorState onRetry={() => dashboard.refetch()} /> : d ? <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 animate-rise-in delay-1" aria-label="Workspace metrics">
        <Metric label="Patient records" value={d.patientCount} icon={<Users size={17} />} detail="Across your workspace" testId="metric-patient-count" />
        <Metric label="Reports collected" value={d.reportCount} icon={<FileText size={17} />} detail="Source documents" testId="metric-report-count" />
        <Metric label="Needs human review" value={d.needsReviewCount} icon={<ClipboardCheck size={17} />} detail="Awaiting a clinical eye" tone="amber" testId="metric-needs-review" />
        <Metric label="Review ready" value={d.reviewReadyCount} icon={<Waves size={17} />} detail="Evidence is organized" tone="teal" testId="metric-review-ready" />
      </section>
      <div className="mt-10 grid gap-10 xl:grid-cols-[1.35fr_.65fr]">
        <section className="animate-rise-in delay-2">
          <SectionTitle eyebrow="Continue the record" title="Latest patient" detail="Pick up where your team last left off." action={<Link href="/patients" className="hidden items-center gap-1 text-sm font-bold text-primary hover:underline sm:flex" data-testid="link-view-all-patients">View all <ArrowRight size={14} /></Link>} />
          {d.latestPatient ? <LatestPatient patient={d.latestPatient} /> : <EmptyState title="Your workspace is ready" detail="Start by adding a patient record. MedLens will keep history, reports, and review status together." action={<Link href="/patients/new" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground" data-testid="link-empty-add-patient"><Plus size={15} /> Add first patient</Link>} />}
        </section>
        <section className="animate-rise-in delay-3">
          <SectionTitle eyebrow="Audit trail" title="Recent activity" detail="A traceable record of workspace changes." />
          {activity.isLoading ? <LoadingRows count={4} /> : activity.isError ? <ErrorState onRetry={() => activity.refetch()} /> : activities.length ? <div className="space-y-1">{activities.map((item) => <div key={item.id} className="group flex gap-3 rounded-lg px-2 py-3 transition hover:bg-card">
            <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary ring-4 ring-primary/10" />
            <div className="min-w-0"><p className="text-sm leading-5 text-foreground">{item.label}</p><p className="mt-1 font-mono text-[10px] uppercase tracking-[.08em] text-muted-foreground">{item.patientName} · {formatDateTime(item.createdAt)}</p></div>
          </div>)}</div> : <EmptyState title="No activity yet" detail="New records and report reviews will appear here." />}
        </section>
      </div>
    </> : null}
    <div className="mt-10 rounded-xl border border-primary/15 bg-primary/[.045] p-5 sm:flex sm:items-center sm:gap-5">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Waves size={18} /></div>
      <div className="mt-3 sm:mt-0"><p className="text-sm font-bold">A note on clinical safety</p><p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">MedLens extracts and organizes information from reports. Every extracted observation remains unverified until a human reviews it. This workspace is not diagnostic or treatment advice.</p></div>
    </div>
  </div>;
}

function Metric({ label, value, icon, detail, tone = 'neutral', testId }: { label: string; value: number; icon: ReactNode; detail: string; tone?: 'neutral' | 'amber' | 'teal'; testId: string }) {
  return <div className={`card-lift rounded-xl border bg-card p-5 ${tone === 'amber' ? 'border-accent/30' : tone === 'teal' ? 'border-primary/25' : 'border-card-border'}`} data-testid={testId}>
    <div className={`mb-7 flex h-8 w-8 items-center justify-center rounded-lg ${tone === 'amber' ? 'bg-accent/15 text-[#96631a]' : 'bg-primary/10 text-primary'}`}>{icon}</div>
    <div className="font-serif text-4xl font-semibold tracking-[-.05em]">{value}</div>
    <div className="mt-1 text-sm font-bold">{label}</div><div className="mt-1 text-xs text-muted-foreground">{detail}</div>
  </div>;
}

function LatestPatient({ patient }: { patient: import('@workspace/api-client-react').Patient }) {
  return <Link href={`/patients/${patient.id}`} className="card-lift block rounded-xl border border-card-border bg-card p-5 sm:p-7" data-testid={`card-latest-patient-${patient.id}`}>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-3.5"><div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary font-serif text-lg text-primary">{initials(patient.name)}</div><div><h3 className="font-serif text-2xl font-semibold tracking-[-.03em]">{patient.name}</h3><p className="mt-1 text-xs text-muted-foreground">Updated {formatDate(patient.updatedAt)} · {patient.reportCount} report{patient.reportCount === 1 ? '' : 's'}</p></div></div>
      {patient.needsReview ? <Badge tone="amber">Needs review</Badge> : <Badge tone="teal">Up to date</Badge>}
    </div>
    <div className="mt-7 grid gap-5 border-t border-border pt-5 sm:grid-cols-2"><div><div className="font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">Recent symptoms</div><p className="mt-1.5 line-clamp-2 text-sm leading-6">{patient.symptoms || 'No symptoms recorded'}</p></div><div><div className="font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">Conditions on file</div><p className="mt-1.5 text-sm leading-6">{patient.conditions.length ? patient.conditions.join(' · ') : 'None recorded'}</p></div></div>
    <div className="mt-5 flex items-center justify-end gap-1 text-sm font-bold text-primary">Open patient record <ArrowRight size={15} /></div>
  </Link>;
}
