import { FORMAS_PAGAMENTO } from './categorias';
import {
  adicionarDias,
  adicionarMeses,
  competenciaDe,
  diferencaEmDias,
  hojeISO,
  paraDate,
  ultimoDiaDoMes,
} from './datas';
import { somarCentavos } from './dinheiro';
import type {
  Acervo,
  Cartao,
  Centavos,
  Competencia,
  ContaBancaria,
  DataISO,
  Despesa,
  FechamentoCaixa,
  FolhaItem,
  FormaPagamento,
  Id,
  PontoDeVenda,
  PrazoCredito,
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
  const porDia = new Map<DataISO, VendaDoDia>();

  for (const fechamento of fechamentos) {
    if (competenciaDe(fechamento.data) !== competencia) continue;
    const resumo = resumoFechamento(fechamento);
    const doDia = porDia.get(fechamento.data);

    if (doDia) {
      // Dois caixas fechados no mesmo dia somam no mesmo ponto do gráfico.
      doDia.vendas += resumo.vendas;
      doDia.recebido += resumo.recebido;
    } else {
      porDia.set(fechamento.data, {
        data: fechamento.data,
        dia: Number(fechamento.data.slice(8)),
        vendas: resumo.vendas,
        recebido: resumo.recebido,
      });
    }
  }

  return [...porDia.values()].sort((a, b) => a.dia - b.dia);
}

/**
 * Quando o dinheiro das vendas no crédito cai na conta.
 *
 * O "primeiro dia útil do mês seguinte" é o que a maioria das adquirentes usa
 * para quem vende no crédito parcelado: a data pula o fim de semana, mas não
 * considera feriado, o que é aceitável para uma previsão.
 */
export function dataPrevistaCredito(data: DataISO, prazo: PrazoCredito): DataISO {
  switch (prazo) {
    case 'avista':
      return proximoDiaUtil(adicionarDias(data, 1));
    case '7-dias':
      return adicionarDias(data, 7);
    case '14-dias':
      return adicionarDias(data, 14);
    case '31-dias':
      return adicionarDias(data, 31);
    case 'mes-seguinte':
      return proximoDiaUtil(`${adicionarMeses(competenciaDe(data), 1)}-01`);
    case '30-dias':
    default:
      return adicionarDias(data, 30);
  }
}

/** Anda para a frente até cair em um dia de semana. */
export function proximoDiaUtil(data: DataISO): DataISO {
  let dia = data;
  while ([0, 6].includes(paraDate(dia).getDay())) {
    dia = adicionarDias(dia, 1);
  }
  return dia;
}

export interface Recebivel {
  fechamentoId: Id;
  /** Dia da venda que gerou o crédito. */
  data: DataISO;
  pontoId: Id | null;
  valor: Centavos;
  prazo: PrazoCredito;
  /** Dia em que o dinheiro deve cair na conta. */
  dataPrevista: DataISO;
  recebidoEm: DataISO | null;
  /** Quanto a adquirente depositou; nulo cai igual ao valor da venda. */
  valorRecebido: Centavos | null;
  /** Dias até cair; negativo quando a data prevista já passou. */
  diasParaCair: number;
  atrasado: boolean;
}

/**
 * Agenda do que as máquinas ainda vão creditar.
 *
 * O app já conta a venda no dia em que ela aconteceu (regime de caixa); esta
 * lista é a previsão de quando o dinheiro do crédito aparece na conta, para o
 * lojista não achar que o saldo do banco está errado.
 */
export function agendaRecebiveis(
  acervo: Acervo,
  hoje: DataISO = hojeISO(),
): Recebivel[] {
  return acervo.fechamentos
    .filter((fechamento) => fechamento.credito > 0)
    .map((fechamento) => {
      const dataPrevista = dataPrevistaCredito(
        fechamento.data,
        fechamento.prazoCredito,
      );
      const diasParaCair = diferencaEmDias(hoje, dataPrevista);

      return {
        fechamentoId: fechamento.id,
        data: fechamento.data,
        pontoId: fechamento.pontoId,
        valor: fechamento.credito,
        prazo: fechamento.prazoCredito,
        dataPrevista,
        recebidoEm: fechamento.creditoRecebidoEm,
        valorRecebido: fechamento.creditoRecebidoValor,
        diasParaCair,
        atrasado: !fechamento.creditoRecebidoEm && diasParaCair < 0,
      };
    })
    .sort((a, b) => a.dataPrevista.localeCompare(b.dataPrevista));
}

export interface ResumoRecebiveis {
  /** Ainda não caiu na conta. */
  aReceber: Centavos;
  /** Deveria ter caído e não caiu. */
  atrasado: Centavos;
  atrasados: Recebivel[];
  /** Cai nos próximos 7 dias. */
  proximos: Recebivel[];
  /** Já caiu na conta. */
  recebido: Centavos;
  abertos: Recebivel[];
}

