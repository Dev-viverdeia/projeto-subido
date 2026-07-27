import { Check } from 'lucide-react';
import { PLANS, PRICING_META, GUARANTEE } from '@/content/landing';
import { Section, SectionHeader, Reveal, TrackedCta } from '../primitives';
import styles from './PricingSection.module.css';

/**
 * Planos — Starter · Pro · Enterprise.
 *
 * A tabela de ancoragem vem ANTES do preço e soma sozinha: é o mesmo trabalho que a
 * página do Sobral faz com "não vai custar R$100.000", só que por subtração que o
 * próprio leitor executa em vez de por exclamação. Mesma função persuasiva, sem
 * urgência fabricada.
 *
 * O Enterprise não vai para checkout: fala com o time. É o tier que conversa com o
 * HUB — empresa que quer formar ou contratar time, não indivíduo comprando acesso.
 */
export function PricingSection() {
  return (
    <Section id="planos" tone="tint" labelledBy="planos-title" space="loose">
      <SectionHeader id="planos-title" eyebrow={PRICING_META.eyebrow} title={PRICING_META.title} />

      <div className={styles.layout}>
        <Reveal className={styles.stack}>
          <p className={styles.stackLead}>{PRICING_META.stackLead}</p>
          <dl className={styles.stackList}>
            {PRICING_META.stack.map((item) => (
              <div key={item.label} className={styles.stackRow}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
            <div className={`${styles.stackRow} ${styles.stackTotal}`}>
              <dt>Total no mercado</dt>
              <dd>{PRICING_META.stackTotal}</dd>
            </div>
          </dl>
          <p className={styles.reveal}>{PRICING_META.reveal}</p>
        </Reveal>

        <ul className={styles.plans}>
          {PLANS.map((plan, i) => (
            <Reveal
              key={plan.id}
              as="li"
              index={i}
              className={[styles.plan, plan.featured && styles.featured].filter(Boolean).join(' ')}
            >
              <div className={styles.planHead}>
                <h3 className={styles.planName}>{plan.name}</h3>
                {plan.featured ? <span className={styles.badge}>mais escolhido</span> : null}
              </div>

              <p className={styles.planPitch}>{plan.pitch}</p>

              <p className={styles.price}>
                {plan.priceMonthly === null ? (
                  <span className={styles.priceTodo}>R$ [TODO]</span>
                ) : (
                  <>
                    <span className={styles.priceValue}>
                      {plan.priceMonthly.toLocaleString('pt-BR')}
                    </span>
                    <span className={styles.priceUnit}>/mês</span>
                  </>
                )}
              </p>

              <ul className={styles.features}>
                {plan.features.map((feature) => (
                  <li key={feature} className={styles.feature}>
                    <Check size={15} strokeWidth={2.2} aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>

              <TrackedCta
                href={plan.ctaHref}
                local="planos"
                plano={plan.id}
                className={plan.featured ? styles.ctaPrimary : styles.ctaGhost}
              >
                {plan.cta}
              </TrackedCta>
            </Reveal>
          ))}
        </ul>
      </div>

      <Reveal index={3}>
        <aside className={styles.guarantee}>
          <h3 className={`t-subtitle ${styles.guaranteeTitle}`}>{GUARANTEE.title}</h3>
          <p className={styles.guaranteeBody}>{GUARANTEE.body}</p>
        </aside>
      </Reveal>
    </Section>
  );
}
