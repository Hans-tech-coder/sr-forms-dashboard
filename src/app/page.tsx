"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, LogOut, Rocket, FileText, ArrowRight } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === "system" ? systemTheme : theme;
  const logoColor = currentTheme === "dark" ? "gold" : "purple";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200 flex flex-col">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8">
              {mounted && (
                <img
                  src={`/logos/logo-${logoColor}-horizontal.svg`}
                  alt="Skyrocket Logo"
                  className="h-full w-auto object-contain"
                />
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Theme Toggle - Desktop */}
            <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-700 rounded-full p-1 border border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setTheme("light")}
                className={`p-1.5 rounded-full transition-all ${
                  theme === "light"
                    ? "bg-white text-brand-purple shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
                title="Light Mode"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`p-1.5 rounded-full transition-all ${
                  theme === "dark"
                    ? "bg-gray-800 text-brand-gold shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
                title="Dark Mode"
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme("system")}
                className={`p-1.5 rounded-full transition-all ${
                  theme === "system"
                    ? "bg-white dark:bg-gray-800 text-brand-purple dark:text-brand-gold shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
                title="System Theme"
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>
            {/* Theme Toggle - Mobile */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
            {/* User Profile */}
            {session.user && (
              <div className="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-gray-700">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium">{session.user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{session.user.email}</p>
                </div>
                {session.user.image ? (
                  <img src={session.user.image} alt={session.user.name || "User"} className="w-9 h-9 rounded-full ring-2 ring-gray-100 dark:ring-gray-700" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-brand-purple dark:bg-brand-gold text-white flex items-center justify-center font-bold">
                    {session.user.name?.charAt(0) || "U"}
                  </div>
                )}
                <button
                  onClick={() => signOut()}
                  className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-grow max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Welcome back, {session.user?.name?.split(' ')[0] || 'User'}!
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Select a form below to get started. Your session and settings are shared across all tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Mission Intake Card */}
          <div 
            onClick={() => router.push('/mission-intake')}
            className="group cursor-pointer bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col"
          >
            <div className="h-32 bg-gradient-to-br from-brand-purple/20 to-purple-500/20 dark:from-brand-gold/20 dark:to-yellow-500/20 flex items-center justify-center">
              <Rocket className="w-16 h-16 text-brand-purple dark:text-brand-gold group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="p-6 flex flex-col flex-grow">
              <h3 className="text-xl font-bold mb-2">Mission Intake Form</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 flex-grow">
                Submit a new mission request. Create tasks, set milestones, and define solutions logic within ClickUp automatically.
              </p>
              <div className="flex items-center text-brand-purple dark:text-brand-gold font-semibold group-hover:translate-x-2 transition-transform duration-300">
                Open Form <ArrowRight className="ml-2 w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Turnover Form Card */}
          <div 
            onClick={() => router.push('/turnover')}
            className="group cursor-pointer bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col"
          >
            <div className="h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 dark:from-blue-400/20 dark:to-cyan-400/20 flex items-center justify-center">
              <FileText className="w-16 h-16 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="p-6 flex flex-col flex-grow">
              <h3 className="text-xl font-bold mb-2">Turnover Form</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 flex-grow">
                Log turnover requests and generate subtasks for individual client turnovers efficiently.
              </p>
              <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                Open Form <ArrowRight className="ml-2 w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-500">
          © {new Date().getFullYear()} Skyrocket Studios PH, Inc. Internal use only.
        </div>
      </footer>
    </div>
  );
}
