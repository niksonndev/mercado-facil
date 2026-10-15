import { useState } from 'react';
import type { ContaBancaria } from '../dominio/tipos';
import { salvarContaBancaria } from '../dados/repositorio';
import { Botao } from './base';
import { AreaTexto, Campo, Dupla, EntradaData, EntradaDinheiro, EntradaTexto, Marcar } from './campos';
import { Gaveta } from './Gaveta';
import { useRascunho } from './rascunho';

export interface PropsFormularioContaBancaria {
  registro: ContaBancaria;
  aoFechar: () => void;
}

/**
 * Cadastro da conta bancária da loja.
 *
 * O saldo inicial é o ponto de partida da conferência: é o saldo que estava no
 * extrato no dia informado. Sem ele, o app não tem com o que comparar.
 */
export function FormularioContaBancaria({
  registro,
  aoFechar,
}: PropsFormularioContaBancaria) {
  const { rascunho, atualizar, erro, definirErro } = useRascunho(registro);
  const [salvando, definirSalvando] = useState(false);
  const novo = !registro.nome;

  const salvar = async () => {
    if (!rascunho.nome.trim()) {
      definirErro('Informe um nome para a conta (Conta da loja).');
      return;
    }

    definirSalvando(true);
    try {
      await salvarContaBancaria(rascunho);
      aoFechar();
    } finally {
      definirSalvando(false);
    }
  };

  return (
    <Gaveta
      aberta
      titulo={novo ? 'Nova conta bancária' : 'Editar conta bancária'}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="principal" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar conta'}
          </Botao>
        </>
      }
    >
      {erro && (
        <p className="campo__erro" role="alert" style={{ marginBottom: 12 }}>
          {erro}
        </p>
      )}

      <Campo rotulo="Nome da conta" dica="Como você a chama no dia a dia">
        {(id) => (
          <EntradaTexto
            id={id}
            valor={rascunho.nome}
            placeholder="Conta da loja"
            aoMudar={(valor) => atualizar('nome', valor)}
          />
        )}
      </Campo>

      <Campo rotulo="Banco">
        {(id) => (
          <EntradaTexto
            id={id}
            valor={rascunho.banco}
            placeholder="Banco do Brasil"
            aoMudar={(valor) => atualizar('banco', valor)}
          />
        )}
      </Campo>

      <Dupla>
        <Campo rotulo="Agência">
          {(id) => (
            <EntradaTexto
              id={id}
              valor={rascunho.agencia}
              placeholder="1234-5"
              aoMudar={(valor) => atualizar('agencia', valor)}
            />
          )}
        </Campo>
        <Campo rotulo="Conta">
          {(id) => (
            <EntradaTexto
              id={id}
              valor={rascunho.numero}
              placeholder="00012345-6"
              aoMudar={(valor) => atualizar('numero', valor)}
            />
          )}
        </Campo>
      </Dupla>

      <Dupla>
        <Campo rotulo="Saldo inicial" dica="O que aparecia no extrato nesse dia">
          {(id) => (
            <EntradaDinheiro
              id={id}
              valor={rascunho.saldoInicial}
              aoMudar={(valor) => atualizar('saldoInicial', valor)}
            />
          )}
        </Campo>
        <Campo rotulo="Data do saldo">
          {(id) => (
            <EntradaData
              id={id}
              valor={rascunho.dataSaldoInicial}
              aoMudar={(valor) => atualizar('dataSaldoInicial', valor || rascunho.dataSaldoInicial)}
            />
          )}
        </Campo>
      </Dupla>

      <Marcar
        rotulo="Conta em uso"
        dica="a conferência do mês é feita só para as contas em uso"
        marcado={rascunho.ativo}
        aoMudar={(marcado) => atualizar('ativo', marcado)}
      />

      <Campo rotulo="Observação">
        {(id) => (
          <AreaTexto
            id={id}
            valor={rascunho.observacao}
            aoMudar={(valor) => atualizar('observacao', valor)}
          />
        )}
      </Campo>
    </Gaveta>
  );
}
