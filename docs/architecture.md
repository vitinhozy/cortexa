# Arquitetura do Cortexa

A primeira integração de IA implementa **anotações → análise de conceitos → revisão → catálogo**. [Motor de IA](ai-engine.md) registra a publicação no projeto de desenvolvimento e uma chamada autenticada real ao tutor de chat em 21/10/2026. O provider Gemini executa somente na Edge Function; a análise de material ainda aguarda sua validação remota. O restante dos fluxos de geração continua demonstrativo ou indisponível, conforme descrito abaixo. [Setup](setup.md) registra a adoção das ferramentas; [Produto](../PRODUCT.md) delimita o escopo.

A jornada acadêmica, o modelo do aluno, os eventos comuns de estudo e os contratos versionados estão descritos em [Evolução longitudinal — implementação](learning-implementation.md). Esse documento registra o incremento atual, seus testes e os serviços externos ainda não conectados.

A reformulação de Questões/Simulados, os estados persistidos, a heurística de domínio e os pontos de troca por geração/ingestão remota estão detalhados em [Questões e Simulados](practice.md).

## Escopo atual

Expo SDK 54, React Native, TypeScript estrito e Expo Router. A aplicação oferece jornada acadêmica progressiva e memória local compartilhada entre prática, cartões, estudo, erros e recomendações, preservando a demonstração. IA, RAG, aulas e sincronização remotos continuam dependentes de integração real.

```text
AuthProvider (opcional, Supabase Auth)
  → StudyProvider escolhe demonstração, pessoal local ou espaço da conta
  → repositório isolado + createServices
  → telas Expo Router
  → serviços validam entradas e atualizam entidades relacionadas
  → snapshot estável + fila serial de gravações AsyncStorage
```

## Identidade, isolamento e persistência

- Demonstração: chave histórica `cortexa:demo:v1`, compatível com snapshots anteriores.
- Pessoal sem conta: `cortexa:personal:local:v1`, criado vazio por `services/personalWorkspace.ts`.
- Conta autenticada: `cortexa:personal:<auth-user-id>:v1`. Login não importa dados da demonstração nem do espaço local. Logout remove o acesso ao espaço da conta pela interface; seus dados locais não são apagados.
- Preferência de espaço: `cortexa:workspace`. A conta autenticada sempre usa um espaço pessoal.
- A troca de identidade hidrata o próximo repositório antes de assumir seu contexto. Durante a transição, o conteúdo anterior fica oculto, inacessível e sem interação; os Modals de BottomSheet são suspensos imediatamente. Stack e Tabs preservam a rota. `WorkspaceScreen`, aplicado nas folhas dos dois navegadores, descarta rascunhos e estados de telas por identidade sem reiniciar a navegação. A troca manual aguarda a fila de gravações do repositório comprometido.
- O catálogo em `constants/subjects.ts` contém disciplinas, sem conteúdo ou desempenho de exemplo. Os exemplos permanecem em `mocks/`.
- `workspace` e `folders` são extensões opcionais do snapshot v1: ausência de `workspace` significa demonstração, preservando dados antigos. A hidratação valida estrutura, modo e proprietário. Snapshot ilegível bloqueia a sobrescrita automática e mostra um aviso global; restauração da demonstração exige confirmação.
- AsyncStorage não oferece criptografia nem isolamento contra alguém com acesso ao armazenamento do dispositivo. A separação por chave evita mistura acidental entre contas, mas não substitui autorização de backend. Não guardar dados de pacientes.

## Serviços e fluxo acadêmico

`types/domain.ts` concentra entidades. `services/index.ts` compõe regras de prática, materiais e planejamento; `services/workspace.ts` concentra perfil, pastas e provas. `hooks/useStudy.tsx` injeta o repositório, permitindo testar os serviços sem React ou credenciais.

Fluxo pessoal disponível:

```text
onboarding → perfil, disciplinas e disponibilidade
anotação → disciplina + assunto + métrica ainda não avaliada
biblioteca → pasta, favorito, busca por título/conteúdo/assunto/disciplina
prova → data + disciplina + assuntos → plano local → sessão
sessão concluída → histórico e tempo real → retomada na tela inicial
```

Uma anotação pode reutilizar o assunto pelo nome dentro da mesma disciplina. A criação de um assunto não inventa resumo, questões ou domínio: o texto original é preservado e a métrica começa sem avaliação. O detalhe do material abre a anotação selecionada; planos por assunto usam a primeira anotação que criou esse assunto. Unificar vários materiais em resumo depende da futura ingestão, não de concatenação apresentada como IA.

