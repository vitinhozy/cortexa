# Cortexa — documento de transferência da implementação

Este documento registra o estado de trabalho da experiência pública do Cortexa para ser enviado a outro chat/agente. O objetivo é preservar as mudanças feitas desde o pedido de redesenho da landing page e evitar um rollback além do ponto desejado.

## Regra principal para o próximo agente

Não faça `git reset --hard`, `git checkout --`, limpeza de arquivos ou rollback geral.

O repositório está no commit-base `48cb945` (`feat: prepare Cortexa for real user testing`) e as alterações abaixo estão no working tree, ainda não commitadas. Trate os arquivos listados como trabalho intencional do usuário. Antes de alterar qualquer um deles, faça uma cópia ou gere um patch local.

Se o usuário pedir restauração, confirme primeiro se ele quer:

1. preservar a implementação pública abaixo; ou
2. voltar ao commit-base `48cb945`.

As anotações da conversa não são um snapshot do código e não permitem reconstruir automaticamente um estado intermediário chamado “Anotação 2”.

## Resultado visual implementado

- A rota `/` é uma landing pública separada da aplicação autenticada.
- O seletor de tema foi removido da landing; a preferência visual já existente continua sendo respeitada pelo app.
- O cartão branco flutuante “Seu conhecimento / em construção” foi removido do hero.
- A sobreposição dos títulos e descrições dos capítulos foi corrigida. React Native usa `lineHeight` em pixels; os valores não devem ser escritos como multiplicadores CSS.
- Cada capítulo mantém texto e demonstração juntos no fluxo. Desktop usa duas colunas; mobile empilha os elementos.
- Os cards acompanham a rolagem com `opacity`, `translateY`, `scale` e rotação suave. O layout não é animado por `top`, `height`, `margin` ou `padding`.
- O fio orgânico de fundo usa duas linhas finas, uma vermelha e uma azul, com progresso de visibilidade ligado a uma única fonte de scroll.
- Elementos anatômicos conceituais aparecem de forma pontual: cérebro e neurônio.
- A tela de conta usa uma composição de mão iluminada com a marca original do Cortexa flutuando acima da palma, com órbitas discretas e movimento lento.
- A composição da mão é uma cena animada em React Native, não um arquivo de vídeo. Não foi adicionada dependência de player, WebGL ou biblioteca nativa.
- Movimento reduzido mantém a informação disponível e desliga os deslocamentos principais.
- Os previews continuam marcados como demonstração visual com dados fictícios.
- O acesso real continua dependente da configuração de autenticação do ambiente; sem credenciais/configuração, a tela informa que o acesso está indisponível.

## Arquivos da experiência pública

Arquivos novos ou alterados diretamente para a experiência pública:

- `app/index.tsx` — landing pública, hero, narrativa, navegação e CTAs.
- `app/_layout.tsx` — roteamento público/protegido.
- `app/account.tsx` — fluxo público de login/cadastro/recuperação.
- `app/onboarding.tsx` — entrada autenticada do onboarding.
- `app/(tabs)/_layout.tsx` — ajustes da navegação interna.
- `app/(tabs)/index.tsx` — entrada antiga removida para evitar duplicidade com `/`.
- `components/ProtectedRoute.tsx` — proteção de rotas internas.
- `components/public/AuthLayout.tsx` — composição da tela de conta.
- `components/public/BrandSculpture.tsx` — mão, logo, halos e órbitas animadas.
- `components/public/NeuralPath.tsx` — fios orgânicos vermelho/azul ligados ao scroll.
- `components/public/ProductDemo.tsx` — preview visual do produto.
- `components/public/StoryChapter.tsx` — capítulo com texto, preview e anatomia decorativa.
- `constants/publicExperience.ts` — textos, ícones e ordem da narrativa.
- `services/authAccess.ts` — validação de destinos de retorno após autenticação.

Assets novos:

- `assets/cortexa-brain.png` — cérebro conceitual decorativo.
- `assets/cortexa-hand.png` — mão transparente com iluminação azul/coral.
- `assets/cortexa-neuron.png` — neurônio conceitual transparente.
- `assets/cortexa-mark.png` — marca original preservada e reutilizada.

## Segurança de fluxo

- A landing não abre diretamente o dashboard.
- O CTA principal leva para `/account`.
- Rotas internas exigem sessão validada.
- Destinos de retorno são sanitizados para impedir redirecionamento externo.
- Não foram adicionados secrets, credenciais, providers reais ou dados reais ao bundle.
- A execução offline e sem Supabase continua suportada.

