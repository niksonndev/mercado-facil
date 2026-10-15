import { useState } from 'react';
import { dre } from '../dominio/calculos';
import { hojeISO, mesAtual, nomeDoMes } from '../dominio/datas';
import { formatarDinheiro } from '../dominio/dinheiro';
import type { Centavos, Competencia, IndicadoresDre } from '../dominio/tipos';
import { salvarIndicadores, apagarIndicadores } from '../dados/repositorio';
import { useAcervo } from '../dados/hooks';
import { Aviso, Botao, Cartao, Etiqueta, Ficha, Vazio } from '../componentes/base';
import { Campo, EntradaDinheiro, EntradaTexto } from '../componentes/campos';
import { SeletorMes } from '../componentes/SeletorMes';

/** "52,2%" — uma casa decimal, com vírgula. */
function porCento(fracao: number): string {
  return `${(fracao * 100).toFixed(1).replace('.', ',')}%`;
}

/* ------------------------------------------------ linha do demonstrativo */

interface PropsLinha {
  rotulo: string;
  valor: Centavos;
  /** `filha` recua a linha; `subtotal` e `total` fecham um bloco. */
  tipo?: 'filha' | 'subtotal' | 'total';
  /** Linha de saída: mostra o sinal de menos na frente do valor. */
  saida?: boolean;
  cor?: string;
}

function Linha({ rotulo, valor, tipo, saida, cor }: PropsLinha) {
  const classe = ['dre__linha', tipo ? `dre__linha--${tipo}` : ''].filter(Boolean).join(' ');

  return (
    <div className={classe}>
      <span className="dre__rotulo">{rotulo}</span>
      <span className="dre__valor" style={cor ? { color: cor } : undefined}>
        {saida && valor > 0 ? `- ${formatarDinheiro(valor)}` : formatarDinheiro(valor)}
      </span>
    </div>
  );
}

/* ------------------------------------------------------- formulário do CMV */

function FormularioCmv({
  competencia,
  indicador,
  sugestao,
  aoMensagem,
}: {
  competencia: Competencia;
  indicador?: IndicadoresDre;
  sugestao: Centavos;
  aoMensagem: (mensagem: string) => void;
}) {
  const [cmv, definirCmv] = useState<Centavos>(indicador?.cmv ?? 0);
  const [observacao, definirObservacao] = useState(indicador?.observacao ?? '');
  const [ocupado, definirOcupado] = useState(false);

  const gravar = async () => {
    definirOcupado(true);
    try {
      await salvarIndicadores({ competencia, cmv, observacao });
      aoMensagem(`CMV de ${nomeDoMes(competencia)} salvo: ${formatarDinheiro(cmv)}.`);
    } finally {
      definirOcupado(false);
    }
  };

  const limpar = async () => {
    if (!window.confirm(`Apagar o CMV informado de ${nomeDoMes(competencia)}?`)) return;

    definirOcupado(true);
    try {
      await apagarIndicadores(competencia);
      definirCmv(0);
      definirObservacao('');
      aoMensagem(`CMV de ${nomeDoMes(competencia)} apagado.`);
    } finally {
      definirOcupado(false);
    }
  };

  return (
    <Cartao titulo="Custo da mercadoria do mês">
      <Campo
        rotulo="CMV — custo da mercadoria vendida"
        dica={
          sugestao > 0
            ? `Para referência, as compras pagas a fornecedores no mês somaram ${formatarDinheiro(
                sugestao,
              )} — mas informe o custo do que foi vendido, não o das compras.`
            : 'Quanto custou a mercadoria que efetivamente saiu no mês.'
        }
      >
        {(id) => <EntradaDinheiro id={id} valor={cmv} aoMudar={definirCmv} />}
      </Campo>
      <Campo
        rotulo="Observação (opcional)"
        dica="De onde veio o número — ajuda a conferir no mês que vem."
      >
        {(id) => (
          <EntradaTexto
            id={id}
            valor={observacao}
            aoMudar={definirObservacao}
            placeholder="Ex.: somado das notas de compra"
          />
        )}
      </Campo>
      <Botao variante="principal" largo onClick={gravar} disabled={ocupado}>
        {indicador ? 'Atualizar CMV' : 'Informar CMV'}
      </Botao>
      {indicador && (
        <Botao variante="fantasma" onClick={limpar} disabled={ocupado}>
          Limpar CMV
        </Botao>
      )}
    </Cartao>
  );
}

/* ------------------------------------------------------------------- tela */

