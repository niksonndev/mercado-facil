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

/**
 * Ponto de venda: o caixa físico da loja.
 *
 * Um mercadinho de bairro tem um só e não precisa cadastrar nada. Quem tem
 * dois ou três (ou um supermercado, com um caixa por operador) cadastra cada um
 * e fecha o dia caixa por caixa, como faz no balcão.
 */
export interface PontoDeVenda {
  id: Id;
  nome: string;
  /** Inativo sai das escolhas novas e fica fora da conta de dias sem fechamento. */
  ativo: boolean;
  criadoEm: string;
}

/**
 * Prazo que a máquina leva para creditar a venda.
 *
 * É o que separa "vendeu" de "entrou na conta": a venda no crédito entra no
 * caixa do dia, mas o dinheiro só aparece na conta na data prevista.
 */
export type PrazoCredito =
  | 'avista'
  | '7-dias'
  | '14-dias'
  | '30-dias'
  | '31-dias'
  | 'mes-seguinte';

/** Fechamento de caixa de um dia (o que o mercadinho anota à noite). */
export interface FechamentoCaixa {
  id: Id;
  /** Dia do movimento. Existe um fechamento por data e por ponto de venda. */
  data: DataISO;
  /**
   * Caixa que fechou o dia.
   *
   * `null` é o caixa único de quem não separa ponto de venda: é o caso do
   * mercadinho de bairro. Separar em dois exige cadastrar os pontos, e aí cada
   * fechamento aponta para o seu.
   */
  pontoId: Id | null;
  /** Funcionário responsável pelo caixa naquele dia. */
  responsavelId: Id | null;
  /** Nome copiado no fechamento: não depende de o funcionário continuar cadastrado. */
  responsavelNome: string;
  /** Troco que começou o dia no caixa. */
  fundoInicial: Centavos;
  dinheiro: Centavos;
  pix: Centavos;
  debito: Centavos;
  credito: Centavos;
  /** Total vendido a prazo (caderneta). */
  fiado: Centavos;
  /** Prazo combinado com a máquina para as vendas no crédito. */
  prazoCredito: PrazoCredito;
  /** Dia em que o crédito do dia caiu na conta; nulo enquanto não caiu. */
  creditoRecebidoEm: DataISO | null;
  /** Quanto a adquirente depositou, que pode ser menor que a venda (taxa). */
  creditoRecebidoValor: Centavos | null;
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

/** Boleto, cheque, compra à vista ou fatura do cartão da empresa. */
export type TipoConta = 'boleto' | 'cheque' | 'avista' | 'fatura';

/**
 * Cartão de crédito da empresa.
 *
 * O que interessa aqui não é a bandeira, e sim o ciclo da fatura: quando ela
 * fecha e quando vence. Com isso o app responde a pergunta que o lojista faz
 * antes de comprar ("melhor dia de compra") e calcula o vencimento sozinho.
 */
export interface Cartao {
  id: Id;
  nome: string;
  /** Dia do mês em que a fatura fecha. */
  diaFechamento: number;
  /** Dia do mês em que a fatura vence. */
  diaVencimento: number;
  ativo: boolean;
  criadoEm: string;
}

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
  /** Cartão da empresa, quando o lançamento é uma fatura. */
  cartaoId: Id | null;
  cartaoNome: string;
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

/**
 * Números que o app não consegue deduzir sozinho e a pessoa informa à mão.
 *
 * O CMV (custo da mercadoria vendida) é o que separa o DRE do relatório de
 * caixa: a compra de fornecedor é reposição de estoque, não despesa do mês.
 * Existe um registro por competência — a própria competência é a chave.
 */
export interface IndicadoresDre {
  competencia: Competencia;
  /** Custo da mercadoria vendida no mês. */
  cmv: Centavos;
  observacao: string;
  atualizadoEm: string;
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
  indicadores: IndicadoresDre[];
}
