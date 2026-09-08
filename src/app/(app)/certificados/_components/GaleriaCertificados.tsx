'use client';

import Link from 'next/link';
import { ArrowUpRight, Check, ArrowRight } from 'lucide-react';
import { DocumentoCertificado } from '@/components/certificados/DocumentoCertificado';
import { avaliarCertificado, type EstadoCertificado } from '@/lib/certificados/criterios';
import type { FormacaoResumo, SolucaoResumo } from '@/lib/conteudo/queries';
import { idsAulasProjeto } from '@/lib/projetos/roteiro';
import { useProgresso, type EstadoProgressoConta } from '@/lib/progresso/local';
import styles from './GaleriaCertificados.module.css';

type Origem = 'formacao' | 'solucao';
type Conteudo = {
  origem: Origem;
  slug: string;
  titulo: string;
  href: string;
  estado: EstadoCertificado;
};
const ROTULO_ORIGEM: Record<Origem, string> = { formacao: 'Formação', solucao: 'Projeto' };

/** Conquistas derivam do progresso real. A prévia não emite um registro público. */
export function GaleriaCertificados({
  formacoes,
  solucoes,
  nome = 'Seu nome',
  progressoPreview,
}: {
  formacoes: FormacaoResumo[];
  solucoes: SolucaoResumo[];
  nome?: string;
  progressoPreview?: EstadoProgressoConta;
}) {
  const progressoConta = useProgresso();
  const progresso = progressoPreview ?? progressoConta;

  const conteudos: Conteudo[] = [
    ...formacoes.map((f) => ({
      origem: 'formacao' as const,
      slug: f.slug,
      titulo: f.titulo,
      href: `/formacoes/${f.slug}`,
      estado: avaliarCertificado(
        { aprendizadoIds: f.aulaIds, implementacaoIds: [] },
        { aprendizado: progresso.aulas, implementacao: progresso.etapas },
      ),
    })),
    ...solucoes.map((s) => ({
      origem: 'solucao' as const,
      slug: s.slug,
      titulo: s.titulo,
      href: `/solucoes/${s.slug}`,
      estado: avaliarCertificado(
        {
          aprendizadoIds: s.projeto ? idsAulasProjeto(s.slug, s.projeto.roteiro) : [],
          implementacaoIds: s.etapaIds,
        },
        { aprendizado: progresso.etapas, implementacao: progresso.etapas },
      ),
    })),
  ].filter((c) => c.estado.total > 0);

  const conquistados = conteudos
    .filter((c) => c.estado.concluido)
    .sort((a, b) => (b.estado.concluidoEm ?? '').localeCompare(a.estado.concluidoEm ?? ''));
  const andamento = conteudos
    .filter((c) => c.estado.iniciado && !c.estado.concluido)
    .sort((a, b) => b.estado.percentual - a.estado.percentual);
  const primeiro = conteudos.find((c) => c.origem === 'formacao') ?? conteudos[0];

  return (
    <div className={styles.galeria}>
      {conquistados.length > 0 ? (
        <section aria-labelledby="certificados-conquistados" className={styles.secao}>
          <div className={styles.secaoTopo}>
            <h2 id="certificados-conquistados">Conquistados</h2>
            <span>{conquistados.length}</span>
          </div>
          <ul className={styles.diplomas}>
            {conquistados.map((c) => (
              <li key={`${c.origem}-${c.slug}`} className={styles.card}>
                <div className={styles.previa}>
                  <DocumentoCertificado
                    nome={nome}
                    titulo={c.titulo}
                    origem={c.origem}
                    concluidoEm={c.estado.concluidoEm}
                    compacto
                  />
                </div>
                <div className={styles.cardBase}>
                  <span className={styles.conquista}>
                    <Check size={18} aria-hidden="true" />
                    {ROTULO_ORIGEM[c.origem]} concluíd{c.origem === 'formacao' ? 'a' : 'o'}
                  </span>
                  <Link href={`/certificados/${c.origem}/${c.slug}`} className={styles.abrir}>
                    Ver certificado <ArrowUpRight size={18} aria-hidden="true" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : andamento.length === 0 ? (
        <section className={styles.vazio} aria-labelledby="primeira-conquista">
          <div className={styles.vazioTexto}>
            <p className={styles.rotulo}>Sua primeira conquista</p>
            <h2 id="primeira-conquista">Seu próximo certificado começa aqui.</h2>
            <p>
              Conclua uma formação ou um projeto e tenha sua conquista pronta para compartilhar.
            </p>
            <Link className={styles.abrir} href={primeiro?.href ?? '/formacoes'}>
              {primeiro?.origem === 'solucao' ? 'Abrir projeto' : 'Começar formação'}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <div className={styles.modelo}>
            <DocumentoCertificado
              nome="Seu nome aqui"
              titulo="Sua próxima conquista"
              origem="formacao"
              compacto
              modelo
            />
          </div>
        </section>
      ) : null}

      {andamento.length > 0 && (
        <section aria-labelledby="certificados-andamento" className={styles.secao}>
          <div className={styles.secaoTopo}>
            <h2 id="certificados-andamento">Em andamento</h2>
            <span>{andamento.length}</span>
          </div>
          <ul className={styles.lista}>
            {andamento.map((c) => {
              const proximaAcao =
                c.origem === 'formacao'
                  ? 'Continuar formação'
                  : c.estado.aprendizado.concluido
                    ? 'Continuar implementação'
                    : 'Concluir aulas';
              return (
                <li key={`${c.origem}-${c.slug}`}>
                  <Link href={c.href} className={styles.linha}>
                    <span className={styles.rotulo}>{ROTULO_ORIGEM[c.origem]}</span>
                    <h3>{c.titulo}</h3>
                    <div className={styles.criterios}>
                      <span>
                        Aulas {c.estado.aprendizado.feitas}/{c.estado.aprendizado.total}
                      </span>
                      {c.estado.implementacao.total > 0 ? (
                        <span>
                          Implementação {c.estado.implementacao.feitas}/
                          {c.estado.implementacao.total}
                        </span>
                      ) : null}
                    </div>
                    <div className={styles.progresso}>
                      <span
                        className={styles.trilho}
                        role="progressbar"
                        aria-valuenow={c.estado.percentual}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Conclusão de ${c.titulo}`}
                      >
                        <span style={{ width: `${c.estado.percentual}%` }} />
                      </span>
                      <span>{c.estado.percentual}%</span>
                    </div>
                    <span className={styles.continuar}>
                      {proximaAcao}
                      <ArrowRight size={18} aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <nav className={styles.explorar} aria-label="Mais aprendizado">
        <Link href="/formacoes">
          Explorar formações <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <Link href="/solucoes">
          Explorar projetos <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </nav>
    </div>
  );
}
