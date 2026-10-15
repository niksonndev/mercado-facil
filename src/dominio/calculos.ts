import { FORMAS_PAGAMENTO } from './categorias';
import { adicionarMeses, competenciaDe, diferencaEmDias, hojeISO } from './datas';
import { somarCentavos } from './dinheiro';
import type {
  Acervo,
  Centavos,
  Competencia,
  DataISO,
  Despesa,
  FechamentoCaixa,
  FolhaItem,
  FormaPagamento,
  Situacao,
} from './tipos';

export type PorForma = Record<FormaPagamento, Centavos>;

const porFormaZerado = (): PorForma => ({
  dinheiro: 0,
  pix: 0,
  debito: 0,
  credito: 0,
});

export interface ResumoFechamento {
  /** Tudo que foi vendido no dia, incluindo o que ficou no fiado. */
  vendas: Centavos;
  /** O que efetivamente entrou (dinheiro, PIX, débito, crédito). */
  recebido: Centavos;
  fiado: Centavos;
  porForma: PorForma;
}

export function resumoFechamento(fechamento: FechamentoCaixa): ResumoFechamento {
  const porForma: PorForma = {
    dinheiro: fechamento.dinheiro,
    pix: fechamento.pix,
    debito: fechamento.debito,
    credito: fechamento.credito,
  };
  const recebido = somarCentavos(Object.values(porForma));

  return {
    vendas: recebido + fechamento.fiado,
    recebido,
    fiado: fechamento.fiado,
    porForma,
  };
}

/**
 * Quanto deveria sobrar de dinheiro na gaveta.
 *
 * É o troco do início do dia mais as vendas em dinheiro, menos o que saiu
 * (retiradas e pagamentos feitos com o dinheiro do caixa).
 */
export function dinheiroEsperadoEmCaixa(
  fechamento: FechamentoCaixa,
  saidasEmDinheiro: Centavos,
): Centavos {
  return fechamento.fundoInicial + fechamento.dinheiro - saidasEmDinheiro;
}

/** Retiradas e pagamentos diversos feitos em dinheiro do próprio caixa. */
export function saidasEmDinheiro(despesas: Despesa[]): Centavos {
  return somarCentavos(
    despesas
      .filter((despesa) => despesa.formaPagamento === 'dinheiro' && despesa.retiradaDoCaixa)
      .map((despesa) => despesa.valor),
  );
}

export function despesasDoDia(despesas: Despesa[], data: DataISO): Despesa[] {
  return despesas.filter((despesa) => despesa.data === data);
}

export function situacaoDoCompromisso(
  pagoEm: DataISO | null,
  vencimento: DataISO,
  hoje: DataISO = hojeISO(),
): Situacao {
  if (pagoEm) return 'pago';
  const dias = diferencaEmDias(hoje, vencimento);
  if (dias < 0) return 'atrasado';
  if (dias === 0) return 'vence-hoje';
  return 'a-vencer';
}

/** A folha costuma ser paga até o dia 5 do mês seguinte. */
export function vencimentoPadraoFolha(competencia: Competencia): DataISO {
  return `${adicionarMeses(competencia, 1)}-05`;
}

export interface CalculoFolha {
  /** Salário mais proventos. */
  bruto: Centavos;
  /** Descontos do funcionário (faltas, adiantamentos). */
  descontos: Centavos;
  /** O que o funcionário recebe. */
  liquido: Centavos;
  /** O que a empresa desembolsa: bruto + FGTS + encargos. */
  custoEmpresa: Centavos;
}

export function calcularFolha(item: FolhaItem): CalculoFolha {
  const bruto = item.salarioBase + item.proventos;
  return {
    bruto,
    descontos: item.descontos,
    liquido: bruto - item.descontos,
    custoEmpresa: bruto + item.fgts + item.encargos,
  };
}

export interface CompromissoPendente {
  origem: 'conta' | 'custo' | 'folha';
  /** Id do registro de origem, para a tela abrir o lançamento certo. */
  id: string;
  titulo: string;
  detalhe: string;
  vencimento: DataISO;
  valor: Centavos;
  situacao: Situacao;
}

/**
 * Tudo que ainda não foi pago, junto e em ordem de vencimento: contas de
 * fornecedor, custos operacionais e folha.
 */