`features/study/context.ts` reúne IDs de materiais, erros, revisões vencidas, assuntos com prática e provas para a home e futuras recomendações. Esse agregador é local e não envia textos a terceiros. O fluxo opcional de análise registra uso no servidor, conforme o contrato de IA.

`features/study/progress.ts` reconcilia métricas pessoais a partir de tentativas e sessões concluídas: minutos totais, semana iniciada na segunda-feira, acertos e expiração da sequência. O perfil não pode editar estatísticas. Assuntos sem questões respondidas exibem domínio não avaliado. Os totais demonstrativos continuam identificados como exemplos.

`features/study/insights.ts` agrega acertos e erros por disciplina a partir das métricas de cada conceito, sem confundir taxa de acerto com domínio estimado. `AccuracyChart` anima as barras ao trocar a disciplina e respeita a redução de movimento. `ReviewPriorities` destaca conceitos avaliados com domínio abaixo de 75%, ordenados do menor para o maior. `features/study/rhythm.ts` calcula semanas e meses apenas com sessões concluídas, questões e revisões registradas; a sequência demonstrativa não preenche dias. `StudyCalendar` apresenta essas datas no topo da visão geral, tanto no espaço pessoal quanto na demonstração.

## Navegação e componentes

As cinco abas existentes foram preservadas. A partir de 900 px, o usuário pode escolher entre navegação inferior e lateral; abaixo disso, usa a barra inferior. A visão geral distribui conteúdo em colunas conforme a largura disponível. Nenhuma tela usa elementos DOM.

`useAppNavigation` usa o histórico do Expo Router para o botão Voltar. `Screen.backTo` é apenas o destino de apoio quando não existe uma etapa anterior, como em um link aberto diretamente. As abas usam `backBehavior="history"`; as ferramentas do menu abrem com `router.push`, preservando a tela de origem e suas etapas. Conversar é a única entrada do chat no menu principal.

`components/ui.tsx` concentra botões, campos, cards, estados vazios, indicadores e avisos de armazenamento. `Choice` trata seleção acessível no nativo e botão alternável no navegador. `ProfileForm` é compartilhado pelo onboarding e pela edição de perfil. `constants/theme.ts` mantém cores e tipografia; `AppearanceProvider` oferece tema claro/escuro persistido.

## Movimento e refinamento da interface

`MotionProvider`, abaixo do repositório, combina a preferência local `reduceMotion` com a opção de acessibilidade do sistema. Se qualquer uma estiver ativa, transições, resposta de escala, indicadores e o giro dos flashcards deixam de animar. A configuração do sistema nunca é sobrescrita pelo app. `haptics` controla o feedback em aparelhos compatíveis; `services/feedback.ts` encapsula `expo-haptics`, ignora indisponibilidade e não vibra no navegador. Campos novos de preferências são opcionais para preservar snapshots anteriores.

`constants/motion.ts` centraliza durações e parâmetros de mola. `Touch`, `Reveal` e `ScreenMotion` usam Animated, com driver nativo para opacidade e transformações. O Stack do Expo Router mantém entrada, saída e gesto de retorno nativos; as abas nativas usam fade. O preview web usa entrada por opacidade e deslocamento curto. A saída interativa de páginas do iOS depende do navegador nativo, não é reproduzida integralmente no preview web. O progresso anima largura somente quando o valor muda.

`GlassTabBar` mantém as rotas, eventos, seleção acessível e safe areas do Expo Router. Quando a navegação inferior está selecionada, apresenta a barra arredondada com `expo-blur` em iOS/web e fundo sólido no Android. A navegação lateral segue a preferência disponível a partir de 900 px, descrita acima. `expo-blur` e `expo-haptics` usam as versões compatíveis com SDK 54 e Expo Go. Nenhuma biblioteca de gestos adicional foi necessária.

`BottomSheet` mantém o Modal montado até terminar a saída. Oferece fechamento por botão, fundo, gesto descendente no cabeçalho, Voltar do Android e Escape na web. O Modal do React Native Web controla foco e sua restauração; no nativo, o título recebe foco de acessibilidade. O conteúdo é rolável e o cabeçalho concentra o gesto para não capturar a rolagem. Biblioteca, lembretes e informações do perfil compartilham o componente.

