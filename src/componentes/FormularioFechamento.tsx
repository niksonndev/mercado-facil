import { useState } from 'react';
import { resumoFechamento } from '../dominio/calculos';
import { formatarDinheiro } from '../dominio/dinheiro';
import { formatarDataComDia, hojeISO } from '../dominio/datas';
import { FIADO, FORMAS_PAGAMENTO } from '../dominio/categorias';
import type { FechamentoCaixa } from '../dominio/tipos';
import { db } from '../dados/db';
import { salvarFechamento } from '../dados/repositorio';
import { Botao, Ficha } from './base';
import { AreaTexto, Campo, Dupla, EntradaData, EntradaDinheiro } from './campos';
import { Gaveta } from './Gaveta';
import { useRascunho } from './rascunho';

export interface PropsFormularioFechamento {
  registro: FechamentoCaixa;
  aoFechar: () => void;
}

/**
 * Fechamento de um dia: o troco que começou o caixa e o que foi vendido em cada
 * forma de pagamento, mais o fiado.
 */
export function FormularioFechamento({ registro, aoFechar }: PropsFormularioFechamento) {
  const { rascunho, atualizar, erro, definirErro } = useRascunho(registro);
  const [salvando, definirSalvando] = useState(false);
  const resumo = resumoFechamento(rascunho);
  const novo = registro.data === '' || registro.criadoEm === '';

  const salvar = async () => {
    if (!rascunho.data) {
      definirErro('Informe a data do fechamento.');
      return;
    }

    definirSalvando(true);
    try {
      const existente = await db.fechamentos.where('data').equals(rascunho.data).first();
      if (existente && existente.id !== rascunho.id) {
        definirErro(
          `Já existe um fechamento em ${formatarDataComDia(rascunho.data)}. Abra o dia na lista para corrigir.`,
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
      </div>
    </Gaveta>
  );
}
