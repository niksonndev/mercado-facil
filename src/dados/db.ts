import Dexie, { type Table } from 'dexie';
import type {
  Conta,
  CustoOperacional,
  Despesa,
  FechamentoCaixa,
  FolhaItem,
  Fornecedor,
  Funcionario,
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
  fornecedores!: Table<Fornecedor, string>;
  contas!: Table<Conta, string>;
  despesas!: Table<Despesa, string>;
  custos!: Table<CustoOperacional, string>;
  funcionarios!: Table<Funcionario, string>;
  folha!: Table<FolhaItem, string>;

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
  }
}

export const db = new BancoMercadoFacil();

/** Nomes das tabelas na ordem em que aparecem no backup. */
export const TABELAS = [
  'fechamentos',
  'fornecedores',
  'contas',
  'despesas',
  'custos',
  'funcionarios',
  'folha',
] as const;

export type NomeTabela = (typeof TABELAS)[number];
