# Primeira experiência de uso

## Jornada observada

Antes da alteração, o Expo servia o app no navegador. A primeira rota abria o chat pessoal, que dizia que nenhuma mensagem seria enviada. O dashboard pessoal já permitia começar sem conta, mas o chat bloqueava a pergunta mesmo com uma sessão conectada. O cadastro/login por e-mail, o fluxo de confirmação e a recuperação de senha já existiam em app/account.tsx; não foi necessário recriar essa tela.

O projeto já tinha cinco áreas por abas, rotas de estudo, um menu lateral para telas largas, BottomSheet, preparo de questões, análise de materiais e estados vazios locais. A maioria das áreas tinha fluxo funcional. As lacunas que afetavam o primeiro uso eram a entrada no chat bloqueado, onboarding sem acionamento automático e ausência de uma chamada real de tutor.

## Decisões de navegação e interação

| Área                   | Ação principal                                                    | Interação contextual                                                                 |
| ---------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Abertura e onboarding  | Página de introdução; pular leva ao dashboard                     | Três etapas existentes, com cadastro/login opcional                                  |
| Dashboard              | Ações levam à tela de estudo ou material correspondente           | Sem pop-up de boas-vindas; introdução de chat aparece na primeira visita             |
| Conversar              | Enviar pergunta diretamente; conversa e histórico são telas/rotas | Bottom sheet de privacidade uma vez; erro mantém a pergunta e oferece nova tentativa |
| Materiais              | Navegar pela biblioteca, detalhe e criação de anotação            | Seletor e análise usam BottomSheet existente quando a escolha requer contexto        |
| Questões               | Configurar a prática e navegar para a sessão                      | Reutilizar o preparo e os seletores existentes; resposta acontece na própria sessão  |
| Simulados              | Abrir a área de provas e configurar um simulado                   | Revisão usa o painel inferior existente                                              |
| Flashcards             | Abrir a revisão e virar/avaliar cada card diretamente             | Sem modal entre cards; a avaliação atualiza a agenda                                 |
| Desempenho             | Dashboard e telas de jornada, conhecimento e erros                | Gráficos e explicações permanecem no conteúdo da tela                                |
| Perfil e configurações | Navegar para edição de perfil, conta ou preferências              | Bottom sheets existentes para escolhas curtas ou confirmação                         |

Nenhum tooltip foi adicionado. Os controles já têm rótulos e texto de ajuda; um tutorial por recurso repetiria informação presente no preparo de Questões e na análise de Materiais. A introdução contextual de Chat trata apenas do envio ao Gemini e do cuidado com dados de pacientes.

## Primeiro percurso atualizado

O caminho inicial verifica a introdução salva no dispositivo: primeira visita abre Onboarding; pular ou terminar a introdução registra a escolha e leva ao Dashboard. O formulário de perfil é opcional e pode ser deixado para depois. “Já tenho uma conta” abre o fluxo de acesso existente. O app continua utilizável sem conta e sem Supabase.

Conversar agora é uma aba própria. Na primeira visita pessoal, o aviso contextual explica o uso do Gemini e pode ser concluído ou pulado. Essa escolha fica no AsyncStorage. No espaço pessoal, uma sessão autenticada envia a pergunta pelo transporte Supabase; sem sessão, o chat encaminha para login e não envia nada. A demonstração continua simulada e rotulada.

O histórico de conversa continua local, separado entre demonstração e espaço pessoal. Respostas do tutor guardam a proveniência do provider/modelo; o banco remoto recebe apenas contagem e telemetria, nunca o texto da conversa.

## Evidência e limites

O app foi percorrido antes das edições em navegador com viewport mobile e rotas de Dashboard, Estudar, Biblioteca, Questões, Simulados, Flashcards, Histórico, Perfil, Onboarding e Chat. A volta ao usuário deve repetir esse percurso após cada mudança relevante. E2E e testes de serviço validam a chamada controlada; eles não provam uma chamada Gemini remota nem substituem validação no Expo Go físico.

## Validação desta etapa

Executada em 21/10/2026 no Expo web/Chromium:

