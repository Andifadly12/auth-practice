import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';
import { AskAiDto } from './dto/ask-ai.dto';
import { ParseTodoDto } from './dto/parse-todo.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('ask')
  ask(@Body() dto: AskAiDto) {
    return this.aiService.ask(dto.message);
  }

  @Post('parse-todo')
  parseTodo(@Body() dto: ParseTodoDto) {
    return this.aiService.parseTodo(dto.text);
  }
}
