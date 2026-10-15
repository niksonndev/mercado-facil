import { useState } from 'react';
import {
  CATEGORIAS_DESPESA,
  FORMAS_PAGAMENTO,
  TIPOS_DESPESA,
} from '../dominio/categorias';
import { hojeISO } from '../dominio/datas';
import type { Despesa, TipoDespesa } from '../dominio/tipos';
import { salvarDespesa } from '../dados/repositorio';
import { Botao } from './base';
import {
  AreaTexto,
  Campo,
  Dupla,
  EntradaData,
  EntradaDinheiro,
  EntradaTexto,
  Marcar,
  Selecao,
} from './campos';
import { Gaveta } from './Gaveta';
import { useRascunho } from './rascunho';

export interface PropsFormularioDespesa {
  registro: Despesa;
  aoFechar: () => void;
}

/** Retirada de caixa e pagamento diverso. */
export function FormularioDespesa({ registro, aoFechar }: PropsFormularioDespesa) {
  const { rascunho, atualizar, alterar, erro, definirErro } = useRascunho(registro);
  const [salvando, definirSalvando] = useState(false);
  const novo = !registro.descricao;

  const trocarTipo = (tipo: TipoDespesa) => {
    // Retirada de caixa, por definição, sai do dinheiro da gaveta.
    alterar({
      tipo,
      ...(tipo === 'retirada'
        ? { retiradaDoCaixa: true, formaPagamento: 'dinheiro' as const }
        : {}),
    });
  };

  const salvar = async () => {
    if (!rascunho.descricao.trim()) {
      definirErro('Descreva a despesa.');
      return;
    }
    if (rascunho.valor <= 0) {
      definirErro('O valor precisa ser maior que zero.');
      return;
    }

    definirSalvando(true);
    try {
      await salvarDespesa(rascunho);
      aoFechar();
    } finally {
      definirSalvando(false);
    }
  };

  return (
    <Gaveta
      aberta
      titulo={novo ? 'Nova despesa' : 'Editar despesa'}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="principal" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar despesa'}
          </Botao>
        </>
      }
    >
      {erro && (
        <p className="campo__erro" role="alert" style={{ marginBottom: 12 }}>
          {erro}
        </p>
      )}

      <Campo rotulo="Tipo">
        {() => (
          <div className="filtros">
            {TIPOS_DESPESA.map((tipo) => (
              <button
                key={tipo.valor}
                type="button"
                className="filtro"
                aria-pressed={rascunho.tipo === tipo.valor}
                onClick={() => trocarTipo(tipo.valor)}
              >
                {tipo.rotulo}
              </button>
            ))}
          </div>
        )}
      </Campo>

      <Campo rotulo="Descrição">
        {(id) => (
          <EntradaTexto
            id={id}
            valor={rascunho.descricao}
            placeholder={
              rascunho.tipo === 'retirada' ? 'Retirada do dono' : 'Conserto do freezer'
            }
            aoMudar={(valor) => atualizar('descricao', valor)}
          />
        )}
      </Campo>

      <Dupla>
        <Campo rotulo="Valor">
          {(id) => (
            <EntradaDinheiro
              id={id}
              valor={rascunho.valor}
              aoMudar={(valor) => atualizar('valor', valor)}
            />
          )}
        </Campo>
        <Campo rotulo="Data">
          {(id) => (
            <EntradaData
              id={id}
              valor={rascunho.data}
              aoMudar={(valor) => atualizar('data', valor || hojeISO())}
            />
          )}
        </Campo>
      </Dupla>

      <Dupla>
        <Campo rotulo="Categoria">
          {(id) => (
            <Selecao
              id={id}
              valor={rascunho.categoria}
              aoMudar={(valor) => atualizar('categoria', valor)}
              opcoes={CATEGORIAS_DESPESA.map((categoria) => ({
                valor: categoria.valor,
                rotulo: categoria.rotulo,
              }))}
            />
          )}
        </Campo>
        <Campo rotulo="Forma de pagamento">
          {(id) => (
            <Selecao
              id={id}
              valor={rascunho.formaPagamento}
              aoMudar={(valor) => atualizar('formaPagamento', valor)}
              opcoes={FORMAS_PAGAMENTO.map((forma) => ({
                valor: forma.valor,
                rotulo: forma.rotulo,
              }))}
            />
          )}
        </Campo>
      </Dupla>

      <Campo rotulo="Beneficiário" dica="Para quem foi pago">
        {(id) => (
          <EntradaTexto
            id={id}
            valor={rascunho.beneficiario}
            placeholder="Refrigeração Silva"
            aoMudar={(valor) => atualizar('beneficiario', valor)}
          />
        )}
      </Campo>

      <Marcar
        rotulo="Saiu do dinheiro do caixa"
        dica="desconta do dinheiro que deveria estar na gaveta"
        marcado={rascunho.retiradaDoCaixa}
        aoMudar={(marcado) => atualizar('retiradaDoCaixa', marcado)}
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
