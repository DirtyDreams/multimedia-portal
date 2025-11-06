"use client";

import Link from "next/link";
import { Menu, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigation } from "./navigation";
import { SearchBar } from "@/components/search";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Multimedia Portal
            </span>
          </Link>

          {/* Desktop Search Bar */}
          <div className="hidden md:block md:flex-1 md:max-w-xl md:mx-8">
            <SearchBar />
          </div>

          {/* User Actions */}
          <div className="hidden md:flex md:items-center md:space-x-4 md:flex-shrink-0">
          {isAuthenticated && user ? (
            <>
              <div className="flex items-center space-x-2 text-sm">
                <User className="h-4 w-4" />
                <span className="text-zinc-600 dark:text-zinc-400">
                  {user.name || user.email}
                </span>
              </div>
              {(user.role === "admin" || user.role === "moderator") && (
                <Button variant="ghost" asChild size="sm">
                  <Link href="/dashboard">
                    <Settings className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Sign Up</Link>
              </Button>
            </>
          )}
        </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>

        {/* Desktop Navigation Row */}
        <div className="hidden md:block border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex h-12 items-center justify-center">
            <Navigation />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* Mobile Search Bar */}
            <SearchBar />
            <Navigation mobile />
            <div className="flex flex-col space-y-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              {isAuthenticated && user ? (
                <>
                  <div className="px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{user.name || user.email}</span>
                    </div>
                  </div>
                  {(user.role === "admin" || user.role === "moderator") && (
                    <Button variant="ghost" asChild className="w-full justify-start">
                      <Link href="/dashboard">
                        <Settings className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild className="w-full justify-start">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/register">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
