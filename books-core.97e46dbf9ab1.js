export function readerRoute(route, books) {
  const match = /^\/books\/(level-[1-6])(?:\/(\d+))?$/.exec(route);
  if (!match) return null;
  const book = books.find(item => item.id === match[1]);
  if (!book) return null;
  const requested = Number(match[2] || 1);
  return {book, index: Math.max(0, Math.min(book.pages.length - 1, requested - 1))};
}

// Read from the media clock, not wall-clock timers: pauses and buffering stay in sync.
export function wordAt(words, time) {
  return words.findIndex(word => time >= word.start && time < word.end);
}

export function swipeDirection(dx, dy, elapsed) {
  if (elapsed > 1200 || Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.5) return 0;
  return dx < 0 ? 1 : -1;
}

export const readingRates = [1, 0.9, 0.8, 0.7, 0.6, 0.5];
export const rateStorageKey = id => `wenwen:readers:speed:v1:${id}`;
export function readBookRate(storage, id) {
  try {
    const rate = Number(storage.getItem(rateStorageKey(id)));
    return readingRates.includes(rate) ? rate : 1;
  } catch {return 1;}
}
export function saveBookRate(storage, id, rate) {
  if (!readingRates.includes(rate)) return false;
  try {storage.setItem(rateStorageKey(id),String(rate));return true;} catch {return false;}
}
