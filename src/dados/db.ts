import Dexie, { type Table } from 'dexie';
import type {
  Conta,
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
  }
}

export const db = new BancoMercadoFacil();

/** Nomes das tabelas na ordem em que aparecem no backup. */
export const TABELAS = [
  'fechamentos',
  'pontos',
  'fornecedores',
  'contas',
  'despesas',
  'custos',
  'funcionarios',
  'folha',
  'indicadores',
] as const;

export type NomeTabela = (typeof TABELAS)[number];
