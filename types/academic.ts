export type AcademicStage =
  | 'UNKNOWN'
  | 'FOUNDATIONS'
  | 'CLINICAL'
  | 'INTERNSHIP'
  | 'RESIDENCY_PREP'
  | 'RESIDENCY';
export type CourseEntry = { precision: 'year'; year: number } | { precision: 'date'; date: string };
export interface AcademicTransition {
  id: string;
  from: AcademicStage;
  to: AcademicStage;
  confirmedAt: string;
  source: 'student';
}
export interface AcademicJourney {
  learningGoal?: 'understanding' | 'retention' | 'clinical-reasoning' | 'assessment';
  schemaVersion: 1;
  stage: AcademicStage;
  courseEntry?: CourseEntry;
  semesterConfirmed: boolean;
  currentYear?: number;
  curriculum?: string;
  modules: string[];
  currentTopicIds: string[];
  rotation?: string;
  specialtyInterest?: string;
  residencyGoal?: string;
  transitions: AcademicTransition[];
  updatedAt?: string;
}
export interface AcademicJourneyInput {
  learningGoal?: AcademicJourney['learningGoal'];
  stage: AcademicStage;
  courseEntry?: CourseEntry;
  semesterConfirmed?: boolean;
  currentYear?: number;
  curriculum?: string;
  modules?: string[];
  currentTopicIds?: string[];
  rotation?: string;
  specialtyInterest?: string;
  residencyGoal?: string;
  confirmTransition?: boolean;
}
