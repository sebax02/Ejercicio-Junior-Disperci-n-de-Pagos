import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID, Matches } from 'class-validator';

export class CreateItemDto {
  @IsUUID()
  beneficiary_id: string;

  @Transform(({ value }: { value: unknown }) =>
    value === undefined || value === null ? value : String(value),
  )
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'El monto debe ser un número positivo con máximo 2 decimales',
  })
  amount: string;
}
