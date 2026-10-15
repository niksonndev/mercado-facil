import { useCallback, useState } from 'react';

/**
 * Rascunho de formulário: a cópia local que o usuário edita até salvar.
 *
 * Sem isso cada campo precisaria de um `useState` e o formulário só gravaria no
 * banco no fim — que é justamente o comportamento desejado (cancelar não deixa
 * lixo no banco).
 */
export function useRascunho<T extends object>(inicial: T) {
  const [rascunho, definirRascunho] = useState<T>(inicial);
  const [erro, definirErro] = useState('');

  const atualizar = useCallback(<K extends keyof T>(campo: K, valor: T[K]) => {
    definirRascunho((atual) => ({ ...atual, [campo]: valor }));
  }, []);

  const alterar = useCallback((mudancas: Partial<T>) => {
    definirRascunho((atual) => ({ ...atual, ...mudancas }));
  }, []);

  return { rascunho, atualizar, alterar, erro, definirErro };
}

/**
 * Preenche o resto de um objeto a partir do que o extrator de comprovante leu.
 * Hoje nenhum extrator está ligado, mas o formato já fica pronto.
 */
export function aplicarSugestao<T extends object>(atual: T, sugestao: Partial<T>): T {
  const limpo = Object.fromEntries(
    Object.entries(sugestao).filter(([, valor]) => valor !== undefined && valor !== ''),
  );
  return { ...atual, ...limpo };
}
