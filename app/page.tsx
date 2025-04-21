// app/page.tsx
import { redirect } from "next/navigation";

// Esta es la página principal que se muestra en la ruta "/"
export default function Home() {
  // Redirigimos al usuario al login
  redirect("/login");
}
