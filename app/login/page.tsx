"use client";
import { signIn, useSession } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { status } = useSession();

  // Verificar si hay un mensaje de usuario registrado
  const registered = searchParams.get("registered");

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  useEffect(() => {
    if (registered === "true") {
      setError("¡Registro exitoso! Por favor inicia sesión");
    }
  }, [registered]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Credenciales inválidas. Inténtalo de nuevo.");
      } else if (res?.ok) {
        router.replace("/dashboard");
      }
    } catch (error) {
      console.error("Error durante el login:", error);
      setError("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
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
      <h1 className="text-2xl font-bold mb-4 text-center">Iniciar sesión</h1>

      {error && (
        <div
          className={`p-3 rounded-md mb-4 ${
            registered
              ? "bg-green-50 text-green-600 dark:bg-green-900/30"
              : "bg-red-50 text-red-500 dark:bg-red-900/30"
          }`}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          {isLoading ? "Cargando..." : "Entrar"}
        </button>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-muted-foreground">
              o continúa con
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="flex items-center justify-center gap-2 p-2 border border-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" className="h-5 w-5">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path
                fill="#4285F4"
                d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
              />
              <path
                fill="#34A853"
                d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
              />
              <path
                fill="#FBBC05"
                d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
              />
              <path
                fill="#EA4335"
                d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
              />
            </g>
          </svg>
          Google
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        ¿No tienes una cuenta?{" "}
        <Link
          href="/register"
          className="text-primary underline hover:text-primary/80"
        >
          Regístrate
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Cargando...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
