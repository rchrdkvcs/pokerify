import { Injectable } from '@nestjs/common';
import { Player, PlayerStatus, PlayerType } from '../players/player.schema';
import { PlayerAction } from '../poker/poker.types';

@Injectable()
export class PokerAiService {
  /**
   * Basic AI decision making
   * This is a simple implementation that makes random decisions with some basic logic
   */
  makeDecision(
    player: Player,
    currentBet: number,
  ): { action: PlayerAction; amount?: number } {
    const callAmount = currentBet - player.currentBet;

    // If there is no bet to call, check.
    if (callAmount === 0) {
      return { action: PlayerAction.CHECK };
    }

    // If the AI can afford to call, call.
    if (player.stack >= callAmount) {
      return { action: PlayerAction.CALL, amount: callAmount };
    }

    // Otherwise, fold.
    return { action: PlayerAction.FOLD };
  }

  /**
   * Generate AI players for a table
   */
  generateAiPlayers(count: number, startingStack: number): Player[] {
    const aiPlayers: Player[] = [];

    for (let i = 0; i < count; i++) {
      aiPlayers.push({
        userId: `ai_${Date.now()}_${i}`,
        username: `AI Player ${i + 1}`,
        type: PlayerType.AI,
        stack: startingStack,
        currentBet: 0,
        cards: [],
        position: -1, // Position will be assigned by the table
        status: PlayerStatus.ACTIVE,
        isDealer: false,
        hasActed: false,
      });
    }

    return aiPlayers;
  }
}
