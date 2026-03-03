import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext";

// Apply persisted theme class before React mounts to avoid flash and ensure persistence
try {
	const saved = localStorage.getItem("theme");
	if (saved === "dark") document.documentElement.classList.add("dark");
	else if (saved === "light") document.documentElement.classList.remove("dark");
	else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) document.documentElement.classList.add("dark");
} catch (e) {
	// ignore
}

createRoot(document.getElementById("root")!).render(
	<ThemeProvider>
		<App />
	</ThemeProvider>
);
