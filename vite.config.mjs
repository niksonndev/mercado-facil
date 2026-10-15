import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
  appendFileSync,
} from 'node:fs';
import { join, relative, sep } from 'node:path';

// Subpasta do GitHub Pages: o mesmo build serve a raiz ou /<repo>/.
const BASE = '/mercado-facil/';

const PATTERN = /\.(?:js|css|html|svg|png|ico|webmanifest|woff2?)$/;
// sw.js e o manifesto fora do precache (travaria a atualização); 404.html é
// cópia do index.html, não precisa entrar duas vezes.
const IGNORE = new Set(['sw.js', 'precache-manifest.json', '404.html']);

const listFiles = (dir) =>
  readdirSync(dir).flatMap((entrada) => {
    const completo = join(dir, entrada);
    return statSync(completo).isDirectory() ? listFiles(completo) : [completo];
  });

/**
 * Gera o precache-manifest.json a partir do conteúdo real do dist e carimba a
 * versão no sw.js. Sem isso o service worker não sabe o que guardar nem quando
 * reinstalar (a marca da versão é o que dispara a atualização).
 */
function precacheDoPwa() {
  return {
    name: 'mercado-facil:precache-manifest',
    apply: 'build',
    closeBundle() {
      // O Pages não reescreve rotas: a cópia do index garante o deep link.
      copyFileSync('dist/index.html', 'dist/404.html');

      const caminhoRelativo = (arquivo) =>
        relative('dist', arquivo).split(sep).join('/');

      const arquivos = listFiles('dist')
        .filter((arquivo) => {
          const caminho = caminhoRelativo(arquivo);
          return !IGNORE.has(caminho) && PATTERN.test(caminho);
        })
        .sort();

      const hash = createHash('sha256');
      for (const arquivo of arquivos) {
        hash.update(caminhoRelativo(arquivo));
        hash.update(readFileSync(arquivo));
      }
      const version = hash.digest('hex').slice(0, 12);

      writeFileSync(
        'dist/precache-manifest.json',
        `${JSON.stringify(
          {
            base: BASE,
            version,
            assets: arquivos.map(caminhoRelativo),
          },
          null,
          2,
        )}\n`,
      );

      const swPath = 'dist/sw.js';
      const sw = readFileSync(swPath, 'utf8');
      if (!sw.includes('precache-version:')) {
        appendFileSync(swPath, `\n/* precache-version: ${version} */\n`);
      }
    },
  };
}

export default defineConfig({
  base: BASE,
  build: { target: 'es2020' },
  plugins: [react(), precacheDoPwa()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
