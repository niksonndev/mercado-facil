import { useEffect, useState } from 'react';
import {
  chaveFechamento,
  fechamentosPorDia,
  indexarPorFechamento,
  resumoDoMes,
  resumoFechamento,
  resumoPorPonto,
  rotuloPonto,
} from '../dominio/calculos';
import { FIADO, FORMAS_PAGAMENTO } from '../dominio/categorias';
import {
  competenciaDe,
  diasDoMes,
  formatarDataComDia,
  hojeISO,
  mesAtual,
  nomeDoMes,
} from '../dominio/datas';
import { formatarDinheiro } from '../dominio/dinheiro';
import type { Competencia, FechamentoCaixa, Id, PontoDeVenda } from '../dominio/tipos';
import { useAcervo, useFuncionarios, usePontos } from '../dados/hooks';
import {
  fechamentoVazio,
  novoFechamento,
  pontoVazio,
  removerFechamento,
  removerPonto,
} from '../dados/repositorio';
import { Aviso, Botao, Cartao, Ficha, Legenda, Vazio } from '../componentes/base';
import { BotaoExcluir, GrupoFiltros, LinhaLista } from '../componentes/lista';
import { FormularioFechamento } from '../componentes/FormularioFechamento';
import { FormularioPonto } from '../componentes/FormularioPonto';
import { SeletorMes } from '../componentes/SeletorMes';
import { abaAtual } from '../navegacao/rotas';

/** O filtro "caixa único" pega os fechamentos de quem não separa ponto de venda. */
const SEM_PONTO = 'sem-ponto';

