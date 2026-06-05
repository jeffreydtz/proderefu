import type { FootballProvider } from "../provider";
import { footballDataProvider } from "./footballData";

const PROVIDERS: Record<string, FootballProvider> = {
  footballData: footballDataProvider,
};

export function getProvider(name: string): FootballProvider {
  return PROVIDERS[name] ?? footballDataProvider;
}
