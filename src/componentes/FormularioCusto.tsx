import { useState } from 'react';
import { CATEGORIAS_CUSTO, FORMAS_PAGAMENTO } from '../dominio/categorias';
import { hojeISO, mesAtual } from '../dominio/datas';
import { formatarDinheiro } from '../dominio/dinheiro';
import type { CategoriaCusto, CustoOperacional } from '../dominio/tipos';
import { salvarCusto } from '../dados/repositorio';
import { Anexo } from './Anexo';
import { Ficha } from './base';
import {
  AreaTexto,
  Campo,
  Chave,
  EntradaData,
  EntradaDinheiro,
  EntradaMes,
  EntradaTexto,
  Selecao,
} from './campos';
import { Lancamento } from './Lancamento';
import { useRascunho } from './rascunho';

export interface PropsFormularioCusto {
  registro: CustoOperacional;
  aoFechar: () => void;
}

const ROTULO_POR_CATEGORIA = new Map(
  CATEGORIAS_CUSTO.map((categoria) => [categoria.valor, categoria.rotulo]),
);

/** Custo fixo do mês: aluguel, energia, água, contabilidade… */
export function FormularioCusto({ registro, aoFechar }: PropsFormularioCusto) {
  const { rascunho, atualizar, alterar, erro, definirErro } = useRascunho(registro);
  const [salvando, definirSalvando] = useState(false);
  const pago = Boolean(rascunho.pagoEm);
  const novo = !registro.descricao;

  const trocarCategoria = (categoria: CategoriaCusto) => {
    // Sugere a descrição quando o campo ainda está vazio ou é de outra categoria.
    const descricaoAutomatica =
      !rascunho.descricao ||
      [...ROTULO_POR_CATEGORIA.values()].includes(rascunho.descricao);

    alterar({
      categoria,
      ...(descricaoAutomatica
        ? { descricao: ROTULO_POR_CATEGORIA.get(categoria) ?? '' }
        : {}),
    });
  };

  const salvar = async () => {
    if (!rascunho.descricao.trim()) {
      definirErro('Descreva o custo.');
      return;
    }
    if (rascunho.valorPrevisto <= 0) {
      definirErro('O valor precisa ser maior que zero.');
      return;
    }

    definirSalvando(true);
    try {
      await salvarCusto({
        ...rascunho,
        valorPago: pago ? (rascunho.valorPago ?? rascunho.valorPrevisto) : null,
        formaPagamento: pago ? (rascunho.formaPagamento ?? 'pix') : null,
      });
      aoFechar();
    } finally {
      definirSalvando(false);
    }
  };

  return (
    <Lancamento
      titulo={novo ? 'Novo custo' : 'Editar custo'}
      rotuloValor="Valor previsto"
      tom="despesa"
      valor={rascunho.valorPrevisto}
      aoMudarValor={(valor) => atualizar('valorPrevisto', valor)}
      aoConfirmar={salvar}
      aoFechar={aoFechar}
      erro={erro || undefined}
      salvando={salvando}
      rotuloConfirmar="Salvar custo"
      adendo={
        pago ? (
          <div className="lanc__total">
            <Ficha
              rotulo="Diferença entre previsto e pago"
              valor={formatarDinheiro(
                (rascunho.valorPago ?? rascunho.valorPrevisto) - rascunho.valorPrevisto,
              )}
            />
          </div>
        ) : undefined
      }
    >
      <Campo rotulo="Categoria" icone="marcador">
        {(id) => (
          <Selecao
            id={id}
            valor={rascunho.categoria}
            aoMudar={trocarCategoria}
            opcoes={CATEGORIAS_CUSTO.map((categoria) => ({
              valor: categoria.valor,
              rotulo: categoria.rotulo,
            }))}
          />
        )}
      </Campo>

      <Campo rotulo="Descrição" icone="caneta">
        {(id) => (
          <EntradaTexto
            id={id}
            valor={rascunho.descricao}
            placeholder="Conta de energia"
            aoMudar={(valor) => atualizar('descricao', valor)}
          />
        )}
      </Campo>

      <Campo rotulo="Competência" icone="calendario" dica="mês a que se refere">
        {(id) => (
          <EntradaMes
            id={id}
            valor={rascunho.competencia}
            aoMudar={(valor) => atualizar('competencia', valor || mesAtual())}
          />
        )}
      </Campo>

      <Campo rotulo="Vencimento" icone="calendario">
        {(id) => (
          <EntradaData
            id={id}
            valor={rascunho.vencimento}
            aoMudar={(valor) => atualizar('vencimento', valor || hojeISO())}
          />
        )}
      </Campo>

      <Chave
        rotulo="Repete todo mês"
        dica="a tela oferece repetir na próxima competência"
        icone="repetir"
        marcado={rascunho.recorrente}
        aoMudar={(marcado) => atualizar('recorrente', marcado)}
      />

      <Chave
        rotulo="Já está pago"
        icone="check-circulo"
        marcado={pago}
        tom="var(--entra)"
        aoMudar={(marcado) =>
          alterar(
            marcado
              ? { pagoEm: hojeISO(), valorPago: rascunho.valorPrevisto }
              : { pagoEm: null, valorPago: null, formaPagamento: null },
          )
        }
      />

      {pago && (
        <>
          <Campo rotulo="Pago em" icone="calendario">
            {(id) => (
              <EntradaData
                id={id}
                valor={rascunho.pagoEm ?? hojeISO()}
                aoMudar={(valor) => atualizar('pagoEm', valor || hojeISO())}
              />
            )}
          </Campo>

          <Campo rotulo="Valor pago" icone="carteira">
            {(id) => (
              <EntradaDinheiro
                id={id}
                valor={rascunho.valorPago ?? rascunho.valorPrevisto}
                aoMudar={(valor) => atualizar('valorPago', valor)}
              />
            )}
          </Campo>

          <Campo rotulo="Forma de pagamento" icone="carteira">
            {(id) => (
              <Selecao
                id={id}
                valor={rascunho.formaPagamento ?? 'pix'}
                aoMudar={(valor) => atualizar('formaPagamento', valor)}
                opcoes={FORMAS_PAGAMENTO.map((forma) => ({
                  valor: forma.valor,
                  rotulo: forma.rotulo,
                }))}
              />
            )}
          </Campo>
        </>
      )}

      <Anexo
        valor={rascunho.anexo}
        aoMudar={(valor) => atualizar('anexo', valor)}
        rotulo="Anexar a conta (foto ou print)"
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
    </Lancamento>
  );
}
