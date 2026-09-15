# Contatos na ficha do cliente

## Plano visual

O profissional precisa abordar o cliente sem procurar uma aba de enriquecimento.
Telefone e e-mail têm prioridade; canais alternativos e pessoas ficam recolhidos.
As ações de reunião e proposta continuam disponíveis, independentemente da pesquisa.

- Paleta existente: branco #FFFFFF, superfície #F7F8FA, navy #0A1F3B,
  navy profundo #02162A e azul #1E3A5F. Apenas tokens do DS no CSS.
- Geist: valores 16px, suporte 14px, título 20px. Sem rótulos decorativos em caixa alta.
- Superfície de vidro clara, hairline e sombra navy, sem círculos de fundo.
- Linha alinhada à esquerda, ações à direita; no celular ações em linha própria.

```text
Contatos                         Site da empresa
[Telefone] valor                 Copiar / WhatsApp / Ligar
[E-mail]   valor                 Copiar / Escrever
Outros canais ▾     Pessoas envolvidas ▾
```

Revisão contra o pedido: não criar outro painel com contagens, nem repetir os
contatos em Dados e fontes. Uma seção única antes das etapas da venda, também
sem enriquecimento. As fontes são informadas por contato, não pelo provedor global.

## Integridade

- Contato atual da ficha + Prospecção vinculada + pesquisa já salva.
- Leitura com sessão/RLS, sem cobrança, mutação ou API externa adicional.
- Formato não comprova titularidade nem disponibilidade no WhatsApp.
- Números do extrator antigo sem evidência não reaparecem via cópia no CRM.
- Fontes ausentes continuam identificadas como ausentes, sem atribuição inventada.
- Cadastro de uma pessoa não a torna um decisor confirmado.
- Canais de pessoas importadas são preservados com o nome associado; não viram o
  telefone geral da empresa. O cadastro atual prevalece sobre pesquisas antigas.

## Verificação

- Typecheck, lint, identidade de 259 folhas de estilo e fronteira client/server aprovados.
- Suíte unitária: 1.920 testes passaram, 34 já estavam pulados. Mais quatro testes
  da nova integração de leitura passaram em execução separada.
- Prospecção → ficha → retorno e contatos: 46 testes passaram em Chromium,
  WebKit mobile e Firefox; dois casos de viewport são exclusivos de Chromium.
- Conferência visual manual em 1280px e 390px: ações legíveis, sem corte de texto
  ou scroll horizontal, detalhes recolhidos e contraste dentro do DS.
- Links têm `tabIndex=0` explícito: o WebKit mobile omitia links na navegação Tab
  padrão. A regressão foi reproduzida e corrigida sem remover a asserção de foco.
- Leitura adicional limitada a uma Prospecção vinculada, após acesso à oportunidade
  pela sessão. O índice parcial `prospeccao_leads_crm_fk_idx` já existe na migração
  de 17/08; não há mudança de schema nem de permissão.
- Nenhuma mensagem, ligação ou cobrança foi efetuada durante os testes.

O enriquecimento continua sendo uma ação separada e explícita. Este bloco organiza
dados existentes; não confirma titularidade, vínculo decisório ou WhatsApp ativo.