`features/study/search.ts` busca exclusivamente no snapshot atual, normaliza acentos e aceita categorias. O resultado aponta para o material, assunto, questão ou card escolhido. Cards abertos pela busca podem ser consultados antes do vencimento; avaliar explicitamente o card reagenda sua revisão. `features/study/rhythm.ts` monta os últimos sete dias apenas com sessões concluídas, tentativas e revisões registradas; não transforma contadores demonstrativos em atividade inventada.

O onboarding oferece três etapas introdutórias antes do formulário existente. Sua primeira tela também oferece Google, criação de conta, entrada por e-mail e continuação local quando Auth está configurado. A tela Plus é uma prévia, com períodos selecionáveis, sem preços inventados, checkout ou restauração de compras. A tela de conta oferece e-mail e o fluxo OAuth Google; a sessão depende de validação pelo Auth. Lembretes salvam horário e preferências locais, sem solicitar permissão ou agendar notificações. A apresentação da IA mantém as fontes demonstrativas identificadas.

Pontos de integração futuros: outros provedores sociais devem passar pelo serviço de autenticação e validação de identidade existente; assinaturas exigem serviço de compras e verificação de direitos no servidor; push exige serviço de permissões, tokens e agendamento. Nenhuma dessas integrações deve inferir sucesso a partir das escolhas visuais salvas.

## Autenticação Supabase e experiência de conta

`services/supabase.ts` cria o cliente somente com URL HTTPS válida e chave publicável `sb_publishable_`, e usa PKCE para os retornos por e-mail. Sem configuração, nenhum cliente é criado e o app segue funcionando localmente. Chaves secretas e `service_role` são recusadas como configuração pública. Isso não é autorização de backend: o bundle sempre expõe variáveis `EXPO_PUBLIC_*`.

`hooks/useAuth.tsx` valida o usuário com `auth.getUser`, acompanha login/logout/renovação, recuperação e atualização do usuário, e controla auto-refresh pelo AppState. Um contador descarta respostas antigas de validação. Os eventos de autenticação não executam chamadas assíncronas dentro do callback síncrono do SDK. `app/account.tsx` oferece login e cadastro por e-mail, confirmação e reenvio, solicitação de recuperação, troca da senha via link PKCE, Google, erros e saída. `services/authRedirect.ts` preserva a tela de origem sem dupla codificação dos parâmetros. `EXPO_PUBLIC_AUTH_WEB_REDIRECT_URL` pode fixar o retorno por e-mail; OAuth web usa a origem atual, onde está seu verificador PKCE.

`AccountFeedback` apresenta os resultados no topo, fora da rolagem, usando o `Reveal` existente; respeita redução de movimento, possui fechamento explícito, live region web/Android e anúncio no iOS. Avisos essenciais permanecem até fechamento ou próxima ação. Falhas de credenciais oferecem recuperação diretamente no balão. A mensagem após cadastro contempla endereço já existente sem afirmar que um novo cadastro foi criado ou que sua senha foi alterada. `PasswordStrength` mostra orientação local em vermelho, amarelo e verde, com texto e valor acessível. Não envia nem persiste a senha; o mínimo de cadastro/troca continua em oito caracteres, e o login não impõe esse mínimo a contas antigas.

`services/accountAuth.ts` verifica a disponibilidade pública de Google em `/auth/v1/settings` antes de sair do app, inicia OAuth com PKCE e troca o código uma vez, inclusive quando a identidade remonta o conteúdo da tela. A web redireciona na mesma janela. Builds nativos próprios usam `expo-web-browser` na versão compatível com SDK 54; o Expo Go preserva e-mail e orienta abrir a web para Google. Cancelamento, provedor desativado, erro de rede e retorno inválido recebem mensagens locais. Um código recusado é removido da URL para permitir entrar por e-mail em seguida. Nenhuma credencial Google privada entra no cliente.

O registro da integração descreve um projeto remoto de desenvolvimento configurado; a tela também funciona sem credenciais. Login e cadastro ativam o repositório local separado pela identidade; não importam a demonstração nem o espaço local anônimo. Calendário, progresso, materiais, flashcards, revisões e conversas acompanham esse repositório. Ainda não há sincronização geral entre dispositivos. A análise de anotações tem implementação e histórico de publicação; seu fluxo real autenticado permanece pendente de validação. O chat pessoal possui função e migração publicadas e uma chamada autenticada real confirmada, registrada em [Motor de IA](ai-engine.md). As respostas da demonstração continuam simuladas.

