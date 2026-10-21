# Qualidade, revisão e harness

Verificado em 21/10/2026; fontes e resultados da adoção em [Setup](setup.md). Node 22, npm, TypeScript estrito, ESLint Expo, Prettier, `node:test` via tsx e Playwright são os recursos canônicos. Não há Git hooks, bloqueios de push ou exigência de branch.

## Comandos e o que comprovam

No PowerShell, use `npm.cmd`/`npx.cmd`; os wrappers `.ps1` estão bloqueados neste ambiente. Não altere a política da máquina.

| Comando | Evidência / limite |
|---|---|
| `npm run check` | Tipos Expo → lint zero warnings → formatação → testes → self-check de regras → export web. Não publica, migra ou chama o provider real |
| `npm run typecheck:server` | Entry point Deno da Edge Function; separado do programa Expo; versão Deno fixada no script |
| `npm run test:e2e` | Expo próprio em 8081, Chromium, um worker, configuração pública SIMULADA. Verifica formulários e fluxos locais, sem autenticação remota |
| `npm run test:e2e:offline` | Expo próprio em 8081, sem configuração Supabase; persistência local e indisponibilidade explícita da conta |
| `npm run lint:rules` | RuleTester das três regras locais; não comprova que todas estão ativas no aplicativo |
| `npm run quality:report` | Diagnóstico de tamanho/fronteiras e duas regras typed; warnings medem adoção e não substituem `npm run lint --max-warnings=0` |
| `npx expo install --check` / `npx expo-doctor` | Compatibilidade do conjunto Expo. Obrigatórios antes de trocar dependência nativa |
| `npm audit` / `npm audit --omit=dev` | Advisories da árvore instalada; avaliar alcance e fixes compatíveis. Não usar `--force` para passar |

Depois de alteração comportamental, execute tipos, testes e os E2E relevantes na porta 8081 conforme [AGENTS](../AGENTS.md). Rode a suíte completa ao mudar preparação global dos testes. Mudanças na Edge Function incluem o check Deno e testes de fronteira. Bundles/E2E web não comprovam Expo Go físico, APIs nativas, Auth remoto ou Gemini real.

O Playwright recusa uma porta 8081 já ocupada (`reuseExistingServer: false`). Encerre o servidor que você iniciou ou aguarde seu dono; não mate processos desconhecidos. A configuração define `EXPO_NO_DOTENV=1` e substitui as três variáveis públicas de Auth. O domínio `cortexa-e2e.invalid` e a chave com marcador `simulated` são fixtures públicas, sem serviço/credencial. O perfil offline deixa URL/chave vazias. Não usar esse perfil para afirmar sucesso de login, recuperação por e-mail ou análise remota.

Os testes que usam o catálogo demonstrativo escolhem `demonstrationStorage` explicitamente. Outros testes continuam iniciando o espaço pessoal limpo e verificando isolamento. Os testes existentes de conta/retorno/análise mantêm suas assertions; configuração simulada permite exercitar os formulários sem depender de `.env.local`. Screenshots de alguns testes são artefatos em `docs/screenshots/`; ao rodar localmente, revise-os antes de incluir no diff.

## Regras e adoção medida

Preservados `eslint-config-expo/flat`, `no-explicit-any: error`, TypeScript estrito e o gate zero warnings. Os módulos em `eslint-rules/` e `scripts/verify-quality-rules.mjs` vieram da revisão `790a895304e0c08b70a5b215c9d334f1c86b816c` do toolkit; receberam formatação Prettier e ajuste dos comentários de uso/origem do self-check. O aviso MIT original está em `eslint-rules/LICENSE`. O self-check continua independente de Next/Drizzle. São tooling Node, sem import para o bundle.

`quality/no-direct-console` não encontrou violações no escopo TS/TSX adotado e entra como `error`. O servidor mantém a telemetria existente, sem instalar logger novo. As outras regras estão em perfis diagnósticos separados; nenhuma proteção existente teve severidade reduzida.

