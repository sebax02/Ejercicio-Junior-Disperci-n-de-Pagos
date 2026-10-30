import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const message = errors.flatMap((error) =>
          Object.values(error.constraints ?? {}),
        );
        return new BadRequestException(message);
      },
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
