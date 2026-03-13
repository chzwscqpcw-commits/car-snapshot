/**
 * MOT advisory explainer — maps common advisory text patterns to
 * plain-English explanations and severity indicators.
 */

export type Severity = "minor" | "worth-fixing" | "safety-concern";

interface AdvisoryRule {
  pattern: RegExp;
  explanation: string;
  severity: Severity;
}

const RULES: AdvisoryRule[] = [
  // ── Brakes ──
  { pattern: /brake.*disc.*worn/i, explanation: "The brake disc surface is wearing thin. If left, braking distance increases and it may fail at next MOT.", severity: "worth-fixing" },
  { pattern: /brake.*pad.*worn/i, explanation: "Brake pads are getting thin. They're cheap to replace and keep stopping distances safe.", severity: "worth-fixing" },
  { pattern: /brake.*fluid/i, explanation: "Low or contaminated brake fluid reduces braking effectiveness. A fluid change is quick and inexpensive.", severity: "safety-concern" },
  { pattern: /brake.*pipe.*corrod/i, explanation: "Corrosion on brake pipes can lead to a fluid leak and brake failure. Should be inspected and replaced if needed.", severity: "safety-concern" },
  { pattern: /brake.*hose/i, explanation: "A worn or cracked brake hose can leak fluid under pressure. Worth replacing before it fails.", severity: "safety-concern" },
  { pattern: /handbrake.*barely/i, explanation: "The handbrake is only just holding. Usually a cable adjustment or new shoes — straightforward fix.", severity: "worth-fixing" },
  { pattern: /parking brake.*efficiency/i, explanation: "The parking brake isn't holding well enough. Usually needs adjustment or new shoes/pads.", severity: "worth-fixing" },

  // ── Tyres ──
  { pattern: /tyre.*worn.*close.*legal/i, explanation: "Tread depth is near the 1.6mm legal minimum. Replace soon — a worn tyre is a fine and 3 penalty points per tyre.", severity: "safety-concern" },
  { pattern: /tyre.*slightly.*damaged/i, explanation: "Minor damage to the tyre sidewall or tread. Monitor it, but replacement may be needed soon.", severity: "minor" },
  { pattern: /tyre.*perish/i, explanation: "Rubber is degrading with age. Even with good tread, perished tyres grip poorly in the wet.", severity: "worth-fixing" },

  // ── Suspension ──
  { pattern: /suspension.*arm.*bush.*play/i, explanation: "A worn bush causes knocking sounds and vague steering. Not dangerous yet but will worsen.", severity: "minor" },
  { pattern: /suspension.*arm.*bush.*deteriorat/i, explanation: "The rubber bush is breaking down. Replacement stops the play getting worse and helps tyre wear.", severity: "worth-fixing" },
  { pattern: /shock.*absorber/i, explanation: "A leaking or worn shock absorber reduces grip over bumps. Affects handling and braking distance.", severity: "worth-fixing" },
  { pattern: /anti.*roll.*bar/i, explanation: "A worn anti-roll bar link causes clunking over bumps. Not urgent but worsens body roll in corners.", severity: "minor" },
  { pattern: /coil.*spring.*broken/i, explanation: "A broken coil spring can drop the car on one corner and damage the tyre. Should be replaced promptly.", severity: "safety-concern" },
  { pattern: /coil.*spring.*corroded/i, explanation: "Corrosion weakens the spring — it may snap. Common on UK cars due to salt. Keep an eye on it.", severity: "worth-fixing" },
  { pattern: /ball.*joint.*wear/i, explanation: "Worn ball joints affect steering precision. If they fail completely the wheel can collapse inward.", severity: "worth-fixing" },
  { pattern: /track.*rod.*end/i, explanation: "A worn track rod end causes loose steering. Inexpensive to replace and essential for safe handling.", severity: "worth-fixing" },
  { pattern: /wheel.*bearing/i, explanation: "A humming or droning noise that changes with speed. Replacement is straightforward but don't ignore it.", severity: "worth-fixing" },

  // ── Exhaust & Emissions ──
  { pattern: /exhaust.*has.*slight.*leak/i, explanation: "A small exhaust leak lets fumes escape. Usually worsens over time — a patch or new section fixes it.", severity: "minor" },
  { pattern: /exhaust.*corroded/i, explanation: "Exhaust corrosion is normal on older cars. It may need replacing before the next MOT.", severity: "minor" },
  { pattern: /catalytic.*converter/i, explanation: "The catalytic converter reduces harmful emissions. If it fails, the car won't pass its next MOT emissions test.", severity: "worth-fixing" },
  { pattern: /lambda.*sensor/i, explanation: "The oxygen sensor helps the engine run efficiently. A faulty one increases fuel consumption and emissions.", severity: "worth-fixing" },
  { pattern: /exhaust.*emission/i, explanation: "Emissions are borderline. Could be a simple fix (spark plugs, air filter) or indicate a deeper engine issue.", severity: "worth-fixing" },

  // ── Steering ──
  { pattern: /steering.*rack.*gaiter/i, explanation: "A torn gaiter lets dirt into the steering rack. Cheap to replace now; expensive if the rack gets damaged.", severity: "minor" },
  { pattern: /power.*steering.*leak/i, explanation: "A fluid leak means the power steering pump is working harder. Can lead to loss of assist.", severity: "worth-fixing" },
  { pattern: /steering.*wheel.*play/i, explanation: "Excessive play means the wheel moves before the car turns. Usually worn joints or rack — get it checked.", severity: "worth-fixing" },

  // ── Lights ──
  { pattern: /headlamp.*aim/i, explanation: "Headlight aim is slightly off. Can dazzle oncoming drivers or reduce your visibility. Easy adjustment.", severity: "minor" },
  { pattern: /headlamp.*deteriorat/i, explanation: "The headlamp lens is cloudy or yellowed, reducing light output. Can be polished or the unit replaced.", severity: "minor" },
  { pattern: /headlamp.*insecure/i, explanation: "The headlamp unit is loose in its mounting. Should be secured to maintain correct aim.", severity: "minor" },
  { pattern: /number.*plate.*lamp/i, explanation: "The rear number plate light is dim or flickering. Usually just a bulb change.", severity: "minor" },
  { pattern: /fog.*lamp/i, explanation: "A fog lamp issue — usually a blown bulb or cracked lens. Only needed in poor visibility but must work for MOT.", severity: "minor" },

  // ── Body & Structure ──
  { pattern: /corrosion.*structural/i, explanation: "Rust on a structural part of the car (sills, subframe, etc.). Can be serious — get a specialist assessment.", severity: "safety-concern" },
  { pattern: /corrosion.*non.*structural/i, explanation: "Surface rust on a non-critical panel. Cosmetic issue — not a safety risk but may spread if untreated.", severity: "minor" },
  { pattern: /sill.*corroded/i, explanation: "Sills are structural — they protect you in a side impact. Corrosion here needs welding before it fails MOT.", severity: "safety-concern" },
  { pattern: /subframe.*corroded/i, explanation: "The subframe holds the engine and suspension. Serious corrosion here is expensive and potentially dangerous.", severity: "safety-concern" },

  // ── Windscreen & Wipers ──
  { pattern: /windscreen.*chip/i, explanation: "A chip in the windscreen. If in the driver's line of sight, it could fail MOT. Often repairable for free under insurance.", severity: "minor" },
  { pattern: /wiper.*blade/i, explanation: "Wiper blades aren't clearing properly. A cheap and easy replacement — buy quality blades.", severity: "minor" },
  { pattern: /washer.*jet/i, explanation: "Screen washers aren't working or aimed correctly. Usually a blocked nozzle — clear with a pin.", severity: "minor" },

  // ── Fuel & Engine ──
  { pattern: /oil.*leak/i, explanation: "An oil leak from the engine or gearbox. Small seepage is common on older cars; a drip needs attention.", severity: "worth-fixing" },
  { pattern: /fuel.*leak/i, explanation: "Any fuel leak is a fire risk. Must be investigated and repaired immediately.", severity: "safety-concern" },
  { pattern: /engine.*mount.*deteriorat/i, explanation: "Worn engine mounts cause vibration and clunking. The engine moves more than it should under load.", severity: "worth-fixing" },

  // ── Miscellaneous ──
  { pattern: /battery.*not.*secure/i, explanation: "A loose battery can shift in the engine bay and cause electrical faults or short circuits.", severity: "minor" },
  { pattern: /registration.*plate/i, explanation: "The number plate is damaged, faded, or incorrectly spaced. Must be legal format to pass MOT.", severity: "minor" },
  { pattern: /seat.*belt.*slightly/i, explanation: "The seat belt is showing minor wear. It still works but may not restrain properly in a serious collision.", severity: "worth-fixing" },
  { pattern: /horn.*note/i, explanation: "The horn sound is weak or intermittent. Usually a dying horn unit — cheap to replace.", severity: "minor" },
  { pattern: /mirror.*damaged/i, explanation: "A cracked or loose mirror reduces visibility. Replace the glass or the whole unit.", severity: "minor" },
  { pattern: /child.*seat.*anchor/i, explanation: "The ISOFIX or child seat anchor point has an issue. Essential if you carry children.", severity: "worth-fixing" },
  { pattern: /drive.*shaft.*boot/i, explanation: "A split CV boot lets grease out and dirt in. Cheap to replace now; a failed CV joint is expensive.", severity: "worth-fixing" },
  { pattern: /drive.*shaft.*joint/i, explanation: "A worn CV joint clicks on full lock turns. Will worsen — replace the joint or whole driveshaft.", severity: "worth-fixing" },
];

/**
 * Match an advisory text string against known patterns and return
 * a plain-English explanation + severity, or null if no match.
 */
export function getAdvisoryExplanation(
  text: string
): { explanation: string; severity: Severity } | null {
  for (const rule of RULES) {
    if (rule.pattern.test(text)) {
      return { explanation: rule.explanation, severity: rule.severity };
    }
  }
  return null;
}

export function severityLabel(s: Severity): string {
  switch (s) {
    case "minor":
      return "Minor";
    case "worth-fixing":
      return "Worth Fixing";
    case "safety-concern":
      return "Safety Concern";
  }
}

export function severityColor(s: Severity): string {
  switch (s) {
    case "minor":
      return "text-slate-400";
    case "worth-fixing":
      return "text-amber-400";
    case "safety-concern":
      return "text-red-400";
  }
}
