import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ✅ Serve uploaded files
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

   // Serve only the gst-certificates folder as static files
  app.useStaticAssets(join(__dirname, '..', 'uploads', 'gst-certificates'), {
    prefix: '/gst',
  });

 app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
  }),
);

  // ✅ CORS
app.enableCors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://enplerp.electrohelps.in',
      'http://localhost:3000', // dev
    ];

    // Allow server-to-server / curl / Postman (no origin)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'), false);
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  credentials: true,
});


  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
