export interface AIConfig {
  apiKey?: string;
  model: string;
  timeoutMs: number;
  maxOutputTokens: number;
  dailyLimit: number;
  dailyTutorLimit: number;
}
export function aiConfig(get: (name: string) => string | undefined): AIConfig {
  const model = get('GEMINI_MODEL') || 'gemini-3.8-flash';
  if (!/^[a-zA-Z0-9._-]{1,100}$/.test(model)) throw new Error('GEMINI_MODEL inválido.');
  const configuredLimit = Number(get('AI_DAILY_ANALYSIS_LIMIT') || 20);
  const configuredTutorLimit = Number(get('AI_DAILY_TUTOR_LIMIT') || 20);
  return {
    apiKey: get('GEMINI_API_KEY'),
    model,
    timeoutMs: 25000,
    maxOutputTokens: 4096,
    dailyLimit:
      Number.isInteger(configuredLimit) && configuredLimit >= 1 && configuredLimit <= 100
        ? configuredLimit
        : 20,
    dailyTutorLimit:
      Number.isInteger(configuredTutorLimit) &&
      configuredTutorLimit >= 1 &&
      configuredTutorLimit <= 100
        ? configuredTutorLimit
        : 20,
  };
}
