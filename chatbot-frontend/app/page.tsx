"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "./login/components/LoginForm";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Buscar token en local storage
    const token = localStorage.getItem("accessToken");

    if (token) {
      // Si existe, se asume que user está logueado y se redirige
      router.push("/chat");
    } else {
      // Si no, se redirige a Login
      router.push("/login");
    }
  }, [router]);

  return null; // No renderizar nada mientras redirige
}