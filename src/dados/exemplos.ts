import { vencimentoPadraoFolha } from '../dominio/calculos';
import { adicionarDias, adicionarMeses, hojeISO, mesAtual } from '../dominio/datas';
import type {
  Conta,
  CustoOperacional,
  DataISO,
  Despesa,
  FechamentoCaixa,
  FolhaItem,
  Fornecedor,
  Funcionario,
} from '../dominio/tipos';
import { db } from './db';

/**
 * Gerador determinístico (LCG): o mesmo exemplo em qualquer máquina, para a
 * demonstração não mudar de valores a cada clique.
 */
function sorteador(semente: number): () => number {
  let estado = semente >>> 0;
  return () => {
    estado = (estado * 1664525 + 1013904223) >>> 0;
    return estado / 4294967296;
  };
}

/**
 * Preenche o app com um mês de movimento fictício de mercadinho.
 *
 * Serve para conhecer as telas e conferir o relatório antes de lançar o
 * movimento real. O fechamento de hoje fica em aberto de propósito — é o que a
 * tela inicial pede para fazer.
 */
export async function carregarExemplos(hoje: DataISO = hojeISO()): Promise<void> {
  const sorteio = sorteador(20261015);
  const competencia = mesAtual();
  const anterior = adicionarMeses(competencia, -1);
  const agora = new Date().toISOString();

  const id = () => crypto.randomUUID();
  const reais = (valor: number) => Math.round(valor * 100);

  const fornecedores: Fornecedor[] = [
    ['Distribuidora Central', '12.345.678/0001-90', '(82) 3322-1010'],
    ['Atacadão Bebidas', '98.765.432/0001-11', '(82) 3322-2020'],
    ['Laticínios Vale Verde', '11.222.333/0001-44', '(82) 3322-3030'],
    ['Hortifruti Bom Preço', '55.666.777/0001-88', '(82) 99111-4040'],
    ['Embalagens Alagoas', '33.444.555/0001-22', '(82) 3322-5050'],
  ].map(([nome, cnpj, telefone]) => ({
    id: id(),
    nome: nome ?? '',
    cnpj: cnpj ?? '',
    telefone: telefone ?? '',
    observacao: '',
    criadoEm: agora,
  }));

  const nomesFornecedores = fornecedores.map((fornecedor) => fornecedor.nome);

  const funcionarios: Funcionario[] = [
    { nome: 'Maria de Lourdes', cargo: 'Caixa', salarioBase: reais(1621) },
    { nome: 'José Carlos', cargo: 'Repositor', salarioBase: reais(1720) },
    { nome: 'Ana Paula', cargo: 'Auxiliar de limpeza', salarioBase: reais(918) },
  ].map((base) => ({
    id: id(),
    nome: base.nome,
    cargo: base.cargo,
    salarioBase: base.salarioBase,
    admissao: `${adicionarMeses(competencia, -14)}-05`,
    ativo: true,
    criadoEm: agora,
  }));

  // Fechamentos do dia 1 até ontem: hoje continua em aberto.
  const fechamentos: FechamentoCaixa[] = [];
  const ultimoDia = Number(hoje.slice(8)) - 1;

  for (let dia = 1; dia <= ultimoDia; dia += 1) {
    const data = `${competencia}-${String(dia).padStart(2, '0')}`;
    const domingo = new Date(`${data}T12:00:00`).getDay() === 0;
    const movimento = domingo ? 0.45 : 1;

    const vendas =
      (reais(1900) + Math.round(sorteio() * reais(2100))) * movimento;

    fechamentos.push({
      id: id(),
      data,
      fundoInicial: reais(200),
      dinheiro: Math.round(vendas * (0.3 + sorteio() * 0.08)),
      pix: Math.round(vendas * (0.3 + sorteio() * 0.06)),
      debito: Math.round(vendas * (0.15 + sorteio() * 0.05)),
      credito: Math.round(vendas * (0.12 + sorteio() * 0.05)),
      fiado: Math.round(vendas * (0.02 + sorteio() * 0.04)),
      observacao: '',
      criadoEm: agora,
      atualizadoEm: agora,
    });
  }

  const contasBase: Array<Omit<Conta, 'id' | 'criadoEm' | 'atualizadoEm'>> = [
    {
      tipo: 'boleto',
      fornecedorId: fornecedores[0]?.id ?? null,
      fornecedorNome: nomesFornecedores[0] ?? '',
      descricao: 'Pedido de mercearia',
      valor: reais(4820.9),
      emissao: adicionarDias(hoje, -22),
      vencimento: adicionarDias(hoje, -4),
      chequeNumero: '',
      chequeBanco: '',
      pagoEm: null,
      valorPago: null,
      formaPagamento: null,
      observacao: '',
    },
    {
      tipo: 'boleto',
      fornecedorId: fornecedores[1]?.id ?? null,
      fornecedorNome: nomesFornecedores[1] ?? '',
      descricao: 'Bebidas e refrigerantes',
      valor: reais(2310.5),
      emissao: adicionarDias(hoje, -12),
      vencimento: adicionarDias(hoje, 6),
      chequeNumero: '',
      chequeBanco: '',
      pagoEm: null,
      valorPago: null,
      formaPagamento: null,
      observacao: 'Conferir se veio a caixa de refrigerante extra',
    },
    {
      tipo: 'boleto',
      fornecedorId: fornecedores[2]?.id ?? null,
      fornecedorNome: nomesFornecedores[2] ?? '',
      descricao: 'Frios e laticínios',
      valor: reais(1289.4),
      emissao: adicionarDias(hoje, -30),
      vencimento: `${anterior}-28`,
      chequeNumero: '',
      chequeBanco: '',
      pagoEm: `${anterior}-28`,
      valorPago: reais(1289.4),
      formaPagamento: 'pix',
      observacao: '',
    },
    {
      tipo: 'cheque',
      fornecedorId: fornecedores[0]?.id ?? null,
      fornecedorNome: nomesFornecedores[0] ?? '',
      descricao: 'Cheque pré-datado do pedido grande',
      valor: reais(3500),
      emissao: adicionarDias(hoje, -40),
      vencimento: adicionarDias(hoje, 11),
      chequeNumero: '000431',
      chequeBanco: 'Banco do Brasil',
      pagoEm: null,
      valorPago: null,
      formaPagamento: null,
      observacao: '',
    },
    {
      tipo: 'cheque',
      fornecedorId: fornecedores[4]?.id ?? null,
      fornecedorNome: nomesFornecedores[4] ?? '',
      descricao: 'Sacolas e embalagens',
      valor: reais(940),
      emissao: adicionarDias(hoje, -45),
      vencimento: adicionarDias(hoje, -2),
      chequeNumero: '000388',
      chequeBanco: 'Caixa Econômica',
      pagoEm: null,
      valorPago: null,
      formaPagamento: null,
      observacao: 'Cheque ainda não compensou',
    },
    {
      tipo: 'avista',
      fornecedorId: fornecedores[3]?.id ?? null,
      fornecedorNome: nomesFornecedores[3] ?? '',
      descricao: 'Compra de hortifruti na semana',
      valor: reais(760.3),
      emissao: adicionarDias(hoje, -3),
      vencimento: adicionarDias(hoje, -3),
      chequeNumero: '',
      chequeBanco: '',
      pagoEm: adicionarDias(hoje, -3),
      valorPago: reais(760.3),
      formaPagamento: 'dinheiro',
      observacao: '',
    },
    {
      tipo: 'avista',
      fornecedorId: fornecedores[1]?.id ?? null,
      fornecedorNome: nomesFornecedores[1] ?? '',
      descricao: 'Reposição de cerveja',
      valor: reais(1120),
      emissao: adicionarDias(hoje, -1),
      vencimento: adicionarDias(hoje, -1),
      chequeNumero: '',
      chequeBanco: '',
      pagoEm: adicionarDias(hoje, -1),
      valorPago: reais(1120),
      formaPagamento: 'debito',
      observacao: '',
    },
  ];

  const contas: Conta[] = contasBase.map((conta) => ({
    ...conta,
    id: id(),
    criadoEm: agora,
    atualizadoEm: agora,
  }));

  const despesasBase: Array<Omit<Despesa, 'id' | 'criadoEm'>> = [
    {
      tipo: 'retirada',
      descricao: 'Retirada do dono',
      categoria: 'geral',
      valor: reais(1200),
      data: adicionarDias(hoje, -7),
      formaPagamento: 'dinheiro',
      retiradaDoCaixa: true,
      beneficiario: 'Dono',
      observacao: '',
    },
    {
      tipo: 'retirada',
      descricao: 'Retirada para despesa pessoal',
      categoria: 'pessoal',
      valor: reais(800),
      data: adicionarDias(hoje, -1),
      formaPagamento: 'dinheiro',
      retiradaDoCaixa: true,
      beneficiario: 'Dono',
      observacao: '',
    },
    {
      tipo: 'diversos',
      descricao: 'Motoboy das entregas da semana',
      categoria: 'transporte',
      valor: reais(240),
      data: adicionarDias(hoje, -5),
      formaPagamento: 'pix',
      retiradaDoCaixa: false,
      beneficiario: 'Entregas Rápido',
      observacao: '',
    },
    {
      tipo: 'diversos',
      descricao: 'Conserto do freezer',
      categoria: 'manutencao',
      valor: reais(680),
      data: adicionarDias(hoje, -9),
      formaPagamento: 'credito',
      retiradaDoCaixa: false,
      beneficiario: 'Refrigeração Silva',
      observacao: 'Trocou o termostato',
    },
    {
      tipo: 'diversos',
      descricao: 'Taxa da máquina de cartão',
      categoria: 'taxas',
      valor: reais(189.9),
      data: adicionarDias(hoje, -2),
      formaPagamento: 'debito',
      retiradaDoCaixa: false,
      beneficiario: 'Adquirente',
      observacao: '',
    },
  ];

  const despesas: Despesa[] = despesasBase.map((despesa) => ({
    ...despesa,
    id: id(),
    criadoEm: agora,
  }));

  const modelosCustos: Array<{
    categoria: CustoOperacional['categoria'];
    descricao: string;
    valor: number;
    dia: number;
  }> = [
    { categoria: 'aluguel', descricao: 'Aluguel da loja', valor: 3800, dia: 5 },
    { categoria: 'energia', descricao: 'Conta de energia', valor: 1450.75, dia: 12 },
    { categoria: 'agua', descricao: 'Conta de água', valor: 320.4, dia: 15 },
    { categoria: 'internet', descricao: 'Internet e telefone', valor: 199.9, dia: 10 },
    { categoria: 'contabilidade', descricao: 'Honorários do contador', valor: 480, dia: 8 },
  ];

  const custos: CustoOperacional[] = [];
  for (const competenciaDoMes of [anterior, competencia]) {
    for (const modelo of modelosCustos) {
      const vencimento = `${competenciaDoMes}-${String(modelo.dia).padStart(2, '0')}`;
      const vencido = vencimento < hoje;
      const pago = competenciaDoMes === anterior ? true : vencido;

      custos.push({
        id: id(),
        categoria: modelo.categoria,
        descricao: modelo.descricao,
        competencia: competenciaDoMes,
        valorPrevisto: reais(modelo.valor),
        vencimento,
        recorrente: true,
        pagoEm: pago ? vencimento : null,
        valorPago: pago ? reais(modelo.valor) : null,
        formaPagamento: pago ? 'pix' : null,
        observacao: '',
        criadoEm: agora,
        atualizadoEm: agora,
      });
    }
  }

  const folha: FolhaItem[] = [];
  for (const funcionario of funcionarios) {
    const base = {
      funcionarioId: funcionario.id,
      funcionarioNome: funcionario.nome,
      salarioBase: funcionario.salarioBase,
      proventos: 0,
      descontos: 0,
      fgts: Math.round(funcionario.salarioBase * 0.08),
      encargos: Math.round(funcionario.salarioBase * 0.2),
      observacao: '',
      criadoEm: agora,
    };

    folha.push({
      ...base,
      id: id(),
      competencia: anterior,
      vencimento: vencimentoPadraoFolha(anterior),
      pagoEm: vencimentoPadraoFolha(anterior),
      valorPago: funcionario.salarioBase + base.fgts + base.encargos,
    });

    folha.push({
      ...base,
      id: id(),
      competencia,
      vencimento: vencimentoPadraoFolha(competencia),
      pagoEm: null,
      valorPago: null,
    });
  }

  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((tabela) => tabela.clear()));
    await db.fornecedores.bulkPut(fornecedores);
    await db.funcionarios.bulkPut(funcionarios);
    await db.fechamentos.bulkPut(fechamentos);
    await db.contas.bulkPut(contas);
    await db.despesas.bulkPut(despesas);
    await db.custos.bulkPut(custos);
    await db.folha.bulkPut(folha);
  });
}
