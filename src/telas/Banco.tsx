import { useState } from 'react';
import { melhorDiaDeCompra, movimentoEmConta, saldoEsperado } from '../dominio/calculos';
import { formatarData, hojeISO, mesAtual, nomeDoMes } from '../dominio/datas';
import { formatarDinheiro } from '../dominio/dinheiro';
import type { Competencia, ConferenciaSaldo, ContaBancaria, Cartao } from '../dominio/tipos';
import { useAcervo, useCartoes, useConferencias, useContasBancarias } from '../dados/hooks';
import {
  cartaoVazio,
  contaBancariaVazia,
  removerCartao,
  removerContaBancaria,
} from '../dados/repositorio';
import { Aviso, Botao, Cartao as CartaoBase, Ficha, Vazio } from '../componentes/base';
import { BotaoExcluir, LinhaLista } from '../componentes/lista';
import { FormularioCartao } from '../componentes/FormularioCartao';
import { FormularioContaBancaria } from '../componentes/FormularioContaBancaria';
import { FormularioConferencia } from '../componentes/FormularioConferencia';
import { SeletorMes } from '../componentes/SeletorMes';

/**
 * Banco e cartões: o cadastro do cartão da empresa (que dá o ciclo da fatura) e
 * a conferência do extrato.
 *
 * A conferência não vigia o saldo sozinho: ela soma o movimento que passa por
 * conta (PIX, débito, cartão e pagamentos que não são dinheiro vivo) e compara
 * com o saldo que o dono leu no extrato. O que sobra dessa conta é o que
 * interessa: lançamento esquecido, taxa não registrada, dinheiro que sumiu.
 */
