'use client';

import Link from 'next/link';
import { Printer } from 'lucide-react';
import {
  contarConcluidas,
  contarEtapasFeitas,
  estadoDoProgresso,
  percentual,
  useProgresso,
} from '@/lib/progresso/local';
import { BotaoVoltar } from '../../_components/BotaoVoltar';
import { Visto } from '../../_components/PillEstado';
import { dataCurta } from '../../builder/_components/statusBuilder';
import styles from './CertificadoVista.module.css';

/**
 * A FOLHA do certificado + as ações em volta dela.
 *
 * A folha é papel: superfície CLARA em proporção A4 paisagem, moldura dupla de
 * hairline navy, tinta navy e mono para os dados — imprime bonito e sem
 * desperdício (fundo navy em impressora é tanque de tinta; navegador costuma
 * descartar fundos de qualquer jeito). O navy fica na moldura da tela.
 *
 * "Salvar em PDF" é o diálogo de impressão do navegador (`window.print()`), e
 * o CSS de impressão isola a folha: tudo fica invisível menos ela, que assume
 * a página inteira em paisagem. A conclusão vem da conta; código público de
 * verificação continua fora do escopo e não é fingido aqui.
 *
 * CONCLUSÃO É DO CLIENTE: quem chega por URL a um conteúdo não concluído vê o
 * estado honesto com o progresso real e o caminho de volta.
 */
export function CertificadoVista({
  origem,
  titulo,
  itemIds,
  hrefConteudo,
  nome,
}: {
  origem: 'formacao' | 'solucao';
  titulo: string;
  itemIds: string[];
  hrefConteudo: string;
  nome: string;
}) {
  const progresso = useProgresso();

  const feitas =
    origem === 'formacao'
      ? contarConcluidas(progresso, itemIds)
      : contarEtapasFeitas(progresso, itemIds);
  const total = itemIds.length;
  const concluido = estadoDoProgresso(feitas, total) === 'concluida';

  const registro = origem === 'formacao' ? progresso.aulas : progresso.etapas;
  let ultimaIso: string | null = null;
  for (const id of itemIds) {
    const iso = registro[id];
    if (iso && (!ultimaIso || iso > ultimaIso)) ultimaIso = iso;
  }

  const rotuloOrigem = origem === 'formacao' ? 'formação' : 'solução';
  const unidade = origem === 'formacao' ? 'aulas' : 'etapas';

  if (!concluido) {
    const pct = percentual(feitas, total);
    return (
      <div className={styles.pagina}>
        <div className={styles.acoes}>
          <BotaoVoltar fallback="/certificados" rotulo="Certificados" />
        </div>
        <div className={styles.pendencia}>
          <p className={styles.pendenciaTitulo}>Este certificado ainda não foi conquistado.</p>
          <p className={styles.pendenciaTexto}>
            “{titulo}” está em {feitas}/{total} {unidade} ({pct}%). Conclua para o certificado ser
            emitido com a data da conquista.
          </p>
          <Link href={hrefConteudo} className={styles.pendenciaCta}>
            Continuar de onde parou
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pagina}>
      <div className={styles.acoes}>
        <BotaoVoltar fallback="/certificados" rotulo="Certificados" />
        <button type="button" className={styles.imprimir} onClick={() => window.print()}>
          <Printer size={15} strokeWidth={1.8} />
          Imprimir ou salvar em PDF
        </button>
      </div>

      {/* A FOLHA — o que sai na impressão é exatamente isto. */}
      <article className={styles.folha} aria-label={`Certificado de ${titulo}`}>
        <span className={styles.molduraExterna} aria-hidden="true" />
        <span className={styles.molduraInterna} aria-hidden="true" />

        <div className={styles.folhaMiolo}>
          <header className={styles.folhaTopo}>
            <span className={styles.marca}>subido</span>
            <span className={styles.selo}>
              <Visto tamanho={14} />
            </span>
          </header>

          <div className={styles.folhaCentro}>
            <p className={styles.eyebrow}>Certificado de conclusão · {rotuloOrigem}</p>
            <p className={styles.certificamos}>Certificamos que</p>
            <p className={styles.nome}>{nome}</p>
            <p className={styles.concluiu}>
              concluiu {origem === 'formacao' ? 'a formação' : 'a implementação da solução'}
            </p>
            <h1 className={styles.tituloConteudo}>{titulo}</h1>
          </div>

          <footer className={styles.folhaBase}>
            <div className={styles.dado}>
              <span className={styles.dadoRotulo}>Concluído em</span>
              <span className={styles.dadoValor}>{ultimaIso ? dataCurta(ultimaIso) : '—'}</span>
            </div>
            <div className={styles.dado}>
              <span className={styles.dadoRotulo}>{unidade}</span>
              <span className={styles.dadoValor}>
                {feitas}/{total}
              </span>
            </div>
            {/* Sem código de verificação: registro público auditável é fase de
                backend, e número inventado aqui seria pior que a ausência. */}
            <p className={styles.origem}>Registro da conta · plataforma Subido</p>
          </footer>
        </div>
      </article>
    </div>
  );
}
