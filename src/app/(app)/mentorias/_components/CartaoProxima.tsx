'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { Button } from '@/design-system/via';
import type { SessaoMentoria } from '@/lib/mentorias/tipos';
import type { EstadoMentoria } from './estadoMentoria';
import { comecaEm, duracaoMin, horaCurta, rotuloDoDia } from './estadoMentoria';
import { RetratoMentor } from '../../_components/RetratoMentor';
import { TRILHAS } from '@/lib/mentorias/tipos';
import { Visto } from '../../_components/PillEstado';
import styles from './CartaoProxima.module.css';

/**
 * A sessão ao vivo — ou a próxima — permanece visível acima dos controles da
 * agenda. A ficha rotulada evita depender da posição de cada número, e cada
 * estado explica claramente qual ação está disponível.
 */
export function CartaoProxima({
  sessao,
  estado,
  agora,
  gravando,
  aoAbrirDetalhe,
  aoFazerCheckin,
  aoCancelarCheckin,
}: {
  sessao: SessaoMentoria;
  estado: EstadoMentoria;
  agora: Date;
  gravando: boolean;
  aoAbrirDetalhe: () => void;
  aoFazerCheckin: () => void;
  aoCancelarCheckin: () => void;
}) {
  const aoVivo = estado === 'ao-vivo';
  const mentor = sessao.mentor;
  const dia = rotuloDoDia(sessao.inicioIso, agora);
  const contagem = comecaEm(sessao, agora);

  /* AO VIVO, "Quando: Hoje" é informação velha — a sessão está acontecendo.
     O que decide é quando TERMINA e se ainda cabe. */
  const dados = aoVivo
    ? [
        { rotulo: 'Termina', valor: horaCurta(sessao.fimIso) },
        { rotulo: 'Duração', valor: `${duracaoMin(sessao)} min` },
        { rotulo: 'Vagas', valor: `${sessao.inscritos}/${sessao.vagas}` },
      ]
    : [
        { rotulo: 'Quando', valor: dia.principal === 'Hoje' ? 'Hoje' : dia.mono },
        { rotulo: 'Horário', valor: `${horaCurta(sessao.inicioIso)}–${horaCurta(sessao.fimIso)}` },
        { rotulo: 'Duração', valor: `${duracaoMin(sessao)} min` },
        { rotulo: 'Vagas', valor: `${sessao.inscritos}/${sessao.vagas}` },
      ];

  return (
    <article className={styles.cartao} data-ao-vivo={aoVivo ? '' : undefined}>
      <span className={styles.sheen} aria-hidden="true" />
      <div className={styles.conteudo}>
        <div className={styles.principal}>
          <div className={styles.cabeca}>
            <p className={styles.eyebrow}>
              {aoVivo ? (
                <>
                  <span className={styles.pulso} aria-hidden="true" />
                  ao vivo agora
                </>
              ) : (
                <>
                  Próxima mentoria
                  {contagem && <span className={styles.contagem}> · {contagem}</span>}
                </>
              )}
            </p>

            <h2 className={styles.titulo}>{sessao.titulo}</h2>
          </div>

          {mentor && (
            <div className={styles.mentor}>
              {/* Retrato GERADO enquanto não há foto real — abstrato, derivado do
                nome, nunca uma silhueta que finge ser gente. Ver o componente. */}
              <RetratoMentor nome={mentor.nome} fotoUrl={mentor.foto_url} tamanho="lg" />
              <div className={styles.mentorTextos}>
                <p className={styles.mentorTrilha}>{TRILHAS[mentor.trilha].rotulo}</p>
                <p className={styles.mentorNome}>{mentor.nome}</p>
                {mentor.headline && <p className={styles.mentorHeadline}>{mentor.headline}</p>}
              </div>
            </div>
          )}
        </div>

        {/* A COLUNA DA DECISÃO: os quatro dados e a ação, juntos. O cartão era uma
            coluna única alinhada à esquerda com teto de 68ch — sobravam mais de
            mil pixels de vazio à direita numa peça que é o hero da tela. Separar
            o QUE É (título, mentor) do QUANDO/SE VOU (ficha, CTA) preenche o
            cartão com composição em vez de esticar o texto. */}
        <div className={styles.lado}>
          <dl className={styles.ficha}>
            {dados.map((d) => (
              <div key={d.rotulo} className={styles.fichaItem}>
                <dt className={styles.fichaRotulo}>{d.rotulo}</dt>
                <dd className={styles.fichaValor}>{d.valor}</dd>
              </div>
            ))}
          </dl>

          <div className={styles.acoes}>
            {estado === 'checkin-aberto' && (
              <Button variant="primary" disabled={gravando} onClick={aoFazerCheckin}>
                Fazer check-in · {sessao.custoCreditos}{' '}
                {sessao.custoCreditos === 1 ? 'crédito' : 'créditos'}
              </Button>
            )}

            {estado === 'inscrito' && (
              <>
                <span className={styles.confirmado}>
                  <Visto tamanho={12} />
                  Check-in confirmado
                </span>
                <Button
                  variant="destructive"
                  disabled={gravando}
                  iconLeft={<X size={15} strokeWidth={2} aria-hidden="true" />}
                  onClick={aoCancelarCheckin}
                >
                  Cancelar check-in
                </Button>
              </>
            )}

            {aoVivo && (
              <Link
                href={`/mentorias/${sessao.id}`}
                className="via-btn via-btn--primary via-btn--md"
              >
                Entrar na sala
              </Link>
            )}

            {/* Os dois estados que o hero não cobria. Sem CTA de propósito: não há
              ação possível, e um botão desabilitado sem explicação é pior que
              texto que explica. */}
            {estado === 'lotada' && (
              <span className={styles.impedido}>
                Sessão lotada: {sessao.inscritos} de {sessao.vagas} vagas
              </span>
            )}

            {estado === 'fora-da-janela' && (
              <span className={styles.impedido}>Check-in abre {dia.mono}</span>
            )}

            <Button variant="secondary" onClick={aoAbrirDetalhe}>
              Ver detalhes
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