| Perfil / regra | Medição inicial | Decisão e próxima ação |
|---|---:|---|
| `quality/max-lines`, referência 350 | 10 módulos runtime | Extrair responsabilidades quando forem alteradas; testes, mocks, tipos e barrels seguem a semântica de isenção da regra. Não refatorar dez módulos como efeito colateral |
| `quality/no-direct-data-access` | 2 imports de Auth em `app/account.tsx` e `hooks/useAuth.tsx` | Julgar a fronteira de autenticação antes de tornar gate; a regra compara imports literais e não resolve todos os aliases/reexports |
| `no-floating-promises` | 5 runtime | Investigar rejeição/cleanup em `useAuth` (4) e `useStudy` (1); não adicionar `void` mecanicamente |
| `no-misused-promises` | 26 callbacks runtime | Tratar erros nos callbacks e preservar feedback/loading antes de elevar severidade |

Uma medição exploratória em 177 arquivos também encontrou 70 registros `node:test` como floating promises; são controlados pelo runner e ficam fora do perfil typed de runtime. A medição isolada de regras quality levou 3,2 s, RSS final 374 MiB/maxRSS 382 MiB; typed levou 13,3 s, RSS/maxRSS 809 MiB, depois de quality **no mesmo processo**. São observações locais de uma execução, sem comparação de economia ou garantia de custo em CI. O perfil permanente usa as configurações Expo herdadas, e a medição final está em [Setup](setup.md).

Os dez módulos grandes são biblioteca, regras de prática, preparação de prática, primitivas UI, conta, sidebar, chat, serviço de prática, execução de prática e ProfileForm. Detalhes de responsabilidade pertencem à arquitetura/código. Não elevar teto, ignorar diretórios de runtime ou apagar testes para obter passe. Regras novas limpas podem virar `error`; dívida precisa cair e ser medida antes de ativação no gate zero warnings.

## Estratégia e limites de dados

- `npm test` cobre regras pedagógicas, validação, fonte adulterada, isolamento entre contas, cache, quota, leases, falhas/cancelamento e reidratação com transportes controlados.
- PGlite executa o SQL versionado em memória. Isso não comprova concorrência entre instâncias, políticas/configuração do projeto hospedado ou performance real do PostgreSQL.
- Entradas, schema e semântica precisam de validação; material é dado não confiável. [Motor de IA](ai-engine.md) e a skill do domínio orientam mudanças nessa camada.
- Persistência, snapshots e logs não recebem secrets ou dados de pacientes. Telemetria do provider não deve inventar tokens ausentes.
- Falha de armazenamento ao trocar espaço precisa de reprodução: `useStudy` aguarda `flush`, mas ignora seu retorno booleano. É uma hipótese de perda após falha, ainda não corrigida nem reproduzida neste setup. Excluir material local também não remove automaticamente versões remotas; política de retenção permanece pendente no motor de IA.

## Revisão de segurança reutilizável

Fonte e invocação: [Prompt 13, revisão fixada](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/790a895304e0c08b70a5b215c9d334f1c86b816c/docs/prompts/13-security-review.md). Em nova tarefa: “Execute somente o bloco Prompt dessa revisão para uma baseline do repositório ou para o delta exato indicado; relatório privado fora do checkout, somente leitura”. A cópia integral do toolkit não pertence ao app.

Informe base/head e camadas staged, unstaged e untracked, ou snapshot inicial/final com hashes. Revise o diff e siga entradas → validação/autorização → operação sensível, incluindo chamadores/contratos/testes. Cada achado precisa de severidade, localização, ator, condição, reprodução, impacto, confiança e cobertura/limites. Separe hipótese de exploração confirmada; não publique detalhes ou faça probes externos. Instalação de skill não autoriza upload de código ou correção automática. `differential-review` está ausente; tracing manual é o fallback explícito.

