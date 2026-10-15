import { useState } from 'react';
import {
  agendaRecebiveis,
  despesasDoDia,
  fechamentosPorDia,
  pendencias,
  resumoDoMes,
  resumoFechamento,
  resumoRecebiveis,
  rotuloPonto,
  saidasEmDinheiro,
  type CompromissoPendente,
} from '../dominio/calculos';
import { FIADO, FORMAS_PAGAMENTO, rotuloPrazoCredito } from '../dominio/categorias';
import {
  competenciaDe,
  formatarData,
  formatarDataComDia,
  hojeISO,
  mesAtual,
  nomeDoMes,
  rotuloPrazo,
} from '../dominio/datas';
import { formatarDinheiro, somarCentavos } from '../dominio/dinheiro';
import type { Centavos, FechamentoCaixa, Id } from '../dominio/tipos';
import { useAcervo, useFuncionarios, usePontos } from '../dados/hooks';
import { pagarCompromisso } from '../dados/pagamentos';
import { fechamentoVazio, novoFechamento } from '../dados/repositorio';
import { FormularioFechamento } from '../componentes/FormularioFechamento';
import { FormularioRecebimento } from '../componentes/FormularioRecebimento';
import { GavetaPagamento, type Pagamento } from '../componentes/GavetaPagamento';
import {
  Aviso,
  Botao,
  Cartao,
  Estatistica,
  Ficha,
  Legenda,
  Vazio,
} from '../componentes/base';
import { LinhaLista } from '../componentes/lista';
import { Icone } from '../componentes/icones';
import { irPara } from '../navegacao/rotas';

const SITUACAO: Record<string, { rotulo: string; cor: string }> = {
  atrasado: { rotulo: 'atrasado', cor: 'var(--negativo)' },
  'vence-hoje': { rotulo: 'vence hoje', cor: 'var(--alerta)' },
  'a-vencer': { rotulo: 'a vencer', cor: 'var(--suave)' },
  pago: { rotulo: 'pago', cor: 'var(--acento)' },
};

