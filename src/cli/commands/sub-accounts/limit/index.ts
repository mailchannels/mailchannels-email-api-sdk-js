import { defineCommand } from "citty";
import deleteLimit from "./delete";
import get from "./get";
import set from "./set";

export default defineCommand({
  meta: {
    name: "limit",
    description: "Manage sub-account limit"
  },
  args: {},
  subCommands: {
    get,
    set,
    delete: deleteLimit
  }
});
