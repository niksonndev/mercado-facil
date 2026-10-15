import { describe, expect, it } from 'vitest';
import {
  agendaRecebiveis,
  calcularFolha,
  chaveFechamento,
  compromissosPendentes,
  dataPrevistaCredito,
  dinheiroEsperadoEmCaixa,
  dre,
  fechamentosPorDia,
  indexarPorFechamento,
  melhorDiaDeCompra,
  pendencias,
  resumoDoMes,
  resumoFechamento,
  resumoPorPonto,
  resumoRecebiveis,
  rotuloPonto,
  saidasEmDinheiro,
  situacaoDoCompromisso,
  vendasPorDia,
  vencimentoDaFatura,
  vencimentoPadraoFolha,
} from './calculos';
import type {
  Acervo,
  Cartao,
  Conta,
  CustoOperacional,
  Despesa,
  FechamentoCaixa,
  FolhaItem,
  IndicadoresDre,
  PontoDeVenda,
} from './tipos';

const HOJE = '2026-10-15';

function fechamento(campos: Partial<FechamentoCaixa> & { data: string }): FechamentoCaixa {
  return {
    id: `f-${campos.data}`,
    pontoId: null,
    responsavelId: null,
    responsavelNome: '',
    prazoCredito: '30-dias',
    creditoRecebidoEm: null,
    creditoRecebidoValor: null,
    fundoInicial: 0,
    dinheiro: 0,
    pix: 0,
    debito: 0,
    credito: 0,
    fiado: 0,
    observacao: '',
    criadoEm: '2026-10-01T00:00:00.000Z',
    atualizadoEm: '2026-10-01T00:00:00.000Z',
    ...campos,
  };
}

function conta(campos: Partial<Conta> & { vencimento: string; valor: number }): Conta {
  return {
    id: `c-${campos.vencimento}-${campos.valor}`,
    tipo: 'boleto',
    fornecedorId: null,
    fornecedorNome: 'Distribuidora Central',
    descricao: 'Pedido',
    emissao: null,
    chequeNumero: '',
    chequeBanco: '',
    cartaoId: null,
    cartaoNome: '',
    pagoEm: null,
    valorPago: null,
    formaPagamento: null,
    observacao: '',
    criadoEm: '2026-10-01T00:00:00.000Z',
    atualizadoEm: '2026-10-01T00:00:00.000Z',
    ...campos,
  };
}

function despesa(campos: Partial<Despesa> & { data: string; valor: number }): Despesa {
  return {
    id: `d-${campos.data}-${campos.valor}`,
    tipo: 'diversos',
    descricao: 'Despesa',
    categoria: 'geral',
    formaPagamento: 'dinheiro',
    retiradaDoCaixa: false,
    beneficiario: '',
    observacao: '',
    criadoEm: '2026-10-01T00:00:00.000Z',
    ...campos,
  };
}

function custo(
  campos: Partial<CustoOperacional> & { vencimento: string; valorPrevisto: number },
): CustoOperacional {
  return {
    id: `cu-${campos.vencimento}`,
    categoria: 'outros',
    descricao: 'Custo',
    competencia: campos.vencimento.slice(0, 7),
    recorrente: true,
    pagoEm: null,
    valorPago: null,
    formaPagamento: null,
    observacao: '',
    criadoEm: '2026-10-01T00:00:00.000Z',
    atualizadoEm: '2026-10-01T00:00:00.000Z',
    ...campos,
  };
}

function folhaItem(campos: Partial<FolhaItem> & { competencia: string }): FolhaItem {
  return {
    id: `fo-${campos.competencia}`,
    funcionarioId: null,
    funcionarioNome: 'Maria',
    salarioBase: 180000,
    proventos: 0,
    descontos: 0,
    fgts: 14400,
    encargos: 36000,
    vencimento: vencimentoPadraoFolha(campos.competencia),
    pagoEm: null,
    valorPago: null,
    observacao: '',
    criadoEm: '2026-10-01T00:00:00.000Z',
    ...campos,
  };
}

