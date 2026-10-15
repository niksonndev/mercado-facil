/**
 * Tira retrato do app em tela de celular, para conferir o visual contra o
 * modelo que o cliente mandou. Roda contra o servidor local do build.
 *
 *   node scripts/retrato.mjs [url] [pasta-de-saida]
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const url = process.argv[2] ?? 'http://127.0.0.1:4173/mercado-facil/';
const saida = process.argv[3] ?? '/tmp/retratos';
await mkdir(saida, { recursive: true });

const navegador = await chromium.launch({
  // Idioma do navegador: é ele que escreve o mês no campo de competência.
  args: ['--lang=pt-BR'],
});
const pagina = await navegador.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: 'pt-BR',
});

const esperar = (ms) => pagina.waitForTimeout(ms);

async function porTexto(texto, indice = 0) {
  // `:visible` importa: o menu do desktop fica no DOM escondido no celular e
  // seria o primeiro a casar com o texto.
  const alvos = pagina.locator('button:visible', { hasText: texto });
  const alvo = alvos.nth(indice);
  await alvo.waitFor({ state: 'visible', timeout: 8000 });
  await alvo.click();
}

/** Toca o botão como o dedo tocaria, para provar que ele é alcançável. */
async function tocar(texto) {
  const alvo = pagina.locator('.rapido__item', { hasText: texto }).first();
  await alvo.waitFor({ state: 'visible', timeout: 8000 });
  await tocarAlvo(alvo);
}

/**
 * Toque por coordenada em vez de clique do Playwright.
 *
 * O Playwright recusa o clique quando o alvo tem animação (o ícone dentro do
 * botão) — no dedo isso não existe. O toque prova o que interessa: o botão
 * responde onde ele aparece na tela.
 */
async function tocarAlvo(alvo) {
  const caixa = await alvo.boundingBox();
  await pagina.touchscreen.tap(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2);
}

async function retrato(nome) {
  await esperar(600);
  await pagina.screenshot({ path: `${saida}/${nome}.png` });
  console.log(`salvo ${saida}/${nome}.png`);
}

await pagina.goto(url, { waitUntil: 'networkidle' });
await esperar(1500);

// O app nasce vazio: carrega o mês de exemplo para o retrato ter conteúdo.
await pagina.evaluate(() => (window.location.hash = '#/dados'));
await esperar(900);
await porTexto('Carregar exemplo');
await esperar(1800);

await pagina.evaluate(() => (window.location.hash = '#/painel'));
await esperar(1200);
await retrato('01-painel');

// O + da barra abre o atalho de lançamento.
await tocarAlvo(pagina.locator('.aba--mais'));
await retrato('02-atalho');

await tocar('Despesa');
await retrato('03-nova-despesa');
await pagina.locator('.lanc__confirmar').click();
await esperar(800);
await retrato('04-despesa-erro');

await pagina.locator('.lanc__voltar').click();
await esperar(800);

await pagina.evaluate(() => (window.location.hash = '#/caixa/novo'));
await esperar(1600);
await retrato('05-fechar-caixa');

await pagina.evaluate(() => (window.location.hash = '#/caixa'));
await esperar(1400);
await retrato('06-caixa');

await pagina.evaluate(() => (window.location.hash = '#/contas'));
await esperar(1400);
await retrato('07-contas');

await pagina.evaluate(() => (window.location.hash = '#/banco'));
await esperar(1400);
await retrato('08-banco');

await pagina.evaluate(() => (window.location.hash = '#/contas/novo'));
await esperar(1400);
await retrato('09-nova-conta');

await pagina.evaluate(() => (window.location.hash = '#/custos/novo'));
await esperar(1400);
await retrato('10-novo-custo');

await navegador.close();
