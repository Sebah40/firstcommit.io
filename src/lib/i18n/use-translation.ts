"use client";

import { useContext } from "react";
import { LocaleContext } from "./locale-provider";

export function useTranslation() {
  return useContext(LocaleContext);
}
