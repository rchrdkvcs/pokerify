import { INestApplication, Injectable } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

@Injectable()
export class SwaggerService {
  createDocument(app: INestApplication) {
    const config = new DocumentBuilder()
      .setTitle('Pokerify API')
      .setDescription("Documentation pour l'API Pokerify (poker Texas Holdem)")
      .setVersion('0.0.0-beta.1')
      .addTag('pokerify')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    return SwaggerModule.createDocument(app, config);
  }
}
