'use client';

import { useActionState, useState } from 'react';
import { ArrowRight, Building2, Coins, MapPin, Search } from 'lucide-react';
import { Alert, Button, Card, Input, Pill } from '@/design-system/via';
import { criarListaProspeccao, type EstadoBuscaProspeccao } from '@/lib/prospeccao/actions';
import { QUANTIDADES_PROSPECCAO } from '@/lib/prospeccao/schema';
import { ProgressoBusca } from './ProgressoBusca';
import styles from '../pagina.module.css';

const INICIAL: EstadoBuscaProspeccao = {};

export function FormularioBusca({ saldo, pronto }: { saldo: number; pronto: boolean }) {
  const [estado, acao, buscando] = useActionState(criarListaProspeccao, INICIAL);
  const [quantidade, setQuantidade] = useState(
    Number(estado.campos?.quantidade) || QUANTIDADES_PROSPECCAO[0],
  );
  const semSaldo = saldo < quantidade;

  return (
    <Card as="section" variant="atmospheric" noPadding className={styles.painelBusca}>
      <form action={acao} className={styles.formulario} noValidate aria-busy={buscando}>
        <div className={styles.formularioTopo}>
          <div>
            <p className={styles.sobretitulo}>Nova lista</p>
            <h2>Defina o recorte da busca.</h2>
            <p>
              Informe o tipo de empresa e a região. O restante da qualificação fica com a
              plataforma.
            </p>
          </div>
          <Pill
            className={styles.custoBusca}
            size="sm"
            variant="default"
            iconLeft={<Coins size={14} aria-hidden="true" />}
          >
            1 crédito por empresa
          </Pill>
        </div>

        {!pronto && (
          <div className={styles.alertaFormulario}>
            <Alert tone="attn" size="compact">
              A busca está temporariamente indisponível. Nenhum crédito será usado.
            </Alert>
          </div>
        )}
        {estado.erro && (
          <div className={styles.alertaFormulario} role="alert">
            <Alert tone="danger" size="compact">
              {estado.erro}
            </Alert>
          </div>
        )}

        {buscando ? (
          <ProgressoBusca quantidade={quantidade} />
        ) : (
          <>
            <div className={styles.buscaDireta}>
              <Input
                id="prospeccao-segmento"
                name="segmento"
                label="Tipo de empresa"
                placeholder="Ex.: clínicas odontológicas"
                iconLeft={<Building2 size={18} strokeWidth={1.7} aria-hidden="true" />}
                size="lg"
                defaultValue={estado.campos?.segmento ?? ''}
                error={estado.porCampo?.segmento}
                autoComplete="off"
                required
              />
              <Input
                id="prospeccao-localizacao"
                name="localizacao"
                label="Cidade ou região"
                placeholder="Ex.: Belo Horizonte, MG"
                iconLeft={<MapPin size={18} strokeWidth={1.7} aria-hidden="true" />}
                size="lg"
                defaultValue={estado.campos?.localizacao ?? ''}
                error={estado.porCampo?.localizacao}
                autoComplete="address-level2"
                required
              />
            </div>

            <div className={styles.rodapeBusca}>
              <fieldset className={styles.quantidade}>
                <legend>Quantidade</legend>
                <input type="hidden" name="quantidade" value={quantidade} />
                <div>
                  {QUANTIDADES_PROSPECCAO.map((opcao) => (
                    <button
                      type="button"
                      key={opcao}
                      data-ativo={quantidade === opcao || undefined}
                      aria-pressed={quantidade === opcao}
                      disabled={saldo < opcao}
                      onClick={() => setQuantidade(opcao)}
                    >
                      {opcao}
                    </button>
                  ))}
                </div>
                {estado.porCampo?.quantidade && <small>{estado.porCampo.quantidade}</small>}
              </fieldset>

              <div className={styles.reservaBusca}>
                <strong>{quantidade} créditos reservados</strong>
                <span>Você paga somente pelas empresas encontradas.</span>
              </div>

              <div className={styles.acaoBusca}>
                <span>
                  Saldo <strong>{saldo}</strong>
                </span>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={!pronto || semSaldo}
                  iconLeft={<Search size={17} aria-hidden="true" />}
                  iconRight={<ArrowRight size={17} aria-hidden="true" />}
                >
                  Buscar empresas
                </Button>
              </div>
            </div>
          </>
        )}
      </form>
    </Card>
  );
}
