import { useState } from 'react';
import {
  indexarPorData,
  resumoDoMes,
  resumoFechamento,
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
import type { Competencia, FechamentoCaixa } from '../dominio/tipos';
import {
  fechamentoVazio,
  novoFechamento,
  removerFechamento,
} from '../dados/repositorio';
import { useAcervo } from '../dados/hooks';
import { Aviso, Botao, Cartao, Ficha, Legenda, Vazio } from '../componentes/base';
import { BotaoExcluir, LinhaLista } from '../componentes/lista';
import { FormularioFechamento } from '../componentes/FormularioFechamento';
import { SeletorMes } from '../componentes/SeletorMes';

export function Caixa() {
  const acervo = useAcervo();
  const [editando, definirEditando] = useState<FechamentoCaixa | null>(null);
  const [competencia, definirCompetencia] = useState<Competencia>(mesAtual);
  const hoje = hojeISO();

  if (!acervo) return <Vazio titulo="Carregando…" />;

  const porData = indexarPorData(acervo.fechamentos);
  const doMes = acervo.fechamentos
    .filter((fechamento) => competenciaDe(fechamento.data) === competencia)
    .sort((a, b) => b.data.localeCompare(a.data));
  const resumo = resumoDoMes(competencia, acervo, hoje);
  const competenciasComDados = acervo.fechamentos.map((fechamento) =>
    competenciaDe(fechamento.data),
  );

  // Dias que passaram sem fechamento: é o furo que estraga o relatório.
  const semFechamento =
    competencia === mesAtual()
      ? diasDoMes(competencia).filter((dia) => dia < hoje && !porData.has(dia))
      : [];

  const fecharDia = (data: string) => {
    definirEditando(porData.get(data) ?? novoFechamento(fechamentoVazio(data)));
  };

  return (
    <>
      <SeletorMes
        valor={competencia}
        aoMudar={definirCompetencia}
        extras={competenciasComDados}
      />

      <div className="grupo-botoes">
        <Botao variante="principal" icone="mais-circulo" onClick={() => fecharDia(hoje)}>
          {porData.has(hoje) ? 'Corrigir hoje' : 'Fechar o dia de hoje'}
        </Botao>
      </div>

      {semFechamento.length > 0 && (
        <Aviso tom="alerta">
          {semFechamento.length === 1
            ? '1 dia do mês está sem fechamento:'
            : `${semFechamento.length} dias do mês estão sem fechamento:`}{' '}
          {semFechamento.slice(0, 4).map((dia) => formatarDataComDia(dia)).join(', ')}
          {semFechamento.length > 4 && '…'}{' '}
          <button
            type="button"
            className="botao botao--pequeno"
            style={{ marginTop: 8 }}
            onClick={() => fecharDia(semFechamento[semFechamento.length - 1] ?? hoje)}
          >
            Lançar o mais recente
          </button>
        </Aviso>
      )}

      <Cartao titulo={`Resumo de ${nomeDoMes(competencia)}`}>
        <div className="valor valor--grande">
          {formatarDinheiro(resumo.vendas)}
        </div>
        <div className="estatistica__detalhe" style={{ marginBottom: 12 }}>
          vendas em {resumo.diasLancados} dia(s) fechado(s)
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

      <Cartao titulo="Dias fechados">
        {doMes.length === 0 ? (
          <Vazio
            titulo="Nenhum dia fechado neste mês"
            descricao="Comece pelo dia de hoje: informe o troco do início do dia e o total de cada forma de pagamento."
          />
        ) : (
          <div className="lista">
            {doMes.map((fechamento) => {
              const dia = resumoFechamento(fechamento);
              return (
                <LinhaLista
                  key={fechamento.id}
                  titulo={formatarDataComDia(fechamento.data)}
                  detalhe={`${FORMAS_PAGAMENTO.map(
                    (forma) =>
                      `${forma.rotulo} ${formatarDinheiro(dia.porForma[forma.valor])}`,
                  ).join(' · ')}${dia.fiado > 0 ? ` · Fiado ${formatarDinheiro(dia.fiado)}` : ''}`}
                  valor={formatarDinheiro(dia.vendas)}
                  aoAbrir={() => definirEditando(fechamento)}
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

      {editando && (
        <FormularioFechamento
          key={editando.id}
          registro={editando}
          aoFechar={() => definirEditando(null)}
        />
      )}
    </>
  );
}
