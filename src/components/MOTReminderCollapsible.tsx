"use client";

import MOTReminderSignup from "@/components/MOTReminderSignup";

type Context = "generic" | "due-soon" | "expired" | "post-lookup";

interface Props {
  context: Context;
  triggerVariant?: string;
  regNumber?: string;
  motExpiryDate?: string;
  makeModel?: string;
}

/**
 * Renders the MOT reminder form directly.
 *
 * Formerly a tap-to-expand chip — but the dashboard funnel showed the expand
 * gate was the conversion killer (309 chip_views → 2 expands/week, ~0.6%). The
 * form is now the affordance, not a button to reveal it. (Name kept to avoid
 * churn across its import sites; it no longer collapses.)
 */
export default function MOTReminderCollapsible({
  context,
  triggerVariant,
  regNumber,
  motExpiryDate,
  makeModel,
}: Props) {
  return (
    <MOTReminderSignup
      context={context}
      triggerVariant={triggerVariant}
      regNumber={regNumber}
      motExpiryDate={motExpiryDate}
      makeModel={makeModel}
      allowTimingPicker
    />
  );
}
