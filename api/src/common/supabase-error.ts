import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { PostgrestError } from '@supabase/supabase-js';

export function throwSupabaseError(
  error: PostgrestError,
  conflictMessage = 'El registro ya existe',
): never {
  if (error.code === '23505') {
    throw new ConflictException(conflictMessage);
  }
  if (error.code === '23503') {
    throw new BadRequestException('La referencia indicada no existe');
  }

  throw new InternalServerErrorException(error.message);
}
