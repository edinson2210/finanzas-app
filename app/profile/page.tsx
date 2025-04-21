"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirigir al login si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Perfil de Usuario</CardTitle>
          <CardDescription>
            Detalles de tu cuenta y sesión activa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {session?.user?.image && (
              <div className="flex justify-center">
                <img
                  src={session.user.image}
                  alt="Avatar del usuario"
                  className="h-24 w-24 rounded-full"
                />
              </div>
            )}

            <div className="grid gap-1">
              <h3 className="text-sm font-medium">Nombre:</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {session?.user?.name || "No disponible"}
              </p>
            </div>

            <div className="grid gap-1">
              <h3 className="text-sm font-medium">Email:</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {session?.user?.email || "No disponible"}
              </p>
            </div>

            <div className="grid gap-1">
              <h3 className="text-sm font-medium">ID de usuario:</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {session?.user?.id || "No disponible"}
              </p>
            </div>

            <div className="grid gap-1">
              <h3 className="text-sm font-medium">Estado de la sesión:</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {status === "authenticated" ? "Autenticado" : "No autenticado"}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Dashboard
          </Button>
          <Button
            variant="destructive"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Cerrar sesión
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
