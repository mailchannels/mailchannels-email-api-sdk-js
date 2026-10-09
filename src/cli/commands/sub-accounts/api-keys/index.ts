import { defineCommand } from "citty";
import create from "./create";
import deleteApiKey from "./delete";
import list from "./list";

export default defineCommand({
  meta: {
    name: "api-keys",
    description: "Manage sub-account API keys"
  },
  args: {},
  subCommands: {
    create,
    list,
    delete: deleteApiKey
  }
});
