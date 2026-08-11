import './globals.css';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'Dagadiya Cafe — Artisan Café & Coffee House',
  description: 'A modern artisan café serving hand-crafted coffee, tea, snacks and desserts. Order online for pickup or delivery.',
  keywords: 'cafe, coffee, latte, artisan coffee, order coffee online, cafe near me, dagadiya cafe',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