export function Dre() {
  const acervo = useAcervo();
  const [competencia, definirCompetencia] = useState<Competencia>(mesAtual);
  const [mensagem, definirMensagem] = useState('');
  const hoje = hojeISO();

  if (!acervo) return <Vazio titulo="Carregando…" />;

  const resultado = dre(competencia, acervo, hoje);
  const indicador = acervo.indicadores.find((item) => item.competencia === competencia);

  const competenciasComDados = [
    ...acervo.fechamentos.map((fechamento) => fechamento.data.slice(0, 7)),
    ...acervo.custos.map((custo) => custo.competencia),
    ...acervo.folha.map((item) => item.competencia),
    ...acervo.indicadores.map((item) => item.competencia),
  ];

  const positivo = resultado.resultadoLiquido >= 0;
  const corResultado = positivo ? 'var(--acento)' : 'var(--negativo)';
  const semMovimento =
    resultado.receitaBruta === 0 && resultado.totalDespesasOperacionais === 0;

  const totalGasto =
    resultado.cmv +
    resultado.totalDeducoes +
    resultado.totalDespesasOperacionais +
    resultado.retiradas;

  return (
    <>
      <SeletorMes
        valor={competencia}
        aoMudar={(mes) => {
          definirCompetencia(mes);
          definirMensagem('');
        }}
        extras={competenciasComDados}
      />

      {semMovimento && (
        <Aviso tom="alerta">
          {nomeDoMes(competencia)} está sem movimento. Feche os dias no Caixa e registre as
          contas, custos e folha para o DRE aparecer.
        </Aviso>
      )}

      <Cartao titulo={`Resultado de ${nomeDoMes(competencia)}`} destaque>
        <Etiqueta cor={corResultado}>{positivo ? 'Lucro' : 'Prejuízo'}</Etiqueta>
        <div className="valor valor--grande" style={{ color: corResultado, marginTop: 6 }}>
          {formatarDinheiro(resultado.resultadoLiquido)}
        </div>
        <div className="estatistica__detalhe" style={{ marginTop: 4 }}>
          receita de {formatarDinheiro(resultado.receitaBruta)}, gastos de{' '}
          {formatarDinheiro(totalGasto)} · margem líquida {porCento(resultado.margemLiquida)}
        </div>
      </Cartao>

      {!resultado.cmvInformado && !semMovimento && (
        <Aviso tom="alerta">
          <strong>Informe o CMV de {nomeDoMes(competencia)}.</strong> Sem o custo da
          mercadoria vendida o lucro aparece inflado — por enquanto o app contou zero.
          Preencha no cartão "Custo da mercadoria do mês" abaixo.
        </Aviso>
      )}

      <Cartao titulo="Demonstrativo do resultado">
        <div className="dre__grupo">Receita</div>
        <Linha rotulo="Vendas em dinheiro" valor={resultado.porForma.dinheiro} tipo="filha" />
        <Linha rotulo="Vendas em PIX" valor={resultado.porForma.pix} tipo="filha" />
        <Linha rotulo="Vendas em débito" valor={resultado.porForma.debito} tipo="filha" />
        <Linha rotulo="Vendas em crédito" valor={resultado.porForma.credito} tipo="filha" />
        <Linha rotulo="Vendas no fiado" valor={resultado.fiado} tipo="filha" />
        <Linha rotulo="Receita bruta de vendas" valor={resultado.receitaBruta} tipo="subtotal" />

        <div className="dre__grupo">Deduções da receita</div>
        <Linha rotulo="Taxas de cartão e tarifas" valor={resultado.taxas} tipo="filha" saida />
        <Linha rotulo="Impostos sobre a venda" valor={resultado.impostos} tipo="filha" saida />
        <Linha rotulo="Receita líquida" valor={resultado.receitaLiquida} tipo="subtotal" />

        <div className="dre__grupo">Custo da mercadoria</div>
        <Linha
          rotulo={
            resultado.cmvInformado
              ? 'Custo da mercadoria vendida (CMV)'
              : 'CMV — ainda não informado'
          }
          valor={resultado.cmv}
          tipo="filha"
          saida
          cor={resultado.cmvInformado ? undefined : 'var(--alerta)'}
        />
        <Linha
          rotulo="Lucro bruto"
          valor={resultado.lucroBruto}
          tipo="subtotal"
          cor={resultado.lucroBruto >= 0 ? 'var(--acento)' : 'var(--negativo)'}
        />

        <div className="dre__grupo">Despesas operacionais</div>
        <Linha rotulo="Custos operacionais" valor={resultado.custosOperacionais} tipo="filha" saida />
        <Linha rotulo="Folha de pagamento" valor={resultado.folha} tipo="filha" saida />
        <Linha rotulo="Despesas diversas" valor={resultado.despesasDiversas} tipo="filha" saida />
        <Linha
          rotulo="Resultado operacional"
          valor={resultado.resultadoOperacional}
          tipo="subtotal"
          cor={resultado.resultadoOperacional >= 0 ? 'var(--acento)' : 'var(--negativo)'}
        />

        <div className="dre__grupo">Retiradas do dono</div>
        <Linha rotulo="Retiradas de caixa" valor={resultado.retiradas} tipo="filha" saida />

        <Linha
          rotulo={positivo ? 'Lucro do mês' : 'Prejuízo do mês'}
          valor={resultado.resultadoLiquido}
          tipo="total"
          cor={corResultado}
        />
      </Cartao>

      <Cartao titulo="Indicadores">
        <Ficha rotulo="Margem bruta (sobre a receita líquida)" valor={porCento(resultado.margemBruta)} />
        <Ficha rotulo="Margem líquida (sobre a receita)" valor={porCento(resultado.margemLiquida)} />
        <Ficha rotulo="Dias com apurado lançado" valor={String(resultado.diasLancados)} />
        <Ficha
          rotulo="Compras pagas a fornecedores"
          valor={formatarDinheiro(resultado.comprasFornecedores)}
        />
      </Cartao>

      {mensagem && (
        <Aviso tom="info" icone="check">
          {mensagem}
        </Aviso>
      )}

      <div className="nao-imprimir">
        <FormularioCmv
          key={competencia}
          competencia={competencia}
          indicador={indicador}
          sugestao={resultado.comprasFornecedores}
          aoMensagem={definirMensagem}
        />
      </div>

      <div className="grupo-botoes nao-imprimir">
        <Botao icone="imprimir" onClick={() => window.print()}>
          Imprimir
        </Botao>
      </div>

      <p style={{ color: 'var(--suave)', fontSize: '0.78rem' }}>
        O DRE é o resultado do mês, não o movimento do caixa: comprar mercadoria não é
        despesa (o dinheiro vira estoque) — quem mede o gasto da mercadoria que saiu é o
        CMV informado acima. Por isso o valor aqui é diferente do "resultado" em
        Relatórios, que mostra o dinheiro que entrou e saiu.
      </p>
    </>
  );
}
