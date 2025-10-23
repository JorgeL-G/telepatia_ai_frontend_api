import './globals.css';

export const metadata = {
  title: 'Telepatía AI Frontend',
  description: 'Aplicación frontend para Telepatía AI',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
