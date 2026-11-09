import { Module } from "@nestjs/common";
import { MailChannelsModule } from "nestjs-mailchannels";
import { EmailsController } from "./emails.controller.js";

@Module({
  imports: [
    MailChannelsModule.forRoot({
      apiKey: "YOUR-API-KEY"
    })
  ],
  controllers: [EmailsController]
})
export class AppModule {}
