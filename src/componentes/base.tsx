import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { formatarDinheiro } from '../dominio/dinheiro';
import { Icone, type NomeIcone } from './icones';

/* ------------------------------------------------------------------ cartão */

export interface PropsCartao {
  titulo?: string;
  acao?: ReactNode;
  children: ReactNode;
  destaque?: boolean;
}

export function Cartao({ titulo, acao, children, destaque }: PropsCartao) {
  return (
    <section className={`cartao${destaque ? ' cartao--destaque' : ''}`}>
      {(titulo || acao) && (
        <header className="cartao__cabecalho">
          {titulo && <h2 className="cartao__titulo">{titulo}</h2>}
          {acao}
        </header>
      )}
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ botão */

type VarianteBotao = 'principal' | 'perigo' | 'fantasma' | 'neutro';

export interface PropsBotao extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBotao;
  icone?: NomeIcone;
  pequeno?: boolean;
  largo?: boolean;
}

export function Botao({
  variante = 'neutro',
  icone,
  pequeno,
  largo,
  children,
  className,
  ...resto
}: PropsBotao) {
  const classes = [
    'botao',
    variante !== 'neutro' ? `botao--${variante}` : '',
    pequeno ? 'botao--pequeno' : '',
    largo ? 'botao--largo' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classes} {...resto}>
      {icone && <Icone nome={icone} tamanho={pequeno ? 16 : 18} />}
      {children}
    </button>
  );
}

/* --------------------------------------------------------------- etiqueta */

export interface PropsEtiqueta {
  cor?: string;
  children: ReactNode;
}

export function Etiqueta({ cor, children }: PropsEtiqueta) {
  return (
    <span
      className={`etiqueta${cor ? ' etiqueta--cor' : ''}`}
      style={cor ? { color: cor } : undefined}
    >
      {cor && <i className="ponto" />}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------ estatística */

export interface PropsEstatistica {
  rotulo: string;
  valor: ReactNode;
  detalhe?: ReactNode;
  tom?: 'neutro' | 'positivo' | 'negativo' | 'alerta';
}

export function Estatistica({ rotulo, valor, detalhe, tom = 'neutro' }: PropsEstatistica) {
  const classe =
    tom === 'neutro' ? 'valor valor--medio' : `valor valor--medio valor--${tom}`;

  return (
    <div className="estatistica">
      <span className="rotulo">{rotulo}</span>
      <span className={classe}>{valor}</span>
      {detalhe && <span className="estatistica__detalhe">{detalhe}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------- ficha */

export interface PropsFicha {
  rotulo: string;
  valor: ReactNode;
  cor?: string;
}

export function Ficha({ rotulo, valor, cor }: PropsFicha) {
  return (
    <div className="ficha">
      <span className="ficha__rotulo">{rotulo}</span>
      <span className="ficha__valor" style={cor ? { color: cor } : undefined}>
        {valor}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ vazio */

export interface PropsVazio {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}

export function Vazio({ titulo, descricao, acao }: PropsVazio) {
  return (
    <div className="vazio">
      <Icone nome="mercado" tamanho={26} />
      <strong>{titulo}</strong>
      {descricao && <p>{descricao}</p>}
      {acao}
    </div>
  );
}

/* ------------------------------------------------------------------ aviso */

export interface PropsAviso {
  tom?: 'info' | 'alerta' | 'negativo';
  children: ReactNode;
  icone?: NomeIcone;
}

export function Aviso({ tom = 'info', children, icone = 'alerta' }: PropsAviso) {
  return (
    <div className={`aviso${tom === 'info' ? '' : ` aviso--${tom}`}`}>
      <Icone nome={icone} tamanho={17} />
      <div>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ barra */

export interface PropsBarra {
  valor: number;
  maximo: number;
  cor?: string;
}

export function Barra({ valor, maximo, cor }: PropsBarra) {
  const proporcao = maximo <= 0 ? 0 : Math.min(1, Math.max(0, valor / maximo));

  return (
    <div className="barra">
      <div
        style={{
          width: `${(proporcao * 100).toFixed(1)}%`,
          background: cor,
        }}
      />
    </div>
  );
}

/* ----------------------------------------------------------------- gráfico */

export interface ColunaGrafico {
  rotulo: string;
  valor: number;
  atual?: boolean;
}

export interface PropsGrafico {
  colunas: ColunaGrafico[];
  /** Referência para a altura: normalmente o maior dia do mês. */
  teto?: number;
}

export function Grafico({ colunas, teto }: PropsGrafico) {
  const maximo = teto ?? Math.max(1, ...colunas.map((coluna) => coluna.valor));

  return (
    <div className="grafico">
      {colunas.map((coluna) => (
        <div
          key={coluna.rotulo}
          className="grafico__coluna"
          data-hoje={coluna.atual ? 'true' : 'false'}
          title={`${coluna.rotulo}: ${formatarDinheiro(coluna.valor)}`}
        >
          <i style={{ height: `${Math.max(2, (coluna.valor / maximo) * 100)}%` }} />
        </div>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- legenda */

export interface ItemLegenda {
  rotulo: string;
  cor: string;
  valor?: string;
}

export function Legenda({ itens }: { itens: ItemLegenda[] }) {
  return (
    <div className="legenda">
      {itens.map((item) => (
        <span key={item.rotulo}>
          <i className="ponto" style={{ color: item.cor }} />
          {item.rotulo}
          {item.valor && <strong className="valor">{item.valor}</strong>}
        </span>
      ))}
    </div>
  );
}
