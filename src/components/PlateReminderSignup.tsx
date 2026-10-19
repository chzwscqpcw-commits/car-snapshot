"use client";

import type { ComponentProps } from "react";
import MOTReminderSignup from "@/components/MOTReminderSignup";
import { usePlate } from "@/lib/plate-url";

/**
 * The /mot-reminder signup, pre-filled with the plate a results page linked
 * here with. Links now carry it as /mot-reminder#vrm=… (src/lib/plate-url.ts),
 * which only the browser can read; `presetReg` still covers legacy ?vrm=
 * links the server saw. Keyed on the plate so the form re-initialises (and
 * looks the car up) once the plate is known after hydration.
 */
export default function PlateReminderSignup({
  presetReg,
  ...props
}: Omit<ComponentProps<typeof MOTReminderSignup>, "regNumber"> & { presetReg?: string }) {
  const plate = usePlate() ?? presetReg;
  return <MOTReminderSignup key={plate ?? "none"} {...props} regNumber={plate} />;
}
