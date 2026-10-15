import { useState } from 'react';
import { CATEGORIAS_DESPESA, TIPOS_DESPESA, rotuloForma } from '../dominio/categorias';
import { competenciaDe, formatarData, hojeISO, mesAtual, nomeDoMes } from '../dominio/datas';
import { formatarDinheiro, somarCentavos } from '../dominio/dinheiro';
import type { Competencia, Despesa, TipoDespesa } from '../dominio/tipos';
import { useAcervo } from '../dados/hooks';
import { novaDespesa, removerDespesa } from '../dados/repositorio';
import { Botao, Cartao, Estatistica, Vazio } from '../componentes/base';
import { GrupoFiltros, LinhaLista } from '../componentes/lista';
import { FormularioDespesa } from '../componentes/FormularioDespesa';
import { SeletorMes } from '../componentes/SeletorMes';

type Filtro = 'todas' | TipoDespesa;

export function despesaVazia(data: string): Despesa {
  return novaDespesa({
    tipo: 'diversos',
    descricao: '',
    categoria: 'geral',
    valor: 0,
    data,
    formaPagamento: 'dinheiro',
    retiradaDoCaixa: false,
    beneficiario: '',
    observacao: '',
  });
}

export function Despesas() {
  const acervo = useAcervo();
  const [competencia, definirCompetencia] = useState<Competencia>(mesAtual);
  const [filtro, definirFiltro] = useState<Filtro>('todas');
  const [editando, definirEditando] = useState<Despesa | null>(null);
  const hoje = hojeISO();

  if (!acervo) return <Vazio titulo="Carregando…" />;

  const doMes = acervo.despesas
    .filter((despesa) => competenciaDe(despesa.data) === competencia)
    .sort((a, b) => b.data.localeCompare(a.data));

  const retiradas = somarCentavos(
    doMes.filter((despesa) => despesa.tipo === 'retirada').map((despesa) => despesa.valor),
  );
  const diversos = somarCentavos(
    doMes.filter((despesa) => despesa.tipo !== 'retirada').map((despesa) => despesa.valor),
  );
  const doCaixa = somarCentavos(
    doMes
      .filter((despesa) => despesa.retiradaDoCaixa && despesa.formaPagamento === 'dinheiro')
      .map((despesa) => despesa.valor),
  );

  const visiveis = doMes.filter((despesa) => filtro === 'todas' || despesa.tipo === filtro);
  const competenciasComDados = acervo.despesas.map((despesa) => competenciaDe(despesa.data));

  return (
    <>
      <SeletorMes
        valor={competencia}
        aoMudar={definirCompetencia}
        extras={competenciasComDados}
      />

      <div className="grade">
        <Estatistica
          rotulo="Retiradas de caixa"
          valor={formatarDinheiro(retiradas)}
          detalhe="dinheiro que saiu com o dono"
        />
        <Estatistica
          rotulo="Pagamentos diversos"
          valor={formatarDinheiro(diversos)}
          detalhe="frete, conserto, taxas…"
        />
        <Estatistica
          rotulo="Saiu do dinheiro da gaveta"
          valor={formatarDinheiro(doCaixa)}
          detalhe="afeta a conferência do caixa"
        />
      </div>

      <div className="grupo-botoes">
        <Botao
          variante="principal"
          icone="mais-circulo"
          onClick={() => definirEditando(despesaVazia(hoje))}
        >
          Nova despesa
        </Botao>
      </div>

      <GrupoFiltros
        valor={filtro}
        aoMudar={definirFiltro}
        opcoes={[
          { valor: 'todas', rotulo: 'Todas', contagem: doMes.length },
          ...TIPOS_DESPESA.map((item) => ({
            valor: item.valor,
            rotulo: item.rotulo,
            contagem: doMes.filter((despesa) => despesa.tipo === item.valor).length,
          })),
        ]}
      />

      <Cartao titulo={`Despesas de ${nomeDoMes(competencia)}`}>
        {visiveis.length === 0 ? (
          <Vazio
            titulo="Nenhuma despesa neste mês"
            descricao="Anote as retiradas de caixa e os pagamentos diversos para o resultado do mês ficar certo."
          />
        ) : (
          <div className="lista">
            {visiveis.map((despesa) => (
              <LinhaLista
                key={despesa.id}
                titulo={despesa.descricao || 'Sem descrição'}
                etiqueta={{
                  texto: despesa.tipo === 'retirada' ? 'retirada' : 'diversos',
                  cor: despesa.tipo === 'retirada' ? 'var(--negativo)' : 'var(--alerta)',
                }}
                detalhe={[
                  formatarData(despesa.data),
                  rotuloForma(despesa.formaPagamento),
                  CATEGORIAS_DESPESA.find((c) => c.valor === despesa.categoria)?.rotulo,
                  despesa.beneficiario,
                  despesa.retiradaDoCaixa ? 'saiu do caixa' : '',
                ]
                  .filter(Boolean)
                  .join(' · ')}
                valor={formatarDinheiro(despesa.valor)}
                corValor="var(--negativo)"
                aoAbrir={() => definirEditando(despesa)}
                acoes={
                  <Botao
                    pequeno
                    variante="fantasma"
                    onClick={() => removerDespesa(despesa.id)}
                  >
                    Excluir
                  </Botao>
                }
              />
            ))}
          </div>
        )}
      </Cartao>

      {editando && (
        <FormularioDespesa
          key={editando.id}
          registro={editando}
          aoFechar={() => definirEditando(null)}
        />
      )}
    </>
  );
}
