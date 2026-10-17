# Arquitetura do MVP

## Fluxo atual

```text
Tela Expo Router
  → useStudy / serviços tipados
  → repositório local observável
  → atualização atômica do estado
  → AsyncStorage (fila serial de gravações)
  → telas e recomendações atualizadas
```

`types/domain.ts` define User, Subject, Topic, StudyMaterial, Question, QuestionAttempt, Flashcard, FlashcardReview, StudySession, Exam, StudyPlan, KnowledgeMetric, AIConversation, AIMessage e Mistake. Os mocks ficam fora dos componentes, em `mocks/`.

`services/contracts.ts` expõe AuthService, MaterialService, StudyService, QuestionService, FlashcardService, AIService e KnowledgeService. O ponto de composição é `services/index.ts`, consumido pelo provider em `hooks/useStudy.tsx`. A interface Repository permite injetar outro repositório nos serviços. O provider centraliza o estado; para a versão remota ele deverá carregar os dados autenticados e compor as implementações remotas, mantendo os mesmos modelos e chamadas das telas.

O repositório conserva um snapshot estável para `useSyncExternalStore`. Cada transação gera um snapshot novo; as gravações locais são serializadas para evitar que uma gravação antiga sobrescreva uma nova. O provider aguarda a hidratação antes de liberar interação. Há versão do formato local, recuperação de JSON inválido e indicação de falha de armazenamento no perfil. A validação atual é estrutural, adequada ao demo; migrar para schemas completos ao aceitar dados externos.

## Study Engine

`features/study/engine.ts` contém funções puras testáveis:

- `recommendTopics`: menor domínio, quantidade limitada de erros, cards vencidos, prova em até sete dias e tempo desde a última atividade aumentam a prioridade. Minutos já estudados no dia reduzem a insistência no mesmo tópico.
- `generatePlan`: distribui o orçamento diário entre os assuntos prioritários selecionados. A soma dos blocos de cada dia equivale ao orçamento. Limite de 60 dias e 480 minutos/dia, validado na interface.
- `scheduleReview`: Não lembrei → 10 minutos; Difícil → 1 dia; Bom → no mínimo 3 dias; Fácil → no mínimo 7 dias. Bom/Fácil ampliam intervalos anteriores. É um ponto de troca para FSRS/SM-2, não uma implementação desses algoritmos.
- `masteryLabel`: fronteiras 0–49, 50–74, 75–89 e 90–100.

A prioridade é uma heurística de produto e o domínio é um indicador demonstrativo. Uma resposta certa soma três pontos de domínio; uma errada reduz quatro. Revisões também ajustam o indicador. Métricas iniciais são mocks, não inferências científicas. Tentativas são idempotentes por ID da sessão/questão. Flashcards gerados de uma mesma questão não são duplicados. O tempo registrado corresponde a minutos completos da sessão aberta, incluindo os fluxos de prática; não há rastreamento de inatividade/background nesta etapa.

## Supabase futuro

Não há dependência `supabase-js`, projeto remoto, migration ou chave nesta entrega. A integração deverá:

1. Implementar AuthService e provider autenticado usando Supabase Auth, sem alterar os componentes de estudo.
2. Mapear entidades para tabelas PostgreSQL, com `user_id` e índices nas consultas frequentes. Métricas globais e tentativas precisam de transações/idempotência também no servidor.
3. Ativar RLS em todas as tabelas expostas. Políticas precisam restringir propriedade por `auth.uid() = user_id`; UPDATE também precisa de WITH CHECK. Não usar metadados editáveis do usuário como autorização.
4. Adicionar Storage privado e políticas por usuário; gerar URLs assinadas apenas quando necessário. Revalidar propriedade dos materiais em cada operação de backend.
5. Persistir conversas, planos, revisões e tentativas via implementações dos mesmos contratos; adicionar loading, retries e tratamento de sessão expirada no provider/serviços.

Chaves de provedores e service role devem permanecer exclusivamente no servidor. Somente a configuração pública necessária ao cliente poderá estar em variáveis `EXPO_PUBLIC_*`. Não basta mover um secret para `.env`: essas variáveis são incorporadas ao bundle.

## AI Router e RAG futuros

O MockAIService demonstra respostas assíncronas, histórico, modo e contexto. AIRouter separa capacidades econômicas (resumos), avançadas (tutoria) e multimodais (imagem), sem chamar modelos. RetrievalService e IngestionService são contratos de backend, sem implementações falsas de infraestrutura.

```text
upload privado
  → validação de formato/tamanho e autorização
  → fila de ingestão
  → extração de texto/OCR/transcrição
  → chunks com material, página e proprietário
  → embeddings em backend
  → PostgreSQL + pgvector
  → busca filtrada por proprietário e materiais autorizados
  → contexto recuperado
  → AI Router → provedor LLM
  → resposta estruturada com fontes verificáveis
```

Modo aula consulta os materiais autorizados do estudante. Modo medicina consulta uma coleção curada e versionada de referências externas. Fontes simuladas do MVP nunca devem ser promovidas a citações reais. Antes da integração, definir cobertura, avaliação das respostas, curadoria médica, proteção contra instruções maliciosas em documentos, orçamento, retenção e remoção dos dados.

O endpoint de IA deve validar autenticação, escopo dos materiais, limites e formato de saída. Nenhuma chamada com credenciais de provedor parte do aplicativo. Documentos são dados não confiáveis, não instruções do sistema.

## Evolução prevista

O MVP valida navegação e ciclos de aprendizagem. Os próximos incrementos são curadoria do banco, teste em aparelhos físicos, autenticação/persistência remota, uploads reais, ingestão e respostas com fontes. As telas usam React Native; não há DOM ou CSS web nos componentes de produto. Safe areas, scroll, layout flexível, campos e teclado usam APIs nativas/Expo.
