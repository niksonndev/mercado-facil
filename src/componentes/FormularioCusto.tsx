import { useState } from 'react';
import { CATEGORIAS_CUSTO, FORMAS_PAGAMENTO } from '../dominio/categorias';
import { hojeISO, mesAtual } from '../dominio/datas';
import { formatarDinheiro } from '../dominio/dinheiro';
import type { CategoriaCusto, CustoOperacional } from '../dominio/tipos';
import { salvarCusto } from '../dados/repositorio';
import { Botao, Ficha } from './base';
import {
  AreaTexto,
  Campo,
  Dupla,
  EntradaData,
  EntradaDinheiro,
  EntradaMes,
  EntradaTexto,
  Marcar,
  Selecao,
} from './campos';
import { Gaveta } from './Gaveta';
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
    <Gaveta
      aberta
      titulo={novo ? 'Novo custo operacional' : 'Editar custo'}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="principal" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar custo'}
          </Botao>
        </>
      }
    >
      {erro && (
        <p className="campo__erro" role="alert" style={{ marginBottom: 12 }}>
          {erro}
        </p>
      )}

      <Campo rotulo="Categoria">
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

      <Campo rotulo="Descrição">
        {(id) => (
          <EntradaTexto
            id={id}
            valor={rascunho.descricao}
            placeholder="Conta de energia"
            aoMudar={(valor) => atualizar('descricao', valor)}
          />
        )}
      </Campo>

      <Dupla>
        <Campo rotulo="Competência" dica="Mês a que se refere">
          {(id) => (
            <EntradaMes
              id={id}
              valor={rascunho.competencia}
              aoMudar={(valor) => atualizar('competencia', valor || mesAtual())}
            />
          )}
        </Campo>
        <Campo rotulo="Vencimento">
          {(id) => (
            <EntradaData
              id={id}
              valor={rascunho.vencimento}
              aoMudar={(valor) => atualizar('vencimento', valor || hojeISO())}
            />
          )}
        </Campo>
      </Dupla>

      <Campo rotulo="Valor previsto">
        {(id) => (
          <EntradaDinheiro
            id={id}
            valor={rascunho.valorPrevisto}
            aoMudar={(valor) => atualizar('valorPrevisto', valor)}
          />
        )}
      </Campo>

      <Marcar
        rotulo="Custo que se repete todo mês"
        dica="a tela oferece repetir na próxima competência"
        marcado={rascunho.recorrente}
        aoMudar={(marcado) => atualizar('recorrente', marcado)}
      />

      <Marcar
        rotulo="Já está pago"
        marcado={pago}
        aoMudar={(marcado) =>
          alterar(
            marcado
              ? { pagoEm: hojeISO(), valorPago: rascunho.valorPrevisto }
              : { pagoEm: null, valorPago: null, formaPagamento: null },
          )
        }
      />

      {pago && (
        <Dupla>
          <Campo rotulo="Data do pagamento">
            {(id) => (
              <EntradaData
                id={id}
                valor={rascunho.pagoEm ?? hojeISO()}
                aoMudar={(valor) => atualizar('pagoEm', valor || hojeISO())}
              />
            )}
          </Campo>
          <Campo rotulo="Valor pago">
            {(id) => (
              <EntradaDinheiro
                id={id}
                valor={rascunho.valorPago ?? rascunho.valorPrevisto}
                aoMudar={(valor) => atualizar('valorPago', valor)}
              />
            )}
          </Campo>
        </Dupla>
      )}

      {pago && (
        <>
          <Campo rotulo="Forma de pagamento">
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

          <div className="cartao" style={{ background: 'var(--superficie-2)' }}>
            <Ficha
              rotulo="Diferença entre previsto e pago"
              valor={formatarDinheiro((rascunho.valorPago ?? rascunho.valorPrevisto) - rascunho.valorPrevisto)}
            />
          </div>
        </>
      )}

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
