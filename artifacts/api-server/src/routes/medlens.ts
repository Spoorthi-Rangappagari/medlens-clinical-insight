import { and, desc, eq, ilike, or } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, activityTable, patientsTable, reportsTable } from "@workspace/db";
import {
  AnalyzeReportParams,
  AnalyzeReportResponse,
  CreatePatientBody,
  CreatePatientReportBody,
  CreatePatientReportParams,
  CreatePatientReportResponse,
  CreatePatientResponse,
  GetDashboardResponse,
  GetPatientParams,
  GetPatientResponse,
  ListActivityQueryParams,
  ListActivityResponse,
  ListPatientReportsParams,
  ListPatientReportsResponse,
  ListPatientsQueryParams,
  ListPatientsResponse,
  ReviewReportBody,
  ReviewReportParams,
  ReviewReportResponse,
  UpdatePatientBody,
  UpdatePatientParams,
  UpdatePatientResponse,
} from "@workspace/api-zod";
import type { ReportTestRecord } from "@workspace/db";

const router: IRouter = Router();

type PatientRecord = typeof patientsTable.$inferSelect;
type ReportRecord = typeof reportsTable.$inferSelect;

let demoDataPromise: Promise<void> | null = null;

async function seedDemoData(): Promise<void> {
  const existing = await db.select({ id: patientsTable.id }).from(patientsTable).limit(1);
  if (existing.length > 0) return;

  const [patient] = await db
    .insert(patientsTable)
    .values({
      name: "Aarav Mehta",
      dateOfBirth: "1987-04-14",
      sex: "male",
      symptoms: "Persistent fatigue and intermittent headaches over the last six weeks.",
      conditions: ["Migraine history"],
      allergies: ["Penicillin"],
      medications: ["Magnesium supplement"],
    })
    .returning();

  const [report] = await db
    .insert(reportsTable)
    .values({
      patientId: patient.id,
      title: "Complete blood count",
      reportDate: "2026-08-28",
      reviewStatus: "needs_review",
      summary: "AI summary pending human verification. Review the source values before relying on this record.",
      sourceText:
        "Hemoglobin: 13.8 g/dL (13.0–17.0)\nWBC: 6.2 x10^9/L (4.0–11.0)\nPlatelets: 238 x10^9/L (150–400)\nObservation: No critical values flagged by the source report.",
      extractedTests: [
        {
          name: "Hemoglobin",
          value: "13.8",
          unit: "g/dL",
          referenceRange: "13.0–17.0",
          status: "normal",
          observation: "Within the reference range shown in the source report.",
          provenance: "source",
        },
        {
          name: "WBC",
          value: "6.2",
          unit: "x10^9/L",
          referenceRange: "4.0–11.0",
          status: "normal",
          observation: "Within the reference range shown in the source report.",
          provenance: "source",
        },
        {
          name: "Platelets",
          value: "238",
          unit: "x10^9/L",
          referenceRange: "150–400",
          status: "normal",
          observation: "Within the reference range shown in the source report.",
          provenance: "source",
        },
      ],
    })
    .returning();

  await db.insert(activityTable).values([
    {
      type: "patient_created",
      label: "Patient record created",
      patientName: patient.name,
    },
    {
      type: "report_added",
      label: `Report added: ${report.title}`,
      patientName: patient.name,
    },
  ]);
}

function ensureDemoData(): Promise<void> {
  demoDataPromise ??= seedDemoData();
  return demoDataPromise;
}

function toReport(report: ReportRecord) {
  return {
    id: report.id,
    patientId: report.patientId,
    title: report.title,
    reportDate: report.reportDate,
    reviewStatus: report.reviewStatus as "needs_review" | "processing" | "verified",
    summary: report.summary,
    extractedTests: report.extractedTests,
    sourceText: report.sourceText,
    createdAt: report.createdAt,
    analyzedAt: report.analyzedAt,
  };
}

async function toPatient(patient: PatientRecord) {
  const reports = await db
    .select()
    .from(reportsTable)
    .where(eq(reportsTable.patientId, patient.id))
    .orderBy(desc(reportsTable.reportDate));

  return {
    id: patient.id,
    name: patient.name,
    dateOfBirth: patient.dateOfBirth,
    sex: patient.sex as "female" | "male" | "intersex" | "undisclosed",
    symptoms: patient.symptoms,
    conditions: patient.conditions,
    allergies: patient.allergies,
    medications: patient.medications,
    reportCount: reports.length,
    needsReview: reports.some((report) => report.reviewStatus !== "verified"),
    updatedAt: patient.updatedAt,
  };
}

