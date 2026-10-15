import { hojeISO } from '../dominio/datas';
import type {
  Cartao,
  CategoriaCusto,
  CategoriaDespesa,
  Centavos,
  Conta,
  CustoOperacional,
  DataISO,
  Despesa,
  FechamentoCaixa,
  FolhaItem,
  Fornecedor,
  FormaPagamento,
  Funcionario,
  IndicadoresDre,
  PontoDeVenda,
  PrazoCredito,
  TipoConta,
  TipoDespesa,
} from '../dominio/tipos';
import { TABELAS, db, type NomeTabela } from './db';

const APP = 'mercado-facil';
const VERSAO_BACKUP = 1;

export interface Backup {
  app: string;
  versao: number;
  exportadoEm: string;
  dados: Record<NomeTabela, unknown[]>;
}

export async function montarBackup(): Promise<Backup> {
  const dados = {} as Record<NomeTabela, unknown[]>;

  for (const tabela of TABELAS) {
    dados[tabela] = await db.table(tabela).toArray();
  }

  return { app: APP, versao: VERSAO_BACKUP, exportadoEm: new Date().toISOString(), dados };
}

/** Nome do arquivo: mercado-facil-2026-10-15.json */
export function nomeDoArquivo(data: DataISO = hojeISO()): string {
  return `${APP}-${data}.json`;
}