Para ativar e validar:

1. Em Supabase Auth → URL Configuration, permitir o endereço de callback usado no ambiente. Configure `EXPO_PUBLIC_AUTH_WEB_REDIRECT_URL` para um endereço estável do site; Expo Go pode gerar URLs de desenvolvimento diferentes entre sessões.
2. Copiar `.env.example` para `.env.local`, preencher URL e chave **publicável** e reiniciar o Expo. Não adicionar chaves de IA.
3. Conferir cadastro com confirmação, login, recuperação e troca de senha, sessão após reinício, erro de rede, expiração e logout no navegador e no Expo Go.
4. Validar duas contas: cada uma deve abrir um espaço vazio próprio, sem acessar o conteúdo da outra.

Referências oficiais utilizadas: [React Native Auth](https://supabase.com/docs/guides/auth/quickstarts/react-native) e [controle de acesso no Storage](https://supabase.com/docs/guides/storage/security/access-control).

### Ativação do Google

Em 21/10/2026, a leitura de `/auth/v1/settings` do projeto atual confirmou `external.google=false`; o responsável informou que ainda não possui cliente OAuth Google. A interface e o retorno estão implementados, mas nenhuma autenticação Google real foi alegada.

1. Criar um cliente OAuth do tipo aplicação web no Google Auth Platform e configurar consentimento, público/testadores e escopos básicos `openid`, e-mail e perfil.
2. Cadastrar no Google a URI de redirecionamento do Supabase: `https://wqdbfaetsebukzoockly.supabase.co/auth/v1/callback` para o projeto atual.
3. Em Supabase Auth → Sign In / Providers → Google, cadastrar Client ID e Client Secret e habilitar o provedor. O segredo fica somente nessa configuração do servidor.
4. Permitir os retornos do app em Supabase Auth → URL Configuration: ambiente local `http://localhost:8081/**`; para build nativo próprio, `cortexa://**`. No site publicado, restringir a lista ao callback utilizado em `/account`.
5. Repetir login, cancelamento e retorno à rota de estudo com uma conta Google autorizada. Testes controlados de callback não substituem essa verificação real.

Foram consultadas as fontes oficiais, pois Context7 não está disponível nesta sessão: [Google no Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google), [OAuth no Expo e limitação do Expo Go](https://docs.expo.dev/guides/authentication/) e [WebBrowser](https://docs.expo.dev/versions/latest/sdk/webbrowser/). A versão instalada foi resolvida pelo `expo install` a partir do SDK 54 local.

## Próximo limite: banco e sincronização

Há uma migração versionada para materiais analisados, análises e uso de IA. O registro em `docs/ai-engine.md` informa sua aplicação anterior no projeto de desenvolvimento; nenhuma migração foi aplicada ou repetida por este setup. A persistência remota deste fluxo é específica, sem sincronizar o snapshot inteiro. O próximo incremento de sincronização deve implementar um adapter remoto para perfil, disciplinas, assuntos, pastas, materiais e provas, mantendo a operação local sem credenciais. A estrutura proposta é:

| Entidade                             | Relações e invariantes do backend                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------ |
| profiles                             | `user_id` único referenciando `auth.users`; sem permitir editar XP/totais calculados       |
| subjects / topics                    | Assunto pertence à disciplina e ao mesmo proprietário                                      |
| folders / materials                  | Material pertence ao usuário; pasta, disciplina e assunto devem pertencer ao mesmo usuário |
| exams / exam_topics                  | Data e assuntos da mesma disciplina/proprietário                                           |
| attempts / reviews / sessions        | IDs de operação idempotentes; métricas calculadas em transação                             |
| conversations / messages / citations | Conversa e citações autorizadas pelo dono e pelo material de origem                        |

As migrações devem ser criadas pela CLI Supabase, testadas primeiro em ambiente de desenvolvimento, com RLS em todas as tabelas expostas. SELECT/DELETE usam propriedade por `auth.uid()`; INSERT usa WITH CHECK; UPDATE exige USING e WITH CHECK. As chaves estrangeiras devem impedir associações entre usuários, não apenas ocultar registros. Conceder ao papel authenticated apenas as operações necessárias. Não autorizar por `user_metadata`.

Antes de chamar essa etapa de concluída: testar leitura/escrita com duas contas e sem autenticação, adulteração de proprietário e relações cruzadas, concorrência, falha de rede e repetição de operação. Projetar sincronização e resolução de conflitos explicitamente; não substituir todo o estado remoto por um JSON de cliente. Não há status falso de sincronização no produto.

## IA e ingestão: análise de anotações publicada, demais fluxos futuros

`materialAnalysisService` recebe um transporte opcional, composto no `StudyProvider` quando Supabase está configurado. A tela da anotação pessoal abre `MaterialAnalysisPanel`: envia somente após ação explícita, permite cancelar e exige revisão antes de importar conceitos. `ai-material-analysis` verifica o usuário no Auth, reserva quota/cache transacional, executa `createAIExecutor` com o provider Gemini e valida a saída antes de persistir. O evento `MATERIAL_ANALYSIS_REVIEWED` registra aprovação, sem aumentar exposição acadêmica ou domínio. Leituras antigas do snapshot v1 permanecem compatíveis.

Os schemas JSON e validadores ficam em `features/study/materialAnalysisSchema.ts`, com interfaces em `types/materialAnalysis.ts`. Não foi adicionada uma dependência de validação ao bundle: os contratos usam o padrão executável já adotado pelo repositório. Trechos literais, unicidade e relações acíclicas são verificados; correção médica e fidelidade das paráfrases continuam exigindo revisão.

Tabelas `ai_material_versions`, `ai_material_analyses` e `ai_usage` têm RLS de leitura por proprietário; somente o servidor grava por RPCs invoker restritas a `service_role`. O token do cliente é validado em `/auth/v1/user`; não se autoriza por `user_metadata` nem pelo `userId` enviado pelo cliente. A configuração `verify_jwt=false` transfere a verificação ao handler explícito, sem permitir geração anônima. Cache e quota estão no PostgreSQL, não na memória de uma única instância.

`createServices` encaminha `aiService.send` pessoal ao tutor remoto autenticado. `MockAIService` recusa uso pessoal e só gera respostas identificadas como simuladas na demonstração. A UI pessoal não oferece geração falsa. Nenhum PDF, slide, áudio ou imagem é recebido ou marcado como processado; apenas anotações são suportadas na análise de material.

O histórico de criação do projeto de desenvolvimento, aplicação da migration, publicação da função e configuração dos secrets pertence a [Motor de IA](ai-engine.md). Não foi conferido novamente nesta adoção do toolkit. O teste completo com Gemini depende de uma conta e ambiente autorizados; teste controlado local não o substitui.

A integração remota deverá manter credenciais exclusivamente no servidor e implementar:

```text
upload privado autorizado → MIME/tamanho → fila de processamento
  → extração/OCR/transcrição com estado e falha reais
  → trechos com proprietário, material e página/timestamp
  → embeddings e busca filtrada por proprietário
  → contexto mínimo autorizado → provedor de IA
  → validação de saída estruturada → resposta e citações
```

`AIService`, `AIRouter`, `RetrievalService` e `IngestionService` em `services/contracts.ts` são pontos de troca. Ao integrar outras operações (chat, resumo, questões, flashcards, explicação, desempenho, plano e correção de transcrição), expandir seus contratos com schemas executáveis de entrada/saída no servidor. As operações geradoras devem criar rascunhos revisáveis antes de salvar conteúdo no banco.

A fonte deve distinguir material próprio (ID, página/trecho), evidência externa verificada (metadados obtidos de fonte real) e exemplo simulado. Sem recuperação verificável, responder que não há fonte verificada. Nunca promover fontes do mock a evidência nem gerar DOI/PMID por inferência. Documentos e transcrições são dados não confiáveis, não instruções de sistema. Autenticação, propriedade, rate limit e limites de custo devem ser verificados no endpoint.

O leitor PDF, histórico de IA pessoal, gravação/transcrição automática de aulas, player sincronizado, mapas gerados por IA e podcasts continuam no roteiro. O histórico atual guarda apenas conversas locais da demonstração; o estúdio local organiza conteúdo escrito pelo usuário, sem representar processamento remoto fictício.

## Estudo e repetição espaçada

O Study Engine continua local e testável. Priorização considera métricas, erros, provas, tempo e revisões. Cards com retry de 10 minutos só vencem no instante correto, e sessões são agrupadas pela data local. Sem avaliação, a recomendação não descreve o aluno como fraco no assunto.

Planos validam data, assuntos e 5–480 minutos/dia; horizonte máximo de 60 dias. A soma diária respeita o orçamento. A revisão usa intervalos simples: novamente em 10 minutos; difícil em 1 dia; bom no mínimo 3 dias; fácil no mínimo 7 dias. Não é FSRS/SM-2. Questões e flashcards pessoais podem ser cadastrados manualmente e praticados; o CRUD completo e a geração por IA pertencem às próximas etapas.

## Identidade pastel e estúdio local

`constants/theme.ts` centraliza violeta (#7C3AED) e lavanda; o azul da marca fica no símbolo e em poucos detalhes. `BrandLogo` usa o símbolo da identidade visual, e `app.json` aplica o ícone nos alvos nativos. `AppearanceProvider` salva tema claro/escuro em uma chave própria do AsyncStorage, sem depender do espaço de estudo. O chat é a rota inicial; o painel original está na aba Visão geral. A navegação mantém o Expo Router, enquanto `DesktopSidebar` fica no layout raiz para persistir em documentos e editores. `GlassTabBar` exibe somente as cinco abas móveis visíveis. `ChatComposer` mantém o campo fixo no rodapé com um brilho violeta discreto.

`MockAIService` cria uma conversa com ID independente por chat. `app/history.tsx` lista e reabre conversas da demonstração, ordenadas pela mensagem mais recente. O espaço pessoal não envia nem persiste perguntas para um provedor de IA; a tela explica a ausência de integração.

`Reveal` tem uma variante de expansão por mola, com escalas horizontal e vertical distintas. `BottomSheet` abre centralizado a partir de 900 px e junto à borda inferior em telas menores; usa expansão elástica na entrada e recolhimento na saída. Opacidade é limitada ao intervalo válido durante o rebote. A opção de reduzir movimento elimina as animações. Nenhuma dependência nativa foi acrescentada neste incremento.

`types/studio.ts` define documentos de transcrição em texto, mapa e slides. O campo opcional `AppData.studio` preserva snapshots v1 antigos. A hidratação recusa documentos malformados e mantém a proteção contra sobrescrita. `services/studio.ts`, composto por `createServices`, valida e persiste documentos, cartões e questões manuais somente no repositório do espaço atual. Salvar novamente após falha de gravação reutiliza o ID; não duplica o item.

`features/study/studio.ts` transforma mecanicamente blocos separados por linhas vazias em títulos e linhas. Não resume, infere conexões nem cria fatos. A apresentação visual do mapa organiza esses blocos sob um nó raiz; o zoom altera o tamanho do conteúdo dentro de uma área rolável, sem ampliar a página inteira. Slides usam o mesmo texto literal. O editor de transcrição aceita texto colado, sem áudio ou player. Copiar um documento para outro formato mantém a origem intacta.

Os documentos têm título de até 100 caracteres, corpo de até 12.000 e até 24 blocos para mapas/slides. Exclusão exige confirmação. Edição retorna ao documento existente por `dismissTo`. A busca inclui documentos do estúdio e continua limitada ao espaço atual. Questões manuais têm quatro alternativas distintas, gabarito e explicação escritos pelo usuário, com `authored` e fonte explícitos; cartões/questões usam os serviços de prática existentes e métricas registradas.

Futuras integrações de transcrição, extração e geração devem criar rascunhos com proveniência verificada e persistir pelo adapter remoto autorizado descrito acima. Não transformar a formatação local em estado falso de processamento, transcrição ou resposta de IA.

O tempo da sessão é contado em minutos completos desde a abertura até concluir, inclusive tempo em background. Detecção de inatividade e deduplicação entre duas sessões simultâneas ainda precisam ser implementadas antes de usar esse número como medida precisa de atenção.

## Orientação e retorno entre telas

`constants/navigation.ts` define a hierarquia visível e os destinos de retorno para links diretos. Ferramentas de prática pertencem a Estudar; documentos e seus formatos pertencem à Biblioteca. `Screen` apresenta esse caminho acima do título, e o menu lateral destaca a área com um subtítulo para a ferramenta atual. `AppNavigationProvider` usa o histórico observado dentro do app; sem uma origem observada, retorna ao pai definido para a tela. As etapas de preparação e os detalhes de revisão usam estado local nos pop-ups, com fechamento concluído antes de navegar para a prática.
