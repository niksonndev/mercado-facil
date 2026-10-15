import { useState } from 'react';
import { situacaoDoCompromisso } from '../dominio/calculos';
import { CATEGORIAS_CUSTO, corCategoriaCusto, rotuloCategoriaCusto } from '../dominio/categorias';
import {
  adicionarMeses,
  formatarData,
  hojeISO,
  mesAtual,
  nomeDoMes,
  rotuloPrazo,
} from '../dominio/datas';
import { formatarDinheiro, somarCentavos } from '../dominio/dinheiro';
import type { Competencia, CustoOperacional } from '../dominio/tipos';
import { useAcervo } from '../dados/hooks';
import {
  custoDoProximoMes,
  novoCusto,
  removerCusto,
  salvarCusto,
} from '../dados/repositorio';
import { Aviso, Botao, Cartao, Estatistica, Vazio } from '../componentes/base';
import { BotaoExcluir, GrupoFiltros, LinhaLista } from '../componentes/lista';
import { FormularioCusto } from '../componentes/FormularioCusto';
import { GavetaPagamento, type Pagamento } from '../componentes/GavetaPagamento';
import { SeletorMes } from '../componentes/SeletorMes';

type Filtro = 'abertos' | 'pagos' | 'todos';

const ROTULO_SITUACAO: Record<string, { texto: string; cor: string }> = {
  atrasado: { texto: 'atrasado', cor: 'var(--negativo)' },
  'vence-hoje': { texto: 'vence hoje', cor: 'var(--alerta)' },
  'a-vencer': { texto: 'a vencer', cor: 'var(--suave)' },
  pago: { texto: 'pago', cor: 'var(--acento)' },
};

export function CustoVazio(competencia: Competencia): CustoOperacional {
  return novoCusto({
    categoria: 'outros',
    descricao: '',
    competencia,
    valorPrevisto: 0,
    vencimento: `${competencia}-05`,
    recorrente: true,
    pagoEm: null,
    valorPago: null,
    formaPagamento: null,
    observacao: '',
  });
}

