import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function handlePrismaError(error: unknown, message = 'Duplicate record') {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = (error.meta?.target ?? []) as string[];
      throw new ConflictException({
        statusCode: 409,
        error: 'Conflict',
        message,
        code: 'DUPLICATE',
        meta: { target },
      });
    }
  }
  throw error;
}