export function compromissosPendentes(
  acervo: Acervo,
  hoje: DataISO = hojeISO(),
): CompromissoPendente[] {
  const pendentes: CompromissoPendente[] = [];

  for (const conta of acervo.contas) {
    if (conta.pagoEm) continue;
    pendentes.push({
      origem: 'conta',
      id: conta.id,
      titulo: conta.fornecedorNome || 'Sem fornecedor',
      detalhe: conta.descricao,
      vencimento: conta.vencimento,
      valor: conta.valor,
      situacao: situacaoDoCompromisso(null, conta.vencimento, hoje),
    });
  }

  for (const custo of acervo.custos) {
    if (custo.pagoEm) continue;
    pendentes.push({
      origem: 'custo',
      id: custo.id,
      titulo: custo.descricao,
      detalhe: `Custo fixo · ${custo.competencia}`,
      vencimento: custo.vencimento,
      valor: custo.valorPrevisto,
      situacao: situacaoDoCompromisso(null, custo.vencimento, hoje),
    });
  }

  for (const item of acervo.folha) {
    if (item.pagoEm) continue;
    pendentes.push({
      origem: 'folha',
      id: item.id,
      titulo: item.funcionarioNome || 'Folha de pagamento',
      detalhe: `Folha · ${item.competencia}`,
      vencimento: item.vencimento,
      valor: calcularFolha(item).custoEmpresa,
      situacao: situacaoDoCompromisso(null, item.vencimento, hoje),
    });
  }

  return pendentes.sort((a, b) => a.vencimento.localeCompare(b.vencimento));
}

export interface Pendencias {
  atrasadas: CompromissoPendente[];
  vencemHoje: CompromissoPendente[];
  proximas: CompromissoPendente[];
  totalEmAberto: Centavos;
  totalAtrasado: Centavos;
}

export function pendencias(acervo: Acervo, hoje: DataISO = hojeISO()): Pendencias {
  const todos = compromissosPendentes(acervo, hoje);
  const DIAS_PROXIMAS = 7;

  return {
    atrasadas: todos.filter((item) => item.situacao === 'atrasado'),
    vencemHoje: todos.filter((item) => item.situacao === 'vence-hoje'),
    proximas: todos.filter((item) => {
      const dias = diferencaEmDias(hoje, item.vencimento);
      return dias > 0 && dias <= DIAS_PROXIMAS;
    }),
    totalEmAberto: somarCentavos(todos.map((item) => item.valor)),
    totalAtrasado: somarCentavos(
      todos
        .filter((item) => item.situacao === 'atrasado')
        .map((item) => item.valor),
    ),
  };
}

export interface SaidasDoMes {
  fornecedores: Centavos;
  despesas: Centavos;
  retiradas: Centavos;
  custos: Centavos;
  folha: Centavos;
  total: Centavos;
}

export interface ResumoDoMes {
  competencia: Competencia;
  /** Vendas do mês, com o fiado incluído. */
  vendas: Centavos;
  /** O que entrou no caixa (sem o fiado). */
  recebido: Centavos;
  fiado: Centavos;
  fundoInicial: Centavos;
  porForma: PorForma;
  diasLancados: number;
  saidas: SaidasDoMes;
  /** Vendas menos tudo que saiu. */
  resultado: Centavos;
  /** Resultado sobre as vendas (0 quando não houve venda). */
  margem: number;
  emAberto: Centavos;
  atrasado: Centavos;
}

/**
 * Fecha um mês: entradas do caixa, saídas pagas e o que ficou em aberto.
 *
 * As saídas contam pela data de pagamento (regime de caixa), então um boleto
 * vencido em setembro mas pago em outubro aparece em outubro.
 */
