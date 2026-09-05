import { createInsertSchema } from "drizzle-zod";
import {
  date,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export type ReportTestRecord = {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: "low" | "normal" | "high" | "unknown";
  observation: string;
  provenance: "source" | "ai" | "human_verified";
};

export const patientsTable = pgTable("medlens_patients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  dateOfBirth: date("date_of_birth", { mode: "string" }).notNull(),
  sex: text("sex").notNull(),
  symptoms: text("symptoms").notNull().default(""),
  conditions: text("conditions").array().notNull().default([]),
  allergies: text("allergies").array().notNull().default([]),
  medications: text("medications").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reportsTable = pgTable("medlens_reports", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  title: text("title").notNull(),
  reportDate: date("report_date", { mode: "string" }).notNull(),
  reviewStatus: text("review_status").notNull().default("needs_review"),
  summary: text("summary").notNull().default("Awaiting structured review."),
  extractedTests: jsonb("extracted_tests")
    .$type<ReportTestRecord[]>()
    .notNull()
    .default([]),
  sourceText: text("source_text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  analyzedAt: timestamp("analyzed_at", { withTimezone: true }),
});

export const activityTable = pgTable("medlens_activity", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  label: text("label").notNull(),
  patientName: text("patient_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPatientSchema = createInsertSchema(patientsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertReportSchema = createInsertSchema(reportsTable).omit({
  id: true,
  createdAt: true,
  analyzedAt: true,
});
export const insertActivitySchema = createInsertSchema(activityTable).omit({
  id: true,
  createdAt: true,
});

export type Patient = typeof patientsTable.$inferSelect;
export type Report = typeof reportsTable.$inferSelect;
export type Activity = typeof activityTable.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;