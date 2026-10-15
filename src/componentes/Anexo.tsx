import { useState } from 'react';
import { lerAnexo, tamanhoDoAnexo } from '../dados/anexo';
import { Botao } from './base';
import { Campo } from './campos';

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
export function Anexo({ valor, aoMudar, rotulo = 'Anexar comprovante' }: PropsAnexo) {
  const [erro, definirErro] = useState('');
  const [lendo, definirLendo] = useState(false);

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
    <Campo
      rotulo={rotulo}
      dica="a foto é reduzida e vai junto no backup"
      erro={erro || undefined}
    >
      {(id) => (
        <>
          <input
            id={id}
            className="entrada"
            type="file"
            accept="image/*"
            capture="environment"
            disabled={lendo}
            onChange={(evento) => void escolher(evento.target.files?.[0])}
          />

          {lendo && <span className="campo__dica">Preparando a imagem…</span>}

          {valor && (
            <>
              <img
                src={valor}
                alt="Comprovante anexado"
                style={{
                  maxWidth: '100%',
                  borderRadius: 10,
                  marginTop: 8,
                  border: '1px solid var(--borda)',
                }}
              />
              <span className="campo__dica">
                {formatarTamanho(tamanhoDoAnexo(valor))} guardados
              </span>
              <Botao pequeno variante="fantasma" onClick={() => aoMudar('')}>
                Remover anexo
              </Botao>
            </>
          )}
        </>
      )}
    </Campo>
  );
}
