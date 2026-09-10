# Sobral AI — retomada de texto

## Experiência

- Ao voltar ao chat, a pessoa escolhe **Retomar**. Nada é enviado automaticamente.
- Texto em edição fica separado por conta e conversa, disponível neste navegador por sete dias.
- Duas abas mantêm seus próprios rascunhos; recuperar um texto não sobrescreve a edição da outra.
- Um envio sem confirmação preserva o recibo original e retorna à conferência. Não vira uma pergunta nova.
- Arquivos e gravações não são armazenados; apenas o texto e o aviso para anexar novamente.
- Encerrar sessão apaga os rascunhos deste navegador. Registros expirados são ignorados e limpos na próxima gravação da conta.
- Quando o navegador não permite salvar, o aviso orienta manter a aba aberta.

## Limites e privacidade

Armazenamento local, não sincronizado entre aparelhos nem criptografado. A separação por conta protege a experiência de troca de usuário, mas não é um cofre contra acesso físico ao navegador. São aceitos somente texto e campos permitidos do recibo, sem tokens ou conteúdo de arquivos. Até 50 rascunhos por conta; atingir o limite não apaga uma edição ativa.

## Evidências locais

- Testes unitários de validade, prazo, conta, recibos, concorrência entre abas, logout e quota.
- Testes de componente para retomada explícita, contexto inicial, remoção após confirmação e troca de conta.
- 72 cenários Playwright aprovados entre desktop e WebKit móvel: rascunhos, envio, anexos/áudio, ajuda e recuperação de rede.
- Revisão visual a 320 px: Retomar, Descartar e Enviar dentro da tela e do compositor; sugestões secundárias recolhidas durante a retomada.
- Verificação automatizada de acessibilidade AA do aviso e controles.

## Validação de produção

- 1.266 testes unitários aprovados; 12 casos previamente desabilitados permanecem assim.
- Typecheck, lint, formatação, integridade do DS, identidade e fronteira client/server aprovados.
- Build de produção concluído; quatro avisos preexistentes de AVIF do Turbopack na landing, sem relação com esta mudança.
- Build local autenticado contra o banco: rascunho recuperado após reload; perdas antes e depois do salvamento retomadas com o mesmo recibo. Uma mensagem por caso, proprietário correto e zero gerações de IA. Conta sintética e suas conversas removidas após o teste; nenhuma conta real alterada.

Publicação: CI e conferência do domínio público obrigatórios após o merge.
