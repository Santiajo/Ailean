"use client";

import { useEffect } from "react";

export default function ThemeInitializer() {
    useEffect(() => {
        // Check local storage or preference immediately
        const storedTheme = localStorage.getItem('theme');
        const initialDark = storedTheme === 'light' ? false : true; // Default dark

        if (initialDark) {
            document.documentElement.classList.remove('light-mode');
        } else {
            document.documentElement.classList.add('light-mode');
        }

        // Optional: Add listener for storage changes if you want tabs to sync
        const handleStorageChange = () => {
            const newTheme = localStorage.getItem('theme');
            if (newTheme === 'light') {
                document.documentElement.classList.add('light-mode');
            } else {
                document.documentElement.classList.remove('light-mode');
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return null; // This component renders nothing
}
