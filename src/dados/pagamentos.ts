import type { CompromissoPendente } from '../dominio/calculos';
import { db } from './db';
import { salvarConta, salvarCusto, salvarFolha } from './repositorio';
import type { Pagamento } from '../componentes/GavetaPagamento';

/**
 * Dá baixa em um compromisso em aberto, seja conta, custo ou folha.
 *
 * A tela de pendências mistura os três numa lista só (é assim que o dono
 * enxerga o mês), então a origem vem junto para gravar no lugar certo.
 */
export async function pagarCompromisso(
  compromisso: CompromissoPendente,
  pagamento: Pagamento,
): Promise<void> {
  if (compromisso.origem === 'conta') {
    const conta = await db.contas.get(compromisso.id);
    if (!conta) return;
    await salvarConta({
      ...conta,
      pagoEm: pagamento.pagoEm,
      valorPago: pagamento.valorPago,
      formaPagamento: pagamento.formaPagamento,
    });
    return;
  }

  if (compromisso.origem === 'custo') {
    const custo = await db.custos.get(compromisso.id);
    if (!custo) return;
    await salvarCusto({
      ...custo,
      pagoEm: pagamento.pagoEm,
      valorPago: pagamento.valorPago,
      formaPagamento: pagamento.formaPagamento,
    });
    return;
  }

  const item = await db.folha.get(compromisso.id);
  if (!item) return;
  await salvarFolha({
    ...item,
    pagoEm: pagamento.pagoEm,
    valorPago: pagamento.valorPago,
  });
}

/** Tira um compromisso da lista de pendências. */
export async function excluirCompromisso(compromisso: CompromissoPendente): Promise<void> {
  if (compromisso.origem === 'conta') return db.contas.delete(compromisso.id);
  if (compromisso.origem === 'custo') return db.custos.delete(compromisso.id);
  return db.folha.delete(compromisso.id);
}
