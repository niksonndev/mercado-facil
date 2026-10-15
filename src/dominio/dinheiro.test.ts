import { describe, expect, it } from 'vitest';
import {
  formatarDinheiro,
  formatarDinheiroCurto,
  formatarPercentual,
  mascararDinheiro,
  parseDinheiro,
} from './dinheiro';

describe('parseDinheiro', () => {
  it('lê a grafia brasileira com milhar e centavos', () => {
    expect(parseDinheiro('1.234,56')).toBe(123456);
    expect(parseDinheiro('R$ 1.234,56')).toBe(123456);
    expect(parseDinheiro('12,90')).toBe(1290);
  });

  it('lê a grafia de planilha com ponto decimal', () => {
    expect(parseDinheiro('1234.56')).toBe(123456);
    expect(parseDinheiro('0.5')).toBe(50);
  });

  it('trata ponto de milhar sem centavos', () => {
    expect(parseDinheiro('1.234')).toBe(123400);
    expect(parseDinheiro('1.234.567')).toBe(123456700);
  });

  it('aceita inteiro e devolve null quando não há número', () => {
    expect(parseDinheiro('50')).toBe(5000);
    expect(parseDinheiro('')).toBeNull();
    expect(parseDinheiro('abc')).toBeNull();
  });

  it('não perde centavo por arredondamento de float', () => {
    expect(parseDinheiro('0,07')).toBe(7);
    expect(parseDinheiro('19,99')).toBe(1999);
    expect(parseDinheiro('0,29')).toBe(29);
  });

  it('preserva o sinal negativo', () => {
    expect(parseDinheiro('-10,00')).toBe(-1000);
  });
});

describe('mascararDinheiro', () => {
  it('preenche da direita para a esquerda', () => {
    expect(mascararDinheiro('1')).toBe('0,01');
    expect(mascararDinheiro('123')).toBe('1,23');
    expect(mascararDinheiro('123456')).toBe('1.234,56');
  });

  it('ignora o que não é dígito e esvazia sem número', () => {
    expect(mascararDinheiro('R$ 12,34')).toBe('12,34');
    expect(mascararDinheiro('')).toBe('');
    expect(mascararDinheiro('abc')).toBe('');
  });

  it('ida e volta com parseDinheiro', () => {
    const centavos = parseDinheiro(mascararDinheiro('987654'));
    expect(centavos).toBe(987654);
  });
});

describe('formatação', () => {
  it('mostra em real', () => {
    expect(formatarDinheiro(123456)).toContain('1.234,56');
    expect(formatarDinheiro(0)).toContain('0,00');
  });

  it('encurta valores grandes', () => {
    expect(formatarDinheiroCurto(99999)).toContain('999,99');
    expect(formatarDinheiroCurto(150000)).toContain('1,5 mil');
    expect(formatarDinheiroCurto(1200000)).toContain('12 mil');
    expect(formatarDinheiroCurto(1200000000)).toContain('12 mi');
  });

  it('calcula percentual sem dividir por zero', () => {
    expect(formatarPercentual(50, 200)).toBe('25,0%');
    expect(formatarPercentual(10, 0)).toBe('—');
  });
});
