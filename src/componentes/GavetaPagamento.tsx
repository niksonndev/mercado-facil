import { useState } from 'react';
import { FORMAS_PAGAMENTO } from '../dominio/categorias';
import { hojeISO } from '../dominio/datas';
import type { Centavos, DataISO, FormaPagamento } from '../dominio/tipos';
import { Botao } from './base';
import { Campo, Dupla, EntradaData, EntradaDinheiro, Selecao } from './campos';
import { Gaveta } from './Gaveta';

export interface Pagamento {
  pagoEm: DataISO;
  valorPago: Centavos;
  formaPagamento: FormaPagamento;
}

export interface PropsGavetaPagamento {
  titulo: string;
  descricao: string;
  valorSugerido: Centavos;
  aoConfirmar: (pagamento: Pagamento) => void | Promise<void>;
  aoFechar: () => void;
}

/**
 * Baixa de pagamento usada por contas, custos e folha.
 *
 * Pede só o que muda de um pagamento para outro — data, forma e valor — e já
 * vem com o valor cheio preenchido, que é o caso comum.
 */
export function GavetaPagamento({
  titulo,
  descricao,
  valorSugerido,
  aoConfirmar,
  aoFechar,
}: PropsGavetaPagamento) {
  const [pagoEm, definirPagoEm] = useState(hojeISO());
  const [valorPago, definirValorPago] = useState(valorSugerido);
  const [formaPagamento, definirForma] = useState<FormaPagamento>('pix');
  const [salvando, definirSalvando] = useState(false);

  const confirmar = async () => {
    definirSalvando(true);
    try {
      await aoConfirmar({ pagoEm: pagoEm || hojeISO(), valorPago, formaPagamento });
      aoFechar();
    } finally {
      definirSalvando(false);
    }
  };

  return (
    <Gaveta
      aberta
      titulo={titulo}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="principal" onClick={confirmar} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Confirmar pagamento'}
          </Botao>
        </>
      }
    >
      <p style={{ marginTop: 0, marginBottom: 14, fontSize: '0.9rem' }}>{descricao}</p>

      <Dupla>
        <Campo rotulo="Data do pagamento">
          {(id) => <EntradaData id={id} valor={pagoEm} aoMudar={definirPagoEm} />}
        </Campo>
        <Campo rotulo="Valor pago">
          {(id) => (
            <EntradaDinheiro id={id} valor={valorPago} aoMudar={definirValorPago} />
          )}
        </Campo>
      </Dupla>

      <Campo rotulo="Forma de pagamento">
        {(id) => (
          <Selecao
            id={id}
            valor={formaPagamento}
            aoMudar={definirForma}
            opcoes={FORMAS_PAGAMENTO.map((forma) => ({
              valor: forma.valor,
              rotulo: forma.rotulo,
            }))}
          />
        )}
      </Campo>
    </Gaveta>
  );
}
