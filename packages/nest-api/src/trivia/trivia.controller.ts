import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  Request 
} from '@nestjs/common';
import { TriviaService } from './trivia.service';
import { CreateTriviaDto, UpdateTriviaDto } from './dto/trivia.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('trivias')
@UseGuards(JwtAuthGuard)
export class TriviaController {
  constructor(private readonly triviaService: TriviaService) {}

  @Post()
  create(@Request() req, @Body() createTriviaDto: CreateTriviaDto) {
    return this.triviaService.createTrivia(req.user.userId, createTriviaDto);
  }

  @Get('mine')
  findMyTrivias(@Request() req) {
    return this.triviaService.getMyTrivia(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.triviaService.getTriviaById(id, req.user.userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Request() req, @Body() updateTriviaDto: UpdateTriviaDto) {
    return this.triviaService.updateTrivia(id, req.user.userId, updateTriviaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.triviaService.deleteTrivia(id, req.user.userId);
  }

  @Post(':id/start')
  startTrivia(@Param('id') id: string, @Request() req) {
    return this.triviaService.startTrivia(id, req.user.userId);
  }

  @Get(':id/ranking')
  getRanking(@Param('id') id: string, @Request() req) {
    return this.triviaService.getTriviaRanking(id, req.user.userId);
  }
}
