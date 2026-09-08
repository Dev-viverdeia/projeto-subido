'use client';

import { useId, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  CornerDownRight,
  FileCheck2,
  MessageSquareText,
  Check,
  Minus,
  CircleHelp,
} from 'lucide-react';
import type { ExemploProjeto as Exemplo } from '@/lib/projetos/exemplo-projeto';
import styles from './ExemploProjeto.module.css';

/** Leitura interativa apenas: nunca grava progresso, envia mensagens ou executa integrações. */
export function ExemploProjeto({ exemplo }: { exemplo: Exemplo }) {
  const tituloId = useId();
  const [selecionado, selecionar] = useState(0);
  const cenario = exemplo.tipo === 'conversa' ? exemplo.cenarios[selecionado] : null;
  const caso = exemplo.tipo === 'analise' ? exemplo.casos[selecionado] : null;

  return (
    <section className={styles.exemplo} aria-labelledby={tituloId}>
      <header className={styles.cabecalho}>
        <span className={styles.selo}>Exemplo didático</span>
        <h4 id={tituloId}>{exemplo.titulo}</h4>
      </header>
      {exemplo.tipo === 'fluxo' ? (
        <>
          <ol className={styles.fluxo} aria-label="Caminho esperado">
            {exemplo.etapas.map((etapa, i) => (
              <li key={etapa.titulo}>
                <div>
                  <span className={styles.marcador} aria-hidden="true">
                    {i + 1}
                  </span>
                  <strong>{etapa.titulo}</strong>
                  <span>{etapa.detalhe}</span>
                </div>
                {i < exemplo.etapas.length - 1 ? (
                  <ArrowRight className={styles.seta} size={18} aria-hidden="true" />
                ) : null}
                {i < exemplo.etapas.length - 1 ? (
                  <ArrowDown className={styles.setaMobile} size={18} aria-hidden="true" />
                ) : null}
              </li>
            ))}
          </ol>
          <div className={styles.desvio}>
            <CornerDownRight size={22} aria-hidden="true" />
            <div>
              <strong>{exemplo.desvio.quando}</strong>
              <p>{exemplo.desvio.acao}</p>
            </div>
          </div>
        </>
      ) : exemplo.tipo === 'ficha' ? (
        <dl className={styles.ficha}>
          {exemplo.campos.map((campo) => (
            <div key={campo.rotulo} data-pendente={campo.pendente || undefined}>
              <dt>{campo.rotulo}</dt>
              <dd>{campo.valor}</dd>
            </div>
          ))}
        </dl>
      ) : exemplo.tipo === 'analise' ? (
        <>
          <nav className={styles.cenarios} aria-label="Contas do exemplo">
            {exemplo.casos.map((item, i) => (
              <button
                type="button"
                key={item.nome}
                aria-pressed={i === selecionado}
                onClick={() => selecionar(i)}
              >
                {item.nome}
              </button>
            ))}
          </nav>
          {caso ? (
            <div className={styles.analise} aria-live="polite" aria-atomic="true">
              <div className={styles.empresa}>
                <span>Empresa fictícia</span>
                <strong>{caso.empresa}</strong>
              </div>
              <dl className={styles.criterios}>
                {caso.criterios.map((criterio) => (
                  <div key={criterio.rotulo}>
                    <dt>{criterio.rotulo}</dt>
                    <dd>
                      <span>{criterio.dado}</span>
                      <span className={styles.estado} data-estado={criterio.estado}>
                        {criterio.estado === 'confirmado' ? (
                          <Check size={16} aria-hidden="true" />
                        ) : criterio.estado === 'nao_atende' ? (
                          <Minus size={16} aria-hidden="true" />
                        ) : (
                          <CircleHelp size={16} aria-hidden="true" />
                        )}
                        {criterio.estado === 'confirmado'
                          ? 'Confirmado'
                          : criterio.estado === 'nao_atende'
                            ? 'Fora do perfil'
                            : 'A confirmar'}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
              <div className={styles.resultado}>
                <strong>{caso.decisao}</strong>
                <p>{caso.motivo}</p>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <nav className={styles.cenarios} aria-label="Cenários do exemplo">
            {exemplo.cenarios.map((item, i) => (
              <button
                type="button"
                key={item.nome}
                aria-pressed={i === selecionado}
                onClick={() => selecionar(i)}
              >
                {item.nome}
              </button>
            ))}
          </nav>
          {cenario ? (
            <div className={styles.conversa} aria-live="polite" aria-atomic="true">
              <div className={styles.mensagemEntrada}>
                <span>{exemplo.rotulos?.entrada ?? 'Entrada'}</span>
                <p>{cenario.entrada}</p>
              </div>
              <div className={styles.mensagemSaida}>
                <span>
                  <MessageSquareText size={16} aria-hidden="true" />
                  {exemplo.rotulos?.resposta ?? 'Resposta esperada'}
                </span>
                <p>{cenario.resposta}</p>
              </div>
              <div className={styles.decisao}>
                <strong>O que conferir</strong>
                <p>{cenario.decisao}</p>
              </div>
            </div>
          ) : null}
        </>
      )}
      <footer className={styles.entrega}>
        <FileCheck2 size={22} aria-hidden="true" />
        <div>
          <span>Você prepara</span>
          <p>{exemplo.entrega}</p>
        </div>
      </footer>
    </section>
  );
}
