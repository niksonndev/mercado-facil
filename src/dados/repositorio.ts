import { hojeISO } from '../dominio/datas';
import { vencimentoPadraoFolha } from '../dominio/calculos';
import type {
  Competencia,
  Conta,
  CustoOperacional,
  DataISO,
  Despesa,
  FechamentoCaixa,
  FolhaItem,
  Fornecedor,
  FormaPagamento,
  Funcionario,
  Id,
} from '../dominio/tipos';
import { db } from './db';

const gerarId = (): Id => crypto.randomUUID();
const agora = (): string => new Date().toISOString();

/** Campos que o app preenche sozinho em todo lançamento. */
type Nascimento<T> = Omit<T, 'id' | 'criadoEm' | 'atualizadoEm'>;

/** Fechamento sem nada lançado, para começar o dia. */
export function fechamentoVazio(data: DataISO = hojeISO()): Nascimento<FechamentoCaixa> {
  return {
    data,
    fundoInicial: 0,
    dinheiro: 0,
    pix: 0,
    debito: 0,
    credito: 0,
    fiado: 0,
    observacao: '',
  };
}

export function novoFechamento(dados: Nascimento<FechamentoCaixa>): FechamentoCaixa {
  const momento = agora();
  return { ...dados, id: gerarId(), criadoEm: momento, atualizadoEm: momento };
}

export function salvarFechamento(registro: FechamentoCaixa): Promise<string> {
  return db.fechamentos.put({ ...registro, atualizadoEm: agora() });
}

export const removerFechamento = (id: Id) => db.fechamentos.delete(id);

export function novoFornecedor(dados: Nascimento<Fornecedor>): Fornecedor {
  return { ...dados, id: gerarId(), criadoEm: agora() };
}

export const salvarFornecedor = (registro: Fornecedor) => db.fornecedores.put(registro);
export const removerFornecedor = (id: Id) => db.fornecedores.delete(id);

/** Conta de fornecedor em branco, já com o fornecedor escolhido. */
export function contaVazia(fornecedor?: Fornecedor): Nascimento<Conta> {
  return {
    tipo: 'boleto',
    fornecedorId: fornecedor?.id ?? null,
    fornecedorNome: fornecedor?.nome ?? '',
    descricao: '',
    valor: 0,
    emissao: hojeISO(),
    vencimento: hojeISO(),
    chequeNumero: '',
    chequeBanco: '',
    pagoEm: null,
    valorPago: null,
    formaPagamento: null,
    observacao: '',
  };
}

export function novaConta(dados: Nascimento<Conta>): Conta {
  const momento = agora();
  return { ...dados, id: gerarId(), criadoEm: momento, atualizadoEm: momento };
}

export function salvarConta(registro: Conta): Promise<string> {
  return db.contas.put({ ...registro, atualizadoEm: agora() });
}

export const removerConta = (id: Id) => db.contas.delete(id);

/**
 * Marca a conta como paga.
 *
 * O valor pago começa igual ao valor da conta; o formulário deixa ajustar
 * quando veio juros ou desconto.
 */
export function contaPaga(
  conta: Conta,
  formaPagamento: FormaPagamento,
  data: DataISO = hojeISO(),
): Conta {
  return {
    ...conta,
    pagoEm: data,
    formaPagamento,
    valorPago: conta.valorPago ?? conta.valor,
  };
}

export const reabrirConta = (conta: Conta): Conta => ({
  ...conta,
  pagoEm: null,
  valorPago: null,
  formaPagamento: null,
});

export function novaDespesa(dados: Nascimento<Despesa>): Despesa {
  return { ...dados, id: gerarId(), criadoEm: agora() };
}

export const salvarDespesa = (registro: Despesa) => db.despesas.put(registro);
export const removerDespesa = (id: Id) => db.despesas.delete(id);

export function novoCusto(dados: Nascimento<CustoOperacional>): CustoOperacional {
  const momento = agora();
  return { ...dados, id: gerarId(), criadoEm: momento, atualizadoEm: momento };
}

export function salvarCusto(registro: CustoOperacional): Promise<string> {
  return db.custos.put({ ...registro, atualizadoEm: agora() });
}

export const removerCusto = (id: Id) => db.custos.delete(id);

/** Cópia do custo para a competência seguinte, ainda em aberto. */
export function custoDoProximoMes(
  custo: CustoOperacional,
  competencia: Competencia,
): CustoOperacional {
  const dia = custo.vencimento.slice(8);
  return {
    ...custo,
    id: gerarId(),
    competencia,
    vencimento: `${competencia}-${dia}`,
    pagoEm: null,
    valorPago: null,
    formaPagamento: null,
    criadoEm: agora(),
    atualizadoEm: agora(),
  };
}

export function novoFuncionario(dados: Nascimento<Funcionario>): Funcionario {
  return { ...dados, id: gerarId(), criadoEm: agora() };
}

export const salvarFuncionario = (registro: Funcionario) => db.funcionarios.put(registro);
export const removerFuncionario = (id: Id) => db.funcionarios.delete(id);

export function novaFolha(dados: Nascimento<FolhaItem>): FolhaItem {
  return { ...dados, id: gerarId(), criadoEm: agora() };
}

export const salvarFolha = (registro: FolhaItem) => db.folha.put(registro);
export const removerFolha = (id: Id) => db.folha.delete(id);

/** Item de folha em branco a partir do cadastro do funcionário. */
export function folhaDoFuncionario(
  funcionario: Funcionario,
  competencia: Competencia,
): FolhaItem {
  return novaFolha({
    competencia,
    funcionarioId: funcionario.id,
    funcionarioNome: funcionario.nome,
    salarioBase: funcionario.salarioBase,
    proventos: 0,
    descontos: 0,
    fgts: 0,
    encargos: 0,
    vencimento: vencimentoPadraoFolha(competencia),
    pagoEm: null,
    valorPago: null,
    observacao: '',
  });
}

/** Apaga todos os lançamentos, mantendo o app pronto para um novo começo. */
export async function apagarTudo(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((tabela) => tabela.clear()));
  });
}
