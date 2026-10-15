import { useState } from 'react';
import {
  CATEGORIAS_DESPESA,
  FORMAS_PAGAMENTO,
  TIPOS_DESPESA,
} from '../dominio/categorias';
import { formatarData, hojeISO } from '../dominio/datas';
import { formatarDinheiro } from '../dominio/dinheiro';
import type { Despesa, TipoDespesa } from '../dominio/tipos';
import { salvarDespesa } from '../dados/repositorio';
import { Anexo } from './Anexo';
import { Ficha } from './base';
import { AreaTexto, Campo, Chave, EntradaTexto, PilulasData, Selecao } from './campos';
import { Lancamento } from './Lancamento';
import { useRascunho } from './rascunho';

export interface PropsFormularioDespesa {
  registro: Despesa;
  aoFechar: () => void;
}

/**
 * Retirada de caixa e pagamento diverso, na folha de lançamento.
 *
 * A ordem das linhas segue o que a mão procura: primeiro o que já vem
 * respondido (saiu do caixa, data de hoje), depois o que só a pessoa sabe
 * (descrição, valor, categoria).
 */
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
    <Lancamento
      titulo={novo ? 'Nova despesa' : 'Editar despesa'}
      rotuloValor="Valor da despesa"
      tom="despesa"
      valor={rascunho.valor}
      aoMudarValor={(valor) => atualizar('valor', valor)}
      aoConfirmar={salvar}
      aoFechar={aoFechar}
      erro={erro || undefined}
      salvando={salvando}
      rotuloConfirmar="Salvar despesa"
      adendo={
        <div className="lanc__total">
          <Ficha rotulo="Valor" valor={formatarDinheiro(rascunho.valor)} />
          <Ficha rotulo="Data" valor={formatarData(rascunho.data)} />
          <Ficha
            rotulo="Sai do dinheiro da gaveta"
            valor={rascunho.retiradaDoCaixa ? 'Sim' : 'Não'}
            cor={rascunho.retiradaDoCaixa ? 'var(--sai)' : undefined}
          />
        </div>
      }
    >
      <Chave
        rotulo="Saiu do dinheiro do caixa"
        dica="desconta do dinheiro que deveria estar na gaveta"
        icone="check-circulo"
        tom="var(--sai)"
        marcado={rascunho.retiradaDoCaixa}
        aoMudar={(marcado) => atualizar('retiradaDoCaixa', marcado)}
      />

      <Campo rotulo="Data" icone="calendario">
        {() => (
          <PilulasData
            valor={rascunho.data}
            aoMudar={(valor) => atualizar('data', valor || hojeISO())}
          />
        )}
      </Campo>

      <Campo rotulo="Descrição" icone="microfone">
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

      <Campo rotulo="Tipo" icone="marcador">
        {() => (
          <div className="pilulas">
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

      <Campo rotulo="Categoria" icone="marcador">
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

      <Campo rotulo="Forma de pagamento" icone="carteira">
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

      <Campo rotulo="Beneficiário" dica="para quem foi pago" icone="pessoa">
        {(id) => (
          <EntradaTexto
            id={id}
            valor={rascunho.beneficiario}
            placeholder="Refrigeração Silva"
            aoMudar={(valor) => atualizar('beneficiario', valor)}
          />
        )}
      </Campo>

      <Anexo valor={rascunho.anexo} aoMudar={(valor) => atualizar('anexo', valor)} />

      <Chave
        rotulo="Despesa fixa"
        dica="todo mês a tela oferece lançar essa despesa no mês seguinte"
        icone="repetir"
        tom="var(--acento)"
        marcado={rascunho.fixa}
        aoMudar={(marcado) => atualizar('fixa', marcado)}
      />

      <Campo rotulo="Observação" icone="caneta">
        {(id) => (
          <AreaTexto
            id={id}
            valor={rascunho.observacao}
            placeholder="O que foi pago, com quem falou…"
            aoMudar={(valor) => atualizar('observacao', valor)}
          />
        )}
      </Campo>
    </Lancamento>
  );
}
