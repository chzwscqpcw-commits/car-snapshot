import { planWeek, type IsoWeek, type Topic, type WeekPlan, type WeekSlot } from "./calendar";
import { pickColours, pickHowManyLeft, pickRegistrations, pickTheft, pickWrongTurn } from "./pickers/brand";
import { pickFailReasons, pickPassByArea, pickPassByModel, pickSeasonDue } from "./pickers/mot";
import { pickUsedPriceTrend, pickValueTable, pickWorthAfter } from "./pickers/sellers";
import type { AnyProps, Picked } from "./props";

export interface ClipSpec {
  /** e.g. "2026-W46-1-brand" — also the file stem. */
  id: string;
  slot: WeekSlot;
  picked: Picked<AnyProps>;
}

export interface WeekBuild {
  plan: WeekPlan;
  clips: [ClipSpec, ClipSpec, ClipSpec];
}

/** The picker for a topic, given how many times the topic has come up. */
export function pickTopic(topic: Topic, occurrence: number, plan: WeekPlan, music: boolean): Picked<AnyProps> {
  const w = plan.index;
  switch (topic) {
    case "theft":
      return pickTheft(occurrence, w, music);
    case "how-many-left":
      return pickHowManyLeft(occurrence, w, music);
    case "colours":
      return pickColours(occurrence, w, music);
    case "registrations":
      return pickRegistrations(occurrence, w, music);
    case "wrong-turn":
      return pickWrongTurn(occurrence, w, music);
    case "value-table":
      return pickValueTable(occurrence, w, music);
    case "worth-after":
      return pickWorthAfter(occurrence, w, music);
    case "used-price-trend":
      return pickUsedPriceTrend(occurrence, w, music);
    case "fail-reasons":
      return pickFailReasons(occurrence, w, music);
    case "pass-by-area":
      return pickPassByArea(occurrence, w, music);
    case "pass-by-model":
      return pickPassByModel(occurrence, w, music);
    case "season-due":
      return pickSeasonDue(new Date(`${plan.monday}T00:00:00Z`).getUTCMonth(), w, music);
  }
}

/** The three clips of a week, with their props and words. */
export function buildWeek(week: IsoWeek, music = true): WeekBuild {
  const plan = planWeek(week);
  const clips = plan.slots.map((slot, i) => ({
    id: `${plan.label}-${i + 1}-${slot.audience}`,
    slot,
    picked: pickTopic(slot.topic, slot.occurrence, plan, music),
  })) as [ClipSpec, ClipSpec, ClipSpec];
  return { plan, clips };
}
