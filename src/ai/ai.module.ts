import { Module } from '@nestjs/common';
import { PokerAiService } from './poker-ai.service';

@Module({
  providers: [PokerAiService],
  exports: [PokerAiService],
})
export class AiModule {}
