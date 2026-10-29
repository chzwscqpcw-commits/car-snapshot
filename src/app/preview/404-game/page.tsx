"use client";

import PreviewGate from "@/components/preview/PreviewGate";
import NotFoundView from "@/components/not-found/NotFoundView";

/**
 * The 404 page with the "Took a wrong turn" driving game, to try before it
 * replaces the live 404. Going live is one prop in src/app/not-found.tsx.
 */
export default function WrongTurnPreviewPage() {
  return (
    <PreviewGate>
      <NotFoundView game />
    </PreviewGate>
  );
}