function parseSourceLines(sourceText: string): ReportTestRecord[] {
  return sourceText
    .split(/\r?\n/)
    .flatMap((line): ReportTestRecord[] => {
      const match = line.match(/^([^:]+):\s*([^(\n]+?)(?:\s*\(([^)]+)\))?$/);
      if (!match) return [];
      return [{
        name: match[1].trim(),
        value: match[2].trim().replace(/\s+[a-zA-Z/%^0-9]+$/, ""),
        unit: match[2].trim().match(/[a-zA-Z/%^0-9]+$/)?.[0] ?? "",
        referenceRange: match[3]?.trim() ?? "Not provided in source",
        status: "unknown" as const,
        observation: "Reference range awareness requires human review of the source report.",
        provenance: "source" as const,
      }];
    });
}

async function analyzeWithOpenAI(sourceText: string): Promise<{
  summary: string;
  extractedTests: ReportTestRecord[];
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      summary: "AI processing is not configured. The source text is preserved for manual review.",
      extractedTests: parseSourceLines(sourceText),
    };
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You organize medical report text; you do not diagnose, recommend treatment, or invent facts. Return JSON with summary and extractedTests. Only mark a value low, normal, or high when the source explicitly provides a reference range and the comparison is clear; otherwise use unknown. Preserve the exact reference range from the source. Every test must have name, value, unit, referenceRange, status, observation, provenance set to ai. The summary must be patient-friendly and explicitly say this is not a diagnosis.",
        },
        {
          role: "user",
          content: sourceText,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned an empty response");

  const parsed = JSON.parse(content) as {
    summary?: string;
    extractedTests?: ReportTestRecord[];
  };

  return {
    summary:
      parsed.summary ??
      "The report was structured for review. This information is not a diagnosis.",
    extractedTests: Array.isArray(parsed.extractedTests) ? parsed.extractedTests : [],
  };
}

router.get("/dashboard", async (_req, res): Promise<void> => {
  await ensureDemoData();
  const patients = await db.select().from(patientsTable).orderBy(desc(patientsTable.updatedAt));
  const reports = await db.select().from(reportsTable);
  const patient = patients[0] ? await toPatient(patients[0]) : null;
  const result = GetDashboardResponse.parse({
    patientCount: patients.length,
    reportCount: reports.length,
    needsReviewCount: reports.filter((report) => report.reviewStatus !== "verified").length,
    reviewReadyCount: reports.filter((report) => report.reviewStatus === "verified").length,
    latestPatient: patient,
  });
  res.json(result);
});

router.get("/activity", async (req, res): Promise<void> => {
  await ensureDemoData();
  const query = ListActivityQueryParams.parse(req.query);
  const activity = await db
    .select()
    .from(activityTable)
    .orderBy(desc(activityTable.createdAt))
    .limit(query.limit);
  res.json(ListActivityResponse.parse(activity));
});

router.get("/patients", async (req, res): Promise<void> => {
  await ensureDemoData();
  const query = ListPatientsQueryParams.parse(req.query);
  const filters = [];
  if (query.search) {
    filters.push(
      or(
        ilike(patientsTable.name, `%${query.search}%`),
        ilike(patientsTable.symptoms, `%${query.search}%`),
      ),
    );
  }

  const patients = await db
    .select()
    .from(patientsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(patientsTable.updatedAt));
  const mapped = await Promise.all(patients.map((patient) => toPatient(patient)));
  const result = query.status === "all"
    ? mapped
    : mapped.filter((patient) =>
        query.status === "needs_review" ? patient.needsReview : !patient.needsReview,
      );
  res.json(ListPatientsResponse.parse(result));
});

router.post("/patients", async (req, res): Promise<void> => {
  const parsed = CreatePatientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [patient] = await db
    .insert(patientsTable)
    .values({
      ...parsed.data,
      dateOfBirth: parsed.data.dateOfBirth.toISOString().slice(0, 10),
    })
    .returning();
  await db.insert(activityTable).values({
    type: "patient_created",
    label: "Patient record created",
    patientName: patient.name,
  });
  res.status(201).json(CreatePatientResponse.parse(await toPatient(patient)));
});