const ACERVO: Acervo = {
  fechamentos: [
    fechamento({
      data: '2026-10-14',
      fundoInicial: 20000,
      dinheiro: 50000,
      pix: 30000,
      debito: 10000,
      credito: 20000,
      fiado: 5000,
    }),
    fechamento({
      data: '2026-10-15',
      fundoInicial: 20000,
      dinheiro: 40000,
      pix: 20000,
      debito: 5000,
      credito: 10000,
      fiado: 2000,
    }),
    fechamento({ data: '2026-09-30', dinheiro: 999999 }),
  ],
  contas: [
    conta({ vencimento: '2026-10-10', valor: 30000, pagoEm: '2026-10-10', valorPago: 30000 }),
    conta({ vencimento: '2026-10-05', valor: 12000 }),
    conta({ vencimento: '2026-10-18', valor: 8000 }),
    conta({ vencimento: '2026-10-15', valor: 5000 }),
    conta({ vencimento: '2026-09-28', valor: 9900, pagoEm: '2026-09-28', valorPago: 9900 }),
  ],
  despesas: [
    despesa({
      data: '2026-10-13',
      valor: 20000,
      tipo: 'retirada',
      retiradaDoCaixa: true,
      formaPagamento: 'dinheiro',
    }),
    despesa({ data: '2026-10-14', valor: 3500, formaPagamento: 'pix' }),
    despesa({ data: '2026-09-30', valor: 1500 }),
  ],
  custos: [
    custo({
      vencimento: '2026-10-05',
      valorPrevisto: 150000,
      categoria: 'aluguel',
      pagoEm: '2026-10-05',
      valorPago: 150000,
    }),
    custo({ vencimento: '2026-10-20', valorPrevisto: 45000, categoria: 'energia' }),
    custo({ vencimento: '2026-10-08', valorPrevisto: 12000, categoria: 'agua' }),
  ],
  folha: [folhaItem({ competencia: '2026-09', pagoEm: '2026-10-05' })],
  indicadores: [],
};

describe('fechamento do dia', () => {
  it('separa o que entrou do que ficou no fiado', () => {
    const resumo = resumoFechamento(
      fechamento({
        data: HOJE,
        dinheiro: 10000,
        pix: 5000,
        debito: 2000,
        credito: 3000,
        fiado: 1500,
      }),
    );

    expect(resumo.recebido).toBe(20000);
    expect(resumo.fiado).toBe(1500);
    expect(resumo.vendas).toBe(21500);
    expect(resumo.porForma.pix).toBe(5000);
  });

  it('calcula o dinheiro que deveria sobrar na gaveta', () => {
    const dia = fechamento({ data: HOJE, fundoInicial: 10000, dinheiro: 45000 });
    expect(dinheiroEsperadoEmCaixa(dia, 20000)).toBe(35000);
    expect(dinheiroEsperadoEmCaixa(dia, 0)).toBe(55000);
  });

  it('só desconta do caixa o que saiu em dinheiro do próprio caixa', () => {
    expect(
      saidasEmDinheiro([
        despesa({ data: HOJE, valor: 20000, tipo: 'retirada', retiradaDoCaixa: true }),
        despesa({
          data: HOJE,
          valor: 9000,
          retiradaDoCaixa: true,
          formaPagamento: 'pix',
        }),
        despesa({ data: HOJE, valor: 5000, retiradaDoCaixa: false }),
      ]),
    ).toBe(20000);
  });
});

