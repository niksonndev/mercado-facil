import { describe, expect, it } from 'vitest';
import type { CustoOperacional, Despesa } from '../dominio/tipos';
import { custoDoProximoMes, despesaDoProximoMes } from './repositorio';

function despesa(campos: Partial<Despesa> & { data: string }): Despesa {
  return {
    id: 'd1',
    tipo: 'diversos',
    descricao: 'Assinatura do sistema',
    categoria: 'geral',
    valor: 9900,
    formaPagamento: 'pix',
    retiradaDoCaixa: false,
    fixa: true,
    beneficiario: 'Sistema da loja',
    anexo: '',
    observacao: '',
    criadoEm: '2026-01-01T00:00:00.000Z',
    ...campos,
  };
}

describe('despesa fixa no mês seguinte', () => {
  it('copia a despesa para a competência pedida, sem o anexo', () => {
    const original = despesa({ data: '2026-01-10', anexo: 'data:image/jpeg;base64,abc' });
    const copia = despesaDoProximoMes(original, '2026-02');

    expect(copia.data).toBe('2026-02-10');
    expect(copia.descricao).toBe(original.descricao);
    expect(copia.valor).toBe(9900);
    expect(copia.fixa).toBe(true);
    expect(copia.beneficiario).toBe('Sistema da loja');
    // A foto é do comprovante daquele mês: a cópia nasce sem ela.
    expect(copia.anexo).toBe('');
    // É um lançamento novo, não o mesmo corrigido.
    expect(copia.id).not.toBe(original.id);
  });

  it('não inventa dia que não existe no mês seguinte', () => {
    // 31 de janeiro cai em 28 de fevereiro: 2026 não é bissexto.
    expect(despesaDoProximoMes(despesa({ data: '2026-01-31' }), '2026-02').data).toBe(
      '2026-02-28',
    );
    // Em ano bissexto, cai em 29.
    expect(despesaDoProximoMes(despesa({ data: '2028-01-31' }), '2028-02').data).toBe(
      '2028-02-29',
    );
  });
});

function custo(
  campos: Partial<CustoOperacional> & { vencimento: string },
): CustoOperacional {
  return {
    id: 'c1',
    categoria: 'aluguel',
    descricao: 'Aluguel da loja',
    competencia: campos.vencimento.slice(0, 7),
    valorPrevisto: 150000,
    recorrente: true,
    pagoEm: null,
    valorPago: null,
    formaPagamento: null,
    anexo: '',
    observacao: '',
    criadoEm: '2026-01-01T00:00:00.000Z',
    atualizadoEm: '2026-01-01T00:00:00.000Z',
    ...campos,
  };
}

describe('custo recorrente no mês seguinte', () => {
  it('copia o custo para a competência pedida, em aberto e sem o anexo', () => {
    const original = custo({ vencimento: '2026-01-10', anexo: 'data:image/jpeg;base64,abc' });
    const copia = custoDoProximoMes(original, '2026-02');

    expect(copia.competencia).toBe('2026-02');
    expect(copia.vencimento).toBe('2026-02-10');
    expect(copia.descricao).toBe(original.descricao);
    expect(copia.valorPrevisto).toBe(150000);
    expect(copia.recorrente).toBe(true);
    // A cópia nasce em aberto: o mês novo ainda não foi pago.
    expect(copia.pagoEm).toBeNull();
    expect(copia.valorPago).toBeNull();
    expect(copia.formaPagamento).toBeNull();
    // É um lançamento novo, não o mesmo corrigido.
    expect(copia.id).not.toBe(original.id);
  });

  it('não inventa dia que não existe no mês seguinte', () => {
    // 31 de janeiro cai em 28 de fevereiro: 2026 não é bissexto.
    expect(custoDoProximoMes(custo({ vencimento: '2026-01-31' }), '2026-02').vencimento).toBe(
      '2026-02-28',
    );
    // Em ano bissexto, cai em 29.
    expect(custoDoProximoMes(custo({ vencimento: '2028-01-31' }), '2028-02').vencimento).toBe(
      '2028-02-29',
    );
  });
});
