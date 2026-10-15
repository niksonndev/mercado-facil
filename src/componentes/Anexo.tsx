import { useRef, useState } from 'react';
import { lerAnexo, tamanhoDoAnexo } from '../dados/anexo';
import { Botao } from './base';
import { Icone } from './icones';

export interface PropsAnexo {
  /** Data URL da imagem já guardada, ou string vazia. */
  valor: string;
  aoMudar: (valor: string) => void;
  rotulo?: string;
}

/** Formata bytes no que o dono entende: KB e MB. */
function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

/**
 * Anexo de comprovante no lançamento.
 *
 * No celular o botão abre a câmera direto (`capture`), que é como o lojista
 * registra boleto e cupom na prática. A imagem é reduzida antes de entrar no
 * banco e a tela diz quanto ela ocupa, porque esse peso vai junto no backup.
 */
export function Anexo({ valor, aoMudar, rotulo = 'Anexar' }: PropsAnexo) {
  const [erro, definirErro] = useState('');
  const [lendo, definirLendo] = useState(false);
  const arquivo = useRef<HTMLInputElement>(null);

  const escolher = async (arquivo: File | undefined) => {
    if (!arquivo) return;
    definirLendo(true);
    definirErro('');
    try {
      aoMudar(await lerAnexo(arquivo));
    } catch (falha) {
      definirErro(falha instanceof Error ? falha.message : 'Não consegui ler essa imagem.');
    } finally {
      definirLendo(false);
    }
  };

  return (
    <>
      <div className="campo campo--linha">
        <span className="campo__icone">
          <Icone nome="imagem" tamanho={20} />
        </span>
        <span className="campo__rotulo">
          {rotulo}
          {(erro || valor || lendo) && (
            <span className="campo__dica">
              {erro ||
                (lendo
                  ? 'preparando a imagem…'
                  : `${formatarTamanho(tamanhoDoAnexo(valor))} guardados`)}
            </span>
          )}
        </span>
        <span className="campo__valor">
          {valor ? (
            <Botao pequeno variante="fantasma" onClick={() => aoMudar('')}>
              Remover
            </Botao>
          ) : (
            <Botao
              variante="fantasma"
              className="botao--icone"
              aria-label="Escolher a foto do comprovante"
              title="Escolher a foto do comprovante"
              onClick={() => arquivo.current?.click()}
            >
              <Icone nome="enviar" tamanho={21} />
            </Botao>
          )}
        </span>
      </div>

      <input
        id="anexo-comprovante"
        ref={arquivo}
        className="oculto-visual"
        type="file"
        accept="image/*"
        capture="environment"
        disabled={lendo}
        onChange={(evento) => void escolher(evento.target.files?.[0])}
      />

      {valor && (
        <img
          src={valor}
          alt="Comprovante anexado"
          style={{
            width: '100%',
            borderRadius: 16,
            margin: '2px 0 12px',
            border: '1px solid var(--borda)',
          }}
        />
      )}
    </>
  );
}
