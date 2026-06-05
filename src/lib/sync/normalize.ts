/**
 * Team-name normalization for matching across data sources. openfootball and
 * football-data.org name some countries differently — we canonicalize both
 * sides to the same key so matches line up.
 */

function strip(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // diacritics
    .replace(/[^a-z0-9]/g, "");
}

// keyed by stripped form -> canonical stripped form
const ALIASES: Record<string, string> = {
  korearepublic: "southkorea",
  republicofkorea: "southkorea",
  koreadpr: "northkorea",
  unitedstates: "usa",
  unitedstatesofamerica: "usa",
  us: "usa",
  czechia: "czechrepublic",
  turkiye: "turkey",
  iriran: "iran",
  cotedivoire: "ivorycoast",
  capeverdeislands: "capeverde",
  caboverde: "capeverde",
  congodr: "drcongo",
  democraticrepublicofthecongo: "drcongo",
  bosniaandherzegovina: "bosniaherzegovina",
  bosnia: "bosniaherzegovina",
  northmacedonia: "northmacedonia",
  saudiarabia: "saudiarabia",
  newzealand: "newzealand",
  southafrica: "southafrica",
};

export function canonTeam(name: string): string {
  const s = strip(name);
  return ALIASES[s] ?? s;
}

export function utcDateKey(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toISOString().slice(0, 10);
}

export function matchSignature(
  dateKey: string,
  home: string,
  away: string,
): string {
  return `${dateKey}|${canonTeam(home)}|${canonTeam(away)}`;
}
