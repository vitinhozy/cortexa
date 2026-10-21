# Motor de IA da Cortexa

## Auditoria anterior à implementação

| Área          | Evidência no repositório                                                                                            | Decisão                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Frontend      | Expo SDK 54, React Native, Expo Router; `app/`, `components/`                                                       | Preservar telas, pop-ups, temas e Expo Go                         |
| Backend/banco | Nenhuma função/migração existente; AsyncStorage em `services/repository.ts`                                         | Adicionar limite remoto específico, sem migrar todo o app         |
| Autenticação  | `services/supabase.ts`, `hooks/useAuth.tsx`: Supabase opcional, espaços separados por usuário                       | Reusar sessão; verificação remota obrigatória                     |
| Materiais     | `StudyMaterial`, `materialService.addNote`, biblioteca/pastas/detalhe; notas reais, PDFs demonstrativos sem arquivo | Primeira feature recebe apenas texto real de anotação selecionada |
| Questões      | `Question`, explicação por alternativa, fonte, conceitos, versões; `services/practice.ts` e `questionEngine.ts`     | Reusar especificação/validação, não gerar aleatoriamente          |
| Simulados     | `types/assessment.ts`, `services/assessments.ts`, frameworks/blueprints versionados                                 | Composição e pontuação determinísticas                            |
| Chat/tutor    | `MockAIService`, `mocks/ai.ts`, `mocks/tutor.ts`; pessoal bloqueado                                                 | Não promover demonstração a IA real                               |
| Learner Model | `features/study/learner.ts`, `mastery.ts`, `concepts.ts`, `types/learning.ts`                                       | Reusar grafo, eventos, relações e evidências                      |
| Desempenho    | Tentativas, erros, confiança, tempo, revisões e histórico de domínio                                                | Dados observados; geração não altera domínio                      |
| Planejamento  | `engine.ts`, `context.ts`, `learner.ts`, `insights.ts`                                                              | Datas, prioridades e métricas continuam em algoritmos             |
| IA existente  | `types/ai.ts`, `services/aiRouter.ts`: seleção por capacidade, executor, autorização, telemetria; sem provider real | Estender contratos e usar o executor existente no servidor        |
| Ingestão      | Contratos de ingestão/retrieval, transcrição indisponível sem adapter, estúdio formata texto local                  | OCR, áudio, upload e RAG continuam futuros                        |
| Persistência  | Snapshot v1 validado, migrações aditivas, flush serial e bloqueio de sobrescrita inválida                           | Adicionar campos opcionais e validar na hidratação                |

Todos os conteúdos de `mocks/` continuam demonstrativos: material sem arquivo, conversa, fontes, roteiro do tutor, banco de questões e desempenho do seed. Editores de mapas/slides fazem formatação determinística, não inferência. Os contratos de IA/transcrição não representam integrações ativadas.

A experiência de conta usa Supabase Auth por e-mail com PKCE, confirmação e recuperação. O chat leva o aluno sem sessão até o acesso, mas continua sem provider de tutoria no espaço pessoal; nenhuma pergunta é enviada nesse estado. A única feature Gemini publicada continua sendo a análise de anotações descrita abaixo.

## Oportunidades e dependências

| Prioridade          | Fluxo                               | Responsabilidade da IA                                           | Responsabilidade do sistema / dependência                                         |
| ------------------- | ----------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Essencial — fase 1  | Material → conceitos reutilizáveis  | Interpretar texto, identificar conceitos/objetivos com evidência | Autenticar, versionar fonte, validar trechos, revisar, salvar, vincular ao grafo  |
| Essencial — próxima | Questões por material/assunto/erros | Gerar enunciado, alternativas e explicações fundamentadas        | Especificação acadêmica, fonte autorizada, validação, rascunho, prática existente |
| Essencial — próxima | Explicação da correção              | Explicar confusão com contexto da questão e resposta             | Gabarito, pontuação, tentativa e confiança permanecem determinísticos             |
| Importante          | Resumos e flashcards                | Síntese em modalidades e Active Recall                           | Análise revisada, objetivos, fontes, agenda de revisão existente                  |
| Importante          | Tutor contextual                    | Explicar/contrastar conceitos com profundidade controlada        | Atividade atual, contexto mínimo, histórico autorizado                            |
| Importante          | Plano e próximo estudo              | Explicar estratégia/abordagem                                    | Learner Model + algoritmo de priorização, tempo, revisões e provas                |
| Importante          | Erros e insights                    | Hipóteses pedagógicas e explicação dos padrões                   | Agregações verificáveis; hipóteses não viram diagnóstico nem estatística          |
| Futura              | Simulados adaptativos               | Gerar itens dentro da especificação                              | Blueprint, quotas, validação e revisão                                            |
| Futura              | Casos progressivos                  | Redigir caso educacional fictício                                | Ordem, respostas, regras e critérios de avaliação                                 |
| Futura              | Study Pack / PDF                    | Compor conteúdo educacional                                      | Dados revisados, renderização e exportação separadas                              |
| Futura              | PDF, slides, imagem, áudio          | Compreender trechos extraídos                                    | Upload privado, extração real, jobs e citações verificáveis                       |

