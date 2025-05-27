import { Link, useLocation, Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChartLine, Bell, User, LogOut, Settings, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import type { User as AppUser } from "@shared/schema"; // Import our app's User type
import { auth } from "@/lib/firebase"; // Import Firebase auth
import { signOut } from "firebase/auth"; // Import signOut

export default function Header() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/", current: location === "/" },
    {
      name: "Transações",
      href: "/transacoes",
      current: location === "/transacoes",
    },
    {
      name: "Orçamento",
      href: "/orcamento",
      current: location === "/orcamento",
    },
    { name: "Metas", href: "/metas", current: location === "/metas" },
    {
      name: "Relatórios",
      href: "/relatorios",
      current: location === "/relatorios",
    },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // User is signed out, redirect to login or landing page
      // The useAuth hook will update isAuthenticated, and the Router will handle the redirect.
      // Forcing a reload or navigation can sometimes be helpful to ensure state clears.
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error signing out: ", error);
      // Handle any errors here, e.g., show a notification to the user
    }
  };

  // Cast user to AppUser for easier property access, or use it as FirebaseUser
  const appUser = user as AppUser | null;

  const getUserInitials = () => {
    if (appUser?.firstName && appUser?.lastName) {
      return `${appUser.firstName[0]}${appUser.lastName[0]}`.toUpperCase();
    }
    if (appUser?.firstName) {
      return appUser.firstName[0].toUpperCase();
    }
    // Fallback for FirebaseUser or if names are not set
    if (user?.displayName) {
      const names = user.displayName.split(" ");
      if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = () => {
    if (appUser?.firstName && appUser?.lastName) {
      return `${appUser.firstName} ${appUser.lastName}`;
    }
    if (appUser?.firstName) {
      return appUser.firstName;
    }
    // Fallback for FirebaseUser or if names are not set
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      return user.email;
    }
    return "Usuário";
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <ChartLine className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="ml-2 text-xl font-bold text-primary">
                FinanceApp
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  item.current
                    ? "text-foreground font-medium border-b-2 border-primary pb-2"
                    : "text-muted-foreground hover:text-foreground transition-colors"
                } relative`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              <Bell className="w-5 h-5" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 p-2"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={
                        appUser?.profileImageUrl || user?.photoURL || undefined
                      }
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium">
                    {getUserDisplayName()}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{getUserDisplayName()}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${
                    item.current
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  } block px-3 py-2 rounded-md text-base font-medium transition-colors`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
