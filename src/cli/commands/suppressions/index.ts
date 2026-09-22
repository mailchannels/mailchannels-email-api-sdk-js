import { defineCommand } from "citty";
import create from "./create";
import deleteCommand from "./delete";
import list from "./list";

export default defineCommand({
  meta: {
    name: "suppressions",
    description: "Commands for managing suppression entries"
  },
  args: {},
  subCommands: {
    create,
    delete: deleteCommand,
    list
  }
});
