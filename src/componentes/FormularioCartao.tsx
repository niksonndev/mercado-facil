import { useState } from 'react';
import { melhorDiaDeCompra } from '../dominio/calculos';
import type { Cartao } from '../dominio/tipos';
import { salvarCartao } from '../dados/repositorio';
import { Botao, Ficha } from './base';
import { Campo, EntradaTexto, Marcar, Selecao } from './campos';
import { Gaveta } from './Gaveta';
import { useRascunho } from './rascunho';

export interface PropsFormularioCartao {
  registro: Cartao;
  aoFechar: () => void;
}

/** Os 31 dias, para não digitar número errado no celular. */
const DIAS = Array.from({ length: 31 }, (_, indice) => ({
  valor: String(indice + 1),
  rotulo: String(indice + 1),
}));

/**
 * Cadastro do cartão da empresa.
 *
 * São só quatro informações, e é o que basta para o app calcular o vencimento
 * da fatura e responder qual é o melhor dia de compra.
 */
export function FormularioCartao({ registro, aoFechar }: PropsFormularioCartao) {
  const { rascunho, atualizar, erro, definirErro } = useRascunho(registro);
  const [salvando, definirSalvando] = useState(false);
  const novo = !registro.nome;

  const salvar = async () => {
    if (!rascunho.nome.trim()) {
      definirErro('Informe o nome do cartão, como você o chama (Cartão da loja).');
      return;
    }

    definirSalvando(true);
    try {
      await salvarCartao(rascunho);
      aoFechar();
    } finally {
      definirSalvando(false);
    }
  };

  return (
    <Gaveta
      aberta
      titulo={novo ? 'Novo cartão' : 'Editar cartão'}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="principal" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar cartão'}
          </Botao>
        </>
      }
    >
      {erro && (
        <p className="campo__erro" role="alert" style={{ marginBottom: 12 }}>
          {erro}
        </p>
      )}

      <Campo rotulo="Nome" dica="Está na fatura ou no app do banco">
        {(id) => (
          <EntradaTexto
            id={id}
            valor={rascunho.nome}
            placeholder="Cartão da loja"
            aoMudar={(valor) => atualizar('nome', valor)}
          />
        )}
      </Campo>

      <Campo rotulo="Dia do fechamento" dica="O último dia que entra na fatura do mês">
        {(id) => (
          <Selecao
            id={id}
            valor={String(rascunho.diaFechamento)}
            opcoes={DIAS}
            aoMudar={(valor) => atualizar('diaFechamento', Number(valor))}
          />
        )}
      </Campo>

      <Campo rotulo="Dia do vencimento" dica="Quando a fatura precisa ser paga">
        {(id) => (
          <Selecao
            id={id}
            valor={String(rascunho.diaVencimento)}
            opcoes={DIAS}
            aoMudar={(valor) => atualizar('diaVencimento', Number(valor))}
          />
        )}
      </Campo>

      <Marcar
        rotulo="Cartão em uso"
        dica="os inativos ficam no histórico e fora dos lançamentos novos"
        marcado={rascunho.ativo}
        aoMudar={(marcado) => atualizar('ativo', marcado)}
      />

      <div className="cartao" style={{ background: 'var(--superficie-2)' }}>
        <Ficha
          rotulo="Melhor dia de compra"
          valor={`dia ${melhorDiaDeCompra(rascunho)}`}
          cor="var(--acento)"
        />
      </div>
    </Gaveta>
  );
}
