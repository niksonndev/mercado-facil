import { useRef, useState } from 'react';
import { baixarBackup, importarBackup, montarBackup } from '../dados/backup';
import { apagarTudo } from '../dados/repositorio';
import { carregarExemplos } from '../dados/exemplos';
import { db } from '../dados/db';
import { useAcervo } from '../dados/hooks';
import { formatarData, hojeISO } from '../dominio/datas';
import { formatarDinheiro } from '../dominio/dinheiro';
import { pendencias } from '../dominio/calculos';
import { Aviso, Botao, Cartao, Ficha, Vazio } from '../componentes/base';

export function Dados() {
  const acervo = useAcervo();
  const entradaArquivo = useRef<HTMLInputElement>(null);
  const [mensagem, definirMensagem] = useState('');
  const [ocupado, definirOcupado] = useState(false);

  if (!acervo) return <Vazio titulo="Carregando…" />;

  const contagens = [
    ['Dias fechados', acervo.fechamentos.length],
    ['Contas de fornecedor', acervo.contas.length],
    ['Despesas', acervo.despesas.length],
    ['Custos operacionais', acervo.custos.length],
    ['Folha de pagamento', acervo.folha.length],
    ['Meses com DRE', acervo.indicadores.length],
  ] as const;

  const totalLancamentos = contagens.reduce((soma, [, quantos]) => soma + quantos, 0);

  const exportar = async () => {
    definirOcupado(true);
    try {
      const backup = await montarBackup();
      await baixarBackup();
      definirMensagem(
        `Backup gerado com ${totalLancamentos} lançamento(s) e ${backup.dados.fechamentos.length} dia(s) fechado(s).`,
      );
    } finally {
      definirOcupado(false);
    }
  };

  const importar = async (arquivo: File) => {
    definirOcupado(true);
    try {
      const texto = await arquivo.text();
      const resultado = await importarBackup(texto);
      definirMensagem(
        `Importados ${resultado.total} lançamento(s)` +
          (resultado.ignorados > 0
            ? ` — ${resultado.ignorados} registro(s) foram ignorados por falta de data ou valor.`
            : '.'),
      );
    } catch (erro) {
      definirMensagem(
        erro instanceof Error ? `Não deu para importar: ${erro.message}` : 'Falha ao importar.',
      );
    } finally {
      definirOcupado(false);
      if (entradaArquivo.current) entradaArquivo.current.value = '';
    }
  };

  const confirmarExemplos = async () => {
    if (
      !window.confirm(
        'Isso apaga tudo que está no app e coloca um mês de exemplo no lugar. Continuar?',
      )
    ) {
      return;
    }
    definirOcupado(true);
    try {
      await carregarExemplos();
      definirMensagem('Exemplos carregados. Confira o Painel e os Relatórios.');
    } finally {
      definirOcupado(false);
    }
  };

  const confirmarApagar = async () => {
    if (
      !window.confirm(
        'Apagar todos os lançamentos do aparelho? Faça um backup antes — não dá para desfazer.',
      )
    ) {
      return;
    }
    definirOcupado(true);
    try {
      await apagarTudo();
      definirMensagem('Todos os lançamentos foram apagados.');
    } finally {
      definirOcupado(false);
    }
  };

  const emAberto = pendencias(acervo).totalEmAberto;

  return (
    <>
      <Aviso tom="info" icone="dados">
        <strong>Os dados são só deste aparelho.</strong> Nada é enviado para a internet:
        o Mercado Fácil guarda tudo no navegador (IndexedDB). Se você limpar os dados do
        site, trocar de celular ou formatar o computador, o movimento se perde — por isso
        o backup.
      </Aviso>

      {mensagem && <Aviso tom="info" icone="check">{mensagem}</Aviso>}

      <Cartao titulo="Backup">
        <p style={{ marginTop: 0, fontSize: '0.88rem', lineHeight: 1.6 }}>
          O arquivo sai em JSON com tudo: caixa, contas, despesas, custos, folha,
          funcionários e fornecedores. Guarde no e-mail, no drive ou num pen drive.
        </p>
        <div className="grupo-botoes">
          <Botao
            variante="principal"
            icone="baixar"
            onClick={exportar}
            disabled={ocupado}
          >
            Baixar backup
          </Botao>
          <Botao icone="enviar" onClick={() => entradaArquivo.current?.click()} disabled={ocupado}>
            Restaurar backup
          </Botao>
        </div>
        <p className="estatistica__detalhe" style={{ marginTop: 10 }}>
          Restaurar substitui tudo que está no app pelo conteúdo do arquivo.
        </p>

        <input
          ref={entradaArquivo}
          type="file"
          accept="application/json,.json"
          className="oculto-visual"
          onChange={(evento) => {
            const arquivo = evento.target.files?.[0];
            if (arquivo) void importar(arquivo);
          }}
        />
      </Cartao>

      <Cartao titulo="O que tem aqui dentro">
        <Ficha rotulo="Backup gerado em" valor={formatarData(hojeISO())} />
        {contagens.map(([rotulo, quantos]) => (
          <Ficha key={rotulo} rotulo={rotulo} valor={String(quantos)} />
        ))}
        <Ficha rotulo="Compromissos em aberto" valor={formatarDinheiro(emAberto)} />
      </Cartao>

      <Cartao titulo="Começar de novo">
        <p style={{ marginTop: 0, fontSize: '0.88rem', lineHeight: 1.6 }}>
          Para conhecer o app antes de lançar o movimento de verdade, carregue um mês de
          exemplo. Dá para apagar depois.
        </p>
        <div className="grupo-botoes">
          <Botao onClick={confirmarExemplos} disabled={ocupado}>
            Carregar exemplo
          </Botao>
          <Botao variante="perigo" onClick={confirmarApagar} disabled={ocupado}>
            Apagar tudo
          </Botao>
        </div>
      </Cartao>

      <Cartao titulo="Sobre">
        <Ficha rotulo="App" valor="Mercado Fácil" />
        <Ficha rotulo="Versão" valor="0.1.0" />
        <Ficha rotulo="Funciona offline" valor="Sim, depois de abrir uma vez" />
        <Ficha rotulo="Banco local" valor={db.name} />
        <p className="estatistica__detalhe" style={{ marginTop: 10 }}>
          Feito para o dia a dia do mercadinho: fechar o caixa, não perder boleto de
          fornecedor e saber o que sobrou no mês.
        </p>
      </Cartao>
    </>
  );
}
