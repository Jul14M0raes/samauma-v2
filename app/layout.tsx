import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { AppProviders } from '@/components/layout/AppProviders';
import { arquivoPublico } from '@/lib/caminhos';
import './globals.css';

/* Fonte só dos títulos: Geom, a geométrica pedida desde o início — self-hosted,
   sem mexer no corpo de texto (que continua na fonte de sistema, mais legível
   em telas densas de dados). Licença OFL em app/fonts/Geom-OFL.txt. */
const fonteTitulo = localFont({
  src: [{ path: './fonts/Geom-VariableFont_wght.ttf', style: 'normal' }],
  variable: '--fonte-titulo'
});

export const metadata: Metadata = {
  title: 'SAMAÚMA — Sistema de Grandes Geradores e Inclusão Produtiva | Porto Velho/RO',
  description: 'Protótipo demonstrativo: o gerador declara, o catador coleta, o destinatário recebe e confirma, a Prefeitura acompanha. O ciclo fecha em comprovante.',
  icons: { icon: arquivoPublico('/logo.png') }
};

export const viewport: Viewport = {
  themeColor: '#1f6b4a'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={fonteTitulo.variable}>
      <body>
        <a href="#conteudo" className="pular">Ir para o conteúdo principal</a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
