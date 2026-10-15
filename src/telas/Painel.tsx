import { useState } from 'react';
import {
  despesasDoDia,
  indexarPorData,
  pendencias,
  resumoDoMes,
  resumoFechamento,
  saidasEmDinheiro,
  type CompromissoPendente,
} from '../dominio/calculos';
import { FIADO, FORMAS_PAGAMENTO } from '../dominio/categorias';
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
import type { FechamentoCaixa } from '../dominio/tipos';
import { useAcervo } from '../dados/hooks';
import { pagarCompromisso } from '../dados/pagamentos';
import { fechamentoVazio, novoFechamento } from '../dados/repositorio';
import { FormularioFechamento } from '../componentes/FormularioFechamento';
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
import { irPara } from '../navegacao/rotas';

const SITUACAO: Record<string, { rotulo: string; cor: string }> = {
  atrasado: { rotulo: 'atrasado', cor: 'var(--negativo)' },
  'vence-hoje': { rotulo: 'vence hoje', cor: 'var(--alerta)' },
  'a-vencer': { rotulo: 'a vencer', cor: 'var(--suave)' },
  pago: { rotulo: 'pago', cor: 'var(--acento)' },
};

export function Painel() {
  const acervo = useAcervo();
  const [editando, definirEditando] = useState<FechamentoCaixa | null>(null);
  const [pagando, definirPagando] = useState<CompromissoPendente | null>(null);

  const hoje = hojeISO();
  const competencia = mesAtual();

  if (!acervo) return <Vazio titulo="Carregando…" />;

  const resumo = resumoDoMes(competencia, acervo, hoje);
  const alertas = pendencias(acervo, hoje);
  const fechamentoHoje = indexarPorData(acervo.fechamentos).get(hoje);
  const compromissos = [...acervo.contas.map((c) => c), ...acervo.custos, ...acervo.folha];

  const abrirDia = (fechamento: FechamentoCaixa) => definirEditando(fechamento);
  const abrirHoje = () => {
    if (fechamentoHoje) return abrirDia(fechamentoHoje);
    definirEditando(novoFechamento(fechamentoVazio(hoje)));
  };

  const registrarPagamento = async (pagamento: Pagamento, compromisso: CompromissoPendente) => {
    await pagarCompromisso(compromisso, pagamento);
  };

  const emDinheiroHoje = fechamentoHoje
    ? saidasEmDinheiro(despesasDoDia(acervo.despesas, hoje))
    : 0;

  const proximas = alertas.proximas.slice(0, 4);
  const destaque = [...alertas.atrasadas, ...alertas.vencemHoje, ...proximas].slice(0, 5);

  return (
    <>
      {/* Fechamento do dia: é o primeiro trabalho de todo dia. */}
      <Cartao
        destaque
        titulo={`Caixa de ${formatarDataComDia(hoje)}`}
        acao={
          <Botao pequeno variante={fechamentoHoje ? 'fantasma' : 'principal'} onClick={abrirHoje}>
            {fechamentoHoje ? 'Corrigir' : 'Fechar o dia'}
          </Botao>
        }
      >
        {fechamentoHoje ? (
          <>
            <div className="valor valor--grande">
              {formatarDinheiro(resumoFechamento(fechamentoHoje).vendas)}
            </div>
            <div className="estatistica__detalhe" style={{ marginBottom: 10 }}>
              vendas do dia · {formatarDinheiro(resumoFechamento(fechamentoHoje).fiado)} no
              fiado
            </div>
            <Legenda
              itens={[
                ...FORMAS_PAGAMENTO.map((forma) => ({
                  rotulo: forma.rotulo,
                  cor: forma.cor,
                  valor: formatarDinheiro(fechamentoHoje[forma.valor]),
                })),
                {
                  rotulo: FIADO.rotulo,
                  cor: FIADO.cor,
                  valor: formatarDinheiro(fechamentoHoje.fiado),
                },
              ]}
            />
          </>
        ) : (
          <Vazio
            titulo="O dia ainda não foi fechado"
            descricao="Anote o troco que começou o caixa e o que foi vendido em cada forma de pagamento. Leva menos de dois minutos."
          />
        )}
      </Cartao>

      {fechamentoHoje && (
        <Cartao titulo="Dinheiro na gaveta">
          <Ficha rotulo="Fundo de caixa" valor={formatarDinheiro(fechamentoHoje.fundoInicial)} />
          <Ficha
            rotulo="Vendas em dinheiro"
            valor={formatarDinheiro(fechamentoHoje.dinheiro)}
          />
          <Ficha
            rotulo="Saiu do caixa hoje"
            valor={`- ${formatarDinheiro(emDinheiroHoje)}`}
          />
          <Ficha
            rotulo="Deveria estar na gaveta"
            valor={formatarDinheiro(
              fechamentoHoje.fundoInicial + fechamentoHoje.dinheiro - emDinheiroHoje,
            )}
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
            detalhe={`${resumo.diasLancados} dia(s) fechado(s)`}
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

      {/* Mostra em que mês o movimento está sendo considerado. */}
      <p style={{ color: 'var(--suave)', fontSize: '0.75rem', textAlign: 'center' }}>
        Movimento de {competenciaDe(hoje).split('-').reverse().join('/')} ·{' '}
        {compromissos.length} lançamento(s) cadastrado(s)
      </p>
    </>
  );
}
