/* Onde o site mora.

   O projeto é publicado em /samauma-v2, e não na raiz do domínio. O Next reescreve
   sozinho os endereços de página, mas não os de arquivo em `public/`: um
   `src="/logo.png"` procuraria a imagem na raiz e não a encontraria — foi o que
   fez a marca oficial sumir e o símbolo de reserva aparecer no lugar.

   O valor vem do próprio `next.config.ts`, então trocar o endereço de
   publicação não exige caçar caminho espalhado pelo código. */

export const CAMINHO_BASE = process.env.NEXT_PUBLIC_CAMINHO_BASE ?? '';

/* Atenção: `globals.css` traz um caminho literal `/samauma-v2/porto-velho.jpg`
   na tela de acesso. CSS não enxerga esta constante — se o endereço de
   publicação mudar, aquele `url()` precisa mudar junto. */

export function arquivoPublico(caminho: string) {
  return CAMINHO_BASE + (caminho.startsWith('/') ? caminho : '/' + caminho);
}

/* Endereço institucional de destino. Vale como reserva quando a página é
   gerada fora do navegador (build estático), onde não existe `window`. */
export const DOMINIO_INSTITUCIONAL = 'https://samauma.portovelho.ro.gov.br';

/** Endereço absoluto de uma página — é isto que entra dentro do QR Code.
    No navegador usa a origem real, de modo que o código lido na demonstração
    abra a demonstração, e o mesmo código em produção abra a produção. */
export function enderecoPublico(caminho: string): string {
  const rota = arquivoPublico(caminho);
  return (typeof window === 'undefined' ? DOMINIO_INSTITUCIONAL : window.location.origin) + rota;
}
