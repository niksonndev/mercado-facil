import { hojeISO } from '../dominio/datas';
import { vencimentoPadraoFolha } from '../dominio/calculos';
import { PRAZO_CREDITO_PADRAO } from '../dominio/categorias';
import type {
  Cartao,
  Competencia,
  ConferenciaSaldo,
  Conta,
  ContaBancaria,
  CustoOperacional,
  DataISO,
  Despesa,
  FechamentoCaixa,
  FolhaItem,
  Fornecedor,
  FormaPagamento,
  Funcionario,
  Id,
  IndicadoresDre,
  PontoDeVenda,
  PrazoCredito,
} from '../dominio/tipos';
import { db } from './db';

const gerarId = (): Id => crypto.randomUUID();
const agora = (): string => new Date().toISOString();

/** Campos que o app preenche sozinho em todo lançamento. */
type Nascimento<T> = Omit<T, 'id' | 'criadoEm' | 'atualizadoEm'>;

/** Fechamento sem nada lançado, para começar o dia. */
export function fechamentoVazio(
  data: DataISO = hojeISO(),
  pontoId: Id | null = null,
  responsavel: Funcionario | null = null,
  prazoCredito: PrazoCredito = PRAZO_CREDITO_PADRAO,
): Nascimento<FechamentoCaixa> {
  return {
    data,
    pontoId,
    responsavelId: responsavel?.id ?? null,
    responsavelNome: responsavel?.nome ?? '',
    fundoInicial: 0,
    dinheiro: 0,
    pix: 0,
    debito: 0,
    credito: 0,
    fiado: 0,
    prazoCredito,
    creditoRecebidoEm: null,
    creditoRecebidoValor: null,
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

/** Ponto de venda em branco, para o cadastro. */
export function pontoVazio(): PontoDeVenda {
  return novoPonto({ nome: '', ativo: true });
}

export function novoPonto(dados: Nascimento<PontoDeVenda>): PontoDeVenda {
  return { ...dados, id: gerarId(), criadoEm: agora() };
}

export const salvarPonto = (registro: PontoDeVenda) => db.pontos.put(registro);
export const removerPonto = (id: Id) => db.pontos.delete(id);

/** Cartão em branco, para o cadastro. */
export function cartaoVazio(): Cartao {
  return novoCartao({ nome: '', diaFechamento: 20, diaVencimento: 28, ativo: true });
}

export function novoCartao(dados: Nascimento<Cartao>): Cartao {
  return { ...dados, id: gerarId(), criadoEm: agora() };
}

export const salvarCartao = (registro: Cartao) => db.cartoes.put(registro);
export const removerCartao = (id: Id) => db.cartoes.delete(id);

/** Chave da conferência: uma por conta e por mês. */
export const chaveConferencia = (contaBancariaId: Id, competencia: Competencia): string =>
  `${contaBancariaId}:${competencia}`;

/** Conta bancária em branco, já com o saldo de hoje para o dono só corrigir. */
export function contaBancariaVazia(): ContaBancaria {
  return {
    id: gerarId(),
    nome: '',
    banco: '',
    agencia: '',
    numero: '',
    saldoInicial: 0,
    dataSaldoInicial: hojeISO(),
    ativo: true,
    observacao: '',
    criadoEm: agora(),
  };
}

export const salvarContaBancaria = (registro: ContaBancaria) =>
  db.contasBancarias.put(registro);
export const removerContaBancaria = (id: Id) => db.contasBancarias.delete(id);

/** Grava o saldo do extrato do mês; informar de novo corrige o mesmo registro. */
export function salvarConferencia(
  dados: Omit<ConferenciaSaldo, 'id' | 'atualizadoEm'>,
): Promise<string> {
  return db.conferencias.put({
    ...dados,
    id: chaveConferencia(dados.contaBancariaId, dados.competencia),
    atualizadoEm: agora(),
  });
}

export const removerConferencia = (id: string) => db.conferencias.delete(id);

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
    cartaoId: null,
    cartaoNome: '',
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

/**
 * Grava os números informados à mão para o mês.
 *
 * A competência é a chave: informar o CMV de novo no mesmo mês sobrescreve o
 * valor anterior em vez de criar um segundo registro.
 */
export function salvarIndicadores(
  dados: Omit<IndicadoresDre, 'atualizadoEm'>,
): Promise<string> {
  return db.indicadores.put({ ...dados, atualizadoEm: agora() });
}

/**
 * Esquece o CMV do mês.
 *
 * É a saída para quem informou um valor errado e não tem outro para colocar no
 * lugar: sem registro, o DRE volta a avisar que o lucro está inflado.
 */
export const apagarIndicadores = (competencia: Competencia): Promise<void> =>
  db.indicadores.delete(competencia);

/** Apaga todos os lançamentos, mantendo o app pronto para um novo começo. */
export async function apagarTudo(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((tabela) => tabela.clear()));
  });
}
