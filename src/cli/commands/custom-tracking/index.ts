import { defineCommand } from "citty";
import create from "./create";
import deleteCommand from "./delete";
import list from "./list";
import update from "./update";

export default defineCommand({
  meta: {
    name: "custom-tracking",
    description: "Commands for managing custom tracking domains"
  },
  args: {},
  subCommands: {
    list,
    create,
    update,
    delete: deleteCommand
  }
});
