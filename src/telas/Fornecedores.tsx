import { useState } from 'react';
import { formatarData, hojeISO, rotuloPrazo } from '../dominio/datas';
import { formatarDinheiro, somarCentavos } from '../dominio/dinheiro';
import type { Fornecedor } from '../dominio/tipos';
import { useAcervo, useFornecedores } from '../dados/hooks';
import { novoFornecedor, removerFornecedor } from '../dados/repositorio';
import { Botao, Cartao, Vazio } from '../componentes/base';
import { BotaoExcluir, LinhaLista } from '../componentes/lista';
import { FormularioFornecedor } from '../componentes/FormularioFornecedor';

export function fornecedorVazio(): Fornecedor {
  return novoFornecedor({ nome: '', cnpj: '', telefone: '', observacao: '' });
}

export function Fornecedores() {
  const fornecedores = useFornecedores();
  const acervo = useAcervo();
  const [editando, definirEditando] = useState<Fornecedor | null>(null);
  const hoje = hojeISO();

  if (!fornecedores || !acervo) return <Vazio titulo="Carregando…" />;

  // Quanto cada fornecedor ainda tem em aberto, pela conta não paga mais antiga.
  const emAberto = new Map<string, { total: number; quantas: number; proxima: string }>();
  for (const conta of acervo.contas) {
    if (conta.pagoEm) continue;
    const chave = (conta.fornecedorId ?? conta.fornecedorNome).trim();
    const atual = emAberto.get(chave);
    if (atual) {
      atual.total += conta.valor;
      atual.quantas += 1;
      if (conta.vencimento < atual.proxima) atual.proxima = conta.vencimento;
    } else {
      emAberto.set(chave, {
        total: conta.valor,
        quantas: 1,
        proxima: conta.vencimento,
      });
    }
  }

  const totalEmAberto = somarCentavos([...emAberto.values()].map((item) => item.total));

  return (
    <>
      <div className="grupo-botoes">
        <Botao
          variante="principal"
          icone="mais-circulo"
          onClick={() => definirEditando(fornecedorVazio())}
        >
          Novo fornecedor
        </Botao>
      </div>

      <Cartao titulo={`${fornecedores.length} fornecedor(es)`}>
        {fornecedores.length === 0 ? (
          <Vazio
            titulo="Nenhum fornecedor cadastrado"
            descricao="Com o cadastro pronto, o nome aparece na sugestão ao lançar boletos, cheques e compras à vista."
          />
        ) : (
          <div className="lista">
            {fornecedores.map((fornecedor) => {
              const conta = emAberto.get(fornecedor.id) ?? emAberto.get(fornecedor.nome);
              return (
                <LinhaLista
                  key={fornecedor.id}
                  titulo={fornecedor.nome}
                  etiqueta={
                    conta
                      ? { texto: `${conta.quantas} em aberto`, cor: 'var(--alerta)' }
                      : { texto: 'em dia', cor: 'var(--acento)' }
                  }
                  detalhe={[
                    fornecedor.cnpj,
                    fornecedor.telefone,
                    conta
                      ? `próximo vencimento ${formatarData(conta.proxima)} · ${rotuloPrazo(conta.proxima, hoje)}`
                      : 'nenhuma conta em aberto',
                    fornecedor.observacao,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  valor={conta ? formatarDinheiro(conta.total) : '—'}
                  aoAbrir={() => definirEditando(fornecedor)}
                  acoes={
                    <BotaoExcluir
                      descricao={`o fornecedor ${fornecedor.nome}`}
                      aoConfirmar={() => removerFornecedor(fornecedor.id)}
                    />
                  }
                />
              );
            })}
          </div>
        )}
      </Cartao>

      {totalEmAberto > 0 && (
        <Cartao titulo="Total em aberto com fornecedores">
          <div className="valor valor--medio">{formatarDinheiro(totalEmAberto)}</div>
          <div className="estatistica__detalhe">
            some tudo que ainda não foi pago para fornecedor
          </div>
        </Cartao>
      )}

      {editando && (
        <FormularioFornecedor
          key={editando.id}
          registro={editando}
          aoFechar={() => definirEditando(null)}
        />
      )}
    </>
  );
}
