# Evolução longitudinal — implementação

Implementada em 18 de outubro de 2026, sobre o estado auditado em [Auditoria da arquitetura](auditoria-arquitetura-2026-10-18.md). A auditoria permanece como registro do estado anterior.

## O que já pode ser usado

O ciclo local agora conecta formação, materiais próprios, prática, confiança, erros, domínio, revisão e recomendações. Funciona sem Supabase, credenciais, SDK de LLM ou novas dependências nativas. O conteúdo médico demonstrativo continua fictício; conteúdo pessoal é escrito pelo estudante e não recebe selo de revisão médica.

1. Abra **Perfil → Abrir meu espaço pessoal → Visão geral → Configurar meu estudo**.
2. Informe nome e momento da formação, incluindo a opção “Ainda não sei exatamente”. Disciplinas, objetivo, semestre, ingresso e instituição podem ficar para depois.
3. Salve uma anotação na Biblioteca. Pelo menu de criação, cadastre uma questão ou um cartão; questões podem indicar conceito e fontes do mesmo espaço. Cartões também podem ser associados a um conceito existente.
4. Pratique: confirme a resposta, declare certeza/dúvida/chute e só então consulte o feedback. Em simulado, a correção continua reservada à entrega.
5. Consulte **Perfil → Minha jornada e memória**. A nova tela reúne etapa, recomendações, domínio por conceito, evidências, revisões, atividades e transições confirmadas.
6. Volte à Visão geral para iniciar o próximo passo recomendado. O planejador também utiliza a priorização conceitual quando há evidência real.

Na preparação da prática, materiais, conteúdo novo, pontos fracos, conceitos e configuração ficam no mesmo painel amplo, com as animações e o gesto de fechar já usados nos outros painéis. O botão **Voltar** do painel percorre a etapa anterior, mantendo as escolhas; o botão da tela de preparação retorna à Visão geral. Iniciar a sessão fecha o painel antes de abrir as questões em tela inteira.

## Cobertura do pedido

| Parte do produto       | Implementação neste incremento                                                                                               | Limite explícito                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Jornada acadêmica      | Etapas explícitas, ingresso por ano/data, ano atual, modelo curricular, módulos, assuntos atuais, rotação e interesses       | Não infere etapa por semestre ou calendário                                                                    |
| Onboarding progressivo | Configuração curta; complementos opcionais no perfil; criação de novas disciplinas                                           | Não exige avaliação, universidade ou especialidade para começar                                                |
| Transições             | Confirmação para mudar uma etapa já definida, com histórico preservado                                                       | Atividades passadas não são reclassificadas pela nova etapa                                                    |
| Learner Model          | Projeção comum sobre jornada, conceitos, tentativas, revisões, erros, fontes e eventos                                       | Não duplica todo o snapshot em uma segunda store                                                               |
| Conceitos e hierarquia | Registro independente de questões, IDs preservados, tópicos/subtópicos com pai opcional e relações tipadas                   | Criação e relações avançadas estão expostas em serviços; não foi construído um editor visual completo de grafo |
| Study Events           | Questões, cartões, estudo concluído, conversa demonstrativa e conclusão de simulado                                          | Leitura/conversa registram exposição, sem fabricar acerto ou domínio                                           |
| Question Engine        | Especificações com conceito, etapa, objetivo, dificuldade, formatos, fontes e prioridade                                     | O banco local continua limitado aos exercícios existentes ou cadastrados                                       |
| Adaptação pedagógica   | Etapa muda nível inicial e preferência de formato; foco do aluno altera seleção; remediação e intercalação preservadas       | Não inventa casos ou conteúdo quando o banco não cobre a etapa                                                 |
| Domínio e confiança    | Um cálculo comum para serviço antigo, prática nova e cartões; autoavaliação tem peso menor                                   | Heurística de produto, não instrumento psicométrico validado                                                   |
| Histórico de domínio   | Antes/depois por evento, etapa e versão do algoritmo; ausência de evidência anterior é `null`                                | Valores ausentes do legado não são apresentados como histórico exato                                           |
| Caderno de erros       | Contexto acadêmico, confiança, domínio antes/depois quando conhecido e próxima prática                                       | Possível causa permanece hipótese didática/manual, sem diagnóstico individual por IA                           |
| Revisão                | Agenda por conceito e agenda do cartão atualizadas pela evidência; idempotência de revisão com ID de operação                | Não é FSRS/SM-2; políticas exigem calibração educacional                                                       |
| Simulados              | Evidência somente na entrega, entrega idempotente e versões avaliativas preservadas na sessão/tentativa                      | Não certifica proficiência; gabarito local não é uma prova segura                                              |
| Fontes e materiais     | Vínculos explícitos por espaço, conceitos associados e snapshots da questão respondida                                       | Não há leitura automática de arquivo, OCR ou páginas verificadas de PDFs reais                                 |
| Chat contextual        | Demonstração recupera conceitos relevantes, erros com alta confiança e foco da etapa; registra discussão                     | Chat pessoal real continua indisponível sem serviço remoto                                                     |
| Home e conhecimento    | Próximo passo por evidência; distinção entre domínio de assunto e conceito; acesso à memória                                 | Estatísticas demonstrativas continuam identificadas como exemplos                                              |
| Avaliações             | Framework, etapas, competências, blueprint, objetivos e regras versionados; elegibilidade e cobertura                        | Não foi importada matriz oficial, regra nacional ou nota de corte                                              |
| Enamed                 | A mesma infraestrutura de avaliações pode recebê-lo, com fonte/documento/versão/vigência/status                              | Regra pendente não ativa prática por matriz; não há tela paralela de Enamed nem especulação regulatória        |
| IA multimodelo         | Router por tarefa/capacidade, modelo/provedor injetáveis, autorização/orçamento obrigatórios, deduplicação e registro de uso | Biblioteca de orquestração para servidor; nenhum provedor real foi conectado ou cobrado                        |
| Validação de geração   | Pipeline de candidato → estrutura/fontes → revisão de qualidade independente                                                 | Sem avaliador de qualidade, o resultado fica `needs-review`; não publica automaticamente                       |
| Áudio/transcrição      | Contrato STT independente e serviço que valida proprietário, MIME e timestamps; retorna rascunho revisável                   | Sem adapter, informa indisponibilidade; não grava áudio nem simula processamento                               |
| Ingestão/RAG           | Contratos de jobs, trechos com dono, versão e localizador, além dos pontos de troca existentes                               | Extração, embeddings, busca remota e worker ainda precisam de implementação/integradores reais                 |
| Persistência           | Migração aditiva, validação de entidades internas, proteção contra sobrescrita e tentativa de gravação novamente             | Snapshot local; sem sincronização remota, criptografia ou controle entre duas abas                             |

