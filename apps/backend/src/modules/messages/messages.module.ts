import { Module } from "@nestjs/common";
import { MessagesService } from "./messages.service";
import { AiParserModule } from "../ai-parser/ai-parser.module";
import { PropertiesModule } from "../properties/properties.module";
import { MessagesController } from "./messages.controller";

@Module({
  imports: [AiParserModule, PropertiesModule],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}