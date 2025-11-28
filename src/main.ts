import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { apiReference } from '@scalar/nestjs-api-reference';
import { SwaggerService } from './swagger/swagger.service';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerService = new SwaggerService();
  const document = swaggerService.createDocument(app);

  app.use('/api', apiReference({ content: document }));

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
