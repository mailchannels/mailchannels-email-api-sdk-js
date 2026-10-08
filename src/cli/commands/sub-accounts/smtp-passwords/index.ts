import { defineCommand } from "citty";
import create from "./create";
import deletePassword from "./delete";
import list from "./list";

export default defineCommand({
  meta: {
    name: "smtp-passwords",
    description: "Manage sub-account SMTP passwords"
  },
  args: {},
  subCommands: {
    create,
    list,
    delete: deletePassword
  }
});
