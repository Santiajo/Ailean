"use client"; 

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../styles/loginForm.module.css";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Estados para manejar errores y carga visualmente
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
            username: username,
            password: password 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Guardar tokens (Access y Refresh)
        localStorage.setItem("accessToken", data.access);
        localStorage.setItem("refreshToken", data.refresh);

        // Redirigir al usuario
        console.log("Login exitoso!");
        router.push("/chat");
      } else {
        // Si falla (401), mostrar error
        setError("Credenciales incorrectas. Intenta de nuevo.");
      }
    } catch (err) {
      console.error("Error de red:", err);
      setError("Error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <form onSubmit={handleLogin} className={styles.loginForm}>
    <h2>Iniciar Sesión</h2>

    {/* Mensaje de error visual */}
    {error && <p style={{ color: "red", fontSize: "0.9rem" }}>{error}</p>}

    {/* Campo correo / usuario */}
    <div className={styles.inputWrapper}>
      <input
        type="text"
        placeholder="Nombre de usuario"
        value={username} 
        onChange={(e) => setUsername(e.target.value)}
        required
        disabled={isLoading}
      />
    </div>

    {/* Campo contraseña */}
    <div className={`${styles.inputWrapper} ${styles.passwordWrapper}`}>
      <input
        type={showPassword ? "text" : "password"}
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={isLoading}
      />
      <span
        className={styles.eyeIcon}
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          )}
        </span>
      </div>

      <div className={styles.forgotPassword}>Olvidaste tu contraseña?</div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? "Cargando..." : "Iniciar Sesión"}
      </button>
    </form>
  );
}
