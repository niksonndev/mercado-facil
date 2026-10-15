import { useState } from 'react';
import { Botao } from './base';
import { Gaveta } from './Gaveta';
import { Icone, type NomeIcone } from './icones';
import { GRUPOS, ROTAS, irPara, type Rota } from '../navegacao/rotas';

const NA_BARRA = ROTAS.filter((rota) => rota.naBarra);
const NO_MENU_MAIS = ROTAS.filter((rota) => !rota.naBarra);

function Marca() {
  return (
    <div className="menu__marca">
      <span>
        <Icone nome="mercado" tamanho={19} />
      </span>
      Mercado Fácil
    </div>
  );
}

/** Menu lateral do desktop. */
export function Menu({ rota }: { rota: Rota }) {
  return (
    <nav className="menu" aria-label="Seções">
      <Marca />
      {GRUPOS.map((grupo) => (
        <div key={grupo.id}>
          <div className="menu__grupo">{grupo.rotulo}</div>
          {ROTAS.filter((item) => item.grupo === grupo.id).map((item) => (
            <button
              key={item.caminho}
              type="button"
              className="menu__item"
              aria-current={item.caminho === rota.caminho ? 'page' : undefined}
              onClick={() => irPara(item.caminho)}
            >
              <Icone nome={item.icone} tamanho={18} />
              {item.curto}
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}

/**
 * Atalho de lançamento: o que quase todo dia precisa ser anotado.
 *
 * Cada atalho abre a tela já com a folha de lançamento aberta
 * (`#/despesas/novo`), porque quem aperta o + quer lançar, não navegar.
 */
const ATALHOS: Array<{ rotulo: string; icone: NomeIcone; caminho: string; posicao: { left: string; top: string } }> = [
  { rotulo: 'Despesa', icone: 'despesas', caminho: 'despesas/novo', posicao: { left: '14%', top: '64%' } },
  { rotulo: 'Fechar caixa', icone: 'caixa', caminho: 'caixa/novo', posicao: { left: '30%', top: '14%' } },
  { rotulo: 'Boleto', icone: 'contas', caminho: 'contas/novo', posicao: { left: '70%', top: '14%' } },
  { rotulo: 'Custo fixo', icone: 'custos', caminho: 'custos/novo', posicao: { left: '86%', top: '64%' } },
];

function MenuRapido({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  if (!aberto) return null;

  return (
    <div
      className="rapido"
      role="presentation"
      onClick={aoFechar}
      onKeyDown={(evento) => evento.key === 'Escape' && aoFechar()}
    >
      <span className="rapido__titulo">O que você quer lançar?</span>
      <div className="rapido__leque" role="presentation" onClick={(e) => e.stopPropagation()}>
        {ATALHOS.map((atalho, indice) => (
          <button
            key={atalho.rotulo}
            type="button"
            className="rapido__item"
            style={{
              left: atalho.posicao.left,
              top: atalho.posicao.top,
              animationDelay: `${indice * 25}ms`,
            }}
            onClick={() => {
              aoFechar();
              irPara(atalho.caminho);
            }}
          >
            <Icone nome={atalho.icone} tamanho={23} />
            {atalho.rotulo}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Barra inferior do celular, com o atalho de lançamento no meio. */
export function Abas({ rota }: { rota: Rota }) {
  const [maisAberto, definirMais] = useState(false);
  const [rapidoAberto, definirRapido] = useState(false);
  const rotaNoMais = NO_MENU_MAIS.some((item) => item.caminho === rota.caminho);

  const escolher = (caminho: string) => {
    definirMais(false);
    definirRapido(false);
    irPara(caminho);
  };

  const esquerda = NA_BARRA.slice(0, 2);
  const direita = NA_BARRA.slice(2);

  return (
    <>
      <nav className="abas" aria-label="Seções">
        {esquerda.map((item) => (
          <button
            key={item.caminho}
            type="button"
            className="aba"
            aria-current={item.caminho === rota.caminho ? 'page' : undefined}
            onClick={() => escolher(item.caminho)}
          >
            <Icone nome={item.icone} tamanho={21} />
            {item.curto}
          </button>
        ))}

        <button
          type="button"
          className="aba aba--mais"
          aria-label="Lançar"
          aria-expanded={rapidoAberto}
          title="Lançar"
          onClick={() => definirRapido((aberto) => !aberto)}
        >
          <span className={`aba__circulo${rapidoAberto ? ' aba__circulo--aberto' : ''}`}>
            <Icone nome="mais" tamanho={26} />
          </span>
        </button>

        {direita.map((item) => (
          <button
            key={item.caminho}
            type="button"
            className="aba"
            aria-current={item.caminho === rota.caminho ? 'page' : undefined}
            onClick={() => escolher(item.caminho)}
          >
            <Icone nome={item.icone} tamanho={21} />
            {item.curto}
          </button>
        ))}

        <button
          type="button"
          className="aba"
          aria-current={rotaNoMais ? 'page' : undefined}
          onClick={() => definirMais(true)}
        >
          <Icone nome="mais-circulo" tamanho={21} />
          Mais
        </button>
      </nav>

      <MenuRapido aberto={rapidoAberto} aoFechar={() => definirRapido(false)} />

      <Gaveta
        aberta={maisAberto}
        titulo="Mais seções"
        aoFechar={() => definirMais(false)}
      >
        <div className="lista">
          {NO_MENU_MAIS.map((item) => (
            <button
              key={item.caminho}
              type="button"
              className="linha"
              style={{
                background: 'transparent',
                border: 0,
                borderBottom: '1px solid var(--borda)',
                width: '100%',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onClick={() => escolher(item.caminho)}
            >
              <Icone nome={item.icone} tamanho={19} />
              <span className="linha__corpo">
                <span className="linha__titulo">
                  <span>{item.curto}</span>
                </span>
              </span>
            </button>
          ))}
        </div>
      </Gaveta>
    </>
  );
}

/** Cabeçalho: título da seção e as ações da tela. */
export function Topo({
  rota,
  aoAlternarTema,
  tema,
  acoes,
}: {
  rota: Rota;
  aoAlternarTema: () => void;
  tema: string;
  acoes?: React.ReactNode;
}) {
  return (
    <header className="topo">
      <h1 className="topo__titulo">
        {rota.titulo}
        <small>Mercado Fácil</small>
      </h1>
      <div className="topo__acoes">
        {acoes}
        <Botao
          variante="fantasma"
          className="botao--icone"
          onClick={aoAlternarTema}
          aria-label={tema === 'claro' ? 'Usar tema escuro' : 'Usar tema claro'}
          title={tema === 'claro' ? 'Usar tema escuro' : 'Usar tema claro'}
        >
          <Icone nome="brilho" tamanho={19} />
        </Botao>
      </div>
    </header>
  );
}
