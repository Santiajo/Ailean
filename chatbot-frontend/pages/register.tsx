import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User2, Mail, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Playfair_Display, Manrope } from "next/font/google";
import personImg from "../img/image.png";
import logoImg from "../img/logo.png";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-playfair" });
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-manrope" });

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [uFocus, setUFocus] = useState(false);
  const [eFocus, setEFocus] = useState(false);
  const [pFocus, setPFocus] = useState(false);
  const [cFocus, setCFocus] = useState(false);

  useEffect(() => {
    const update = () => setIsNarrow(window.innerWidth < 900);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const portal = document.querySelector("nextjs-portal") as HTMLElement | null;
    const container = document.querySelector("#nextjs__container") as HTMLElement | null;
    const btn = Array.from(document.querySelectorAll("button")).find((b) => b.getAttribute("aria-label")?.toLowerCase().includes("next")) as HTMLElement | null;
    [portal, container, btn].forEach((el) => {
      if (el) el.style.display = "none";
    });
  }, []);

  const getStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const labels = ["Muy débil", "Débil", "Media", "Fuerte", "Muy fuerte"];
    const colors = ["#ef4444", "#f59e0b", "#fbbf24", "#22c55e", "#16a34a"];
    return { score, label: labels[score], color: colors[score] };
  };

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
    <div
      className={`${playfair.variable} ${manrope.variable}`}
      style={{
        position: "relative",
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        background: "#a7f0f2",
        boxSizing: "border-box",
        overflow: "hidden",
        justifyContent: "center",
        gap: 40,
        padding: "32px 0",
      }}
    >
      <div style={{ position: "absolute", top: 16, left: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <Image src={logoImg} alt="AILEAN" width={40} height={40} />
        <div style={{ fontSize: 24, fontWeight: 800, color: "#1f2937", fontFamily: "var(--font-manrope)" }}>AILEAN</div>
      </div>
      
      <div
        style={{
          display: isNarrow ? "none" : "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          width: 520,
        }}
      >
        
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          style={{ marginTop: 30, textAlign: "left", width: 440 }}>
          <div style={{ fontSize: 40, fontWeight: 800, color: "#0f172a", fontFamily: "var(--font-manrope)" }}>Regístrate en</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", fontFamily: "var(--font-manrope)" }}>AILEAN</div>
        </motion.div>
        <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}
          style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Image src={personImg} alt="Persona AILEAN" priority style={{ width: 320, height: "auto", filter: "drop-shadow(0 24px 36px rgba(15,23,42,0.25))" }} />
        </motion.div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isNarrow ? 12 : 20,
          width: 520,
        }}
      >
        <motion.form
          noValidate
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            background: "rgba(255,255,255,0.7)",
            padding: isNarrow ? 22 : 34,
            borderRadius: 22,
            boxShadow: "0 20px 40px rgba(79,70,229,0.22)",
            backdropFilter: "saturate(160%) blur(8px)",
            overflow: "hidden",
            boxSizing: "border-box",
            border: "1px solid rgba(79,163,255,0.35)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: "#0f172a", letterSpacing: 0.3, fontFamily: "var(--font-manrope)" }}>Crear cuenta</div>
            <Link href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 14, color: "#4338ca", fontWeight: 700, textDecoration: "none", padding: "6px 12px", borderRadius: 9999, background: "rgba(67,56,202,0.08)", border: "1px solid rgba(67,56,202,0.18)", boxShadow: "0 2px 8px rgba(67,56,202,0.12)" }}>Iniciar sesión</Link>
          </div>
          <div style={{ height: 2, background: "linear-gradient(90deg, rgba(79,163,255,0.0), rgba(79,163,255,0.35), rgba(79,163,255,0.0))" }} />
          {error && (
            <div style={{ background: "#fde2e2", color: "#b91c1c", padding: 10, borderRadius: 10 }}>{error}</div>
          )}
          {success && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#dcfce7", color: "#166534", padding: 12, borderRadius: 10 }}>
              <CheckCircle2 size={20} />
              <span>Registro exitoso. Ahora puedes <Link href="/login" style={{ color: "#22c55e", fontWeight: 700 }}>iniciar sesión</Link>.</span>
            </div>
          )}

          <div style={{ position: "relative", alignSelf: "center", width: "90%", maxWidth: 460, padding: "0 12px" }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#334155", fontFamily: "var(--font-manrope)", fontWeight: 600 }}>Nombre de usuario</label>
            <div style={{ position: "absolute", left: 14, top: 34, color: "#6b7280" }}>
              <User2 size={18} />
            </div>
            <input
              className="input-base"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nombre de usuario"
              onFocus={() => setUFocus(true)}
              onBlur={() => setUFocus(false)}
              style={{
                padding: "14px 16px 14px 42px",
                borderRadius: 16,
                border: uFocus ? "1px solid #6366f1" : "1px solid rgba(203,213,225,0.7)",
                background: "rgba(255,255,255,0.95)",
                width: "calc(100% - 40px)",
                boxShadow: uFocus ? "0 0 0 3px rgba(99,102,241,0.2), 0 2px 8px rgba(15,23,42,0.06)" : "0 2px 8px rgba(15,23,42,0.06)",
                outline: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
                fontFamily: "var(--font-manrope)",
              }}
            />
          </div>

          <div style={{ position: "relative", alignSelf: "center", width: "90%", maxWidth: 460, padding: "0 12px" }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#334155", fontFamily: "var(--font-manrope)", fontWeight: 600 }}>Correo electrónico</label>
            <div style={{ position: "absolute", left: 14, top: 34, color: "#6b7280" }}>
              <Mail size={18} />
            </div>
            <input
              className="input-base"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              onFocus={() => setEFocus(true)}
              onBlur={() => setEFocus(false)}
              style={{
                padding: "14px 16px 14px 42px",
                borderRadius: 16,
                border: eFocus ? "1px solid #6366f1" : "1px solid rgba(203,213,225,0.7)",
                background: "rgba(255,255,255,0.95)",
                width: "calc(100% - 40px)",
                boxShadow: eFocus ? "0 0 0 3px rgba(99,102,241,0.2), 0 2px 8px rgba(15,23,42,0.06)" : "0 2px 8px rgba(15,23,42,0.06)",
                outline: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
                fontFamily: "var(--font-manrope)",
            }}
          />
        </div>

          <div style={{ position: "relative", alignSelf: "center", width: "90%", maxWidth: 460, padding: "0 12px" }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#334155", fontFamily: "var(--font-manrope)", fontWeight: 600 }}>Contraseña</label>
            <div style={{ position: "absolute", left: 14, top: 34, color: "#6b7280" }}>
              <Lock size={18} />
            </div>
            <input
              className="input-base"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              onFocus={() => setPFocus(true)}
              onBlur={() => setPFocus(false)}
              style={{
                padding: "14px 16px 14px 42px",
                borderRadius: 16,
                border: pFocus ? "1px solid #6366f1" : "1px solid rgba(203,213,225,0.7)",
                background: "rgba(255,255,255,0.95)",
                width: "calc(100% - 40px)",
                boxShadow: pFocus ? "0 0 0 3px rgba(99,102,241,0.2), 0 2px 8px rgba(15,23,42,0.06)" : "0 2px 8px rgba(15,23,42,0.06)",
                outline: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
                fontFamily: "var(--font-manrope)",
              }}
            />
            <button type="button" onClick={() => setShowPass((p) => !p)}
              style={{ position: "absolute", right: 14, top: 34, border: "none", background: "transparent", cursor: "pointer", color: "#64748b" }}>
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {password && (
              <div style={{ marginTop: 12 }}>
                <div style={{ height: 8, background: "#e5e7eb", borderRadius: 999 }}>
                  <div style={{ height: 8, width: `${(getStrength(password).score / 4) * 100}%`, background: getStrength(password).color, borderRadius: 999 }} />
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: getStrength(password).color }}>{getStrength(password).label}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6, fontSize: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: password.length >= 8 ? "#16a34a" : "#6b7280" }}>
                    <CheckCircle2 size={14} />
                    8+ caracteres
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: /[A-Z]/.test(password) ? "#16a34a" : "#6b7280" }}>
                    <CheckCircle2 size={14} />
                    Mayúscula
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: /[0-9]/.test(password) ? "#16a34a" : "#6b7280" }}>
                    <CheckCircle2 size={14} />
                    Número
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: /[^A-Za-z0-9]/.test(password) ? "#16a34a" : "#6b7280" }}>
                    <CheckCircle2 size={14} />
                    Símbolo
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ position: "relative", alignSelf: "center", width: "90%", maxWidth: 460, padding: "0 12px" }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#334155", fontFamily: "var(--font-manrope)", fontWeight: 600 }}>Confirmar contraseña</label>
            <div style={{ position: "absolute", left: 14, top: 34, color: "#6b7280" }}>
              <Lock size={18} />
            </div>
            <input
              className="input-base"
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirmar contraseña"
              onFocus={() => setCFocus(true)}
              onBlur={() => setCFocus(false)}
              style={{
                padding: "14px 16px 14px 42px",
                borderRadius: 16,
                border: cFocus ? "1px solid #6366f1" : "1px solid rgba(203,213,225,0.7)",
                background: "rgba(255,255,255,0.95)",
                width: "calc(100% - 40px)",
                boxShadow: cFocus ? "0 0 0 3px rgba(99,102,241,0.2), 0 2px 8px rgba(15,23,42,0.06)" : "0 2px 8px rgba(15,23,42,0.06)",
                outline: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
                fontFamily: "var(--font-manrope)",
              }}
            />
            <button type="button" onClick={() => setShowConfirm((p) => !p)}
              style={{ position: "absolute", right: 14, top: 34, border: "none", background: "transparent", cursor: "pointer", color: "#64748b" }}>
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {!!confirm && confirm !== password && (
              <div style={{ marginTop: 6, fontSize: 12, color: "#ef4444" }}>Las contraseñas no coinciden</div>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            style={{
              marginTop: 10,
              padding: "16px 18px",
              borderRadius: 16,
              border: "none",
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #6366f1 100%)",
              color: "white",
              fontWeight: 700,
              boxShadow: "0 20px 36px rgba(79,70,229,0.28)",
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: 0.4,
              fontFamily: "var(--font-manrope)",
            }}
          >
            {loading ? "Registrando..." : "Registrarse"}
          </motion.button>
        </motion.form>
      </div>
      <style jsx>{`
        .input-base::placeholder { color: #94a3b8; }
        .link-primary:hover { color: #3730a3; }
      `}</style>
      <style jsx global>{`
        html, body, #__next {
          margin: 0;
          padding: 0;
          height: 100%;
          background: #a7f0f2;
        }
      `}</style>
    </div>
  );
}