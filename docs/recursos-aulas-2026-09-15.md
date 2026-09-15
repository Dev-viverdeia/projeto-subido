# Recursos das aulas

## Direção

A aula continua protagonista. Recursos aparecem em uma lista curta, sem duas camadas de abertura. Títulos abrem o conteúdo; modelos podem ser copiados ou baixados sem leitura prévia. Conteúdo e progresso educacional permanecem intactos.

Paleta existente, via tokens: branco #FFFFFF (superfície), gelo #F7F8FA (fundo), navy #0A1F3B (texto e seleção), profundo #02162A (ênfase), aço #1E3A5F (apoio). Geist: leitura 17px, controles 15px, apoio 14px. Geist Mono reservado ao texto dos modelos e números.

```text
Aula / exemplo / prática
Recursos desta aula
  [mapa] Título do mapa                [abrir]
  [guia] Título do guia                [abrir] [baixar .txt]
  [doc.] Título do modelo              [copiar] [baixar .txt]
  [check] Título da autoavaliação      [abrir]
    conteúdo completo somente ao abrir
```

O wireframe ilustra os tipos disponíveis, não quatro itens obrigatórios por aula. Sem grade de cards repetidos, números decorativos ou copy promocional. Glass nas superfícies e controles; conteúdo de leitura com fundo estável. Sem animação de altura nem nova dependência.

## Critérios

- Uma ação para ler, copiar ou baixar; destinos externos distintos do conteúdo interno.
- Autoavaliação declarada, sem nota, aprovação automática ou alteração da conclusão da aula.
- Texto original preservado, incluindo orientações e descrições sob demanda.
- Foco real por teclado, estado comunicado além da cor, toque mínimo de 44px, contraste AA.
- Layout sem cortes de 320px a desktop, incluindo equivalente a zoom de 200%; movimento reduzido.
- Testes isolados com conteúdo educacional; nenhuma escrita na conta real.

## Verificação

- 135 testes do módulo de projetos aprovados; typecheck e lint dos arquivos alterados aprovados.
- Identidade, fronteira cliente/servidor e comparação dos 108 arquivos do DS aprovadas. Cache temporário local do DS precisou ser isolado; não houve edição do vendor.
- Revisão visual real no navegador em 320, 390, 768 e 1440px: sem overflow horizontal, controles de pelo menos 44px, leitura principal de 17px. Em telas estreitas, ações passam para a linha seguinte.
- Modelos usam o controle já existente no kit; o mesmo texto completo alimenta leitura, cópia e download `.txt`.
- A suíte de três navegadores passou a cobrir os recursos. Testes de larguras do kit foram separados para não somar quatro navegações no mesmo limite de tempo.
- Antes da publicação: CI completo obrigatório, incluindo build, jornadas existentes e acessibilidade. Testes de navegador não equivalem a validação manual com leitor de tela ou dispositivo físico.
