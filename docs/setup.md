# Setup e evidências — 21/10/2026

## Fonte, autorização e estado inicial

Aplicado ao Cortexa existente: Expo SDK 54/RN, TS estrito, npm e Expo Router, sem migração de stack. O usuário solicitou o [prompt 12](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/790a895304e0c08b70a5b215c9d334f1c86b816c/docs/prompts/12-existing-project-setup.md) inteiro e aprovou explicitamente o desenho e plano de adoção **local incremental** após brainstorming. Instalações globais e serviços permanecem intervenções separadas. Não houve push, publicação, migração, custo novo, agendamento ou mudança de permissões.

Toolkit único: `790a895304e0c08b70a5b215c9d334f1c86b816c`, obtido em diretório temporário fora do app. README, overview, instalação, playbook, catálogos, manifest, templates e guias pertinentes foram lidos dessa revisão. A adaptação evita exemplos Next/Drizzle/DOM incompatíveis. Sources oficiais complementam comandos atuais, sem misturar versões de templates.

Estado inicial: HEAD `bea8b29a600009d6a695945626930d59d8bb115f`, muitas alterações staged/unstaged/untracked preexistentes. Backup de 243 arquivos do checkout, status e hashes foi criado antes da implementação, sem arquivos `.env` reais ou caches. Caminho de recuperação desta execução: `%TEMP%\cortexa-setup-20261021-ph7RNm\before`; inventário em `baseline.json` no diretório pai. Não versionar esse backup. Para recuperar, comparar e copiar **somente** arquivos escolhidos após preservar mudanças posteriores; não usar reset/checkout geral.

Cliente observado: Codex CLI `0.162.0-alpha.17.2` na sessão desktop; Windows/PowerShell; Node `22.23.3`, npm `10.9.9`. Preservados login/autenticação da sessão, modelo principal e permissões. Não foi consultado conteúdo de credenciais. Ferramentas da sessão e MCP configurado no CLI são inventários diferentes; `cua_repl`/`node_repl` estavam habilitados, `code-review` desabilitado no inventário sanitizado. Não há Context7/RTK/Graphify carregados.

