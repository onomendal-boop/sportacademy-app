import { Inter, Manrope } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata = {
  title: 'AAA Sport Academy',
  description:
    'AAA Sport Academy — sekolah renang untuk pemula, menengah, atlet, dan private dengan kurikulum bertahap dan pelatih berpengalaman.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${inter.variable} ${manrope.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
        <Toaster richColors position="top-center" closeButton />
      </body>
    </html>
  );
}
