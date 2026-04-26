type RuleBag = Record<string, unknown> | null | undefined;

function getNumericRule(rules: RuleBag, key: string): number | null {
  const value = rules?.[key];
  return typeof value === "number" ? value : null;
}

export function resolveRosterSize(playerCount: number | null | undefined, ...ruleBags: RuleBag[]) {
  for (const rules of ruleBags) {
    const rosterSize = getNumericRule(rules, "roster_size");
    if (rosterSize != null) {
      return rosterSize;
    }
  }

  for (const rules of ruleBags) {
    const substitutes = getNumericRule(rules, "substitutes");
    if (substitutes != null && playerCount != null) {
      return playerCount + substitutes;
    }
  }

  for (const rules of ruleBags) {
    const maxAthletes = getNumericRule(rules, "max_athletes");
    if (maxAthletes != null) {
      return maxAthletes;
    }
  }

  return playerCount ?? 1;
}
