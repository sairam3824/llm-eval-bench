import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'LLM Eval Bench',
  description: 'Benchmark & compare LLMs across providers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-text-primary min-h-screen flex">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {/* Background effects */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-accent/5 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-emerald-accent/3 rounded-full blur-3xl" />
          </div>

          <Sidebar />

          <main className="flex-1 ml-64 min-h-screen relative">
            <div className="p-8">
              {children}
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
