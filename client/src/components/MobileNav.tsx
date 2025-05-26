import { Link, useLocation } from "wouter";
import { 
  Home, 
  ArrowLeftRight, 
  PieChart, 
  Target, 
  User 
} from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();

  const navigation = [
    { 
      name: 'Início', 
      href: '/', 
      icon: Home,
      current: location === '/' 
    },
    { 
      name: 'Transações', 
      href: '/transacoes', 
      icon: ArrowLeftRight,
      current: location === '/transacoes' 
    },
    { 
      name: 'Relatórios', 
      href: '/relatorios', 
      icon: PieChart,
      current: location === '/relatorios' 
    },
    { 
      name: 'Metas', 
      href: '/metas', 
      icon: Target,
      current: location === '/metas' 
    },
    { 
      name: 'Perfil', 
      href: '/perfil', 
      icon: User,
      current: location === '/perfil' 
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-background border-t border-border px-4 py-2 z-40">
      <div className="flex justify-around">
        {navigation.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                item.current
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <IconComponent className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
