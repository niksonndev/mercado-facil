# Mercado Fácil

Gestão financeira do mercadinho de bairro. PWA offline-first: fecha o caixa do
dia, não deixa boleto de fornecedor passar e mostra o que sobrou no mês.

**App publicado:** https://niksonndev.github.io/mercado-facil/

Os dados ficam **só no aparelho** (IndexedDB). Não há servidor, login nem
requisição de rede em execução: o app abre e funciona sem internet depois da
primeira visita.

## O que o app resolve

| Seção | Para quê |
| --- | --- |
| **Painel** | O que fazer hoje: fechar o caixa, o que venceu, quanto entrou e quanto saiu no mês. |
| **Caixa** | Fundo de caixa (troco do início do dia) e fechamento do dia por dinheiro, PIX, débito, crédito e fiado. Um fechamento por dia e por ponto de venda (caixa 1, caixa 2), cada um com o funcionário que respondeu por ele. Mostra o que deveria estar na gaveta e avisa os dias do mês que ficaram sem fechamento. |
| **Contas** | Boletos de fornecedor (vencimento, valor, fornecedor), cheques pré-datados (número, banco, bom para), compras à vista e faturas do cartão da empresa (vencimento calculado pelo fechamento do cartão). Baixa de pagamento com data, valor e forma, e foto do boleto anexada. |
| **Despesas** | Retirada de caixa e pagamentos diversos, com a marcação de "saiu do dinheiro da gaveta" que entra na conferência do caixa, a marcação de despesa fixa (que a tela repete no mês seguinte) e a foto do comprovante anexada. |
| **Custos** | Aluguel, energia, água, internet, contabilidade e afins, por competência, com repetição automática dos recorrentes para o mês seguinte. |
| **Folha** | Cadastro de funcionários e folha mês a mês, separando o líquido do funcionário do custo da empresa (FGTS e encargos). |
| **Banco e cartões** | Cadastro dos cartões da empresa (dia de fechamento e de vencimento) para o app calcular a fatura e apontar o melhor dia de compra. Cadastro da conta bancária e a conferência do mês: o saldo que o app espera contra o saldo que o extrato mostrou. |
| **Fornecedores** | Cadastro simples, com o total em aberto de cada um. |
| **Relatórios** | Resultado do mês, vendas por dia, de onde veio e para onde foi o dinheiro, o que continua em aberto e a agenda do crédito das máquinas (o que ainda vai cair, o que atrasou e o que já caiu). |
| **DRE do mês** | Lucro ou prejuízo de verdade: vendas, taxas de cartão e impostos, custo da mercadoria vendida, custos, folha e retiradas, com margens e opção de imprimir. |
| **Dados** | Exportar e restaurar backup em JSON, carregar um mês de exemplo e apagar tudo. |

## Como rodar

```bash
pnpm install
pnpm dev          # desenvolvimento em http://localhost:5173/mercado-facil/
pnpm test         # regras de dinheiro, datas e fechamento do mês
pnpm typecheck
pnpm build        # gera dist/ e o precache-manifest.json
pnpm check-pwa    # valida o PWA gerado (manifest, ícones, precache, deep link)
pnpm preview      # serve o build: aqui o service worker é exercitado de verdade
```

`pnpm icones` regera os ícones (`scripts/gerar-icones.py`, precisa de Pillow).

## Decisões que valem saber

- **Dinheiro em centavos inteiros.** Nunca float: `0,07` precisa somar certo
  depois de mil lançamentos. `src/dominio/dinheiro.ts` cuida da conversão,
  incluindo a grafia de planilha (`1234.56`) e a do balcão (`1.234,56`).
- **Datas em `AAAA-MM-DD` no fuso local.** `toISOString()` usaria UTC e, às 21h
  no Brasil, jogaria o fechamento para o dia seguinte.
- **As saídas contam pela data de pagamento** (regime de caixa); o fiado entra
  como venda no dia em que foi vendido, mesmo sem ter entrado no caixa. É o que
  o relatório explica em uma nota no rodapé.
- **Nada de valor derivado gravado.** Situação da conta (atrasado, vence hoje,
  a vencer, pago), totais do dia e resumo do mês são calculados na leitura em
  `src/dominio/calculos.ts`, que é puro e testado. Não existe campo que possa
  ficar dessincronizado com os lançamentos.
- **Comprar mercadoria não é despesa.** No DRE, a compra paga a fornecedor não
  entra: o dinheiro virou estoque. Quem mede o gasto da mercadoria que saiu é o
  CMV, número que só a pessoa tem — por isso ele é informado à mão, um registro
  por competência, e o DRE reclama enquanto faltar. É também por isso que o
  resultado do DRE não bate com o de Relatórios: um é lucro, o outro é dinheiro
  na gaveta.
