import { Injectable } from '@nestjs/common';

interface Card {
  rank: string;
  suit: string;
}

interface HandResult {
  rank: number;
  name: string;
  value: number;
  tieBreakers: number[];
}

@Injectable()
export class HandEvaluatorService {
  private readonly RANK_VALUES: { [key: string]: number } = {
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14,
  };

  parseCard(cardString: string): Card {
    const [rank, suit] = cardString.split('_');
    return { rank, suit };
  }

  evaluateHand(playerCards: string[], communityCards: string[]): HandResult {
    const allCards = [...playerCards, ...communityCards].map((c) =>
      this.parseCard(c),
    );

    const bestHand = this.findBestFiveCardHand(allCards);
    return bestHand;
  }

  private findBestFiveCardHand(cards: Card[]): HandResult {
    const combinations = this.getCombinations(cards, 5);
    let bestHand: HandResult | null = null;

    for (const combination of combinations) {
      const handResult = this.evaluateFiveCards(combination);

      if (!bestHand || this.compareHands(handResult, bestHand) > 0) {
        bestHand = handResult;
      }
    }

    return bestHand!;
  }

  private getCombinations(arr: Card[], size: number): Card[][] {
    if (size === 1) return arr.map((el) => [el]);
    if (size === arr.length) return [arr];

    const result: Card[][] = [];
    for (let i = 0; i <= arr.length - size; i++) {
      const head = arr[i];
      const tailCombos = this.getCombinations(arr.slice(i + 1), size - 1);
      for (const combo of tailCombos) {
        result.push([head, ...combo]);
      }
    }
    return result;
  }

  private evaluateFiveCards(cards: Card[]): HandResult {
    const ranks = cards
      .map((c) => this.RANK_VALUES[c.rank])
      .sort((a, b) => b - a);
    const suits = cards.map((c) => c.suit);

    const isFlush = suits.every((s) => s === suits[0]);
    const isStraight = this.isStraight(ranks);

    const rankCounts = this.countRanks(ranks);
    const counts = Object.values(rankCounts).sort((a, b) => b - a);

    // Royal Flush
    if (isFlush && isStraight && ranks[0] === 14) {
      return {
        rank: 10,
        name: 'Royal Flush',
        value: 10000000,
        tieBreakers: ranks,
      };
    }

    // Straight Flush
    if (isFlush && isStraight) {
      return {
        rank: 9,
        name: 'Straight Flush',
        value: 9000000 + ranks[0],
        tieBreakers: ranks,
      };
    }

    // Four of a Kind
    if (counts[0] === 4) {
      const quadRank = this.getRankWithCount(rankCounts, 4);
      const kicker = this.getRankWithCount(rankCounts, 1);
      return {
        rank: 8,
        name: 'Four of a Kind',
        value: 8000000 + quadRank * 100 + kicker,
        tieBreakers: [quadRank, kicker],
      };
    }

    // Full House
    if (counts[0] === 3 && counts[1] === 2) {
      const tripRank = this.getRankWithCount(rankCounts, 3);
      const pairRank = this.getRankCount(rankCounts, 2);
      return {
        rank: 7,
        name: 'Full House',
        value: 7000000 + tripRank * 100 + pairRank,
        tieBreakers: [tripRank, pairRank],
      };
    }

    // Flush
    if (isFlush) {
      return {
        rank: 6,
        name: 'Flush',
        value: 6000000 + this.calculateHighCardValue(ranks),
        tieBreakers: ranks,
      };
    }

    // Straight
    if (isStraight) {
      return {
        rank: 5,
        name: 'Straight',
        value: 5000000 + ranks[0],
        tieBreakers: ranks,
      };
    }

    // Three of a Kind
    if (counts[0] === 3) {
      const tripRank = this.getRankWithCount(rankCounts, 3);
      const kickers = this.getKickers(rankCounts, [tripRank]);
      return {
        rank: 4,
        name: 'Three of a Kind',
        value:
          4000000 + tripRank * 10000 + this.calculateHighCardValue(kickers),
        tieBreakers: [tripRank, ...kickers],
      };
    }

    // Two Pair
    if (counts[0] === 2 && counts[1] === 2) {
      const pairs = this.getRanksWithCount(rankCounts, 2).sort((a, b) => b - a);
      const kicker = this.getRankWithCount(rankCounts, 1);
      return {
        rank: 3,
        name: 'Two Pair',
        value: 4000000 + pairs[0] * 10000 + pairs[1] * 100 + kicker,
        tieBreakers: [...pairs, kicker],
      };
    }

    // One Pair
    if (counts[0] === 2) {
      const pairRank = this.getRankWithCount(rankCounts, 2);
      const kickers = this.getKickers(rankCounts, [pairRank]);
      return {
        rank: 2,
        name: 'Pair',
        value:
          2000000 + pairRank * 10000 + this.calculateHighCardValue(kickers),
        tieBreakers: [pairRank, ...kickers],
      };
    }

    // High Card
    return {
      rank: 1,
      name: 'High Card',
      value: 1000000 + this.calculateHighCardValue(ranks),
      tieBreakers: ranks,
    };
  }

