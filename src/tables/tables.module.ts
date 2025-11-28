import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TablesService } from './tables.service';
import { TablesController } from './tables.controller';
import { Table, TableSchema } from './table.schema';
import { UsersModule } from '../users/users.module';
import { PlayersModule } from '../players/players.module';
import { PokerModule } from '../poker/poker.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Table.name, schema: TableSchema }]),
    UsersModule,
    PlayersModule,
    PokerModule,
    AiModule,
  ],
  controllers: [TablesController],
  providers: [TablesService],
})
export class TablesModule {}