export function resumoDoMes(
  competencia: Competencia,
  acervo: Acervo,
  hoje: DataISO = hojeISO(),
): ResumoDoMes {
  const fechamentos = acervo.fechamentos.filter(
    (fechamento) => competenciaDe(fechamento.data) === competencia,
  );

  const porForma = porFormaZerado();
  let fiado = 0;
  let fundoInicial = 0;

  for (const fechamento of fechamentos) {
    const resumo = resumoFechamento(fechamento);
    for (const forma of FORMAS_PAGAMENTO) {
      porForma[forma.valor] += resumo.porForma[forma.valor];
    }
    fiado += resumo.fiado;
    fundoInicial += fechamento.fundoInicial;
  }

  const recebido = somarCentavos(Object.values(porForma));
  const vendas = recebido + fiado;

  const fornecedores = somarCentavos(
    acervo.contas
      .filter((conta) => conta.pagoEm && competenciaDe(conta.pagoEm) === competencia)
      .map((conta) => conta.valorPago ?? conta.valor),
  );

  const despesasDoMes = acervo.despesas.filter(
    (despesa) => competenciaDe(despesa.data) === competencia,
  );
  const retiradas = somarCentavos(
    despesasDoMes
      .filter((despesa) => despesa.tipo === 'retirada')
      .map((despesa) => despesa.valor),
  );
  const despesas = somarCentavos(
    despesasDoMes
      .filter((despesa) => despesa.tipo !== 'retirada')
      .map((despesa) => despesa.valor),
  );

  const custos = somarCentavos(
    acervo.custos
      .filter((custo) => custo.pagoEm && competenciaDe(custo.pagoEm) === competencia)
      .map((custo) => custo.valorPago ?? custo.valorPrevisto),
  );

  const folha = somarCentavos(
    acervo.folha
      .filter((item) => item.pagoEm && competenciaDe(item.pagoEm) === competencia)
      .map((item) => item.valorPago ?? calcularFolha(item).custoEmpresa),
  );

  const total = fornecedores + despesas + retiradas + custos + folha;
  const aguardando = pendencias(acervo, hoje);

  return {
    competencia,
    vendas,
    recebido,
    fiado,
    fundoInicial,
    porForma,
    diasLancados: fechamentos.length,
    saidas: { fornecedores, despesas, retiradas, custos, folha, total },
    resultado: vendas - total,
    margem: vendas === 0 ? 0 : (vendas - total) / vendas,
    emAberto: aguardando.totalEmAberto,
    atrasado: aguardando.totalAtrasado,
  };
}

export interface DreDoMes {
  competencia: Competencia;
  /** Vendas do mês por forma de pagamento (o dinheiro que entrou). */
  porForma: PorForma;
  /** Vendas no fiado: entram na receita mesmo sem ter entrado no caixa. */
  fiado: Centavos;
  /** Vendas brutas do mês. */
  receitaBruta: Centavos;
  /** Deduções sobre a venda: taxas de cartão e impostos. */
  taxas: Centavos;
  impostos: Centavos;
  totalDeducoes: Centavos;
  receitaLiquida: Centavos;
  /**
   * Custo da mercadoria vendida, informado à mão na tela do DRE.
   *
   * Zero conta como "não informado" de propósito: é melhor o DRE avisar que o
   * lucro está inflado do que deixar um zero passar por custo real.
   */
  cmv: Centavos;
  /** `false` enquanto o mês não tiver CMV informado (zero incluído). */
  cmvInformado: boolean;
  lucroBruto: Centavos;
  /** Despesas que mantêm a loja aberta, sem o custo da mercadoria. */
  custosOperacionais: Centavos;
  folha: Centavos;
  despesasDiversas: Centavos;
  totalDespesasOperacionais: Centavos;
  resultadoOperacional: Centavos;
  /** Retiradas do dono: saem do lucro, mas não são despesa da loja. */
  retiradas: Centavos;
  /** O que sobrou no fim das contas: negativo é prejuízo. */
  resultadoLiquido: Centavos;
  /** Lucro bruto sobre a receita líquida (0 quando não houve venda). */
  margemBruta: number;
  /** Resultado líquido sobre a receita bruta (0 quando não houve venda). */
  margemLiquida: number;
  /** Compras pagas a fornecedor no mês — memória de cálculo, não é despesa. */
  comprasFornecedores: Centavos;
  diasLancados: number;
}

/**
 * Demonstrativo do resultado do mês (DRE): receitas − despesas = lucro/prejuízo.
 *
 * A diferença central para o relatório de caixa é o CMV: no caixa, a compra de
 * fornecedor aparece como saída; aqui ela não entra, porque comprar mercadoria
 * é trocar dinheiro por estoque, não gastar. Quem mede o gasto da mercadoria
 * que efetivamente saiu é o CMV informado no mês.
 *
 * Como o resto do app, receitas e despesas seguem o movimento do mês (regime de
 * caixa): uma conta paga em outubro conta em outubro, mesmo vencida em setembro.
 */