## Plano incremental

1. Criar a skill local em `.agents/skills/cortexa-ai-engine`, apontada por `AGENTS.md`.
2. Implementar um único contrato de análise de material: schema, prompt versionado, provider Gemini server-side, executor, autenticação, limites, cache e persistência.
3. Conectar o detalhe da anotação: envio explícito, loading/cancelamento, rascunho revisável, aprovação e vínculo ao catálogo de conceitos, sem ganho de domínio.
4. Testar falhas, semântica, isolamento, reuso, persistência e jornada da interface. Ativar em projeto de desenvolvimento e verificar uma chamada real antes de declarar a fase remota concluída.
5. Só então avançar para questões e explicação da correção. Não criar botões ou schemas sem consumidor apenas para aparentar cobertura.

## Arquitetura escolhida

`MaterialScreen → serviço de análise → transporte autenticado → Edge Function → tarefa versionada → AI Router/Executor → AIProvider Gemini → validação semântica → armazenamento remoto → revisão → conceitos/evento locais`.

O banco é a memória de gerações e proveniência; o Learner Model local permanece a memória pedagógica atual. Esta fase não implementa sincronização geral de desempenho entre dispositivos.

A análise estrutural usa apenas a fonte selecionada e sua classificação, para ser reutilizável. Não precisa de um LLM para calcular domínio, consultar revisões ou compor a agenda. Não enviamos histórico completo para analisar uma anotação.

## Referências verificadas

- Skills locais descobertas em `.agents/skills`: https://learn.chatgpt.com/docs/build-skills
- Modelo solicitado: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash
- JSON Schema via API REST: https://ai.google.dev/gemini-api/docs/generate-content/structured-output
- Autorização nas funções: https://supabase.com/docs/guides/functions/auth

No início desta implementação, o conector Supabase retornou zero projetos e nenhuma configuração Gemini/Supabase estava disponível no ambiente. A validação remota depende de configuração externa; testes com transporte controlado não comprovam acesso real ao Gemini.

## Entrega implementada

O projeto de desenvolvimento `wqdbfaetsebukzoockly` foi criado na região sa-east-1 com estimativa de US$ 0/mês. Na primeira ativação remota, ainda não havia usuários cadastrados. A migration `20261020005809_cortexa_ai_material_analysis` foi aplicada e conferida no remoto; a Edge Function `ai-material-analysis` está publicada (versão 2); `GEMINI_MODEL`, `AI_DAILY_ANALYSIS_LIMIT` e o secret `GEMINI_API_KEY` estão configurados; URL e publishable key estão no `.env.local` local, ignorado pelo Git. Em 21/10/2026, uma pergunta autenticada ao tutor foi concluída pelo Gemini: `gemini-3.8-flash`, HTTP 200, 6.541 ms, 168 tokens de entrada e 44 de saída. O chat exibiu a mesma proveniência. Essa evidência valida apenas essa chamada e esse fluxo; não comprova as demais tarefas de IA nem correção médica.

