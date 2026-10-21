# Preparação local

## Pré-requisitos

Use Node.js 22 e npm, Git e um checkout do repositório. A instalação usa o `package-lock.json`. O app é Expo SDK 54 com React Native e Expo Router; PostgreSQL, Supabase CLI, conta remota e arquivo `.env` não são necessários para explorar o núcleo local.

No Windows/PowerShell, execute as variantes `npm.cmd` e `npx.cmd` abaixo. Isso evita depender da execução de wrappers PowerShell; não é necessário alterar a execution policy.

## Primeira execução

Na raiz do checkout:

```powershell
node --version
npm.cmd --version
npm.cmd ci
npm.cmd run start -- --offline --port 8081
```

O modo `--offline` evita a checagem de rede do Expo durante o início local; a instalação de dependências ainda exige acesso ao registry ou cache disponível. Abra `http://localhost:8081` ou pressione `w` no terminal do Expo. Para o dispositivo físico, use Expo Go compatível com SDK 54 e computador/telefone na mesma rede. Android Emulator pode ser aberto com `a`; iOS Simulator exige macOS e Xcode. No Windows, use web, Android ou iPhone físico compatível.

Não copie caches, dados de estudo nem arquivos de ambiente de outro desenvolvedor. Em checkout com alterações locais, revise o estado antes de qualquer limpeza; não apague dados ou snapshots para fazer um teste passar.

## Primeiro percurso

1. Abra o espaço pessoal e configure a formação pelo Perfil/Visão geral.
2. Crie uma anotação na Biblioteca, escolhendo disciplina e assunto.
3. Crie manualmente uma questão ou cartão e pratique; consulte a jornada e o progresso.
4. Recarregue para conferir a persistência. Pelo Perfil, alterne para demonstração e confirme que o conteúdo pessoal não aparece entre os exemplos.

O dashboard é a entrada inicial. O espaço pessoal pode ser usado sem login; a tutoria com Gemini exige sessão autenticada e implantação da função no Supabase. Recursos simulados aparecem identificados, e o estúdio trabalha com texto escrito ou colado, sem processar arquivos automaticamente. O escopo completo está em [Produto](../PRODUCT.md).

## Verificação

Encerre o Expo antes dos E2E: o Playwright exige a porta 8081 livre e gerencia seu próprio servidor.

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run format:check
npx.cmd playwright install chromium
npm.cmd run test:e2e
npm.cmd run test:e2e:offline
```

O Playwright aponta para `http://localhost:8081`, inicia e encerra um Expo sem carregar `.env`. O perfil padrão habilita formulários com configuração pública simulada no domínio `.invalid`; não testa Auth remoto. O perfil `offline` deixa a configuração vazia e verifica o estudo local. A instalação do Chromium é necessária na primeira execução. Resultados observados ficam em [Setup](setup.md); scripts, gates e limitações em [Qualidade](quality.md).

Ao alterar código da Edge Function, execute também `npm.cmd run typecheck:server`; esse script usa Deno e pode baixar a versão fixada no `package.json`. Antes de trocar dependências nativas, siga [AGENTS.md](../AGENTS.md), incluindo `npx.cmd expo install --check` e `npx.cmd expo-doctor`. Não troque dependências para contornar erros sem investigar compatibilidade com SDK 54/Expo Go.

## Serviços opcionais e agentes

Autenticação e análise remota são incrementos opcionais. Os nomes públicos aceitos estão em [`.env.example`](../.env.example); configuração e limites ficam em [Arquitetura](architecture.md) e [Motor de IA](ai-engine.md). Chaves secretas, `service_role` e chaves de provider de IA pertencem ao servidor e nunca ao bundle. Não configurar nem aplicar migrações em destino remoto como parte do onboarding local.

Leia [AGENTS.md](../AGENTS.md) antes de alterar o projeto. Para trabalho no motor de IA, siga a skill local indicada ali. [Setup](setup.md) registra a adoção do Toolkit e seus limites; [Design](design.md) orienta alterações de interface.

## Limitações conhecidas

Dados locais não têm backup em nuvem ou criptografia; não use dados de pacientes. Uma sessão autenticada usa outro espaço local e não sincroniza automaticamente. Exportar bundles ou passar E2E Chromium não comprova gestos, haptics ou execução no Expo Go físico. As pendências de validação ficam nos registros de qualidade e da integração correspondente.

## Entrada e introduções contextuais

Atualização de 21/10/2026: a rota inicial agora verifica a introdução welcome. Na primeira abertura, mostra as três telas de boas-vindas já existentes; “Pular introdução” ou concluir registra a escolha e segue para a Visão geral. Personalizar o perfil é opcional e também há um caminho direto para quem já tem conta. O fluxo local continua sem login obrigatório.

Na primeira entrada pessoal em Conversar, um BottomSheet explica o envio ao Gemini e recomenda não enviar dados identificáveis de pacientes. “Pular introdução” ou “Entendi” salva a escolha por dispositivo. Fechar pelo fundo, gesto ou sistema fecha só naquele momento; a introdução reaparece até o usuário concluir ou pular.

O histórico do chat é aberto em sua rota própria; a volta do login/cadastro usa a rota de retorno existente. Questões e Materiais mantêm seus preparos, seletores e análise atuais, sem uma segunda camada de tutorial.

## Acesso à conta

A primeira tela oferece “Continuar com Google”, “Criar conta”, entrada por e-mail e “Continuar sem conta” quando o ambiente tem Auth configurado. Criar conta abre o formulário diretamente; escolher acesso registra a introdução de boas-vindas como vista. Na tela da conta, “Entrar” e “Criar conta” ficam antes dos campos.

Avisos de cadastro, recuperação e erro surgem em um balão no topo, visível mesmo com a tela rolada. O balão tem animação, respeita redução de movimento e pode ser fechado; não desaparece automaticamente. O cadastro orienta conferir o e-mail e, para um endereço já cadastrado, usar a senha anterior ou recuperação. No cadastro e na nova senha, o indicador local de força mostra nível, cor e orientação; também informa se as duas senhas coincidem.

O Google ainda depende de cliente OAuth e ativação no Supabase atual. Enquanto estiver desativado, o botão informa isso no topo e mantém o formulário de e-mail disponível. A configuração está em [Arquitetura — ativação do Google](architecture.md#ativação-do-google). O login por e-mail e o estudo sem conta permanecem disponíveis no Expo Go.
