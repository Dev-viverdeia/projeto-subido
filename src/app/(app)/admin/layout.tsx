import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { ehAdmin } from '@/lib/auth/papeis';
import { AbasAdmin } from './_components/AbasAdmin';
import styles from './layout.module.css';

/**
 * Guarda da área administrativa.
 *
 * `notFound()` E NÃO `redirect('/inicio')`.
 * Um redirect confirma que a rota existe e que a pessoa simplesmente não tem
 * acesso — informação que só interessa a quem está sondando. O 404 devolve
 * exatamente o que um endereço inexistente devolveria, então de fora não há como
 * distinguir "não sou admin" de "essa página não existe".
 *
 * Esta é a TERCEIRA barreira, e cada uma cobre o que a anterior não vê:
 *   1. proxy   — barra quem não tem sessão, antes de qualquer render
 *   2. este    — barra quem tem sessão mas não é admin
 *   3. RLS     — barra a escrita no banco, mesmo que 1 e 2 falhem
 *
 * A terceira é a única que vale sozinha: as duas primeiras são conveniência de
 * navegação, a RLS é a que um atacante teria de derrotar.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!(await ehAdmin())) notFound();

  return (
    <div className={styles.area}>
      <AbasAdmin />
      {children}
    </div>
  );
}
