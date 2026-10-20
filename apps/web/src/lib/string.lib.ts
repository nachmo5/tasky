export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// "firstOccurrenceStartDate" → "First occurrence start date", "taskHTMLId" → "Task html id"
export function camelCaseToSentence(str: string) {
  const words = str
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2") // fooBar → foo Bar
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2") // HTMLId → HTML Id
    .toLowerCase();
  return capitalize(words);
}