- Provider Gemini REST server-side, configurado centralmente; reutiliza `AIProvider`, `createAIRouter` e `createAIExecutor`.
- Tarefa `material-analyzer.v1`, JSON Schema e validação de formato, limites, evidência literal, nomes únicos e pré-requisitos acíclicos. Não existe inferência de que JSON válido garante correção médica.
- Análise de anotações de até 10.000 caracteres. Disciplina, tema, tópicos, conceitos, objetivos, complexidade, importância e limitações ficam reutilizáveis. Retorno de insuficiência não cria conceitos.
- Pop-up com envio explícito, loading, cancelamento, erro amigável, nova tentativa, evidências e aprovação. Sem credenciais/login, informa indisponibilidade e preserva o estudo local.
- Gerações válidas ficam como rascunhos remotos. Aprovação marca a revisão no servidor e vincula os conceitos ao material/assunto no catálogo existente. Nomes iguais no mesmo assunto reaproveitam o conceito; relações que conflitam com o grafo existente não criam ciclos.
- Evento idempotente `MATERIAL_ANALYSIS_REVIEWED`; geração não concede XP, acerto, tempo, exposição de estudo ou domínio.
- Cache SHA-256 por proprietário, revisão completa da fonte, provider, modelo, prompt e schema. Uma alteração no título, texto ou classificação cria outra revisão. Há um único processamento ativo por chave, com lease de dois minutos e recusa de finalização de uma lease antiga.
- Até 20 novas tentativas por usuário em janela móvel de 24 horas, configurável entre 1 e 100. Cache não consome nova tentativa. Erros e tentativas interrompidas continuam consumindo a reserva; isso impede loops gratuitos. No máximo duas chamadas ao provider por tentativa, com retry somente para 429/503 e timeout total de 25 segundos. Saída limitada a 4.096 tokens. Esse limite é um teto operacional, não faturamento em moeda.
- Telemetria persistida: usuário, tarefa, feature, provider, modelo, início/fim, latência, tokens informados, status e código de erro. Não inclui conteúdo, API key ou JWT. Uma chamada sem conclusão pode ficar `running` até recuperação da lease; nenhuma estatística de tokens é inventada.
- Cancelamento interrompe espera/envio quando possível. Se o backend já concluiu, o rascunho permanece no cache; não existe promessa de estorno da chamada.

## Arquivos criados e alterados

Criados:

- `.agents/skills/cortexa-ai-engine/SKILL.md` e este documento.
- `types/materialAnalysis.ts` e `features/study/materialAnalysisSchema.ts`.
- `services/aiErrors.ts`, `services/materialAnalysis.ts`, `services/materialAnalysisTransport.ts`.
- `components/MaterialAnalysisPanel.tsx`.
- `supabase/functions/ai-material-analysis/index.ts`.
- `supabase/functions/_shared/ai/{config,gemini,handler,prompts,supabaseStore}.ts`.
- `supabase/migrations/20261020005809_cortexa_ai_material_analysis.sql`, `supabase/config.toml`, `supabase/.env.example` e ignore local da CLI.
- `scripts/set-gemini-secret.ps1`: cadastro seguro pelo terminal, com entrada oculta e arquivo temporário restrito removido ao final.
- `tests/material-analysis.test.ts`, `tests/helpers/analysisHarness.ts`, `tests/e2e/material-analysis.spec.ts`.

Alterados:

- `AGENTS.md`: descoberta permanente da skill local.
- `types/ai.ts` e `services/aiRouter.ts`: instrução/schema, sinal de cancelamento e validação antes do status de sucesso.
- `types/domain.ts`, `types/learning.ts`, `features/study/validation.ts`: análise opcional, evento e hidratação validada.
- `services/index.ts`, `services/supabase.ts`, `hooks/useStudy.tsx`: composição do transporte opcional.
- `app/material/[id].tsx`: integração da análise no material selecionado.
- `app/learning.tsx`, `features/study/learner.ts`: evento legível, sem transformar aprovação em evidência de aprendizado.
- `tsconfig.json`: imports compartilhados compatíveis com Deno; o entrypoint Deno usa check próprio.
- `package.json`/`package-lock.json`: check do servidor e PGlite somente como dependência de desenvolvimento para executar SQL/RLS nos testes. Nenhuma dependência nativa alterada.
- `docs/architecture.md`: fronteiras remotas e estado real da entrega.

## Banco e persistência

| Tabela                 | Conteúdo                                                                        | Acesso                                                       |
| ---------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `ai_material_versions` | Texto exato da versão selecionada e classificação, material local e usuário     | Leitura do próprio usuário; escrita pelo servidor            |
| `ai_material_analyses` | Resultado validado, proveniência, modelo/prompt, cache, lease, estado e revisão | Mesmo isolamento, FK composta para a versão do mesmo usuário |
| `ai_usage`             | Reservas e telemetria de cada tentativa                                         | Mesmo isolamento, índice por usuário e início                |

