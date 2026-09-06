import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AI_PROVIDER } from './providers/ai-provider.interface';
import { OpenAiProvider } from './providers/openai.provider';

@Module({
  imports: [AuthModule],
  controllers: [AiController],
  providers: [
    AiService,
    {
      provide: AI_PROVIDER,
      useClass: OpenAiProvider,
    },
  ],
})
export class AiModule {}
