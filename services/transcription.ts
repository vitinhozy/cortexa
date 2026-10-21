import type { Repository } from './contracts';
import type {
  SpeechToTextProvider,
  TranscriptionDraft,
  TranscriptionInput,
} from '@/types/ingestion';

export function createTranscriptionService(repo: Repository, provider?: SpeechToTextProvider) {
  return {
    available: !!provider,
    async transcribe(input: TranscriptionInput): Promise<TranscriptionDraft> {
      if (!provider)
        throw new Error(
          'A transcrição de áudio ainda não está conectada. Você pode revisar textos colados no estúdio.',
        );
      if (
        input.userId !== repo.getSnapshot().user.id ||
        !input.uri ||
        !['audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/x-m4a'].includes(
          input.mimeType,
        ) ||
        input.language !== 'pt-BR'
      )
        throw new Error('Origem de áudio inválida para este espaço.');
      const result = await provider.transcribe(input);
      if (
        !result.text.trim() ||
        result.text.length > 12000 ||
        !Array.isArray(result.segments) ||
        result.segments.some(
          (segment, index) =>
            !segment ||
            !Number.isFinite(segment.startSeconds) ||
            !Number.isFinite(segment.endSeconds) ||
            segment.startSeconds < 0 ||
            segment.endSeconds < segment.startSeconds ||
            (index > 0 && segment.startSeconds < result.segments[index - 1].endSeconds) ||
            typeof segment.text !== 'string',
        )
      )
        throw new Error(
          'A transcrição retornada precisa de uma estrutura válida e timestamps ordenados.',
        );
      return {
        text: result.text,
        segments: result.segments,
        sourceUri: input.uri,
        needsReview: true,
      };
    },
  };
}
