# Design e acessibilidade

## Direção

Interface em português brasileiro para estudantes de Medicina, com prioridade ao uso no celular e continuidade em tablet e navegador. O violeta e os fundos suaves organizam as ferramentas e o progresso. As diferenças entre demonstração, conteúdo pessoal e serviço indisponível devem continuar explícitas, conforme [Produto](../PRODUCT.md).

## Fontes de verdade

| Aspecto                 | Implementação existente                                                                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cores e tipografia      | [`constants/theme.ts`](../constants/theme.ts): paletas clara/escura, violeta `primary` e famílias Inter regular, medium, semibold e bold                         |
| Tema persistido         | [`hooks/useAppearance.tsx`](../hooks/useAppearance.tsx)                                                                                                          |
| Primitivos e composição | [`components/ui.tsx`](../components/ui.tsx): `T`, `Screen`, `Card`, `Button`, `Field`, `Notice`, `Empty`, `Progress`                                             |
| Seleção e painéis       | [`components/Choice.tsx`](../components/Choice.tsx) e [`components/BottomSheet.tsx`](../components/BottomSheet.tsx)                                              |
| Movimento               | [`constants/motion.ts`](../constants/motion.ts), [`components/Motion.tsx`](../components/Motion.tsx) e [`hooks/useMotion.tsx`](../hooks/useMotion.tsx)           |
| Navegação               | [`constants/navigation.ts`](../constants/navigation.ts), [`app/_layout.tsx`](../app/_layout.tsx) e [`components/GlassTabBar.tsx`](../components/GlassTabBar.tsx) |

Reutilizar esses componentes e tokens ao ampliar telas. Espaçamentos e raios ainda são definidos nos estilos dos componentes; não existe uma escala global independente para ambos. Não criar outra paleta ou tabela de valores concorrente neste documento. A fonte Inter é carregada pelo layout raiz; a marca usa os assets existentes.

## Layout observado

A entrada `/` é pública e independente das abas e da sidebar de estudo. Seu título “Aprenda Medicina. Conecte o que importa.” apresenta a proposta antes do acesso. “Começar no Cortexa” e “Criar minha conta” levam à conta; “Conhecer o Cortexa” percorre a apresentação na própria página. O cabeçalho oferece entrada, sem seletor de tema; a preferência de aparência já salva continua respeitada. `/account` usa composição pública própria para login, cadastro e recuperação.

A história visual conecta materiais, conceitos, prática e revisão. Valores e prévias são exemplos ilustrativos, não progresso de quem visita. A arte cerebral em `assets/cortexa-brain.png` é conceitual e decorativa, sem valor diagnóstico; não representa exame, caso real ou evidência médica. O componente de demonstração pode receber `cortexa-demo.mp4` depois de um vídeo real otimizado estar disponível; atualmente não há vídeo integrado. Animações de rolagem e entrada respeitam redução de movimento; os textos e CTAs continuam disponíveis sem animação.

A landing reorganiza o hero abaixo de **900 px**, e o shell de conta empilha o formulário abaixo de **960 px**. Cada capítulo mantém texto e preview juntos no fluxo, lado a lado no desktop e empilhados no mobile, sem painel fixo cobrindo outros capítulos. `StoryChapter` deriva opacidade, deslocamento e inclinação de uma única fonte de scroll, sem remontar cards ao trocar de capítulo. Alturas de linha são pixels, não multiplicadores CSS. Com movimento reduzido, todo conteúdo fica estático e opaco.

`NeuralPath` usa dois caminhos orgânicos finos, vermelho e azul, agrupados em faixas que se iluminam conforme a rolagem. Essas cores são uma escolha artística, não uma representação médica literal dos nervos. Cérebro e neurônio aparecem pontualmente atrás dos previews. Os assets `assets/cortexa-hand.png` e `assets/cortexa-neuron.png` foram gerados com fundo transparente: mão realista com palma para cima e luz azul/coral; neurônio escultórico perolado com ramificações e axônio. São ilustrações conceituais, não referências de anatomia clínica.