## Decisões e invariantes

### Uma identidade acadêmica, preservando o legado

`AppData.version` continua em 1. `academicJourney`, `learning` e `assessments` são extensões opcionais, com schema próprio. O repositório executa `migrateSnapshot` ao iniciar e hidratar. As chaves por demonstração, local e conta foram mantidas.

Curso, semestre, universidade, disciplinas e objetivo textual permanecem em `User`, sem cópias independentes dentro da jornada. `semesterConfirmed` distingue a informação fornecida do valor inicial do espaço vazio. `courseEntry.precision` distingue ano de data: conhecer “2020” não cria um dia de ingresso.

Registros antigos mantêm estágio desconhecido quando ele não foi capturado. Tentativas antigas sem snapshot recebem uma cópia do banco conhecido na migração, marcada `legacy-current-bank`; isso estabiliza referências futuras sem afirmar que o enunciado histórico foi recuperado com certeza. Contadores de exemplo não são transformados em Study Events.

### Uma entrada de evidência para questões

`questionService.answer` e `practiceService` usam `applyQuestionAttempt`. A transação atualiza tentativa, evento, conceito, métrica agregada, erro, revisão e histórico de domínio. A regra antiga de `+3/-4` foi retirada. IDs de sessão/questão e IDs de operação evitam repetição de evidências.

Cartões registram autoavaliação na mesma memória conceitual, com peso 0,25 em relação à evidência objetiva base. Uma revisão não altera a taxa de acertos. A evidência mínima de domínio exige respostas objetivas; ler/conversar não aumenta a estimativa de domínio. Intervalos e parâmetros ficam em `features/study/policy.ts` e precisam ser calibrados.

As projeções por assunto são reconstruídas na migração a partir de evidência disponível. Alterar a estimativa não apaga tentativas. Estatísticas demonstrativas sem evidência mantêm seu papel de exemplo. A primeira estimativa não afirma que o aluno sabia 0% antes: o histórico distingue “sem evidência”.

### Estratégia e geração separadas

