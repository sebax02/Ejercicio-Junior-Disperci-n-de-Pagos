import { Module } from '@nestjs/common';
import { BatchesModule } from '../batches/batches.module.js';
import { ItemsController } from './items.controller.js';
import { ItemsService } from './items.service.js';

@Module({
  imports: [BatchesModule],
  controllers: [ItemsController],
  providers: [ItemsService],
})
export class ItemsModule {}
