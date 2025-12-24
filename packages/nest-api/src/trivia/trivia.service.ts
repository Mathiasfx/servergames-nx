import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTriviaDto, UpdateTriviaDto } from './dto/trivia.dto';

@Injectable()
export class TriviaService {
  constructor(private prisma: PrismaService) {}

  async createTrivia(userId: string, createTriviaDto: CreateTriviaDto) {
    // Verificar si el usuario ya tiene una trivia activa
    const existingActiveTrivia = await this.prisma.trivia.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    if (existingActiveTrivia) {
      throw new ForbiddenException('Ya tienes una trivia activa. Debes finalizarla antes de crear una nueva.');
    }

    // Verificar límite de preguntas (máximo 10)
    if (createTriviaDto.questions.length > 10) {
      throw new ForbiddenException('No puedes tener más de 10 preguntas por trivia.');
    }

    // Validar cada pregunta (2-4 opciones)
    for (const question of createTriviaDto.questions) {
      if (question.options.length < 2 || question.options.length > 4) {
        throw new ForbiddenException('Cada pregunta debe tener entre 2 y 4 opciones.');
      }
      if (!question.options.includes(question.answer)) {
        throw new ForbiddenException('La respuesta correcta debe estar entre las opciones.');
      }
    }

    return this.prisma.trivia.create({
      data: {
        userId,
        title: createTriviaDto.title,
        questions: createTriviaDto.questions as any,
        isActive: false,
      },
    });
  }

  async getMyTrivia(userId: string) {
    return this.prisma.trivia.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getTriviaById(id: string, userId: string) {
    const trivia = await this.prisma.trivia.findUnique({
      where: { id },
    });

    if (!trivia) {
      throw new NotFoundException('Trivia no encontrada.');
    }

    if (trivia.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para acceder a esta trivia.');
    }

    return trivia;
  }

  async updateTrivia(id: string, userId: string, updateTriviaDto: UpdateTriviaDto) {
    const trivia = await this.getTriviaById(id, userId);

    if (trivia.isActive) {
      throw new ForbiddenException('No puedes editar una trivia que está activa.');
    }

    // Validaciones similares a las de creación
    if (updateTriviaDto.questions && updateTriviaDto.questions.length > 10) {
      throw new ForbiddenException('No puedes tener más de 10 preguntas por trivia.');
    }

    if (updateTriviaDto.questions) {
      for (const question of updateTriviaDto.questions) {
        if (question.options.length < 2 || question.options.length > 4) {
          throw new ForbiddenException('Cada pregunta debe tener entre 2 y 4 opciones.');
        }
        if (!question.options.includes(question.answer)) {
          throw new ForbiddenException('La respuesta correcta debe estar entre las opciones.');
        }
      }
    }

    return this.prisma.trivia.update({
      where: { id },
      data: {
        ...updateTriviaDto,
        questions: updateTriviaDto.questions ? updateTriviaDto.questions as any : undefined,
      },
    });
  }

  async deleteTrivia(id: string, userId: string) {
    const trivia = await this.getTriviaById(id, userId);

    if (trivia.isActive) {
      throw new ForbiddenException('No puedes eliminar una trivia que está activa.');
    }

    return this.prisma.trivia.delete({
      where: { id },
    });
  }

  async startTrivia(id: string, userId: string) {
    const trivia = await this.getTriviaById(id, userId);

    if (trivia.isActive) {
      throw new ForbiddenException('La trivia ya está activa.');
    }

    return this.prisma.trivia.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async getTriviaRanking(id: string, userId: string) {
    const trivia = await this.getTriviaById(id, userId);

    // Aquí podrías implementar la lógica para obtener el ranking
    // Por ahora retornamos un placeholder
    return {
      triviaId: id,
      ranking: [],
      message: 'Ranking no disponible aún. La trivia debe estar activa.',
    };
  }
}
