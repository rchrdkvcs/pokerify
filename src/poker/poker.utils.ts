const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
const RANKS = [
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
] as const;

export function createDeck(): string[] {
  const deck: string[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(`${rank}_${suit}`);
    }
  }
  return deck;
}

export function shuffleDeck(deck: string[]): string[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(
  deck: string[],
  count: number,
): { cards: string[]; remainingDeck: string[] } {
  const cards = deck.slice(0, count);
  const remainingDeck = deck.slice(count);
  return { cards, remainingDeck };
}

export function calculateBlindPositions(
  dealerPosition: number,
  playerCount: number,
) {
  const smallBlindPosition = (dealerPosition + 1) % playerCount;
  const bigBlindPosition = (dealerPosition + 2) % playerCount;
  return { smallBlindPosition, bigBlindPosition };
}

export function getNextActivePlayerIndex(
  currentIndex: number,
  players: Array<{ status: string }>,
): number {
  let nextIndex = (currentIndex + 1) % players.length;
  let attempts = 0;

  while (attempts < players.length) {
    if (
      players[nextIndex].status === 'active' ||
      players[nextIndex].status === 'all_in'
    ) {
      return nextIndex;
    }
    nextIndex = (nextIndex + 1) % players.length;
    attempts++;
  }

  return currentIndex;
}

export function countActivePlayers(players: Array<{ status: string }>): number {
  return players.filter((p) => p.status === 'active' || p.status === 'all_in')
    .length;
}
