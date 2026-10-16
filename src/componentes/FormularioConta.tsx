import { useState } from 'react';
import { vencimentoDaFatura } from '../dominio/calculos';
import { FORMAS_PAGAMENTO, TIPOS_CONTA, rotuloTipoConta } from '../dominio/categorias';
import { formatarDinheiro } from '../dominio/dinheiro';
import { hojeISO } from '../dominio/datas';
import type { Cartao, Conta, Fornecedor, TipoConta } from '../dominio/tipos';
import { salvarConta } from '../dados/repositorio';
import { Anexo } from './Anexo';
import { Ficha } from './base';
import {
  AreaTexto,
  Campo,
  Chave,
  EntradaData,
  EntradaDinheiro,
  EntradaTexto,
  Selecao,
} from './campos';
import { Lancamento } from './Lancamento';
import { useRascunho } from './rascunho';

export interface PropsFormularioConta {
  registro: Conta;
  fornecedores: Fornecedor[];
  cartoes: Cartao[];
  aoFechar: () => void;
}

/**
 * Lançamento de conta de fornecedor: boleto, cheque, compra à vista ou fatura
 * do cartão da empresa.
 *
 * O cadastro de fornecedores é sugestão, não exigência — o nome digitado fica
 * gravado no próprio lançamento, então dá para registrar a conta antes de
 * cadastrar a empresa. Vale o mesmo para o cartão: cadastrado, o app calcula o
 * vencimento da fatura sozinho.
 */
