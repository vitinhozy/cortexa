# Cortexa

Aplicativo mobile-first Expo SDK 54, React Native, TypeScript estrito e Expo Router.

## Comandos

Node.js 22 e npm; preserve `package-lock.json`. No PowerShell, use `npm.cmd` e `npx.cmd` se os wrappers `.ps1` estiverem bloqueados; não altere a política da máquina.

- Instalar: `npm ci`.
- Desenvolver: `npx expo start --offline --port 8081`.
- Verificar: `npm run check`; E2E: `npm run test:e2e` e `npm run test:e2e:offline`.
- Servidor de IA: `npm run typecheck:server` ao alterar `supabase/functions/`.
- Diagnóstico de dívida (separado do gate): `npm run quality:report`.

## Contratos

- Preserve a execução sem Supabase, sem credenciais e no Expo Go.
- Interfaces em `types/`, fixtures em `mocks/`, regras de estudo em `features/study/` e efeitos em `services/`.
- Componentes devem usar React Native, não elementos DOM. Mantenha navegação por Expo Router.
- Identifique claramente respostas e fontes simuladas. Não adicione casos reais nem secrets ao bundle.
- Interface e documentação para o usuário em português brasileiro.
- Ao alterar comportamento, rode `npm run typecheck`, `npm test` e os testes E2E relevantes com Expo na porta 8081.
- Antes de trocar dependências nativas, consulte compatibilidade e execute `npx expo install --check` e `npx expo-doctor`.
- O arquivo `docs/architecture.md` documenta os pontos de troca por serviços remotos.
- Para desenvolvimento relacionado a IA, leia e aplique `.agents/skills/cortexa-ai-engine/SKILL.md`; a auditoria e o plano incremental ficam em `docs/ai-engine.md`.

## Trabalho e contexto

- Leia instruções e código relevante antes de editar. Defina aceitação e checks; diferencie observação, hipótese, decisão e evidência.
- Complete o escopo autorizado com a menor mudança suficiente; reutilize padrões e preserve alterações locais, validação, segurança e acessibilidade. Falhas pedem reprodução e prova de regressão quando viável.
- Documente alterações de comportamento, comandos e limites na fonte responsável. Não trate presença de configuração, teste controlado ou histórico de deploy como validação remota atual.
- Contexto sob demanda: `PRODUCT.md` (escopo), `docs/architecture.md` (fronteiras), `docs/design.md` (UI), `docs/onboarding.md` (execução), `docs/quality.md` (checks, segurança e harness), `docs/setup.md` (fontes, ferramentas e evidências).
- Use `vercel-react-native-skills` em trabalho RN/Expo; recomendações de novas bibliotecas dependem da compatibilidade acima. Reutilize as skills já disponíveis de Supabase/Postgres quando a tarefa tocar essas camadas; não migre stack para seguir exemplos web.
- Consulte Context7 quando disponível: resolva biblioteca e consulte um conceito por vez. Sem integração ativa, use fontes oficiais e registre a limitação. Nunca envie código privado ou secrets em consultas.
- Processo proporcional, escopo mínimo (Ponytail full) e conversa concisa em português (Caveman) são acordos; não significam plugins instalados. Respeite aprovações já dadas.
- Delegue quando contexto isolado, especialização ou independência ajudarem. Informe objetivo, arquivos, dependências, recursos e aceitação; um escritor por arquivo. Coordenador integra configs/lockfiles; serialize porta 8081, builds e bancos compartilhados. Revisores ficam somente leitura.
- Preserve cliente, modelo principal, autenticação e permissões. Quando autorizado, escolha capacidade/esforço disponível por risco; não habilite APIs pagas, proxies ou outro provedor para delegar.
- Responda a status e continue o trabalho autorizado; bloqueio parcial afeta só dependências. Ao retomar, confira checkout, arquivos e processos; handoff não é evidência. Confirme que um agente parou antes de assumir seus arquivos.
- Revise mudanças não triviais de forma independente quando possível, no delta exato e contratos conectados. Encerre após dispor achados e rodar checks relevantes; novas rodadas exigem risco/evidência ou pedido.
- Não publique, envie mensagens, aplique migrações, gere custos ou faça mudanças destrutivas sem autorização específica. Não adicione Git hooks, bloqueios de push/main ou exigências de branch/worktree.
