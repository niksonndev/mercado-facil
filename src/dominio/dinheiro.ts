import type { Centavos } from './tipos';

const MOEDA = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const NUMERO = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "R$ 1.234,56" */
export function formatarDinheiro(centavos: Centavos): string {
  return MOEDA.format(centavos / 100);
}

/** "1.234,56" — para dentro de um campo de formulário. */
export function formatarDinheiroSemSimbolo(centavos: Centavos): string {
  return NUMERO.format(centavos / 100);
}

/** Uma casa decimal, sem o ",0" sobrando: 12,0 vira 12. */
const umaCasa = (valor: number): string => {
  const texto = valor.toFixed(1).replace('.', ',');
  return texto.endsWith(',0') ? texto.slice(0, -2) : texto;
};

/** "1,2 mil" / "12 mil" / "1,1 mi" — para caber em cartão e etiqueta. */
export function formatarDinheiroCurto(centavos: Centavos): string {
  const sinal = centavos < 0 ? '-' : '';
  const reais = Math.abs(centavos) / 100;

  if (reais >= 1_000_000) {
    return `${sinal}R$ ${umaCasa(reais / 1_000_000)} mi`;
  }
  if (reais >= 10_000) {
    return `${sinal}R$ ${Math.round(reais / 1000)} mil`;
  }
  if (reais >= 1000) {
    return `${sinal}R$ ${umaCasa(reais / 1000)} mil`;
  }
  return formatarDinheiro(centavos);
}

/**
 * Converte o que a pessoa digitou em centavos.
 *
 * Aceita as duas grafias que aparecem na prática: "1.234,56" (pt-BR) e
 * "1234.56" (vindo de planilha/comprovante). Devolve `null` quando não há
 * número reconhecível, para o formulário barrar em vez de gravar zero.
 */
export function parseDinheiro(entrada: string): Centavos | null {
  const texto = entrada.trim();
  if (!texto) return null;

  const negativo = texto.startsWith('-');
  let limpo = texto.replace(/[^\d.,]/g, '');
  if (!/\d/.test(limpo)) return null;

  const temVirgula = limpo.includes(',');
  const temPonto = limpo.includes('.');

  if (temVirgula && temPonto) {
    // "1.234,56": ponto é milhar, vírgula é decimal.
    limpo = limpo.replace(/\./g, '').replace(',', '.');
  } else if (temVirgula) {
    limpo = limpo.replace(',', '.');
  } else if (temPonto) {
    const partes = limpo.split('.');
    const ultima = partes[partes.length - 1] ?? '';
    // "1.234" e "1.234.567" são milhar; "12.34" é decimal.
    if (partes.length > 2 || ultima.length === 3) limpo = partes.join('');
  }

  const valor = Number(limpo);
  if (!Number.isFinite(valor)) return null;

  const centavos = Math.round(valor * 100);
  return negativo ? -centavos : centavos;
}

/**
 * Máscara para digitar dinheiro sem teclar vírgula: os dígitos entram pela
 * direita e os dois últimos são os centavos ("1234" vira "12,34").
 */
export function mascararDinheiro(texto: string): string {
  const digitos = texto.replace(/\D/g, '');
  if (!digitos) return '';
  return formatarDinheiroSemSimbolo(Number(digitos));
}

/** "12,5%" */
export function formatarPercentual(parte: number, total: number): string {
  if (total === 0) return '—';
  return `${((parte / total) * 100).toFixed(1).replace('.', ',')}%`;
}

export function somarCentavos(valores: Centavos[]): Centavos {
  return valores.reduce((total, valor) => total + valor, 0);
}
