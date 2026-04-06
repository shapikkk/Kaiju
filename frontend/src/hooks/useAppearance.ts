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
