import { useState } from 'react';
import { agendaRecebiveis, resumoDoMes, resumoRecebiveis, vendasPorDia } from '../dominio/calculos';
import { FIADO, FORMAS_PAGAMENTO, rotuloPrazoCredito } from '../dominio/categorias';
import {
  adicionarMeses,
  diasDoMes,
  formatarData,
  formatarDataCurta,
  hojeISO,
  mesAtual,
  nomeDoMes,
  rotuloPrazo,
} from '../dominio/datas';
import { formatarDinheiro, formatarPercentual } from '../dominio/dinheiro';
import type { Competencia, FechamentoCaixa } from '../dominio/tipos';
import { useAcervo } from '../dados/hooks';
import {
  Aviso,
  Botao,
  Cartao,
  Estatistica,
  Ficha,
  Grafico,
  Legenda,
  Vazio,
} from '../componentes/base';
import { LinhaLista } from '../componentes/lista';
import { FormularioRecebimento } from '../componentes/FormularioRecebimento';
import { SeletorMes } from '../componentes/SeletorMes';

export function Relatorios() {
  const acervo = useAcervo();
  const [competencia, definirCompetencia] = useState<Competencia>(mesAtual);
  const [recebendo, definirRecebendo] = useState<FechamentoCaixa | null>(null);
  const hoje = hojeISO();

  if (!acervo) return <Vazio titulo="Carregando…" />;

  const resumo = resumoDoMes(competencia, acervo, hoje);
  const anterior = resumoDoMes(adicionarMeses(competencia, -1), acervo, hoje);

  const porDia = new Map(
    vendasPorDia(acervo.fechamentos, competencia).map((venda) => [
      venda.data,
      venda.vendas,
    ]),
  );
  const colunas = diasDoMes(competencia).map((dia) => ({
    rotulo: dia,
    valor: porDia.get(dia) ?? 0,
    atual: dia === hoje,
  }));

  const competenciasComDados = [
    ...acervo.fechamentos.map((fechamento) => fechamento.data.slice(0, 7)),
    ...acervo.custos.map((custo) => custo.competencia),
  ];

  const diferenca = resumo.vendas - anterior.vendas;
  const recebiveis = agendaRecebiveis(acervo, hoje);
  const maquinas = resumoRecebiveis(recebiveis);
  const melhorDia = colunas.reduce(
    (maior, coluna) => (coluna.valor > maior.valor ? coluna : maior),
    colunas[0] ?? { rotulo: '', valor: 0, atual: false },
  );

  const saidas = [
    { rotulo: 'Fornecedores', valor: resumo.saidas.fornecedores, cor: '#38bdf8' },
    { rotulo: 'Custos operacionais', valor: resumo.saidas.custos, cor: '#fbbf24' },
    { rotulo: 'Folha de pagamento', valor: resumo.saidas.folha, cor: '#a78bfa' },
    { rotulo: 'Despesas diversas', valor: resumo.saidas.despesas, cor: '#fb7185' },
    { rotulo: 'Retiradas de caixa', valor: resumo.saidas.retiradas, cor: '#f472b6' },
  ];
  const maiorSaida = Math.max(1, ...saidas.map((item) => item.valor));

  return (
    <>
      <SeletorMes
        valor={competencia}
        aoMudar={definirCompetencia}
        extras={competenciasComDados}
      />

      {resumo.diasLancados === 0 && resumo.saidas.total === 0 && (
        <Aviso tom="alerta">
          {nomeDoMes(competencia)} está sem nenhum lançamento. Feche os dias no Caixa e
          registre as contas para o relatório aparecer.
        </Aviso>
      )}

      <Cartao titulo={`Resultado de ${nomeDoMes(competencia)}`} destaque>
        <div className="valor valor--grande" style={{ color: resumo.resultado >= 0 ? 'var(--acento)' : 'var(--negativo)' }}>
          {formatarDinheiro(resumo.resultado)}
        </div>
        <div className="estatistica__detalhe" style={{ marginBottom: 12 }}>
          vendas de {formatarDinheiro(resumo.vendas)} menos{' '}
          {formatarDinheiro(resumo.saidas.total)} de saídas · margem{' '}
          {(resumo.margem * 100).toFixed(1).replace('.', ',')}%
        </div>

        <div className="grade">
          <Estatistica
            rotulo="Vendas"
            valor={formatarDinheiro(resumo.vendas)}
            detalhe={`${resumo.diasLancados} dia(s)`}
          />
          <Estatistica
            rotulo="Mês anterior"
            valor={formatarDinheiro(anterior.vendas)}
            detalhe={
              anterior.vendas === 0
                ? 'sem movimento'
                : `${diferenca >= 0 ? '+' : ''}${formatarDinheiro(diferenca)}`
            }
            tom={diferenca >= 0 ? 'positivo' : 'negativo'}
          />
          <Estatistica
            rotulo="Ainda em aberto"
            valor={formatarDinheiro(resumo.emAberto)}
            detalhe={`${formatarDinheiro(resumo.atrasado)} atrasado`}
            tom={resumo.atrasado > 0 ? 'negativo' : 'neutro'}
          />
        </div>
      </Cartao>

      <Cartao titulo="Vendas por dia">
        <Grafico colunas={colunas} />
        <div className="estatistica__detalhe" style={{ marginTop: 8 }}>
          {melhorDia.valor > 0
            ? `Melhor dia: ${melhorDia.rotulo.slice(8)} — ${formatarDinheiro(melhorDia.valor)}`
            : 'Nenhum apurado neste mês'}
        </div>
      </Cartao>

      <Cartao titulo="De onde veio o dinheiro">
        <Legenda
          itens={[
            ...FORMAS_PAGAMENTO.map((forma) => ({
              rotulo: forma.rotulo,
              cor: forma.cor,
              valor: `${formatarDinheiro(resumo.porForma[forma.valor])} (${formatarPercentual(
                resumo.porForma[forma.valor],
                resumo.vendas,
              )})`,
            })),
            {
              rotulo: FIADO.rotulo,
              cor: FIADO.cor,
              valor: `${formatarDinheiro(resumo.fiado)} (${formatarPercentual(
                resumo.fiado,
                resumo.vendas,
              )})`,
            },
          ]}
        />
        <div style={{ marginTop: 12 }}>
          <Ficha rotulo="Entrou no caixa" valor={formatarDinheiro(resumo.recebido)} />
          <Ficha rotulo="Vendido no fiado" valor={formatarDinheiro(resumo.fiado)} />
          <Ficha rotulo="Vendas totais" valor={formatarDinheiro(resumo.vendas)} />
        </div>
      </Cartao>

      <Cartao titulo="Para onde foi o dinheiro">
        {saidas.map((item) => (
          <div key={item.rotulo} style={{ marginBottom: 10 }}>
            <div className="lado" style={{ marginBottom: 4 }}>
              <span className="rotulo">{item.rotulo}</span>
              <span className="valor direita">{formatarDinheiro(item.valor)}</span>
            </div>
            <div className="barra">
              <div
                style={{
                  width: `${((item.valor / maiorSaida) * 100).toFixed(1)}%`,
                  background: item.cor,
                }}
              />
            </div>
          </div>
        ))}

        <div style={{ marginTop: 12 }}>
          <Ficha rotulo="Total das saídas" valor={formatarDinheiro(resumo.saidas.total)} />
        </div>
      </Cartao>

      <Cartao titulo="Conferência">
        <Ficha
          rotulo="Fundos de caixa somados"
          valor={formatarDinheiro(resumo.fundoInicial)}
        />
        <Ficha
          rotulo="Entrou no caixa"
          valor={formatarDinheiro(resumo.recebido)}
        />
        <Ficha
          rotulo="Saiu (regime de caixa)"
          valor={`- ${formatarDinheiro(resumo.saidas.total)}`}
        />
        <Ficha
          rotulo="Sobrou de dinheiro no mês"
          valor={formatarDinheiro(
            resumo.fundoInicial + resumo.recebido - resumo.saidas.total,
          )}
          cor={
            resumo.fundoInicial + resumo.recebido - resumo.saidas.total >= 0
              ? 'var(--acento)'
              : 'var(--negativo)'
          }
        />
        <Ficha
          rotulo="Compromissos em aberto"
          valor={formatarDinheiro(resumo.emAberto)}
        />
      </Cartao>

      <Cartao titulo="A receber das máquinas">
        {recebiveis.length === 0 ? (
          <Vazio
            titulo="Nenhuma venda no crédito registrada"
            descricao="Quando você lançar um dia com venda no crédito, o app calcula aqui o dia em que o dinheiro cai na conta."
          />
        ) : (
          <>
            <div className="grade">
              <Estatistica
                rotulo="Ainda vai cair"
                valor={formatarDinheiro(maquinas.aReceber)}
                detalhe={`${maquinas.abertos.length} crédito(s) em aberto`}
              />
              <Estatistica
                rotulo="Atrasado"
                valor={formatarDinheiro(maquinas.atrasado)}
                detalhe="deveria ter caído e não caiu"
                tom={maquinas.atrasado > 0 ? 'negativo' : 'neutro'}
              />
              <Estatistica
                rotulo="Já caiu"
                valor={formatarDinheiro(maquinas.recebido)}
                detalhe="somando o que a máquina depositou"
              />
            </div>

            {maquinas.abertos.length > 0 && (
              <div className="lista">
                {maquinas.abertos.slice(0, 12).map((item) => (
                  <LinhaLista
                    key={item.fechamentoId}
                    titulo={`Crédito de ${formatarData(item.data)}`}
                    etiqueta={
                      item.atrasado
                        ? { texto: 'atrasado', cor: 'var(--negativo)' }
                        : {
                            texto: rotuloPrazo(item.dataPrevista, hoje),
                            cor: 'var(--suave)',
                          }
                    }
                    detalhe={`cai em ${formatarDataCurta(item.dataPrevista)} · ${rotuloPrazoCredito(
                      item.prazo,
                    )}`}
                    valor={formatarDinheiro(item.valor)}
                    acoes={
                      <Botao
                        pequeno
                        onClick={() =>
                          definirRecebendo(
                            acervo.fechamentos.find(
                              (fechamento) => fechamento.id === item.fechamentoId,
                            ) ?? null,
                          )
                        }
                      >
                        Recebido
                      </Botao>
                    }
                  />
                ))}
              </div>
            )}

            {maquinas.abertos.length > 12 && (
              <p style={{ color: 'var(--suave)', fontSize: '0.78rem' }}>
                Mostrando os 12 créditos mais próximos de {maquinas.abertos.length}.
              </p>
            )}

            <p style={{ color: 'var(--suave)', fontSize: '0.78rem', marginBottom: 0 }}>
              A venda no crédito entra no caixa no dia em que aconteceu; o que muda é
              quando o dinheiro da máquina chega na conta.
            </p>
          </>
        )}
      </Cartao>

      <p style={{ color: 'var(--suave)', fontSize: '0.78rem' }}>
        As saídas contam pela data de pagamento: um boleto vencido em um mês e pago no
        outro aparece no mês em que o dinheiro saiu. Já o fiado entra como venda no dia em
        que foi vendido, mesmo sem ter entrado no caixa.
      </p>

      {recebendo && (
        <FormularioRecebimento
          key={recebendo.id}
          registro={recebendo}
          aoFechar={() => definirRecebendo(null)}
        />
      )}
    </>
  );
}
