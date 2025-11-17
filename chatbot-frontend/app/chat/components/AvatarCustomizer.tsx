"use client";

interface AvatarCustomizerProps {
  setAvatarColor: (color: string) => void;
  toggleAccessory: (accessory: "hat" | "glasses") => void;
}

const accessories = [
  { name: "Sombrero", key: "hat" as const },
  { name: "Gafas", key: "glasses" as const },
];

const colors = [
  "#6492caff", 
  "#ffd0a3", 
  "#a8e6cf", 
  "#ffb6b9", 
  "#f3eac2", 
  "#c1c8e4", 
];

export default function AvatarCustomizer({ setAvatarColor, toggleAccessory }: AvatarCustomizerProps) {
  return (
    <div style={{
      padding: 20,
      background: "#2c2c2c",  
      borderRadius: 16,
      width: 240,
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
      color: "#fff",
      fontFamily: "Arial, sans-serif",
    }}>
      <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600 }}>Color del avatar</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {colors.map((c) => (
          <div
            key={c}
            onClick={() => setAvatarColor(c)}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: c,
              cursor: "pointer",
              border: "2px solid #fff",
              boxShadow: "0 0 5px rgba(0,0,0,0.5)",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />
        ))}
      </div>

      <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600 }}>Accesorios</h3>
      <div style={{ display: "flex", gap: 10 }}>
        {accessories.map((acc) => (
          <button
            key={acc.key}
            onClick={() => toggleAccessory(acc.key)}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 8,
              border: "none",
              background: "#444",
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#555")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#444")}
          >
            {acc.name}
          </button>
        ))}
      </div>
    </div>
  );
}
