import type { ReactNode } from 'react';
import { Etiqueta, Botao } from './base';
import { Icone } from './icones';

export interface PropsLinhaLista {
  titulo: string;
  /** Etiqueta colorida ao lado do título (tipo, categoria, situação). */
  etiqueta?: { texto: string; cor?: string };
  detalhe?: ReactNode;
  valor: ReactNode;
  corValor?: string;
  /** Abre o formulário do lançamento ao tocar no corpo da linha. */
  aoAbrir?: () => void;
  acoes?: ReactNode;
}

/**
 * Linha de lista de lançamentos.
 *
 * O corpo é um botão (abre a edição) e as ações ficam fora dele: botão dentro
 * de botão não existe em HTML, e no celular o toque errado abriria o formulário.
 */
export function LinhaLista({
  titulo,
  etiqueta,
  detalhe,
  valor,
  corValor,
  aoAbrir,
  acoes,
}: PropsLinhaLista) {
  const corpo = (
    <>
      <span className="linha__corpo">
        <span className="linha__titulo">
          <span>{titulo}</span>
          {etiqueta && <Etiqueta cor={etiqueta.cor}>{etiqueta.texto}</Etiqueta>}
        </span>
        {detalhe && <span className="linha__detalhe">{detalhe}</span>}
      </span>
      <span className="linha__valor" style={corValor ? { color: corValor } : undefined}>
        {valor}
      </span>
    </>
  );

  return (
    <div className="linha">
      {aoAbrir ? (
        <button
          type="button"
          onClick={aoAbrir}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            border: 0,
            padding: 0,
            textAlign: 'left',
            cursor: 'pointer',
            color: 'inherit',
          }}
        >
          {corpo}
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          {corpo}
        </div>
      )}

      {acoes && <span className="linha__acoes">{acoes}</span>}
    </div>
  );
}

export interface PropsBotaoExcluir {
  descricao: string;
  aoConfirmar: () => void | Promise<void>;
}

export function BotaoExcluir({ descricao, aoConfirmar }: PropsBotaoExcluir) {
  return (
    <Botao
      variante="fantasma"
      pequeno
      className="botao--icone"
      aria-label={`Excluir ${descricao}`}
      title={`Excluir ${descricao}`}
      onClick={() => {
        // Confirmação simples: excluir não tem volta e o backup é manual.
        if (window.confirm(`Excluir ${descricao}? Não dá para desfazer.`)) {
          void aoConfirmar();
        }
      }}
    >
      <Icone nome="lixeira" tamanho={16} />
    </Botao>
  );
}

export interface PropsGrupoFiltros<T extends string> {
  valor: T;
  opcoes: Array<{ valor: T; rotulo: string; contagem?: number }>;
  aoMudar: (valor: T) => void;
}

/** Filtros em pílula; rolam na horizontal no celular. */
export function GrupoFiltros<T extends string>({
  valor,
  opcoes,
  aoMudar,
}: PropsGrupoFiltros<T>) {
  return (
    <div className="filtros" role="group">
      {opcoes.map((opcao) => (
        <button
          key={opcao.valor}
          type="button"
          className="filtro"
          aria-pressed={valor === opcao.valor}
          onClick={() => aoMudar(opcao.valor)}
        >
          {opcao.rotulo}
          {opcao.contagem !== undefined && ` (${opcao.contagem})`}
        </button>
      ))}
    </div>
  );
}
