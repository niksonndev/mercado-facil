import { useRef, useState } from 'react';
import { embrulharArquivo, EXTRATORES, temExtratorDeComprovante } from '../ia/extrair';
import type { LancamentoSugerido } from '../ia/tipos';
import { Aviso, Botao, Cartao } from './base';
import { Gaveta } from './Gaveta';

export interface PropsImportarComprovante {
  /** Chamado com cada lançamento que a IA conseguiu ler, para revisão. */
  aoSugerir: (sugestao: LancamentoSugerido) => void;
}

/**
 * Entrada de comprovante por arquivo.
 *
 * A ideia: mandar o print do comprovante, a foto do cupom ou o PDF do boleto e
 * a IA preencher fornecedor, valor e vencimento para a pessoa só confirmar.
 *
 * Ainda não há extrator ligado (ver src/ia/extrair.ts), então a tela explica o
 * caminho manual em vez de fingir que leu o arquivo.
 */
export function ImportarComprovante({ aoSugerir }: PropsImportarComprovante) {
  const entradaArquivo = useRef<HTMLInputElement>(null);
  const [explicando, definirExplicando] = useState(false);
  const [lendo, definirLendo] = useState(false);
  const disponivel = temExtratorDeComprovante();

  const ler = async (arquivo: File) => {
    const extrator = EXTRATORES.find((item) => item.aceita(arquivo));
    if (!extrator) {
      definirExplicando(true);
      return;
    }

    definirLendo(true);
    try {
      const comprovante = await embrulharArquivo(arquivo);
      const sugestoes = await extrator.extrair(comprovante);
      if (sugestoes.length === 0) definirExplicando(true);
      sugestoes.forEach(aoSugerir);
    } finally {
      definirLendo(false);
      if (entradaArquivo.current) entradaArquivo.current.value = '';
    }
  };

  return (
    <>
      <Botao
        icone={disponivel ? 'enviar' : 'mais-circulo'}
        pequeno
        disabled={lendo}
        onClick={() => {
          if (disponivel) {
            entradaArquivo.current?.click();
            return;
          }
          definirExplicando(true);
        }}
      >
        {lendo ? 'Lendo…' : disponivel ? 'Enviar comprovante' : 'Preencher por comprovante'}
      </Botao>

      <input
        ref={entradaArquivo}
        type="file"
        accept="image/*,.pdf"
        className="oculto-visual"
        onChange={(evento) => {
          const arquivo = evento.target.files?.[0];
          if (arquivo) void ler(arquivo);
        }}
      />

      <Gaveta
        aberta={explicando}
        titulo="Preencher por comprovante"
        aoFechar={() => definirExplicando(false)}
      >
        <Aviso tom="info" icone="alerta">
          <strong>Ainda não está ligado.</strong> A leitura automática de print,
          foto e PDF de boleto depende de um serviço de IA, que ainda não foi
          conectado a este app.
        </Aviso>

        <div style={{ height: 12 }} />

        <Cartao titulo="Como vai funcionar">
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: '0.88rem', lineHeight: 1.7 }}>
            <li>Você manda o comprovante ou o PDF do boleto.</li>
            <li>A IA lê fornecedor, valor e vencimento.</li>
            <li>O app mostra o lançamento preenchido e você só confirma.</li>
          </ol>
        </Cartao>

        <div style={{ height: 12 }} />

        <Cartao titulo="Até lá">
          <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.6 }}>
            Lance pelo formulário normalmente: são poucos campos e o fornecedor
            já aparece na sugestão enquanto você digita. Todo lançamento fica
            salvo no aparelho e entra no relatório na hora.
          </p>
        </Cartao>

        <div style={{ height: 12 }} />

        <Cartao titulo="Onde ligar o extrator">
          <p style={{ margin: 0, fontSize: '0.84rem', lineHeight: 1.6, color: 'var(--suave)' }}>
            <code>src/ia/extrair.ts</code> — registre um objeto em{' '}
            <code>EXTRATORES</code> que devolva <code>LancamentoSugerido[]</code>.
            Esta tela já sabe consumir o resultado.
          </p>
        </Cartao>
      </Gaveta>
    </>
  );
}
