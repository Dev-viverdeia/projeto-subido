'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, CheckCircle2, Coins, History, Layers3, SearchX } from 'lucide-react';
import { Button } from '@/design-system/via';
import type { EstadoAdminAcesso } from '@/lib/admin/actions';
import type { ContaAdministrada, EventoAcessoAdmin } from '@/lib/admin/acessos';
import { PACOTES_CREDITOS, PLANOS_SUBIDO, type PlanoSubido } from '@/lib/planos/acessos';
import { ModalOperacao } from '../../_components/ModalOperacao';
import { ConfirmarPacote, ConfirmarPlano } from './ConfirmacoesAcesso';
import styles from './PainelContas.module.css';

function dataCurta(valor: string | null): string {
  if (!valor) return 'Ainda não entrou';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(valor));
}

function nomeConta(conta: ContaAdministrada): string {
  return conta.nome || conta.email?.split('@')[0] || 'Conta sem nome';
}

function rotuloPlano(plano: PlanoSubido): string {
  return PLANOS_SUBIDO[plano].nome;
}

export function PainelContas({
  contas,
  eventos,
  busca,
}: {
  contas: ContaAdministrada[];
  eventos: EventoAcessoAdmin[];
  busca: string;
}) {
  const router = useRouter();
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);
  const [ajustesLocais, setAjustesLocais] = useState<
    Record<string, Partial<Pick<ContaAdministrada, 'plano' | 'saldo'>>>
  >({});
  const [fluxo, setFluxo] = useState<
    | { tipo: 'detalhes' }
    | { tipo: 'plano'; plano: PlanoSubido }
    | { tipo: 'pacote'; pacote: (typeof PACOTES_CREDITOS)[number]['id'] }
    | { tipo: 'sucesso'; mensagem: string }
  >({ tipo: 'detalhes' });

  const contasAtuais = useMemo(
    () =>
      contas.map((conta) => ({
        ...conta,
        ...ajustesLocais[conta.id],
      })),
    [contas, ajustesLocais],
  );
  const conta = contasAtuais.find((item) => item.id === selecionadaId) ?? null;
  const historico = eventos.filter((evento) => evento.usuarioId === selecionadaId).slice(0, 8);

  const abrir = (id: string) => {
    setSelecionadaId(id);
    setFluxo({ tipo: 'detalhes' });
  };
  const fechar = () => {
    setSelecionadaId(null);
    setFluxo({ tipo: 'detalhes' });
  };
  const concluir = (estado: EstadoAdminAcesso) => {
    if (!conta) return;
    setAjustesLocais((atual) => ({
      ...atual,
      [conta.id]: {
        ...atual[conta.id],
        ...(estado.plano ? { plano: estado.plano } : {}),
        ...(typeof estado.saldo === 'number' ? { saldo: estado.saldo } : {}),
      },
    }));
    setFluxo({ tipo: 'sucesso', mensagem: estado.mensagem || 'Alteração concluída.' });
    router.refresh();
  };

  if (contas.length === 0) {
    return (
      <section className={styles.vazio} aria-live="polite">
        <SearchX size={28} strokeWidth={1.5} aria-hidden="true" />
        <h2>{busca ? 'Nenhuma conta encontrada.' : 'Ainda não há contas cadastradas.'}</h2>
        <p>
          {busca
            ? 'Confira o nome ou e-mail e faça uma nova busca.'
            : 'As contas aparecerão aqui assim que forem criadas.'}
        </p>
      </section>
    );
  }

  return (
    <>
      <section className={styles.lista} aria-labelledby="titulo-lista-contas">
        <header>
          <div>
            <p className={styles.sobretitulo}>Contas encontradas</p>
            <h2 id="titulo-lista-contas">Contas</h2>
          </div>
          <span>{contasAtuais.length} nesta página</span>
        </header>

        <div className={styles.cabecalhoTabela} aria-hidden="true">
          <span>Conta</span>
          <span>Plano</span>
          <span>Créditos</span>
          <span>Último acesso</span>
          <span>Ação</span>
        </div>

        <div className={styles.linhas}>
          {contasAtuais.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.linha}
              onClick={() => abrir(item.id)}
            >
              <span className={styles.identidade}>
                <span className={styles.avatar} aria-hidden="true">
                  {(nomeConta(item)[0] || 'U').toUpperCase()}
                </span>
                <span>
                  <strong>{nomeConta(item)}</strong>
                  <small>{item.email || 'Conta sem e-mail'}</small>
                </span>
              </span>
              <span className={styles.plano} data-plano={item.plano}>
                {rotuloPlano(item.plano)}
              </span>
              <span className={styles.saldo}>
                <Coins size={15} strokeWidth={1.8} aria-hidden="true" /> {item.saldo}
              </span>
              <span className={styles.data}>{dataCurta(item.ultimoAcessoEm)}</span>
              <span className={styles.acaoLinha}>
                Administrar
                <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      </section>

      <ModalOperacao
        open={Boolean(conta)}
        onClose={fechar}
        title={conta ? nomeConta(conta) : 'Detalhes da conta'}
        description={conta?.email || 'Conta sem e-mail'}
        size="lg"
        hideClose={fluxo.tipo === 'plano' || fluxo.tipo === 'pacote'}
      >
        {conta && fluxo.tipo === 'detalhes' && (
          <div className={styles.detalhes}>
            <div className={styles.faixaConta}>
              <div>
                <span>Plano atual</span>
                <strong>{rotuloPlano(conta.plano)}</strong>
              </div>
              <div>
                <span>Créditos disponíveis</span>
                <strong>{conta.saldo}</strong>
              </div>
              <div>
                <span>Conta criada</span>
                <strong>{dataCurta(conta.criadaEm)}</strong>
              </div>
            </div>

            <section className={styles.blocoAcao} aria-labelledby="titulo-plano-conta">
              <div className={styles.tituloBloco}>
                <span aria-hidden="true">
                  <Layers3 size={18} strokeWidth={1.7} />
                </span>
                <div>
                  <p>Acesso</p>
                  <h3 id="titulo-plano-conta">Escolha o plano da conta</h3>
                </div>
              </div>
              <div className={styles.opcoesPlano}>
                {(['starter', 'pro', 'enterprise'] as const).map((plano) => (
                  <button
                    key={plano}
                    type="button"
                    data-ativo={conta.plano === plano || undefined}
                    disabled={conta.plano === plano}
                    onClick={() => setFluxo({ tipo: 'plano', plano })}
                  >
                    <span>
                      <strong>{rotuloPlano(plano)}</strong>
                      <small>
                        {plano === 'starter'
                          ? 'Aprendizado, projetos e reuniões'
                          : plano === 'pro'
                            ? 'Inclui toda a operação comercial'
                            : 'Inclui operação e gestão de equipe'}
                      </small>
                    </span>
                    {conta.plano === plano ? (
                      <Check size={17} strokeWidth={2.2} aria-label="Plano atual" />
                    ) : (
                      <ArrowRight size={17} strokeWidth={1.8} aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
            </section>

            <section className={styles.blocoAcao} aria-labelledby="titulo-creditos-conta">
              <div className={styles.tituloBloco}>
                <span aria-hidden="true">
                  <Coins size={18} strokeWidth={1.7} />
                </span>
                <div>
                  <p>Saldo universal</p>
                  <h3 id="titulo-creditos-conta">Adicionar um pacote de créditos</h3>
                </div>
              </div>
              <div className={styles.pacotes}>
                {PACOTES_CREDITOS.map((pacote) => (
                  <button
                    key={pacote.id}
                    type="button"
                    onClick={() => setFluxo({ tipo: 'pacote', pacote: pacote.id })}
                  >
                    <small>{pacote.nome}</small>
                    <strong>+{pacote.creditos}</strong>
                    <span>créditos</span>
                  </button>
                ))}
              </div>
            </section>

            <section className={styles.historico} aria-labelledby="titulo-historico-conta">
              <div className={styles.tituloBloco}>
                <span aria-hidden="true">
                  <History size={18} strokeWidth={1.7} />
                </span>
                <div>
                  <p>Rastreabilidade</p>
                  <h3 id="titulo-historico-conta">Últimas alterações</h3>
                </div>
              </div>
              {historico.length > 0 ? (
                <ul>
                  {historico.map((evento) => (
                    <li key={evento.id}>
                      <span aria-hidden="true">
                        {evento.tipo === 'plano_alterado' ? (
                          <Layers3 size={15} />
                        ) : (
                          <Coins size={15} />
                        )}
                      </span>
                      <div>
                        <strong>
                          {evento.tipo === 'plano_alterado'
                            ? `Plano alterado para ${rotuloPlano(evento.planoNovo ?? 'pro')}`
                            : `${evento.creditos} créditos adicionados`}
                        </strong>
                        <small>{dataCurta(evento.criadoEm)}</small>
                      </div>
                      {evento.saldoApos !== null && <em>Saldo {evento.saldoApos}</em>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.semHistorico}>Nenhuma alteração administrativa nesta conta.</p>
              )}
            </section>
          </div>
        )}

        {conta && fluxo.tipo === 'plano' && (
          <ConfirmarPlano
            conta={conta}
            plano={fluxo.plano}
            onCancelar={() => setFluxo({ tipo: 'detalhes' })}
            onConcluir={concluir}
          />
        )}

        {conta && fluxo.tipo === 'pacote' && (
          <ConfirmarPacote
            conta={conta}
            pacoteId={fluxo.pacote}
            onCancelar={() => setFluxo({ tipo: 'detalhes' })}
            onConcluir={concluir}
          />
        )}

        {fluxo.tipo === 'sucesso' && (
          <div className={styles.sucesso} role="status">
            <span aria-hidden="true">
              <CheckCircle2 size={28} strokeWidth={1.7} />
            </span>
            <p>Alteração concluída</p>
            <h3>{fluxo.mensagem}</h3>
            <span>A conta e o histórico já foram atualizados.</span>
            <Button type="button" onClick={() => setFluxo({ tipo: 'detalhes' })}>
              Voltar para a conta
            </Button>
          </div>
        )}
      </ModalOperacao>
    </>
  );
}