  private isStraight(ranks: number[]): boolean {
    const sorted = [...ranks].sort((a, b) => a - b);

    // Check regular straight
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1] - sorted[i] !== 1) {
        // Check for A-2-3-4-5 (wheel)
        if (
          sorted[4] === 14 &&
          sorted[0] === 2 &&
          sorted[1] === 3 &&
          sorted[2] === 4 &&
          sorted[3] === 5
        ) {
          return true;
        }
        return false;
      }
    }
    return true;
  }

  private countRanks(ranks: number[]): { [key: number]: number } {
    const counts: { [key: number]: number } = {};
    for (const rank of ranks) {
      counts[rank] = (counts[rank] || 0) + 1;
    }
    return counts;
  }

  private getRankWithCount(
    rankCounts: { [key: number]: number },
    count: number,
  ): number {
    for (const [rank, cnt] of Object.entries(rankCounts)) {
      if (cnt === count) return parseInt(rank);
    }
    return 0;
  }

  private getRanksWithCount(
    rankCounts: { [key: number]: number },
    count: number,
  ): number[] {
    const result: number[] = [];
    for (const [rank, cnt] of Object.entries(rankCounts)) {
      if (cnt === count) result.push(parseInt(rank));
    }
    return result;
  }

  private getRankCount(
    rankCounts: { [key: number]: number },
    count: number,
  ): number {
    for (const [rank, cnt] of Object.entries(rankCounts)) {
      if (cnt === count) return parseInt(rank);
    }
    return 0;
  }

  private getKickers(
    rankCounts: { [key: number]: number },
    excludeRanks: number[],
  ): number[] {
    const kickers: number[] = [];
    for (const [rank, _] of Object.entries(rankCounts)) {
      const rankNum = parseInt(rank);
      if (!excludeRanks.includes(rankNum)) {
        kickers.push(rankNum);
      }
    }
    return kickers.sort((a, b) => b - a);
  }

  private calculateHighCardValue(ranks: number[]): number {
    let value = 0;
    for (let i = 0; i < ranks.length; i++) {
      value += ranks[i] * Math.pow(100, ranks.length - i - 1);
    }
    return value;
  }

  compareHands(hand1: HandResult, hand2: HandResult): number {
    if (hand1.value > hand2.value) return 1;
    if (hand1.value < hand2.value) return -1;
    return 0;
  }

  findWinner(
    players: Array<{ userId: string; cards: string[] }>,
    communityCards: string[],
  ): { winnerId: string; hand: HandResult }[] {
    const results = players.map((player) => ({
      userId: player.userId,
      hand: this.evaluateHand(player.cards, communityCards),
    }));

    results.sort((a, b) => this.compareHands(b.hand, a.hand));

    const winners = [results[0]];
    for (let i = 1; i < results.length; i++) {
      if (this.compareHands(results[i].hand, results[0].hand) === 0) {
        winners.push(results[i]);
      } else {
        break;
      }
    }

    return winners.map((w) => ({ winnerId: w.userId, hand: w.hand }));
  }
}
