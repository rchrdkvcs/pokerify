import { Module } from '@nestjs/common';
import { PokerGameService } from './poker-game.service';
import { HandEvaluatorService } from './hand-evaluator.service';

@Module({
  providers: [PokerGameService, HandEvaluatorService],
  exports: [PokerGameService, HandEvaluatorService],
})
export class PokerModule {}
