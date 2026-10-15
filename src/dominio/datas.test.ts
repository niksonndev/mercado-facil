import { describe, expect, it } from 'vitest';
import {
  adicionarDias,
  adicionarMeses,
  competenciaDe,
  diferencaEmDias,
  diasDoMes,
  formatarData,
  formatarDataCurta,
  nomeDoMes,
  nomeDoMesCurto,
  rotuloPrazo,
  ultimoDiaDoMes,
} from './datas';

describe('datas', () => {
  it('formata no padrão brasileiro', () => {
    expect(formatarData('2026-10-15')).toBe('15/10/2026');
    expect(formatarDataCurta('2026-10-15')).toBe('15/10');
    expect(formatarData(null)).toBe('—');
  });

  it('extrai competência e nome do mês', () => {
    expect(competenciaDe('2026-10-15')).toBe('2026-10');
    expect(nomeDoMes('2026-10')).toBe('outubro de 2026');
    expect(nomeDoMesCurto('2026-10')).toBe('out/2026');
  });

  it('navega entre meses virando o ano', () => {
    expect(adicionarMeses('2026-10', 1)).toBe('2026-11');
    expect(adicionarMeses('2026-12', 1)).toBe('2027-01');
    expect(adicionarMeses('2027-01', -1)).toBe('2026-12');
    expect(adicionarMeses('2026-01', -1)).toBe('2025-12');
  });

  it('soma dias atravessando mês e ano bissexto', () => {
    expect(adicionarDias('2026-10-31', 1)).toBe('2026-11-01');
    expect(adicionarDias('2024-02-28', 1)).toBe('2024-02-29');
    expect(adicionarDias('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('calcula diferença em dias nos dois sentidos', () => {
    expect(diferencaEmDias('2026-10-15', '2026-10-15')).toBe(0);
    expect(diferencaEmDias('2026-10-15', '2026-10-22')).toBe(7);
    expect(diferencaEmDias('2026-10-15', '2026-10-10')).toBe(-5);
  });

  it('sabe o último dia do mês', () => {
    expect(ultimoDiaDoMes('2026-10')).toBe('2026-10-31');
    expect(ultimoDiaDoMes('2026-02')).toBe('2026-02-28');
    expect(ultimoDiaDoMes('2024-02')).toBe('2024-02-29');
    expect(diasDoMes('2026-04')).toHaveLength(30);
  });

  it('descreve o prazo em linguagem de balcão', () => {
    expect(rotuloPrazo('2026-10-15', '2026-10-15')).toBe('vence hoje');
    expect(rotuloPrazo('2026-10-16', '2026-10-15')).toBe('vence amanhã');
    expect(rotuloPrazo('2026-10-18', '2026-10-15')).toBe('em 3 dias');
    expect(rotuloPrazo('2026-10-14', '2026-10-15')).toBe('atrasado há 1 dia');
    expect(rotuloPrazo('2026-10-05', '2026-10-15')).toBe('atrasado há 10 dias');
  });
});
