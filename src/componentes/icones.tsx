/**
 * Ícones em SVG inline.
 *
 * Sem biblioteca de ícones de propósito: são poucos traços, o app fica sem
 * dependência extra e o CSP continua sem liberar nada de fora.
 */
export type NomeIcone =
  | 'painel'
  | 'caixa'
  | 'contas'
  | 'despesas'
  | 'custos'
  | 'folha'
  | 'fornecedores'
  | 'relatorios'
  | 'dre'
  | 'dados'
  | 'mais'
  | 'mais-circulo'
  | 'editar'
  | 'lixeira'
  | 'check'
  | 'voltar'
  | 'brilho'
  | 'enviar'
  | 'baixar'
  | 'imprimir'
  | 'fechar'
  | 'alerta'
  | 'banco'
  | 'calendario'
  | 'microfone'
  | 'coracao'
  | 'marcador'
  | 'carteira'
  | 'imagem'
  | 'alfinete'
  | 'repetir'
  | 'caneta'
  | 'seta-cima'
  | 'seta-baixo'
  | 'olho'
  | 'olho-fechado'
  | 'chevron'
  | 'check-circulo'
  | 'pessoa'
  | 'mercado';

const TRACOS: Record<NomeIcone, string> = {
  painel: 'M4 11.2 12 4.5l8 6.7M6 10v9.5h12V10',
  caixa: 'M3.5 8.5h17v11h-17zM3.5 8.5 6 4.5h12l2.5 4M9.5 13.5h5',
  contas: 'M6 3.5h12v17l-3-2-3 2-3-2-3 2zM9.5 8.5h5M9.5 12.5h5',
  despesas: 'M12 4.5v13M8 13.5l4 4 4-4M4.5 20.5h15',
  custos: 'M4.5 9.5a7.5 7.5 0 0 1 12.8-5.3M19.5 14.5a7.5 7.5 0 0 1-12.8 5.3M17.5 4v4.5H13M6.5 20v-4.5H11',
  folha: 'M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM3 20.5c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5.2a3.2 3.2 0 0 1 0 6.3M17.5 14.9c2.1.6 3.5 2.5 3.5 4.6',
  fornecedores:
    'M2.5 6.5h10v9h-10zM12.5 10h4l3.5 3.5v2h-7.5M6 18.5a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2ZM16.5 18.5a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z',
  relatorios: 'M4 20V4M4 20h16M8.5 20v-6M13 20V9M17.5 20v-8.5',
  dre: 'M4 19.5h16M6 15.5 10 11l3 3 5.5-6M15 8h3.5M18.5 8v3.5',
  dados: 'M12 3.5c4.4 0 8 1.3 8 3v11c0 1.7-3.6 3-8 3s-8-1.3-8-3v-11c0-1.7 3.6-3 8-3ZM4 6.5c0 1.7 3.6 3 8 3s8-1.3 8-3M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  mais: 'M12 6v12M6 12h12',
  'mais-circulo': 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17ZM12 8.5v7M8.5 12h7',
  editar: 'M4.5 19.5h4L19 9a2.1 2.1 0 0 0-3-3L5.5 16.5v3ZM15 6.5l2.5 2.5',
  lixeira: 'M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5',
  check: 'M5 12.8 9.8 17.5 19 7',
  voltar: 'M15 5 8 12l7 7',
  brilho:
    'M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.4 5.4l1.4 1.4M17.2 17.2l1.4 1.4M18.6 5.4l-1.4 1.4M6.8 17.2l-1.4 1.4',
  enviar: 'M21 3 10.5 13.5M21 3l-6.5 18-4-8.5-8.5-4z',
  baixar: 'M12 3.5v11M8 10.5l4 4 4-4M4.5 20.5h15',
  imprimir: 'M7 8.5V3.5h10V8.5M5 8.5h14v8h-3.5M6 16.5H5M8.5 16.5v4h7v-4',
  fechar: 'M6 6l12 12M18 6 6 18',
  alerta: 'M12 4 2.5 20.5h19zM12 10v4.5M12 17.5h.01',
  banco: 'M3.5 9 12 3.5 20.5 9M5 9v10M9.5 9v10M14.5 9v10M19 9v10M3 19.5h18M3.5 22h17',
  calendario: 'M4.5 6.5h15v13h-15zM4.5 10.5h15M8.5 4v4M15.5 4v4M8.5 14h2M14 14h2M8.5 17h2M14 17h2',
  microfone: 'M12 3.5a2.6 2.6 0 0 0-2.6 2.6v5a2.6 2.6 0 0 0 5.2 0v-5A2.6 2.6 0 0 0 12 3.5ZM6.5 11a5.5 5.5 0 0 0 11 0M12 16.5V21M9 21h6',
  coracao: 'M12 20s-7.5-4.4-7.5-9.4A4.1 4.1 0 0 1 12 8.2a4.1 4.1 0 0 1 7.5 2.4C19.5 15.6 12 20 12 20Z',
  marcador: 'M7 4h10v16l-5-3.5L7 20V4Z',
  carteira: 'M4 7.5h16v11.5H4zM4 7.5 6 4h12l2 3.5M4 12h16M15 12v3h4',
  imagem: 'M4.5 5.5h15v13h-15zM4.5 15l4-4 3.5 3.5 3-2.5 4.5 4M9 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  alfinete: 'M9 4h6l-1 5 3.5 3.5H5.5L9 9 8 4M12 12.5V20',
  repetir: 'M4.5 12a7.5 7.5 0 0 1 12.9-5.2M19.5 12a7.5 7.5 0 0 1-12.9 5.2M17.5 4v3h-3M6.5 20v-3h3',
  caneta: 'M4.5 19.5h3.5L19 8.5l-3.5-3.5L4.5 16v3.5ZM14.5 6 18 9.5',
  'seta-cima': 'M12 19.5v-15M6.5 10 12 4.5 17.5 10',
  'seta-baixo': 'M12 4.5v15M6.5 14 12 19.5 17.5 14',
  olho: 'M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12ZM12 14.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6Z',
  'olho-fechado': 'M3.5 8.5C6 11 8.8 12.4 12 12.4s6-1.4 8.5-3.9M6.5 12.2 5 15M12 12.9v2.9M17.5 12.2 19 15',
  chevron: 'M9.5 5.5 16 12l-6.5 6.5',
  'check-circulo': 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17ZM8 12.2l2.8 2.8L16 9.8',
  pessoa: 'M12 11.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2ZM4.5 20.5c0-3.9 3.4-7 7.5-7s7.5 3.1 7.5 7',
  mercado: 'M4 9.5h16l-1.5-5h-13zM6 9.5v11h12v-11M10 20.5v-5.5h4v5.5',
};

export interface PropsIcone {
  nome: NomeIcone;
  /** Tamanho em pixels; padrão 20. */
  tamanho?: number;
  className?: string;
}

export function Icone({ nome, tamanho = 20, className }: PropsIcone) {
  return (
    <svg
      className={className}
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={TRACOS[nome]} />
    </svg>
  );
}
