import { useState } from 'react';
import { calcularFolha, vencimentoPadraoFolha } from '../dominio/calculos';
import { hojeISO, mesAtual } from '../dominio/datas';
import { formatarDinheiro } from '../dominio/dinheiro';
import type { FolhaItem, Funcionario } from '../dominio/tipos';
import { salvarFolha } from '../dados/repositorio';
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
} from './campos';
import { Gaveta } from './Gaveta';
import { useRascunho } from './rascunho';

export interface PropsFormularioFolha {
  registro: FolhaItem;
  funcionarios: Funcionario[];
  aoFechar: () => void;
}

/**
 * Folha de um funcionário no mês.
 *
 * A conta separa o que o funcionário recebe (líquido) do que a empresa gasta
 * (custo), porque FGTS e encargos saem do caixa sem passar pela mão dele.
 */
export function FormularioFolha({ registro, funcionarios, aoFechar }: PropsFormularioFolha) {
  const { rascunho, atualizar, alterar, erro, definirErro } = useRascunho(registro);
  const [salvando, definirSalvando] = useState(false);
  const pago = Boolean(rascunho.pagoEm);
  const conta = calcularFolha(rascunho);
  const novo = !registro.funcionarioNome;

  const salvar = async () => {
    if (!rascunho.funcionarioNome.trim()) {
      definirErro('Informe o funcionário.');
      return;
    }
    if (rascunho.salarioBase <= 0) {
      definirErro('O salário base precisa ser maior que zero.');
      return;
    }

    definirSalvando(true);
    try {
      const casado = funcionarios.find(
        (funcionario) =>
          funcionario.nome.trim().toLowerCase() ===
          rascunho.funcionarioNome.trim().toLowerCase(),
      );

      await salvarFolha({
        ...rascunho,
        funcionarioId: casado?.id ?? rascunho.funcionarioId,
        vencimento: rascunho.vencimento || vencimentoPadraoFolha(rascunho.competencia),
        valorPago: pago ? (rascunho.valorPago ?? conta.custoEmpresa) : null,
      });
      aoFechar();
    } finally {
      definirSalvando(false);
    }
  };

  return (
    <Gaveta
      aberta
      titulo={novo ? 'Lançar folha' : 'Editar folha'}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="principal" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar folha'}
          </Botao>
        </>
      }
    >
      {erro && (
        <p className="campo__erro" role="alert" style={{ marginBottom: 12 }}>
          {erro}
        </p>
      )}

      <Campo rotulo="Funcionário">
        {(id) => (
          <>
            <EntradaTexto
              id={id}
              valor={rascunho.funcionarioNome}
              placeholder="Maria de Lourdes"
              list="lista-funcionarios"
              aoMudar={(nome) => {
                const cadastrado = funcionarios.find(
                  (funcionario) =>
                    funcionario.nome.trim().toLowerCase() === nome.trim().toLowerCase(),
                );
                alterar({
                  funcionarioNome: nome,
                  ...(cadastrado
                    ? {
                        funcionarioId: cadastrado.id,
                        salarioBase: cadastrado.salarioBase,
                      }
                    : {}),
                });
              }}
            />
            <datalist id="lista-funcionarios">
              {funcionarios.map((funcionario) => (
                <option key={funcionario.id} value={funcionario.nome} />
              ))}
            </datalist>
          </>
        )}
      </Campo>

      <Dupla>
        <Campo rotulo="Competência" dica="Mês trabalhado">
          {(id) => (
            <EntradaMes
              id={id}
              valor={rascunho.competencia}
              aoMudar={(valor) =>
                alterar({
                  competencia: valor || mesAtual(),
                  vencimento: vencimentoPadraoFolha(valor || mesAtual()),
                })
              }
            />
          )}
        </Campo>
        <Campo rotulo="Vencimento" dica="Padrão: dia 5 do mês seguinte">
          {(id) => (
            <EntradaData
              id={id}
              valor={rascunho.vencimento}
              aoMudar={(valor) => atualizar('vencimento', valor || hojeISO())}
            />
          )}
        </Campo>
      </Dupla>

      <Campo rotulo="Salário base">
        {(id) => (
          <EntradaDinheiro
            id={id}
            valor={rascunho.salarioBase}
            aoMudar={(valor) => atualizar('salarioBase', valor)}
          />
        )}
      </Campo>

      <Dupla>
        <Campo rotulo="Proventos" dica="horas extras, comissão">
          {(id) => (
            <EntradaDinheiro
              id={id}
              valor={rascunho.proventos}
              aoMudar={(valor) => atualizar('proventos', valor)}
            />
          )}
        </Campo>
        <Campo rotulo="Descontos" dica="faltas, adiantamento">
          {(id) => (
            <EntradaDinheiro
              id={id}
              valor={rascunho.descontos}
              aoMudar={(valor) => atualizar('descontos', valor)}
            />
          )}
        </Campo>
      </Dupla>

      <Dupla>
        <Campo rotulo="FGTS" dica="8% do salário, paga a empresa">
          {(id) => (
            <EntradaDinheiro
              id={id}
              valor={rascunho.fgts}
              aoMudar={(valor) => atualizar('fgts', valor)}
            />
          )}
        </Campo>
        <Campo rotulo="Outros encargos" dica="INSS patronal e demais">
          {(id) => (
            <EntradaDinheiro
              id={id}
              valor={rascunho.encargos}
              aoMudar={(valor) => atualizar('encargos', valor)}
            />
          )}
        </Campo>
      </Dupla>

      <div className="cartao" style={{ background: 'var(--superficie-2)' }}>
        <Ficha rotulo="Bruto (salário + proventos)" valor={formatarDinheiro(conta.bruto)} />
        <Ficha rotulo="Descontos" valor={`- ${formatarDinheiro(conta.descontos)}`} />
        <Ficha rotulo="Líquido do funcionário" valor={formatarDinheiro(conta.liquido)} cor="var(--acento)" />
        <Ficha rotulo="Custo total da empresa" valor={formatarDinheiro(conta.custoEmpresa)} />
      </div>

      <Marcar
        rotulo="Já está pago"
        marcado={pago}
        aoMudar={(marcado) =>
          alterar(
            marcado
              ? { pagoEm: hojeISO(), valorPago: conta.custoEmpresa }
              : { pagoEm: null, valorPago: null },
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
                valor={rascunho.valorPago ?? conta.custoEmpresa}
                aoMudar={(valor) => atualizar('valorPago', valor)}
              />
            )}
          </Campo>
        </Dupla>
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
