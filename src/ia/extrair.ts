import type { LancamentoSugerido } from './tipos';

/**
 * Ponto de extensão para ler comprovante, print e PDF de boleto.
 *
 * O plano é: a pessoa manda a foto do comprovante (ou o PDF do boleto), a IA
 * extrai fornecedor, valor e vencimento, e o app abre o formulário já
 * preenchido pedindo só a confirmação. Isso ainda NÃO está implementado — não
 * existe chamada de rede aqui, e nada disso sai do aparelho hoje.
 *
 * Para ligar um extrator de verdade (um serviço de visão, um modelo local via
 * WebGPU, ou até uma API paga), basta registrar um objeto que cumpra
 * `ExtratorComprovante` em EXTRATORES. A tela de importação já sabe esperar
 * por isso e mostra o que fazer quando a lista está vazia.
 */
export interface ExtratorComprovante {
  /** Nome mostrado na tela quando há mais de um extrator. */
  nome: string;
  /** Tipos de arquivo que este extrator entende. */
  aceita: (arquivo: File) => boolean;
  /** Lê o arquivo e devolve lançamentos prontos para revisão. */
  extrair: (arquivo: Comprovante) => Promise<LancamentoSugerido[]>;
}

export interface Comprovante {
  nome: string;
  tipo: string;
  tamanho: number;
  /** Bytes do arquivo, para quem for enviar a um serviço. */
  bytes: () => Promise<ArrayBuffer>;
}

/** Nenhum extrator ligado ainda: a tela mostra o caminho manual. */
export const EXTRATORES: ExtratorComprovante[] = [];

export function temExtratorDeComprovante(): boolean {
  return EXTRATORES.length > 0;
}

export async function embrulharArquivo(arquivo: File): Promise<Comprovante> {
  return {
    nome: arquivo.name,
    tipo: arquivo.type,
    tamanho: arquivo.size,
    bytes: () => arquivo.arrayBuffer(),
  };
}
