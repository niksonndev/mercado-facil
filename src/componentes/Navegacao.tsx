import { useState } from 'react';
import { Botao } from './base';
import { Gaveta } from './Gaveta';
import { Icone } from './icones';
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

/** Barra inferior do celular, com o resto atrás de "Mais". */
export function Abas({ rota }: { rota: Rota }) {
  const [maisAberto, definirMais] = useState(false);
  const rotaNoMais = NO_MENU_MAIS.some((item) => item.caminho === rota.caminho);

  const escolher = (caminho: string) => {
    definirMais(false);
    irPara(caminho);
  };

  return (
    <>
      <nav className="abas" aria-label="Seções">
        {NA_BARRA.map((item) => (
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
          <Icone nome="mais" tamanho={21} />
          Mais
        </button>
      </nav>

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