describe('situação dos compromissos', () => {
  it('classifica pelo vencimento', () => {
    expect(situacaoDoCompromisso(null, '2026-10-14', HOJE)).toBe('atrasado');
    expect(situacaoDoCompromisso(null, '2026-10-15', HOJE)).toBe('vence-hoje');
    expect(situacaoDoCompromisso(null, '2026-10-16', HOJE)).toBe('a-vencer');
    expect(situacaoDoCompromisso('2026-10-01', '2026-10-14', HOJE)).toBe('pago');
  });

  it('lista o que está em aberto em ordem de vencimento', () => {
    const pendentes = compromissosPendentes(ACERVO, HOJE);

    expect(pendentes.map((item) => item.vencimento)).toEqual([
      '2026-10-05',
      '2026-10-08',
      '2026-10-15',
      '2026-10-18',
      '2026-10-20',
    ]);
    expect(pendentes.map((item) => item.origem)).toEqual([
      'conta',
      'custo',
      'conta',
      'conta',
      'custo',
    ]);
  });

  it('usa o custo da empresa como valor da folha em aberto', () => {
    const pendente = compromissosPendentes(
      {
        ...ACERVO,
        contas: [],
        custos: [],
        folha: [folhaItem({ competencia: '2026-09' })],
      },
      HOJE,
    )[0];

    expect(pendente?.valor).toBe(230400);
    expect(pendente?.titulo).toBe('Maria');
    expect(pendente?.vencimento).toBe('2026-10-05');
  });

  it('separa atrasado, vence hoje e próximo', () => {
    const resultado = pendencias(ACERVO, HOJE);

    expect(resultado.atrasadas).toHaveLength(2);
    expect(resultado.vencemHoje).toHaveLength(1);
    expect(resultado.proximas).toHaveLength(2);
    expect(resultado.totalEmAberto).toBe(82000);
    expect(resultado.totalAtrasado).toBe(24000);
  });
});

describe('folha de pagamento', () => {
  it('separa o que o funcionário recebe do que a empresa gasta', () => {
    const calculo = calcularFolha(
      folhaItem({ competencia: '2026-09', proventos: 20000, descontos: 5000 }),
    );

    expect(calculo.bruto).toBe(200000);
    expect(calculo.liquido).toBe(195000);
    expect(calculo.custoEmpresa).toBe(250400);
  });

  it('vence no dia 5 do mês seguinte', () => {
    expect(vencimentoPadraoFolha('2026-09')).toBe('2026-10-05');
    expect(vencimentoPadraoFolha('2026-12')).toBe('2027-01-05');
  });
});

describe('resumo do mês', () => {
  const resumo = resumoDoMes('2026-10', ACERVO, HOJE);

  it('soma as entradas por forma de pagamento e ignora outro mês', () => {
    expect(resumo.porForma).toEqual({
      dinheiro: 90000,
      pix: 50000,
      debito: 15000,
      credito: 30000,
    });
    expect(resumo.recebido).toBe(185000);
    expect(resumo.fiado).toBe(7000);
    expect(resumo.vendas).toBe(192000);
    expect(resumo.diasLancados).toBe(2);
    expect(resumo.fundoInicial).toBe(40000);
  });

  it('conta as saídas pela data de pagamento', () => {
    expect(resumo.saidas.fornecedores).toBe(30000);
    expect(resumo.saidas.retiradas).toBe(20000);
    expect(resumo.saidas.despesas).toBe(3500);
    expect(resumo.saidas.custos).toBe(150000);
    expect(resumo.saidas.folha).toBe(230400);
    expect(resumo.saidas.total).toBe(433900);
  });

  it('fecha o resultado e o que continua em aberto', () => {
    expect(resumo.resultado).toBe(-241900);
    expect(resumo.emAberto).toBe(82000);
    expect(resumo.atrasado).toBe(24000);
  });

  it('não estoura com mês sem nenhum lançamento', () => {
    const vazio = resumoDoMes('2026-07', ACERVO, HOJE);
    expect(vazio.vendas).toBe(0);
    expect(vazio.saidas.total).toBe(0);
    expect(vazio.resultado).toBe(0);
    expect(vazio.margem).toBe(0);
  });

  it('monta a série dia a dia para o gráfico', () => {
    const serie = vendasPorDia(ACERVO.fechamentos, '2026-10');
    expect(serie.map((item) => [item.dia, item.vendas])).toEqual([
      [14, 115000],
      [15, 77000],
    ]);
  });
});