`questionSpecifications` define a intenção pedagógica. `nextPracticeQuestion` aplica etapa, evidência, dificuldade, objetivo, pré-requisitos e variedade ao banco disponível. A etapa de cada sessão é capturada ao criá-la e reaparece nas tentativas/eventos.

Fundamentos favorecem mecanismos e conceitos; clínica favorece aplicação, laboratório e diferenciação; internato prioriza situações clínicas progressivas e decisão; preparação e residência usam os perfis próprios, respeitando o conteúdo disponível. Isso é seleção pedagógica, não geração de conteúdo ou validação clínica.

`generateQuestionCandidate` aceita um `QuestionGenerator`, valida estrutura, conceito/assunto e fontes autorizadas, e chama opcionalmente um `QuestionQualityValidator`. Validade estrutural não significa precisão médica. O fluxo manual existente continua identificado como autoria do estudante.

### Avaliação externa não é evento de aprendizagem

O serviço de avaliações importa configurações tipadas com origem e identificação do documento. A mesma chave de framework/versão não pode ser sobrescrita com conteúdo diferente. Objetivos referenciam uma versão e etapa; a sessão conserva contexto de blueprint/regulamento.

`assessmentEligibility` retorna `inactive`, `unknown`, `ineligible` ou `eligible`, sempre relativo à configuração cadastrada. Apenas uma versão `REGULATED` e vigente é ativável. Um ano que contém um corte por dia/mês retorna indeterminação. `assessmentCoverage` retorna evidências/lacunas, sem inventar Readiness Score ou nota de aprovação.

Importação local valida estrutura; não autentica juridicamente a fonte. Um futuro adapter remoto deve verificar fonte, documento, autorização e autenticidade antes de disponibilizar matrizes oficiais. Fixtures de testes usam datas e nomes fictícios, não regras de Enamed.

### IA e transcrição prontas para troca de adapter

`services/aiRouter.ts` não é importado pela composição da aplicação. Não contém chave, fornecedor/modelo real ou tabela de preço. O executor exige `authorize` e `recordUsage`; a implementação real dessas políticas deve autenticar o usuário e reservar/verificar orçamento no servidor. IDs evitam repetir a mesma chamada dentro da instância; idempotência entre processos exige persistência do servidor.

Tarefas comuns permanecem na capacidade econômica mesmo quando a preferência é avançada. Tarefas complexas exigem a capacidade configurada; falta de modelo/provedor gera erro explícito. Uso registra usuário, feature, sessão, modelo, provedor, tokens disponíveis, latência e custo apenas quando informado. Valores desconhecidos não viram estimativas fictícias.

O STT é outro contrato. Um resultado precisa de revisão e não vira documento ou evidência de estudo automaticamente. Não há gravação/player nativo novo. O estúdio continua aceitando texto colado, mapas e slides mecânicos, preservando sua origem manual.

## Arquivos criados

| Grupo                  | Arquivos                                                                                                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contratos              | `types/academic.ts`, `types/learning.ts`, `types/assessment.ts`, `types/ai.ts`, `types/ingestion.ts`                                                                        |
| Regras e projeções     | `features/study/academic.ts`, `concepts.ts`, `events.ts`, `mastery.ts`, `policy.ts`, `learner.ts`, `questionEngine.ts`, `validation.ts`, `assessments.ts`                   |
| Serviços/adapters      | `services/academic.ts`, `migrations.ts`, `learning.ts`, `assessments.ts`, `aiRouter.ts`, `transcription.ts`                                                                 |
| Interface/configuração | `app/learning.tsx`, `constants/academic.ts`, `constants/studyTools.ts`                                                                                                      |
| Fixtures isolados      | `mocks/ai.ts`, `mocks/assessments.ts` — somente testes sintéticos                                                                                                           |
| Testes                 | `tests/academic.test.ts`, `learning.test.ts`, `assessments.test.ts`, `hierarchy.test.ts`, `migration.test.ts`, `integrations.test.ts`, `tests/e2e/academic-journey.spec.ts` |
| Documentação/capturas  | Este documento e `docs/screenshots/longitudinal-360.png`, `longitudinal-768.png`, `longitudinal-1440.png`                                                                   |

## Arquivos modificados e preservação

