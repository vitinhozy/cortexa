export type RegulationStatus =
  | 'DRAFT'
  | 'APPROVED_BY_CONGRESS'
  | 'SANCTIONED'
  | 'REGULATED'
  | 'SUPERSEDED'
  | 'VETOED';
export interface AssessmentSource {
  title: string;
  url: string;
  documentId: string;
  publishedAt: string;
  kind: 'official' | 'institution' | 'personal';
}
export interface RegulationVersion {
  id: string;
  version: string;
  source: AssessmentSource;
  status: RegulationStatus;
  effectiveFrom?: string;
  effectiveUntil?: string;
  courseEntryFrom?: string;
  courseEntryUntil?: string;
}
export interface AssessmentStage {
  id: string;
  title: string;
  academicYear?: number;
  weight?: number;
}
export interface Competency {
  id: string;
  name: string;
  domain: string;
  conceptIds: string[];
}
export interface AssessmentBlueprint {
  version: string;
  source: AssessmentSource;
  entries: { stageId: string; competencyId: string; weight?: number }[];
}
export interface AssessmentFramework {
  id: string;
  title: string;
  version: string;
  regulation: RegulationVersion;
  stages: AssessmentStage[];
  competencies: Competency[];
  blueprint: AssessmentBlueprint;
}
export interface AssessmentGoal {
  id: string;
  frameworkId: string;
  frameworkVersion: string;
  stageId: string;
  targetDate: string;
}
export interface AssessmentContext {
  frameworkId: string;
  frameworkVersion: string;
  stageId: string;
  blueprintVersion: string;
  regulationVersion: string;
}
export interface AssessmentState {
  schemaVersion: 1;
  frameworks: AssessmentFramework[];
  goals: AssessmentGoal[];
}
