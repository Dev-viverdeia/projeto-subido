# Fotos dos mentores

`mentores.foto_url` é uma **coluna do banco**, não import estático — então a imagem
precisa estar num caminho servível por URL. É por isso que estas moram em `public/`
e não em `src/assets/img/`, ao contrário de todas as outras imagens do projeto.

(A regra de `src/assets/` vale para imagem que o código importa: o Next fingerprinta e
serve com cache imutável. Aqui o dono do caminho é o banco, que não sabe de hash.)

## ⚠ OS QUATRO ATUAIS SÃO REUSO — substituir

As fotos que estão aqui hoje são **cópias de retratos do HUB da landing**. Foi uma
escolha de conveniência para a tela não ficar com iniciais, e ela tem um custo que
precisa ser pago antes de mostrar isto a alguém de fora: **a mesma cara aparece em duas
telas do produto com nomes diferentes** — o rosto de `hub-bianca-rocha` é a mentora
Camila Duarte, o de `hub-leila-aoki` é a Renata Alves, e assim por diante.

Escolhi os do HUB e não os dos depoimentos porque no HUB eles são miniaturas de 48px
numa "prévia da interface", e portanto os menos memoráveis dos nove. Continua sendo
duplicação.

Para resolver: gere quatro rostos NOVOS com os prompts abaixo e sobrescreva os
arquivos. Nada mais muda — o banco já aponta para estes caminhos.

## Os quatro arquivos

| arquivo             | mentor        | trilha        |
| ------------------- | ------------- | ------------- |
| `camila-duarte.jpg` | Camila Duarte | implementação |
| `diego-fontes.jpg`  | Diego Fontes  | tráfego       |
| `paulo-andrade.jpg` | Paulo Andrade | produto       |
| `renata-alves.jpg`  | Renata Alves  | comercial     |

Mesma especificação dos retratos da landing (ver `src/assets/img/RETRATOS.md`):
**1:1, mínimo 224×224, JPEG sem alfa, rosto no terço superior.**

## Não reaproveite os nove da landing

Os nove retratos de `src/assets/img/` já estão todos em uso — três nos depoimentos e
seis no HUB. Usar um deles aqui faria a mesma pessoa aparecer como depoente e como
mentor, com nomes diferentes, em duas telas do mesmo produto.

## Prompts

Base igual à de `RETRATOS.md`, somando o traço de cada um:

| arquivo             | acrescentar                                                   |
| ------------------- | ------------------------------------------------------------- |
| `camila-duarte.jpg` | mulher, 30-35 anos, cabelo castanho preso, camisa jeans clara |
| `diego-fontes.jpg`  | homem, 35-40 anos, barba aparada, moletom cinza-escuro        |
| `paulo-andrade.jpg` | homem, 45-50 anos, cabelo grisalho, camisa social azul-clara  |
| `renata-alves.jpg`  | mulher, 40-45 anos, cabelo ruivo escuro liso, blazer marinho  |

## Depois de largar os arquivos

Nenhuma linha de código muda — o `RetratoMentor` já usa `foto_url` quando existe e cai
no campo de luz gerado quando não. Falta só apontar o banco:

```sql
update public.mentores set foto_url = '/mentores/camila-duarte.jpg' where nome = 'Camila Duarte';
update public.mentores set foto_url = '/mentores/diego-fontes.jpg'  where nome = 'Diego Fontes';
update public.mentores set foto_url = '/mentores/paulo-andrade.jpg' where nome = 'Paulo Andrade';
update public.mentores set foto_url = '/mentores/renata-alves.jpg'  where nome = 'Renata Alves';
```

## O que o componente diz sobre isso, e que continua valendo

`RetratoMentor` foi escrito CONTRA foto de banco: rosto de stock apresentado como
mentor é identidade fabricada, e a pessoa que vê acredita que aquele ser humano dá
aquela sessão — exposição de CDC/CONAR, não questão estética. Rosto gerado por IA
resolve a parte da semelhança de alguém real, mas não a de apresentar como mentor
quem não vai dar a sessão. Estes quatro nomes são de demonstração; quando os mentores
forem reais, a foto tem que ser deles, com autorização.
