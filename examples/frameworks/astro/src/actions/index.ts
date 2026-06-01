import domainsCheck from "./domains/check";
import emailsQueue from "./emails/queue";
import emailsSend from "./emails/send";
import emailsSendAttachment from "./emails/send-attachment";
import emailsSendForm from "./emails/send-form";
import emailsSendTemplate from "./emails/send-template";
import webhooksCreate from "./webhooks/create";
import webhooksList from "./webhooks/list";
import webhooksDeleteAll from "./webhooks/delete-all";

export const server = {
  emails: {
    send: emailsSend,
    sendForm: emailsSendForm,
    sendAttachment: emailsSendAttachment,
    sendTemplate: emailsSendTemplate,
    queue: emailsQueue
  },
  domains: {
    check: domainsCheck
  },
  webhooks: {
    create: webhooksCreate,
    list: webhooksList,
    deleteAll: webhooksDeleteAll
  }
};
