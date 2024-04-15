

export function parseBoolean(envValue: string | undefined): boolean {

  if (!envValue) return false;

  const normalizedValue = envValue.toLowerCase();
  return normalizedValue === 'true' || normalizedValue === 'yes' || /^[1-9]\d*$/.test(normalizedValue);
}
