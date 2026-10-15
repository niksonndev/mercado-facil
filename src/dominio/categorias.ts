import type {
  CategoriaCusto,
  CategoriaDespesa,
  FormaPagamento,
  PrazoCredito,
  TipoConta,
  TipoDespesa,
} from './tipos';

interface Opcao<T extends string> {
  valor: T;
  rotulo: string;
  /** Cor da série, usada em gráfico, etiqueta e legenda. */
  cor: string;
}

export const FORMAS_PAGAMENTO: Opcao<FormaPagamento>[] = [
  { valor: 'dinheiro', rotulo: 'Dinheiro', cor: '#34d399' },
  { valor: 'pix', rotulo: 'PIX', cor: '#22d3ee' },
  { valor: 'debito', rotulo: 'Débito', cor: '#a78bfa' },
  { valor: 'credito', rotulo: 'Crédito', cor: '#fbbf24' },
];

/** O fiado é venda a prazo; entra no fechamento ao lado das formas de pagamento. */
export const FIADO = { valor: 'fiado', rotulo: 'Fiado', cor: '#fb7185' } as const;

/**
 * Prazos de crédito da máquina.
 *
 * Os rótulos são os que o lojista lê no contrato da adquirente (D+30, primeiro
 * dia útil do mês seguinte), não uma contagem de dias abstrata.
 */
export const PRAZOS_CREDITO: Opcao<PrazoCredito>[] = [
  { valor: 'avista', rotulo: 'À vista (1 dia útil)', cor: '#34d399' },
  { valor: '7-dias', rotulo: '7 dias', cor: '#22d3ee' },
  { valor: '14-dias', rotulo: '14 dias', cor: '#38bdf8' },
  { valor: '30-dias', rotulo: '30 dias', cor: '#fbbf24' },
  { valor: '31-dias', rotulo: '31 dias', cor: '#fb923c' },
  { valor: 'mes-seguinte', rotulo: 'Primeiro dia útil do mês seguinte', cor: '#c084fc' },
];

export const TIPOS_CONTA: Opcao<TipoConta>[] = [
  { valor: 'boleto', rotulo: 'Boleto', cor: '#38bdf8' },
  { valor: 'cheque', rotulo: 'Cheque', cor: '#c084fc' },
  { valor: 'avista', rotulo: 'À vista', cor: '#34d399' },
  { valor: 'fatura', rotulo: 'Fatura de cartão', cor: '#f472b6' },
];

export const TIPOS_DESPESA: Opcao<TipoDespesa>[] = [
  { valor: 'retirada', rotulo: 'Retirada de caixa', cor: '#fb7185' },
  { valor: 'diversos', rotulo: 'Pagamento diverso', cor: '#fbbf24' },
];

export const CATEGORIAS_DESPESA: Opcao<CategoriaDespesa>[] = [
  { valor: 'geral', rotulo: 'Geral', cor: '#94a3b8' },
  { valor: 'transporte', rotulo: 'Transporte e entrega', cor: '#38bdf8' },
  { valor: 'manutencao', rotulo: 'Manutenção', cor: '#c084fc' },
  { valor: 'taxas', rotulo: 'Taxas e tarifas', cor: '#fbbf24' },
  { valor: 'pessoal', rotulo: 'Pessoal', cor: '#34d399' },
  { valor: 'outros', rotulo: 'Outros', cor: '#94a3b8' },
];

export const CATEGORIAS_CUSTO: Opcao<CategoriaCusto>[] = [
  { valor: 'aluguel', rotulo: 'Aluguel', cor: '#fb7185' },
  { valor: 'energia', rotulo: 'Energia', cor: '#fbbf24' },
  { valor: 'agua', rotulo: 'Água', cor: '#38bdf8' },
  { valor: 'internet', rotulo: 'Internet', cor: '#22d3ee' },
  { valor: 'telefone', rotulo: 'Telefone', cor: '#a78bfa' },
  { valor: 'contabilidade', rotulo: 'Contabilidade', cor: '#c084fc' },
  { valor: 'sistema', rotulo: 'Sistema e software', cor: '#818cf8' },
  { valor: 'manutencao', rotulo: 'Manutenção', cor: '#34d399' },
  { valor: 'impostos', rotulo: 'Impostos e taxas', cor: '#f472b6' },
  { valor: 'outros', rotulo: 'Outros', cor: '#94a3b8' },
];

/** Rótulo de uma opção pelo valor, sem estourar quando o dado é antigo. */
function rotulador<T extends string>(opcoes: Opcao<T>[]) {
  return (valor: T | null | undefined): string =>
    opcoes.find((opcao) => opcao.valor === valor)?.rotulo ?? '—';
}

function coloridor<T extends string>(opcoes: Opcao<T>[]) {
  return (valor: T | null | undefined): string =>
    opcoes.find((opcao) => opcao.valor === valor)?.cor ?? '#94a3b8';
}

export const rotuloForma = rotulador(FORMAS_PAGAMENTO);
export const corForma = coloridor(FORMAS_PAGAMENTO);
export function rotuloPrazoCredito(prazo: PrazoCredito): string {
  return PRAZOS_CREDITO.find((opcao) => opcao.valor === prazo)?.rotulo ?? '30 dias';
}

/** Prazo padrão de quem não mexeu nesse campo: o D+30 mais comum. */
export const PRAZO_CREDITO_PADRAO: PrazoCredito = '30-dias';

export const rotuloTipoConta = rotulador(TIPOS_CONTA);
export const corTipoConta = coloridor(TIPOS_CONTA);
export const rotuloTipoDespesa = rotulador(TIPOS_DESPESA);
export const rotuloCategoriaDespesa = rotulador(CATEGORIAS_DESPESA);
export const rotuloCategoriaCusto = rotulador(CATEGORIAS_CUSTO);
export const corCategoriaCusto = coloridor(CATEGORIAS_CUSTO);
