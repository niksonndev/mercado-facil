import { useState } from 'react';
import { dataPrevistaCredito, resumoFechamento, rotuloPonto } from '../dominio/calculos';
import { formatarDinheiro } from '../dominio/dinheiro';
import { formatarData, formatarDataComDia, hojeISO } from '../dominio/datas';
import { FIADO, FORMAS_PAGAMENTO, PRAZOS_CREDITO } from '../dominio/categorias';
import type { FechamentoCaixa, Funcionario, PontoDeVenda, PrazoCredito } from '../dominio/tipos';
import { db } from '../dados/db';
import { salvarFechamento } from '../dados/repositorio';
import { Botao, Ficha } from './base';
import {
  AreaTexto,
  Campo,
  EntradaDinheiro,
  PilulasData,
  Selecao,
} from './campos';
import { Lancamento } from './Lancamento';
import { useRascunho } from './rascunho';

export interface PropsFormularioFechamento {
  registro: FechamentoCaixa;
  /** Pontos de venda cadastrados. Vazio é a loja de um caixa só. */
  pontos: PontoDeVenda[];
  funcionarios: Funcionario[];
  /** Verdadeiro quando é um dia que ainda não foi salvo. Muda o título. */
  novo?: boolean;
  aoFechar: () => void;
}

/**
 * Apurado de um dia, na folha verde de entrada.
 *
 * A tela chama de "apurado do dia" o que o cliente lê no ERP dele: a receita
 * do dia. Quem fecha o caixa é o ERP, o app só guarda os números.
 *
 * O valor grande do topo é o total vendido no dia, que soma as formas de
 * pagamento — por isso ele não se digita, se lê. Quando a loja tem mais de um
 * caixa, o mesmo dia é fechado uma vez por ponto de venda, cada um com a pessoa
 * que respondeu por ele.
 */
export function FormularioFechamento({
  registro,
  pontos,
  funcionarios,
  novo: ehNovo = false,
  aoFechar,
}: PropsFormularioFechamento) {
  const { rascunho, atualizar, erro, definirErro } = useRascunho(registro);
  const [salvando, definirSalvando] = useState(false);
  const resumo = resumoFechamento(rascunho);
  const novo = ehNovo;
  const ativos = funcionarios.filter((funcionario) => funcionario.ativo);

  const trocarResponsavel = (valor: string) => {
    const funcionario = ativos.find((pessoa) => pessoa.id === valor) ?? null;
    atualizar('responsavelId', funcionario?.id ?? null);
    atualizar('responsavelNome', funcionario?.nome ?? '');
  };

  const salvar = async () => {
    if (!rascunho.data) {
      definirErro('Informe a data do apurado.');
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
          `${rotuloPonto(pontos, conflito.pontoId)} já lançou o apurado de ${formatarDataComDia(
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
    <Lancamento
      titulo={novo ? 'Lançar o apurado' : 'Editar apurado'}
      rotuloValor="Vendas do dia"
      tom="receita"
      valor={resumo.vendas}
      aoMudarValor={() => undefined}
      somenteLeitura
      aoConfirmar={salvar}
      aoFechar={aoFechar}
      erro={erro || undefined}
      salvando={salvando}
      rotuloConfirmar="Salvar apurado"
      adendo={
        <div className="lanc__total">
          <Ficha
            rotulo="Entrou no caixa"
            valor={formatarDinheiro(resumo.recebido)}
            cor="var(--entra)"
          />
          <Ficha rotulo="Vendas no fiado" valor={formatarDinheiro(resumo.fiado)} />
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
      }
    >
      <Campo rotulo="Dia" icone="calendario">
        {() => (
          <PilulasData
            valor={rascunho.data}
            aoMudar={(valor) => atualizar('data', valor || hojeISO())}
          />
        )}
      </Campo>

      <Campo rotulo="Fundo de caixa" dica="troco que começou o dia" icone="carteira">
        {(id) => (
          <EntradaDinheiro
            id={id}
            valor={rascunho.fundoInicial}
            aoMudar={(valor) => atualizar('fundoInicial', valor)}
          />
        )}
      </Campo>

      {pontos.length > 0 && (
        <Campo rotulo="Ponto de venda" dica="cada caixa fecha no seu lançamento" icone="banco">
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

      {ativos.length > 0 && (
        <Campo rotulo="Responsável pelo caixa" icone="pessoa">
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

      <div className="lanc__grupo">Como entrou o dinheiro</div>

      {FORMAS_PAGAMENTO.map((forma) => (
        <Campo key={forma.valor} rotulo={forma.rotulo} icone="carteira">
          {(id) => (
            <EntradaDinheiro
              id={id}
              valor={rascunho[forma.valor]}
              aoMudar={(valor) => atualizar(forma.valor, valor)}
            />
          )}
        </Campo>
      ))}

      <Campo rotulo={FIADO.rotulo} dica="vendido na caderneta" icone="caneta">
        {(id) => (
          <EntradaDinheiro
            id={id}
            valor={rascunho.fiado}
            aoMudar={(valor) => atualizar('fiado', valor)}
          />
        )}
      </Campo>

      {rascunho.credito > 0 && (
        <Campo
          rotulo="Quando o crédito cai na conta"
          dica={`pela venda deste dia: ${formatarData(
            dataPrevistaCredito(rascunho.data, rascunho.prazoCredito),
          )}`}
          icone="banco"
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
    </Lancamento>
  );
}
