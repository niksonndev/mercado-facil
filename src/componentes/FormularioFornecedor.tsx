import { useState } from 'react';
import type { Fornecedor } from '../dominio/tipos';
import { salvarFornecedor } from '../dados/repositorio';
import { Botao } from './base';
import { AreaTexto, Campo, EntradaTexto } from './campos';
import { Gaveta } from './Gaveta';
import { useRascunho } from './rascunho';

export interface PropsFormularioFornecedor {
  registro: Fornecedor;
  aoFechar: () => void;
}

export function FormularioFornecedor({ registro, aoFechar }: PropsFormularioFornecedor) {
  const { rascunho, atualizar, erro, definirErro } = useRascunho(registro);
  const [salvando, definirSalvando] = useState(false);
  const novo = !registro.nome;

  const salvar = async () => {
    if (!rascunho.nome.trim()) {
      definirErro('Informe o nome do fornecedor.');
      return;
    }

    definirSalvando(true);
    try {
      await salvarFornecedor(rascunho);
      aoFechar();
    } finally {
      definirSalvando(false);
    }
  };

  return (
    <Gaveta
      aberta
      titulo={novo ? 'Novo fornecedor' : 'Editar fornecedor'}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="principal" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar fornecedor'}
          </Botao>
        </>
      }
    >
      {erro && (
        <p className="campo__erro" role="alert" style={{ marginBottom: 12 }}>
          {erro}
        </p>
      )}

      <Campo rotulo="Nome da empresa">
        {(id) => (
          <EntradaTexto
            id={id}
            valor={rascunho.nome}
            placeholder="Distribuidora Central"
            aoMudar={(valor) => atualizar('nome', valor)}
          />
        )}
      </Campo>

      <Campo rotulo="CNPJ">
        {(id) => (
          <EntradaTexto
            id={id}
            valor={rascunho.cnpj}
            placeholder="00.000.000/0001-00"
            inputMode="numeric"
            aoMudar={(valor) => atualizar('cnpj', valor)}
          />
        )}
      </Campo>

      <Campo rotulo="Telefone">
        {(id) => (
          <EntradaTexto
            id={id}
            valor={rascunho.telefone}
            placeholder="(82) 3322-1010"
            inputMode="tel"
            aoMudar={(valor) => atualizar('telefone', valor)}
          />
        )}
      </Campo>

      <Campo rotulo="Observação">
        {(id) => (
          <AreaTexto
            id={id}
            valor={rascunho.observacao}
            placeholder="Entrega às terças e sextas"
            aoMudar={(valor) => atualizar('observacao', valor)}
          />
        )}
      </Campo>
    </Gaveta>
  );
}
