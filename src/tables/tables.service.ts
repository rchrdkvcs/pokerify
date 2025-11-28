import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Table, TableDocument } from './table.schema';
import { CreateTableDto } from './dto/create-table.dto';
import { Request } from 'express';
import { PayloadDto } from '../auth/dto/payload.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class TablesService {
  constructor(
    @InjectModel(Table.name) private tableModel: Model<TableDocument>,
    private usersService: UsersService,
  ) {}

  async create(createTableDto: CreateTableDto) {
    const table = new this.tableModel({ ...createTableDto });
    return await table.save();
  }

  async findAll() {
    return await this.tableModel.find().exec();
  }

  async findOne(id: string) {
    return await this.tableModel.findById(id).exec();
  }

  async joinTable(id: string, req: Request & { user: PayloadDto }) {
    const user = await this.usersService.findOne(req.user['id']);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const table = await this.tableModel.findById(id).exec();

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    table.players.push(user._id.toString());
    return await table.save();
  }

  async leaveTable(id: string, req: Request & { user: PayloadDto }) {
    const user = await this.usersService.findOne(req.user['id']);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const table = await this.tableModel.findById(id).exec();

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    table.players = table.players.filter(
      (playerId) => playerId !== user._id.toString(),
    );
    return await table.save();
  }

  async startTable(id: string) {
    const table = await this.tableModel.findById(id).exec();

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    table.state = 'started';
    return await table.save();
  }
}
