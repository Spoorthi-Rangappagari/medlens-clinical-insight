import { ArrowLeft, CircleHelp, Save } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { useCreatePatient, getGetDashboardQueryKey, getListPatientsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Field, Input, Textarea } from '@/components/ui';

export function PatientIntakePage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const create = useCreatePatient();
  const [form, setForm] = useState({ name: '', dateOfBirth: '', sex: 'undisclosed' as 'female' | 'male' | 'intersex' | 'undisclosed', symptoms: '', conditions: '', allergies: '', medications: '' });
  const [error, setError] = useState('');
  const update = (key: keyof typeof form, value: string) => setForm((old) => ({ ...old, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.dateOfBirth) { setError('A name and date of birth are needed to create the record.'); return; }
    setError('');
    create.mutate({ data: { ...form, name: form.name.trim(), conditions: splitList(form.conditions), allergies: splitList(form.allergies), medications: splitList(form.medications) } }, {
      onSuccess: (patient) => { queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); setLocation(`/patients/${patient.id}`); },
      onError: () => setError('The record could not be created. Check the details and try again.'),
    });
  };
  return <div className="mx-auto max-w-[980px] px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
    <Link href="/patients" className="mb-9 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition hover:text-primary" data-testid="link-intake-back"><ArrowLeft size={15} /> Patient index</Link>
    <div className="mb-8"><div className="mb-3 font-mono text-[10px] uppercase tracking-[.2em] text-primary">New record · step 01</div><h1 className="font-serif text-4xl tracking-[-.045em] sm:text-5xl">Start with the<br /><em className="text-primary">known details.</em></h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Capture the context your team already has. You can add reports and refine the record later.</p></div>
    <form onSubmit={submit} className="space-y-5">
      <section className="rounded-xl border border-card-border bg-card p-5 sm:p-7"><div className="mb-6 flex items-center gap-3 border-b border-border pb-5"><div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">01</div><div><h2 className="font-serif text-xl font-semibold">Patient identity</h2><p className="text-xs text-muted-foreground">Used to keep records attributed correctly.</p></div></div><div className="grid gap-5 sm:grid-cols-2"><Field label="Full name"><Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Morgan Ellis" data-testid="input-patient-name" /></Field><Field label="Date of birth"><Input type="date" value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} data-testid="input-patient-dob" /></Field><Field label="Sex"><select value={form.sex} onChange={(e) => update('sex', e.target.value)} className="h-11 rounded-lg border border-input bg-card px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="select-patient-sex"><option value="undisclosed">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="intersex">Intersex</option></select></Field></div></section>
      <section className="rounded-xl border border-card-border bg-card p-5 sm:p-7"><div className="mb-6 flex items-center gap-3 border-b border-border pb-5"><div className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-xs font-bold text-primary">02</div><div><h2 className="font-serif text-xl font-semibold">Clinical context</h2><p className="text-xs text-muted-foreground">List what has been observed or documented, without interpretation.</p></div></div><div className="space-y-5"><Field label="Current symptoms"><Textarea value={form.symptoms} onChange={(e) => update('symptoms', e.target.value)} placeholder="Describe reported symptoms, duration, and context…" data-testid="textarea-patient-symptoms" /></Field><div className="grid gap-5 sm:grid-cols-3"><Field label="Known conditions" hint="Separate items with commas"><Input value={form.conditions} onChange={(e) => update('conditions', e.target.value)} placeholder="e.g. Asthma, migraine" data-testid="input-patient-conditions" /></Field><Field label="Allergies" hint="Separate items with commas"><Input value={form.allergies} onChange={(e) => update('allergies', e.target.value)} placeholder="e.g. Penicillin" data-testid="input-patient-allergies" /></Field><Field label="Medications" hint="Separate items with commas"><Input value={form.medications} onChange={(e) => update('medications', e.target.value)} placeholder="e.g. Current medications" data-testid="input-patient-medications" /></Field></div></div></section>
      <div className="rounded-xl border border-primary/15 bg-primary/[.045] p-4"><div className="flex gap-3"><CircleHelp size={17} className="mt-0.5 shrink-0 text-primary" /><p className="text-xs leading-5 text-muted-foreground">This record supports organization and clinical review. It does not provide diagnosis or treatment recommendations.</p></div></div>
      {error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert" data-testid="status-intake-error">{error}</p>}
      <div className="flex flex-col-reverse justify-between gap-3 border-t border-border pt-5 sm:flex-row sm:items-center"><p className="text-xs text-muted-foreground">You can edit these details after creation.</p><Button type="submit" loading={create.isPending} data-testid="button-create-patient"><Save size={16} /> Create patient record</Button></div>
    </form>
  </div>;
}

const splitList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);