export function Banco() {
  const acervo = useAcervo();
  const cartoes = useCartoes() ?? [];
  const contas = useContasBancarias() ?? [];
  const conferencias = useConferencias() ?? [];
  const [competencia, definirCompetencia] = useState<Competencia>(mesAtual);
  const [editandoCartao, definirEditandoCartao] = useState<Cartao | null>(null);
  const [editandoConta, definirEditandoConta] = useState<ContaBancaria | null>(null);
  const [conferindo, definirConferindo] = useState<{
    conta: ContaBancaria;
    registro: ConferenciaSaldo | null;
  } | null>(null);
  const hoje = hojeISO();

  if (!acervo) return <Vazio titulo="Carregando…" />;

  const emUso = contas.filter((conta) => conta.ativo);
  const movimento = movimentoEmConta(competencia, acervo, hoje);

  return (
    <>
      <CartaoBase
        titulo="Cartões da empresa"
        acao={
          <Botao pequeno onClick={() => definirEditandoCartao(cartaoVazio())}>
            Novo
          </Botao>
        }
      >
        {cartoes.length === 0 ? (
          <Vazio
            titulo="Nenhum cartão cadastrado"
            descricao="Cadastre o cartão que a loja usa: com o dia do fechamento e o do vencimento, o app calcula o vencimento da fatura e mostra o melhor dia de compra."
          />
        ) : (
          <div className="lista">
            {cartoes.map((cartao) => (
              <LinhaLista
                key={cartao.id}
                titulo={cartao.nome}
                etiqueta={
                  cartao.ativo
                    ? { texto: 'em uso', cor: 'var(--acento)' }
                    : { texto: 'inativo', cor: 'var(--suave)' }
                }
                detalhe={`fecha dia ${cartao.diaFechamento} · vence dia ${cartao.diaVencimento} · melhor dia de compra: ${melhorDiaDeCompra(cartao)}`}
                valor=""
                aoAbrir={() => definirEditandoCartao(cartao)}
                acoes={
                  <BotaoExcluir
                    descricao={`o cartão ${cartao.nome}`}
                    aoConfirmar={() => removerCartao(cartao.id)}
                  />
                }
              />
            ))}
          </div>
        )}
      </CartaoBase>

      <CartaoBase
        titulo="Contas bancárias"
        acao={
          <Botao pequeno onClick={() => definirEditandoConta(contaBancariaVazia())}>
            Nova
          </Botao>
        }
      >
        {contas.length === 0 ? (
          <Vazio
            titulo="Nenhuma conta cadastrada"
            descricao="Cadastre a conta da loja com o saldo que está no extrato hoje: é o ponto de partida para conferir, todo mês, se o que o app mostra bate com o banco."
          />
        ) : (
          <div className="lista">
            {contas.map((conta) => (
              <LinhaLista
                key={conta.id}
                titulo={conta.nome}
                etiqueta={
                  conta.ativo
                    ? { texto: 'em uso', cor: 'var(--acento)' }
                    : { texto: 'inativo', cor: 'var(--suave)' }
                }
                detalhe={[
                  conta.banco,
                  `saldo em ${formatarData(conta.dataSaldoInicial)}: ${formatarDinheiro(
                    conta.saldoInicial,
                  )}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                valor=""
                aoAbrir={() => definirEditandoConta(conta)}
                acoes={
                  <BotaoExcluir
                    descricao={`a conta ${conta.nome}`}
                    aoConfirmar={() => removerContaBancaria(conta.id)}
                  />
                }
              />
            ))}
          </div>
        )}
      </CartaoBase>

      {emUso.length > 0 && (
        <>
          <SeletorMes
            valor={competencia}
            aoMudar={definirCompetencia}
            extras={conferencias.map((item) => item.competencia)}
          />

          {emUso.map((conta) => {
            const esperado = saldoEsperado(competencia, acervo, conta, hoje);
            const registro =
              conferencias.find(
                (item) =>
                  item.contaBancariaId === conta.id && item.competencia === competencia,
              ) ?? null;
            const diferenca = registro ? registro.saldoExtrato - esperado : null;
            const historico = conferencias
              .filter((item) => item.contaBancariaId === conta.id && item.competencia !== competencia)
              .slice(0, 4);

            return (
              <CartaoBase
                key={conta.id}
                titulo={`Conferência de ${nomeDoMes(competencia)}`}
                acao={
                  <Botao
                    pequeno
                    variante={registro ? 'fantasma' : 'principal'}
                    onClick={() => definirConferindo({ conta, registro })}
                  >
                    {registro ? 'Corrigir' : 'Informar o extrato'}
                  </Botao>
                }
              >
                <Ficha
                  rotulo={`Saldo em ${formatarData(conta.dataSaldoInicial)}`}
                  valor={formatarDinheiro(conta.saldoInicial)}
                />
                <Ficha
                  rotulo="Entrou na conta no mês"
                  valor={formatarDinheiro(movimento.entradas)}
                  cor="var(--acento)"
                />
                <Ficha
                  rotulo="Saiu da conta no mês"
                  valor={`- ${formatarDinheiro(movimento.saidas)}`}
                />
                <Ficha
                  rotulo="Saldo que o app espera"
                  valor={formatarDinheiro(esperado)}
                  cor="var(--acento)"
                />

                {registro ? (
                  <>
                    <Ficha
                      rotulo={`Extrato em ${formatarData(registro.data)}`}
                      valor={formatarDinheiro(registro.saldoExtrato)}
                    />
                    <Ficha
                      rotulo={diferenca === 0 ? 'Bateu com o extrato' : 'Diferença'}
                      valor={formatarDinheiro(Math.abs(diferenca ?? 0))}
                      cor={(diferenca ?? 0) === 0 ? 'var(--acento)' : 'var(--negativo)'}
                    />
                  </>
                ) : (
                  <Vazio
                    titulo="Falta conferir o extrato deste mês"
                    descricao="Informe o saldo que o banco mostrou e o app diz a diferença."
                  />
                )}

                {diferenca !== null && diferenca !== 0 && (
                  <Aviso tom="alerta">
                    O extrato {diferenca > 0 ? 'tem mais' : 'tem menos'}{' '}
                    {formatarDinheiro(Math.abs(diferenca))} do que o app somou. Costuma ser
                    lançamento que ficou de fora ou taxa que não foi registrada.
                  </Aviso>
                )}

                <div style={{ marginTop: 12 }}>
                  <Ficha rotulo="Entradas: PIX" valor={formatarDinheiro(movimento.detalhe.pix)} />
                  <Ficha
                    rotulo="Entradas: débito"
                    valor={formatarDinheiro(movimento.detalhe.debito)}
                  />
                  <Ficha
                    rotulo="Entradas: crédito das máquinas"
                    valor={formatarDinheiro(movimento.detalhe.cartoes)}
                  />
                  <Ficha
                    rotulo="Saídas: fornecedores"
                    valor={formatarDinheiro(movimento.detalhe.fornecedores)}
                  />
                  <Ficha rotulo="Saídas: custos" valor={formatarDinheiro(movimento.detalhe.custos)} />
                  <Ficha rotulo="Saídas: folha" valor={formatarDinheiro(movimento.detalhe.folha)} />
                  <Ficha
                    rotulo="Saídas: despesas"
                    valor={formatarDinheiro(movimento.detalhe.despesas)}
                  />
                </div>

                <p style={{ color: 'var(--suave)', fontSize: '0.78rem', marginBottom: 0 }}>
                  O app não pergunta de qual conta cada pagamento saiu, então a soma
                  considera tudo que não é dinheiro da gaveta, e a folha entra sempre.
                  {contas.length > 1 &&
                    ' Com mais de uma conta cadastrada, o movimento é somado: a conferência não separa por conta.'}
                </p>

                {historico.length > 0 && (
                  <div className="lista" style={{ marginTop: 12 }}>
                    {historico.map((item) => {
                      const esperadoDoMes = saldoEsperado(item.competencia, acervo, conta, hoje);
                      const diferençaDoMes = item.saldoExtrato - esperadoDoMes;

                      return (
                        <LinhaLista
                          key={item.id}
                          titulo={nomeDoMes(item.competencia)}
                          etiqueta={
                            diferençaDoMes === 0
                              ? { texto: 'bateu', cor: 'var(--acento)' }
                              : { texto: 'não bateu', cor: 'var(--negativo)' }
                          }
                          detalhe={`extrato ${formatarDinheiro(item.saldoExtrato)}`}
                          valor={formatarDinheiro(diferençaDoMes)}
                          corValor={
                            diferençaDoMes === 0 ? 'var(--acento)' : 'var(--negativo)'
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </CartaoBase>
            );
          })}
        </>
      )}

      {editandoCartao && (
        <FormularioCartao
          key={editandoCartao.id}
          registro={editandoCartao}
          aoFechar={() => definirEditandoCartao(null)}
        />
      )}

      {editandoConta && (
        <FormularioContaBancaria
          key={editandoConta.id}
          registro={editandoConta}
          aoFechar={() => definirEditandoConta(null)}
        />
      )}

      {conferindo && (
        <FormularioConferencia
          key={`${conferindo.conta.id}-${competencia}`}
          conta={conferindo.conta}
          competencia={competencia}
          esperado={saldoEsperado(competencia, acervo, conferindo.conta, hoje)}
          registro={conferindo.registro}
          aoFechar={() => definirConferindo(null)}
        />
      )}
    </>
  );
}
