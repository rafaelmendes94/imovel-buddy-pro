const LOWER_WORDS = new Set(["a", "as", "da", "das", "de", "do", "dos", "e", "em", "na", "nas", "no", "nos"]);
const ROMAN_RE = /^(i|ii|iii|iv|v|vi|vii|viii|ix|x)$/i;

function formatWord(word: string, index: number) {
  const lower = word.toLocaleLowerCase("pt-BR");

  if (index > 0 && LOWER_WORDS.has(lower)) return lower;
  if (ROMAN_RE.test(word)) return word.toLocaleUpperCase("pt-BR");
  if (/^[a-z]\.[a-z]\.?$/i.test(word)) return word.toLocaleUpperCase("pt-BR");

  return lower.replace(/(^|[-'’])(\p{L})/gu, (_, prefix, letter) =>
    `${prefix}${letter.toLocaleUpperCase("pt-BR")}`
  );
}

export function formatProperName(value?: string | null) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map(formatWord)
    .join(" ");
}
