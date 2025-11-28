import { BadRequestException, Injectable } from '@nestjs/common';
import { Player, PlayerStatus } from '../players/player.schema';
import { GamePhase, TableDocument } from '../tables/table.schema';
import { PlayerAction } from './poker.types';
import {
  calculateBlindPositions,
  createDeck,
  dealCards,
  shuffleDeck,
} from './poker.utils';
import { HandEvaluatorService } from './hand-evaluator.service';

@Injectable()
export class PokerGameService {
  constructor(private handEvaluatorService: HandEvaluatorService) {}
  initializeGame(table: TableDocument): void {
    const deck = shuffleDeck(createDeck());

    table.players.forEach((player) => {
      player.cards = [];
      player.currentBet = 0;
      player.status = PlayerStatus.ACTIVE;
      player.hasActed = false;
      player.isDealer = false;
    });

    table.players[table.dealerPosition].isDealer = true;

    const { smallBlindPosition, bigBlindPosition } = calculateBlindPositions(
      table.dealerPosition,
      table.players.length,
    );

    const sbPlayer = table.players[smallBlindPosition];
    const bbPlayer = table.players[bigBlindPosition];

    sbPlayer.currentBet = table.smallBlind;
    sbPlayer.stack -= table.smallBlind;

    bbPlayer.currentBet = table.bigBlind;
    bbPlayer.stack -= table.bigBlind;

    table.pot = table.smallBlind + table.bigBlind;
    table.currentBet = table.bigBlind;

    let remainingDeck = deck;
    for (const player of table.players) {
      const { cards, remainingDeck: newDeck } = dealCards(remainingDeck, 2);
      player.cards = cards;
      remainingDeck = newDeck;
    }

    table.deck = remainingDeck;
    table.communityCards = [];
    table.state = GamePhase.PRE_FLOP;
    table.currentPlayerIndex = (bigBlindPosition + 1) % table.players.length;
  }

  processAction(
    table: TableDocument,
    player: Player,
    action: PlayerAction,
    amount?: number,
  ): void {
    player.hasActed = true;

    switch (action) {
      case PlayerAction.FOLD:
        player.status = PlayerStatus.FOLDED;
        break;

      case PlayerAction.CHECK:
        if (player.currentBet < table.currentBet) {
          throw new BadRequestException('Cannot check, must call or raise');
        }
        break;

      case PlayerAction.CALL: {
        const callAmount = table.currentBet - player.currentBet;
        if (callAmount > player.stack) {
          throw new BadRequestException('Insufficient stack');
        }
        player.currentBet = table.currentBet;
        player.stack -= callAmount;
        table.pot += callAmount;
        break;
      }
      case PlayerAction.RAISE: {
        if (!amount || amount <= table.currentBet) {
          throw new BadRequestException(
            'Raise amount must be greater than current bet',
          );
        }
        if (amount > player.stack + player.currentBet) {
          throw new BadRequestException('Insufficient stack');
        }
        const raiseAmount = amount - player.currentBet;
        player.stack -= raiseAmount;
        table.pot += raiseAmount;
        player.currentBet = amount;
        table.currentBet = amount;

        table.players.forEach((p) => {
          if (p.userId !== player.userId && p.status === PlayerStatus.ACTIVE) {
            p.hasActed = false;
          }
        });
        break;
      }
      case PlayerAction.ALL_IN: {
        const allInAmount = player.stack;
        player.currentBet += allInAmount;
        table.pot += allInAmount;
        player.stack = 0;
        player.status = PlayerStatus.ALL_IN;

        if (player.currentBet > table.currentBet) {
          table.currentBet = player.currentBet;
          table.players.forEach((p) => {
            if (
              p.userId !== player.userId &&
              p.status === PlayerStatus.ACTIVE
            ) {
              p.hasActed = false;
            }
          });
        }
        break;
      }
    }
  }

  isRoundComplete(table: TableDocument): boolean {
    const activePlayers = table.players.filter(
      (p) =>
        p.status === PlayerStatus.ACTIVE || p.status === PlayerStatus.ALL_IN,
    );

    if (
      activePlayers.filter((p) => p.status === PlayerStatus.ACTIVE).length <= 1
    ) {
      return true;
    }

    const activePlayersNotAllIn = activePlayers.filter(
      (p) => p.status === PlayerStatus.ACTIVE,
    );

    return activePlayersNotAllIn.every(
      (p) => p.hasActed && p.currentBet === table.currentBet,
    );
  }

  advanceToNextPhase(table: TableDocument): void {
    table.players.forEach((player) => {
      if (player.status === PlayerStatus.ACTIVE) {
        player.hasActed = false;
        player.currentBet = 0;
      }
    });

    table.currentBet = 0;

    switch (table.state) {
      case GamePhase.PRE_FLOP: {
        const { cards: flop, remainingDeck: afterFlop } = dealCards(
          table.deck,
          3,
        );
        table.communityCards = flop;
        table.deck = afterFlop;
        table.state = GamePhase.FLOP;
        table.currentPlayerIndex =
          (table.dealerPosition + 1) % table.players.length;
        break;
      }
      case GamePhase.FLOP: {
        const { cards: turn, remainingDeck: afterTurn } = dealCards(
          table.deck,
          1,
        );
        table.communityCards.push(...turn);
        table.deck = afterTurn;
        table.state = GamePhase.TURN;
        table.currentPlayerIndex =
          (table.dealerPosition + 1) % table.players.length;
        break;
      }
      case GamePhase.TURN: {
        const { cards: river, remainingDeck: afterRiver } = dealCards(
          table.deck,
          1,
        );
        table.communityCards.push(...river);
        table.deck = afterRiver;
        table.state = GamePhase.RIVER;
        table.currentPlayerIndex =
          (table.dealerPosition + 1) % table.players.length;
        break;
      }

      case GamePhase.RIVER:
        table.state = GamePhase.SHOWDOWN;
        this.determineWinner(table);
        break;
    }
  }

  determineWinner(table: TableDocument): void {
    const activePlayers = table.players.filter(
      (p) =>
        p.status === PlayerStatus.ACTIVE || p.status === PlayerStatus.ALL_IN,
    );

    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      winner.stack += table.pot;
      table.pot = 0;
      table.state = GamePhase.FINISHED;
      return;
    }

    const playersWithCards = activePlayers.map((p) => ({
      userId: p.userId,
      cards: p.cards,
    }));

    const winners = this.handEvaluatorService.findWinner(
      playersWithCards,
      table.communityCards,
    );

    const winningShare = Math.floor(table.pot / winners.length);

    winners.forEach((winner) => {
      const player = table.players.find((p) => p.userId === winner.winnerId);
      if (player) {
        player.stack += winningShare;
      }
    });

    table.pot = 0;
    table.state = GamePhase.FINISHED;
  }
}
