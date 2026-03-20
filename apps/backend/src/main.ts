// import 'dotenv/config';
// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);


//   const isProd = process.env.NODE_ENV === 'production';

//   app.enableCors({
//     origin: isProd
//       ? [
//           // 🔒 production domains ONLY
//           'https://yourdomain.com',
//           'https://www.yourdomain.com',
//         ]
//       : true, // ✅ allow all origins in local/dev
//     credentials: true,
//   });

//   const port = Number(process.env.PORT) || 3000;

//   // ✅ REQUIRED for LAN, Docker, AWS, ALB, ECS, EKS
//   await app.listen(port, '0.0.0.0');

//   console.log(`🚀 Backend running on port ${port}`);
// }

// // ✅ Safe BigInt JSON serialization
// (BigInt.prototype as any).toJSON = function () {
//   return this.toString();
// };

// bootstrap();


import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /* ── Cookie parser — must come before any guard that reads cookies ── */
  app.use(cookieParser());

  /* ── CORS — allow the Next.js frontend to send cookies ── */
  app.enableCors({
    origin:      process.env.FRONTEND_URL ?? 'http://localhost:3001',
    credentials: true,   // REQUIRED for cookies to be sent cross-origin
    methods:     ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  /* ── Global validation ── */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:        true,   // strip unknown fields
      forbidNonWhitelisted: true,
      transform:        true,
    }),
  );

  /* ── Global prefix ── */
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Backend running on http://localhost:${process.env.PORT ?? 3000}/api`);
}


bootstrap();