/** Dispara o download do backup — é a única cópia que sai do aparelho. */
export async function baixarBackup(): Promise<void> {
  const backup = await montarBackup();
  const conteudo = JSON.stringify(backup, null, 2);
  const blob = new Blob([conteudo], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = nomeDoArquivo();
  link.click();

  URL.revokeObjectURL(url);
}

// --- Leitura tolerante -------------------------------------------------------
// O backup pode ter sido gerado por uma versão anterior do app. Cada campo é
// validado e recebe um padrão, em vez de confiar no arquivo: uma lista de
// despesas com um campo novo ausente não pode derrubar a importação inteira.

const comoTexto = (valor: unknown, padrao = ''): string =>
  typeof valor === 'string' ? valor : padrao;

const comoCentavos = (valor: unknown): Centavos =>
  typeof valor === 'number' && Number.isFinite(valor) ? Math.round(valor) : 0;

const comoData = (valor: unknown): DataISO | null =>
  typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : null;

const comoBooleano = (valor: unknown, padrao = false): boolean =>
  typeof valor === 'boolean' ? valor : padrao;

const comoLista = (valor: unknown): Record<string, unknown>[] =>
  Array.isArray(valor)
    ? valor.filter((item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === 'object',
      )
    : [];

const comoOpcao = <T extends string>(valor: unknown, opcoes: readonly T[], padrao: T): T =>
  typeof valor === 'string' && (opcoes as readonly string[]).includes(valor)
    ? (valor as T)
    : padrao;

const FORMAS = ['dinheiro', 'pix', 'debito', 'credito'] as const;
const TIPOS_CONTA = ['boleto', 'cheque', 'avista', 'fatura'] as const;
const TIPOS_DESPESA = ['retirada', 'diversos'] as const;
const CATEGORIAS_DESPESA = [
  'geral',
  'transporte',
  'manutencao',
  'taxas',
  'pessoal',
  'outros',
] as const;
const CATEGORIAS_CUSTO = [
  'aluguel',
  'energia',
  'agua',
  'internet',
  'telefone',
  'contabilidade',
  'sistema',
  'manutencao',
  'impostos',
  'outros',
] as const;

const id = (valor: unknown): string =>
  typeof valor === 'string' && valor ? valor : crypto.randomUUID();

const momento = (valor: unknown): string =>
  typeof valor === 'string' && valor ? valor : new Date().toISOString();

const PRAZOS = [
  'avista',
  '7-dias',
  '14-dias',
  '30-dias',
  '31-dias',
  'mes-seguinte',
] as const;

function lerFechamento(bruto: Record<string, unknown>): FechamentoCaixa | null {
  const data = comoData(bruto.data);
  if (!data) return null; // sem data o fechamento não tem onde entrar

  return {
    id: id(bruto.id),
    data,
    pontoId: typeof bruto.pontoId === 'string' ? bruto.pontoId : null,
    responsavelId: typeof bruto.responsavelId === 'string' ? bruto.responsavelId : null,
    responsavelNome: comoTexto(bruto.responsavelNome),
    fundoInicial: comoCentavos(bruto.fundoInicial),
    dinheiro: comoCentavos(bruto.dinheiro),
    pix: comoCentavos(bruto.pix),
    debito: comoCentavos(bruto.debito),
    credito: comoCentavos(bruto.credito),
    fiado: comoCentavos(bruto.fiado),
    prazoCredito: comoOpcao<PrazoCredito>(bruto.prazoCredito, PRAZOS, '30-dias'),
    creditoRecebidoEm: comoData(bruto.creditoRecebidoEm),
    creditoRecebidoValor:
      bruto.creditoRecebidoValor == null ? null : comoCentavos(bruto.creditoRecebidoValor),
    observacao: comoTexto(bruto.observacao),
    criadoEm: momento(bruto.criadoEm),
    atualizadoEm: momento(bruto.atualizadoEm),
  };
}

function lerConta(bruto: Record<string, unknown>): Conta | null {
  const vencimento = comoData(bruto.vencimento);
  if (!vencimento) return null;

  return {
    id: id(bruto.id),
    tipo: comoOpcao<TipoConta>(bruto.tipo, TIPOS_CONTA, 'boleto'),
    fornecedorId: typeof bruto.fornecedorId === 'string' ? bruto.fornecedorId : null,
    fornecedorNome: comoTexto(bruto.fornecedorNome),
    descricao: comoTexto(bruto.descricao),
    valor: comoCentavos(bruto.valor),
    emissao: comoData(bruto.emissao),
    vencimento,
    chequeNumero: comoTexto(bruto.chequeNumero),
    chequeBanco: comoTexto(bruto.chequeBanco),
    cartaoId: typeof bruto.cartaoId === 'string' ? bruto.cartaoId : null,
    cartaoNome: comoTexto(bruto.cartaoNome),
    pagoEm: comoData(bruto.pagoEm),
    valorPago: bruto.valorPago == null ? null : comoCentavos(bruto.valorPago),
    formaPagamento:
      bruto.formaPagamento == null
        ? null
        : comoOpcao<FormaPagamento>(bruto.formaPagamento, FORMAS, 'dinheiro'),
    observacao: comoTexto(bruto.observacao),
    criadoEm: momento(bruto.criadoEm),
    atualizadoEm: momento(bruto.atualizadoEm),
  };
}

function lerDespesa(bruto: Record<string, unknown>): Despesa | null {
  const data = comoData(bruto.data);
  if (!data) return null;

  return {
    id: id(bruto.id),
    tipo: comoOpcao<TipoDespesa>(bruto.tipo, TIPOS_DESPESA, 'diversos'),
    descricao: comoTexto(bruto.descricao),
    categoria: comoOpcao<CategoriaDespesa>(bruto.categoria, CATEGORIAS_DESPESA, 'geral'),
    valor: comoCentavos(bruto.valor),
    data,
    formaPagamento: comoOpcao<FormaPagamento>(bruto.formaPagamento, FORMAS, 'dinheiro'),
    retiradaDoCaixa: comoBooleano(bruto.retiradaDoCaixa),
    beneficiario: comoTexto(bruto.beneficiario),
    observacao: comoTexto(bruto.observacao),
    criadoEm: momento(bruto.criadoEm),
  };
}

function lerCusto(bruto: Record<string, unknown>): CustoOperacional | null {
  const vencimento = comoData(bruto.vencimento);
  if (!vencimento) return null;

  return {
    id: id(bruto.id),
    categoria: comoOpcao<CategoriaCusto>(bruto.categoria, CATEGORIAS_CUSTO, 'outros'),
    descricao: comoTexto(bruto.descricao),
    competencia: comoTexto(bruto.competencia, vencimento.slice(0, 7)),
    valorPrevisto: comoCentavos(bruto.valorPrevisto),
    vencimento,
    recorrente: comoBooleano(bruto.recorrente, true),
    pagoEm: comoData(bruto.pagoEm),
    valorPago: bruto.valorPago == null ? null : comoCentavos(bruto.valorPago),
    formaPagamento:
      bruto.formaPagamento == null
        ? null
        : comoOpcao<FormaPagamento>(bruto.formaPagamento, FORMAS, 'dinheiro'),
    observacao: comoTexto(bruto.observacao),
    criadoEm: momento(bruto.criadoEm),
    atualizadoEm: momento(bruto.atualizadoEm),
  };
}

function lerFuncionario(bruto: Record<string, unknown>): Funcionario {
  return {
    id: id(bruto.id),
    nome: comoTexto(bruto.nome, 'Sem nome'),
    cargo: comoTexto(bruto.cargo),
    salarioBase: comoCentavos(bruto.salarioBase),
    admissao: comoData(bruto.admissao),
    ativo: comoBooleano(bruto.ativo, true),
    criadoEm: momento(bruto.criadoEm),
  };
}

function lerFornecedor(bruto: Record<string, unknown>): Fornecedor {
  return {
    id: id(bruto.id),
    nome: comoTexto(bruto.nome, 'Sem nome'),
    cnpj: comoTexto(bruto.cnpj),
    telefone: comoTexto(bruto.telefone),
    observacao: comoTexto(bruto.observacao),
    criadoEm: momento(bruto.criadoEm),
  };
}

function lerPonto(bruto: Record<string, unknown>): PontoDeVenda {
  return {
    id: id(bruto.id),
    nome: comoTexto(bruto.nome, 'Caixa'),
    ativo: comoBooleano(bruto.ativo, true),
    criadoEm: momento(bruto.criadoEm),
  };
}

function lerCartao(bruto: Record<string, unknown>): Cartao {
  const dia = (valor: unknown, padrao: number): number => {
    const numero = typeof valor === 'number' ? Math.round(valor) : padrao;
    return Math.min(31, Math.max(1, numero));
  };

  return {
    id: id(bruto.id),
    nome: comoTexto(bruto.nome, 'Cartão'),
    diaFechamento: dia(bruto.diaFechamento, 20),
    diaVencimento: dia(bruto.diaVencimento, 28),
    ativo: comoBooleano(bruto.ativo, true),
    criadoEm: momento(bruto.criadoEm),
  };
}

function lerFolha(bruto: Record<string, unknown>): FolhaItem | null {
  const competencia = comoTexto(bruto.competencia);
  if (!/^\d{4}-\d{2}$/.test(competencia)) return null;

  const vencimento = comoData(bruto.vencimento) ?? `${competencia}-05`;

  return {
    id: id(bruto.id),
    competencia,
    funcionarioId:
      typeof bruto.funcionarioId === 'string' ? bruto.funcionarioId : null,
    funcionarioNome: comoTexto(bruto.funcionarioNome),
    salarioBase: comoCentavos(bruto.salarioBase),
    proventos: comoCentavos(bruto.proventos),
    descontos: comoCentavos(bruto.descontos),
    fgts: comoCentavos(bruto.fgts),
    encargos: comoCentavos(bruto.encargos),
    vencimento,
    pagoEm: comoData(bruto.pagoEm),
    valorPago: bruto.valorPago == null ? null : comoCentavos(bruto.valorPago),
    observacao: comoTexto(bruto.observacao),
    criadoEm: momento(bruto.criadoEm),
  };
}

function lerIndicadores(bruto: Record<string, unknown>): IndicadoresDre | null {
  const competencia = comoTexto(bruto.competencia);
  if (!/^\d{4}-\d{2}$/.test(competencia)) return null;

  return {
    competencia,
    cmv: comoCentavos(bruto.cmv),
    observacao: comoTexto(bruto.observacao),
    atualizadoEm: momento(bruto.atualizadoEm),
  };
}

export interface ResultadoImportacao {
  porTabela: Partial<Record<NomeTabela, number>>;
  total: number;
  ignorados: number;
}

/** Aceita tanto o arquivo com envelope quanto um objeto só com as listas. */
function extrairDados(bruto: unknown): Record<string, unknown> {
  if (!bruto || typeof bruto !== 'object') {
    throw new Error('O arquivo não é um backup do Mercado Fácil.');
  }
  const objeto = bruto as Record<string, unknown>;
  const dados = objeto.dados;
  return dados && typeof dados === 'object'
    ? (dados as Record<string, unknown>)
    : objeto;
}

/**
 * Substitui todo o conteúdo do banco pelo arquivo.
 *
 * Roda dentro de uma transação: se algum registro der errado, ou entra tudo ou
 * não entra nada — melhor que um banco pela metade.
 */
export async function importarBackup(texto: string): Promise<ResultadoImportacao> {
  let bruto: unknown;
  try {
    bruto = JSON.parse(texto);
  } catch {
    throw new Error('O arquivo não é um JSON válido.');
  }

  const dados = extrairDados(bruto);

  const fechamentos = comoLista(dados.fechamentos)
    .map(lerFechamento)
    .filter((item): item is FechamentoCaixa => item !== null);
  const contas = comoLista(dados.contas)
    .map(lerConta)
    .filter((item): item is Conta => item !== null);
  const cartoes = comoLista(dados.cartoes).map(lerCartao);
  const despesas = comoLista(dados.despesas)
    .map(lerDespesa)
    .filter((item): item is Despesa => item !== null);
  const custos = comoLista(dados.custos)
    .map(lerCusto)
    .filter((item): item is CustoOperacional => item !== null);
  const fornecedores = comoLista(dados.fornecedores).map(lerFornecedor);
  const pontos = comoLista(dados.pontos).map(lerPonto);
  const funcionarios = comoLista(dados.funcionarios).map(lerFuncionario);
  const folha = comoLista(dados.folha)
    .map(lerFolha)
    .filter((item): item is FolhaItem => item !== null);
  const indicadores = comoLista(dados.indicadores)
    .map(lerIndicadores)
    .filter((item): item is IndicadoresDre => item !== null);

  const leram = {
    fechamentos: fechamentos.length,
    pontos: pontos.length,
    contas: contas.length,
    cartoes: cartoes.length,
    despesas: despesas.length,
    custos: custos.length,
    fornecedores: fornecedores.length,
    funcionarios: funcionarios.length,
    folha: folha.length,
    indicadores: indicadores.length,
  };

  const noArquivo = TABELAS.reduce(
    (total, tabela) => total + comoLista(dados[tabela]).length,
    0,
  );
  const total = Object.values(leram).reduce((soma, valor) => soma + valor, 0);

  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((tabela) => tabela.clear()));

    await db.fechamentos.bulkPut(fechamentos);
    await db.pontos.bulkPut(pontos);
    await db.fornecedores.bulkPut(fornecedores);
    await db.contas.bulkPut(contas);
    await db.cartoes.bulkPut(cartoes);
    await db.despesas.bulkPut(despesas);
    await db.custos.bulkPut(custos);
    await db.funcionarios.bulkPut(funcionarios);
    await db.folha.bulkPut(folha);
    await db.indicadores.bulkPut(indicadores);
  });

  return { porTabela: leram, total, ignorados: noArquivo - total };
}
