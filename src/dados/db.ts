import Dexie, { type Table } from 'dexie';
import type {
  Cartao,
  ConferenciaSaldo,
  Conta,
  ContaBancaria,
  CustoOperacional,
  Despesa,
  FechamentoCaixa,
  FolhaItem,
  Fornecedor,
  Funcionario,
  IndicadoresDre,
  PontoDeVenda,
} from '../dominio/tipos';

/**
 * Banco local do mercadinho (IndexedDB).
 *
 * Nada sai do aparelho: o app funciona offline e não existe servidor. O backup
 * é o exportar/importar JSON da tela Dados.
 *
 * Os índices são só os que as telas filtram (data, vencimento, competência).
 * O resto é resolvido no relatório em memória — o volume de um mercadinho
 * (alguns milhares de lançamentos por ano) não justifica mais que isso.
 */
export class BancoMercadoFacil extends Dexie {
  fechamentos!: Table<FechamentoCaixa, string>;
  pontos!: Table<PontoDeVenda, string>;
  fornecedores!: Table<Fornecedor, string>;
  contas!: Table<Conta, string>;
  /** Cartões da empresa: a fatura e o melhor dia de compra saem daqui. */
  cartoes!: Table<Cartao, string>;
  /** Conta bancária da loja e o saldo do extrato conferido mês a mês. */
  contasBancarias!: Table<ContaBancaria, string>;
  conferencias!: Table<ConferenciaSaldo, string>;
  despesas!: Table<Despesa, string>;
  custos!: Table<CustoOperacional, string>;
  funcionarios!: Table<Funcionario, string>;
  folha!: Table<FolhaItem, string>;
  /** Números informados à mão por mês (hoje, só o CMV do DRE). */
  indicadores!: Table<IndicadoresDre, string>;

  constructor() {
    super('mercado-facil');

    this.version(1).stores({
      fechamentos: 'id, data',
      fornecedores: 'id, nome',
      contas: 'id, tipo, fornecedorId, vencimento, pagoEm',
      despesas: 'id, data, tipo',
      custos: 'id, categoria, competencia, vencimento, pagoEm',
      funcionarios: 'id, nome, ativo',
      folha: 'id, competencia, funcionarioId, pagoEm',
    });

    // v2: o DRE precisa do CMV, que só a pessoa sabe. A competência é a chave
    // (um registro por mês), então não há id separado nem índice extra.
    this.version(2).stores({
      indicadores: 'competencia',
    });

    // v3: o fechamento passa a poder ser por ponto de venda (caixa 1, caixa 2).
    // Não há valor a preencher nos registros antigos: ponto nulo continua sendo
    // o caixa único de sempre, e quem quiser separar cadastra os pontos.
    this.version(3).stores({
      pontos: 'id, nome, ativo',
      fechamentos: 'id, data, pontoId',
    });

    // v4: cartão da empresa, para lançar a fatura com o vencimento calculado
    // pelo ciclo do cartão em vez de digitado.
    this.version(4).stores({
      cartoes: 'id, nome, ativo',
    });

    // v5: conta bancária e o saldo do extrato informado no mês, que é a única
    // forma de conferir o que o app mostra sem marcar cada pagamento.
    this.version(5).stores({
      contasBancarias: 'id, nome, ativo',
      conferencias: 'id, contaBancariaId, competencia',
    });
  }
}

export const db = new BancoMercadoFacil();

/** Nomes das tabelas na ordem em que aparecem no backup. */
export const TABELAS = [
  'fechamentos',
  'pontos',
  'fornecedores',
  'contas',
  'cartoes',
  'contasBancarias',
  'conferencias',
  'despesas',
  'custos',
  'funcionarios',
  'folha',
  'indicadores',
] as const;

export type NomeTabela = (typeof TABELAS)[number];
