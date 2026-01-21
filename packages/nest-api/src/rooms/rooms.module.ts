import { Module } from '@nestjs/common';
import { RoomsGateway } from './rooms.gateway';
import { RoomsService } from './rooms.service';
import { TriviasModule } from './trivias/trivias.module';

@Module({
  imports: [TriviasModule],
  providers: [RoomsGateway, RoomsService],
  exports: [RoomsService, TriviasModule],
})
export class RoomsModule {}
