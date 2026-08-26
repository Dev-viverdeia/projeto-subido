import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* O preview local abre pelo navegador embutido em 127.0.0.1. Sem esta origem,
     o Next bloqueia os chunks de hidratação: a tela aparece, mas os controles
     não respondem durante a validação visual. */
  allowedDevOrigins: ['127.0.0.1'],
  /* A rota monta o PDF no servidor e lê estas fontes por caminho absoluto. O
     tracing precisa levá-las para a função da Vercel; sem isto funciona local e
     cai silenciosamente para outra tipografia em produção. */
  outputFileTracingIncludes: {
    '/api/propostas/[id]/pdf': ['./src/assets/fonts/pdf/*.ttf'],
  },
  images: {
    /* AVIF ANTES DE WEBP, e a ordem É a preferência de negociação: o Next serve o
       primeiro formato que o `Accept` do cliente aceitar e cai para o original no fim.
       Medido no recorte do hero (1024×1536 com alfa): PNG de origem 2,4 MB · WebP
       servido 244 kB · AVIF q90 148 kB, com o alfa intacto nos três. Sem esta linha o
       padrão do Next é só WebP, e a página que recebe o clique pago pagava 96 kB a
       mais justamente no elemento que é o seu LCP.
       O custo é CPU na primeira geração de cada variante, que fica em cache depois —
       troca óbvia para um asset que não muda. */
    formats: ['image/avif', 'image/webp'],
  },
  async redirects() {
    return [
      {
        /* O domínio oficial abre diretamente a plataforma durante a beta pública.
           A landing comercial ainda está em revisão e continua disponível apenas
           no endereço técnico da Vercel, sem transformar conteúdo de demonstração
           em oferta pública no domínio da marca. */
        source: '/',
        destination: '/entrar',
        permanent: false,
        has: [{ type: 'host', value: 'subido.viverdeia.ai' }],
      },
      {
        source: '/crm/:path*',
        destination: '/vendas/:path*',
        permanent: true,
      },
      {
        source: '/calls/:path*',
        destination: '/reunioes/:path*',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      /* O curinga opcional do Next 16 pode chegar sem valor na raiz e fazer o
         resolvedor tentar preencher um segmento inexistente. As raízes ficam
         explícitas para que /vendas e /reunioes nunca dependam desse caso. */
      { source: '/vendas', destination: '/crm' },
      { source: '/vendas/:path*', destination: '/crm/:path*' },
      { source: '/reunioes', destination: '/calls' },
      { source: '/reunioes/:path*', destination: '/calls/:path*' },
    ];
  },
};

export default nextConfig;
