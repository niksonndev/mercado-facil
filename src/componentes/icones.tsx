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
