import './globals.css';

export const metadata = {
  title: 'B2B Lead Finder',
  description: 'Find localized business leads instantly',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-50 antialiased">{children}</body>
    </html>
  );
}
