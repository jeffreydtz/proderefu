import { canonTeam } from "@/lib/sync/normalize";

/**
 * Flag emoji + 3-letter code by canonical team name (canonTeam()).
 * Used for the retro "crest" next to team names. Falls back gracefully when a
 * nation isn't listed (derives a code from the name, no emoji).
 */
interface FlagInfo {
  emoji: string;
  code: string;
}

const FLAGS: Record<string, FlagInfo> = {
  argentina: { emoji: "🇦🇷", code: "ARG" },
  brazil: { emoji: "🇧🇷", code: "BRA" },
  france: { emoji: "🇫🇷", code: "FRA" },
  spain: { emoji: "🇪🇸", code: "ESP" },
  england: { emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", code: "ENG" },
  germany: { emoji: "🇩🇪", code: "GER" },
  portugal: { emoji: "🇵🇹", code: "POR" },
  netherlands: { emoji: "🇳🇱", code: "NED" },
  belgium: { emoji: "🇧🇪", code: "BEL" },
  italy: { emoji: "🇮🇹", code: "ITA" },
  croatia: { emoji: "🇭🇷", code: "CRO" },
  uruguay: { emoji: "🇺🇾", code: "URU" },
  colombia: { emoji: "🇨🇴", code: "COL" },
  mexico: { emoji: "🇲🇽", code: "MEX" },
  usa: { emoji: "🇺🇸", code: "USA" },
  canada: { emoji: "🇨🇦", code: "CAN" },
  japan: { emoji: "🇯🇵", code: "JPN" },
  southkorea: { emoji: "🇰🇷", code: "KOR" },
  morocco: { emoji: "🇲🇦", code: "MAR" },
  senegal: { emoji: "🇸🇳", code: "SEN" },
  switzerland: { emoji: "🇨🇭", code: "SUI" },
  denmark: { emoji: "🇩🇰", code: "DEN" },
  poland: { emoji: "🇵🇱", code: "POL" },
  serbia: { emoji: "🇷🇸", code: "SRB" },
  austria: { emoji: "🇦🇹", code: "AUT" },
  ukraine: { emoji: "🇺🇦", code: "UKR" },
  turkey: { emoji: "🇹🇷", code: "TUR" },
  ecuador: { emoji: "🇪🇨", code: "ECU" },
  australia: { emoji: "🇦🇺", code: "AUS" },
  iran: { emoji: "🇮🇷", code: "IRN" },
  saudiarabia: { emoji: "🇸🇦", code: "KSA" },
  qatar: { emoji: "🇶🇦", code: "QAT" },
  ghana: { emoji: "🇬🇭", code: "GHA" },
  nigeria: { emoji: "🇳🇬", code: "NGA" },
  cameroon: { emoji: "🇨🇲", code: "CMR" },
  ivorycoast: { emoji: "🇨🇮", code: "CIV" },
  algeria: { emoji: "🇩🇿", code: "ALG" },
  tunisia: { emoji: "🇹🇳", code: "TUN" },
  egypt: { emoji: "🇪🇬", code: "EGY" },
  southafrica: { emoji: "🇿🇦", code: "RSA" },
  capeverde: { emoji: "🇨🇻", code: "CPV" },
  drcongo: { emoji: "🇨🇩", code: "COD" },
  scotland: { emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", code: "SCO" },
  wales: { emoji: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", code: "WAL" },
  norway: { emoji: "🇳🇴", code: "NOR" },
  sweden: { emoji: "🇸🇪", code: "SWE" },
  greece: { emoji: "🇬🇷", code: "GRE" },
  czechrepublic: { emoji: "🇨🇿", code: "CZE" },
  hungary: { emoji: "🇭🇺", code: "HUN" },
  romania: { emoji: "🇷🇴", code: "ROU" },
  paraguay: { emoji: "🇵🇾", code: "PAR" },
  peru: { emoji: "🇵🇪", code: "PER" },
  chile: { emoji: "🇨🇱", code: "CHI" },
  bolivia: { emoji: "🇧🇴", code: "BOL" },
  venezuela: { emoji: "🇻🇪", code: "VEN" },
  panama: { emoji: "🇵🇦", code: "PAN" },
  costarica: { emoji: "🇨🇷", code: "CRC" },
  honduras: { emoji: "🇭🇳", code: "HON" },
  jamaica: { emoji: "🇯🇲", code: "JAM" },
  newzealand: { emoji: "🇳🇿", code: "NZL" },
  iraq: { emoji: "🇮🇶", code: "IRQ" },
  uzbekistan: { emoji: "🇺🇿", code: "UZB" },
  jordan: { emoji: "🇯🇴", code: "JOR" },
  unitedarabemirates: { emoji: "🇦🇪", code: "UAE" },
  uae: { emoji: "🇦🇪", code: "UAE" },
  bosniaherzegovina: { emoji: "🇧🇦", code: "BIH" },
  haiti: { emoji: "🇭🇹", code: "HAI" },
  curacao: { emoji: "🇨🇼", code: "CUW" },
};

function deriveCode(name: string): string {
  const letters = name.replace(/[^A-Za-z]/g, "");
  return letters.slice(0, 3).toUpperCase() || "???";
}

export function teamFlag(name: string | null | undefined): FlagInfo {
  if (!name) return { emoji: "⚽", code: "—" };
  const info = FLAGS[canonTeam(name)];
  if (info) return info;
  return { emoji: "⚽", code: deriveCode(name) };
}

/** 3-letter code, preferring an explicit DB code over the derived one. */
export function teamCode(
  name: string | null | undefined,
  explicit?: string | null,
): string {
  if (explicit) return explicit.toUpperCase();
  return teamFlag(name).code;
}
