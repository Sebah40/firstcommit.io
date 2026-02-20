/**
 * Deterministic color from user ID.
 * Uses a proper hash to spread values across the full hue spectrum.
 */
function hashString(str: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h2 = Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  return Math.abs((h1 ^ h2) >>> 0);
}

export function getUserColor(userId: string): {
  bg: string;
  text: string;
} {
  const hash = hashString(userId);
  const hash2 = hashString(userId + "_salt");

  const hue = hash % 360;
  const saturation = 50 + (hash2 % 35);   // 50-85%
  const lightness = 42 + (hash2 % 18);    // 42-60%

  const bg = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const text = lightness > 55 ? "#1a1a1a" : "#ffffff";

  return { bg, text };
}
