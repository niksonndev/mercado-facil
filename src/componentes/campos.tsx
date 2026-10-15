import { useId, useState, type ReactNode } from 'react';
import { adicionarDias, hojeISO } from '../dominio/datas';
import { formatarDinheiroSemSimbolo, mascararDinheiro, parseDinheiro } from '../dominio/dinheiro';
import type { Centavos } from '../dominio/tipos';
import { Icone, type NomeIcone } from './icones';

/* ------------------------------------------------------------------- campo */

export interface PropsCampo {
  rotulo: string;
  dica?: string;
  erro?: string;
  /** Com ícone, o campo vira uma linha da folha de lançamento. */
  icone?: NomeIcone;
  children: (id: string) => ReactNode;
}

/** Envolve um controle com rótulo, dica e erro, ligados pelo mesmo id. */
export function Campo({ rotulo, dica, erro, icone, children }: PropsCampo) {
  const id = useId();

  return (
    <div className={`campo${icone ? ' campo--linha' : ''}`}>
      {icone && (
        <span className="campo__icone">
          <Icone nome={icone} tamanho={20} />
        </span>
      )}
      <span className="campo__textos">
        <label className="campo__rotulo" htmlFor={id}>
          {rotulo}
        </label>
        {erro ? (
          <span className="campo__erro" role="alert">
            {erro}
          </span>
        ) : (
          dica && <span className="campo__dica">{dica}</span>
        )}
      </span>
      {children(id)}
    </div>
  );
}

/* ------------------------------------------------------------------ chave */

export interface PropsChave {
  rotulo: string;
  marcado: boolean;
  aoMudar: (marcado: boolean) => void;
  /** Cor do trilho quando ligada (entradas e saídas, por exemplo). */
  tom?: string;
  icone?: NomeIcone;
  dica?: string;
}

/**
 * Chave de ligar/desligar, no lugar da caixinha de marcar.
 *
 * É o controle do app modelo: no celular o dedo acerta o alvo inteiro, sem
 * precisar mirar no quadradinho.
 */
export function Chave({ rotulo, marcado, aoMudar, tom, icone, dica }: PropsChave) {
  return (
    <div className="campo campo--linha">
      {icone && (
        <span className="campo__icone">
          <Icone nome={icone} tamanho={20} />
        </span>
      )}
      <span className="campo__rotulo" id={`${rotulo}-rotulo`}>
        {rotulo}
        {dica && <span className="campo__dica">{dica}</span>}
      </span>
      <label className="chave" style={tom ? { ['--tom' as string]: tom } : undefined}>
        <input
          type="checkbox"
          checked={marcado}
          aria-labelledby={`${rotulo}-rotulo`}
          onChange={(evento) => aoMudar(evento.target.checked)}
        />
        <span className="chave__trilho" />
      </label>
    </div>
  );
}

/* ------------------------------------------------------------------ texto */

