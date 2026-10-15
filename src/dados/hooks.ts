import { useLiveQuery } from 'dexie-react-hooks';
import type { Acervo, Cartao, Conta, Despesa, FechamentoCaixa, Fornecedor, Funcionario, PontoDeVenda } from '../dominio/tipos';
import { db } from './db';

/**
 * Todo o movimento do mercadinho, reagindo a qualquer gravação.
 *
 * Carrega as tabelas inteiras de propósito: o relatório do mês precisa cruzar
 * caixa, contas, despesas, custos e folha, e o volume de um mercadinho cabe
 * folgado na memória. Se um dia não couber, o caminho é filtrar por
 * competência aqui — as telas não mudam.
 */
export function useAcervo(): Acervo | undefined {
  return useLiveQuery(async () => {
    const [fechamentos, contas, despesas, custos, folha, indicadores] = await Promise.all([
      db.fechamentos.toArray(),
      db.contas.toArray(),
      db.despesas.toArray(),
      db.custos.toArray(),
      db.folha.toArray(),
      db.indicadores.toArray(),
    ]);

    return { fechamentos, contas, despesas, custos, folha, indicadores };
  }, []);
}

export function useFornecedores(): Fornecedor[] | undefined {
  return useLiveQuery(() => db.fornecedores.orderBy('nome').toArray(), []);
}

export function useFuncionarios(): Funcionario[] | undefined {
  return useLiveQuery(() => db.funcionarios.orderBy('nome').toArray(), []);
}

export function usePontos(): PontoDeVenda[] | undefined {
  return useLiveQuery(() => db.pontos.orderBy('nome').toArray(), []);
}

export function useCartoes(): Cartao[] | undefined {
  return useLiveQuery(() => db.cartoes.orderBy('nome').toArray(), []);
}

export function useFechamentos(): FechamentoCaixa[] | undefined {
  return useLiveQuery(() => db.fechamentos.orderBy('data').reverse().toArray(), []);
}

export function useContas(): Conta[] | undefined {
  return useLiveQuery(() => db.contas.orderBy('vencimento').reverse().toArray(), []);
}

export function useDespesas(): Despesa[] | undefined {
  return useLiveQuery(() => db.despesas.orderBy('data').reverse().toArray(), []);
}
