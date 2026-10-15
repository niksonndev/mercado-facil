import type { Centavos, DataISO, Id } from '../dominio/tipos';

/** Onde um lançamento sugerido deve entrar, depois de confirmado. */
export type DestinoSugerido = 'conta' | 'despesa' | 'custo' | 'caixa';

/**
 * Um lançamento que a IA leu de um comprovante e que a pessoa vai confirmar.
 *
 * Guarda só o que deu para extrair: os campos ausentes o formulário completa, e
 * o `confianca` serve para a tela destacar o que precisa de mais atenção.
 */
export interface LancamentoSugerido {
  id: Id;
  destino: DestinoSugerido;
  confianca: number;
  /** Campos já preenchidos pelo extrator, por nome de campo do destino. */
  campos: {
    fornecedorNome?: string;
    descricao?: string;
    valor?: Centavos;
    vencimento?: DataISO;
    competencia?: string;
    categoria?: string;
    observacao?: string;
  };
  /** Nome do arquivo de origem, para a pessoa conferir. */
  origem: string;
}

/** Motivo pelo qual um arquivo não pôde ser lido, quando for o caso. */
export interface FalhaDeLeitura {
  arquivo: string;
  motivo: string;
}
