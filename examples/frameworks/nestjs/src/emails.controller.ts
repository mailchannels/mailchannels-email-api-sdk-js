import { Controller, HttpException, Post } from "@nestjs/common";
// oxlint-disable-next-line typescript/consistent-type-imports
import { MailChannelsService } from "nestjs-mailchannels";

@Controller()
export class EmailsController {
  constructor (private readonly mailchannelsService: MailChannelsService) {}

  @Post("emails/send")
  async send () {
    const { data, error } = await this.mailchannelsService.emails.send({
      from: "Name <from@example.com>",
      to: "to@example.net",
      subject: "Test email",
      text: "Hello from NestJS",
      html: "<p>Hello from NestJS</p>"
    });

    if (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }

    return data;
  }

  @Post("emails/queue")
  async queue () {
    const { data, error } = await this.mailchannelsService.emails.queue({
      from: "Name <from@example.com>",
      to: "to@example.net",
      subject: "Test email",
      text: "Hello from NestJS",
      html: "<p>Hello from NestJS</p>"
    });

    if (error) {
      throw new HttpException(error.message, error.statusCode || 500);
    }

    return data;
  }
}
