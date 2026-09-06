import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { OpenAiProvider } from './providers/openai.provider';

@Module({
  imports: [AuthModule],
  controllers: [AiController],
  providers: [AiService, OpenAiProvider],
})
export class AiModule {}
