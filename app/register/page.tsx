"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { status } = useSession();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error al registrar");
      }

      // Redireccionar al login con mensaje de éxito
      router.replace("/login?registered=true");
    } catch (error: any) {
      setError(error.message || "Error al registrar usuario");
      console.error("Error en registro:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar indicador de carga mientras se verifica la sesión
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 shadow-lg rounded-lg bg-card">
      <h1 className="text-2xl font-bold mb-4 text-center">Crear cuenta</h1>

      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 dark:bg-red-900/30">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded bg-background"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded bg-background"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded bg-background"
          required
        />
        <button
          type="submit"
          className="bg-black text-white p-2 rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? "Cargando..." : "Registrarse"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        ¿Ya tienes una cuenta?{" "}
        <Link
          href="/login"
          className="text-primary underline hover:text-primary/80"
        >
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
