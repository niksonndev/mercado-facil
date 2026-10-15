import { useState } from 'react';
import { formatarDinheiro } from '../dominio/dinheiro';
import { formatarData, hojeISO } from '../dominio/datas';
import type { FechamentoCaixa } from '../dominio/tipos';
import { salvarFechamento } from '../dados/repositorio';
import { Botao, Ficha } from './base';
import { Campo, EntradaData, EntradaDinheiro } from './campos';
import { Gaveta } from './Gaveta';
import { useRascunho } from './rascunho';

export interface PropsFormularioRecebimento {
  registro: FechamentoCaixa;
  aoFechar: () => void;
}

/**
 * Baixa do crédito da máquina: dá por recebido o que a adquirente depositou.
 *
 * O valor que caiu na conta pode ser menor que a venda do dia, porque a
 * adquirente desconta a taxa antes de creditar. Quando isso acontece, o
 * formulário já mostra a diferença, que é o que mais confunde o lojista ao
 * bater o extrato.
 */
export function FormularioRecebimento({ registro, aoFechar }: PropsFormularioRecebimento) {
  const { rascunho, atualizar, erro, definirErro } = useRascunho({
    data: hojeISO(),
    valor: registro.creditoRecebidoValor ?? registro.credito,
  });
  const [salvando, definirSalvando] = useState(false);
  const diferenca = registro.credito - rascunho.valor;

  const confirmar = async () => {
    if (!rascunho.data) {
      definirErro('Informe o dia em que o dinheiro caiu na conta.');
      return;
    }

    definirSalvando(true);
    try {
      await salvarFechamento({
        ...registro,
        creditoRecebidoEm: rascunho.data,
        creditoRecebidoValor: rascunho.valor,
      });
      aoFechar();
    } finally {
      definirSalvando(false);
    }
  };

  return (
    <Gaveta
      aberta
      titulo="Crédito recebido"
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="principal" onClick={confirmar} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Marcar como recebido'}
          </Botao>
        </>
      }
    >
      {erro && (
        <p className="campo__erro" role="alert" style={{ marginBottom: 12 }}>
          {erro}
        </p>
      )}

      <p style={{ color: 'var(--suave)', fontSize: '0.85rem', marginTop: 0 }}>
        Venda no crédito de {formatarData(registro.data)}: {formatarDinheiro(registro.credito)}.
      </p>

      <Campo rotulo="Caiu na conta em">
        {(id) => (
          <EntradaData
            id={id}
            valor={rascunho.data}
            aoMudar={(valor) => atualizar('data', valor || hojeISO())}
          />
        )}
      </Campo>

      <Campo
        rotulo="Valor que caiu"
        dica="Menor que a venda quando a máquina desconta a taxa antes"
      >
        {(id) => (
          <EntradaDinheiro
            id={id}
            valor={rascunho.valor}
            aoMudar={(valor) => atualizar('valor', valor)}
          />
        )}
      </Campo>

      <div className="cartao" style={{ background: 'var(--superficie-2)' }}>
        <Ficha rotulo="Venda no crédito" valor={formatarDinheiro(registro.credito)} />
        <Ficha rotulo="Depositado" valor={formatarDinheiro(rascunho.valor)} cor="var(--acento)" />
        <Ficha
          rotulo="Diferença (taxa da máquina)"
          valor={formatarDinheiro(Math.max(0, diferenca))}
        />
      </div>
    </Gaveta>
  );
}
