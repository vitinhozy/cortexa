# Cortexa

Jornada acadêmica e memória de aprendizagem locais: veja [o que foi implementado e como usar](docs/learning-implementation.md). O núcleo funciona sem credenciais; integrações remotas de IA, ingestão e transcrição continuam explicitamente separadas.

Aplicativo mobile-first de estudos de Medicina com Expo SDK 54, React Native, TypeScript estrito e Expo Router. Funciona sem credenciais, com demonstração separada de um espaço pessoal local.

[Produto](PRODUCT.md) · [Arquitetura](docs/architecture.md) · [Design](docs/design.md) · [Preparação local](docs/onboarding.md) · [Qualidade](docs/quality.md) · [Setup e evidências](docs/setup.md).

## Executar

Pré-requisito: Node.js 22 e npm.

```sh
npm ci
npx expo start --port 8081
```

- Navegador: pressione `w` ou abra `http://localhost:8081`.
- Expo Go: use uma versão compatível com SDK 54; telefone e computador na mesma rede.
- Android Emulator: com o emulador aberto, pressione `a`.
- iOS Simulator: requer macOS/Xcode. No Windows, use o navegador ou iPhone físico.
- Mobile Preview do VS Code: a configuração em `.vscode/settings.json` aponta para a porta 8081.

No Windows/PowerShell, use `npm.cmd` e `npx.cmd` caso a política bloqueie os wrappers `.ps1`. Não é necessário mudar a política de execução. O roteiro completo está em [Preparação local](docs/onboarding.md).

Se a checagem de rede do Expo impedir o início local, use `npx expo start --offline --port 8081`. As fontes são incluídas no bundle. Não é necessário `.env` para usar demonstração ou espaço pessoal.

## Testar as novidades

1. Abra **Perfil → Abrir meu espaço pessoal**.
2. Na tela inicial, toque em **Configurar meu estudo** e preencha perfil, disciplinas e meta.
3. Crie pastas na **Biblioteca** e adicione uma anotação escolhendo disciplina, assunto e pasta.
4. No material, favorite, mova de pasta ou inicie o estudo. Busque também pelo texto da anotação.
5. Cadastre uma prova em **Perfil → Minhas provas**. Ela aparece na home e abre o planejador com data e assuntos relacionados.
6. Recarregue o app: os dados locais permanecem. **Perfil → Explorar demonstração** volta aos exemplos sem misturar os dois espaços.

## Refinamento visual e interações

- A abertura leva direto ao chat; o painel de recomendações e progresso está na aba **Visão geral**.
- O logo Cortexa aparece nos cabeçalhos e na navegação lateral. O violeta da marca conduz a interface; o azul fica concentrado no símbolo e em detalhes pontuais.
- **Perfil → Modo escuro** alterna entre os temas claro e escuro, com preferência salva neste dispositivo.
- Cada conversa demonstrativa recebe um histórico separado e pode ser reaberta em **Histórico de conversas**. Respostas demonstrativas continuam identificadas como simuladas; o chat pessoal usa Gemini quando a conta e o Supabase estão configurados.
- O campo de conversa fica fixo no rodapé com um brilho roxo sutil.
- Paleta em roxo e lavanda, com rosa, menta, pêssego e amarelo pastel por ferramenta.
- Barra lateral no desktop, atalhos em cápsulas e menu de criação com expansão elástica. No celular, os painéis continuam acessíveis pela parte inferior.
- Onboarding com três etapas, avanço, retorno e opção de pular a introdução.
- Transições nativas de páginas, entrada suave no preview web, botões com resposta de mola e barra inferior translúcida no iOS/web.
- Lupa no cabeçalho para buscar materiais, assuntos, questões e cards do espaço atual, inclusive sem acentos.
- **Biblioteca → Filtros** abre um painel inferior. Feche pelo botão, fundo, gesto no cabeçalho ou Escape no navegador.
- **Perfil** reúne ritmo dos últimos sete dias, preferências de movimento e resposta ao toque, lembretes e apresentação do Cortexa Plus.
- **Conta e acesso** oferece e-mail quando a configuração opcional está disponível. O botão Google já está preparado, mas depende da ativação do provedor OAuth no Supabase. O Plus permite explorar períodos, sem preços ou cobrança. Lembretes salvam preferências e mostram uma prévia, sem enviar push.

As animações respeitam **Reduzir movimento** do sistema ou do Perfil. O feedback tátil depende de um aparelho compatível e não é reproduzido pelo Mobile Preview. Assinatura e push continuam indisponíveis. O chat pessoal depende da configuração remota descrita abaixo; sem ela, a demonstração local permanece disponível. A análise de anotações tem uma integração própria.

## Estúdio local

Abra **Transcrições**, **Mapas mentais** ou **Slides** pelos atalhos. Crie, edite e exclua documentos com texto escrito ou colado por você. Cada bloco separado por uma linha em branco vira um ramo do mapa ou um slide; a primeira linha é o título. Os mapas permitem navegação horizontal e zoom; as apresentações têm avanço e retorno entre slides.