## Testes executados neste estado

- `npm run typecheck`
- `npm test` — 79 testes aprovados
- `npx playwright test tests/e2e/public-entry.spec.ts` — 41 testes aprovados
- `npm run lint`
- `npm run export:web`
- Prettier nos arquivos alterados da experiência pública

O servidor local para inspeção é:

`http://localhost:8081`

## Como outro chat deve continuar

Leia primeiro `AGENTS.md`, este documento e os arquivos listados. Preserve autenticação, Supabase, Expo Router, Expo Go, TypeScript estrito e o modo offline.

Antes de uma nova alteração visual:

1. abra `/` em `http://localhost:8081`;
2. confira desktop, 390 px e 768 px;
3. percorra os cinco capítulos;
4. confira `prefers-reduced-motion`;
5. confira `/account` e a cena da mão;
6. só então edite o menor conjunto de arquivos necessário.

Não descreva a cena como vídeo real: o estado atual usa animação nativa sobre imagens transparentes. Um vídeo futuro deve ser otimizado e integrado apenas com autorização explícita.

## Inventário do working tree no momento do registro

Além dos arquivos públicos acima, existem alterações de documentação, testes E2E e screenshots históricas no working tree. Elas devem ser preservadas até o usuário decidir quais alterações deseja manter:

- `PRODUCT.md`
- `docs/architecture.md`
- `docs/design.md`
- `docs/screenshots/*`
- `tests/auth-access.test.ts`
- `tests/e2e/fixtures.ts`
- `tests/e2e/public-entry.spec.ts`
- arquivos E2E existentes alterados para refletir a separação entre landing pública e área autenticada

Este inventário é deliberadamente explícito: não use a ausência de commit como indicação de que essas alterações podem ser descartadas.

## Relação completa dos arquivos modificados

Esta é a relação completa que deve ser conferida no painel de alterações. Arquivos marcados como `M` foram editados, `D` foram removidos e arquivos sem estado no commit-base foram criados durante a implementação.

### Aplicação e autenticação

- `app/index.tsx` — nova landing pública; hero, CTAs, scroll, capítulos, fios e previews.
- `app/_layout.tsx` — separação entre entrada pública e rotas protegidas.
- `app/account.tsx` — fluxo de login/cadastro/recuperação com estados de indisponibilidade.
- `app/onboarding.tsx` — onboarding condicionado a sessão.
- `app/(tabs)/_layout.tsx` — ajuste do layout interno.
- `app/(tabs)/index.tsx` — removido; a landing pública passou a ocupar a rota raiz.
- `components/ProtectedRoute.tsx` — novo guard de autenticação.
- `services/authAccess.ts` — novo saneamento do parâmetro de retorno.

### Componentes públicos

- `components/public/AuthLayout.tsx` — layout da tela de conta e coluna visual.
- `components/public/BrandSculpture.tsx` — cena animada da mão, marca original, luzes e órbitas.
- `components/public/NeuralPath.tsx` — fios orgânicos vermelho/azul ligados ao scroll.
- `components/public/ProductDemo.tsx` — janela de demonstração visual do produto.
- `components/public/StoryChapter.tsx` — novo componente de capítulo com texto, card e anatomia.

### Conteúdo e documentação

- `constants/publicExperience.ts` — cinco capítulos e textos da narrativa.
- `PRODUCT.md` — atualização da descrição de acesso e experiência pública.
- `docs/architecture.md` — fronteiras entre landing, autenticação e aplicação.
- `docs/design.md` — tokens, comportamento visual, scroll, acessibilidade e movimento reduzido.
- `docs/screenshots/account-signup-feedback-360.png`
- `docs/screenshots/home-desktop.png`
- `docs/screenshots/home-mobile.png`
- `docs/screenshots/learning-knowledge-desktop.png`
- `docs/screenshots/learning-knowledge-mobile.png`
- `docs/screenshots/learning-overview-desktop.png`
- `docs/screenshots/learning-overview-mobile.png`
- `docs/screenshots/longitudinal-1440.png`
- `docs/screenshots/longitudinal-360.png`
- `docs/screenshots/longitudinal-768.png`
- `docs/screenshots/pastel-create-desktop.png`
- `docs/screenshots/pastel-home-360.png`
- `docs/screenshots/pastel-home-768.png`
- `docs/screenshots/pastel-home-desktop.png`
- `docs/screenshots/pastel-mindmap-desktop.png`
- `docs/screenshots/pastel-mindmap-mobile.png`
- `docs/screenshots/personal-1440.png`
- `docs/screenshots/personal-360.png`
- `docs/screenshots/practice-config-ipad.png`
- `docs/screenshots/practice-preparation-1376.png`
- `docs/screenshots/practice-preparation-360.png`
- `docs/screenshots/practice-preparation-768.png`
- `docs/screenshots/practice-reading-1376.png`
- `docs/screenshots/practice-reading-360.png`
- `docs/screenshots/practice-reading-768.png`
- `docs/screenshots/refinement-account-360.png`
- `docs/screenshots/refinement-account-768.png`
- `docs/screenshots/refinement-membership-360.png`
- `docs/screenshots/refinement-membership-768.png`
- `docs/screenshots/refinement-onboarding-360.png`
- `docs/screenshots/refinement-onboarding-768.png`
- `docs/screenshots/refinement-reminders.png`
- `docs/screenshots/refinement-search-360.png`
- `docs/screenshots/refinement-search-768.png`

