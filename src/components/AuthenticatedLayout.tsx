'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Files, Key, BookOpen, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { auth } from '@/lib/api';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export default function AuthenticatedLayout({ children, onLogout }: AuthenticatedLayoutProps) {
  const pathname = usePathname();

  const handleLogout = () => {
    auth.logout();
    onLogout();
  };

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-stone-800">OSS Admin</h1>
            <div className="flex items-center gap-4">
              <nav className="flex items-center gap-2">
                <Button 
                  variant={isActive('/') ? "default" : "ghost"} 
                  size="sm" 
                  asChild
                >
                  <Link href="/" className="flex items-center gap-2">
                    <Files className="w-4 h-4" />
                    Files
                  </Link>
                </Button>
                <Button 
                  variant={isActive('/api-keys') ? "default" : "ghost"} 
                  size="sm" 
                  asChild
                >
                  <Link href="/api-keys" className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    API Keys
                  </Link>
                </Button>
                <Button 
                  variant={isActive('/developer-guide') ? "default" : "ghost"} 
                  size="sm" 
                  asChild
                >
                  <Link href="/developer-guide" className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Developer Guide
                  </Link>
                </Button>
              </nav>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {children}
      </main>
    </div>
  );
}