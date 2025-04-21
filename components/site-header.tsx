"use client";

import Link from "next/link";
import {
  CreditCard,
  Home,
  LineChart,
  LogOut,
  Menu,
  PiggyBank,
  Plus,
  Settings,
  User,
  Wallet,
  Tags,
} from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const homeDestination = isLoggedIn ? "/dashboard" : "/login";

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  // Don't show full header on login/register pages
  if (isAuthPage) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container flex h-14 items-center justify-between">
          <Link href={homeDestination} className="flex items-center space-x-2">
            <PiggyBank className="h-6 w-6 text-emerald-500" />
            <span className="font-bold">MisFinanzas</span>
          </Link>
          <ModeToggle />
        </div>
      </header>
    );
  }

  // Función para determinar si un enlace está activo
  const isActive = (path: string) => {
    if (path === "/dashboard" && pathname === "/dashboard") {
      return true;
    }
    return path !== "/dashboard" && pathname.startsWith(path);
  };

  // Clase para los enlaces activos
  const activeLinkClass = "text-foreground";
  const inactiveLinkClass = "text-foreground/60 hover:text-foreground/80";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link
            href={homeDestination}
            className="mr-6 flex items-center space-x-2"
          >
            <PiggyBank className="h-6 w-6 text-emerald-500" />
            <span className="hidden font-bold sm:inline-block">
              MisFinanzas
            </span>
          </Link>

          {/* Navegación para pantallas medianas y grandes - solo visible cuando está logueado */}
          {isLoggedIn && (
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
              <Link
                href="/dashboard"
                className={`transition-colors ${
                  isActive("/dashboard") ? activeLinkClass : inactiveLinkClass
                }`}
              >
                <div className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  <span>Inicio</span>
                </div>
              </Link>
              <Link
                href="/income"
                className={`transition-colors ${
                  isActive("/income") ? activeLinkClass : inactiveLinkClass
                }`}
              >
                <div className="flex items-center gap-1">
                  <Wallet className="h-4 w-4" />
                  <span>Ingresos</span>
                </div>
              </Link>
              <Link
                href="/expenses"
                className={`transition-colors ${
                  isActive("/expenses") ? activeLinkClass : inactiveLinkClass
                }`}
              >
                <div className="flex items-center gap-1">
                  <CreditCard className="h-4 w-4" />
                  <span>Gastos</span>
                </div>
              </Link>
              <Link
                href="/budget"
                className={`transition-colors ${
                  isActive("/budget") ? activeLinkClass : inactiveLinkClass
                }`}
              >
                <div className="flex items-center gap-1">
                  <PiggyBank className="h-4 w-4" />
                  <span>Presupuestos</span>
                </div>
              </Link>
              <Link
                href="/transactions"
                className={`transition-colors ${
                  isActive("/transactions")
                    ? activeLinkClass
                    : inactiveLinkClass
                }`}
              >
                <div className="flex items-center gap-1">
                  <LineChart className="h-4 w-4" />
                  <span>Transacciones</span>
                </div>
              </Link>
              <Link
                href="/categories"
                className={`transition-colors ${
                  isActive("/categories") ? activeLinkClass : inactiveLinkClass
                }`}
              >
                <div className="flex items-center gap-1">
                  <Tags className="h-4 w-4" />
                  <span>Categorías</span>
                </div>
              </Link>
            </nav>
          )}
        </div>

        {/* Menú móvil - Solo visible en pantallas pequeñas y cuando está logueado */}
        {isLoggedIn && (
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px] sm:w-[300px]">
              <div className="flex flex-col gap-6 py-4">
                <div className="flex items-center gap-2">
                  <PiggyBank className="h-6 w-6 text-emerald-500" />
                  <span className="font-bold">MisFinanzas</span>
                </div>
                <nav className="flex flex-col gap-4">
                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-2 ${
                      isActive("/dashboard")
                        ? "text-foreground"
                        : "text-foreground/60 hover:text-foreground"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <Home className="h-5 w-5" />
                    <span>Inicio</span>
                  </Link>
                  <Link
                    href="/income"
                    className={`flex items-center gap-2 ${
                      isActive("/income")
                        ? "text-foreground"
                        : "text-foreground/60 hover:text-foreground"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <Wallet className="h-5 w-5" />
                    <span>Ingresos</span>
                  </Link>
                  <Link
                    href="/expenses"
                    className={`flex items-center gap-2 ${
                      isActive("/expenses")
                        ? "text-foreground"
                        : "text-foreground/60 hover:text-foreground"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>Gastos</span>
                  </Link>
                  <Link
                    href="/budget"
                    className={`flex items-center gap-2 ${
                      isActive("/budget")
                        ? "text-foreground"
                        : "text-foreground/60 hover:text-foreground"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <PiggyBank className="h-5 w-5" />
                    <span>Presupuestos</span>
                  </Link>
                  <Link
                    href="/transactions"
                    className={`flex items-center gap-2 ${
                      isActive("/transactions")
                        ? "text-foreground"
                        : "text-foreground/60 hover:text-foreground"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <LineChart className="h-5 w-5" />
                    <span>Transacciones</span>
                  </Link>
                  <Link
                    href="/categories"
                    className={`flex items-center gap-2 ${
                      isActive("/categories")
                        ? "text-foreground"
                        : "text-foreground/60 hover:text-foreground"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <Tags className="h-5 w-5" />
                    <span>Categorías</span>
                  </Link>
                  <Link
                    href="/profile"
                    className={`flex items-center gap-2 ${
                      isActive("/profile")
                        ? "text-foreground"
                        : "text-foreground/60 hover:text-foreground"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="h-5 w-5" />
                    <span>Mi Perfil</span>
                  </Link>
                  <Link
                    href="/settings"
                    className={`flex items-center gap-2 ${
                      isActive("/settings")
                        ? "text-foreground"
                        : "text-foreground/60 hover:text-foreground"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="h-5 w-5" />
                    <span>Configuración</span>
                  </Link>
                  <button
                    className="flex items-center gap-2 text-foreground/60 hover:text-foreground"
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout();
                    }}
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Cerrar sesión</span>
                  </button>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        )}

        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center gap-2">
            {isLoggedIn && (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="hidden sm:flex"
                >
                  <Link
                    href="/transactions/new"
                    className={
                      isActive("/transactions/new") ? "text-foreground" : ""
                    }
                  >
                    <Plus className="h-5 w-5" />
                    <span className="sr-only">Nueva transacción</span>
                  </Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    {session?.user?.image ? (
                      <Avatar className="h-8 w-8 cursor-pointer">
                        <AvatarImage
                          src={session.user.image}
                          alt={session.user.name || "Usuario"}
                        />
                        <AvatarFallback>
                          {session.user.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Button variant="ghost" size="icon">
                        <User className="h-5 w-5" />
                        <span className="sr-only">Perfil</span>
                      </Button>
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Mi Perfil</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">Configuración</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
