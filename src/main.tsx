import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './estilo.css';

const raiz = document.getElementById('app');
if (!raiz) throw new Error('Elemento #app não encontrado no index.html');

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

/**
 * Service worker só no build.
 *
 * Em desenvolvimento ele serviria o app em cache e esconderia justamente a
 * alteração que está sendo testada.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registro) => {
        /**
         * Build novo assumiu o controle: recarrega sozinho.
         *
         * Sem isso a página continua rodando o pacote antigo até alguém
         * recarregar na mão, e quem testa no celular acaba relatando defeito
         * que já foi corrigido. A primeira visita (sem controle anterior) não
         * recarrega, senão o app pisca à toa.
         */
        const jaTinhaControle = Boolean(navigator.serviceWorker.controller);
        let recarregando = false;

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!jaTinhaControle || recarregando) return;
          recarregando = true;
          window.location.reload();
        });

        // O celular congela a aba: aproveita a volta ao app para procurar build novo.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') void registro.update();
        });
      })
      .catch((erro) => console.warn('[app] service worker não registrou:', erro));
  });
}
