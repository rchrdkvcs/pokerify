import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Player,
  PlayerDocument,
  PlayerStatus,
  PlayerType,
} from './player.schema';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Injectable()
export class PlayersService {
  constructor(
    @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
  ) {}

  create(createPlayerDto: CreatePlayerDto): Promise<Player> {
    const createdPlayer = new this.playerModel(createPlayerDto);
    return createdPlayer.save();
  }

  findAll(): Promise<Player[]> {
    return this.playerModel.find().exec();
  }

  async findOne(id: string): Promise<Player> {
    const player = await this.playerModel.findById(id).exec();
    if (!player) {
      throw new NotFoundException(`Player with id ${id} not found`);
    }
    return player;
  }

  async update(id: string, updatePlayerDto: UpdatePlayerDto): Promise<Player> {
    const player = await this.playerModel
      .findByIdAndUpdate(id, updatePlayerDto, { new: true })
      .exec();
    if (!player) {
      throw new NotFoundException(`Player with id ${id} not found`);
    }
    return player;
  }

  async remove(id: string): Promise<Player> {
    const player = await this.playerModel.findByIdAndDelete(id).exec();
    if (!player) {
      throw new NotFoundException(`Player with id ${id} not found`);
    }
    return player;
  }

  createPlayer(
    userId: string,
    username: string,
    type: PlayerType,
    stack: number,
    position: number,
  ): Player {
    return {
      userId,
      username,
      type,
      stack,
      currentBet: 0,
      cards: [],
      position,
      status: PlayerStatus.ACTIVE,
      isDealer: false,
      hasActed: false,
    };
  }

  resetPlayerForNewRound(player: Player): void {
    player.cards = [];
    player.currentBet = 0;
    player.status = PlayerStatus.ACTIVE;
    player.hasActed = false;
    player.isDealer = false;
  }

  getActivePlayers(players: Player[]): Player[] {
    return players.filter(
      (p) =>
        p.status === PlayerStatus.ACTIVE || p.status === PlayerStatus.ALL_IN,
    );
  }

  countActivePlayers(players: Player[]): number {
    return this.getActivePlayers(players).length;
  }

  getNextActivePlayerIndex(currentIndex: number, players: Player[]): number {
    let nextIndex = (currentIndex + 1) % players.length;
    let attempts = 0;

    while (attempts < players.length) {
      if (
        players[nextIndex].status === PlayerStatus.ACTIVE ||
        players[nextIndex].status === PlayerStatus.ALL_IN
      ) {
        return nextIndex;
      }
      nextIndex = (nextIndex + 1) % players.length;
      attempts++;
    }

    return currentIndex;
  }
}