export function Painel() {
  const acervo = useAcervo();
  const pontos = usePontos() ?? [];
  const funcionarios = useFuncionarios() ?? [];
  const [editando, definirEditando] = useState<FechamentoCaixa | null>(null);
  const [recebendo, definirRecebendo] = useState<FechamentoCaixa | null>(null);
  const [pagando, definirPagando] = useState<CompromissoPendente | null>(null);
  const [verValores, definirVerValores] = useState(true);
  const [novoAberto, definirNovoAberto] = useState(false);

  /** O olho do topo esconde os números: quem mostra a tela para outra pessoa agradece. */
  const mostrar = (valor: Centavos) => (verValores ? formatarDinheiro(valor) : 'R$ ••••');

  const hoje = hojeISO();
  const competencia = mesAtual();

  if (!acervo) return <Vazio titulo="Carregando…" />;

  const resumo = resumoDoMes(competencia, acervo, hoje);
  const alertas = pendencias(acervo, hoje);
  const fechamentosHoje = fechamentosPorDia(acervo.fechamentos).get(hoje) ?? [];
  const ativos = pontos.filter((ponto) => ponto.ativo);
  const compromissos = [...acervo.contas.map((c) => c), ...acervo.custos, ...acervo.folha];

  /** Abre o fechamento do caixa informado, ou começa um novo nele. */
  const abrirCaixa = (pontoId: Id | null) => {
    const existente = fechamentosHoje.find((fechamento) => fechamento.pontoId === pontoId);
    definirNovoAberto(!existente);
    definirEditando(existente ?? novoFechamento(fechamentoVazio(hoje, pontoId)));
  };

  /** Caixa ativo que ainda não fechou hoje: é o trabalho que falta. */
  const caixaAbertoHoje =
    ativos.find(
      (ponto) => !fechamentosHoje.some((fechamento) => fechamento.pontoId === ponto.id),
    ) ?? null;

  const registrarPagamento = async (pagamento: Pagamento, compromisso: CompromissoPendente) => {
    await pagarCompromisso(compromisso, pagamento);
  };

  const doDia = fechamentosHoje.map((fechamento) => resumoFechamento(fechamento));
  const vendasHoje = somarCentavos(doDia.map((dia) => dia.vendas));
  const fiadoHoje = somarCentavos(doDia.map((dia) => dia.fiado));
  const fundoHoje = somarCentavos(fechamentosHoje.map((fechamento) => fechamento.fundoInicial));
  const dinheiroHoje = somarCentavos(fechamentosHoje.map((fechamento) => fechamento.dinheiro));
  const emDinheiroHoje = saidasEmDinheiro(despesasDoDia(acervo.despesas, hoje));

  const proximas = alertas.proximas.slice(0, 4);
  const destaque = [...alertas.atrasadas, ...alertas.vencemHoje, ...proximas].slice(0, 5);

  const maquinas = resumoRecebiveis(agendaRecebiveis(acervo, hoje));
  /** O que a máquina vai creditar e ainda não caiu. */
  const aCair = [...maquinas.atrasados, ...maquinas.proximos].slice(0, 4);
  const abrirRecebimento = (fechamentoId: Id) => {
    const fechamento = acervo.fechamentos.find((item) => item.id === fechamentoId);
    if (fechamento) definirRecebendo(fechamento);
  };

  return (
    <>
      {/* Saldo e as duas bolhas: é o retrato do mês, como no app modelo. */}
      <div className="hero">
        <span className="hero__rotulo">Sobrou em {nomeDoMes(competencia)}</span>
        <span className="hero__valor">{mostrar(resumo.resultado)}</span>
        <button
          type="button"
          className="hero__ver"
          aria-label={verValores ? 'Esconder os valores' : 'Mostrar os valores'}
          title={verValores ? 'Esconder os valores' : 'Mostrar os valores'}
          onClick={() => definirVerValores((visivel) => !visivel)}
        >
          <Icone nome={verValores ? 'olho' : 'olho-fechado'} tamanho={20} />
        </button>
      </div>

      <div className="resumo">
        <div className="resumo__item">
          <span className="resumo__bolha resumo__bolha--entra">
            <Icone nome="seta-cima" tamanho={20} />
          </span>
          <span className="resumo__texto">
            <span className="resumo__rotulo">Receitas</span>
            <span className="resumo__valor">{mostrar(resumo.recebido)}</span>
          </span>
        </div>
        <div className="resumo__item">
          <span className="resumo__bolha resumo__bolha--sai">
            <Icone nome="seta-baixo" tamanho={20} />
          </span>
          <span className="resumo__texto">
            <span className="resumo__rotulo">Despesas</span>
            <span className="resumo__valor">{mostrar(resumo.saidas.total)}</span>
          </span>
        </div>
      </div>

      {/* Apurado do dia: é o primeiro trabalho de todo dia. */}
      <Cartao
        destaque
        titulo={`Apurado de ${formatarDataComDia(hoje)}`}
        acao={
          <>
            {caixaAbertoHoje && (
              <Botao pequeno onClick={() => abrirCaixa(caixaAbertoHoje.id)}>
                {fechamentosHoje.length === 0
                  ? 'Lançar o apurado'
                  : `Lançar ${caixaAbertoHoje.nome}`}
              </Botao>
            )}
            {fechamentosHoje.length > 0 && (
              <Botao
                pequeno
                variante={caixaAbertoHoje ? 'fantasma' : 'principal'}
                onClick={() => abrirCaixa(fechamentosHoje[0]?.pontoId ?? null)}
              >
                Corrigir
              </Botao>
            )}
            {fechamentosHoje.length === 0 && ativos.length === 0 && (
              <Botao pequeno variante="principal" onClick={() => abrirCaixa(null)}>
                Lançar o apurado
              </Botao>
            )}
          </>
        }
      >
        {fechamentosHoje.length > 0 ? (
          <>
            <div className="valor valor--grande">{formatarDinheiro(vendasHoje)}</div>
            <div className="estatistica__detalhe" style={{ marginBottom: 10 }}>
              vendas do dia · {formatarDinheiro(fiadoHoje)} no fiado
              {fechamentosHoje.length > 1
                ? ` · ${fechamentosHoje.length} caixas fechados`
                : ''}
            </div>
            <Legenda
              itens={[
                ...FORMAS_PAGAMENTO.map((forma) => ({
                  rotulo: forma.rotulo,
                  cor: forma.cor,
                  valor: formatarDinheiro(
                    somarCentavos(fechamentosHoje.map((fechamento) => fechamento[forma.valor])),
                  ),
                })),
                {
                  rotulo: FIADO.rotulo,
                  cor: FIADO.cor,
                  valor: formatarDinheiro(fiadoHoje),
                },
              ]}
            />
            {fechamentosHoje.length > 1 && (
              <div style={{ marginTop: 12 }}>
                {fechamentosHoje.map((fechamento) => (
                  <Ficha
                    key={fechamento.id}
                    rotulo={rotuloPonto(pontos, fechamento.pontoId)}
                    valor={formatarDinheiro(resumoFechamento(fechamento).vendas)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <Vazio
            titulo="O apurado de hoje ainda não foi lançado"
            descricao="Anote o troco que começou o caixa e o que foi vendido em cada forma de pagamento. Leva menos de dois minutos."
          />
        )}
      </Cartao>

      {fechamentosHoje.length > 0 && (
        <Cartao titulo="Dinheiro na gaveta">
          <Ficha rotulo="Fundo de caixa" valor={formatarDinheiro(fundoHoje)} />
          <Ficha rotulo="Vendas em dinheiro" valor={formatarDinheiro(dinheiroHoje)} />
          <Ficha
            rotulo="Saiu do caixa hoje"
            valor={`- ${formatarDinheiro(emDinheiroHoje)}`}
          />
          <Ficha
            rotulo="Deveria estar na gaveta"
            valor={formatarDinheiro(fundoHoje + dinheiroHoje - emDinheiroHoje)}
            cor="var(--acento)"
          />
        </Cartao>
      )}

      {alertas.totalAtrasado > 0 && (
        <Aviso tom="negativo">
          <strong>{formatarDinheiro(alertas.totalAtrasado)}</strong> em contas atrasadas
          {alertas.atrasadas.length === 1
            ? ' (1 lançamento)'
            : ` (${alertas.atrasadas.length} lançamentos)`}
          .
        </Aviso>
      )}

      <Cartao titulo={`${nomeDoMes(competencia)} até agora`}>
        <div className="grade">
          <Estatistica
            rotulo="Vendas"
            valor={formatarDinheiro(resumo.vendas)}
            detalhe={`${resumo.diasLancados} dia(s) com apurado`}
          />
          <Estatistica
            rotulo="Entrou no caixa"
            valor={formatarDinheiro(resumo.recebido)}
            detalhe={`${formatarDinheiro(resumo.fiado)} no fiado`}
          />
          <Estatistica
            rotulo="Saídas pagas"
            valor={formatarDinheiro(resumo.saidas.total)}
            detalhe="fornecedor, despesa, custo e folha"
            tom="negativo"
          />
          <Estatistica
            rotulo="Sobrou"
            valor={formatarDinheiro(resumo.resultado)}
            detalhe="vendas menos saídas"
            tom={resumo.resultado >= 0 ? 'positivo' : 'negativo'}
          />
        </div>
      </Cartao>

      <Cartao
        titulo="Contas a pagar"
        acao={
          <Botao pequeno variante="fantasma" onClick={() => irPara('contas')}>
            Ver todas
          </Botao>
        }
      >
        {destaque.length === 0 ? (
          <Vazio
            titulo="Nada vencendo"
            descricao="Nenhum boleto, cheque, custo ou folha em aberto nos próximos dias."
          />
        ) : (
          <div className="lista">
            {destaque.map((item) => (
              <LinhaLista
                key={`${item.origem}-${item.id}`}
                titulo={item.titulo}
                etiqueta={{
                  texto: SITUACAO[item.situacao]?.rotulo ?? '',
                  cor: SITUACAO[item.situacao]?.cor,
                }}
                detalhe={`${item.detalhe} · vence ${formatarData(item.vencimento)} · ${rotuloPrazo(
                  item.vencimento,
                  hoje,
                )}`}
                valor={formatarDinheiro(item.valor)}
                acoes={
                  <Botao pequeno onClick={() => definirPagando(item)}>
                    Pagar
                  </Botao>
                }
              />
            ))}
          </div>
        )}
      </Cartao>

      {alertas.proximas.length > 0 && (
        <Cartao titulo="Próximos 7 dias">
          <Ficha
            rotulo={`${alertas.proximas.length} compromisso(s)`}
            valor={formatarDinheiro(
              somarCentavos(alertas.proximas.map((item) => item.valor)),
            )}
          />
          <Ficha
            rotulo="Total em aberto"
            valor={formatarDinheiro(alertas.totalEmAberto)}
          />
        </Cartao>
      )}

      {(maquinas.aReceber > 0 || maquinas.recebido > 0) && (
        <Cartao titulo="A receber das máquinas">
          <Ficha
            rotulo="Ainda vai cair na conta"
            valor={formatarDinheiro(maquinas.aReceber)}
            cor="var(--acento)"
          />
          <Ficha rotulo="Já caiu" valor={formatarDinheiro(maquinas.recebido)} />

          {maquinas.atrasado > 0 && (
            <Aviso tom="negativo">
              <strong>{formatarDinheiro(maquinas.atrasado)}</strong> deveria ter caído na
              conta e não caiu.
            </Aviso>
          )}

          {aCair.length > 0 && (
            <div className="lista">
              {aCair.map((item) => (
                <LinhaLista
                  key={item.fechamentoId}
                  titulo={`Crédito de ${formatarData(item.data)}`}
                  etiqueta={
                    item.atrasado
                      ? { texto: 'atrasado', cor: 'var(--negativo)' }
                      : { texto: rotuloPrazo(item.dataPrevista, hoje), cor: 'var(--suave)' }
                  }
                  detalhe={`cai ${formatarData(item.dataPrevista)} · ${rotuloPrazoCredito(
                    item.prazo,
                  )}`}
                  valor={formatarDinheiro(item.valor)}
                  acoes={
                    <Botao pequeno onClick={() => abrirRecebimento(item.fechamentoId)}>
                      Recebido
                    </Botao>
                  }
                />
              ))}
            </div>
          )}

          <p style={{ color: 'var(--suave)', fontSize: '0.78rem', marginBottom: 0 }}>
            A venda entra no caixa no dia em que aconteceu; esta lista é só quando o
            dinheiro da máquina aparece na conta.
          </p>
        </Cartao>
      )}

      <Cartao titulo="Atalhos">
        <div className="grupo-botoes">
          <Botao pequeno onClick={() => irPara('despesas')}>
            Nova despesa
          </Botao>
          <Botao pequeno onClick={() => irPara('contas')}>
            Nova conta
          </Botao>
          <Botao pequeno onClick={() => irPara('custos')}>
            Custos do mês
          </Botao>
          <Botao pequeno onClick={() => irPara('relatorios')}>
            Relatório
          </Botao>
        </div>
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

      {pagando && (
        <GavetaPagamento
          titulo="Registrar pagamento"
          descricao={`${pagando.titulo} — ${pagando.detalhe}`}
          valorSugerido={pagando.valor}
          aoConfirmar={(pagamento) => registrarPagamento(pagamento, pagando)}
          aoFechar={() => definirPagando(null)}
        />
      )}

      {recebendo && (
        <FormularioRecebimento
          key={recebendo.id}
          registro={recebendo}
          aoFechar={() => definirRecebendo(null)}
        />
      )}

      {/* Mostra em que mês o movimento está sendo considerado. */}
      <p style={{ color: 'var(--suave)', fontSize: '0.75rem', textAlign: 'center' }}>
        Movimento de {competenciaDe(hoje).split('-').reverse().join('/')} ·{' '}
        {compromissos.length} lançamento(s) cadastrado(s)
      </p>
    </>
  );
}
