import type { Metadata } from 'next';
import { Archivo, Sora } from 'next/font/google';
import './globals.css';

const archivo = Archivo({ variable: '--font-body', subsets: ['latin'] });
const sora = Sora({ variable: '--font-display', subsets: ['latin'] });

export const metadata: Metadata = { title: 'MotoStock | Inventario y pedidos', description: 'Control de repuestos, aceites y pedidos por WhatsApp para Roma y Casa Grande.' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body className={`${archivo.variable} ${sora.variable} antialiased`}>{children}</body></html>;
}