router.get("/patients/:id", async (req, res): Promise<void> => {
  const params = GetPatientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [patient] = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.id, params.data.id));
  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }
  const mapped = await toPatient(patient);
  const reports = await db
    .select()
    .from(reportsTable)
    .where(eq(reportsTable.patientId, patient.id))
    .orderBy(desc(reportsTable.reportDate));
  res.json(GetPatientResponse.parse({ ...mapped, reports: reports.map(toReport) }));
});

router.patch("/patients/:id", async (req, res): Promise<void> => {
  const params = UpdatePatientParams.safeParse(req.params);
  const parsed = UpdatePatientBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [patient] = await db
    .update(patientsTable)
    .set({
      ...parsed.data,
      dateOfBirth: parsed.data.dateOfBirth.toISOString().slice(0, 10),
      updatedAt: new Date(),
    })
    .where(eq(patientsTable.id, params.data.id))
    .returning();
  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }
  res.json(UpdatePatientResponse.parse(await toPatient(patient)));
});

router.get("/patients/:id/reports", async (req, res): Promise<void> => {
  const params = ListPatientReportsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const reports = await db
    .select()
    .from(reportsTable)
    .where(eq(reportsTable.patientId, params.data.id))
    .orderBy(desc(reportsTable.reportDate));
  res.json(ListPatientReportsResponse.parse(reports.map(toReport)));
});

router.post("/patients/:id/reports", async (req, res): Promise<void> => {
  const params = CreatePatientReportParams.safeParse(req.params);
  const parsed = CreatePatientReportBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [patient] = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.id, params.data.id));
  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }
  const [report] = await db
    .insert(reportsTable)
    .values({
      patientId: patient.id,
      title: parsed.data.title,
      reportDate: parsed.data.reportDate.toISOString().slice(0, 10),
      sourceText: parsed.data.sourceText,
      reviewStatus: "needs_review",
      summary: "Awaiting AI-assisted structuring and human verification.",
      extractedTests: [],
    })
    .returning();
  await db.insert(activityTable).values({
    type: "report_added",
    label: `Report added: ${report.title}`,
    patientName: patient.name,
  });
  res.status(201).json(CreatePatientReportResponse.parse(toReport(report)));
});

router.post("/reports/:id/analyze", async (req, res): Promise<void> => {
  const params = AnalyzeReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [report] = await db
    .select()
    .from(reportsTable)
    .where(eq(reportsTable.id, params.data.id));
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  let analysis: { summary: string; extractedTests: ReportTestRecord[] };
  try {
    analysis = await analyzeWithOpenAI(report.sourceText);
  } catch (error) {
    req.log.warn({ error }, "AI report analysis failed; preserving source for manual review");
    analysis = {
      summary: "AI processing was unavailable. The original source is preserved for manual review.",
      extractedTests: parseSourceLines(report.sourceText),
    };
  }

  const [updated] = await db
    .update(reportsTable)
    .set({
      reviewStatus: "needs_review",
      summary: analysis.summary,
      extractedTests: analysis.extractedTests,
      analyzedAt: new Date(),
    })
    .where(eq(reportsTable.id, report.id))
    .returning();
  const [patient] = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.id, report.patientId));
  if (patient) {
    await db.insert(activityTable).values({
      type: "report_analyzed",
      label: `Report structured: ${updated.title}`,
      patientName: patient.name,
    });
  }
  res.json(AnalyzeReportResponse.parse(toReport(updated)));
});

router.patch("/reports/:id/review", async (req, res): Promise<void> => {
  const params = ReviewReportParams.safeParse(req.params);
  const parsed = ReviewReportBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db
    .update(reportsTable)
    .set({
      reviewStatus: parsed.data.reviewStatus,
      extractedTests: parsed.data.extractedTests,
      summary: parsed.data.summary,
    })
    .where(eq(reportsTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  const [patient] = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.id, updated.patientId));
  if (patient) {
    await db.insert(activityTable).values({
      type: "report_reviewed",
      label: `Report ${parsed.data.reviewStatus === "verified" ? "verified" : "sent back for review"}`,
      patientName: patient.name,
    });
  }
  res.json(ReviewReportResponse.parse(toReport(updated)));
});

export default router;