Três auditorias iniciais independentes usaram `gpt-6.1-sol`/`medium`, com escopos somente leitura. Casos descartáveis e revisão receberam capacidade por risco; detalhes na seção de harness. Seleção explicitamente autorizada pelo prompt, sem troca de provedor ou autenticação. Não há roster fixo ou economia de tokens/custo estimada. Regras de delegação em [AGENTS](../AGENTS.md); orientação conferida em [OpenAI Docs](https://learn.chatgpt.com/docs/agent-configuration/subagents).

## Mapa documental

| Destino do manifest | Fonte canônica nesta entrega |
|---|---|
| README.md | Entrada, execução e estado resumido; preservado e corrigido |
| PRODUCT.md | Público, fluxos, limites e aceitação observados |
| AGENTS.md | Comandos, contratos e índice curto carregado pelo cliente |
| CLAUDE.md | Importa AGENTS; não implica cliente Claude instalado |
| docs/architecture.md | Fronteiras e serviços; contradições de estado remoto/breakpoint corrigidas |
| docs/design.md | Tokens, componentes RN, acessibilidade e responsividade |
| docs/onboarding.md | Preparação Windows e execução local |
| docs/quality.md | Gates, dívida, segurança e procedimentos prompts 13–15 |
| docs/setup.md | Este registro de decisões e evidência |

`docs/ai-engine.md`, `docs/practice.md` e `docs/learning-implementation.md` continuam responsáveis pelos seus contratos. Auditoria de 18/10 e `docs/verification.md` são históricos preservados. Não foi criado outro índice de memória concorrente.

## Cobertura final do catálogo

P = projeto; S = sessão; E = ambiente fora do projeto. “Reutilizado” não equivale a ferramenta integrada testada. Risco corresponde à ação local adotada. Detalhes de validação estão nas seções seguintes e em [Qualidade](quality.md).

| Componente | Necessidade / estado observado | Ação e escopo | Dependência / risco | Estado e critério de validação |
|---|---|---|---|---|
| 01 Superpowers | Processo aplicável, skill ausente | Protocolo proporcional equivalente (S); plugin oficial sugerido (E) | Ação do usuário/recarregar; baixo | Desenho/plano aprovados; plugin **não instalado/testado**; retomar após instalação confirmada |
| 02 Subagentes | Ferramentas disponíveis, quatro slots | Reutilizado (S), acordos em AGENTS (P) | Arquivos/recursos isolados; baixo | Auditorias e casos observados; um escritor por arquivo, root integra configs/lock |
| 03 RTK | Binário não encontrado no PATH | Bloqueado por pré-requisito E | Instalação oficial e hooks; médio | Sem instalação/execução. Comprovar versão, execução única e saída original; PowerShell desktop não comprovado |
| 04 Ponytail full | Plugin ausente; disciplina de escopo pertinente | Equivalente em acordos (P/S) | Nenhuma local; baixo | Reuso e mudança mínima; não alegar plugin ativo. Instalação cliente separada |
| 05 Caveman | Skill ausente; comunicação concisa já requerida | Equivalente nativo (P/S), sem proxy | Nenhuma; baixo | Português claro; docs/código normais; sem métricas de economia |
| 06 ESLint/Biome | ESLint Expo/Prettier funcionais | Reusados; três módulos + self-check (P) | Medição antes de gates; médio | Console limpo em error; tamanho/fronteira/typed em diagnóstico. Biome redundante não adotado |
| 07 Graphify | CLI/Python funcional/uv não comprovados | Exclusões preparadas P; extração bloqueada E | Runtime e instalação isolada; médio | `.graphifyignore` e saída ignorada; nenhum grafo gerado/consultado; retomar com CLI funcional |
| 08 Obsidian | Sem destino/necessidade concreta | Inaplicável | Docs versionados suficientes; baixo | Não criar vault/MCP/exportação |
| 09 Memória | AGENTS e docs existentes | Índice curto + detalhes sob demanda (P) | Verificação/invalidação; baixo | Sem alegar autoload de MEMORY.md. Recuperação em contexto limpo registrada abaixo |
| 10 Hooks | Nenhuma necessidade local comprovada | Não selecionados; preservar os existentes | Formato/confiança do cliente; médio | Nenhum interceptor/Git hook novo; sem copiar hooks Claude para Codex |
| 11 agent-browser | Playwright/Chromium existentes | Equivalente reutilizado (P/S) | Expo 8081; baixo | E2E local; CLI adicional não instalado. Não comprova Expo Go |
| 12 Context7 | Ausente; plugin disponível não instalado | Integração sugerida E; fallback oficial S | Instalação/conexão e recarga; baixo | Sem resolve/query real; não há MCP duplicado. Retomar após conexão confirmada |
| 13 Artefatos/skills | Documents/PDF/slides/planilhas/skill-creator já disponíveis | Reutilizados (S), sob demanda | Licenças distintas; baixo | Sem pacote Office Anthropic duplicado; nenhum artefato fictício para checklist |
| 14 Chrome DevTools MCP | Sem gap concreto além do browser existente | Não selecionado; reusar Playwright | Não abrir CDP/perfil pessoal; baixo | Nenhum MCP/telemetria adicional; performance nativa não aferida |
| 15 Codex | Instalado e funcional | Reutilizado (P/S), formato oficial | Nova descoberta distinta de disco; baixo | CLI/instruções observados; restart do cliente não executado |
| 16 Vercel mobile | Skill específica ausente | `vercel-react-native-skills` copiada local (P) | Frontmatter MIT/revisão; baixo | CLI 1.7.4, origem/lock fixados, leitura local; descoberta autônoma em contexto limpo abaixo |
| 16 React/composição | Reviewer React global já disponível | Reusar reviewer; composição local não selecionada | Nenhum problema concreto de API; baixo | Somente regras compatíveis com RN; não duplicar skill sem necessidade |
| 16 web/escrita/transições | Sem UI DOM/Next | Web/transições inaplicáveis; escrita por acordos | Preservar pt-BR/RN; baixo | Nenhuma migração de UI/dependência |
| 16 deploy/optimize/tokens | Vercel disponível; operação não solicitada | Capacidade reutilizável, não executada | Alvo/auth/métricas futuros; alto se executar | Não publicar ou configurar token para preencher catálogo |
| 16 find-skills | Descoberta atual atendeu necessidade | Equivalente nativo reutilizado | Baixo | Skill mobile localizada na origem oficial; sem instalação redundante |
| 17 Next dev/bundle | App Expo/Metro, sem Next | Inaplicáveis | Sem migração/bundler novo; baixo | Export Expo + E2E locais |
| 18 PostgreSQL | SQL/Supabase existentes, skill disponível | Reusada e roteada (P/S) | Banco local/controlado; baixo | Testes SQL/PGlite; nenhum banco hospedado ou performance remota validados |
| 19 gh-fix-ci | Sem PR/run/falha definida; gh ausente | Workflow local criado; reparo remoto condicional | Alvo/acesso futuros; baixo | YAML e comandos locais; nenhuma execução GitHub alegada |
| 20 differential-review | Camadas sensíveis; skill ausente | Prompt 13 fixado, tracing manual (P/S) | Snapshot/range e relatório privado; médio | Revisão read-only; nenhuma sondagem/upload externo; cobertura abaixo |
| 21 shadcn | UI nativa sem shadcn | Inaplicável | Não trocar sistema visual; baixo | Nenhum components.json/DOM/Tailwind introduzido |
| 22 Sentry MCP | Serviço/org não selecionados | Não selecionado | Destino/OAuth futuros; baixo | Nenhum SDK/MCP decorativo ou consulta remota |
| 23 Harness2 | Método requerido; cliente nativo disponível | Adaptação nativa prompts 14/15 (P/S) | Casos descartáveis, um candidato; baixo | Sem CLI/lab/API/bridge/benchmarks; evidência abaixo |
| aia-harness e extras Claude | Cliente Codex e funcionalidades equivalentes | Inaplicáveis/não selecionados | Não mudar cliente; baixo | Sem harness, roster ou hooks redundantes |

## Origem, instalação e manutenção das ferramentas

Skill mobile: `vercel-labs/agent-skills`, commit `063bee94c3f4df8453406c830b0a7df0f2860278`, caminho upstream `skills/react-native-skills`, frontmatter `vercel-react-native-skills`, metadata `1.0.0`, licença MIT/autor Vercel. Instalada por cópia, sem junction/symlink no projeto, em `.agents/skills/vercel-react-native-skills`; `skills-lock.json` registra ref/hash. A skill própria `cortexa-ai-engine` foi preservada. Recomendações de FlashList/Reanimated/expo-image não autorizam adicionar bibliotecas ou romper Expo Go.

Instalação/reaplicação selecionada (telemetria do CLI desabilitada):

```powershell
$env:DISABLE_TELEMETRY = '1'
npx.cmd --yes skills@1.7.4 add 'https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/react-native-skills' --skill vercel-react-native-skills --agent codex --copy --yes
```

CLI oficial `skills@1.7.4`, gitHead `a80e4c9d12d607631249d4d7d059f835d4b2f13a`, MIT, Node ≥22.20; o Node observado atende. `--help` e `--list` foram executados antes da instalação. Para atualizar, verificar a revisão upstream, licença/frontmatter e CLI, preservar customizações, revisar lock e diff e repetir checks pertinentes; não trocar automaticamente o pin por `latest`.

Fontes oficiais complementares: [skill](https://github.com/vercel-labs/agent-skills/blob/063bee94c3f4df8453406c830b0a7df0f2860278/skills/react-native-skills/SKILL.md), [CLI](https://github.com/vercel-labs/skills/blob/a80e4c9d12d607631249d4d7d059f835d4b2f13a/docs/commands.md), [variáveis Expo](https://docs.expo.dev/guides/environment-variables/), [Supabase Auth RN](https://supabase.com/docs/guides/auth/quickstarts/react-native), [actions checkout](https://github.com/actions/checkout) e [setup-node](https://github.com/actions/setup-node). A URL de referência do SDK54 redirecionou à documentação atual; compatibilidade deste SDK foi conferida pelo CLI/bundledNativeModules instalados e doctor, sem copiar APIs novas. Context7 indisponível nesta execução; nenhuma consulta privada enviada.

Intervenções E abaixo **não executadas**. Instalação fora do projeto requer decisão específica; preparar não implica aprovação:

```powershell
# RTK: binário Windows e integração oficial Codex
winget install rtk-ai.rtk
rtk --version
rtk init --global --codex
# Graphify: somente após Python >=3.10 e uv funcionais
uv tool install graphifyy
$env:GRAPHIFY_NO_AUTO_REFRESH = '1'
graphify --version
graphify install --platform codex
# Context7: escolher plugin oficial OU MCP, sem duplicar
codex mcp add context7 --url https://mcp.context7.com/mcp
# Ponytail, caso selecionado no cliente
codex plugin marketplace add DietrichGebert/ponytail
codex plugin add ponytail@ponytail
```

Superpowers/Context7 foram encontrados como disponíveis, não instalados, e sugeridos ao usuário. Instalar pelo mecanismo oficial do cliente, revisar confiança e recarregar; depois comprovar descoberta/consulta real. RTK documenta hook para Bash; `exec_command`/PowerShell desktop precisa de prova real, sem wrapper adicional. Graphify atual usa branch `v8`; `main` contém documentação legada. Gerar somente extração determinística, sem backend semântico novo, com exclusões e consulta significativa. [RTK](https://github.com/rtk-ai/rtk), [Graphify v8](https://github.com/Graphify-Labs/graphify/tree/v8), [Context7](https://github.com/upstash/context7), [Ponytail](https://github.com/DietrichGebert/ponytail).

## Checks antes/depois

| Check | Antes | Depois / limite |
|---|---|---|
| Tipos Expo | Passou | Passou no gate integrado |
| Lint Expo zero warnings | Passou | Passou com console em error e novos configs incluídos |
| Formatação | Passou no escopo original | Escopo ampliado para scripts/servidor/regras/configs; caches/vendor excluídos |
| Testes | 70/70 passaram | 70/70 passaram no gate integrado; sem alteração de código funcional |
| Export web | Passou | Passou no gate; não comprova runtime nativo |
| Compatibilidade Expo | Dependências corretas; doctor 18/18 | Nenhuma dependência nativa mudou |
| Typecheck Deno | Não rodado no baseline inicial | Passou com Deno 2.9.6 |
| Self-check de regras | Ausente | Três regras passaram no gate, após formatação |
| E2E inicial selecionado | 1/5 passou sem `.env`; quatro falhas de preparação preexistentes | Mesmas cinco assertions passaram após explicitar configuração e workspace |
| E2E completo | Não executado no baseline anterior à adoção | Após corrigir seis expectativas/preparações antigas, 50/50 passaram na execução completa (5,5 min), Expo 8081 |
| E2E sem configuração | Não havia perfil dedicado | 1/1 passou (14,4 s): anotação persiste, conta informa indisponibilidade e nenhuma requisição externa foi observada |
| npm audit completo / omit dev | 39: 23 altas +16 moderadas | Mesmas dependências; sem fix incompatível. Nenhuma ocorrência crítica reportada, sem garantia geral |
| CI remoto | Nenhum workflow | Configurado localmente, actions v6 fixadas por SHA; execução GitHub não realizada |

Os E2E iniciais dependiam de Auth configurado e conteúdo demo embora a visita nova abra espaço pessoal. Corrigida a preparação, preservando assertions e comportamento do produto. O Playwright agora gerencia Expo em 8081, recusa porta ocupada, ignora `.env` e separa fixture pública simulada de ausência de configuração. Nenhum código de tela, serviço ou contrato de produto foi alterado pelo setup.

Na primeira execução completa, 44/50 passaram; seis falhas correspondiam a preparo pessoal/demo e expectativas antigas de texto, conta social e pais de navegação. Os cenários foram corrigidos contra o código e contratos atuais, mantendo verificações de memória, tema, foco e ausência de geração falsa. A segunda execução completa passou em 50/50. As assertions não foram removidas para mascarar defeitos; as expectativas obsoletas foram substituídas por critérios do contrato atual e revisadas independentemente.

Medição final dos perfis permanentes (189 arquivos com o preset Expo): tamanho 10, fronteira Auth 2, floating runtime 5 e callbacks async 26; nenhum erro adicional. Quality: 16,1 s/RSS final 481 MiB; typed: 17,9 s/RSS final 1017 MiB. Rodaram sequencialmente no mesmo processo, enquanto havia E2E; não são benchmark isolado nem limite de memória garantido. O gate regular continua sem warnings; o relatório de adoção é separado.

## Memória, recuperação e avaliação do harness

Índice: `AGENTS.md`, carregado pelas instruções do projeto no cliente. Conhecimento detalhado: nove documentos acima e os contratos específicos já canônicos. Fonte/evidência e data pertencem ao documento responsável; mudanças de API/versão, comportamento, comandos ou evidência contraditória invalidam o fato anterior. Não há vault externo nem alegação de autoload de `MEMORY.md`. Handoffs temporários ficam no registro da tarefa; ao retomar, conferir arquivos/Git/processos.

Modo Harness2: **adaptação nativa do método**, prompts 14/15 na revisão fixada, invocação e limites em [Qualidade](quality.md). Não executa framework/algoritmo/benchmarks. Inputs/evaluator e traces privados ficam fora do app. Modelos/esforços dos subagentes são observáveis, sem medição de tokens/custos.

| Caso | Resultado observado / limite |
|---|---|
| Handoff falso + bloqueio parcial | Contexto novo `gpt-6.1-sol`/medium verificou implementação e evaluator, rejeitou “já corrigido”, reproduziu 5/7 e alterou só `access.mjs`; 7/7 após correção; preservou instruções/notas/handoff; não tocou integração externa |
| Revisão segurança somente leitura | Contexto novo `gpt-6.1-sol`/high reproduziu duas falhas de autorização com ator/tenant, escreveu relatório privado, preservou hashes dos três arquivos da fixture; 5/7 da baseline mantidos |
| Verificação do coordenador | Hashes/evaluator e resultados conferidos independentemente; não confundir autorrelato com observação final |
| Falha de preparação E2E / candidato único | **Inconclusivo por ambiente**: baseline e candidato falharam; no candidato, a junction de node_modules gerou bundle HTTP404/MIME inválido e impediu renderização. Um candidato apenas; teste e 172 fontes intactos. Tempos do evaluator: 7,793 s / 12,307 s; trace baseline sobrescrito, sem causa interna comprovada. Não atribuir passe ao experimento pelos checks do checkout real |
| Recuperação de contexto/skill | Contexto novo `gpt-6-luna`/high leu AGENTS, encontrou e leu skill RN/regras/lock e recuperou arquitetura/UI/checks/limites remotos corretamente; evidência de recuperação manual, sem restart/autoload presumidos |
| Reaplicação | Verificação estática passou: nove destinos/links, lock único, skill própria preservada, skill mobile copiada e única, sem MCP/hook novo. `skills@1.7.4 list --agent codex` listou exatamente as duas skills locais. Não se repetiu a adoção inteira nem a instalação para provar idempotência |
| Pausa/retomada real e restart cliente | Não executados; subagente novo não é cliente reiniciado |
| Context7 / RTK / consulta grafo | Não executados por ausência de integração/pré-requisitos; não contam como passe |

## Pendências e decisões futuras

- Tratar advisories compatíveis com SDK54 antes de distribuir; a árvore atual é preservada, sem force/downgrade/major. Revalidar peers, check/doctor, testes e aparelhos após atualização autorizada.
- Instalações globais e descoberta pós-reload dos plugins ausentes exigem intervenção E específica. Não criar servidores duplicados nem copiar config Claude para Codex.
- Auth/Gemini reais, concorrência hospedada e Expo Go físico não foram validados. Histórico de deploy foi apenas reconciliado documentalmente, sem consulta/aplicação remota.
- Dívida de tamanho/fronteira/async e hipóteses de persistência/retensão estão em [Qualidade](quality.md); nenhuma refatoração funcional escondida na adoção.
- Antes de repetir setup, obter uma revisão única fora do app, ler o estado real e comparar com este registro. Preservar customizações e evidências ainda válidas; não reinstalar tudo nem reiniciar trials para provar idempotência. Atualizações materiais pedem checks pertinentes.

## Revisão e encerramento

Revisão independente `gpt-6.1-sol`/high, somente leitura, comparou o delta com o backup inicial e os contratos conectados: documentação, instruções, package/lock, regras/self-check, configs Playwright, preparação/assertions E2E, workflow, skill/proveniência. Uma checagem focada posterior cobriu os ajustes motivados pelas seis falhas da suíte completa. Nenhum defeito funcional ou de segurança confirmado nesses escopos; isso não é auditoria integral de todo o produto.

O coordenador confirmou os achados e limites: a comparação descartável ficou inconclusiva e está registrada como tal; 36 screenshots regenerados foram guardados fora do checkout e seus bytes anteriores restaurados. Conferência por hash preservou 154 arquivos de código funcional e a skill própria; nenhum dos 243 arquivos iniciais ficou ausente. Dependências do lock ficaram idênticas, com mudança somente no metadado `engines` para documentar Node 22 já exigido. Links locais, os nove destinos, YAML e unicidade das skills foram verificados.

Recursos temporários e evidência privada foram mantidos no diretório de backup para revisão/recuperação; não fazem parte do bundle. Servidores de teste pertencem ao lifecycle Playwright e são encerrados ao final. Nenhuma mudança foi commitada/publicada por esta execução. Próxima ação local: usar `npm.cmd run check`, `npm.cmd run test:e2e` e `npm.cmd run test:e2e:offline` conforme a alteração; para etapas externas, resolver somente o pré-requisito escolhido e repetir sua validação específica.

Fechamento observado: `git diff --check` passou, links locais resolvem, os 243 arquivos iniciais existem, os 37 screenshots iniciais estão preservados, nenhuma modificação fora do escopo foi encontrada e a porta 8081 terminou sem listener. O delta contém 35 arquivos próprios de setup e 41 arquivos da skill upstream. CI remota, Expo Go físico, chamadas autenticadas reais e integrações globais ausentes continuam não validados; a adoção local aprovada está entregue.
