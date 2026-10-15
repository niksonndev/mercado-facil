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
      {/* key refaz a tela ao trocar de seção, zerando formulário e filtros. */}
      <main className="tela" key={rota.caminho}>
        <Tela caminho={rota.caminho} />
      </main>
      <Abas rota={rota} />
    </div>
  );
}
