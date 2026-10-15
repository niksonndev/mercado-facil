/* eslint-env serviceworker */
/**
 * Service worker do Mercado Fácil (sem workbox).
 *
 * - install: lê o precache-manifest.json gerado no build e guarda o app shell
 *   num cache versionado pelo hash do conteúdo do build.
 * - activate: descarta caches de versões antigas e assume o controle.
 * - navegação: network-first com fallback para o index.html em cache; resposta
 *   de erro do host (404 de deep link sem rewrite) também cai no shell.
 * - assets: stale-while-revalidate.
 *
 * Os dados do mercadinho NÃO passam por aqui: ficam no IndexedDB do aparelho.
 * Não existe API para cachear — só o app shell, que é o que faz o app abrir
 * offline depois de instalado.
 *
 * Tudo é resolvido contra `self.registration.scope`: assim o mesmo arquivo
 * funciona na raiz e em subpasta (GitHub Pages de projeto fica em /<repo>/).
 */

const CACHE_PREFIX = 'mercadofacil';
const MANIFEST_URL = 'precache-manifest.json';
const FALLBACK_URL = 'index.html';

/**
 * Nome do cache da versão em uso. Não pode viver só em memória: o navegador
 * encerra o SW ocioso e recria o escopo — se o nome se perdesse, o precache
 * ficaria invisível para o fetch handler e o app não abriria offline.
 */
let currentCacheName = null;

const scopeUrl = (caminho) => new URL(caminho, self.registration.scope).href;

async function activeCache() {
  if (!currentCacheName) {
    const nomes = (await caches.keys()).filter((nome) =>
      nome.startsWith(`${CACHE_PREFIX}-`),
    );
    currentCacheName = nomes.sort().pop() || `${CACHE_PREFIX}-runtime`;
  }
  return caches.open(currentCacheName);
}

async function precache() {
  const resposta = await fetch(scopeUrl(MANIFEST_URL), { cache: 'no-store' });
  if (!resposta.ok) {
    throw new Error(`Manifesto indisponível (${resposta.status})`);
  }

  const { version, assets } = await resposta.json();
  const cacheName = `${CACHE_PREFIX}-${version}`;
  const cache = await caches.open(cacheName);

  // addAll falha inteiro se um arquivo falhar; cada asset é opcional para o app
  // não ficar sem SW por causa de um 404.
  await Promise.all(
    assets.map(async (asset) => {
      try {
        // scopeUrl(asset) direto: o caminho já é relativo à base.
        await cache.add(new Request(scopeUrl(asset), { cache: 'reload' }));
      } catch (erro) {
        console.warn('[sw] não foi possível pré-cachear', asset, erro);
      }
    }),
  );

  currentCacheName = cacheName;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        await precache();
      } catch (erro) {
        console.warn('[sw] precache falhou:', erro);
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const nomes = await caches.keys();
      await Promise.all(
        nomes
          .filter(
            (nome) =>
              nome.startsWith(`${CACHE_PREFIX}-`) && nome !== currentCacheName,
          )
          .map((nome) => caches.delete(nome)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

const PAGINA_OFFLINE =
  '<!doctype html><html lang="pt-BR"><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<meta name="theme-color" content="#0f1115">' +
  '<body style="margin:0;background:#0f1115;color:#f4f6f9;font-family:system-ui;' +
  'display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center">' +
  '<div><h1 style="font-size:1.25rem">Você está offline</h1>' +
  '<p style="color:#8b95a7">Sem conexão agora. Seus lançamentos continuam ' +
  'salvos neste aparelho e você pode continuar trabalhando.</p>' +
  '</div></body></html>';

async function navegacaoPrimeiroRede(request) {
  const cache = await activeCache();

  try {
    const resposta = await fetch(request);

    // Erro do host (ex.: 404 em rota interna sem rewrite de SPA): serve o shell.
    if (!resposta.ok) {
      const shell = await caches.match(scopeUrl(FALLBACK_URL), {
        ignoreVary: true,
      });
      if (shell) return shell;
    }

    cache.put(scopeUrl(FALLBACK_URL), resposta.clone());
    return resposta;
  } catch (erro) {
    const emCache =
      (await caches.match(scopeUrl(FALLBACK_URL), { ignoreVary: true })) ||
      (await caches.match(request, { ignoreVary: true }));
    if (emCache) return emCache;

    return new Response(PAGINA_OFFLINE, {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

async function cacheComRevalidacao(request) {
  const cache = await activeCache();

  // ignoreVary é obrigatório: o host responde "Vary: Origin" e o Chrome envia
  // Origin nos assets com crossorigin (script/stylesheet do build). Comparando
  // o Vary, o match com o Request real erra o alvo e o app fica sem JS/CSS
  // offline (tela branca, 504 no lugar do arquivo).
  const emCache = await cache.match(request, { ignoreVary: true });

  const rede = fetch(request)
    .then((resposta) => {
      if (resposta && resposta.status === 200 && resposta.type === 'basic') {
        cache.put(request, resposta.clone());
      }
      return resposta;
    })
    .catch(() => null);

  if (emCache) return emCache;

  const resposta = await rede;
  return (
    resposta ||
    new Response('', { status: 504, statusText: 'Offline e sem cópia em cache' })
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // outra origem: sempre rede
  if (url.pathname.endsWith(MANIFEST_URL)) return; // manifesto: sempre rede
  if (url.pathname.endsWith('/sw.js')) return; // script do SW: sempre rede

  if (request.mode === 'navigate') {
    event.respondWith(navegacaoPrimeiroRede(request));
    return;
  }

  event.respondWith(cacheComRevalidacao(request));
});
