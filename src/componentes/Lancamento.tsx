import { useState, type ReactNode } from 'react';
import { formatarDinheiroSemSimbolo, mascararDinheiro, parseDinheiro } from '../dominio/dinheiro';
import type { Centavos } from '../dominio/tipos';
import { Icone } from './icones';

/** Tom da folha: o vermelho de saída, o verde de entrada e o roxo do resto. */
export type TomLancamento = 'despesa' | 'receita' | 'neutro';

export const CORES_LANCAMENTO: Record<TomLancamento, string> = {
  despesa: 'var(--sai)',
  receita: 'var(--entra)',
  neutro: 'var(--acento)',
};

export interface PropsLancamento {
  /** "Nova despesa", "Fechar o dia"... */
  titulo: string;
  /** "Valor da despesa", "Fundo de caixa"... */
  rotuloValor: string;
  tom: TomLancamento;
  valor: Centavos;
  aoMudarValor: (valor: Centavos) => void;
  aoConfirmar: () => void | Promise<void>;
  aoFechar: () => void;
  erro?: string;
  /** As linhas do formulário, já no formato de linha da folha. */
  children: ReactNode;
  /** Blocos que ficam no fim do corpo (totais, resumos). */
  adendo?: ReactNode;
  salvando?: boolean;
  rotuloConfirmar?: string;
  /**
   * Valor do topo só para ler.
   *
   * É o caso do fechamento de caixa: o número grande é o total vendido no dia,
   * que soma as formas de pagamento e não se digita.
   */
  somenteLeitura?: boolean;
}

/**
 * Folha de lançamento em tela cheia, como no app modelo.
 *
 * Cabeçalho na cor do movimento com o valor em primeiro lugar (é o que a mão
 * procura), corpo branco com as linhas do formulário e o botão redondo de
 * confirmar flutuando no pé. O mesmo componente serve para saída (vermelho),
 * entrada (verde) e o resto (roxo): trocar o tom é trocar uma palavra.
 */
export function Lancamento({
  titulo,
  rotuloValor,
  tom,
  valor,
  aoMudarValor,
  aoConfirmar,
  aoFechar,
  erro,
  children,
  adendo,
  salvando,
  rotuloConfirmar = 'Salvar',
  somenteLeitura,
}: PropsLancamento) {
  const [texto, definirTexto] = useState(() =>
    valor ? formatarDinheiroSemSimbolo(valor) : '',
  );

  return (
    <div className="lanc" style={{ ['--tom' as string]: CORES_LANCAMENTO[tom] }}>
      <div className="lanc__topo">
        <button type="button" className="lanc__voltar" onClick={aoFechar}>
          <Icone nome="voltar" tamanho={20} />
          {titulo}
        </button>

        <span className="lanc__rotulo">{rotuloValor}</span>

        <div className="lanc__valor">
          <span className="lanc__moeda">R$</span>
          {somenteLeitura ? (
            <span className="lanc__valor-texto">{formatarDinheiroSemSimbolo(valor)}</span>
          ) : (
            <input
              inputMode="numeric"
              autoComplete="off"
              aria-label={rotuloValor}
              value={texto}
              placeholder="0,00"
              onChange={(evento) => {
                const mascarado = mascararDinheiro(evento.target.value);
                definirTexto(mascarado);
                aoMudarValor(parseDinheiro(mascarado) ?? 0);
              }}
            />
          )}
          <span className="lanc__moeda">BRL</span>
        </div>
      </div>

      <div className="lanc__corpo">
        {erro && (
          <p className="lanc__erro" role="alert">
            {erro}
          </p>
        )}
        {children}
        {adendo}
      </div>

      <button
        type="button"
        className="lanc__confirmar"
        onClick={() => void aoConfirmar()}
        disabled={salvando}
        aria-label={rotuloConfirmar}
        title={rotuloConfirmar}
      >
        <Icone nome="check" tamanho={30} />
      </button>
    </div>
  );
}
