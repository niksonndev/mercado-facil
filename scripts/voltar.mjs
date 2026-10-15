/**
 * Confere se a folha de lançamento volta como deve.
 *
 * A folha abre pelo endereço (`#/caixa/novo`, vindo do atalho de lançamento ou
 * dos botões do Painel), e tanto a seta de dentro quanto o botão voltar do
 * aparelho precisam fechar a folha. Este script imprime o estado de cada passo
 * para a conferência ficar registrada, em vez de depender de olhar a tela.
 *
 *   node scripts/voltar.mjs [url]
 */
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:4173/mercado-facil/';

const navegador = await chromium.launch({ args: ['--lang=pt-BR'] });
const pagina = await navegador.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});

const esperar = (ms) => pagina.waitForTimeout(ms);
const folhas = () => pagina.locator('.lanc').count();
const hash = () => pagina.evaluate(() => window.location.hash);
const resumo = async (etapa) =>
  console.log(`${etapa}: hash=${await hash()} folha=${await folhas()}`);

/** Toque por coordenada: no celular é o dedo que aperta, não o clique do Playwright. */
async function tocar(alvo) {
  const caixa = await alvo.boundingBox();
  await pagina.touchscreen.tap(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2);
}

await pagina.goto(url, { waitUntil: 'networkidle' });
await esperar(1500);

await pagina.evaluate(() => (window.location.hash = '#/caixa/novo'));
await esperar(1600);
await resumo('1 atalho #/caixa/novo');

await tocar(pagina.locator('.lanc__voltar'));
await esperar(1200);
await resumo('2 depois da seta de voltar');

await pagina.evaluate(() => (window.location.hash = '#/caixa/novo'));
await esperar(1600);
await pagina.goBack();
await esperar(1400);
await resumo('3 depois do voltar do aparelho');

await pagina.evaluate(() => (window.location.hash = '#/painel'));
await esperar(1400);
await tocar(pagina.locator('button:visible', { hasText: 'Lançar o apurado' }).first());
await esperar(1600);
await resumo('4 botão do Painel');

await pagina.goBack();
await esperar(1400);
await resumo('5 depois do voltar do aparelho');

await navegador.close();
