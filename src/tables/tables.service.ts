import { Injectable } from '@nestjs/common';

@Injectable()
export class TablesService {
  findAll() {
    return `This action returns all tables`;
  }

  findOne(id: number) {
    return `This action returns a #${id} table`;
  }

  makeAction(id: number, action: string) {
    return `This action performs ${action} on table #${id}`;
  }

  joinTable(id: number) {
    return `This action performs on table #${id}`;
  }

  leaveTable(id: number) {
    return `This action performs on table #${id}`;
  }
}
