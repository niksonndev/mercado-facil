import { useState } from 'react';
import {
  calcularFolha,
  situacaoDoCompromisso,
  totalFolhaCompetencia,
  vencimentoPadraoFolha,
} from '../dominio/calculos';
import { formatarData, hojeISO, mesAtual, nomeDoMes, rotuloPrazo } from '../dominio/datas';
import { formatarDinheiro, somarCentavos } from '../dominio/dinheiro';
import type { Competencia, FolhaItem, Funcionario } from '../dominio/tipos';
import { useAcervo, useFuncionarios } from '../dados/hooks';
import {
  folhaDoFuncionario,
  novoFuncionario,
  removerFolha,
  removerFuncionario,
  salvarFolha,
} from '../dados/repositorio';
import { Aviso, Botao, Cartao, Estatistica, Vazio } from '../componentes/base';
import { LinhaLista } from '../componentes/lista';
import { FormularioFolha } from '../componentes/FormularioFolha';
import { FormularioFuncionario } from '../componentes/FormularioFuncionario';
import { GavetaPagamento, type Pagamento } from '../componentes/GavetaPagamento';
import { SeletorMes } from '../componentes/SeletorMes';

const ROTULO_SITUACAO: Record<string, { texto: string; cor: string }> = {
  atrasado: { texto: 'atrasado', cor: 'var(--negativo)' },
  'vence-hoje': { texto: 'vence hoje', cor: 'var(--alerta)' },
  'a-vencer': { texto: 'a vencer', cor: 'var(--suave)' },
  pago: { texto: 'pago', cor: 'var(--acento)' },
};

export function FuncionarioVazio(): Funcionario {
  return novoFuncionario({
    nome: '',
    cargo: '',
    salarioBase: 0,
    admissao: null,
    ativo: true,
  });
}

