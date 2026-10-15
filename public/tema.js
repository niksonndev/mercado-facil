/**
 * Aplica o tema salvo antes da primeira pintura.
 *
 * Fica num arquivo externo de propósito: a CSP do index.html usa
 * `script-src 'self'`, então script inline é bloqueado pelo navegador e a tela
 * piscaria no tema errado até o React montar.
 */
(function () {
  try {
    var tema = localStorage.getItem('mercado-facil:tema');
    if (tema === 'claro' || tema === 'escuro') {
      document.documentElement.dataset.tema = tema;
    }
  } catch (erro) {
    // localStorage bloqueado (aba privada): segue a preferência do sistema.
  }
})();
