import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);


  const isProd = process.env.NODE_ENV === 'production';

  app.enableCors({
    origin: isProd
      ? [
          // 🔒 production domains ONLY
          'https://yourdomain.com',
          'https://www.yourdomain.com',
        ]
      : true, // ✅ allow all origins in local/dev
    credentials: true,
  });

  const port = Number(process.env.PORT) || 3000;

  // ✅ REQUIRED for LAN, Docker, AWS, ALB, ECS, EKS
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Backend running on port ${port}`);
}

// ✅ Safe BigInt JSON serialization
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

bootstrap();