Na adoção atual, a comparação é contra o snapshot anterior ao setup, **não** apenas contra HEAD: o checkout já tinha muitas mudanças e arquivos novos. A revisão independente deve se limitar ao delta do setup e aos contratos conectados. Encerrar quando achados relevantes tiverem disposição verificável e checks afetados passarem; mais rodadas precisam de evidência/risco ou pedido.

## Adaptação nativa do método Harness2

Modo adotado: método nativo inspirado em Harness2, sem executar o framework, seu algoritmo ou benchmarks. Preserva cliente, modelo principal, autenticação e permissões; não instala CLI/lab/bridge/API ou orquestrador.

Fontes e invocação reutilizável: [Prompt 14 — avaliação](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/790a895304e0c08b70a5b215c9d334f1c86b816c/docs/prompts/14-harness-evaluation.md), [Prompt 15 — melhoria](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/790a895304e0c08b70a5b215c9d334f1c86b816c/docs/prompts/15-harness-improvement.md) e [guia 07](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/790a895304e0c08b70a5b215c9d334f1c86b816c/docs/07-harness-evaluation.md), todos na mesma revisão. Pedido futuro: “Execute o bloco Prompt 15 no modo nativo, reutilizando o estado e a evidência atuais; só abra uma comparação se houver falha observada”.

Procedimento:

1. Definir uma falha real, tarefa, inputs, arquivos graváveis, recursos, critério independente e condição de parada. Sem falha, manter o procedimento e rodar apenas smoke cases pertinentes.
2. Usar cópias descartáveis fora do app/toolkit, sem secrets, dados pessoais ou caches privados. Manter inputs originais e evaluator fora do escopo gravável; registrar hashes e baseline.
3. Comparar **um candidato** mínimo com os mesmos inputs, evaluator, modelo/esforço e limites. Não alterar teste, permissão, gate ou provider para melhorar nota. Registrar ações observadas separadas do autorrelato.
4. Adotar somente o diff sustentado pela evidência e dentro do escopo aprovado; repetir checks pertinentes no app. Não reiniciar tentativas, trials ou chamadas pagas automaticamente.

Smoke cases desta adoção: handoff falso + bloqueio externo parcial em fixture de autorização; revisão de segurança somente leitura em outra cópia; recuperação de instruções/skill em contexto limpo; reaplicação estática sem duplicação. Resultados finais e comparação do ambiente E2E ficam em [Setup](setup.md). O evaluator original tem sete checks; a fixture defeituosa deve passar cinco e falhar dois antes da correção. Uma fixture quebrada não é, por si só, falha do agente.

Para cada caso, registre cliente/versão, modelo/esforço observável, data, hash dos inputs/evaluator, comandos, resultado, arquivos alterados, tempo quando medido e limitações. Subagente com contexto novo não prova restart do cliente. Pausa/retomada real, Context7, RTK e Graphify só recebem passe após execução observável. Instalação, descoberta, checks do app e comportamento do agente são evidências distintas.

## CI e distribuição

[Workflow](../.github/workflows/verify.yml) usa Node 22, permissões de leitura, actions oficiais fixadas por SHA e os mesmos comandos locais, incluindo check Deno e E2E na 8081. Não há secrets, deploy, migração ou branch protection. O arquivo foi configurado localmente; execução no GitHub depende de uma publicação autorizada futura e não é presumida.

A auditoria atual registra 39 ocorrências (23 altas, 16 moderadas) tanto na árvore completa quanto com `--omit=dev`. Vários caminhos passam por Expo/Metro; a classificação npm de produção não prova que cada caminho chega ao bundle do aparelho. Não foi feito estudo de alcançabilidade de todos os advisories. Os fixes automáticos sugerem mudanças incompatíveis; não foram aplicados. Antes de distribuir, avaliar correções suportadas por SDK, validar Expo Go físico e concluir as validações remotas selecionadas.