No acesso desktop, `BrandSculpture` combina a mão com a marca original, órbitas discretas e movimento lento. É uma composição animada em React Native, não um arquivo de vídeo nem modelo 3D interativo; não requer player, WebGL ou dependência adicional. A cena fica imóvel com movimento reduzido e não compete com o formulário no mobile. Tamanhos e limites ficam em `app/index.tsx` e `components/public/AuthLayout.tsx`.

O onboarding pertence à área autenticada. Não oferecer continuação anônima, navegação de estudo na landing nem atalhos visuais que contornem o acesso. Durante a validação da sessão, conteúdo privado não deve renderizar. Sem configuração de Auth, a conta explica a indisponibilidade e permite retornar ao início.

- A partir de **900 px**, o layout raiz pode mostrar navegação lateral quando a preferência é `left`; abaixo disso, permanece inferior. A preferência inicial é `bottom`, persistida por `useNavigationLayout`.
- `Screen` limita o conteúdo a **1100 px**; esse valor é largura máxima de conteúdo, não o breakpoint da navegação. Seu espaçamento horizontal muda de 22 para 40 em **600 px**. O título usa 28 abaixo de **390 px**, e 32 a partir daí.
- `BottomSheet` fica centralizado a partir de **900 px** e junto à base abaixo disso. Seu padding horizontal muda em **700 px**; a largura máxima é 600, ou 1000 na variante `large`.
- A barra inferior tem largura máxima de 600 e respeita safe areas. Telas específicas podem organizar colunas dentro desses limites; não há um breakpoint único para toda a aplicação.

Os valores descrevem o código atual; mudanças devem atualizar a implementação e esta orientação juntas. Componentes continuam sendo React Native, inclusive na web, com navegação pelo Expo Router.

## Interação e estados

Controles devem informar papel, rótulo e estado por propriedades de acessibilidade do React Native. `Field` liga o rótulo ao `TextInput`; títulos de `Screen` têm papel de cabeçalho, abas expõem seleção e `Progress` informa valor acessível. Ícones decorativos não devem competir com o nome do controle.

Painéis compartilhados oferecem fechamento por botão, fundo, gesto no cabeçalho, Voltar no Android e Escape na web. Preservar retorno e foco ao testar teclado. Novos campos devem exibir erros compreensíveis; operações assíncronas precisam de carregamento, resultado e erro, com nova tentativa quando aplicável. Não transformar preferência visual salva em sucesso de autenticação, compra, notificação ou processamento.

O movimento combina a preferência local com a redução de movimento do sistema. A configuração mais restritiva prevalece. Feedback tátil é opcional e depende do aparelho; não é evidência de funcionamento no preview web. Preservar as variantes sem animação e evitar que movimento seja necessário para entender uma ação.

Revisar especialmente: landing e acesso públicos; bloqueio de links privados; conta validada vazia; busca sem resultados; carregamento de espaço; snapshot ilegível/falha de gravação; autenticação ausente; cancelamento e falha da análise de conceitos; distinção entre material próprio e exemplo simulado.

## Revisão e manutenção

Para mudanças visuais, conferir temas claro/escuro, teclado/foco e redução de movimento, além de larguras móveis e desktop usadas nos E2E. Os registros históricos de revisão ficam em [Verificação](verification.md) e [Evolução longitudinal](learning-implementation.md). Eles não substituem uma nova inspeção da tela alterada; testes web e exportação também não comprovam interação em aparelho físico.

Os critérios e comandos de verificação ficam em [Qualidade](quality.md). A composição dos providers e os limites de serviços continuam em [Arquitetura](architecture.md).

Context7 não está disponível nesta sessão. Referências oficiais consultadas: [autenticação no Expo Router](https://docs.expo.dev/router/advanced/authentication/), [Animated do React Native](https://reactnative.dev/docs/animated) e [Auth no React Native com Supabase](https://supabase.com/docs/guides/auth/quickstarts/react-native). Os testes web preparados não comprovam funcionamento em iPhone físico nem disponibilidade atual do Auth/Gemini remoto.
