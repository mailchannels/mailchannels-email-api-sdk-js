import { defineCommand } from "citty";
import activate from "./activate";
import create from "./create";
import deleteSubAccount from "./delete";
import list from "./list";
import suspend from "./suspend";
import usage from "./usage";

export default defineCommand({
  meta: {
    name: "sub-accounts",
    description: "Manage sub-accounts"
  },
  args: {},
  subCommands: {
    create,
    list,
    delete: deleteSubAccount,
    suspend,
    activate,
    usage
  }
});
