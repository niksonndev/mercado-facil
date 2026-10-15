/**
 * Formas de pagamento aceitas no caixa e no pagamento de contas.
 *
 * `fiado` é um tipo de venda, não de recebimento: entra no fechamento como
 * valor vendido a prazo e não como dinheiro que entrou no caixa.
 */
export type FormaPagamento = 'dinheiro' | 'pix' | 'debito' | 'credito';

/** Identificador de registro (uuid). */
export type Id = string;

/** Data no formato 'AAAA-MM-DD', sempre em fuso local e sem hora. */
export type DataISO = string;

/** Competência mensal no formato 'AAAA-MM'. */
export type Competencia = string;

/** Dinheiro em centavos inteiros — nunca float, para não perder centavo. */
export type Centavos = number;

/** Fechamento de caixa de um dia (o que o mercadinho anota à noite). */
export interface FechamentoCaixa {
  id: Id;
  /** Dia do movimento. Só existe um fechamento por data. */
  data: DataISO;
  /** Troco que começou o dia no caixa. */
  fundoInicial: Centavos;
  dinheiro: Centavos;
  pix: Centavos;
  debito: Centavos;
  credito: Centavos;
  /** Total vendido a prazo (caderneta). */
  fiado: Centavos;
  observacao: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Fornecedor {
  id: Id;
  nome: string;
  cnpj: string;
  telefone: string;
  observacao: string;
  criadoEm: string;
}

/** Boleto, cheque ou compra à vista de um fornecedor. */
export type TipoConta = 'boleto' | 'cheque' | 'avista';

export interface Conta {
  id: Id;
  tipo: TipoConta;
  fornecedorId: Id | null;
  /** Nome copiado no lançamento: a conta não depende do cadastro existir. */
  fornecedorNome: string;
  descricao: string;
  valor: Centavos;
  /** Data do pedido/compra. */
  emissao: DataISO | null;
  vencimento: DataISO;
  chequeNumero: string;
  chequeBanco: string;
  pagoEm: DataISO | null;
  valorPago: Centavos | null;
  formaPagamento: FormaPagamento | null;
  observacao: string;
  criadoEm: string;
  atualizadoEm: string;
}

/** Retirada de caixa (sangria) ou pagamento diverso. */
export type TipoDespesa = 'retirada' | 'diversos';

export type CategoriaDespesa =
  | 'geral'
  | 'transporte'
  | 'manutencao'
  | 'taxas'
  | 'pessoal'
  | 'outros';

export interface Despesa {
  id: Id;
  tipo: TipoDespesa;
  descricao: string;
  categoria: CategoriaDespesa;
  valor: Centavos;
  data: DataISO;
  formaPagamento: FormaPagamento;
  /** Retirada de caixa desconta do dinheiro que deveria estar na gaveta. */
  retiradaDoCaixa: boolean;
  beneficiario: string;
  observacao: string;
  criadoEm: string;
}

/** Custo fixo/estrutural: aluguel, energia, água, contabilidade... */
export type CategoriaCusto =
  | 'aluguel'
  | 'energia'
  | 'agua'
  | 'internet'
  | 'telefone'
  | 'contabilidade'
  | 'sistema'
  | 'manutencao'
  | 'impostos'
  | 'outros';

export interface CustoOperacional {
  id: Id;
  categoria: CategoriaCusto;
  descricao: string;
  competencia: Competencia;
  valorPrevisto: Centavos;
  vencimento: DataISO;
  /** Mês a mês o mesmo custo se repete; a tela oferece repetir no próximo mês. */
  recorrente: boolean;
  pagoEm: DataISO | null;
  valorPago: Centavos | null;
  formaPagamento: FormaPagamento | null;
  observacao: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Funcionario {
  id: Id;
  nome: string;
  cargo: string;
  salarioBase: Centavos;
  admissao: DataISO | null;
  ativo: boolean;
  criadoEm: string;
}

/** Folha de um funcionário em uma competência (mês). */
export interface FolhaItem {
  id: Id;
  competencia: Competencia;
  funcionarioId: Id | null;
  funcionarioNome: string;
  salarioBase: Centavos;
  /** Horas extras, comissão, bônus. */
  proventos: Centavos;
  /** Faltas, adiantamentos e demais descontos do funcionário. */
  descontos: Centavos;
  /** Verba trabalhista paga pela empresa. */
  fgts: Centavos;
  /** INSS patronal e outros encargos da empresa. */
  encargos: Centavos;
  /** Quando a folha deve ser paga (por padrão, dia 5 do mês seguinte). */
  vencimento: DataISO;
  pagoEm: DataISO | null;
  valorPago: Centavos | null;
  observacao: string;
  criadoEm: string;
}

/** Situação de um compromisso calculada na leitura, não gravada. */
export type Situacao = 'pago' | 'atrasado' | 'vence-hoje' | 'a-vencer';

/** Tudo que o relatório precisa, já carregado do banco. */
export interface Acervo {
  fechamentos: FechamentoCaixa[];
  contas: Conta[];
  despesas: Despesa[];
  custos: CustoOperacional[];
  folha: FolhaItem[];
}
