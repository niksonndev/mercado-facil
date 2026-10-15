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
| **Caixa** | Fundo de caixa (troco do início do dia) e fechamento do dia por dinheiro, PIX, débito, crédito e fiado. Mostra o que deveria estar na gaveta e avisa os dias do mês que ficaram sem fechamento. |
| **Contas** | Boletos de fornecedor (vencimento, valor, fornecedor), cheques pré-datados (número, banco, bom para) e compras à vista (dinheiro, PIX, débito, crédito). Baixa de pagamento com data, valor e forma. |
| **Despesas** | Retirada de caixa e pagamentos diversos, com a marcação de "saiu do dinheiro da gaveta" que entra na conferência do caixa. |
| **Custos** | Aluguel, energia, água, internet, contabilidade e afins, por competência, com repetição automática dos recorrentes para o mês seguinte. |
| **Folha** | Cadastro de funcionários e folha mês a mês, separando o líquido do funcionário do custo da empresa (FGTS e encargos). |
| **Fornecedores** | Cadastro simples, com o total em aberto de cada um. |
| **Relatórios** | Resultado do mês, vendas por dia, de onde veio e para onde foi o dinheiro, e o que continua em aberto. |
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
- **Navegação por hash** (`#/contas`): o GitHub Pages não reescreve rota, e o
  link direto e o botão voltar do celular precisam funcionar de qualquer jeito.
- **Formas de pagamento** viram cores em `src/dominio/categorias.ts`; etiqueta,
  legenda e relatório leem de lá, então mudar um rótulo é mexer em um lugar só.

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
