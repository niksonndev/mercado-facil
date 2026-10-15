import type { NomeIcone } from '../componentes/icones';

export interface Rota {
  caminho: string;
  titulo: string;
  /** Rótulo curto da barra inferior do celular. */
  curto: string;
  icone: NomeIcone;
  grupo: 'movimento' | 'estrutura' | 'sistema';
  /** Aparece na barra inferior, sem precisar abrir o menu "Mais". */
  naBarra?: boolean;
  /** Aceita um estado extra depois da barra: #/contas/pendentes */
  subtitulo?: string;
}

export const ROTAS: Rota[] = [
  {
    caminho: 'painel',
    titulo: 'Painel do dia',
    curto: 'Painel',
    icone: 'painel',
    grupo: 'movimento',
    naBarra: true,
  },
  {
    caminho: 'caixa',
    titulo: 'Fechamento de caixa',
    curto: 'Caixa',
    icone: 'caixa',
    grupo: 'movimento',
    naBarra: true,
  },
  {
    caminho: 'contas',
    titulo: 'Contas de fornecedores',
    curto: 'Contas',
    icone: 'contas',
    grupo: 'movimento',
    naBarra: true,
  },
  {
    caminho: 'despesas',
    titulo: 'Despesas e retiradas',
    curto: 'Despesas',
    icone: 'despesas',
    grupo: 'movimento',
    naBarra: true,
  },
  {
    caminho: 'custos',
    titulo: 'Custos operacionais',
    curto: 'Custos',
    icone: 'custos',
    grupo: 'estrutura',
  },
  {
    caminho: 'folha',
    titulo: 'Folha de pagamento',
    curto: 'Folha',
    icone: 'folha',
    grupo: 'estrutura',
  },
  {
    caminho: 'fornecedores',
    titulo: 'Fornecedores',
    curto: 'Fornecedores',
    icone: 'fornecedores',
    grupo: 'estrutura',
  },
  {
    caminho: 'relatorios',
    titulo: 'Relatórios',
    curto: 'Relatórios',
    icone: 'relatorios',
    grupo: 'sistema',
  },
  {
    caminho: 'dados',
    titulo: 'Dados e backup',
    curto: 'Dados',
    icone: 'dados',
    grupo: 'sistema',
  },
];

export const GRUPOS: Array<{ id: Rota['grupo']; rotulo: string }> = [
  { id: 'movimento', rotulo: 'Movimento do dia' },
  { id: 'estrutura', rotulo: 'Estrutura' },
  { id: 'sistema', rotulo: 'Sistema' },
];

export const ROTA_PADRAO = 'painel';

const ROTAS_POR_CAMINHO = new Map(ROTAS.map((rota) => [rota.caminho, rota]));

export function rotaPorCaminho(caminho: string): Rota {
  return ROTAS_POR_CAMINHO.get(caminho) ?? ROTAS_POR_CAMINHO.get(ROTA_PADRAO)!;
}

/** Lê o endereço atual: #/contas/pendentes vira { caminho, aba }. */
export function lerEndereco(): { caminho: string; aba: string } {
  const bruto = window.location.hash.replace(/^#\/?/, '');
  const [caminho = '', aba = ''] = bruto.split('/');
  return { caminho: caminho || ROTA_PADRAO, aba };
}

/**
 * O endereço é a fonte da verdade da navegação.
 *
 * Hash em vez de caminho de verdade porque o GitHub Pages não reescreve rota:
 * com `#/contas` o link direto funciona e o botão voltar do celular também.
 */
export function irPara(caminho: string, aba = ''): void {
  const alvo = `#/${caminho}${aba ? `/${aba}` : ''}`;
  if (window.location.hash === alvo) return;
  window.location.hash = alvo;
}
