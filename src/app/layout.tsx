import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { A11yProvider } from "@/components/accessibility/A11yProvider";
import { A11yToolbar } from "@/components/accessibility/A11yToolbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "STATLEARN - AI Competency & Learning Intelligence",
  description:
    "AI-powered competency assessment, evidence-based gap analysis, and personalized learning pathways.",
  icons: {
    icon: [
      { url: "/statlearn-logo.png", type: "image/png" },
    ],
    shortcut: "/statlearn-logo.png",
    apple: "/statlearn-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('statlearn_theme');
                  if (saved === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-[#0b0c14] antialiased text-slate-900 dark:text-slate-100 selection:bg-purple-500 selection:text-white transition-colors duration-200">
        <ThemeProvider>
          <A11yProvider>
            <AuthProvider>
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:p-2.5 focus:bg-purple-700 focus:text-white focus:rounded-xl"
              >
                Skip to main content
              </a>
              {children}
              <A11yToolbar />
            </AuthProvider>
          </A11yProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
