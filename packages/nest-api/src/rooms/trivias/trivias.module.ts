import { Module } from '@nestjs/common';
import { TriviasController } from './trivias.controller';
import { TriviasService } from './trivias.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [TriviasController],
  providers: [TriviasService, PrismaService],
})
export class TriviasModule {}
