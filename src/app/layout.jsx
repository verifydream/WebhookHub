import './globals.css';
export const metadata = { title: 'WebhookHub', description: 'Debug webhooks bareng tim, tanpa chaos' };
export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#0f0f0f] text-[#e0e0e0] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
