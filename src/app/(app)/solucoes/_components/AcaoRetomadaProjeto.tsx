'use client';

import Link from 'next/link';
import { ArrowDown, GraduationCap, PackageCheck } from 'lucide-react';
import styles from './ProjetoGuiado.module.css';

export function AcaoRetomadaProjeto({
  slug,
  proximoPasso,
  aprendizadoConcluido,
  aoRetomar,
}: {
  slug: string;
  proximoPasso: string | null;
  aprendizadoConcluido: boolean;
  aoRetomar: () => void;
}) {
  if (proximoPasso) {
    return (
      <button type="button" className={styles.continuarHero} onClick={aoRetomar}>
        <span>
          <small>Próximo passo</small>
          {proximoPasso}
        </span>
        <ArrowDown size={16} aria-hidden="true" />
      </button>
    );
  }

  if (!aprendizadoConcluido) {
    return (
      <a href="#aprendizado-projeto" className={styles.continuarHero}>
        <span>
          <small>Falta uma parte</small>
          Concluir aulas do projeto
        </span>
        <GraduationCap size={18} aria-hidden="true" />
      </a>
    );
  }

  return (
    <Link href={`/certificados/solucao/${slug}`} className={styles.continuarHero}>
      <span>
        <small>Projeto concluído</small>
        Ver certificado
      </span>
      <PackageCheck size={18} aria-hidden="true" />
    </Link>
  );
}
