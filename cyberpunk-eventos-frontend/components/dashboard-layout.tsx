'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Home, History, User, LogOut, Zap, Plus, Building2 } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  type: 'company' | 'client';
}

export function DashboardLayout({ children, type }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { sair, usuario } = useAuth();

  const companyLinks = [
    { href: `/company/dashboard`, label: 'Home', icon: Home },
    { href: `/company/create-event`, label: 'Criar Evento', icon: Plus },
    { href: `/company/history`, label: 'Histórico', icon: History },
    { href: `/company/profile`, label: 'Perfil', icon: User },
    ...(usuario
      ? [{ href: `/company/${usuario.id}`, label: 'Perfil Público', icon: Building2 }]
      : []),
  ];

  const clientLinks = [
    { href: `/client/dashboard`, label: 'Home', icon: Home },
    { href: `/client/history`, label: 'Meus Ingressos', icon: History },
    { href: `/client/my-tickets`, label: 'Histórico de Pagamentos', icon: Zap },
    { href: `/client/profile`, label: 'Perfil', icon: User },
  ];

  const links = type === 'company' ? companyLinks : clientLinks;
  const themeColor = type === 'company' ? 'purple' : 'cyan';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-cyan-900">
      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`w-64 min-h-screen bg-black/50 border-r border-${themeColor}-400/30 backdrop-blur-sm`}
        >
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-8">
              <Zap className={`w-8 h-8 text-${themeColor}-400`} />
              <h1 className={`text-xl font-bold text-${themeColor}-400`}>Cyberpunk Events</h1>
            </div>

            <nav className="space-y-2">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? `bg-${themeColor}-400/20 text-${themeColor}-400 border border-${themeColor}-400/50`
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 pt-8 border-t border-gray-700">
              <div className="px-4 py-3 mb-4 rounded-lg bg-white/5">
                <p className="text-xs text-gray-400">Logado como</p>
                <p className="text-sm text-white font-medium truncate">{usuario?.nome}</p>
                <p className="text-xs text-gray-400 truncate">{usuario?.email}</p>
              </div>
              <Button
                onClick={sair}
                variant="outline"
                className={`w-full border-red-400/50 text-red-400 hover:bg-red-400 hover:text-black`}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
