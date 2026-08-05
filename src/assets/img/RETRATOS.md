# Retratos da landing

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

## Prompts prontos, um por pessoa

O retrato do Pedro que está no repo foi gerado por IA, então a mesma ferramenta
resolve estes nove. **Gerar rosto de pessoa que não existe é preferível a usar banco
de imagem**: foto de banco traz a semelhança de uma pessoa REAL, que nunca autorizou
aparecer como cliente — e a licença do Unsplash e da Pexels não cobre uso que sugira
endosso, justamente por isso.

Base para todos (cole antes do trecho de cada pessoa):

> Retrato fotográfico quadrado 1:1, 1024×1024. Enquadramento da cabeça aos ombros,
> rosto no terço superior do quadro. Pessoa brasileira, olhando para a câmera,
> expressão natural e cordial, sem sorriso exagerado. Luz suave de estúdio vindo da
> esquerda. Fundo liso e desfocado em tom neutro claro. Aparência de foto real de
> perfil profissional, não render 3D, não ilustração. Sem texto, sem marca d'água.

| arquivo                       | trecho a acrescentar                                       |
| ----------------------------- | ---------------------------------------------------------- |
| `depoimento-rafael-nunes.jpg` | homem, 30-35 anos, barba curta, camiseta escura lisa       |
| `depoimento-marina-bueno.jpg` | mulher, 35-40 anos, cabelo liso na altura do ombro, blazer |
| `depoimento-diego-farias.jpg` | homem, 45-50 anos, cabelo grisalho curto, camisa polo      |
| `hub-camila-deodato.jpg`      | mulher, 28-32 anos, cabelo cacheado preso, camisa clara    |
| `hub-igor-salgado.jpg`        | homem, 25-30 anos, cabelo curto, óculos, camiseta cinza    |
| `hub-bianca-rocha.jpg`        | mulher, 30-35 anos, cabelo loiro escuro liso, tricô claro  |
| `hub-tarso-menezes.jpg`       | homem, 40-45 anos, careca, barba cheia, camisa azul        |
| `hub-leila-aoki.jpg`          | mulher, 25-30 anos, traços asiáticos, cabelo preto liso    |
| `hub-wesley-prado.jpg`        | homem, 35-40 anos, pele negra, cabelo curto, camisa branca |

Variar idade, tom de pele e traço não é cosmético: seis rostos parecidos numa grade
denunciam a origem sintética mais rápido do que qualquer detalhe do desenho.

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