export function FormularioConta({
  registro,
  fornecedores,
  cartoes,
  aoFechar,
}: PropsFormularioConta) {
  const { rascunho, atualizar, alterar, erro, definirErro } = useRascunho(registro);
  const [salvando, definirSalvando] = useState(false);

  const ehCheque = rascunho.tipo === 'cheque';
  const ehFatura = rascunho.tipo === 'fatura';
  const pago = Boolean(rascunho.pagoEm);
  const novo = !registro.descricao && !registro.fornecedorNome;

  const trocarTipo = (tipo: TipoConta) => {
    // À vista é pago na hora: já marca a data para não esquecer o pagamento.
    const virouAvista = tipo === 'avista' && !rascunho.pagoEm;
    // Sair do à vista desfaz o pagamento que ele implicava: o boleto volta a
    // ficar em aberto até alguém marcar de novo.
    const deixouAvista = rascunho.tipo === 'avista' && tipo !== 'avista';
    // A fatura já nasce com o primeiro cartão do cadastro e o vencimento dele.
    const cartao = cartoes[0];
    const virouFatura = tipo === 'fatura' && !rascunho.cartaoNome && cartao;

    alterar({
      tipo,
      ...(virouAvista
        ? { pagoEm: rascunho.emissao ?? hojeISO(), formaPagamento: 'dinheiro' as const }
        : {}),
      ...(deixouAvista
        ? { pagoEm: null, valorPago: null, formaPagamento: null }
        : {}),
      ...(virouFatura && cartao
        ? {
            cartaoId: cartao.id,
            cartaoNome: cartao.nome,
            vencimento: vencimentoDaFatura(cartao, rascunho.emissao ?? hojeISO()),
          }
        : {}),
    });
  };

  /** Escolher o cartão do cadastro traz o vencimento da fatura junto. */
  const trocarCartao = (nome: string) => {
    const casado = cartoes.find(
      (cartao) => cartao.nome.trim().toLowerCase() === nome.trim().toLowerCase(),
    );
    const emissao = rascunho.emissao ?? hojeISO();

    alterar({
      cartaoId: casado?.id ?? null,
      cartaoNome: nome,
      ...(casado ? { vencimento: vencimentoDaFatura(casado, emissao) } : {}),
    });
  };

  const trocarEmissao = (valor: string) => {
    const emissao = valor || null;
    const cartao = cartoes.find((item) => item.id === rascunho.cartaoId);

    alterar({
      emissao,
      ...(ehFatura && cartao && emissao
        ? { vencimento: vencimentoDaFatura(cartao, emissao) }
        : {}),
    });
  };

  const salvar = async () => {
    if (!rascunho.fornecedorNome.trim()) {
      definirErro('Informe o fornecedor.');
      return;
    }
    if (rascunho.valor <= 0) {
      definirErro('O valor da conta precisa ser maior que zero.');
      return;
    }
    if (!rascunho.vencimento) {
      definirErro('Informe a data de vencimento.');
      return;
    }

    definirSalvando(true);
    try {
      // Liga ao cadastro quando o nome digitado é de um fornecedor conhecido.
      const casado = fornecedores.find(
        (fornecedor) =>
          fornecedor.nome.trim().toLowerCase() ===
          rascunho.fornecedorNome.trim().toLowerCase(),
      );

      await salvarConta({
        ...rascunho,
        fornecedorId: casado?.id ?? rascunho.fornecedorId,
        valorPago: pago ? (rascunho.valorPago ?? rascunho.valor) : null,
        formaPagamento: pago ? (rascunho.formaPagamento ?? 'dinheiro') : null,
      });
      aoFechar();
    } finally {
      definirSalvando(false);
    }
  };

  return (
    <Lancamento
      titulo={novo ? 'Nova conta' : 'Editar conta'}
      rotuloValor={ehFatura ? 'Valor da fatura' : 'Valor da conta'}
      tom="despesa"
      valor={rascunho.valor}
      aoMudarValor={(valor) => atualizar('valor', valor)}
      aoConfirmar={salvar}
      aoFechar={aoFechar}
      erro={erro || undefined}
      salvando={salvando}
      rotuloConfirmar="Salvar conta"
      adendo={
        pago ? (
          <div className="lanc__total">
            <Ficha
              rotulo="Diferença entre valor e pago"
              valor={formatarDinheiro(
                (rascunho.valorPago ?? rascunho.valor) - rascunho.valor,
              )}
            />
          </div>
        ) : undefined
      }
    >
      <Campo rotulo="Tipo" icone="marcador">
        {() => (
          <div className="pilulas">
            {TIPOS_CONTA.map((tipo) => (
              <button
                key={tipo.valor}
                type="button"
                className="filtro"
                aria-pressed={rascunho.tipo === tipo.valor}
                onClick={() => trocarTipo(tipo.valor)}
              >
                {tipo.rotulo}
              </button>
            ))}
          </div>
        )}
      </Campo>

      <Campo
        rotulo={ehFatura ? 'Cartão' : 'Fornecedor'}
        icone={ehFatura ? 'cartao' : 'mercado'}
      >
        {(id) => (
          <>
            <EntradaTexto
              id={id}
              valor={rascunho.fornecedorNome}
              placeholder={ehFatura ? 'Cartão da loja' : 'Distribuidora Central'}
              list={ehFatura ? 'lista-cartoes' : 'lista-fornecedores'}
              aoMudar={(valor) =>
                ehFatura ? trocarCartao(valor) : atualizar('fornecedorNome', valor)
              }
            />
            {ehFatura ? (
              <datalist id="lista-cartoes">
                {cartoes.map((cartao) => (
                  <option key={cartao.id} value={cartao.nome} />
                ))}
              </datalist>
            ) : (
              <datalist id="lista-fornecedores">
                {fornecedores.map((fornecedor) => (
                  <option key={fornecedor.id} value={fornecedor.nome} />
                ))}
              </datalist>
            )}
          </>
        )}
      </Campo>

      <Campo rotulo="Descrição" icone="caneta">
        {(id) => (
          <EntradaTexto
            id={id}
            valor={rascunho.descricao}
            placeholder="Pedido de mercearia"
            aoMudar={(valor) => atualizar('descricao', valor)}
          />
        )}
      </Campo>

      <Campo
        rotulo="Emissão"
        icone="calendario"
        dica={ehFatura ? 'Data da compra' : 'Data do pedido'}
      >
        {(id) => (
          <EntradaData id={id} valor={rascunho.emissao ?? ''} aoMudar={trocarEmissao} />
        )}
      </Campo>

      <Campo
        rotulo={ehCheque ? 'Bom para' : 'Vencimento'}
        icone="calendario"
        dica={
          ehFatura && rascunho.cartaoNome
            ? `Pelo fechamento do ${rascunho.cartaoNome}`
            : undefined
        }
      >
        {(id) => (
          <EntradaData
            id={id}
            valor={rascunho.vencimento}
            aoMudar={(valor) => atualizar('vencimento', valor || hojeISO())}
          />
        )}
      </Campo>

      {ehCheque && (
        <>
          <Campo rotulo="Número do cheque" icone="marcador">
            {(id) => (
              <EntradaTexto
                id={id}
                valor={rascunho.chequeNumero}
                placeholder="000431"
                aoMudar={(valor) => atualizar('chequeNumero', valor)}
              />
            )}
          </Campo>

          <Campo rotulo="Banco" icone="mercado">
            {(id) => (
              <EntradaTexto
                id={id}
                valor={rascunho.chequeBanco}
                placeholder="Banco do Brasil"
                aoMudar={(valor) => atualizar('chequeBanco', valor)}
              />
            )}
          </Campo>
        </>
      )}

      <Chave
        rotulo="Já está pago"
        dica={rotuloTipoConta(rascunho.tipo)}
        icone="check-circulo"
        marcado={pago}
        tom="var(--entra)"
        aoMudar={(marcado) =>
          alterar(
            marcado
              ? { pagoEm: hojeISO(), valorPago: rascunho.valor }
              : { pagoEm: null, valorPago: null, formaPagamento: null },
          )
        }
      />

      {pago && (
        <>
          <Campo rotulo="Pago em" icone="calendario">
            {(id) => (
              <EntradaData
                id={id}
                valor={rascunho.pagoEm ?? hojeISO()}
                aoMudar={(valor) => atualizar('pagoEm', valor || hojeISO())}
              />
            )}
          </Campo>

          <Campo rotulo="Valor pago" icone="carteira" dica="ajuste se veio juros">
            {(id) => (
              <EntradaDinheiro
                id={id}
                valor={rascunho.valorPago ?? rascunho.valor}
                aoMudar={(valor) => atualizar('valorPago', valor)}
              />
            )}
          </Campo>

          <Campo rotulo="Forma de pagamento" icone="carteira">
            {(id) => (
              <Selecao
                id={id}
                valor={rascunho.formaPagamento ?? 'dinheiro'}
                aoMudar={(valor) => atualizar('formaPagamento', valor)}
                opcoes={FORMAS_PAGAMENTO.map((forma) => ({
                  valor: forma.valor,
                  rotulo: forma.rotulo,
                }))}
              />
            )}
          </Campo>
        </>
      )}

      <Anexo
        valor={rascunho.anexo}
        aoMudar={(valor) => atualizar('anexo', valor)}
        rotulo="Anexar o boleto (foto ou print)"
      />

      <Campo rotulo="Observação">
        {(id) => (
          <AreaTexto
            id={id}
            valor={rascunho.observacao}
            aoMudar={(valor) => atualizar('observacao', valor)}
          />
        )}
      </Campo>
    </Lancamento>
  );
}