RPCs `claim_material_analysis`, `finish_material_analysis` e `review_material_analysis` são `SECURITY INVOKER`, com EXECUTE revogado de PUBLIC/anon/authenticated e permitido somente a service_role. A reserva usa lock transacional por usuário para serializar quota e deduplicação. O backend deriva usuário do Auth verificado e não aceita `userId` no corpo da requisição.

O snapshot local conserva a fonte exata da versão aprovada para detectar alterações sem depender de biblioteca nativa de criptografia. Não há sincronização geral do grafo/desempenho. Remover um item local não apaga automaticamente as versões remotas; retenção/remoção individual e reconciliação entre dispositivos são trabalho posterior. Exclusão da conta no Auth remove essas linhas por cascata.

## Ativação em desenvolvimento

O projeto remoto atual é `wqdbfaetsebukzoockly`. A migration e a função já foram publicadas. Para atualizações futuras, execute a partir da raiz do repositório.

1. O projeto já está criado na região de São Paulo. Para vincular este checkout à CLI em futuras migrações, autentique e execute `npx.cmd supabase link --project-ref wqdbfaetsebukzoockly` (a CLI pode solicitar a senha do banco configurada no dashboard).
2. Confira/aplique futuras migrations:

   ```powershell
   npx.cmd supabase db push --dry-run
   npx.cmd supabase db push
   ```

3. Cadastre a chave Gemini com o script local. Ele pede a chave com entrada oculta, usa um arquivo temporário com permissão restrita e o apaga após cadastrar o secret. Não coloque a chave no `.env.local` do Expo nem a envie por chat.

   ```powershell
   .\scripts\set-gemini-secret.ps1
   ```

   `GEMINI_MODEL` e `AI_DAILY_ANALYSIS_LIMIT` já estão cadastrados; as variáveis `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são fornecidas pelo runtime do Supabase.

4. Na raiz, configure `.env.local` a partir de `.env.example` com **somente** `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Reinicie o Expo na porta 8081. A URL da função é derivada do mesmo projeto autenticador.
5. Entre em uma conta, crie uma anotação real de estudo e abra **Analisar conceitos → Analisar esta anotação**. Confira trechos, objetivos e pré-requisitos; aprove para vincular ao catálogo.
6. Confirme as linhas de análise/uso no banco e repita a análise: deve reutilizar o cache. Teste com segunda conta, sessão expirada, quota, provider indisponível e conteúdo insuficiente. Verifique no Expo Go também. Só após isso registre a ativação real como concluída.

Variáveis:

