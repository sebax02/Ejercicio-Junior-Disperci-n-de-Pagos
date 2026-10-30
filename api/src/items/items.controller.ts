import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto.js';
import { ItemsService } from './items.service.js';

@Controller('batches/:id/items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  add(
    @Param('id', ParseUUIDPipe) batchId: string,
    @Body() dto: CreateItemDto,
  ) {
    return this.itemsService.add(batchId, dto);
  }

  @Delete(':itemId')
  @HttpCode(204)
  remove(
    @Param('id', ParseUUIDPipe) batchId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.itemsService.remove(batchId, itemId);
  }
}
