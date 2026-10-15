import { useCallback, useEffect, useState } from 'react';

export type Tema = 'claro' | 'escuro';

const CHAVE = 'mercado-facil:tema';

function lerSalvo(): Tema | null {
  try {
    const valor = localStorage.getItem(CHAVE);
    return valor === 'claro' || valor === 'escuro' ? valor : null;
  } catch {
    return null;
  }
}

function temaDoSistema(): Tema {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'claro' : 'escuro';
}

/** Tema em uso: o escolhido pela pessoa ou, sem escolha, o do sistema. */
export function useTema(): { tema: Tema; alternar: () => void } {
  const [tema, definirTema] = useState<Tema>(() => lerSalvo() ?? temaDoSistema());

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
    try {
      localStorage.setItem(CHAVE, tema);
    } catch {
      // Sem localStorage (aba privada): o tema vale só nesta sessão.
    }
  }, [tema]);

  const alternar = useCallback(() => {
    definirTema((atual) => (atual === 'claro' ? 'escuro' : 'claro'));
  }, []);

  return { tema, alternar };
}