export function resumoRecebiveis(recebiveis: Recebivel[]): ResumoRecebiveis {
  const abertos = recebiveis.filter((item) => !item.recebidoEm);
  const atrasados = abertos.filter((item) => item.atrasado);

  return {
    aReceber: somarCentavos(abertos.map((item) => item.valor)),
    atrasado: somarCentavos(atrasados.map((item) => item.valor)),
    atrasados,
    proximos: abertos.filter((item) => item.diasParaCair >= 0 && item.diasParaCair <= 7),
    recebido: somarCentavos(
      recebiveis
        .filter((item) => item.recebidoEm)
        .map((item) => item.valorRecebido ?? item.valor),
    ),
    abertos,
  };
}

export interface ResumoContaBancaria {
  entradas: Centavos;
  saidas: Centavos;
  /** O que o saldo da conta deveria ter mudado no mês. */
  movimento: Centavos;
  /** De onde veio e para onde foi, para a conferência ter o que mostrar. */
  detalhe: {
    formularios: Centavos;
    pix: Centavos;
    debito: Centavos;
    cartoes: Centavos;
    fornecedores: Centavos;
    custos: Centavos;
    folha: Centavos;
    despesas: Centavos;
  };
}

/** Pagamento que não saiu da gaveta: em tese passou pela conta. */
const saiuDaConta = (forma: FormaPagamento | null): boolean =>
  forma !== null && forma !== 'dinheiro';

/**
 * O que passou pela conta bancária no mês.
 *
 * O app não pergunta, em cada lançamento, de qual conta o dinheiro saiu: quem
 * paga no balcão não sabe disso na hora. Então a conta recebe o que é dela por
 * natureza (PIX, débito e o crédito das máquinas) e paga o que não é dinheiro
 * vivo. A folha entra sempre, porque salário não se paga em dinheiro da gaveta.
 */
export function movimentoEmConta(
  competencia: Competencia,
  acervo: Acervo,
  hoje: DataISO = hojeISO(),
): ResumoContaBancaria {
  const resumo = resumoDoMes(competencia, acervo, hoje);

  const fornecedores = somarCentavos(
    acervo.contas
      .filter(
        (conta) =>
          conta.pagoEm &&
          competenciaDe(conta.pagoEm) === competencia &&
          saiuDaConta(conta.formaPagamento),
      )
      .map((conta) => conta.valorPago ?? conta.valor),
  );

  const custos = somarCentavos(
    acervo.custos
      .filter(
        (custo) =>
          custo.pagoEm &&
          competenciaDe(custo.pagoEm) === competencia &&
          saiuDaConta(custo.formaPagamento),
      )
      .map((custo) => custo.valorPago ?? custo.valorPrevisto),
  );

  const despesas = somarCentavos(
    acervo.despesas
      .filter(
        (despesa) =>
          competenciaDe(despesa.data) === competencia &&
          saiuDaConta(despesa.formaPagamento),
      )
      .map((despesa) => despesa.valor),
  );

  const folha = resumo.saidas.folha;

  const cartoes = somarCentavos(
    agendaRecebiveis(acervo, hoje)
      .filter(
        (item) => item.recebidoEm && competenciaDe(item.recebidoEm) === competencia,
      )
      .map((item) => item.valorRecebido ?? item.valor),
  );

  const formularios = resumo.porForma.pix + resumo.porForma.debito + cartoes;
  const saidas = fornecedores + custos + folha + despesas;

  return {
    entradas: formularios,
    saidas,
    movimento: formularios - saidas,
    detalhe: {
      formularios,
      pix: resumo.porForma.pix,
      debito: resumo.porForma.debito,
      cartoes,
      fornecedores,
      custos,
      folha,
      despesas,
    },
  };
}

/**
 * Saldo que o app espera encontrar no extrato ao fim da competência.
 *
 * Soma o saldo informado na data de partida com o movimento de cada mês até
 * aqui. Cinco anos é o teto do laço: data de partida no futuro ou errada não
 * pode travar a tela.
 */
