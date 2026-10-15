import { adicionarMeses, mesAtual, nomeDoMesCurto } from '../dominio/datas';
import type { Competencia } from '../dominio/tipos';

export interface PropsSeletorMes {
  valor: Competencia;
  aoMudar: (competencia: Competencia) => void;
  /** Competências que têm lançamento e precisam aparecer mesmo sendo antigas. */
  extras?: Competencia[];
}

/**
 * Escolha do mês em pílulas.
 *
 * Mostra os últimos seis meses mais qualquer mês que tenha lançamento — assim o
 * movimento antigo continua alcançável sem uma lista infinita.
 */
export function SeletorMes({ valor, aoMudar, extras = [] }: PropsSeletorMes) {
  const recentes = Array.from({ length: 6 }, (_, indice) =>
    adicionarMeses(mesAtual(), -indice),
  );
  const opcoes = [...new Set([valor, ...recentes, ...extras])].sort().reverse();

  return (
    <div className="filtros" role="group" aria-label="Mês">
      {opcoes.map((competencia) => (
        <button
          key={competencia}
          type="button"
          className="filtro"
          aria-pressed={competencia === valor}
          onClick={() => aoMudar(competencia)}
        >
          {nomeDoMesCurto(competencia)}
        </button>
      ))}
    </div>
  );
}
