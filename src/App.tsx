import { useEffect, useState } from 'react';
import { Abas, Menu, Topo } from './componentes/Navegacao';
import { lerEndereco, rotaPorCaminho } from './navegacao/rotas';
import { useTema } from './tema';
import { Painel } from './telas/Painel';
import { Caixa } from './telas/Caixa';
import { Contas } from './telas/Contas';
import { Despesas } from './telas/Despesas';
import { Custos } from './telas/Custos';
import { Folha } from './telas/Folha';
import { Banco } from './telas/Banco';
import { Fornecedores } from './telas/Fornecedores';
import { Relatorios } from './telas/Relatorios';
import { Dre } from './telas/Dre';
import { Dados } from './telas/Dados';

function Tela({ caminho }: { caminho: string }) {
  switch (caminho) {
    case 'caixa':
      return <Caixa />;
    case 'contas':
      return <Contas />;
    case 'despesas':
      return <Despesas />;
    case 'custos':
      return <Custos />;
    case 'folha':
      return <Folha />;
    case 'banco':
      return <Banco />;
    case 'fornecedores':
      return <Fornecedores />;
    case 'relatorios':
      return <Relatorios />;
    case 'dre':
      return <Dre />;
    case 'dados':
      return <Dados />;
    default:
      return <Painel />;
  }
}

export function App() {
  const { tema, alternar } = useTema();
  const [endereco, definirEndereco] = useState(lerEndereco);

  useEffect(() => {
    const aoMudarEndereco = () => {
      definirEndereco(lerEndereco());
      // Trocar de tela começa do topo: a rolagem anterior não faz sentido aqui.
      document.querySelector('.tela')?.scrollTo({ top: 0 });
    };

    window.addEventListener('hashchange', aoMudarEndereco);
    return () => window.removeEventListener('hashchange', aoMudarEndereco);
  }, []);

  const rota = rotaPorCaminho(endereco.caminho);

  return (
    <div className="app">
      <Topo rota={rota} tema={tema} aoAlternarTema={alternar} />
      <Menu rota={rota} />
      {/*
        A chave refaz a tela ao trocar de seção, zerando formulário e filtros.
        O `aba` entra na chave de propósito: o atalho de lançamento abre a folha
        pelo endereço (`#/caixa/novo`), então o botão voltar do celular precisa
        voltar para `#/caixa` e encontrar a tela fechada.
      */}
      <main className="tela" key={`${rota.caminho}/${endereco.aba}`}>
        <Tela caminho={rota.caminho} />
      </main>
      <Abas rota={rota} />
    </div>
  );
}
