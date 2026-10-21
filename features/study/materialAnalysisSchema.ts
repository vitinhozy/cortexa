import type {
  AnalysisMaterial,
  MaterialAnalysis,
  MaterialAnalysisRecord,
} from '../../types/materialAnalysis.ts';

// Shared, dependency-free JSON Schema subset. No server credentials or provider code here.
interface Schema {
  type: 'object' | 'array' | 'string' | 'integer' | 'boolean';
  properties?: Record<string, Schema>;
  required?: string[];
  additionalProperties?: false;
  items?: Schema;
  enum?: (string | number)[];
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
}
const text = (maxLength: number): Schema => ({ type: 'string', minLength: 1, maxLength });
const texts = (maxItems: number, maxLength = 200): Schema => ({
  type: 'array',
  items: text(maxLength),
  maxItems,
});
const object = (properties: Record<string, Schema>): Schema => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
export const analysisMaterialSchema = object({
  id: text(150),
  title: text(100),
  content: text(10000),
  subjectName: text(100),
  topicName: text(100),
});
export const materialAnalysisSchema = object({
  schemaVersion: { type: 'integer', enum: [1] },
  status: { type: 'string', enum: ['analyzed', 'insufficient'] },
  discipline: text(100),
  theme: text(150),
  topics: texts(15, 100),
  complexity: { type: 'string', enum: ['basic', 'intermediate', 'advanced'] },
  learningObjectives: texts(12),
  concepts: {
    type: 'array',
    maxItems: 20,
    items: object({
      name: text(100),
      description: text(600),
      evidenceQuote: text(1000),
      important: { type: 'boolean' },
      prerequisites: texts(8, 100),
    }),
  },
  limitations: texts(8, 400),
});
export const recordValue = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
function matches(value: unknown, schema: Schema): boolean {
  if (schema.enum && !schema.enum.includes(value as string | number)) return false;
  switch (schema.type) {
    case 'string':
      return (
        typeof value === 'string' &&
        value.trim().length >= (schema.minLength ?? 0) &&
        value.length <= (schema.maxLength ?? Infinity)
      );
    case 'integer':
      return Number.isInteger(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return (
        Array.isArray(value) &&
        value.length >= (schema.minItems ?? 0) &&
        value.length <= (schema.maxItems ?? Infinity) &&
        value.every((item) => schema.items && matches(item, schema.items))
      );
    case 'object':
      return (
        recordValue(value) &&
        (schema.required ?? []).every((key) => key in value) &&
        Object.keys(value).every(
          (key) => !!schema.properties?.[key] && matches(value[key], schema.properties[key]),
        )
      );
  }
}
export function parseAnalysisMaterial(value: unknown): AnalysisMaterial {
  if (!matches(value, analysisMaterialSchema))
    throw new Error('Selecione uma anotação de até 10.000 caracteres, com título e assunto.');
  return value as AnalysisMaterial;
}
export const normalizeConcept = (name: string) =>
  name.normalize('NFC').trim().toLocaleLowerCase('pt-BR');
export function parseMaterialAnalysis(value: unknown, source: string): MaterialAnalysis {
  if (!matches(value, materialAnalysisSchema))
    throw new Error('A análise recebida não tem o formato esperado. Tente novamente.');
  const analysis = value as MaterialAnalysis;
  const names = analysis.concepts.map((c) => normalizeConcept(c.name));
  if (
    new Set(names).size !== names.length ||
    (analysis.status === 'analyzed' && (!names.length || !analysis.learningObjectives.length)) ||
    (analysis.status === 'insufficient' && (names.length > 0 || !analysis.limitations.length)) ||
    analysis.concepts.some(
      (c) =>
        !source.includes(c.evidenceQuote) ||
        c.evidenceQuote.trim().length < 8 ||
        new Set(c.prerequisites.map(normalizeConcept)).size !== c.prerequisites.length ||
        c.prerequisites.some(
          (name) =>
            !names.includes(normalizeConcept(name)) ||
            normalizeConcept(name) === normalizeConcept(c.name),
        ),
    )
  )
    throw new Error(
      'A análise não está suficientemente fundamentada no material. Tente novamente.',
    );
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (name: string): boolean => {
    if (visiting.has(name)) return false;
    if (visited.has(name)) return true;
    visiting.add(name);
    const concept = analysis.concepts[names.indexOf(name)];
    if (!concept.prerequisites.every((p) => visit(normalizeConcept(p)))) return false;
    visiting.delete(name);
    visited.add(name);
    return true;
  };
  if (!names.every(visit))
    throw new Error('Os pré-requisitos recebidos são inconsistentes. Tente novamente.');
  return analysis;
}
export function parseAnalysisRecord(
  value: unknown,
  owner: string,
  material: AnalysisMaterial,
): MaterialAnalysisRecord {
  if (
    !recordValue(value) ||
    value.userId !== owner ||
    value.materialId !== material.id ||
    !['id', 'contentHash', 'model', 'provider', 'promptVersion', 'generatedAt'].every(
      (key) =>
        typeof value[key] === 'string' &&
        (value[key] as string).length > 0 &&
        (value[key] as string).length <= 200,
    ) ||
    !/^[a-f0-9]{64}$/.test(String(value.id)) ||
    !/^[a-f0-9]{64}$/.test(String(value.contentHash)) ||
    !Number.isFinite(Date.parse(String(value.generatedAt))) ||
    (value.reviewedAt !== undefined &&
      (typeof value.reviewedAt !== 'string' || !Number.isFinite(Date.parse(value.reviewedAt))))
  )
    throw new Error('A análise não corresponde a este material e usuário.');
  parseMaterialAnalysis(value.analysis, material.content);
  return value as unknown as MaterialAnalysisRecord;
}
