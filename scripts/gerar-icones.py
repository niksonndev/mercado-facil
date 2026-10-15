"""Gera os ícones do Mercado Fácil (PWA).

Desenha uma cesta de compras branca sobre um fundo verde em degradê, em quatro
tamanhos:

    icon-192.png          uso geral (Android, atalhos)
    icon-512.png          uso geral em alta resolução
    maskable-512.png      Android recorta o ícone: o glifo fica na zona segura
    apple-touch-icon.png  iOS aplica a própria máscara: fundo cheio, sem canto

Renderiza em 4x e reduz com LANCZOS, senão as bordas ficam serrilhadas.

Uso: python3 scripts/gerar-icones.py   (escreve em public/icons)
"""

from pathlib import Path

from PIL import Image, ImageDraw

SAIDA = Path(__file__).resolve().parent.parent / "public" / "icons"
ESCALA = 4

# Verde do tema: claro em cima, escuro embaixo.
TOPO = (46, 229, 157)
BASE = (12, 138, 92)
BRANCO = (255, 255, 255, 255)


def gradiente(tamanho: int) -> Image.Image:
    """Degradê vertical linha a linha."""
    imagem = Image.new("RGBA", (tamanho, tamanho))
    pincel = ImageDraw.Draw(imagem)
    for y in range(tamanho):
        t = y / max(1, tamanho - 1)
        cor = tuple(round(TOPO[i] + (BASE[i] - TOPO[i]) * t) for i in range(3))
        pincel.line([(0, y), (tamanho, y)], fill=cor + (255,))
    return imagem


def cantos_arredondados(imagem: Image.Image, raio: int) -> Image.Image:
    """Aplica o canto arredondado com máscara alfa."""
    mascara = Image.new("L", imagem.size, 0)
    ImageDraw.Draw(mascara).rounded_rectangle(
        [0, 0, imagem.size[0] - 1, imagem.size[1] - 1], raio, fill=255
    )
    saida = Image.new("RGBA", imagem.size, (0, 0, 0, 0))
    saida.paste(imagem, (0, 0), mascara)
    return saida


def cesta(pincel: ImageDraw.ImageDraw, caixa: tuple, espessura: int) -> None:
    """Cesta de compras: alça em arco sobre um corpo trapezoidal."""
    x0, y0, x1, y1 = caixa
    largura = x1 - x0
    altura = y1 - y0

    # Alça: a metade de cima de uma elipse vira o arco da alça.
    pincel.arc(
        [x0 + largura * 0.20, y0, x1 - largura * 0.20, y0 + altura * 0.62],
        start=180,
        end=360,
        fill=BRANCO,
        width=espessura,
    )

    # Corpo: trapézio afunilado para baixo.
    pincel.polygon(
        [
            (x0, y0 + altura * 0.50),
            (x1, y0 + altura * 0.50),
            (x1 - largura * 0.16, y1),
            (x0 + largura * 0.16, y1),
        ],
        fill=BRANCO,
    )


def gerar(tamanho: int, destino: Path, margem_relativa: float, arredondar: bool) -> None:
    lado = tamanho * ESCALA
    imagem = gradiente(lado)

    margem = lado * margem_relativa
    cesta(
        ImageDraw.Draw(imagem),
        (margem, margem, lado - margem, lado - margem),
        espessura=int(lado * 0.055),
    )

    final = cantos_arredondados(imagem, int(lado * 0.22)) if arredondar else imagem
    final.resize((tamanho, tamanho), Image.LANCZOS).save(destino)
    print(f"{destino.relative_to(SAIDA.parent.parent)}  {tamanho}x{tamanho}")


def main() -> None:
    SAIDA.mkdir(parents=True, exist_ok=True)

    # Ícone normal: canto arredondado, glifo ocupando bem o quadro.
    gerar(192, SAIDA / "icon-192.png", margem_relativa=0.24, arredondar=True)
    gerar(512, SAIDA / "icon-512.png", margem_relativa=0.24, arredondar=True)

    # Maskable: o Android recorta até um círculo, então o glifo encolhe para
    # dentro da zona segura de 80% e o fundo sangra até a borda.
    gerar(512, SAIDA / "maskable-512.png", margem_relativa=0.32, arredondar=False)

    # iOS aplica a máscara sozinho: quadrado cheio.
    gerar(180, SAIDA / "apple-touch-icon.png", margem_relativa=0.26, arredondar=False)


if __name__ == "__main__":
    main()
