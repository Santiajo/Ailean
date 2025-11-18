"use client";

import Link from "next/link";
import { useState } from "react";
import AvatarFollow from "../login/components/AvatarFollow";
import loginPageStyles from "../login/styles/loginPage.module.css";
import loginInfoStyles from "../login/styles/loginInfo.module.css";
import loginFormStyles from "../login/styles/loginForm.module.css";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!username.trim() || !email.trim() || !password.trim() || !confirm.trim()) {
      setError("Completa todos los campos");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      if (!res.ok) {
        let msg = "Error al registrarse";
        try {
          const data = await res.json();
          msg = (data && (data.detail || data.error)) || msg;
        } catch {}
        throw new Error(msg);
      }
      setSuccess(true);
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirm("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al registrarse";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={loginPageStyles.loginContainer}>
      <div className={loginInfoStyles.infoSide}>
        <div className={loginInfoStyles.aileanText}>AILEAN</div>
        <div className={loginInfoStyles.avatarWrapper}>
          <AvatarFollow />
        </div>
      </div>

      <div className={loginPageStyles.formSide}>
        <form noValidate onSubmit={handleSubmit} className={loginFormStyles.loginForm}>
          <h2>Crear Cuenta</h2>

          {error && (
            <div style={{ background: "#fde2e2", color: "#b91c1c", padding: 10, borderRadius: 10, width: "90%", maxWidth: 500 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: "#dcfce7", color: "#166534", padding: 12, borderRadius: 10, width: "90%", maxWidth: 500 }}>
              Registro exitoso. Ahora puedes <Link href="/login">iniciar sesión</Link>.
            </div>
          )}

          <div className={loginFormStyles.inputWrapper}>
            <input type="text" placeholder="Nombre de usuario" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>

          <div className={loginFormStyles.inputWrapper}>
            <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className={`${loginFormStyles.inputWrapper} ${loginFormStyles.passwordWrapper}`}>
            <input
              type={showPass ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className={loginFormStyles.eyeIcon} onClick={() => setShowPass(!showPass)}>
              {showPass ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              )}
            </span>
          </div>

          <div className={`${loginFormStyles.inputWrapper} ${loginFormStyles.passwordWrapper}`}>
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirmar contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <span className={loginFormStyles.eyeIcon} onClick={() => setShowConfirm(!showConfirm)}>
              {showConfirm ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              )}
            </span>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Registrando..." : "Registrarse"}
          </button>

          <div className={loginFormStyles.forgotPassword}>
            ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
          </div>
        </form>
      </div>
    </div>
  );
}