export function Caixa() {
  const acervo = useAcervo();
  const pontos = usePontos() ?? [];
  const funcionarios = useFuncionarios() ?? [];
  const [editando, definirEditando] = useState<FechamentoCaixa | null>(null);
  const [abrirNovo] = useState(() => abaAtual() === 'novo');
  const [novoAberto, definirNovoAberto] = useState(true);
  const [editandoPonto, definirEditandoPonto] = useState<PontoDeVenda | null>(null);
  const [competencia, definirCompetencia] = useState<Competencia>(mesAtual);
  const [filtro, definirFiltro] = useState<string>('todos');
  const hoje = hojeISO();

  /**
   * Quem chega pelo atalho de lançamento quer o fechamento de hoje já aberto.
   * O ponto de venda vem do cadastro, que chega depois do primeiro render.
   */
  useEffect(() => {
    if (!abrirNovo || editando) return;
    definirEditando(
      novoFechamento(fechamentoVazio(hoje, pontos.find((ponto) => ponto.ativo)?.id ?? null)),
    );
  }, [abrirNovo, editando, hoje, pontos]);

  if (!acervo) return <Vazio titulo="Carregando…" />;

  const porDia = fechamentosPorDia(acervo.fechamentos);
  const porChave = indexarPorFechamento(acervo.fechamentos);
  const doMes = acervo.fechamentos
    .filter((fechamento) => competenciaDe(fechamento.data) === competencia)
    .sort(
      (a, b) =>
        b.data.localeCompare(a.data) ||
        rotuloPonto(pontos, a.pontoId).localeCompare(rotuloPonto(pontos, b.pontoId)),
    );
  const resumo = resumoDoMes(competencia, acervo, hoje);
  const ativos = pontos.filter((ponto) => ponto.ativo);
  const temCaixaUnico = acervo.fechamentos.some((fechamento) => !fechamento.pontoId);

  const visiveis =
    filtro === 'todos'
      ? doMes
      : doMes.filter((fechamento) => (fechamento.pontoId ?? SEM_PONTO) === filtro);

  // Dias que passaram sem fechamento: é o furo que estraga o relatório. Com o
  // filtro em um caixa, ele cobra só aquele caixa.
  const comFechamento = new Set(visiveis.map(chaveFechamento));
  const semFechamento =
    competencia === mesAtual()
      ? diasDoMes(competencia).filter((dia) => {
          if (dia >= hoje) return false;
          if (filtro === 'todos') return !porDia.has(dia);
          return !comFechamento.has(`${dia}|${filtro === SEM_PONTO ? '' : filtro}`);
        })
      : [];

  /** O caixa que ainda não fechou hoje: é o que o botão do dia abre. */
  const pontoAbertoHoje =
    ativos.find((ponto) => !porChave.has(chaveFechamento({ data: hoje, pontoId: ponto.id }))) ??
    null;
  const pontoDoFiltro = filtro === 'todos' || filtro === SEM_PONTO ? null : filtro;
  const pontoDoDia = pontoDoFiltro ?? pontoAbertoHoje?.id ?? ativos[0]?.id ?? null;
  const fechamentoDeHoje = porChave.get(chaveFechamento({ data: hoje, pontoId: pontoDoDia }));

  const abrirDia = (data: string, pontoId: Id | null) => {
    const existente = porChave.get(chaveFechamento({ data, pontoId }));
    definirNovoAberto(!existente);
    definirEditando(existente ?? novoFechamento(fechamentoVazio(data, pontoId)));
  };

  const opcoesFiltro = [
    { valor: 'todos', rotulo: 'Todos os caixas', contagem: doMes.length },
    ...pontos.map((ponto) => ({
      valor: ponto.id,
      rotulo: ponto.nome,
      contagem: doMes.filter((fechamento) => fechamento.pontoId === ponto.id).length,
    })),
    ...(temCaixaUnico
      ? [
          {
            valor: SEM_PONTO,
            rotulo: 'Caixa único',
            contagem: doMes.filter((fechamento) => !fechamento.pontoId).length,
          },
        ]
      : []),
  ];

  const porPonto = resumoPorPonto(pontos, acervo.fechamentos, competencia);

  return (
    <>
      <SeletorMes
        valor={competencia}
        aoMudar={definirCompetencia}
        extras={acervo.fechamentos.map((fechamento) => competenciaDe(fechamento.data))}
      />

      <div className="grupo-botoes">
        <Botao
          variante="principal"
          icone="mais-circulo"
          onClick={() => abrirDia(hoje, pontoDoDia)}
        >
          {fechamentoDeHoje ? 'Corrigir o apurado de hoje' : 'Lançar o apurado de hoje'}
        </Botao>
      </div>

      {semFechamento.length > 0 && (
        <Aviso tom="alerta">
          {semFechamento.length === 1
            ? '1 dia do mês está sem apurado:'
            : `${semFechamento.length} dias do mês estão sem fechamento:`}{' '}
          {semFechamento.slice(0, 4).map((dia) => formatarDataComDia(dia)).join(', ')}
          {semFechamento.length > 4 && '…'}{' '}
          <button
            type="button"
            className="botao botao--pequeno"
            style={{ marginTop: 8 }}
            onClick={() => abrirDia(semFechamento[semFechamento.length - 1] ?? hoje, pontoDoDia)}
          >
            Lançar o mais recente
          </button>
        </Aviso>
      )}

      <Cartao titulo={`Resumo de ${nomeDoMes(competencia)}`}>
        <div className="valor valor--grande">{formatarDinheiro(resumo.vendas)}</div>
        <div className="estatistica__detalhe" style={{ marginBottom: 12 }}>
          vendas em {resumo.diasLancados} dia(s) com apurado
        </div>

        <Legenda
          itens={[
            ...FORMAS_PAGAMENTO.map((forma) => ({
              rotulo: forma.rotulo,
              cor: forma.cor,
              valor: formatarDinheiro(resumo.porForma[forma.valor]),
            })),
            {
              rotulo: FIADO.rotulo,
              cor: FIADO.cor,
              valor: formatarDinheiro(resumo.fiado),
            },
          ]}
        />

        <div style={{ marginTop: 12 }}>
          <Ficha rotulo="Entrou no caixa" valor={formatarDinheiro(resumo.recebido)} />
          <Ficha
            rotulo="Fundos de caixa somados"
            valor={formatarDinheiro(resumo.fundoInicial)}
          />
        </div>
      </Cartao>

      {porPonto.length > 1 && (
        <Cartao titulo="Vendas por ponto de venda">
          {porPonto.map((ponto) => (
            <Ficha
              key={ponto.pontoId ?? SEM_PONTO}
              rotulo={`${ponto.nome} · ${ponto.dias} dia(s)`}
              valor={formatarDinheiro(ponto.vendas)}
            />
          ))}
        </Cartao>
      )}

      <Cartao titulo="Dias apurados">
        {pontos.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <GrupoFiltros valor={filtro} opcoes={opcoesFiltro} aoMudar={definirFiltro} />
          </div>
        )}

        {visiveis.length === 0 ? (
          <Vazio
            titulo="Nenhum apurado neste mês"
            descricao="Comece pelo dia de hoje: informe o troco do início do dia e o total de cada forma de pagamento."
          />
        ) : (
          <div className="lista">
            {visiveis.map((fechamento) => {
              const dia = resumoFechamento(fechamento);
              const detalhe = [
                FORMAS_PAGAMENTO.map(
                  (forma) => `${forma.rotulo} ${formatarDinheiro(dia.porForma[forma.valor])}`,
                ).join(' · '),
                dia.fiado > 0 ? `Fiado ${formatarDinheiro(dia.fiado)}` : '',
                fechamento.responsavelNome ? `Caixa: ${fechamento.responsavelNome}` : '',
              ]
                .filter(Boolean)
                .join(' · ');

              return (
                <LinhaLista
                  key={fechamento.id}
                  titulo={`${formatarDataComDia(fechamento.data)}${
                    fechamento.pontoId ? ` · ${rotuloPonto(pontos, fechamento.pontoId)}` : ''
                  }`}
                  detalhe={detalhe}
                  valor={formatarDinheiro(dia.vendas)}
                  aoAbrir={() => {
                    definirNovoAberto(false);
                    definirEditando(fechamento);
                  }}
                  acoes={
                    <BotaoExcluir
                      descricao={`o fechamento de ${formatarDataComDia(fechamento.data)}`}
                      aoConfirmar={() => removerFechamento(fechamento.id)}
                    />
                  }
                />
              );
            })}
          </div>
        )}
      </Cartao>

      <Cartao
        titulo="Pontos de venda"
        acao={
          <Botao pequeno onClick={() => definirEditandoPonto(pontoVazio())}>
            Novo
          </Botao>
        }
      >
        {pontos.length === 0 ? (
          <Vazio
            titulo="Você fecha um caixa só"
            descricao="Cadastre os pontos de venda apenas se a loja tiver mais de um caixa: aí cada um fecha o dia no seu lançamento, com o funcionário que respondeu por ele."
          />
        ) : (
          <div className="lista">
            {pontos.map((ponto) => (
              <LinhaLista
                key={ponto.id}
                titulo={ponto.nome}
                etiqueta={
                  ponto.ativo
                    ? { texto: 'em uso', cor: 'var(--acento)' }
                    : { texto: 'inativo', cor: 'var(--suave)' }
                }
                detalhe={`${acervo.fechamentos.filter((f) => f.pontoId === ponto.id).length} fechamento(s)`}
                valor=""
                aoAbrir={() => definirEditandoPonto(ponto)}
                acoes={
                  <BotaoExcluir
                    descricao={`o ponto de venda ${ponto.nome}`}
                    aoConfirmar={() => removerPonto(ponto.id)}
                  />
                }
              />
            ))}
          </div>
        )}
      </Cartao>

      {editando && (
        <FormularioFechamento
          key={editando.id}
          registro={editando}
          pontos={ativos}
          funcionarios={funcionarios}
          novo={novoAberto}
          aoFechar={() => definirEditando(null)}
        />
      )}

      {editandoPonto && (
        <FormularioPonto
          key={editandoPonto.id}
          registro={editandoPonto}
          aoFechar={() => definirEditandoPonto(null)}
        />
      )}
    </>
  );
}
