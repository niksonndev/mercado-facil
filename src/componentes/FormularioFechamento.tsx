import { useState } from 'react';
import { dataPrevistaCredito, resumoFechamento, rotuloPonto } from '../dominio/calculos';
import { formatarDinheiro } from '../dominio/dinheiro';
import { formatarData, formatarDataComDia, hojeISO } from '../dominio/datas';
import { FIADO, FORMAS_PAGAMENTO, PRAZOS_CREDITO } from '../dominio/categorias';
import type { FechamentoCaixa, Funcionario, PontoDeVenda, PrazoCredito } from '../dominio/tipos';
import { db } from '../dados/db';
import { salvarFechamento } from '../dados/repositorio';
import { Botao, Ficha } from './base';
import { AreaTexto, Campo, Dupla, EntradaData, EntradaDinheiro, Selecao } from './campos';
import { Gaveta } from './Gaveta';
import { useRascunho } from './rascunho';

export interface PropsFormularioFechamento {
  registro: FechamentoCaixa;
  /** Pontos de venda cadastrados. Vazio é a loja de um caixa só. */
  pontos: PontoDeVenda[];
  funcionarios: Funcionario[];
  aoFechar: () => void;
}

/**
 * Fechamento de um dia: o troco que começou o caixa e o que foi vendido em cada
 * forma de pagamento, mais o fiado.
 *
 * Quando a loja tem mais de um caixa, o mesmo dia é fechado uma vez por ponto
 * de venda, cada um com a pessoa que respondeu por ele.
 */