export interface PropsEntradaTexto {
  id?: string;
  valor: string;
  aoMudar: (valor: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  inputMode?: 'text' | 'numeric' | 'tel';
  list?: string;
}

export function EntradaTexto({
  id,
  valor,
  aoMudar,
  placeholder,
  autoFocus,
  inputMode,
  list,
}: PropsEntradaTexto) {
  return (
    <input
      id={id}
      className="entrada"
      type="text"
      value={valor}
      placeholder={placeholder}
      autoFocus={autoFocus}
      inputMode={inputMode}
      list={list}
      autoComplete="off"
      onChange={(evento) => aoMudar(evento.target.value)}
    />
  );
}

export function AreaTexto({
  id,
  valor,
  aoMudar,
  placeholder,
}: {
  id?: string;
  valor: string;
  aoMudar: (valor: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      id={id}
      className="area"
      value={valor}
      placeholder={placeholder}
      onChange={(evento) => aoMudar(evento.target.value)}
    />
  );
}

/* ------------------------------------------------------------------ data */

export function EntradaData({
  id,
  valor,
  aoMudar,
}: {
  id?: string;
  valor: string;
  aoMudar: (valor: string) => void;
}) {
  return (
    <input
      id={id}
      className="entrada"
      type="date"
      value={valor}
      onChange={(evento) => aoMudar(evento.target.value)}
    />
  );
}

/** Competência no formato AAAA-MM, com o seletor nativo do mês. */
export function EntradaMes({
  id,
  valor,
  aoMudar,
}: {
  id?: string;
  valor: string;
  aoMudar: (valor: string) => void;
}) {
  return (
    <input
      id={id}
      className="entrada"
      type="month"
      value={valor}
      onChange={(evento) => aoMudar(evento.target.value)}
    />
  );
}

/* --------------------------------------------------------------- dinheiro */

export interface PropsEntradaDinheiro {
  id?: string;
  valor: Centavos;
  aoMudar: (valor: Centavos) => void;
  autoFocus?: boolean;
}

/**
 * Campo de dinheiro em centavos.
 *
 * A digitação é da direita para a esquerda (igual à maquininha): quem digita
 * "1234" quer R$ 12,34, e não precisa teclar vírgula no celular.
 *
 * Guarda o texto na própria tela em vez de reescrever a partir de `valor` a
 * cada tecla — se reformatasse, o cursor pularia de lugar. Por isso o
 * componente assume que `valor` não muda por fora enquanto ele está aberto.
 */
export function EntradaDinheiro({ id, valor, aoMudar, autoFocus }: PropsEntradaDinheiro) {
  const [texto, definirTexto] = useState(() =>
    valor ? formatarDinheiroSemSimbolo(valor) : '',
  );

  return (
    <div className="entrada--moeda">
      <span aria-hidden="true">R$</span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        autoFocus={autoFocus}
        value={texto}
        placeholder="0,00"
        onChange={(evento) => {
          const mascarado = mascararDinheiro(evento.target.value);
          definirTexto(mascarado);
          aoMudar(parseDinheiro(mascarado) ?? 0);
        }}
      />
    </div>
  );
}

/* --------------------------------------------------------------- seleção */

export interface OpcaoSelecao<T extends string> {
  valor: T;
  rotulo: string;
}

export function Selecao<T extends string>({
  id,
  valor,
  aoMudar,
  opcoes,
  vazio,
}: {
  id?: string;
  valor: T | '';
  aoMudar: (valor: T) => void;
  opcoes: OpcaoSelecao<T>[];
  /** Rótulo da opção neutra; sem ele, não existe opção vazia. */
  vazio?: string;
}) {
  return (
    <select
      id={id}
      className="selecao"
      value={valor}
      onChange={(evento) => aoMudar(evento.target.value as T)}
    >
      {vazio !== undefined && <option value="">{vazio}</option>}
      {opcoes.map((opcao) => (
        <option key={opcao.valor} value={opcao.valor}>
          {opcao.rotulo}
        </option>
      ))}
    </select>
  );
}

/* --------------------------------------------------------------- marcar */

export function Marcar({
  rotulo,
  marcado,
  aoMudar,
  dica,
}: {
  rotulo: string;
  marcado: boolean;
  aoMudar: (marcado: boolean) => void;
  dica?: string;
}) {
  return (
    <label className="marcar">
      <input
        type="checkbox"
        checked={marcado}
        onChange={(evento) => aoMudar(evento.target.checked)}
      />
      <span>
        {rotulo}
        {dica && <span className="campo__dica"> — {dica}</span>}
      </span>
    </label>
  );
}

/** Duas colunas no desktop, empilhado no celular. */
export function Dupla({ children }: { children: ReactNode }) {
  return <div className="dupla">{children}</div>;
}

/* -------------------------------------------------------------- data rápida */

/**
 * Hoje / Ontem / Outros, como no app modelo.
 *
 * É o caminho de 90% dos lançamentos: quem anota à noite lança do dia. A data
 * completa só aparece quando a pessoa escolhe "Outros".
 */
export function PilulasData({
  valor,
  aoMudar,
}: {
  valor: string;
  aoMudar: (valor: string) => void;
}) {
  const hoje = hojeISO();
  const ontem = adicionarDias(hoje, -1);
  const [outros, definirOutros] = useState(valor !== hoje && valor !== ontem);

  const escolher = (dia: string) => {
    definirOutros(false);
    aoMudar(dia);
  };

  return (
    <>
      <div className="pilulas">
        <button
          type="button"
          className="filtro"
          aria-pressed={!outros && valor === hoje}
          onClick={() => escolher(hoje)}
        >
          Hoje
        </button>
        <button
          type="button"
          className="filtro"
          aria-pressed={!outros && valor === ontem}
          onClick={() => escolher(ontem)}
        >
          Ontem
        </button>
        <button
          type="button"
          className="filtro"
          aria-pressed={outros}
          onClick={() => definirOutros(true)}
        >
          Outros…
        </button>
      </div>

      {outros && (
        <div style={{ marginTop: 8 }}>
          <EntradaData valor={valor} aoMudar={aoMudar} />
        </div>
      )}
    </>
  );
}
