import type { Metadata } from 'next';
import { Cairo, Alexandria, Readex_Pro, Tajawal } from 'next/font/google';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-cairo'
});

const alexandria = Alexandria({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-alexandria'
});

const readexPro = Readex_Pro({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-readex'
});

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700', '800'],
  display: 'swap',
  variable: '--font-tajawal'
});

export const metadata: Metadata = {
  title: 'سام تك لإدارة الشبكات - نظام إدارة وتوزيع كروت شبكات المايكروتك',
  description: 'نظام سحابي متكامل لإدارة شبكات المايكروتك، تصميم وطباعة كروت الإنترنت بدقة A4، إدارة المخزون ونقاط البيع، والتحصيل المالي والمزامنة الذكية.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`dark ${cairo.variable} ${alexandria.variable} ${readexPro.variable} ${tajawal.variable}`}>
      <body suppressHydrationWarning className="font-cairo bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

