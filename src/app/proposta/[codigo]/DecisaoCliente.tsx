'use client';

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { ArrowUpRight, Check, LoaderCircle, X } from 'lucide-react';
import { decidirPropostaCliente, type EstadoDecisaoProposta } from '@/lib/propostas/portal-actions';
import { formatarReais } from '@/lib/propostas/schema';
import styles from './proposta.module.css';

const INICIAL: EstadoDecisaoProposta = {};

function AcoesDecisao({ pending, decisaoPendente }: { pending: boolean; decisaoPendente: string }) {
  return (
    <div className={styles.acoesDecisao}>
      <button
        className={styles.botaoPrimario}
        type="submit"
        name="decisao"
        value="aceita"
        disabled={pending}
      >
        {pending && decisaoPendente === 'aceita' ? (
          <LoaderCircle size={18} className={styles.carregando} aria-hidden="true" />
        ) : (
          <Check size={18} aria-hidden="true" />
        )}
        {pending && decisaoPendente === 'aceita' ? 'Aprovando…' : 'Aprovar proposta'}
      </button>
      <button
        type="submit"
        name="decisao"
        value="recusada"
        disabled={pending}
        className={styles.botaoSecundario}
      >
        {pending && decisaoPendente === 'recusada' ? 'Registrando…' : 'Não aprovar proposta'}
      </button>
    </div>
  );
}

export function DecisaoCliente({
  codigo,
  nomeInicial,
  emailInicial,
  linkPagamento,
  valorCentavos,
  submitAction = decidirPropostaCliente,
}: {
  codigo: string;
  nomeInicial: string;
  emailInicial: string;
  linkPagamento: string | null;
  valorCentavos: number | null;
  submitAction?: typeof decidirPropostaCliente;
}) {
  // React limpa inputs não controlados mesmo quando a ação retorna um erro.
  // A decisão permanece preenchida para corrigir ou repetir o envio com segurança.
  const [nome, setNome] = useState(nomeInicial);
  const [email, setEmail] = useState(emailInicial);
  const [comentario, setComentario] = useState('');
  const [aceite, setAceite] = useState(false);
  const [decisaoPendente, setDecisaoPendente] = useState('');
  const travaEnvio = useRef(false);
  const erroRef = useRef<HTMLParagraphElement>(null);
  const [estado, acao, pendente] = useActionState(
    async (anterior: EstadoDecisaoProposta, dados: FormData) => {
      try {
        return await submitAction(anterior, dados);
      } catch {
        return {
          erro: 'Não foi possível confirmar sua decisão. Seus dados continuam aqui. Tente novamente.',
        };
      } finally {
        travaEnvio.current = false;
      }
    },
    INICIAL,
  );

  useEffect(() => {
    if (estado.erro) erroRef.current?.focus();
  }, [estado]);

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (travaEnvio.current) return;
    const botao = (evento.nativeEvent as SubmitEvent).submitter;
    if (!(botao instanceof HTMLButtonElement) || botao.name !== 'decisao') return;
    const dados = new FormData(evento.currentTarget);
    dados.set('decisao', botao.value);
    travaEnvio.current = true;
    setDecisaoPendente(botao.value);
    startTransition(() => acao(dados));
  }

  if (estado.sucesso) {
    return (
      <div className={styles.decisaoConcluida} data-status={estado.status} role="status">
        <span className={styles.iconeEstado}>
          {estado.status === 'aceita' ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
        </span>
        <div>
          <h2>{estado.status === 'aceita' ? 'Proposta aprovada' : 'Proposta não aprovada'}</h2>
          <p>{estado.sucesso}</p>
          {estado.status === 'aceita' && linkPagamento && (
            <div className={styles.proximoPagamento}>
              <a
                className={styles.botaoPrimario}
                href={linkPagamento}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir pagamento
                <ArrowUpRight size={18} aria-hidden="true" />
              </a>
              <span>
                Você será levado ao checkout do prestador. A Subido não processa este pagamento.
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <form
      action={acao}
      onSubmit={enviar}
      className={styles.formDecisao}
      aria-label="Responder à proposta"
      aria-busy={pendente}
    >
      <input type="hidden" name="codigo" value={codigo} />
      <div className={styles.formTopo}>
        <div>
          <h2>Sua decisão</h2>
          <p>Confira a proposta e registre seu retorno para o responsável.</p>
        </div>
        <div className={styles.revisaoValor}>
          <strong>{formatarReais(valorCentavos)}</strong>
          <a href="#investimento">
            Rever condições
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </div>
      </div>
      <div className={styles.camposDecisao}>
        <label>
          <span>Seu nome</span>
          <input
            name="nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            readOnly={pendente}
            minLength={2}
            maxLength={120}
            autoComplete="name"
            required
          />
        </label>
        <label>
          <span>Seu e-mail</span>
          <input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={pendente}
            maxLength={254}
            autoComplete="email"
            required
          />
        </label>
        <label className={styles.comentario}>
          <span>
            Comentário <small>opcional</small>
          </span>
          <textarea
            name="comentario"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            readOnly={pendente}
            rows={3}
            maxLength={2000}
            placeholder="Deixe uma observação para o responsável."
          />
        </label>
      </div>
      <label className={styles.aceiteTermos}>
        <input
          type="checkbox"
          name="aceiteTermos"
          value="sim"
          checked={aceite}
          onChange={(e) => setAceite(e.target.checked)}
          disabled={pendente}
        />
        <span>
          Li esta versão da proposta e concordo com o escopo, o investimento, as condições e os
          próximos passos apresentados.<small>Obrigatório para aprovar.</small>
        </span>
      </label>
      {estado.erro && (
        <p ref={erroRef} tabIndex={-1} className={styles.erroDecisao} role="alert">
          {estado.erro}
        </p>
      )}
      <AcoesDecisao pending={pendente} decisaoPendente={decisaoPendente} />
      <small className={styles.segurancaDecisao}>
        Ao enviar, sua decisão fica registrada nesta versão com nome, e-mail, data e aceite.
      </small>
    </form>
  );
}
