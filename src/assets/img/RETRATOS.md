# Retratos da landing

As dez pessoas da página têm foto: o Pedro (hero e autoridade) e as nove dos
depoimentos e do HUB. Nenhum retrato ilustrado aparece hoje. Este arquivo registra a
especificação e as decisões, para a próxima troca não recomeçar do zero.

## Os arquivos

| arquivo                        | onde              |
| ------------------------------ | ----------------- |
| `pedro-sobral-recorte.png`     | hero + autoridade |
| `depoimento-rafael-nunes.jpg`  | depoimento        |
| `depoimento-marina-bueno.jpg`  | depoimento        |
| `depoimento-denise-farias.jpg` | depoimento        |
| `hub-camila-deodato.jpg`       | HUB               |
| `hub-igor-salgado.jpg`         | HUB               |
| `hub-bianca-rocha.jpg`         | HUB               |
| `hub-tarso-menezes.jpg`        | HUB               |
| `hub-leila-aoki.jpg`           | HUB               |
| `hub-wesley-prado.jpg`         | HUB               |

A ligação é por NOME, nos mapas `FOTOS` de `TestimonialsSection.tsx` e
`HubSection.tsx`. Trocar a imagem de alguém é sobrescrever o arquivo — nenhuma linha
de código muda. Adicionar pessoa nova exige duas linhas: o `import` e a entrada no
mapa. Sem elas, o card cai no `RetratoFicticio`, que continua no repo justamente como
esse fallback.

## Especificação — cards de pessoa

| item      | valor                                                       |
| --------- | ----------------------------------------------------------- |
| proporção | **1:1** (quadrada)                                          |
| tamanho   | 512×512 é o que está no repo; o mínimo real é 224×224       |
| formato   | JPEG. **Sem alfa** — quem recorta é a moldura redonda       |
| moldura   | rosto no **terço superior** (`object-position: center top`) |
| peso      | ~50 kB cada, 440 kB somadas                                 |

Não precisa de fundo removido: a máscara é circular. Isso é o **oposto** do retrato do
hero — não confunda os dois.

As nove chegaram em PNG 1254×1254, ~2 MB cada (18 MB no total) e foram convertidas
para JPEG 512×512 q82. Sobra resolução de propósito: o maior uso na página é 56px em
tela 2×, ou seja 112px.

## Especificação — retrato do hero

`pedro-sobral-recorte.png`: **PNG com alfa**, ~1024×1536 (razão 0,667), sujeito
recortado. A razão importa — o teto de altura do hero e o enquadramento 3:4 da
autoridade foram calculados sobre ela.

Ao reexportar, deixe **40px de folga transparente nos quatro lados**. Na versão atual
o corpo encosta em `x=1023`, a última coluna do arquivo, e é por isso que a figura
precisa sangrar: o corte reto existe no arquivo, e trazê-lo para dentro da tela o
transforma de sangria em defeito.

## Prompts, para quando precisar refazer

Base:

> Retrato fotográfico quadrado 1:1, 1024×1024. Enquadramento da cabeça aos ombros,
> rosto no terço superior do quadro. Pessoa brasileira, olhando para a câmera,
> expressão natural e cordial, sem sorriso exagerado. Luz suave de estúdio vindo da
> esquerda. Fundo liso e desfocado em tom neutro claro. Aparência de foto real de
> perfil profissional, não render 3D, não ilustração. Sem texto, sem marca d'água.

Depois some o traço de cada pessoa (idade, cabelo, roupa). Variar idade, tom de pele e
traço não é cosmético: seis rostos parecidos numa grade denunciam a origem sintética
mais rápido que qualquer detalhe do desenho.

**Confira o gênero contra a lista antes de gerar.** Na primeira leva vieram cinco
mulheres e quatro homens para quatro vagas femininas e cinco masculinas — faltaram o
careca e o grisalho que o prompt pedia. Em vez de deixar um card no desenho com uma
foto sobrando, o `Diego Farias` do depoimento virou `Denise Farias`; o texto não mudou
além da concordância ("não sou técnica").

## O aviso que precisa sobreviver a este arquivo

Estes nove nomes, cidades, prazos e resultados são **inventados** — vivem sob
`CONTEUDO_DEMO`, e o `check:conteudo-demo` reprova enquanto a flag estiver ligada.

Agora que há rosto ao lado deles, a natureza da coisa mudou: deixou de ser espaço
preenchido e passou a ser **atribuição** — cada card afirma que aquela pessoa disse
aquilo e obteve aquele resultado. O fato de os rostos serem sintéticos evita o
problema de usar a semelhança de alguém real sem autorização, mas não torna o
depoimento verdadeiro.

Antes de desligar a flag: ou os depoimentos viram reais, das mesmas pessoas e com
autorização de imagem, ou a seção muda de nome e diz de onde a prova vem.
