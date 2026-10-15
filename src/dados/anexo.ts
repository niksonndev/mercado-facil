/**
 * Anexo do lançamento: a foto do comprovante, do cupom ou do boleto.
 *
 * A imagem é reduzida antes de ser gravada porque ela vive no IndexedDB do
 * aparelho e viaja dentro do backup em JSON: guardar a foto original de 4 MB
 * deixaria o backup imprestável. Guardar em base64 custa cerca de um terço a
 * mais que o arquivo, então o limite também é em caracteres.
 *
 * Este arquivo é a porta de entrada do extrator de comprovante por IA: hoje ele
 * só guarda a imagem; quando um extrator estiver registrado, é daqui que ele
 * recebe o arquivo.
 */

/** Maior lado da imagem guardada, em pixels. */
const LADO_MAXIMO = 1200;

/** Qualidade do JPEG: 0,7 é o ponto em que um cupom ainda é legível. */
const QUALIDADE = 0.7;

/** Cerca de 900 KB em base64: acima disso o backup começa a ficar pesado. */
const LIMITE_CARACTERES = 900_000;

/** Reduz e converte a foto escolhida em algo que cabe no banco do aparelho. */
export async function lerAnexo(arquivo: File): Promise<string> {
  if (!arquivo.type.startsWith('image/')) {
    throw new Error('Por enquanto só dá para anexar foto ou print (imagem).');
  }

  const bitmap = await createImageBitmap(arquivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
  const largura = Math.max(1, Math.round(bitmap.width * escala));
  const altura = Math.max(1, Math.round(bitmap.height * escala));

  const tela = document.createElement('canvas');
  tela.width = largura;
  tela.height = altura;

  const contexto = tela.getContext('2d');
  if (!contexto) {
    throw new Error('Não consegui preparar a imagem neste aparelho.');
  }

  contexto.drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close();

  const dataUrl = tela.toDataURL('image/jpeg', QUALIDADE);
  if (dataUrl.length > LIMITE_CARACTERES) {
    throw new Error('A foto ficou grande demais mesmo reduzida. Tente uma foto mais próxima do comprovante.');
  }

  return dataUrl;
}

/** Tamanho aproximado do anexo, para mostrar ao dono o que ele está guardando. */
export function tamanhoDoAnexo(anexo: string): number {
  return Math.round((anexo.length * 3) / 4);
}
