import { defineCommand } from "citty";
import create from "./create";
import list from "./list";
import rotate from "./rotate";
import updateStatus from "./update-status";

export default defineCommand({
  meta: {
    name: "dkim",
    description: "Commands for managing DKIM keys"
  },
  args: {},
  subCommands: {
    list,
    create,
    "update-status": updateStatus,
    rotate
  }
});