describe('DRE do mês', () => {
  const indicador = (cmv: number): IndicadoresDre => ({
    competencia: '2026-10',
    cmv,
    observacao: '',
    atualizadoEm: '2026-10-15T00:00:00.000Z',
  });

  const ACERVO_DRE: Acervo = {
    fechamentos: [
      fechamento({
        data: '2026-10-10',
        dinheiro: 400000,
        pix: 200000,
        debito: 100000,
        credito: 100000,
        fiado: 50000,
      }),
    ],
    contas: [],
    despesas: [
      despesa({ data: '2026-10-02', valor: 5000, categoria: 'taxas' }),
      despesa({ data: '2026-10-03', valor: 3000, categoria: 'transporte' }),
      despesa({ data: '2026-10-04', valor: 10000, tipo: 'retirada' }),
    ],
    custos: [
      custo({
        vencimento: '2026-10-05',
        valorPrevisto: 8000,
        categoria: 'impostos',
        pagoEm: '2026-10-05',
        valorPago: 8000,
      }),
      custo({
        vencimento: '2026-10-06',
        valorPrevisto: 100000,
        categoria: 'aluguel',
        pagoEm: '2026-10-06',
        valorPago: 100000,
      }),
    ],
    folha: [folhaItem({ competencia: '2026-10', pagoEm: '2026-10-05' })],
    indicadores: [indicador(400000)],
  };

  it('monta o demonstrativo do começo ao fim, dando lucro', () => {
    const resultado = dre('2026-10', ACERVO_DRE, HOJE);

    expect(resultado.receitaBruta).toBe(850000);
    expect(resultado.porForma.dinheiro).toBe(400000);
    expect(resultado.fiado).toBe(50000);

    // Taxas de cartão e impostos saem da receita antes de tudo.
    expect(resultado.taxas).toBe(5000);
    expect(resultado.impostos).toBe(8000);
    expect(resultado.totalDeducoes).toBe(13000);
    expect(resultado.receitaLiquida).toBe(837000);

    expect(resultado.cmv).toBe(400000);
    expect(resultado.cmvInformado).toBe(true);
    expect(resultado.lucroBruto).toBe(437000);

    expect(resultado.custosOperacionais).toBe(100000);
    expect(resultado.folha).toBe(230400);
    expect(resultado.despesasDiversas).toBe(3000);
    expect(resultado.totalDespesasOperacionais).toBe(333400);

    expect(resultado.resultadoOperacional).toBe(103600);
    expect(resultado.retiradas).toBe(10000);
    expect(resultado.resultadoLiquido).toBe(93600);
    expect(resultado.margemLiquida).toBeGreaterThan(0);
  });

  it('fecha no prejuízo quando o CMV engole a margem', () => {
    const resultado = dre(
      '2026-10',
      { ...ACERVO_DRE, indicadores: [indicador(800000)] },
      HOJE,
    );

    expect(resultado.lucroBruto).toBe(37000);
    expect(resultado.resultadoOperacional).toBe(-296400);
    expect(resultado.resultadoLiquido).toBe(-306400);
    expect(resultado.margemLiquida).toBeLessThan(0);
  });

  it('avisa quando o CMV do mês ainda não foi informado', () => {
    const resultado = dre('2026-10', { ...ACERVO_DRE, indicadores: [] }, HOJE);

    expect(resultado.cmv).toBe(0);
    expect(resultado.cmvInformado).toBe(false);
    // Sem CMV o lucro bruto fica superestimado — é o que a tela precisa avisar.
    expect(resultado.lucroBruto).toBe(837000);
  });

  it('trata CMV zerado como não informado, para não haver lucro de mentira', () => {
    const resultado = dre(
      '2026-10',
      { ...ACERVO_DRE, indicadores: [indicador(0)] },
      HOJE,
    );

    expect(resultado.cmvInformado).toBe(false);
    expect(resultado.lucroBruto).toBe(837000);
  });

  it('separa as despesas do mês sem perder nem duplicar centavo', () => {
    const resultado = dre('2026-10', ACERVO_DRE, HOJE);
    const resumo = resumoDoMes('2026-10', ACERVO_DRE, HOJE);

    // As deduções e as despesas operacionais somam exatamente o que o
    // relatório de caixa chamou de saída — nada fica de fora do DRE.
    expect(resultado.taxas + resultado.despesasDiversas).toBe(resumo.saidas.despesas);
    expect(resultado.impostos + resultado.custosOperacionais).toBe(resumo.saidas.custos);
    expect(resultado.folha).toBe(resumo.saidas.folha);
    expect(resultado.retiradas).toBe(resumo.saidas.retiradas);
  });

  it('mostra as compras de fornecedor só como memória, fora do resultado', () => {
    const resultado = dre('2026-10', ACERVO, HOJE);
    const resumo = resumoDoMes('2026-10', ACERVO, HOJE);

    expect(resultado.comprasFornecedores).toBe(30000);
    // O DRE sem CMV informado ignora a compra: o lucro bruto não a desconta.
    expect(resultado.lucroBruto).toBe(resumo.vendas);
    expect(resultado.cmvInformado).toBe(false);
  });

  it('não estoura com mês sem nenhum lançamento', () => {
    const vazio = dre('2026-07', ACERVO, HOJE);
    expect(vazio.receitaBruta).toBe(0);
    expect(vazio.resultadoLiquido).toBe(0);
    expect(vazio.margemBruta).toBe(0);
    expect(vazio.margemLiquida).toBe(0);
  });
});

