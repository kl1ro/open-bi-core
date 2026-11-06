export function getRecordWithoutKey<Value>(
  record: Record<string, Value> | undefined,
  key: string,
): Record<string, Value> | undefined {
  if (!record) return;

  const recordWithoutKey = Object.fromEntries(
    Object.entries(record).filter(([recordKey]) => recordKey !== key),
  );

  return recordWithoutKey;
}

export function haveSameElements<Value>(first?: Value[], second?: Value[]) {
  if (!first || !second) return first === second;

  return (
    first.every((value) => second.includes(value)) &&
    second.every((value) => first.includes(value))
  );
}

export type WithRequired<Type, Key extends keyof Type> = Type & Required<Pick<Type, Key>>;
