# Cortexa

MVP mobile de estudos de Medicina, com React Native, Expo, TypeScript e Expo Router. A primeira versão funciona com usuário fictício, conteúdos demonstrativos e respostas de IA simuladas, sem Supabase ou chaves de API.

## Executar

Pré-requisito: Node.js 22 LTS e npm.

```sh
npm install
npx expo start
```

- **Navegador:** pressione `w`, ou execute `npm run web`.
- **iPhone:** abra o Expo Go compatível com SDK 54 e leia o QR code. Computador e telefone devem estar na mesma rede; permita acesso à rede local se o sistema solicitar.
- **Android Emulator:** com o emulador do Android Studio aberto, pressione `a`, ou execute `npm run android`.
- **Simulador iOS:** requer macOS/Xcode. No Windows, use um iPhone físico ou a versão web.

Neste computador, Node e Git portáteis foram preparados em `%LOCALAPPDATA%\CortexaTools` e adicionados ao PATH do usuário. Reabra o terminal para carregar a alteração. Se uma janela ainda não reconhecer `npm`, use:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start.ps1 --web
```

Nenhum `.env` é necessário. As fontes são incluídas no bundle, sem download de fontes durante o uso.

### Escolha do SDK

Este projeto fixa Expo SDK 54 / React Native 0.81 / React 19.1 para atender ao uso do Expo Go distribuído pela App Store sem build nativo próprio. A documentação oficial consultada contém orientações divergentes durante a transição dos SDKs; a página específica de [compatibilidade do Expo Go](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/) informa suporte ao SDK 54 na App Store. Confira o SDK exibido no Expo Go do seu aparelho. Para Android, há versões por SDK em [expo.dev/go](https://expo.dev/go).

A execução em aparelho físico ainda precisa ser conferida. Não há dependências que exijam um development build para as funcionalidades deste MVP.

## O que já funciona

- Cinco abas: Início, Estudar, Biblioteca, IA e Perfil.
- Study Engine local: recomenda assuntos considerando domínio, erros, revisões, tempo estudado e proximidade da prova.
- Sessão de estudo com resumo, conceitos, questões, flashcards e registro do tempo real em minutos completos.
- Oito questões fictícias com alternativas A–E, correção, explicação por alternativa, dificuldade e fonte demonstrativa. O estudo diário oferece cinco questões.
- Caderno de erros com data, resposta escolhida, correta e causa provável simulada. Criação de flashcards sem duplicação por questão.
- Oito flashcards iniciais, frente/verso, quatro avaliações e agendamento local de revisão.
- Mapa de conhecimento com sete assuntos renais, categorias de domínio e detalhes individuais. As outras disciplinas têm estado vazio explícito.
- Biblioteca com busca, filtros, detalhes, ações contextualizadas e criação de anotações locais.
- Tutor IA com dois modos, conversas separadas por modo/contexto, respostas prontas e indicação de fontes simuladas. Uma aula socrática de três etapas responde ao acerto ou erro do estudante.
- Planejador com data, assuntos e orçamento diário; revisão de véspera e persistência do último plano.
- Perfil com estatísticas, XP, níveis, preferências locais e restauração da demonstração.

O progresso é salvo com AsyncStorage (armazenamento local no navegador). Não há sincronização entre dispositivos. O usuário pode restaurar os exemplos em **Perfil → Restaurar demonstração**. A prova inicial é criada seis dias após o primeiro uso e a data é preservada com os dados.

## Organização

```text
app/                  Rotas Expo Router, cinco abas e fluxos de estudo
components/           Componentes visuais e indicadores reutilizáveis
constants/            Cores, tipografia e tema
features/study/       Priorização, planejamento e agendamento de revisão
hooks/                Provider e assinatura do estado da aplicação
types/                Entidades do domínio
mocks/                Dados demonstrativos separados das telas
services/             Contratos, repositório local e serviços mock
utils/                Datas locais e IDs
tests/                Testes de lógica e testes de navegador
docs/                 Arquitetura, limitações e evidências de validação
scripts/              Auxiliar para iniciar no Windows
```

Detalhes dos pontos de integração estão em [docs/architecture.md](docs/architecture.md). Resultados dos testes e limites da validação estão em [docs/verification.md](docs/verification.md).

## Verificar

```sh
npm run typecheck
npm test
npm run format:check
npx expo-doctor
npx expo install --check
npx expo export --platform all
```

Testes de navegador, com o servidor Expo já aberto na porta 8081:

```sh
npx playwright install chromium
npm run test:e2e
```

## Limites desta entrega

A IA não interpreta conteúdos livremente, não consulta referências externas e não gera conteúdos inéditos. Os botões de gerar questões e flashcards dos materiais abrem o banco demonstrativo do assunto. PDF, imagem, áudio e link exibem disponibilidade futura; apenas anotações são armazenadas. Notificações são preferências locais, sem envio. O planejador usa heurísticas, o tutor guiado tem roteiro fixo e a revisão espaçada usa intervalos simples, sem FSRS/SM-2.

Todos os casos e pacientes são fictícios. O conteúdo serve para testar o produto e precisa de curadoria médica antes de uso educacional real. Não use dados de pacientes. Não existem secrets, chamadas a provedores de IA, autenticação real ou configuração Supabase nesta versão.

### Dependências

O lockfile registra as versões verificadas. A auditoria npm ainda sinaliza dependências transitivas do SDK 54 (39 ocorrências, incluindo pacotes afetados por dependências). `npm audit fix` foi executado; as ocorrências restantes exigem mudança de SDK, atualizações incompatíveis ou correções ainda não publicadas nos pacotes envolvidos. Não foi aplicado `--force`. Veja detalhes em `docs/verification.md`. O MVP é local; antes de publicar, reavaliar o SDK e a árvore de dependências.
