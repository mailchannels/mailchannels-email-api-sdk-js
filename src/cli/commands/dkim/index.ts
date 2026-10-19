import { defineCommand } from "citty";
import checkDomain from "./check-domain";
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
    "check-domain": checkDomain,
    list,
    create,
    "update-status": updateStatus,
    rotate
  }
});
