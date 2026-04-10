import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '../../../generated/prisma/internal/prismaNamespace';
import { Response } from 'express';

/**
 * Global exception filter that catches Prisma errors and maps them
 * to appropriate HTTP responses instead of leaking 500s with stack traces.
 *
 * Prisma error codes: https://www.prisma.io/docs/orm/reference/error-reference
 */
@Catch(PrismaClientKnownRequestError, PrismaClientValidationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(
    exception: PrismaClientKnownRequestError | PrismaClientValidationError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof PrismaClientKnownRequestError) {
      return this.handleKnownError(exception, response);
    }

    // PrismaClientValidationError — bad query shape, usually a bug
    this.logger.error('Prisma validation error', exception.message);
    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Invalid request data',
    });
  }

  private handleKnownError(
    exception: PrismaClientKnownRequestError,
    response: Response,
  ) {
    switch (exception.code) {
      // Unique constraint violation
      case 'P2002': {
        const target = (exception.meta?.target as string[])?.join(', ') ?? 'field';
        response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message: `A record with that ${target} already exists`,
        });
        return;
      }

      // Record not found (update/delete on non-existent row)
      case 'P2025': {
        response.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Record not found',
        });
        return;
      }

      // Foreign key constraint failure
      case 'P2003': {
        const field = (exception.meta?.field_name as string) ?? 'reference';
        response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Referenced ${field} does not exist`,
        });
        return;
      }

      // Required relation not found
      case 'P2018': {
        response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Required related record not found',
        });
        return;
      }

      default: {
        this.logger.error(
          `Unhandled Prisma error [${exception.code}]`,
          exception.message,
        );
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
        });
      }
    }
  }
}