- **Navegação por hash** (`#/contas`): o GitHub Pages não reescreve rota, e o
  link direto e o botão voltar do celular precisam funcionar de qualquer jeito.
- **Um fechamento por dia e por ponto de venda.** O mercadinho de um caixa só
  fecha o dia sem cadastrar nada: o fechamento fica com ponto nulo e a tela o
  chama de "caixa único". Quem tem dois caixas cadastra os pontos e fecha cada
  um no seu lançamento, com o responsável daquele dia. A chave do lançamento é
  `data|ponto`, e é ela que impede o segundo fechamento do mesmo caixa no mesmo
  dia. Apagar um ponto não apaga o histórico: os fechamentos antigos mostram
  "caixa removido".
- **A venda no crédito entra no caixa no dia em que foi vendida; o dinheiro da
  máquina entra na conta na data prevista.** São duas perguntas diferentes, e o
  app responde as duas: o relatório mostra o que foi vendido, e a agenda "a
  receber das máquinas" mostra quando o crédito cai (prazo combinado com a
  adquirente, por dia fechado). Dá para dar baixa quando o dinheiro chega, e o
  valor depositado é guardado separado da venda, porque a adquirente desconta a
  taxa antes de creditar. Nada disso é gravado como valor derivado: a data
  prevista é calculada a partir da data do fechamento e do prazo.
- **A foto do comprovante é reduzida antes de ser gravada.** Ela vive no
  IndexedDB do aparelho e viaja dentro do backup em JSON, então guardar a foto
  original de 4 MB deixaria o backup imprestável: `src/dados/anexo.ts` corta no
  maior lado de 1200 px em JPEG, recusa o que não é imagem e avisa quanto pesa.
  O anexo é a porta de entrada do extrator de comprovante: quando um estiver
  registrado, é o arquivo daqui que ele recebe.
- **Despesa fixa é um lançamento por mês, não um lançamento que se repete
  sozinho.** O valor muda todo mês, então quem decide é a pessoa: a tela oferece
  lançar as fixas na competência seguinte com um clique, e cada mês continua
  tendo o seu registro (corrigir um mês não mexe no outro).
- **Formas de pagamento** viram cores em `src/dominio/categorias.ts`; etiqueta,
  legenda e relatório leem de lá, então mudar um rótulo é mexer em um lugar só.
- **A conferência do extrato é uma aproximação declarada, não um extrato.** O app
  não pergunta, em cada lançamento, de qual conta o dinheiro saiu (quem paga no
  balcão não sabe disso na hora). Então ele atribui à conta o que é dela por
  natureza (PIX, débito e o crédito das máquinas que já caiu), tira o que não é
  dinheiro vivo, desconta a folha sempre, e compara com o saldo que a pessoa leu
  no banco. Quando não bate, a diferença é a informação útil. Com mais de uma
  conta cadastrada o movimento é somado e a tela avisa que a conferência não
  separa por conta: separar exigiria marcar cada pagamento, o que é trabalho de
  ERP e não de mercadinho.

## Leitura de comprovante por IA (ainda não ligada)

O plano: mandar o print do comprovante, a foto do cupom ou o PDF do boleto e a
IA preencher fornecedor, valor e vencimento para a pessoa só confirmar.

O ponto de extensão já existe e a tela sabe consumir o resultado:
`src/ia/extrair.ts` (interface `ExtratorComprovante`), `src/ia/tipos.ts`
(`LancamentoSugerido`) e `src/componentes/ImportarComprovante.tsx`. Basta
registrar um extrator em `EXTRATORES` — um serviço de visão, um modelo local via
WebGPU ou uma API paga. Enquanto a lista estiver vazia, a tela explica o caminho
manual em vez de fingir que leu o arquivo.

## Estrutura

```
src/
  dominio/     regras puras: tipos, dinheiro, datas, categorias, cálculos (+ testes)
  dados/       IndexedDB (Dexie), repositório, consultas reativas, backup, exemplos
  componentes/ campos, gaveta, listas, formulários
  telas/       uma por seção do menu
  ia/          ponto de extensão da leitura de comprovante
public/        manifest, service worker, tema pré-pintura, ícones
scripts/       validador do build PWA, gerador de ícones
```

## Deploy

Push em `main` roda testes, build e validação do PWA; passando, o `dist` é
publicado no GitHub Pages pelo workflow em `.github/workflows/ci.yml`.