export function Folha() {
  const acervo = useAcervo();
  const funcionarios = useFuncionarios() ?? [];
  const [competencia, definirCompetencia] = useState<Competencia>(mesAtual);
  const [editando, definirEditando] = useState<FolhaItem | null>(null);
  const [editandoPessoa, definirEditandoPessoa] = useState<Funcionario | null>(null);
  const [pagando, definirPagando] = useState<FolhaItem | null>(null);
  const hoje = hojeISO();

  if (!acervo) return <Vazio titulo="Carregando…" />;

  const doMes = acervo.folha
    .filter((item) => item.competencia === competencia)
    .sort((a, b) => a.funcionarioNome.localeCompare(b.funcionarioNome));

  const custoTotal = totalFolhaCompetencia(acervo.folha, competencia);
  const liquido = somarCentavos(doMes.map((item) => calcularFolha(item).liquido));
  const encargos = somarCentavos(
    doMes.map((item) => item.fgts + item.encargos),
  );
  const emAberto = somarCentavos(
    doMes.filter((item) => !item.pagoEm).map((item) => calcularFolha(item).custoEmpresa),
  );

  const competenciasComDados = acervo.folha.map((item) => item.competencia);
  const ativos = funcionarios.filter((funcionario) => funcionario.ativo);
  const comFolha = new Set(doMes.map((item) => item.funcionarioId));
  const faltando = ativos.filter((funcionario) => !comFolha.has(funcionario.id));

  const lancarFaltantes = async () => {
    for (const funcionario of faltando) {
      await salvarFolha(folhaDoFuncionario(funcionario, competencia));
    }
  };

  const pagar = async (item: FolhaItem, pagamento: Pagamento) => {
    await salvarFolha({
      ...item,
      pagoEm: pagamento.pagoEm,
      valorPago: pagamento.valorPago,
    });
  };

  return (
    <>
      <SeletorMes
        valor={competencia}
        aoMudar={definirCompetencia}
        extras={competenciasComDados}
      />

      <div className="grade">
        <Estatistica
          rotulo="Líquido dos funcionários"
          valor={formatarDinheiro(liquido)}
          detalhe={`${doMes.length} pessoa(s)`}
        />
        <Estatistica
          rotulo="Encargos (FGTS + outros)"
          valor={formatarDinheiro(encargos)}
          detalhe="o que a empresa paga além do salário"
          tom="alerta"
        />
        <Estatistica
          rotulo="Custo total da folha"
          valor={formatarDinheiro(custoTotal)}
          detalhe={`${formatarDinheiro(emAberto)} em aberto`}
        />
      </div>

      <div className="grupo-botoes">
        <Botao
          variante="principal"
          icone="mais-circulo"
          onClick={() =>
            definirEditando(
              folhaDoFuncionario(ativos[0] ?? FuncionarioVazio(), competencia),
            )
          }
        >
          Lançar folha
        </Botao>
        {faltando.length > 0 && (
          <Botao onClick={lancarFaltantes}>
            Lançar {faltando.length} funcionário(s) que falta
          </Botao>
        )}
      </div>

      {funcionarios.length === 0 && (
        <Aviso tom="alerta">
          Cadastre os funcionários em <strong>Cadastro</strong> abaixo para lançar a folha
          mês a mês sem redigitar o salário.
        </Aviso>
      )}

      <Cartao titulo={`Folha de ${nomeDoMes(competencia)}`}>
        {doMes.length === 0 ? (
          <Vazio
            titulo="Nenhuma folha lançada neste mês"
            descricao="Lance o salário, os proventos e os encargos de cada funcionário. O vencimento padrão é o dia 5 do mês seguinte."
          />
        ) : (
          <div className="lista">
            {doMes.map((item) => {
              const conta = calcularFolha(item);
              const situacao = situacaoDoCompromisso(
                item.pagoEm,
                item.vencimento,
                hoje,
              );
              return (
                <LinhaLista
                  key={item.id}
                  titulo={item.funcionarioNome || 'Sem nome'}
                  etiqueta={{
                    texto: ROTULO_SITUACAO[situacao]?.texto ?? '',
                    cor: ROTULO_SITUACAO[situacao]?.cor,
                  }}
                  detalhe={[
                    `líquido ${formatarDinheiro(conta.liquido)}`,
                    `encargos ${formatarDinheiro(item.fgts + item.encargos)}`,
                    item.pagoEm
                      ? `pago em ${formatarData(item.pagoEm)}`
                      : `vence ${formatarData(item.vencimento)} · ${rotuloPrazo(item.vencimento, hoje)}`,
                  ].join(' · ')}
                  valor={formatarDinheiro(conta.custoEmpresa)}
                  aoAbrir={() => definirEditando(item)}
                  acoes={
                    <>
                      {item.pagoEm ? (
                        <Botao
                          pequeno
                          variante="fantasma"
                          onClick={() =>
                            salvarFolha({ ...item, pagoEm: null, valorPago: null })
                          }
                        >
                          Reabrir
                        </Botao>
                      ) : (
                        <Botao
                          pequeno
                          variante="principal"
                          onClick={() => definirPagando(item)}
                        >
                          Pagar
                        </Botao>
                      )}
                      <Botao
                        pequeno
                        variante="fantasma"
                        title="Excluir da folha"
                        onClick={() => removerFolha(item.id)}
                      >
                        Excluir
                      </Botao>
                    </>
                  }
                />
              );
            })}
          </div>
        )}
      </Cartao>

      <Cartao
        titulo="Cadastro de funcionários"
        acao={
          <Botao pequeno onClick={() => definirEditandoPessoa(FuncionarioVazio())}>
            Novo
          </Botao>
        }
      >
        {funcionarios.length === 0 ? (
          <Vazio
            titulo="Nenhum funcionário cadastrado"
            descricao="Com o cadastro pronto, lançar a folha do mês vira um clique por pessoa."
          />
        ) : (
          <div className="lista">
            {funcionarios.map((funcionario) => (
              <LinhaLista
                key={funcionario.id}
                titulo={funcionario.nome}
                etiqueta={
                  funcionario.ativo
                    ? { texto: funcionario.cargo || 'ativo', cor: 'var(--acento)' }
                    : { texto: 'inativo', cor: 'var(--suave)' }
                }
                detalhe={
                  funcionario.admissao
                    ? `desde ${formatarData(funcionario.admissao)}`
                    : 'sem data de admissão'
                }
                valor={formatarDinheiro(funcionario.salarioBase)}
                aoAbrir={() => definirEditandoPessoa(funcionario)}
                acoes={
                  <Botao
                    pequeno
                    variante="fantasma"
                    onClick={() => removerFuncionario(funcionario.id)}
                  >
                    Excluir
                  </Botao>
                }
              />
            ))}
          </div>
        )}
      </Cartao>

      {editando && (
        <FormularioFolha
          key={editando.id}
          registro={editando}
          funcionarios={funcionarios}
          aoFechar={() => definirEditando(null)}
        />
      )}

      {editandoPessoa && (
        <FormularioFuncionario
          key={editandoPessoa.id}
          registro={editandoPessoa}
          aoFechar={() => definirEditandoPessoa(null)}
        />
      )}

      {pagando && (
        <GavetaPagamento
          titulo="Pagar folha"
          descricao={`${pagando.funcionarioNome} — ${nomeDoMes(competencia)} · vence ${formatarData(vencimentoPadraoFolha(competencia))}`}
          valorSugerido={calcularFolha(pagando).custoEmpresa}
          aoConfirmar={(pagamento) => pagar(pagando, pagamento)}
          aoFechar={() => definirPagando(null)}
        />
      )}
    </>
  );
}
