import { useState } from 'react';
import { situacaoDoCompromisso } from '../dominio/calculos';
import { FORMAS_PAGAMENTO, TIPOS_CONTA, corTipoConta, rotuloTipoConta } from '../dominio/categorias';
import { competenciaDe, formatarData, hojeISO, rotuloPrazo } from '../dominio/datas';
import { formatarDinheiro, somarCentavos } from '../dominio/dinheiro';
import type { Conta } from '../dominio/tipos';
import { useAcervo, useCartoes, useFornecedores } from '../dados/hooks';
import {
  contaVazia,
  novaConta,
  removerConta,
  salvarConta,
} from '../dados/repositorio';
import { Aviso, Botao, Cartao, Estatistica, Vazio } from '../componentes/base';
import { GrupoFiltros, LinhaLista } from '../componentes/lista';
import { FormularioConta } from '../componentes/FormularioConta';
import { GavetaPagamento, type Pagamento } from '../componentes/GavetaPagamento';
import { ImportarComprovante } from '../componentes/ImportarComprovante';

type Filtro = 'abertas' | 'atrasadas' | 'pagas' | 'todas';

const ROTULO_SITUACAO: Record<string, { texto: string; cor: string }> = {
  atrasado: { texto: 'atrasado', cor: 'var(--negativo)' },
  'vence-hoje': { texto: 'vence hoje', cor: 'var(--alerta)' },
  'a-vencer': { texto: 'a vencer', cor: 'var(--suave)' },
  pago: { texto: 'pago', cor: 'var(--acento)' },
};