export function saldoEsperado(
  competencia: Competencia,
  acervo: Acervo,
  conta: ContaBancaria,
  hoje: DataISO = hojeISO(),
): Centavos {
  let saldo = conta.saldoInicial;
  let mes = competenciaDe(conta.dataSaldoInicial);

  for (let passo = 0; passo < 60 && mes <= competencia; passo += 1) {
    saldo += movimentoEmConta(mes, acervo, hoje).movimento;
    mes = adicionarMeses(mes, 1);
  }

  return saldo;
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

/**
 * Chave de um fechamento: existe um por data e por ponto de venda.
 *
 * O ponto nulo (caixa único de quem não separa) também tem a sua chave, então
 * o mercadinho de um caixa só continua enxergando um fechamento por dia.
 */
export function chaveFechamento(
  fechamento: Pick<FechamentoCaixa, 'data' | 'pontoId'>,
): string {
  return `${fechamento.data}|${fechamento.pontoId ?? ''}`;
}

/** Fechamentos agrupados por dia, para a tela do caixa. */
export function fechamentosPorDia(
  fechamentos: FechamentoCaixa[],
): Map<DataISO, FechamentoCaixa[]> {
  const porDia = new Map<DataISO, FechamentoCaixa[]>();

  for (const fechamento of fechamentos) {
    const doDia = porDia.get(fechamento.data);
    if (doDia) {
      doDia.push(fechamento);
    } else {
      porDia.set(fechamento.data, [fechamento]);
    }
  }

  return porDia;
}

/** O dia combinado dentro do mês, sem estourar o fim dele (31 em fevereiro vira 28). */
function diaDoMes(competencia: Competencia, dia: number): DataISO {
  const ultimo = Number(ultimoDiaDoMes(competencia).slice(8));
  const escolhido = Math.min(Math.max(1, Math.round(dia)), ultimo);
  return `${competencia}-${String(escolhido).padStart(2, '0')}`;
}

/**
 * Vencimento da fatura para uma compra feita em `dataCompra`.
 *
 * A compra entra na fatura que fecha no próprio mês quando foi feita até o dia
 * do fechamento; depois disso, cai na fatura seguinte. O vencimento é o dia
 * combinado no mês do fechamento quando ele vem depois, senão no mês seguinte
 * (é o caso do cartão que fecha dia 25 e vence dia 5).
 */
export function vencimentoDaFatura(cartao: Cartao, dataCompra: DataISO): DataISO {
  const mesDaCompra = competenciaDe(dataCompra);
  const fechouNoMes = Number(dataCompra.slice(8)) <= cartao.diaFechamento;
  const mesFechamento = fechouNoMes ? mesDaCompra : adicionarMeses(mesDaCompra, 1);
  const mesmoMes = cartao.diaVencimento >= cartao.diaFechamento;
  const mesVencimento = mesmoMes ? mesFechamento : adicionarMeses(mesFechamento, 1);

  return diaDoMes(mesVencimento, cartao.diaVencimento);
}

/**
 * Melhor dia de compra: o primeiro dia depois do fechamento.
 *
 * Comprar a partir daí empurra a compra para a fatura seguinte, ou seja, quase
 * um mês a mais de prazo para pagar.
 */
export function melhorDiaDeCompra(cartao: Cartao): number {
  return cartao.diaFechamento >= 28 ? 1 : cartao.diaFechamento + 1;
}

/** Índice dos fechamentos pela chave do dia, para abrir um lançamento sem varrer a lista. */
export function indexarPorFechamento(
  fechamentos: FechamentoCaixa[],
): Map<string, FechamentoCaixa> {
  return new Map(fechamentos.map((fechamento) => [chaveFechamento(fechamento), fechamento]));
}

/**
 * Nome do caixa que fechou o dia.
 *
 * O caixa único não tem cadastro: chamá-lo de "Caixa único" evita inventar um
 * ponto de venda que o dono não criou.
 */
export function rotuloPonto(pontos: PontoDeVenda[], pontoId: Id | null): string {
  if (!pontoId) return 'Caixa único';
  return pontos.find((ponto) => ponto.id === pontoId)?.nome ?? 'Caixa removido';
}

export interface ResumoPorPonto {
  pontoId: Id | null;
  nome: string;
  vendas: Centavos;
  recebido: Centavos;
  fiado: Centavos;
  /** Quantos dias aquele caixa fechou no mês. */
  dias: number;
}

/** Vendas do mês separadas por ponto de venda, do que mais vende para o que menos vende. */
export function resumoPorPonto(
  pontos: PontoDeVenda[],
  fechamentos: FechamentoCaixa[],
  competencia: Competencia,
): ResumoPorPonto[] {
  const doMes = fechamentos.filter(
    (fechamento) => competenciaDe(fechamento.data) === competencia,
  );
  const ids = [...new Set(doMes.map((fechamento) => fechamento.pontoId))];

  return ids
    .map((pontoId) => {
      const meus = doMes.filter((fechamento) => fechamento.pontoId === pontoId);
      const resumos = meus.map(resumoFechamento);

      return {
        pontoId,
        nome: rotuloPonto(pontos, pontoId),
        vendas: somarCentavos(resumos.map((resumo) => resumo.vendas)),
        recebido: somarCentavos(resumos.map((resumo) => resumo.recebido)),
        fiado: somarCentavos(resumos.map((resumo) => resumo.fiado)),
        dias: meus.length,
      };
    })
    .sort((a, b) => b.vendas - a.vendas);
}
