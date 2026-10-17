# Validação da primeira entrega

Validado em 16 de outubro de 2026 no Windows, Node.js 22.23.3, com Expo SDK 54. Usuário, materiais e casos são fictícios.

## História verificada

O estudante inicia um estudo, responde uma questão, recebe explicações, transforma o erro em flashcard e vê seu progresso atualizado e preservado ao reabrir o aplicativo.

| Verificação | Resultado | Evidência |
| --- | --- | --- |
| `npm install` | Passou | Instalação inicial e segunda instalação concluídas; lockfile presente |
| `npm run typecheck` | Passou | TypeScript estrito, sem erros |
| `npm test` | Passou | 9 testes de domínio/serviços |
| `npm run test:e2e` | Passou | 5 testes Playwright, Chromium, 25,6 s na execução final |
| `npm run format:check` | Passou | Todos os arquivos verificados estão formatados |
| `npx expo install --check` | Passou | `Dependencies are up to date` |
| `npx expo-doctor` | Passou | 18/18 verificações |
| `npx expo start --web --port 8081` | Passou | Metro iniciou, bundle servido e interfaces interativas acessadas |
| Exportação web, iOS e Android | Passou | `npx expo export --platform all --output-dir dist` gerou os três bundles |
| Console do navegador | Passou nos cenários cobertos | Nenhum `console.error` ou erro de página capturado no teste de rotas |
| Responsividade | Passou nos tamanhos cobertos | 390 × 844 e 1440 × 1050, sem overflow horizontal do documento |
| iPhone físico / Android Emulator | Não executado | Não havia aparelho/emulador conectado à validação |

A exportação dos bundles nativos verifica imports, resolução de dependências e compilação JavaScript/Hermes. Não substitui instalação e interação em um aparelho físico.

## Cobertura de comportamento

### Domínio e serviços — 9 testes

1. Ácido-base e potássio aparecem antes dos assuntos de alto domínio.
2. As quatro faixas de domínio respeitam os limites especificados.
3. Orçamentos de 5, 30, 60, 120, 180 e 480 minutos são respeitados em cada dia do plano.
4. Revisões ajustam intervalo e data de retorno.
5. Resposta errada atualiza perfil, métrica e erro apenas uma vez por tentativa.
6. Resposta correta atualiza acertos sem criar um erro.
7. Flashcards de questões são deduplicados e persistem com suas revisões.
8. JSON local inválido recupera os exemplos e sinaliza falha de armazenamento.
9. Conversas preservam o material e marcam fontes simuladas.

### Navegador — 5 testes

1. Navegação real pelas cinco abas e conclusão de uma questão correta com resultado 1/1.
2. Resposta errada → alternativa correta e explicações → criação de flashcard → caderno com novo erro → domínio 42% → 38% → recarga preserva 38% → revisão de flashcard.
3. Criação de anotação → tela do material → conversa contextual → resposta simulada → troca de modo → aula guiada com resposta errada e recuperação didática → conclusão.
4. Validação de orçamento inválido → plano de véspera de 30 minutos → início do primeiro assunto.
5. Visita às principais rotas, captura de erros de console e screenshots mobile/desktop.

## Inspeção visual

- [Início em viewport mobile](screenshots/home-mobile.png)
- [Início em viewport desktop](screenshots/home-desktop.png)

As capturas mostram a área visível; o conteúdo abaixo permanece acessível pelo scroll nativo. Cores, hierarquia, quebra de texto e barra inferior foram inspecionadas. Ícones decorativos foram retirados da semântica principal e botões/abas receberam nomes acessíveis. Campos, seleção de alternativas, alternância de preferências e progresso têm propriedades de acessibilidade.

## Observações do ambiente

Node e Git não estavam no PATH inicial. Foram instaladas distribuições portáteis em `%LOCALAPPDATA%\CortexaTools`, e o PATH do usuário foi atualizado. O auxiliar `scripts/start.ps1` permite executar em terminais que ainda herdaram o PATH antigo.

Uma execução do Expo Doctor não encontrou Git no PATH da sessão e reportou `.expo` como não ignorado. A pasta já estava no `.gitignore`; com Git disponível, `git check-ignore .expo` confirmou a regra e o Doctor passou nas 18 verificações.

O terminal de testes pode emitir um aviso do Node sobre `NO_COLOR` e `FORCE_COLOR` definidos pelo ambiente. É um conflito de configuração de cores do terminal, sem erro de aplicação ou console do navegador.

## Auditoria de dependências

`npm audit` sinalizou **39 ocorrências: 16 moderadas e 23 altas**, contabilizando também pacotes que dependem de bibliotecas afetadas. `npm audit fix` foi executado; nenhuma atualização de major foi forçada.

Os pacotes de origem dos avisos incluem `braces`, `decode-uri-component`, `image-size`, `node-forge`, `postcss`, `sprintf-js` e `uuid`, trazidos pela árvore Expo/Metro/React Native. Parte das recomendações automáticas implica mudança incompatível de SDK; alguns pacotes também não tinham versão corrigida disponível na linha consultada. O app não implementa upload nem processa arquivos remotos nesta etapa, mas isso não equivale a uma auditoria de segurança completa.

Antes de distribuir ou integrar dados reais: reavaliar a versão do Expo, aplicar atualizações compatíveis, repetir a auditoria e executar validação em dispositivos. Este registro não declara que as vulnerabilidades foram corrigidas.
