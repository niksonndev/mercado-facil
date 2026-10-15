import { useState } from 'react';
import type { PontoDeVenda } from '../dominio/tipos';
import { salvarPonto } from '../dados/repositorio';
import { Botao } from './base';
import { Campo, EntradaTexto, Marcar } from './campos';
import { Gaveta } from './Gaveta';
import { useRascunho } from './rascunho';

export interface PropsFormularioPonto {
  registro: PontoDeVenda;
  aoFechar: () => void;
}

/**
 * Cadastro de um ponto de venda (caixa).
 *
 * Só quem tem mais de um caixa na loja precisa disso: o mercadinho de um caixa
 * só fecha o dia sem cadastrar nada.
 */
export function FormularioPonto({ registro, aoFechar }: PropsFormularioPonto) {
  const { rascunho, atualizar, erro, definirErro } = useRascunho(registro);
  const [salvando, definirSalvando] = useState(false);
  const novo = !registro.nome;

  const salvar = async () => {
    if (!rascunho.nome.trim()) {
      definirErro('Informe o nome do caixa (por exemplo, Caixa 1).');
      return;
    }

    definirSalvando(true);
    try {
      await salvarPonto(rascunho);
      aoFechar();
    } finally {
      definirSalvando(false);
    }
  };

  return (
    <Gaveta
      aberta
      titulo={novo ? 'Novo ponto de venda' : 'Editar ponto de venda'}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="principal" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar ponto de venda'}
          </Botao>
        </>
      }
    >
      {erro && (
        <p className="campo__erro" role="alert" style={{ marginBottom: 12 }}>
          {erro}
        </p>
      )}

      <Campo rotulo="Nome do caixa" dica="Como você chama ele no balcão">
        {(id) => (
          <EntradaTexto
            id={id}
            valor={rascunho.nome}
            placeholder="Caixa 1"
            aoMudar={(valor) => atualizar('nome', valor)}
          />
        )}
      </Campo>

      <Marcar
        rotulo="Caixa em uso"
        dica="os inativos ficam no histórico e fora dos fechamentos novos"
        marcado={rascunho.ativo}
        aoMudar={(marcado) => atualizar('ativo', marcado)}
      />
    </Gaveta>
  );
}