export function dre(
  competencia: Competencia,
  acervo: Acervo,
  hoje: DataISO = hojeISO(),
): DreDoMes {
  const resumo = resumoDoMes(competencia, acervo, hoje);

  const despesasDoMes = acervo.despesas.filter(
    (despesa) => despesa.tipo !== 'retirada' && competenciaDe(despesa.data) === competencia,
  );
  const somarDespesas = (filtrar: (categoria: string) => boolean): Centavos =>
    somarCentavos(
      despesasDoMes.filter((despesa) => filtrar(despesa.categoria)).map((d) => d.valor),
    );

  const custosPagosDoMes = acervo.custos.filter(
    (custo) => custo.pagoEm && competenciaDe(custo.pagoEm) === competencia,
  );
  const somarCustos = (filtrar: (categoria: string) => boolean): Centavos =>
    somarCentavos(
      custosPagosDoMes
        .filter((custo) => filtrar(custo.categoria))
        .map((custo) => custo.valorPago ?? custo.valorPrevisto),
    );

  const taxas = somarDespesas((categoria) => categoria === 'taxas');
  const impostos = somarCustos((categoria) => categoria === 'impostos');

  const custosOperacionais = somarCustos((categoria) => categoria !== 'impostos');
  const despesasDiversas = somarDespesas((categoria) => categoria !== 'taxas');
  const folha = resumo.saidas.folha;
  const retiradas = resumo.saidas.retiradas;

  const indicador = acervo.indicadores.find((item) => item.competencia === competencia);
  const cmv = indicador?.cmv ?? 0;

  const receitaBruta = resumo.vendas;
  const totalDeducoes = taxas + impostos;
  const receitaLiquida = receitaBruta - totalDeducoes;
  const lucroBruto = receitaLiquida - cmv;
  const totalDespesasOperacionais = custosOperacionais + folha + despesasDiversas;
  const resultadoOperacional = lucroBruto - totalDespesasOperacionais;
  const resultadoLiquido = resultadoOperacional - retiradas;

  return {
    competencia,
    porForma: resumo.porForma,
    fiado: resumo.fiado,
    receitaBruta,
    taxas,
    impostos,
    totalDeducoes,
    receitaLiquida,
    cmv,
    cmvInformado: cmv > 0,
    lucroBruto,
    custosOperacionais,
    folha,
    despesasDiversas,
    totalDespesasOperacionais,
    resultadoOperacional,
    retiradas,
    resultadoLiquido,
    margemBruta: receitaLiquida === 0 ? 0 : lucroBruto / receitaLiquida,
    margemLiquida: receitaBruta === 0 ? 0 : resultadoLiquido / receitaBruta,
    comprasFornecedores: resumo.saidas.fornecedores,
    diasLancados: resumo.diasLancados,
  };
}

export interface VendaDoDia {
  data: DataISO;
  dia: number;
  vendas: Centavos;
  recebido: Centavos;
}

/** Vendas dia a dia da competência, para o gráfico do relatório. */
export function vendasPorDia(
  fechamentos: FechamentoCaixa[],
  competencia: Competencia,
): VendaDoDia[] {
  return fechamentos
    .filter((fechamento) => competenciaDe(fechamento.data) === competencia)
    .map((fechamento) => {
      const resumo = resumoFechamento(fechamento);
      return {
        data: fechamento.data,
        dia: Number(fechamento.data.slice(8)),
        vendas: resumo.vendas,
        recebido: resumo.recebido,
      };
    })
    .sort((a, b) => a.dia - b.dia);
}

/** Total da folha (custo para a empresa) em uma competência. */
export function totalFolhaCompetencia(
  folha: FolhaItem[],
  competencia: Competencia,
): Centavos {
  return somarCentavos(
    folha
      .filter((item) => item.competencia === competencia)
      .map((item) => calcularFolha(item).custoEmpresa),
  );
}

/** Índice dos fechamentos por data, para achar o dia sem varrer a lista. */
export function indexarPorData(
  fechamentos: FechamentoCaixa[],
): Map<DataISO, FechamentoCaixa> {
  return new Map(fechamentos.map((fechamento) => [fechamento.data, fechamento]));
}
