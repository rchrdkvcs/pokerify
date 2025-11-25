import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TablesModule } from './tables/tables.module';
import { PlayersModule } from './players/players.module';

@Module({
  imports: [ConfigModule.forRoot(), TablesModule, PlayersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
