import { defineCommand } from "citty";
import activate from "./activate";
import create from "./create";
import deleteSubAccount from "./delete";
import list from "./list";
import suspend from "./suspend";
import usage from "./usage";
import apiKeys from "./api-keys";
import limit from "./limit";
import smtpPasswords from "./smtp-passwords";

export default defineCommand({
  meta: {
    name: "sub-accounts",
    description: "Manage sub-accounts"
  },
  args: {},
  subCommands: {
    create,
    list,
    "delete": deleteSubAccount,
    suspend,
    activate,
    usage,
    "api-keys": apiKeys,
    limit,
    "smtp-passwords": smtpPasswords
  }
});
