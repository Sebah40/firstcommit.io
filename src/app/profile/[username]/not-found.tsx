"use client";

import { useTranslation } from "@/lib/i18n/use-translation";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
        <span className="text-3xl">👤</span>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{t("notFound.user")}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        {t("notFound.userDesc")}
      </p>
    </div>
  );
}
