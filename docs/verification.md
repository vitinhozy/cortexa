# Validação — fundação pessoal e refinamento visual

> Registro histórico do incremento anterior. A validação da evolução longitudinal de 18/10/2026 está em [Evolução longitudinal — implementação](learning-implementation.md#validação), incluindo o estado atual dos testes, migrações, ícone e adapters.

Executada em 17 de outubro de 2026, Windows, Node.js 22.23.3, Expo SDK 54.

## Histórias verificadas

Demonstração preservada: estudo → questão → erro → flashcard → revisão → progresso persistido.

Espaço pessoal: troca de espaço → onboarding → edição de perfil → biblioteca/pastas → anotação por disciplina → favoritos e organização → prova → planejamento → estudo. Recarregar e alternar entre os espaços não deve misturar os dados.

Refinamento visual: introdução → formulário, abas → busca → conteúdo escolhido, biblioteca → painel de filtros, perfil → preferências → recarga, conta → aviso de login social e Plus → seleção de período → retorno ao acesso gratuito. Nenhum desses fluxos deve simular autenticação, assinatura, push ou IA reais.

| Verificação                                        | Resultado                                   |
| -------------------------------------------------- | ------------------------------------------- |
| TypeScript estrito — `npm run typecheck`           | Passou                                      |
| Lint — `npm run lint`                              | Passou, sem avisos                          |
| Lógica/serviços — `npm test`                       | 26 testes passaram                          |
| Interface — `npm run test:e2e`                     | 18 testes passaram no Chromium, 3,4 minutos |
| Formatação — `npm run format:check`                | Passou                                      |
| `npx expo install --check`                         | Dependencies are up to date                 |
| `npx expo-doctor`                                  | 18/18 verificações passaram                 |
| `npx expo export --platform all --output-dir dist` | Bundles web, Android e iOS gerados          |
| Expo na porta 8081                                 | Servindo o app e os testes de interface     |
| Supabase Auth remoto                               | Não validado: conector não retornou projeto |
| Banco, RLS e Storage remotos                       | Ainda não implementados/aplicados           |
| Expo Go físico / emuladores nativos                | Não executado neste ambiente                |

## Cobertura

Os 26 testes de lógica verificam as regras de estudo já existentes e os novos limites: espaço pessoal vazio, isolamento entre demonstração/local/duas contas, recusa de snapshot de outro proprietário, preservação de armazenamento corrompido, validação atômica de perfil e provas, notas ligadas à disciplina, pastas/favoritos sem perda de conteúdo, rejeição de IA simulada em modo pessoal, vencimento exato de revisões, recomposição de métricas semanais e configuração pública opcional de autenticação. As novas regras de busca verificam isolamento por espaço, categorias, acentos e texto vazio; os dias de atividade exigem registros reais, sem preencher a semana a partir de um contador.

Os nove cenários Playwright cobrem navegação e prática existentes, onboarding e edição do perfil, persistência e troca de espaço, pasta → anotação → favorito → movimentação → busca → renomeação → recarga, prova → home → plano → estudo, estados vazios e autenticação não configurada. Os testes visitam rotas reais, interagem com controles e verificam os dados depois de recarregar.

Outros seis cenários cobrem avanço/retorno da introdução; busca abrindo assunto, questão e flashcard específicos; ausência de resultados e limpeza; login social sem sessão falsa; Escape com restauração de foco; fechamento do painel por arrasto e fundo; preferências após recarga; redução de movimento sem escala ao pressionar; Plus sem checkout habilitado; novas telas sem erros ou overflow. Os filtros da biblioteca agora são exercitados dentro do painel inferior.

A verificação de responsividade cobre 360, 390, 768 e 1440 px; os testes de rotas capturam erros de página/console e overflow horizontal. A home foi inspecionada visualmente em capturas de celular e desktop. As capturas registram a área visível do ScrollView, não todo seu conteúdo interno:

Os quatro testes adicionais do estúdio cobrem preservação do texto e da nota de origem, persistência, edição/exclusão, busca isolada por espaço, limites de entrada, rejeição de formatos incompatíveis, cartões e questões ligados à prática e proteção contra snapshots malformados. Três cenários adicionais de interface verificam transcrição → mapa → slides, zoom, edição e exclusão com confirmação, questões/cartões manuais persistidos e o novo layout com barra lateral, cápsulas e menu central. O retorno do editor usa a tela de documento existente, sem empilhar cópias.

- [Demonstração mobile](screenshots/home-mobile.png)
- [Demonstração desktop](screenshots/home-desktop.png)
- [Pessoal mobile](screenshots/personal-360.png)
- [Pessoal tablet](screenshots/personal-768.png)
- [Pessoal desktop](screenshots/personal-1440.png)
- [Onboarding no celular](screenshots/refinement-onboarding-360.png)
- [Conta e acesso no celular](screenshots/refinement-account-360.png)
- [Busca no celular](screenshots/refinement-search-360.png)
- [Prévia do Plus no celular](screenshots/refinement-membership-360.png)
- [Painel de lembretes](screenshots/refinement-reminders.png)
- [Nova home pastel no desktop](screenshots/pastel-home-desktop.png)
- [Nova home pastel no celular](screenshots/pastel-home-360.png)
- [Menu de criação central](screenshots/pastel-create-desktop.png)
- [Mapa mental no celular](screenshots/pastel-mindmap-mobile.png)
- [Mapa mental no desktop](screenshots/pastel-mindmap-desktop.png)
- [Chat com campo fixo no desktop](screenshots/pastel-chat-desktop.png)

As capturas estáticas usam redução de movimento para não registrar quadros intermediários. Os testes de interação exercitam animações normais e a preferência de acessibilidade separadamente.

## Correções encontradas durante a validação

- O Metro que estava aberto durante a instalação reteve a resolução antiga de dependências. Reiniciado com cache limpo, passou a resolver os novos pacotes.
- O retorno do onboarding criava outra instância das abas. `dismissTo` agora retorna à tela existente.
- A seleção de pastas precisava de semântica de botão alternável no navegador. `Choice` mantém seleção nativa e informa `aria-pressed` na web.
- A barra lateral usava largura mínima e fundo ativo padrão do navegador de abas. Foram alinhados à largura e cores do produto.
- A inspeção visual encontrou perda de fundo e espaçamento em botões animados no navegador: a função de estilo do Pressable estava sendo envolvida diretamente por Animated. O componente agora passa uma lista de estilos estática com valores animados e estado de pressão explícito.
- O teste de arrasto iniciava antes de o painel terminar de entrar. Ele agora aguarda a estabilidade do cabeçalho, como o usuário faria antes de segurá-lo. O gesto fecha o painel sem disputar a rolagem do conteúdo.
- A busca abria a primeira questão/card do assunto. Agora leva ao item selecionado; consultar um card ainda não vencido não o reagenda até uma avaliação explícita.

## Limites da evidência

Exportar bundles valida compilação e resolução de módulos; não comprova interação no Expo Go físico. O teste de contas usa repositórios locais com proprietários diferentes: não substitui testes de autenticação ou autorização no servidor. O fluxo real de confirmação de e-mail, login, refresh, expiração e logout precisa ser validado quando houver projeto configurado, seguindo `architecture.md`.

Transições e gestos nativos de retorno, blur e feedback háptico ainda precisam de inspeção em iPhone/Android físicos. O Mobile Preview executa a versão web: mostra entrada suave, resposta ao toque e painéis animados, mas não reproduz o Taptic Engine nem toda a transição interativa do iOS. `expo-haptics` e `expo-blur` foram instalados nas versões compatíveis com SDK 54, com checagem de dependências e Expo Doctor antes e depois da instalação.

Não há IA, RAG, uploads ou transcrição reais. As interfaces pessoais não afirmam que esses serviços estão conectados. Não foram criados usuários, tabelas, buckets ou políticas em ambiente remoto.

A instalação manteve os 39 avisos de auditoria já existentes na árvore Expo/Metro (16 moderados, 23 altos). Nenhum `npm audit fix --force` foi aplicado. Este registro não declara essas vulnerabilidades resolvidas. A evolução do SDK e a auditoria precisam ser reavaliadas antes de distribuição.

O ambiente de terminal pode emitir aviso sobre `NO_COLOR`/`FORCE_COLOR`; não é um erro do console do app.