### Testes

- `tests/auth-access.test.ts` — testes dos destinos autenticados.
- `tests/e2e/fixtures.ts` — fixtures públicas e de sessão simulada.
- `tests/e2e/public-entry.spec.ts` — landing, responsividade, capítulos, movimento reduzido e proteção de rotas.
- `tests/e2e/academic-journey.spec.ts`
- `tests/e2e/account.spec.ts`
- `tests/e2e/learning-overview.spec.ts`
- `tests/e2e/library-folders.spec.ts`
- `tests/e2e/material-analysis.spec.ts`
- `tests/e2e/offline.spec.ts`
- `tests/e2e/pastel-studio.spec.ts`
- `tests/e2e/practice.spec.ts`
- `tests/e2e/refinement.spec.ts`
- `tests/e2e/study.spec.ts`
- `tests/e2e/workspace-helpers.ts`
- `tests/e2e/workspace.spec.ts`

### Assets

- `assets/cortexa-brain.png`
- `assets/cortexa-hand.png`
- `assets/cortexa-neuron.png`

### Arquivo de inspeção local

- `.expo/inspect-public.cjs` — roteiro local usado para capturar hero, capítulos, login e mobile. É auxiliar de inspeção e não deve ser tratado como funcionalidade do produto.

## Como transportar o código exatamente

O documento não substitui os arquivos-fonte. Para transportar exatamente o estado atual para outra cópia do projeto, faça uma cópia do working tree inteiro ou gere um patch incluindo arquivos novos:

```powershell
git diff --binary > .expo/cortexa-tracked.patch
git ls-files --others --exclude-standard > .expo/cortexa-untracked-files.txt
```

O primeiro comando captura alterações em arquivos rastreados. O segundo lista os arquivos novos; eles precisam ser copiados junto, porque `git diff` sozinho não inclui arquivos ainda não rastreados. Para esta implementação, os arquivos novos principais são `app/index.tsx`, `components/ProtectedRoute.tsx`, `components/public/*`, `constants/publicExperience.ts`, `services/authAccess.ts`, `tests/auth-access.test.ts`, `tests/e2e/fixtures.ts`, `tests/e2e/public-entry.spec.ts` e os três assets listados acima.

Não use somente o commit `48cb945` para transportar a implementação: ele é o estado anterior e não contém as alterações públicas desta etapa.

## Comparação com a implementação mostrada em outro chat

Foi feita uma verificação literal dos caminhos exibidos na imagem do outro chat. Os seguintes caminhos não existem no projeto atual e, portanto, não fazem parte do estado real desta implementação:

- `scripts/inspect-reference.cjs`
- `scripts/review-landing.cjs`
- `components/landing/KnowledgeTrail.tsx`
- `components/landing/design.tsx`
- `components/landing/ProductPreviews.tsx`
- `components/landing/LandingPage.tsx`
- `components/landing/NeuralScene.tsx`
- `tests/e2e/access.spec.ts`
- `tests/e2e/landing.spec.ts`

Os equivalentes atuais são `app/index.tsx`, `components/public/StoryChapter.tsx`, `components/public/NeuralPath.tsx`, `components/public/ProductDemo.tsx`, `components/public/BrandSculpture.tsx` e `tests/e2e/public-entry.spec.ts`. Assim, ao subir este projeto para o Git e abrir em outro computador, o estado desta conversa será o conteúdo atual desses caminhos, e não o conjunto de arquivos exibido na imagem.
