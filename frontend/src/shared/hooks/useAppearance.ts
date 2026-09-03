import { useEffect, useState } from "react";

export type AccentTheme =
  | "neutral"
  | "amber"
  | "blue"
  | "cyan"
  | "emerald"
  | "fuchsia"
  | "green"
  | "indigo"
  | "lime"
  | "orange"
  | "pink"
  | "purple"
  | "red"
  | "rose"
  | "sky"
  | "teal"
  | "violet"
  | "yellow";

export type BaseTheme = "neutral" | "stone" | "zinc" | "mauve" | "olive" | "mist" | "taupe";

const ACCENT_KEY = "accent-theme";
const BASE_KEY = "base-theme";

const VALID_ACCENTS: AccentTheme[] = [
  "neutral",
  "amber",
  "blue",
  "cyan",
  "emerald",
  "fuchsia",
  "green",
  "indigo",
  "lime",
  "orange",
  "pink",
  "purple",
  "red",
  "rose",
  "sky",
  "teal",
  "violet",
  "yellow",
];
const VALID_BASES: BaseTheme[] = ["neutral", "stone", "zinc", "mauve", "olive", "mist", "taupe"];

function readAccent(): AccentTheme {
  const stored = localStorage.getItem(ACCENT_KEY);
  return VALID_ACCENTS.includes(stored as AccentTheme)
    ? (stored as AccentTheme)
    : "blue";
}

function readBase(): BaseTheme {
  const stored = localStorage.getItem(BASE_KEY);
  return VALID_BASES.includes(stored as BaseTheme)
    ? (stored as BaseTheme)
    : "zinc";
}

/**
 * Applies the stored appearance to <html>, correcting anything invalid.
 *
 * Called once at startup. index.html applies the same values before first
 * paint to avoid a flash, but this module owns the valid lists and has the
 * final say — the boot script deliberately does not duplicate them.
 */
export function applyStoredAppearance(): void {
  const accent = readAccent();
  const base = readBase();

  document.documentElement.setAttribute("data-theme", accent);
  document.documentElement.setAttribute("data-base", base);

  // Normalise storage too, so a bogus value does not survive the next reload.
  localStorage.setItem(ACCENT_KEY, accent);
  localStorage.setItem(BASE_KEY, base);
}

export function useAppearance() {
  const [accent, setAccentState] = useState<AccentTheme>(readAccent);
  const [base, setBaseState] = useState<BaseTheme>(readBase);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", accent);
    localStorage.setItem(ACCENT_KEY, accent);
  }, [accent]);

  useEffect(() => {
    document.documentElement.setAttribute("data-base", base);
    localStorage.setItem(BASE_KEY, base);
  }, [base]);

  const setAccent = (next: AccentTheme) => setAccentState(next);
  const setBase = (next: BaseTheme) => setBaseState(next);

  return { accent, setAccent, base, setBase };
}
