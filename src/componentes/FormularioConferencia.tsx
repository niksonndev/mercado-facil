import { useState } from 'react';
import { formatarDinheiro } from '../dominio/dinheiro';
import { formatarData, hojeISO } from '../dominio/datas';
import type { Competencia, ConferenciaSaldo, ContaBancaria, DataISO, Centavos } from '../dominio/tipos';
import { salvarConferencia } from '../dados/repositorio';
import { Botao, Ficha } from './base';
import { AreaTexto, Campo, EntradaData, EntradaDinheiro } from './campos';
import { Gaveta } from './Gaveta';
import { useRascunho } from './rascunho';

export interface PropsFormularioConferencia {
  conta: ContaBancaria;
  competencia: Competencia;
  /** O que o app calculou para o fim do mês. */
  esperado: Centavos;
  registro: ConferenciaSaldo | null;
  aoFechar: () => void;
}

/**
 * Conferência do extrato: o dono informa o saldo que o banco mostrou e o app
 * diz quanto ficou de diferença para o que ele calculou.
 *
 * A diferença é o que interessa: pode ser lançamento esquecido, taxa que não foi
 * registrada, ou dinheiro que não deveria ter saído.
 */
export function FormularioConferencia({
  conta,
  competencia,
  esperado,
  registro,
  aoFechar,
}: PropsFormularioConferencia) {
  const { rascunho, atualizar, erro, definirErro } = useRascunho({
    saldoExtrato: registro?.saldoExtrato ?? esperado,
    data: (registro?.data ?? hojeISO()) as DataISO,
    observacao: registro?.observacao ?? '',
  });
  const [salvando, definirSalvando] = useState(false);
  const diferenca = rascunho.saldoExtrato - esperado;

  const salvar = async () => {
    if (!rascunho.data) {
      definirErro('Informe o dia do extrato.');
      return;
    }

    definirSalvando(true);
    try {
      await salvarConferencia({
        contaBancariaId: conta.id,
        competencia,
        saldoExtrato: rascunho.saldoExtrato,
        data: rascunho.data,
        observacao: rascunho.observacao,
      });
      aoFechar();
    } finally {
      definirSalvando(false);
    }
  };

  return (
    <Gaveta
      aberta
      titulo={`Conferir ${conta.nome}`}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="principal" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar conferência'}
          </Botao>
        </>
      }
    >
      {erro && (
        <p className="campo__erro" role="alert" style={{ marginBottom: 12 }}>
          {erro}
        </p>
      )}

      <Campo
        rotulo="Saldo do extrato"
        dica={`O app chegou em ${formatarDinheiro(esperado)}`}
      >
        {(id) => (
          <EntradaDinheiro
            id={id}
            valor={rascunho.saldoExtrato}
            aoMudar={(valor) => atualizar('saldoExtrato', valor)}
          />
        )}
      </Campo>

      <Campo rotulo="Dia do extrato">
        {(id) => (
          <EntradaData
            id={id}
            valor={rascunho.data ?? hojeISO()}
            aoMudar={(valor) => atualizar('data', valor || hojeISO())}
          />
        )}
      </Campo>

      <Campo rotulo="Observação" dica="Se não bateu, anote o que você acha que foi">
        {(id) => (
          <AreaTexto
            id={id}
            valor={rascunho.observacao}
            placeholder="Faltou lançar o PIX do fornecedor"
            aoMudar={(valor) => atualizar('observacao', valor)}
          />
        )}
      </Campo>

      <div className="cartao" style={{ background: 'var(--superficie-2)' }}>
        <Ficha rotulo="O app calculou" valor={formatarDinheiro(esperado)} />
        <Ficha rotulo="O banco mostrou" valor={formatarDinheiro(rascunho.saldoExtrato)} />
        <Ficha
          rotulo={diferenca >= 0 ? 'Sobrou no extrato' : 'Faltou no extrato'}
          valor={formatarDinheiro(Math.abs(diferenca))}
          cor={diferenca === 0 ? 'var(--acento)' : 'var(--negativo)'}
        />
        {registro?.data && (
          <span className="campo__dica">
            Conferido por último em {formatarData(registro.data)}
          </span>
        )}
      </div>
    </Gaveta>
  );
}
