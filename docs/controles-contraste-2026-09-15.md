# Controles: contraste e resposta ao toque

## Direção

Preservar o layout e reduzir instabilidade na interação. Não adicionar textos, cards ou dependências. A seleção precisa ficar clara no primeiro quadro; o movimento acompanha elevação e pressão, nunca a inversão entre texto claro e fundo escuro.

Paleta existente, via tokens: branco #FFFFFF (superfície), gelo #F7F8FA (canvas), navy #0A1F3B (seleção), profundo #02162A (ênfase), aço #1E3A5F (apoio). Geist: leitura 17px, controles 15px; Mono apenas para dados. Abas mantêm a mesma posição e a mesma hierarquia. Glass nas molduras, leitura em superfície estável.

## Evidência e correção

- A execução CI 34925162987 registrou contraste 2.33:1 no botão “Como fechar”: texto #4F596B sobre fundo #0A1F3B durante a mudança de estado. O retry passou; o estado final não explicava a falha.
- Roteiro, abas de Projetos, kit operacional e conclusão das aulas usavam transição de fundo e/ou texto em inversões navy/branco. Agora essas cores mudam atomicamente nos dois sentidos. Sombra e pressão podem continuar animadas.
- Hover dos controles ajustados fica restrito a ponteiro preciso que suporta hover; seleção e ações continuam disponíveis ao toque. `touch-action: manipulation` preserva pan e pinch zoom, sem `preventDefault` ou bloqueio da rolagem.
- O botão de cópia reserva o espaço do rótulo “Copiando” e comunica `aria-busy`, mantendo leitura e download disponíveis durante a espera.
- O vendor permanece intacto. Mudanças locais, sem override global de animações, sem alterar progresso, APIs, créditos ou reuniões.

## Validação

A nova suíte bloqueia transições cromáticas inseguras e reaproveita a amostragem de 21 pontos das animações. Cobre seleção, desseleção, toque no WebKit emulado, foco real por teclado, movimento reduzido e larguras de 320 a 1440px. Cenários rodam em previews isolados, sem gravar dados reais.

Revisão manual de interface no navegador em 390px confirmou controles do roteiro com 48px e cores finais coerentes. O timeout intermitente do WebKit ao abrir um recurso de aula não foi reproduzido nessa revisão: não há evidência suficiente para atribuí-lo a uma causa de produção. Não foram aumentados timeouts ou retries neste bloco.

Publicação depende de todos os gates de CI aprovados. Teste emulado não substitui dispositivo físico nem auditoria manual com leitor de tela.
