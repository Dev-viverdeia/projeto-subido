# Editar empresa na ficha

## Direção visual

Reutilizar o formulário de contato: branco #FFFFFF, fundo frio #F7F8FA,
navy #0A1F3B, navy profundo #02162A e azul de apoio #1E3A5F.
Geist para título, rótulos e campos (16 px); sem novas fontes ou tokens.
Alinhamento à esquerda, dois campos e um único botão primário.

```text
Ficha do cliente                       Editar empresa
Nome da empresa

             Empresa                             ×
             Nome [___________________________]
             Site [___________________________]
                    Cancelar   Salvar alterações
```

Revisão do conceito: o atalho fica junto à identidade, sem competir com
agendar reunião ou criar proposta. Modal em portal, superfície liquidglass
existente, foco visível, botões de 44 px e rodapé acessível no celular.
Não acrescentar um painel de configuração ou explicações longas à ficha.

## Contrato do bloco

- Editar nome e site sem gastar créditos ou executar IA.
- Usar a mesma empresa nas fichas vinculadas; preservar contatos, propostas e convites.
- Autorização por sessão/plano/dono e revisão otimista no banco.
- Site manual prevalece sobre snapshots anteriores, inclusive ao remover o site.
- Manter pesquisas anteriores, identificando quando antecedem a edição cadastral.
- Testar erros, concorrência, teclado, desktop e celular antes de publicar.

## Validação local

1.972 testes unitários aprovados (34 já ignorados no projeto), 18 testes de
interface da empresa e do contato em desktop e WebKit mobile, 14 testes Deno
de enriquecimento e contratos reais em PostgreSQL descartável. Conferência
visual em 1280 × 720 e 390 × 844; contraste, foco, campos de 16 px e rodapé
acessível. A medição do alvo de toque espera a transição de abertura terminar.
Typecheck, lint, tokens e fronteira client/server aprovados.