| Variável                                    | Local                    | Valor / finalidade                                         |
| ------------------------------------------- | ------------------------ | ---------------------------------------------------------- |
| `GEMINI_API_KEY`                            | Secrets da Edge Function | Chave privada, nunca no cliente                            |
| `GEMINI_MODEL`                              | Secrets da Edge Function | `gemini-3.8-flash`, padrão central; mudança invalida cache |
| `AI_DAILY_ANALYSIS_LIMIT`                   | Secrets da Edge Function | `20`, tentativas por usuário nas últimas 24 h              |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Runtime da Edge Function | Injetadas pelo Supabase; nunca copiar para o frontend      |
| `EXPO_PUBLIC_SUPABASE_URL`                  | Expo                     | URL HTTPS do projeto                                       |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`      | Expo                     | Chave publicável, conforme validação já existente          |

## Validação e limites

Verificações de código: suíte completa com 70 testes aprovados; dois E2E relevantes aprovados no Expo web na porta 8081 (anotação pessoal e tutor em pop-up); TypeScript do app e do servidor aprovados; lint sem avisos. A suíte de análise foi repetida após acrescentar a verificação de alteração da fonte durante a requisição, com seis testes aprovados. O bundle web exportado com uma chave fictícia de teste não contém essa chave, `GEMINI_API_KEY` ou o endereço da API Gemini. No remoto, a migration aparece sincronizada, a função consta como ACTIVE e o advisor de segurança não retornou lints. O endpoint sem sessão respondeu 401 conforme esperado. Depois do login, a chamada autenticada registrou `completed`, `provider=gemini`, modelo `gemini-3.8-flash`, HTTP 200, 6.541 ms, 168 tokens de entrada e 44 de saída; a etiqueta no chat mostrou o mesmo modelo. Expo Go físico não foi validado.

Os testes executam a migração em PostgreSQL via PGlite e passam pelo handler, adapter REST, executor, validação, RPCs, serviço cliente e repositório local. A borda de rede do Gemini e a verificação externa do Auth são controladas no teste; não representam chamadas reais nem substituem um teste no projeto Supabase. PGlite serializa conexões; a concorrência entre instâncias reais deve ser confirmada na ativação.

Comandos reproduzíveis:

```powershell
npm.cmd run typecheck
npm.cmd run typecheck:server
npm.cmd test
npm.cmd run lint
# Com Expo na porta 8081:
npm.cmd run test:e2e -- tests/e2e/material-analysis.spec.ts
```

A skill teve frontmatter/nome/descrição/placeholders validados com Node e js-yaml, pois o ambiente não tinha runtime Python disponível para `quick_validate.py`.

O tutor de chat foi confirmado com uma resposta real do Gemini. A análise de material está publicada, mas ainda precisa de uma chamada real autenticada antes de ser considerada validada remotamente. A geração de questões permanece como próxima implementação após validar a análise de material. Explicações, resumos, flashcards, planos, recomendações, insights, simulados, casos e Study Pack mantêm os contratos e regras existentes e o roteiro incremental; não foram apresentados como integrações reais. PDF/áudio/imagem continuam sem ingestão remota. A análise valida estrutura, evidência literal e relações, mas não garante correção médica ou entailment das paráfrases: a revisão permanece necessária.

Próximo passo após ativar e observar a análise: geração de questões a partir da análise revisada, usando `QuestionSpecification` e `questionStructureIssues`, com explicações por alternativa e proveniência verificável. O blueprint e a pontuação continuam determinísticos.

## Atualização — chat do tutor

O chat pessoal agora usa services/aiTutorTransport.ts e a Edge Function ai-tutor-chat. Ela autentica o bearer token pelo Supabase Auth, recusa sessões anônimas e executa a tarefa tutoring pelo createAIExecutor e pelo provider Gemini existente. A chave Gemini e a chave service_role permanecem somente no servidor. O transporte exige que a resposta identifique provider: gemini e um modelo válido antes de armazená-la; não há fallback para o mock no espaço pessoal.

O pedido contém a pergunta, até seis mensagens anteriores, o assunto e somente o texto da anotação escolhida (até 5.000 caracteres). O banco guarda contagem, modelo, latência, tokens e estado, sem conteúdo de conversa. A quota padrão é 20 chamadas por usuário em 24 horas, configurável por AI_DAILY_TUTOR_LIMIT; tentativas falhas também contam. O limite de saída é 2.048 tokens, com timeout de provider de 25 segundos, timeout de transporte de 35 segundos, erro amigável e retry manual. A UI permite copiar a resposta e identifica provider/modelo.

20261021142323_ai_tutor_chat.sql cria uma tabela sem texto, com RLS habilitada e acesso por service_role; RPCs de reserva e fechamento são atômicos e inacessíveis aos papéis cliente. O texto da conversa continua em AsyncStorage, como o restante do espaço pessoal.

Em 21/10/2026, a migration foi aplicada ao projeto Supabase atual como versão `20261021142323` (nome `ai_tutor_chat`) e `ai-tutor-chat` foi publicada como versão 1, ativa, com verificação JWT do gateway desativada; a própria função valida o bearer token pelo Supabase Auth. A tabela tem RLS sem políticas cliente; leitura e RPCs ficam indisponíveis a `anon`/`authenticated`, com acesso de gravação apenas para `service_role`. Uma chamada sem bearer retornou 401 `unauthorized`, sem invocar o Gemini.

Uma chamada autenticada real foi concluída em 21/10/2026 com a pergunta “Explique pré-carga cardíaca em uma frase.”. O registro remoto confirmou `status=completed`, `provider=gemini`, modelo `gemini-3.8-flash`, resposta HTTP 200 e `error_code=null`; a UI exibiu a resposta retornada pelo Gemini. Isso valida o caminho de transporte e a proveniência do provider, não qualidade clínica, ausência de alucinação ou adequação para uso assistencial. A chave do provider e a chave `service_role` permanecem exclusivamente no servidor.