export function Custos() {
  const acervo = useAcervo();
  const [competencia, definirCompetencia] = useState<Competencia>(mesAtual);
  const [filtro, definirFiltro] = useState<Filtro>('abertos');
  const [editando, definirEditando] = useState<CustoOperacional | null>(null);
  const [pagando, definirPagando] = useState<CustoOperacional | null>(null);
  const hoje = hojeISO();

  if (!acervo) return <Vazio titulo="Carregando…" />;

  const doMes = acervo.custos
    .filter((custo) => custo.competencia === competencia)
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento));

  const previsto = somarCentavos(doMes.map((custo) => custo.valorPrevisto));
  const pago = somarCentavos(
    doMes.filter((custo) => custo.pagoEm).map((custo) => custo.valorPago ?? custo.valorPrevisto),
  );
  const aberto = previsto - pago;

  const visiveis = doMes.filter((custo) =>
    filtro === 'abertos' ? !custo.pagoEm : filtro === 'pagos' ? Boolean(custo.pagoEm) : true,
  );

  const competenciasComDados = acervo.custos.map((custo) => custo.competencia);
  const proximo = adicionarMeses(competencia, 1);
  const recorrentes = doMes.filter((custo) => custo.recorrente);
  const jaNoProximo = new Set(
    acervo.custos
      .filter((custo) => custo.competencia === proximo)
      .map((custo) => custo.descricao.trim().toLowerCase()),
  );
  const aRepetir = recorrentes.filter(
    (custo) => !jaNoProximo.has(custo.descricao.trim().toLowerCase()),
  );

  const repetirNoProximoMes = async () => {
    for (const custo of aRepetir) {
      await salvarCusto(custoDoProximoMes(custo, proximo));
    }
    definirCompetencia(proximo);
  };

  const pagar = async (custo: CustoOperacional, pagamento: Pagamento) => {
    await salvarCusto({
      ...custo,
      pagoEm: pagamento.pagoEm,
      valorPago: pagamento.valorPago,
      formaPagamento: pagamento.formaPagamento,
    });
  };

  return (
    <>
      <SeletorMes
        valor={competencia}
        aoMudar={definirCompetencia}
        extras={competenciasComDados}
      />

      <div className="grade">
        <Estatistica
          rotulo="Previsto no mês"
          valor={formatarDinheiro(previsto)}
          detalhe={`${doMes.length} custo(s)`}
        />
        <Estatistica
          rotulo="Pago"
          valor={formatarDinheiro(pago)}
          detalhe={`${doMes.filter((custo) => custo.pagoEm).length} quitado(s)`}
          tom="positivo"
        />
        <Estatistica
          rotulo="Em aberto"
          valor={formatarDinheiro(aberto)}
          tom={aberto > 0 ? 'alerta' : 'neutro'}
        />
      </div>

      <div className="grupo-botoes">
        <Botao
          variante="principal"
          icone="mais-circulo"
          onClick={() => definirEditando(CustoVazio(competencia))}
        >
          Novo custo
        </Botao>
        {aRepetir.length > 0 && (
          <Botao onClick={repetirNoProximoMes}>
            Levar {aRepetir.length} recorrente(s) para {nomeDoMes(proximo).split(' ')[0]}
          </Botao>
        )}
      </div>

      {doMes.length === 0 && (
        <Aviso tom="alerta">
          Nenhum custo lançado em {nomeDoMes(competencia)}. Comece pelo aluguel e pelas
          contas de consumo: são elas que mais pesam no resultado do mês.
          {' '}
          <strong>
            {CATEGORIAS_CUSTO.slice(0, 4)
              .map((categoria) => categoria.rotulo)
              .join(', ')}
          </strong>
          .
        </Aviso>
      )}

      <GrupoFiltros
        valor={filtro}
        aoMudar={definirFiltro}
        opcoes={[
          { valor: 'abertos', rotulo: 'Em aberto', contagem: doMes.filter((c) => !c.pagoEm).length },
          { valor: 'pagos', rotulo: 'Pagos', contagem: doMes.filter((c) => c.pagoEm).length },
          { valor: 'todos', rotulo: 'Todos', contagem: doMes.length },
        ]}
      />

      <Cartao titulo={`Custos de ${nomeDoMes(competencia)}`}>
        {visiveis.length === 0 ? (
          <Vazio
            titulo="Nada por aqui"
            descricao="Lance o aluguel, a energia, a água, a internet e os honorários do contador para fechar o mês com o resultado certo."
          />
        ) : (
          <div className="lista">
            {visiveis.map((custo) => {
              const situacao = situacaoDoCompromisso(custo.pagoEm, custo.vencimento, hoje);
              return (
                <LinhaLista
                  key={custo.id}
                  titulo={custo.descricao || 'Sem descrição'}
                  etiqueta={{
                    texto: `${rotuloCategoriaCusto(custo.categoria)} · ${ROTULO_SITUACAO[situacao]?.texto ?? ''}`,
                    cor: situacao === 'pago' ? 'var(--acento)' : corCategoriaCusto(custo.categoria),
                  }}
                  detalhe={[
                    `venc. ${formatarData(custo.vencimento)}`,
                    custo.pagoEm
                      ? `pago em ${formatarData(custo.pagoEm)}`
                      : rotuloPrazo(custo.vencimento, hoje),
                    custo.recorrente ? 'mensal' : '',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  valor={formatarDinheiro(custo.valorPago ?? custo.valorPrevisto)}
                  corValor={situacao === 'atrasado' ? 'var(--negativo)' : undefined}
                  aoAbrir={() => definirEditando(custo)}
                  acoes={
                    <>
                      {custo.pagoEm ? (
                        <Botao
                          pequeno
                          variante="fantasma"
                          onClick={() =>
                            salvarCusto({
                              ...custo,
                              pagoEm: null,
                              valorPago: null,
                              formaPagamento: null,
                            })
                          }
                        >
                          Reabrir
                        </Botao>
                      ) : (
                        <Botao
                          pequeno
                          variante="principal"
                          onClick={() => definirPagando(custo)}
                        >
                          Pagar
                        </Botao>
                      )}
                      <BotaoExcluir
                        descricao={`o custo ${custo.descricao || 'sem descrição'}`}
                        aoConfirmar={() => removerCusto(custo.id)}
                      />
                    </>
                  }
                />
              );
            })}
          </div>
        )}
      </Cartao>

      {editando && (
        <FormularioCusto
          key={editando.id}
          registro={editando}
          aoFechar={() => definirEditando(null)}
        />
      )}

      {pagando && (
        <GavetaPagamento
          titulo="Registrar pagamento"
          descricao={`${pagando.descricao} — ${nomeDoMes(competencia)}`}
          valorSugerido={pagando.valorPrevisto}
          aoConfirmar={(pagamento) => pagar(pagando, pagamento)}
          aoFechar={() => definirPagando(null)}
        />
      )}

      <p style={{ color: 'var(--suave)', fontSize: '0.78rem' }}>
        Custos exclusivos do mês, como aluguel, energia e água, entram aqui. Compra de
        mercadoria para revenda é conta de fornecedor.
      </p>
    </>
  );
}
