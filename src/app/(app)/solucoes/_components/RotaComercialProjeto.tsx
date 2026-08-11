import Link from 'next/link';
import { ArrowUpRight, Building2, FileSignature } from 'lucide-react';
import styles from './ProjetoGuiado.module.css';

export function RotaComercialProjeto({
  destinoCrm,
  destinoProposta,
}: {
  destinoCrm: string;
  destinoProposta: string;
}) {
  return (
    <section className={styles.rotaProjeto} aria-labelledby="rota-projeto-titulo">
      <header>
        <span>Do projeto à entrega</span>
        <h2 id="rota-projeto-titulo">Use nesta ordem</h2>
        <p>O roteiro entra em campo depois que uma empresa aceita avançar.</p>
      </header>

      <ol>
        <li>
          <b>01</b>
          <div>
            <strong>Conheça a oferta</strong>
            <p>Entenda o resultado, o cliente ideal e os limites do projeto.</p>
          </div>
        </li>
        <li>
          <b>02</b>
          <div>
            <strong>Encontre uma empresa</strong>
            <p>Cadastre o lead e use a descoberta para confirmar o problema.</p>
          </div>
        </li>
        <li>
          <b>03</b>
          <div>
            <strong>Venda o projeto</strong>
            <p>Monte a proposta com os fatos que o cliente confirmou.</p>
          </div>
        </li>
        <li>
          <b>04</b>
          <div>
            <strong>Execute com o cliente</strong>
            <p>Siga as cinco fases abaixo e registre cada evidência.</p>
          </div>
        </li>
      </ol>

      <div className={styles.rotaAcoes}>
        <Link href={destinoCrm}>
          <Building2 size={16} strokeWidth={1.8} aria-hidden="true" />
          Cadastrar lead
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
        <Link href={destinoProposta}>
          <FileSignature size={16} strokeWidth={1.8} aria-hidden="true" />
          Criar proposta
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
