import type { AcademicStage } from '@/types/academic';
export const learningGoalLabels = {
  understanding: 'Compreender fundamentos',
  retention: 'Manter revisões em dia',
  'clinical-reasoning': 'Praticar raciocínio clínico',
  assessment: 'Preparar uma avaliação',
} as const;
export const academicStageLabels: Record<AcademicStage, string> = {
  UNKNOWN: 'Ainda não sei exatamente',
  FOUNDATIONS: 'Fundamentos da graduação',
  CLINICAL: 'Formação clínica',
  INTERNSHIP: 'Internato',
  RESIDENCY_PREP: 'Preparação para residência',
  RESIDENCY: 'Residência médica',
};
