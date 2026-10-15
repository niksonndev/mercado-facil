import { useEffect, useRef, type ReactNode } from 'react';
import { Botao } from './base';

export interface PropsGaveta {
  aberta: boolean;
  titulo: string;
  aoFechar: () => void;
  children: ReactNode;
  /** Ações do rodapé; normalmente Cancelar + Salvar. */
  rodape?: ReactNode;
}

/**
 * Formulário em painel: sobe de baixo no celular (fica perto do polegar) e
 * aparece centrado no desktop.
 */
export function Gaveta({ aberta, titulo, aoFechar, children, rodape }: PropsGaveta) {
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberta) return;

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') aoFechar();
    };

    document.addEventListener('keydown', aoTeclar);
    // Trava a rolagem do fundo enquanto o painel está aberto.
    const rolagemAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Leva o foco para o formulário, para quem usa teclado não se perder.
    areaRef.current?.querySelector<HTMLElement>('input, select, textarea')?.focus();

    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = rolagemAnterior;
    };
  }, [aberta, aoFechar]);

  if (!aberta) return null;

  return (
    <>
      <div className="cortina" onClick={aoFechar} />
      <div className="gaveta" role="dialog" aria-modal="true" aria-label={titulo}>
        <header className="gaveta__cabecalho">
          <h2 className="gaveta__titulo">{titulo}</h2>
          <Botao variante="fantasma" pequeno onClick={aoFechar} aria-label="Fechar">
            Fechar
          </Botao>
        </header>

        <div className="gaveta__corpo" ref={areaRef}>
          {children}
        </div>

        {rodape && <footer className="gaveta__rodape">{rodape}</footer>}
      </div>
    </>
  );
}
