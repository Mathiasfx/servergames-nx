import { Module } from '@nestjs/common';
import { TriviaController } from './trivia.controller';
import { TriviaService } from './trivia.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [TriviaController],
  providers: [TriviaService, PrismaService],
  exports: [TriviaService],
})
export class TriviaModule {}