- `npm.cmd run check`: passou; inclui TypeScript, lint, formatação, 76 testes, regras de qualidade e export web.
- `npm.cmd run typecheck:server`: passou para as funções `ai-material-analysis` e `ai-tutor-chat`.
- `npm.cmd run test:e2e`: 50/50 cenários passaram, incluindo abertura, onboarding, conta, chat, biblioteca, questões, simulados, flashcards, desempenho, histórico e retorno entre rotas.
- `npm.cmd run test:e2e:offline`: 1/1 passou sem credenciais.
- `npx.cmd expo install --check` e `npx.cmd expo-doctor`: dependências alinhadas; 18/18 verificações passaram.

O fluxo do tutor foi exercitado com provider Gemini controlado em testes, incluindo autenticação obrigatória, quota, timeout/erros, validação da proveniência e retry sem duplicar a pergunta. A migration está aplicada no projeto atual sob a versão `20261021142323`, e a Edge Function `ai-tutor-chat` está ativa na versão 1. O endpoint respondeu 401 a uma chamada sem sessão. Depois do login no navegador, a pergunta “Explique pré-carga cardíaca em uma frase.” foi concluída remotamente com `provider=gemini`, modelo `gemini-3.8-flash`, HTTP 200, 6.541 ms, 168 tokens de entrada e 44 de saída; a UI exibiu o mesmo modelo e a resposta registrada pelo usuário. Expo Go físico também não foi validado.

## Ajuste da entrada após o teste de uso — 21/10/2026

O usuário não viu a confirmação de cadastro porque o aviso ficava abaixo do formulário. `AccountFeedback` agora aparece fixo no topo, em balão com entrada animada pelo `Reveal` existente; não exige rolar e permanece até fechamento ou próxima ação. Respeita redução de movimento e anuncia o conteúdo às tecnologias assistivas. Erros de credenciais oferecem recuperação dentro do aviso.

Entrar/criar conta e Google ficam antes dos campos; o formulário tem largura limitada em telas grandes. Cadastro e nova senha apresentam força local em vermelho, amarelo e verde, além de texto e confirmação de igualdade. O mínimo de cadastro continua em oito caracteres; login aceita credenciais antigas sem impor esse mínimo. A mensagem de cadastro esclarece o caminho de quem já possui conta, preservando a resposta genérica do Auth.

Os testes de sessão reproduziram uma falha adicional: trocar identidade remontava o navegador e abria a primeira rota declarada, Busca. A troca agora hidrata e assume repository/services/mode juntos, mantém Stack/Tabs e redefine só o conteúdo das telas por identidade. A área anterior e seus Modals ficam ocultos e bloqueados durante a transição. Rascunhos de chat não atravessam login/logout. Eventos de recuperação/atualização revalidam a sessão; códigos inválidos são removidos do retorno para permitir entrar por e-mail.

Google possui início OAuth, PKCE, retorno e tratamento de cancelamento/erro integrados. A disponibilidade real do projeto foi consultada somente em leitura e está desativada; o responsável ainda não tem cliente OAuth. O fluxo controlado passou, mas não representa um login Google real. Instruções para a configuração estão em [Arquitetura](architecture.md#ativação-do-google). O estudo local e o acesso por e-mail permanecem disponíveis sem adicionar login obrigatório.

Validação desta iteração: `npm.cmd run check` passou, incluindo 77 testes e export web; 24/24 E2E selecionados de conta, refinamento e workspace passaram na porta 8081; 1/1 E2E offline passou. `expo install --check` e `expo-doctor` passaram antes e depois de adicionar `expo-web-browser` compatível com SDK 54 (18/18 no Doctor). Houve revisão independente somente leitura dos fluxos e do isolamento. Google real e builds físicos permanecem pendentes; nenhuma conta real ou e-mail foi criado/enviado pelos testes controlados.

Na conferência visual final do servidor com configuração real, foram observados o medidor verde em 390 px, o balão de validação no topo com animação normal e o formulário limitado em 1376 px. A consulta de disponibilidade Google real mostrou o aviso esperado, sem sair do app; não houve erro de runtime nem POST de Auth nessa conferência. Evidências: [senha](screenshots/account-password-strength-390.png), [balão](screenshots/account-validation-feedback-390.png) e [desktop](screenshots/account-login-desktop.png). O servidor local foi restaurado na porta 8081.