describe('pontos de venda', () => {
  const caixa1: PontoDeVenda = { id: 'p1', nome: 'Caixa 1', ativo: true, criadoEm: '' };
  const caixa2: PontoDeVenda = { id: 'p2', nome: 'Caixa 2', ativo: true, criadoEm: '' };

  const MES: FechamentoCaixa[] = [
    fechamento({ id: 'f1', data: HOJE, pontoId: 'p1', dinheiro: 10000, credito: 5000 }),
    fechamento({ id: 'f2', data: HOJE, pontoId: 'p2', dinheiro: 4000, credito: 2000 }),
    fechamento({ id: 'f3', data: '2026-10-14', dinheiro: 7000 }),
  ];

  it('identifica cada fechamento por dia e ponto de venda', () => {
    const indice = indexarPorFechamento(MES);

    expect(indice.get(chaveFechamento({ data: HOJE, pontoId: 'p1' }))?.id).toBe('f1');
    expect(indice.get(chaveFechamento({ data: HOJE, pontoId: 'p2' }))?.id).toBe('f2');
    expect(indice.get(chaveFechamento({ data: '2026-10-14', pontoId: null }))?.id).toBe('f3');
  });

  it('agrupa os dois caixas no mesmo dia', () => {
    const porDia = fechamentosPorDia(MES);

    expect(porDia.get(HOJE)?.map((item) => item.id)).toEqual(['f1', 'f2']);
    expect(porDia.get('2026-10-14')?.length).toBe(1);
  });

  it('soma os dois caixas no mesmo ponto do gráfico', () => {
    const serie = vendasPorDia(MES, '2026-10');

    expect(serie.map((item) => [item.dia, item.vendas])).toEqual([
      [14, 7000],
      [15, 21000],
    ]);
  });

  it('separa as vendas do mês por caixa, do maior para o menor', () => {
    const resumo = resumoPorPonto([caixa1, caixa2], MES, '2026-10');

    expect(resumo.map((item) => [item.nome, item.vendas, item.dias])).toEqual([
      ['Caixa 1', 15000, 1],
      ['Caixa único', 7000, 1],
      ['Caixa 2', 6000, 1],
    ]);
  });

  it('chama de caixa único o fechamento sem ponto de venda cadastrado', () => {
    expect(rotuloPonto([caixa1], null)).toBe('Caixa único');
    expect(rotuloPonto([caixa1], 'p1')).toBe('Caixa 1');
    // Ponto apagado depois do fechamento: o histórico não pode virar "undefined".
    expect(rotuloPonto([caixa1], 'p9')).toBe('Caixa removido');
  });
});

