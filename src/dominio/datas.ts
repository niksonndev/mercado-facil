import type { Competencia, DataISO } from './tipos';

const DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const doisDigitos = (numero: number) => String(numero).padStart(2, '0');

/**
 * Data de hoje em fuso local.
 *
 * `toISOString()` usaria UTC: às 21h no Brasil o app acharia que já é o dia
 * seguinte e o fechamento cairia na data errada.
 */
export function hojeISO(): DataISO {
  const agora = new Date();
  return `${agora.getFullYear()}-${doisDigitos(agora.getMonth() + 1)}-${doisDigitos(
    agora.getDate(),
  )}`;
}

/** Interpreta 'AAAA-MM-DD' como data local (meia-noite), não UTC. */
export function paraDate(iso: DataISO): Date {
  return new Date(`${iso}T00:00:00`);
}

export function deDate(data: Date): DataISO {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(
    data.getDate(),
  )}`;
}

/** "15/10/2026" */
export function formatarData(iso: DataISO | null | undefined): string {
  if (!iso) return '—';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

/** "15/10" */
export function formatarDataCurta(iso: DataISO | null | undefined): string {
  if (!iso) return '—';
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}

/** "qua, 15/10" */
export function formatarDataComDia(iso: DataISO): string {
  const data = paraDate(iso);
  const semana = DIAS_CURTOS[data.getDay()] ?? '';
  return `${semana}, ${formatarDataCurta(iso)}`;
}

/** "outubro de 2026" */
export function nomeDoMes(competencia: Competencia): string {
  const [ano, mes] = competencia.split('-');
  const nome = MESES[Number(mes) - 1] ?? competencia;
  return `${nome} de ${ano}`;
}

/** "out/2026" */
export function nomeDoMesCurto(competencia: Competencia): string {
  const [ano, mes] = competencia.split('-');
  const nome = MESES[Number(mes) - 1] ?? competencia;
  return `${nome.slice(0, 3)}/${ano}`;
}

export function competenciaDe(iso: DataISO): Competencia {
  return iso.slice(0, 7);
}

export function mesAtual(): Competencia {
  return competenciaDe(hojeISO());
}

export function adicionarMeses(competencia: Competencia, quantidade: number): Competencia {
  const [ano, mes] = competencia.split('-').map(Number);
  const base = new Date(Number(ano), Number(mes) - 1 + quantidade, 1);
  return `${base.getFullYear()}-${doisDigitos(base.getMonth() + 1)}`;
}

export function adicionarDias(iso: DataISO, dias: number): DataISO {
  const data = paraDate(iso);
  data.setDate(data.getDate() + dias);
  return deDate(data);
}

/** Dias de `de` até `para` (positivo quando `para` está no futuro). */
export function diferencaEmDias(de: DataISO, para: DataISO): number {
  const inicio = paraDate(de).getTime();
  const fim = paraDate(para).getTime();
  return Math.round((fim - inicio) / 86_400_000);
}

export function ultimoDiaDoMes(competencia: Competencia): DataISO {
  const [ano, mes] = competencia.split('-').map(Number);
  const ultimo = new Date(Number(ano), Number(mes), 0).getDate();
  return `${ano}-${doisDigitos(Number(mes))}-${doisDigitos(ultimo)}`;
}

export function primeiroDiaDoMes(competencia: Competencia): DataISO {
  return `${competencia}-01`;
}

/** Todos os dias da competência, em ordem. */
export function diasDoMes(competencia: Competencia): DataISO[] {
  const ultimo = Number(ultimoDiaDoMes(competencia).slice(8));
  return Array.from({ length: ultimo }, (_, indice) =>
    `${competencia}-${doisDigitos(indice + 1)}`,
  );
}

/** "vence hoje", "em 3 dias", "atrasado há 5 dias" */
export function rotuloPrazo(vencimento: DataISO, hoje: DataISO): string {
  const dias = diferencaEmDias(hoje, vencimento);

  if (dias === 0) return 'vence hoje';
  if (dias === 1) return 'vence amanhã';
  if (dias === -1) return 'atrasado há 1 dia';
  if (dias < 0) return `atrasado há ${Math.abs(dias)} dias`;
  if (dias <= 7) return `em ${dias} dias`;
  return `em ${Math.round(dias / 7)} semanas`;
}

/** Agrupa por competência mantendo a ordem de entrada. */
export function competenciasDe(datas: DataISO[]): Competencia[] {
  return [...new Set(datas.map(competenciaDe))].sort().reverse();
}

export const competenciaAtual = mesAtual;
