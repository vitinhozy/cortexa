export type AIErrorCode =
  | 'unavailable'
  | 'unauthorized'
  | 'invalid_input'
  | 'invalid_output'
  | 'rate_limit'
  | 'busy'
  | 'timeout'
  | 'cancelled'
  | 'provider'
  | 'storage';
const messages: Record<AIErrorCode, string> = {
  unavailable: 'A análise de materiais ainda não está configurada neste ambiente.',
  unauthorized: 'Entre na sua conta para analisar este material.',
  invalid_input: 'O material enviado não é válido. Confira a anotação e tente novamente.',
  invalid_output: 'Não foi possível obter uma análise fundamentada no material. Tente novamente.',
  rate_limit: 'O limite de análises deste período foi atingido. Tente novamente mais tarde.',
  busy: 'Este material já está sendo analisado. Aguarde um momento e tente novamente.',
  timeout: 'A análise demorou mais que o esperado. Tente novamente.',
  cancelled: 'Análise cancelada.',
  provider: 'Não foi possível analisar agora. Seu material está salvo; tente novamente.',
  storage: 'Não foi possível salvar a análise. Tente novamente.',
};
export class AIError extends Error {
  constructor(public readonly code: AIErrorCode) {
    super(messages[code]);
    this.name = 'AIError';
  }
}
export function safeAIError(error: unknown): AIError {
  return error instanceof AIError ? error : new AIError('provider');
}
export function remoteAIError(value: unknown): AIError {
  const code =
    typeof value === 'object' && value !== null && 'code' in value ? value.code : undefined;
  return new AIError(
    typeof code === 'string' && Object.prototype.hasOwnProperty.call(messages, code)
      ? (code as AIErrorCode)
      : 'provider',
  );
}