describe('fatura do cartão da empresa', () => {
  const cartao = (campos: Partial<Cartao> = {}): Cartao => ({
    id: 'k1',
    nome: 'Cartão da loja',
    diaFechamento: 20,
    diaVencimento: 28,
    ativo: true,
    criadoEm: '',
    ...campos,
  });

  it('joga a compra feita até o fechamento para a fatura do mês', () => {
    expect(vencimentoDaFatura(cartao(), '2026-10-05')).toBe('2026-10-28');
    // No próprio dia do fechamento a compra ainda entra nesta fatura.
    expect(vencimentoDaFatura(cartao(), '2026-10-20')).toBe('2026-10-28');
  });

  it('empurra a compra depois do fechamento para a fatura seguinte', () => {
    expect(vencimentoDaFatura(cartao(), '2026-10-21')).toBe('2026-11-28');
  });

  it('vence no mês seguinte quando o vencimento vem antes do fechamento', () => {
    const doBanco = cartao({ diaFechamento: 25, diaVencimento: 5 });

    expect(vencimentoDaFatura(doBanco, '2026-10-10')).toBe('2026-11-05');
  });

  it('não estoura o mês quando o dia combinado não existe nele', () => {
    const trintaEUm = cartao({ diaFechamento: 31, diaVencimento: 31 });

    expect(vencimentoDaFatura(trintaEUm, '2026-02-10')).toBe('2026-02-28');
  });

  it('aponta o melhor dia de compra como o dia seguinte ao fechamento', () => {
    expect(melhorDiaDeCompra(cartao())).toBe(21);
    // Cartão que fecha no fim do mês: o melhor dia volta para o começo.
    expect(melhorDiaDeCompra(cartao({ diaFechamento: 28 }))).toBe(1);
  });
});

describe('recebíveis das máquinas', () => {
  it('calcula o dia em que o crédito cai em cada prazo', () => {
    // 01/10/2026 é quinta-feira.
    expect(dataPrevistaCredito('2026-10-01', '7-dias')).toBe('2026-10-08');
    expect(dataPrevistaCredito('2026-10-01', '14-dias')).toBe('2026-10-15');
    expect(dataPrevistaCredito('2026-10-01', '30-dias')).toBe('2026-10-31');

    // Sexta mais um dia cai no sábado: o crédito à vista entra na segunda.
    expect(dataPrevistaCredito('2026-10-09', 'avista')).toBe('2026-10-12');

    // Primeiro dia útil do mês seguinte: 01/11 é domingo, então cai em 02/11.
    expect(dataPrevistaCredito('2026-10-01', 'mes-seguinte')).toBe('2026-11-02');
    expect(dataPrevistaCredito('2026-10-20', 'mes-seguinte')).toBe('2026-11-02');
  });

  const ACERVO_CREDITO: Acervo = {
    fechamentos: [
      // Venceu em 08/10 e não caiu: está atrasado.
      fechamento({ id: 'c1', data: '2026-10-01', credito: 10000, prazoCredito: '7-dias' }),
      fechamento({ id: 'c2', data: '2026-10-10', credito: 20000, prazoCredito: '30-dias' }),
      // Já recebido, e a máquina depositou menos que a venda (taxa).
      fechamento({
        id: 'c3',
        data: '2026-10-12',
        credito: 5000,
        prazoCredito: '7-dias',
        creditoRecebidoEm: '2026-10-19',
        creditoRecebidoValor: 4800,
      }),
      // Dia sem venda no crédito não gera recebível.
      fechamento({ id: 'c4', data: '2026-10-13', dinheiro: 9000 }),
    ],
    contas: [],
    despesas: [],
    custos: [],
    folha: [],
    indicadores: [],
  };

  it('monta a agenda só com os dias que venderam no crédito', () => {
    const agenda = agendaRecebiveis(ACERVO_CREDITO, HOJE);

    expect(agenda.map((item) => [item.fechamentoId, item.dataPrevista, item.atrasado])).toEqual([
      ['c1', '2026-10-08', true],
      ['c3', '2026-10-19', false],
      ['c2', '2026-11-09', false],
    ]);
  });

  it('separa o que vai cair, o que atrasou e o que já caiu', () => {
    const resumo = resumoRecebiveis(agendaRecebiveis(ACERVO_CREDITO, HOJE));

    expect(resumo.aReceber).toBe(30000);
    expect(resumo.atrasado).toBe(10000);
    expect(resumo.abertos.length).toBe(2);
    // O que a máquina depositou, não o que foi vendido.
    expect(resumo.recebido).toBe(4800);
  });

  it('não considera atrasado o crédito já recebido', () => {
    const recebidos = agendaRecebiveis(ACERVO_CREDITO, HOJE).filter(
      (item) => item.recebidoEm,
    );

    expect(recebidos.map((item) => item.atrasado)).toEqual([false]);
  });
});
