"use client";
import { useState, useEffect } from "react";
import { X, Check, User, Mic } from "lucide-react";
import styles from "../css/SettingsModal.module.css";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPersona: string;
    onSave: (persona: string) => void;
}

const PERSONAS = [
    {
        id: "friendly",
        name: "Tutor Amigable",
        description: "Te apoya calurosamente. (Voz: Ava Multilingüe - Fluida en Inglés/Español)",
        color: "#4ade80",
        icon: <Mic size={20} />
    },
    {
        id: "strict",
        name: "Profesor Estricto",
        description: "Se enfoca en la gramática. Formal. (Voz: Andrew Multilingüe - Fluido)",
        color: "#f87171",
        icon: <Check size={20} />
    },
    {
        id: "encouraging",
        name: "Coach Motivador",
        description: "¡Mucha energía! (Voz: Brian Multilingüe - Fluido)",
        color: "#fbbf24",
        icon: <User size={20} />
    },
    {
        id: "chill",
        name: "Compañero Relajado",
        description: "Relajado y casual. (Voz: Emma Multilingüe - Fluida)",
        color: "#22d3ee",
        icon: <User size={20} />
    },
    {
        id: "professional",
        name: "Guía de Negocios",
        description: "Inglés formal de negocios. (Voz: Andrew Multilingüe - Tono Profesional)",
        color: "#94a3b8",
        icon: <User size={20} />
    }
];

export default function SettingsModal({ isOpen, onClose, currentPersona, onSave }: SettingsModalProps) {
    const [selected, setSelected] = useState(currentPersona);

    useEffect(() => {
        setSelected(currentPersona);
    }, [currentPersona]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(selected);
        onClose();
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Personalización del Chatbot</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.sectionTitle}>
                        <User size={18} />
                        <span>Selecciona Personalidad y Voz</span>
                    </div>

                    <div className={styles.grid}>
                        {PERSONAS.map((persona) => (
                            <div
                                key={persona.id}
                                className={`${styles.card} ${selected === persona.id ? styles.selected : ''}`}
                                onClick={() => setSelected(persona.id)}
                                style={{ borderColor: selected === persona.id ? persona.color : 'transparent' }}
                            >
                                <div className={styles.cardHeader}>
                                    <span className={styles.icon}>{persona.icon}</span>
                                    <span className={styles.name}>{persona.name}</span>
                                </div>
                                <p className={styles.description}>{persona.description}</p>
                                {selected === persona.id && (
                                    <div className={styles.check} style={{ backgroundColor: persona.color }}>
                                        <Check size={12} color="white" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
                    <button className={styles.saveBtn} onClick={handleSave}>Aplicar Cambios</button>
                </div>
            </div>
        </div>
    );
}
