import { useState } from 'react';
import { melhorDiaDeCompra } from '../dominio/calculos';
import type { Cartao } from '../dominio/tipos';
import { useCartoes } from '../dados/hooks';
import { cartaoVazio, removerCartao } from '../dados/repositorio';
import { Botao, Cartao as CartaoBase, Vazio } from '../componentes/base';
import { BotaoExcluir, LinhaLista } from '../componentes/lista';
import { FormularioCartao } from '../componentes/FormularioCartao';

export function Banco() {
  const cartoes = useCartoes() ?? [];
  const [editando, definirEditando] = useState<Cartao | null>(null);

  return (
    <>
      <CartaoBase
        titulo="Cartões da empresa"
        acao={
          <Botao pequeno onClick={() => definirEditando(cartaoVazio())}>
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
                aoAbrir={() => definirEditando(cartao)}
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

        {cartoes.length > 0 && (
          <p style={{ color: 'var(--suave)', fontSize: '0.78rem', marginBottom: 0 }}>
            A fatura fecha dia {cartoes[0]?.diaFechamento} e vence dia{' '}
            {cartoes[0]?.diaVencimento}; uma compra feita a partir do dia{' '}
            {cartoes[0] ? melhorDiaDeCompra(cartoes[0]) : 1} entra na fatura seguinte.
          </p>
        )}
      </CartaoBase>

      {editando && (
        <FormularioCartao
          key={editando.id}
          registro={editando}
          aoFechar={() => definirEditando(null)}
        />
      )}
    </>
  );
}
