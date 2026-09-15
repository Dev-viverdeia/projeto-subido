# Retomar o quadro de Vendas

## Decisão de design

Preservar o quadro, sem novos painéis, avisos ou copy permanente. O usuário abre uma ficha e
volta ao card que estava trabalhando, com busca, filtro e etapa compacta preservados.

- Paleta existente: branco `#FFFFFF`, superfície `#F7F8FA`, navy `#0A1F3B`, navy profundo
  `#02162A`, tinta secundária `#4F596B`. Usar apenas os tokens correspondentes.
- Geist e a escala atual permanecem. Nenhuma redução de fonte para acomodar controles.
- Composição: cabeçalho → filtros → etapas → cards. Tudo mantém o alinhamento atual.
- O acabamento deste bloco é comportamental: retorno instantâneo, foco previsível, sem animação
  de rolagem ou listener contínuo de scroll.

```text
Quadro filtrado → Ficha do cliente → Voltar para Vendas
       └──────── mesmas escolhas e ponto de leitura ───┘
```

## Limites

Preferências temporárias por conta e aba, com validade de oito horas e limpeza no logout.
Sem banco, cookies novos, consultas por tecla ou dados comerciais na URL. Armazenar somente
busca limitada, enums, ID do card e posição; nunca copiar a lista de clientes para o storage.
Storage bloqueado não pode impedir busca ou navegação. Links diretos continuam funcionando.
Não alterar propostas, oportunidades, créditos nem progresso de contas reais na validação.

## Verificação

Testar voltar pelo link e pelo navegador, recarregar, selecionar etapas, limpar busca,
histórico aberto, card removido/movido, isolamento de contas, armazenamento bloqueado e foco
por teclado. Validar desktop e celular com fixtures locais e confirmar a publicação real
somente depois dos gates existentes.