Em uma anotação ou documento, **Criar material de estudo** abre os formatos disponíveis. Mapas e slides podem começar com uma cópia literal do texto de origem para você reorganizar. Flashcards e questões usam formulários manuais e entram na prática e no progresso reais do seu espaço. Para vincular esses itens a um assunto, crie antes uma anotação na biblioteca.

Todos os documentos ficam neste dispositivo e são encontrados na busca global. Não há transcrição automática, geração por IA, leitura de PDFs ou exportação de apresentações nesta etapa.

## Funcionalidades disponíveis

- Home pessoal sem números inventados: progresso registrado, materiais recentes, retomada, meta semanal e próxima prova.
- Onboarding e perfil acadêmico editável com validação de semestre, disciplinas e disponibilidade.
- Biblioteca com pastas, renomeação, movimentação, favoritos, busca e filtros; anotações vinculadas a assuntos e disciplinas.
- Cadastro e remoção de provas; planejamento local entre hoje e os próximos 60 dias, respeitando 5–480 minutos por dia.
- Abas no celular/tablet e opção de navegação lateral a partir de 900 px, mantendo componentes React Native.
- Demonstração preservada: questões comentadas, erros, flashcards, mapa de conhecimento, tutor de roteiro fixo e chat com respostas simuladas.
- Persistência local isolada por espaço/conta; aviso global de falha de armazenamento e proteção contra sobrescrever um snapshot ilegível.

As questões e flashcards de exemplo não são copiados ao espaço pessoal. Questões e cartões manuais podem alimentar a prática; geração com IA desses formatos continua futura. Ler uma anotação não gera uma avaliação fictícia de domínio.

## Conta Supabase opcional

O cliente de autenticação e as telas de cadastro/login/logout estão implementados. [O registro da integração](docs/ai-engine.md) descreve a configuração remota, a publicação das Edge Functions e a validação do chat autenticado. A análise de anotações ainda precisa de uma chamada real autenticada neste ambiente. Sem configuração, a tela Conta informa a indisponibilidade; os demais fluxos funcionam normalmente.

Para configurar futuramente, copie `.env.example` para `.env.local`, preencha `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` com a chave publicável do projeto e reinicie o Expo. Não use `service_role`, `sb_secret_` nem chaves de IA no app. Veja o roteiro de validação em [docs/architecture.md](docs/architecture.md).

**Login ainda não sincroniza os dados gerais de estudo.** Cada conta abre um armazenamento local separado. Cadastro/login usam o Supabase quando configurado; a análise de uma anotação envia o material somente após ação explícita. AsyncStorage não é um cofre criptografado e não há backup geral na nuvem.

## IA e arquivos

**O chat pessoal autenticado foi validado com uma resposta real do Gemini.** O provider roda na Edge Function, exige configuração/login e identifica provider e modelo na resposta. A análise de conceitos de anotações está implementada, mas ainda precisa de uma chamada real autenticada neste ambiente e devolve rascunho para revisão antes da importação. Geração de questões, cartões ou resumos por IA continua indisponível. No modo demonstração, respostas e fontes permanecem claramente identificadas como simuladas. Veja [Motor de IA](docs/ai-engine.md).

Uploads e leitura automática de arquivos PDF, slides, imagens, áudio e links não estão disponíveis. Anotações, transcrições em texto, mapas e apresentações manuais são salvos localmente. Não há RAG, transcrição de áudio, gravação de aulas, leitor PDF real ou consulta de referências científicas. Notificações são preferências salvas, sem envio.

A repetição espaçada atual usa intervalos simples, sem FSRS/SM-2. O tempo registrado considera a duração da sessão aberta, inclusive background. Os casos demonstrativos são fictícios. Não inclua dados de pacientes.

## Verificação

```sh
npm run check              # tipos, lint, formato, testes, regras e export web
# No PowerShell, use npm.cmd/npx.cmd.
npm run typecheck:server    # ao alterar a Edge Function
npx expo install --check
npx expo-doctor
npx expo export --platform all
```

Com a porta 8081 livre (o Playwright inicia e encerra seu próprio Expo):

```sh
npx playwright install chromium
npm run test:e2e
npm run test:e2e:offline
```

Os E2E padrão usam configuração pública explicitamente simulada, sem credenciais ou serviço remoto. O perfil `offline` testa ausência de configuração. O conteúdo demonstrativo tem estado inicial explícito nos testes; uma visita normal continua abrindo o espaço pessoal. Resultados atuais e limitações: [Setup](docs/setup.md); registros visuais anteriores: [Verificação histórica](docs/verification.md). Bundles nativos não substituem teste em aparelho físico.

## Organização

`types/` contém entidades; `mocks/`, exemplos; `features/study/`, regras puras de estudo; `services/`, efeitos e persistência; `hooks/`, providers; `components/`, interface compartilhada; `app/`, rotas nativas. A arquitetura e os próximos pontos de integração estão em [docs/architecture.md](docs/architecture.md).

O lockfile fixa as versões instaladas. A auditoria ainda registra 39 ocorrências transitivas da árvore Expo/Metro; não foi aplicada atualização incompatível com `--force`. Veja o registro de verificação antes de distribuir o app.
