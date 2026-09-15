# Curadoria dos contatos e modal da empresa

## Plano de experiência

O modal serve para escolher como abordar a empresa e levá-la a Vendas. Não é um inventário de tudo que um crawler encontrou.

Paleta preservada: branco #FFFFFF, superfície #F7F8FA, navy #0A1F3B, navy profundo #02162A, azul #1E3A5F e texto #4F596B. Geist para leitura; metadados com no mínimo 13–14 px; contatos em 16–18 px. Usar os tokens existentes, sem editar o vendor.

```text
Empresa                                      Fechar
Categoria · cidade
--------------------------------------------------
Contatos da empresa          Sobre a empresa
Telefone principal           Site e Google Maps
E-mail                       Horários (expandir)
Perfil social
Outros contatos (expandir)
Projeto para explorar (expandir)
Possíveis decisores (expandir)
--------------------------------------------------
Dados públicos               Criar oportunidade
```

Desktop: leitura à esquerda, referências à direita. Celular: uma coluna, ação de Vendas no rodapé. Um único corpo rolável, sem scroll dentro da lista de contatos. Canais adicionais só ocupam espaço quando solicitados. Área de toque mínima de 44 px e foco visível.

Revisão do plano: remover o percentual de completude do modal, que não mede a validade dos contatos. Não adicionar placares de confiança ou selos de verificação. Uma fonte conhecida é atribuída apenas ao contato correspondente; origem desconhecida fica explícita. A disponibilidade no WhatsApp e a titularidade não são verificadas por formato.

## Curadoria

- Normalização compartilhada entre coleta e exibição; deduplicar número nacional e +55, preservando DDD 55, fixos, celulares e códigos de atendimento.
- Coleta textual não pode recortar números dentro de URLs, identificadores, documentos ou sequências maiores. Priorizar links tel/WhatsApp e formatos explícitos.
- E-mails normalizados e deduplicados, sem links executáveis ou parâmetros de cabeçalho.
- Não apagar nem reescrever dados existentes. A leitura aplica as regras também a registros antigos; as próximas coletas passam pela validação.
- Sem consultas pagas, novas dependências, mudança de créditos ou schema.

Referência de formato: [Plano de numeração da Anatel](https://www.gov.br/anatel/pt-br/regulado/numeracao/plano-de-numeracao-brasileiro) e [perguntas de numeração](https://www.gov.br/anatel/pt-br/regulado/numeracao/perguntas-frequentes). Formato válido não comprova linha ativa ou vínculo com a empresa.

## Validação

Testar duplicidades, DDD 55, 0800, internacional explícito, números inválidos, documentos/URLs, host falso de WhatsApp, e-mails, fontes ausentes e dados legados. Conferir 320 px, desktop, zoom/altura reduzida, teclado, contraste, movimento reduzido, expansão e rodapé. Preservar a navegação lista → ficha → lista. Publicar somente após os gates completos e verificar o domínio oficial sem criar registros nem consumir créditos.

### Evidências locais

- 83 testes focados passaram (4 cenários existentes de integração dependem de configuração e permanecem separados).
- 43 verificações de interface passaram em Chromium, WebKit e Firefox. A geometria adicional de 320 × 568, 900 × 500 e 1280 × 720 roda uma vez no Chromium; os demais fluxos cobrem os três motores.
- Axe sem violações nos critérios testados de contraste/acessibilidade do modal, com contatos adicionais abertos.
- Rodapé visível, texto longo sem transbordar, uma única área rolável e retorno lista → ficha → lista preservado.
- Inspeção visual manual em desktop e celular. Corrigida a navegação por Tab nos contatos expandidos do Safari.
- Vendor do design system preservado: 108 arquivos idênticos ao pin original.

Limites: a validação não confirma titularidade, linha ativa ou WhatsApp. Contatos legados sem evidência por campo mostram “Fonte não informada”. Nenhum dado de cliente foi regravado e nenhum serviço pago foi acionado para os testes.

### Ajuste após conferência pública

A lista real expôs uma lacuna que não aparecia apenas nos testes de formato: o extrator antigo havia recortado IDs em sequências que coincidiam com DDD e tamanho válidos. Telefones identificados em `site_contatos` de coletas antigas ficam fora dos canais acionáveis até nova coleta, exceto quando também têm evidência específica do Maps. Um aviso curto explica a omissão; não há exclusão ou regravação do cadastro. A coleta atual registra `versao_telefones: 2`, sem sugerir linha ativa ou titularidade. Incluído um caso de regressão na prévia, testes de unidade e nos três navegadores.