export function Contas() {
  const acervo = useAcervo();
  const fornecedores = useFornecedores() ?? [];
  const cartoes = useCartoes() ?? [];
  const [filtro, definirFiltro] = useState<Filtro>('abertas');
  const [tipo, definirTipo] = useState<'todas' | Conta['tipo']>('todas');
  const [editando, definirEditando] = useState<Conta | null>(null);
  const [pagando, definirPagando] = useState<Conta | null>(null);
  const hoje = hojeISO();

  if (!acervo) return <Vazio titulo="Carregando…" />;

  const comSituacao = acervo.contas.map((conta) => ({
    conta,
    situacao: situacaoDoCompromisso(conta.pagoEm, conta.vencimento, hoje),
  }));

  const abertas = comSituacao.filter((item) => item.situacao !== 'pago');
  const atrasadas = comSituacao.filter((item) => item.situacao === 'atrasado');

  const porFiltro = comSituacao.filter(({ situacao }) => {
    if (filtro === 'abertas') return situacao !== 'pago';
    if (filtro === 'atrasadas') return situacao === 'atrasado';
    if (filtro === 'pagas') return situacao === 'pago';
    return true;
  });

  const visiveis = porFiltro
    .filter(({ conta }) => tipo === 'todas' || conta.tipo === tipo)
    .sort((a, b) => b.conta.vencimento.localeCompare(a.conta.vencimento));

  const mesAtualStr = competenciaDe(hoje);
  const pagoNoMes = somarCentavos(
    comSituacao
      .filter(({ conta }) => conta.pagoEm && competenciaDe(conta.pagoEm) === mesAtualStr)
      .map(({ conta }) => conta.valorPago ?? conta.valor),
  );

  const pagar = async (conta: Conta, pagamento: Pagamento) => {
    await salvarConta({
      ...conta,
      pagoEm: pagamento.pagoEm,
      valorPago: pagamento.valorPago,
      formaPagamento: pagamento.formaPagamento,
    });
  };

  const reabrir = (conta: Conta) =>
    salvarConta({ ...conta, pagoEm: null, valorPago: null, formaPagamento: null });

  return (
    <>
      <div className="grade">
        <Estatistica
          rotulo="Em aberto"
          valor={formatarDinheiro(
            somarCentavos(abertas.map(({ conta }) => conta.valor)),
          )}
          detalhe={`${abertas.length} conta(s)`}
        />
        <Estatistica
          rotulo="Atrasado"
          valor={formatarDinheiro(
            somarCentavos(atrasadas.map(({ conta }) => conta.valor)),
          )}
          detalhe={`${atrasadas.length} conta(s)`}
          tom={atrasadas.length > 0 ? 'negativo' : 'neutro'}
        />
        <Estatistica
          rotulo="Pago neste mês"
          valor={formatarDinheiro(pagoNoMes)}
          detalhe="boletos, cheques e à vista"
        />
      </div>

      {atrasadas.length > 0 && (
        <Aviso tom="negativo">
          <strong>{atrasadas.length}</strong> conta(s) de fornecedor vencida(s) somando{' '}
          {formatarDinheiro(somarCentavos(atrasadas.map(({ conta }) => conta.valor)))}.
          Cheque vencido costuma virar dor de cabeça — vale negociar antes.
        </Aviso>
      )}

      <div className="grupo-botoes">
        <Botao
          variante="principal"
          icone="mais-circulo"
          onClick={() =>
            definirEditando(novaConta(contaVazia(fornecedores[0])))
          }
        >
          Nova conta
        </Botao>
        <ImportarComprovante aoSugerir={() => undefined} />
      </div>

      <div className="empilhar">
        <GrupoFiltros
          valor={filtro}
          aoMudar={definirFiltro}
          opcoes={[
            { valor: 'abertas', rotulo: 'Em aberto', contagem: abertas.length },
            { valor: 'atrasadas', rotulo: 'Atrasadas', contagem: atrasadas.length },
            { valor: 'pagas', rotulo: 'Pagas' },
            { valor: 'todas', rotulo: 'Todas', contagem: comSituacao.length },
          ]}
        />
        <GrupoFiltros
          valor={tipo}
          aoMudar={definirTipo}
          opcoes={[
            { valor: 'todas', rotulo: 'Todo tipo' },
            ...TIPOS_CONTA.map((item) => ({ valor: item.valor, rotulo: item.rotulo })),
          ]}
        />
      </div>

      <Cartao>
        {visiveis.length === 0 ? (
          <Vazio
            titulo="Nenhuma conta nesse filtro"
            descricao="Boletos, cheques pré-datados e compras à vista aparecem aqui."
          />
        ) : (
          <div className="lista">
            {visiveis.map(({ conta, situacao }) => {
              const detalhes = [
                conta.descricao || 'sem descrição',
                `venc. ${formatarData(conta.vencimento)}`,
                conta.pagoEm
                  ? `pago em ${formatarData(conta.pagoEm)}`
                  : rotuloPrazo(conta.vencimento, hoje),
                conta.tipo === 'cheque' && conta.chequeNumero
                  ? `cheque ${conta.chequeNumero}${conta.chequeBanco ? ` · ${conta.chequeBanco}` : ''}`
                  : '',
              ].filter(Boolean);

              return (
                <LinhaLista
                  key={conta.id}
                  titulo={conta.fornecedorNome || 'Sem fornecedor'}
                  etiqueta={{
                    texto: `${rotuloTipoConta(conta.tipo)} · ${ROTULO_SITUACAO[situacao]?.texto ?? ''}`,
                    cor: situacao === 'pago' ? 'var(--acento)' : corTipoConta(conta.tipo),
                  }}
                  detalhe={detalhes.join(' · ')}
                  valor={formatarDinheiro(conta.valorPago ?? conta.valor)}
                  corValor={situacao === 'atrasado' ? 'var(--negativo)' : undefined}
                  aoAbrir={() => definirEditando(conta)}
                  acoes={
                    conta.pagoEm ? (
                      <>
                        <Botao
                          pequeno
                          variante="fantasma"
                          onClick={() => reabrir(conta)}
                          title="Reabrir conta"
                        >
                          Reabrir
                        </Botao>
                        <Botao
                          pequeno
                          variante="fantasma"
                          onClick={() => removerConta(conta.id)}
                        >
                          Excluir
                        </Botao>
                      </>
                    ) : (
                      <Botao pequeno variante="principal" onClick={() => definirPagando(conta)}>
                        Pagar
                      </Botao>
                    )
                  }
                />
              );
            })}
          </div>
        )}
      </Cartao>

      {editando && (
        <FormularioConta
          key={editando.id}
          registro={editando}
          fornecedores={fornecedores}
          cartoes={cartoes}
          aoFechar={() => definirEditando(null)}
        />
      )}

      {pagando && (
        <GavetaPagamento
          titulo="Registrar pagamento"
          descricao={`${pagando.fornecedorNome} — ${pagando.descricao || rotuloTipoConta(pagando.tipo)}`}
          valorSugerido={pagando.valor}
          aoConfirmar={(pagamento) => pagar(pagando, pagamento)}
          aoFechar={() => definirPagando(null)}
        />
      )}

      <p style={{ color: 'var(--suave)', fontSize: '0.78rem' }}>
        Formas de pagamento usadas na baixa:{' '}
        {FORMAS_PAGAMENTO.map((forma) => forma.rotulo).join(', ')}.
      </p>
    </>
  );
}
