import { test as base, expect, type Page } from '@playwright/test';
import { createSimulatedAuthSession, simulatedAuthUser } from '../../mocks/auth';
import { createSeed } from '../../mocks/seed';
import { createPersonalWorkspace } from '../../services/personalWorkspace';
import type { AppData } from '../../types/domain';

export const authStorageKey = 'sb-cortexa-e2e-auth-token';
export const simulatedOrigin = 'https://cortexa-e2e.invalid';
export const personalStorageKey = `cortexa:personal:${simulatedAuthUser.id}:v1`;
type Workspace = 'public' | 'personal' | 'seeded';
type Session = ReturnType<typeof createSimulatedAuthSession>;

// Conteúdo sintético só no harness. Uma conta real nunca recebe este seed.
export function createSeededAccount(): AppData {
  const seed = createSeed();
  const personal = createPersonalWorkspace(simulatedAuthUser.id);
  return {
    ...seed,
    workspace: 'personal',
    folders: [],
    user: { ...personal.user, name: seed.user.name, weeklyGoal: seed.user.weeklyGoal },
  };
}

export const test = base.extend<{
  workspace: Workspace;
  authSession: Session;
  controlledApi: void;
}>({
  workspace: ['personal', { option: true }],
  authSession: async ({ baseURL }, provide) => {
    expect(baseURL).toBe('http://localhost:8081');
    await provide(createSimulatedAuthSession());
  },
  storageState: async ({ workspace, authSession, baseURL }, provide) => {
    const localStorage =
      workspace === 'public'
        ? []
        : [
            { name: authStorageKey, value: JSON.stringify(authSession) },
            { name: 'cortexa:workspace', value: 'personal' },
            { name: 'cortexa:introduction:v1:welcome', value: 'seen' },
            { name: 'cortexa:introduction:v1:chat', value: 'seen' },
          ];
    if (workspace === 'seeded')
      localStorage.push({ name: personalStorageKey, value: JSON.stringify(createSeededAccount()) });
    await provide({ cookies: [], origins: [{ origin: new URL(baseURL!).origin, localStorage }] });
  },
  controlledApi: [
    async ({ context, workspace, authSession }, use) => {
      // Nenhuma chamada deste domínio chega à rede; testes específicos sobrescrevem
      // somente o endpoint exercitado. Configuração e produção não têm bypass.
      await context.route(`${simulatedOrigin}/**`, async (route) => {
        const request = route.request();
        const pathname = new URL(request.url()).pathname;
        if (
          pathname === '/auth/v1/user' &&
          workspace !== 'public' &&
          request.headers().authorization === `Bearer ${authSession.access_token}`
        ) {
          await route.fulfill({ json: authSession.user });
        } else if (pathname === '/auth/v1/logout') {
          await route.fulfill({ status: 204 });
        } else {
          await route.fulfill({
            status: 404,
            json: { code: 'unavailable', message: 'Serviço simulado indisponível' },
          });
        }
      });
      await use();
    },
    { auto: true },
  ],
});

export { expect };

export async function mockTutorReply(page: Page) {
  await page.route(`${simulatedOrigin}/functions/v1/ai-tutor-chat`, (route) => {
    expect(route.request().headers().authorization).toMatch(/^Bearer /);
    return route.fulfill({
      json: {
        answer: 'Resposta SIMULADA do transporte E2E; nenhuma chamada ao Gemini foi realizada.',
        provider: 'gemini',
        model: 'simulated-e2e',
        promptVersion: 'simulated-e2e-v1',
      },
    });
  });
}
