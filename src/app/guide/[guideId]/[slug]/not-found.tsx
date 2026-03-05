"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/use-translation";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
        <span className="text-3xl">🔍</span>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{t("notFound.guide")}</h3>
      <p className="mb-4 max-w-sm text-sm text-muted-foreground">
        {t("notFound.guideDesc")}
      </p>
      <Link
        href="/"
        className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
      >
        {t("notFound.goHome")}
      </Link>
    </div>
  );
}