export function FormularioFechamento({
  registro,
  pontos,
  funcionarios,
  aoFechar,
}: PropsFormularioFechamento) {
  const { rascunho, atualizar, erro, definirErro } = useRascunho(registro);
  const [salvando, definirSalvando] = useState(false);
  const resumo = resumoFechamento(rascunho);
  const novo = registro.data === '' || registro.criadoEm === '';
  const ativos = funcionarios.filter((funcionario) => funcionario.ativo);

  const trocarResponsavel = (valor: string) => {
    const funcionario = ativos.find((pessoa) => pessoa.id === valor) ?? null;
    atualizar('responsavelId', funcionario?.id ?? null);
    atualizar('responsavelNome', funcionario?.nome ?? '');
  };

  const salvar = async () => {
    if (!rascunho.data) {
      definirErro('Informe a data do fechamento.');
      return;
    }

    definirSalvando(true);
    try {
      // Um fechamento por dia e por caixa: o segundo caixa fecha o mesmo dia.
      const doDia = await db.fechamentos.where('data').equals(rascunho.data).toArray();
      const conflito = doDia.find(
        (outro) =>
          outro.id !== rascunho.id && (outro.pontoId ?? '') === (rascunho.pontoId ?? ''),
      );

      if (conflito) {
        definirErro(
          `${rotuloPonto(pontos, conflito.pontoId)} já fechou ${formatarDataComDia(
            rascunho.data,
          )}. Abra o dia na lista para corrigir.`,
        );
        return;
      }

      await salvarFechamento(rascunho);
      aoFechar();
    } finally {
      definirSalvando(false);
    }
  };

  return (
    <Gaveta
      aberta
      titulo={novo ? 'Fechar o dia' : 'Editar fechamento'}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="principal" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar fechamento'}
          </Botao>
        </>
      }
    >
      {erro && (
        <p className="campo__erro" role="alert" style={{ marginBottom: 12 }}>
          {erro}
        </p>
      )}

      <Dupla>
        <Campo rotulo="Dia do movimento">
          {(id) => (
            <EntradaData
              id={id}
              valor={rascunho.data}
              aoMudar={(valor) => atualizar('data', valor || hojeISO())}
            />
          )}
        </Campo>
        <Campo rotulo="Fundo de caixa" dica="Troco que começou o dia">
          {(id) => (
            <EntradaDinheiro
              id={id}
              valor={rascunho.fundoInicial}
              aoMudar={(valor) => atualizar('fundoInicial', valor)}
            />
          )}
        </Campo>
      </Dupla>

      {pontos.length > 0 && (
        <Campo rotulo="Ponto de venda" dica="Cada caixa fecha o dia no seu lançamento">
          {(id) => (
            <Selecao<string>
              id={id}
              valor={rascunho.pontoId ?? ''}
              vazio="Sem ponto de venda"
              opcoes={pontos.map((ponto) => ({ valor: ponto.id, rotulo: ponto.nome }))}
              aoMudar={(valor) => atualizar('pontoId', valor || null)}
            />
          )}
        </Campo>
      )}

      {rascunho.credito > 0 && (
        <Campo
          rotulo="Quando o crédito cai na conta"
          dica={`Pela venda de hoje: ${formatarData(
            dataPrevistaCredito(rascunho.data, rascunho.prazoCredito),
          )}`}
        >
          {(id) => (
            <Selecao<PrazoCredito>
              id={id}
              valor={rascunho.prazoCredito}
              opcoes={PRAZOS_CREDITO.map((prazo) => ({
                valor: prazo.valor,
                rotulo: prazo.rotulo,
              }))}
              aoMudar={(valor) => atualizar('prazoCredito', valor)}
            />
          )}
        </Campo>
      )}

      {ativos.length > 0 && (
        <Campo rotulo="Responsável pelo caixa" dica="Quem respondeu por esse caixa na data">
          {(id) => (
            <Selecao<string>
              id={id}
              valor={rascunho.responsavelId ?? ''}
              vazio="Não informado"
              opcoes={ativos.map((funcionario) => ({
                valor: funcionario.id,
                rotulo: funcionario.cargo
                  ? `${funcionario.nome} (${funcionario.cargo})`
                  : funcionario.nome,
              }))}
              aoMudar={trocarResponsavel}
            />
          )}
        </Campo>
      )}

      {FORMAS_PAGAMENTO.map((forma) => (
        <Campo key={forma.valor} rotulo={forma.rotulo}>
          {(id) => (
            <EntradaDinheiro
              id={id}
              valor={rascunho[forma.valor]}
              aoMudar={(valor) => atualizar(forma.valor, valor)}
            />
          )}
        </Campo>
      ))}

      <Campo rotulo={FIADO.rotulo} dica="Vendido na caderneta, ainda não entrou">
        {(id) => (
          <EntradaDinheiro
            id={id}
            valor={rascunho.fiado}
            aoMudar={(valor) => atualizar('fiado', valor)}
          />
        )}
      </Campo>

      <Campo rotulo="Observação">
        {(id) => (
          <AreaTexto
            id={id}
            valor={rascunho.observacao}
            placeholder="Faltou luz à tarde, festival na rua…"
            aoMudar={(valor) => atualizar('observacao', valor)}
          />
        )}
      </Campo>

      <div className="cartao" style={{ background: 'var(--superficie-2)' }}>
        <Ficha rotulo="Entrou no caixa" valor={formatarDinheiro(resumo.recebido)} cor="var(--acento)" />
        <Ficha rotulo="Vendas no fiado" valor={formatarDinheiro(resumo.fiado)} />
        <Ficha rotulo="Vendas do dia" valor={formatarDinheiro(resumo.vendas)} />
        {rascunho.credito > 0 && (
          <Ficha
            rotulo={
              rascunho.creditoRecebidoEm
                ? `Crédito recebido em ${formatarData(rascunho.creditoRecebidoEm)}`
                : 'Crédito cai na conta em'
            }
            valor={
              rascunho.creditoRecebidoEm
                ? formatarDinheiro(rascunho.creditoRecebidoValor ?? rascunho.credito)
                : formatarData(dataPrevistaCredito(rascunho.data, rascunho.prazoCredito))
            }
          />
        )}

        {rascunho.creditoRecebidoEm && (
          <Botao
            pequeno
            variante="fantasma"
            onClick={() => {
              // Caminho de volta de quem marcou o crédito como recebido por engano.
              atualizar('creditoRecebidoEm', null);
              atualizar('creditoRecebidoValor', null);
            }}
          >
            Desfazer o recebimento
          </Botao>
        )}
      </div>
    </Gaveta>
  );
}