- `types/domain.ts`, `types/practice.ts`: extensões compatíveis e snapshots/contextos.
- `services/index.ts`, `practice.ts`, `studio.ts`, `workspace.ts`, `repository.ts`, `mockAI.ts`, `contracts.ts`: composição, comandos, evidência comum, persistência e contratos. As instâncias globais de serviços/repositório sem consumidores foram removidas; a aplicação continua injetando por espaço.
- `features/study/practice.ts`, `engine.ts`, `context.ts`: extração do cálculo comum, seleção por etapa e recomendações/projeções.
- `components/ProfileForm.tsx`, `PersonalHome.tsx`, `ui.tsx`, `components/practice/PracticeHome.tsx`, `PracticeSettings.tsx`, `PracticeRunner.tsx`: configuração progressiva, memória, objetivos pedagógicos e integração. Títulos de tela ganharam semântica de cabeçalho acessível.
- `app/compose.tsx`, `session.tsx`, `flashcards.tsx`, `mistakes.tsx`, `knowledge.tsx`, `app/(tabs)/profile.tsx`, `ai.tsx`, `study.tsx`: vínculos, registros e navegação, preservando as rotas existentes.
- `mocks/navigation.ts`, `mocks/topics.ts`: navegação geral passou a `constants/`; catálogo de disciplinas compartilhado sem copiar conteúdo demonstrativo ao pessoal.
- `tests/services.test.ts`, `tests/e2e/workspace.spec.ts`: expectativas migradas da regra antiga e seletor de tela ativa corrigido. Filtrar apenas por visibilidade não excluía a aba montada sob `aria-hidden`; o teste agora usa o cabeçalho acessível da tela ativa.
- `app.json`: ícone adaptativo usa o asset quadrado existente `cortexa-app-icon.png`; nenhum bitmap ou pacote nativo novo.
- `docs/architecture.md`, `docs/verification.md` e `README.md`: documentação do estado atual e dos limites de integração.
- A formatação foi aplicada pelo script do projeto, incluindo as pendências anteriores. Alterações de formatação em outros componentes não representam redesign ou remoção de comportamento.

Foram preservados os dados pessoais e demonstrativos separados, o Expo Router, a identidade visual, os temas, os componentes React Native, a prática existente, os simulados, a biblioteca, o estúdio e o uso sem conta. As 34 capturas preexistentes foram restauradas e conferidas por hash; as três novas capturas longitudinais fazem parte desta entrega.

## Validação

| Verificação                  | Resultado                                      |
| ---------------------------- | ---------------------------------------------- |
| TypeScript estrito           | Passou                                         |
| Testes de regra/serviço      | 62 passaram                                    |
| Lint                         | Passou, sem avisos                             |
| Formatação                   | Passou                                         |
| E2E com Expo em 8081         | Suíte completa de 37 cenários passou           |
| `expo install --check`       | Dependências compatíveis                       |
| Expo Doctor                  | 18/18 passaram                                 |
| Exportação web/Android/iOS   | Artefatos gerados e conferidos fora do projeto |
| Dispositivos nativos físicos | Não executado neste ambiente                   |

As capturas da nova tela foram conferidas visualmente em 360 e 1440 px; o teste responsivo também cobre 768 px. A exportação inclui bundles Hermes para Android/iOS e os arquivos web. Isso não equivale a gerar APK/IPA assinado ou validar execução em dispositivo físico.

Os testes novos cobrem onboarding mínimo, confirmação/transição, precisão de ingresso, migração idempotente, falha e recuperação de persistência, snapshots internos inválidos, adaptação real por etapa, evidência comum cartão/questão, versões de questão, entrega única do simulado, leitura sem domínio inventado, chat contextual, grafo sem ciclo, expansão curricular, candidatos de geração, matrizes imutáveis, regra pendente, cobertura sem prontidão artificial, autorização/custo de IA e STT sem provider.

## Trabalho externo ainda necessário

O núcleo local e os contratos acima não equivalem a uma implantação integral de todos os serviços futuros do produto. Permanecem: backend autorizado e sincronização, conexão de modelos reais, ingestão de arquivos/OCR/RAG, gravação/STT/player reais, verificação de fontes médicas e oficiais, avaliação de qualidade clínica e operação/custos em produção. Não foram criados recursos de marketing, integrações sociais ou cobranças.

Antes de distribuição, fazer triagem dos 39 alertas de dependências já identificados na auditoria (16 moderados, 23 altos), testar Expo Go/iPhone/Android/iPad físicos e medir crescimento do snapshot. Não foi feito `audit fix --force`, troca de SDK ou ocultação desses alertas. O tempo de leitura segue estimado pelo intervalo da sessão; precisão de atenção/inatividade, concorrência entre abas e armazenamento criptografado continuam como dívida técnica explícita.
