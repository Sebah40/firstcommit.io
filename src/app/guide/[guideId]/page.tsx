"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { fetchGuideTitle } from "@/lib/supabase/queries/guide-detail";
import { slugify } from "@/lib/utils";

export default function GuideRedirectPage() {
  const { guideId } = useParams<{ guideId: string }>();
  const router = useRouter();

  useEffect(() => {
    if (!guideId) return;

    fetchGuideTitle(guideId).then((title) => {
      if (title) {
        router.replace(`/guide/${guideId}/${slugify(title)}`);
      } else {
        router.replace(`/guide/${guideId}/untitled`);
      }
    });
  }, [guideId, router]);

  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-muted-foreground" />
    </div>
  );
}
