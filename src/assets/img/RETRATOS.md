# Retratos da landing — o que falta e como entregar

Nove pessoas na landing ainda não têm foto e caem no retrato ilustrado
(`RetratoFicticio`). O Pedro já tem e é o único que não precisa de nada.

Basta largar os arquivos **nesta pasta** com os nomes abaixo. Depois disso é um
commit de duas linhas por foto (um `import` e uma entrada no mapa `FOTOS`), nos
arquivos indicados.

## Especificação

| item      | valor                                                        |
| --------- | ------------------------------------------------------------ |
| proporção | **1:1** (quadrada)                                           |
| tamanho   | **mínimo 224×224** — cobre os 56px do card em telas 2×       |
| formato   | JPG ou WebP. **Sem alfa** — quem recorta é a moldura redonda |
| moldura   | rosto no **terço superior** (`object-position: center top`)  |
| fundo     | qualquer um; o círculo corta antes de ele aparecer           |

Não precisa de recorte com fundo removido: aqui a máscara é circular. Isso é o
oposto do retrato do hero, que é recorte com alfa — não confunda os dois.

## Depoimentos — `_components/social/TestimonialsSection.tsx`

| arquivo                       | pessoa       |
| ----------------------------- | ------------ |
| `depoimento-rafael-nunes.jpg` | Rafael Nunes |
| `depoimento-marina-bueno.jpg` | Marina Bueno |
| `depoimento-diego-farias.jpg` | Diego Farias |

## Perfis do HUB — `_components/hub/HubSection.tsx`

| arquivo                  | pessoa         |
| ------------------------ | -------------- |
| `hub-camila-deodato.jpg` | Camila Deodato |
| `hub-igor-salgado.jpg`   | Igor Salgado   |
| `hub-bianca-rocha.jpg`   | Bianca Rocha   |
| `hub-tarso-menezes.jpg`  | Tarso Menezes  |
| `hub-leila-aoki.jpg`     | Leila Aoki     |
| `hub-wesley-prado.jpg`   | Wesley Prado   |

## Hero e autoridade — já resolvidos

`pedro-sobral-recorte.png` serve os dois. Regra diferente das de cima: **PNG com
alfa**, ~1024×1536, sujeito recortado. Ao reexportá-lo, deixe **40px de folga
transparente em todos os lados** — na versão atual o corpo encosta em `x=1023`, a
última coluna do arquivo, e por isso a figura precisa sangrar para o corte reto não
aparecer no meio da composição.

## O aviso que precisa sobreviver a este arquivo

Estes nove nomes, cidades, prazos e resultados são **inventados** — estão sob
`CONTEUDO_DEMO`, e o `check:conteudo-demo` reprova enquanto a flag estiver ligada.

Pôr um rosto ao lado de um depoimento inventado muda a natureza da coisa: deixa de
ser espaço preenchido e passa a ser **atribuição falsa**, porque a pessoa da foto
passa a "ter dito" aquilo. Vale para foto de banco e vale para rosto gerado por IA —
o problema não é a origem do pixel, é a afirmação que ele faz ao lado de um nome e um
resultado.

O caminho honesto é que as fotos cheguem junto dos depoimentos **reais**, das mesmas
pessoas, com autorização de uso. Enquanto isso não existe, a ilustração é a resposta
correta: preenche a composição sem afirmar ninguém.
