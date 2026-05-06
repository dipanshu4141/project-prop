import { Module } from "@nestjs/common";
import { MessagesModule } from "../../modules/messages/messages.module";
import { WhatsappService } from "./whatsapp.service";

@Module({
    imports: [MessagesModule],
    providers: [WhatsappService],
  })
  export class WhatsappModule {}
  