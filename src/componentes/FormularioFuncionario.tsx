import { useState } from 'react';
import type { Funcionario } from '../dominio/tipos';
import { salvarFuncionario } from '../dados/repositorio';
import { Botao } from './base';
import { Campo, EntradaData, EntradaDinheiro, EntradaTexto, Marcar } from './campos';
import { Gaveta } from './Gaveta';
import { useRascunho } from './rascunho';

export interface PropsFormularioFuncionario {
  registro: Funcionario;
  aoFechar: () => void;
}

export function FormularioFuncionario({ registro, aoFechar }: PropsFormularioFuncionario) {
  const { rascunho, atualizar, erro, definirErro } = useRascunho(registro);
  const [salvando, definirSalvando] = useState(false);
  const novo = !registro.nome;

  const salvar = async () => {
    if (!rascunho.nome.trim()) {
      definirErro('Informe o nome do funcionário.');
      return;
    }

    definirSalvando(true);
    try {
      await salvarFuncionario(rascunho);
      aoFechar();
    } finally {
      definirSalvando(false);
    }
  };

  return (
    <Gaveta
      aberta
      titulo={novo ? 'Novo funcionário' : 'Editar funcionário'}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="principal" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar funcionário'}
          </Botao>
        </>
      }
    >
      {erro && (
        <p className="campo__erro" role="alert" style={{ marginBottom: 12 }}>
          {erro}
        </p>
      )}

      <Campo rotulo="Nome">
        {(id) => (
          <EntradaTexto
            id={id}
            valor={rascunho.nome}
            placeholder="Maria de Lourdes"
            aoMudar={(valor) => atualizar('nome', valor)}
          />
        )}
      </Campo>

      <Campo rotulo="Função">
        {(id) => (
          <EntradaTexto
            id={id}
            valor={rascunho.cargo}
            placeholder="Caixa"
            aoMudar={(valor) => atualizar('cargo', valor)}
          />
        )}
      </Campo>

      <Campo rotulo="Salário base">
        {(id) => (
          <EntradaDinheiro
            id={id}
            valor={rascunho.salarioBase}
            aoMudar={(valor) => atualizar('salarioBase', valor)}
          />
        )}
      </Campo>

      <Campo rotulo="Admissão">
        {(id) => (
          <EntradaData
            id={id}
            valor={rascunho.admissao ?? ''}
            aoMudar={(valor) => atualizar('admissao', valor || null)}
          />
        )}
      </Campo>

      <Marcar
        rotulo="Funcionário ativo"
        dica="os inativos ficam no histórico e fora dos lançamentos novos"
        marcado={rascunho.ativo}
        aoMudar={(marcado) => atualizar('ativo', marcado)}
      />
    </Gaveta>
  );
}
