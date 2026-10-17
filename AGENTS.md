# Cortexa

Aplicativo mobile-first Expo SDK 54, React Native, TypeScript estrito e Expo Router.

- Preserve a execução sem Supabase, sem credenciais e no Expo Go.
- Interfaces em `types/`, fixtures em `mocks/`, regras de estudo em `features/study/` e efeitos em `services/`.
- Componentes devem usar React Native, não elementos DOM. Mantenha navegação por Expo Router.
- Identifique claramente respostas e fontes simuladas. Não adicione casos reais nem secrets ao bundle.
- Interface e documentação para o usuário em português brasileiro.
- Ao alterar comportamento, rode `npm run typecheck`, `npm test` e os testes E2E relevantes com Expo na porta 8081.
- Antes de trocar dependências nativas, consulte compatibilidade e execute `npx expo install --check` e `npx expo-doctor`.
- O arquivo `docs/architecture.md` documenta os pontos de troca por serviços remotos.
