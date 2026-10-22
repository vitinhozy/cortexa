# Produto — Cortexa

## Objetivo e público

O Cortexa organiza o estudo de estudantes de Medicina em uma jornada que conecta materiais próprios, prática, erros, revisão e progresso. A experiência é mobile-first, em português brasileiro, com uso também no navegador e em tablets. O objetivo é orientar o próximo estudo a partir de evidências registradas, sem apresentar leitura ou conversa como prova de domínio.

Este documento define escopo e critérios de produto. A composição técnica fica em [Arquitetura](docs/architecture.md); o uso cotidiano está no [README](README.md).

## Espaços e acesso

- **Entrada pública (`/`):** apresenta a proposta, uma história visual do estudo e chamadas para criar conta ou entrar. A apresentação de produto é ilustrativa; não abre ferramentas nem gera evidência acadêmica.
- **Acesso (`/account`):** login/cadastro por e-mail, recuperação e Google conforme disponibilidade do ambiente. Não existe “continuar sem conta”.
- **Área de estudo:** todas as demais rotas, inclusive onboarding, exigem usuário validado pelo Auth. A conta abre armazenamento local separado pela identidade; login não importa o espaço anônimo nem a antiga demonstração e não significa sincronização entre dispositivos.

Sem Supabase ou credenciais, a experiência pública continua funcionando no navegador e no Expo Go, com aviso de acesso por conta indisponível. Snapshots antigos permanecem no dispositivo, mas não são navegáveis anonimamente. A demonstração interativa anônima foi removida por decisão de produto; não criar um bypass para restaurá-la.

Não há papel administrativo implementado. A separação local evita mistura acidental; não equivale a criptografia ou autorização de backend. Não incluir dados de pacientes.

## Fluxos essenciais disponíveis

| Entrada e ação                                     | Resultado esperado                                                      |
| -------------------------------------------------- | ----------------------------------------------------------------------- |
| Configurar formação, disciplinas e disponibilidade | Perfil acadêmico progressivo, com complementos opcionais                |
| Criar anotação com disciplina, assunto e pasta     | Material local pesquisável, organizável e preservado após recarga       |
| Cadastrar questão ou cartão e praticar             | Tentativas/revisões alimentam erros e memória de aprendizagem           |
| Responder com confiança declarada                  | Feedback e evidência conceitual; no simulado, correção após entrega     |
| Cadastrar prova e planejar                         | Plano local com datas, assuntos e orçamento de tempo                    |
| Consultar Visão geral e jornada                    | Recomendações, atividade e domínio distinguem evidência real de exemplo |
| Criar mapa, slides ou transcrição em texto         | Documento local editável a partir de texto escrito ou colado            |

Os detalhes da jornada estão em [Evolução longitudinal](docs/learning-implementation.md); as regras de prática estão em [Questões e Simulados](docs/practice.md).

## Estado da integração remota

A análise de **anotações em texto → conceitos → revisão → catálogo** tem implementação cliente/servidor e implantação de desenvolvimento registrada em [Motor de IA](docs/ai-engine.md). O fluxo exige autenticação e envio explícito; o resultado é revisado antes de entrar no catálogo e não aumenta domínio ou XP. A chamada real autenticada ao provider ainda consta como pendente no registro de entrega; esta documentação não comprova disponibilidade remota.

Após autenticação validada, as ferramentas locais independem da disponibilidade da IA. O chat pessoal usa o transporte autenticado existente; falhas não geram respostas de demonstração. A entrega de acesso público não comprova disponibilidade remota atual.

## Limites do escopo atual

- Sem sincronização geral, backup em nuvem ou armazenamento local criptografado.
- Sem ingestão real de PDF, slides, imagem, links ou áudio; sem OCR, gravação, RAG ou transcrição automática.
- Mapas e slides locais reorganizam texto; não representam síntese ou geração por IA.
- Google depende da configuração do provedor; compra de assinatura e envio de notificações não estão integrados.
- Domínio e revisão usam heurísticas de produto, sem certificação de proficiência ou validação psicométrica; não são FSRS/SM-2.
- O tempo de sessão inclui background; não mede atenção precisa.
- Excluir conteúdo local não remove automaticamente suas versões remotas analisadas; retenção e remoção individual remota permanecem pendentes.

## Restrições e critérios de aceitação

Preservar Expo SDK 54, componentes React Native, Expo Router, TypeScript estrito e execução no Expo Go sem novas credenciais obrigatórias. Interfaces ficam em `types/`, exemplos em `mocks/`, regras de estudo em `features/study/` e efeitos em `services/`, conforme [AGENTS.md](AGENTS.md).

Uma alteração nos fluxos essenciais deve preservar estes resultados observáveis:

1. Uma visita sem sessão abre a landing pública. Links para ferramentas exigem login antes de renderizar conteúdo privado; uma sessão apenas armazenada não basta.
2. Uma conta validada permite salvar anotação, questão ou cartão localmente. Recarga e troca de identidade preservam dados e não importam snapshots anônimos ou demonstrativos. Logout bloqueia o acesso sem apagá-los.
3. Falha de armazenamento é visível; snapshot ilegível não é sobrescrito automaticamente.
4. Ler material ou aprovar conceitos não fabrica acerto, domínio ou atividade avaliativa.
5. Fontes e respostas simuladas são identificadas; indisponibilidade de serviço remoto aparece como tal.
6. Navegação, formulários e painéis permanecem utilizáveis no celular e na web, com redução de movimento respeitada.
7. Login preserva o destino interno seguro de um link direto; destinos externos ou malformados são descartados. Sem destino, o primeiro acesso segue para o onboarding.

Esses critérios são requisitos de preservação, não uma declaração de teste executado. Comandos e evidências ficam em [Qualidade](docs/quality.md).

## Próxima entrega e manutenção

O próximo passo da análise remota registrado no plano existente é confirmar o fluxo autenticado em desenvolvimento, incluindo falhas e revisão, antes de ampliar geração de conteúdo. Sincronização, retenção remota e validação em aparelhos físicos seguem pendentes; não são pré-requisitos novos para o núcleo local.

Atualizar este documento quando público, escopo ou aceitação mudarem. Regras visuais ficam em [Design](docs/design.md), preparação local em [Onboarding](docs/onboarding.md) e decisões do ambiente em [Setup](docs/setup.md).
