export type Locale = "en" | "es";

export const LOCALES: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];

export const DEFAULT_LOCALE: Locale = "en";
export const STORAGE_KEY = "firstcommit-locale";
