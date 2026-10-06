import { defineCommand } from "citty";
import deleteLimits from "./delete";
import get from "./get";
import set from "./set";

export default defineCommand({
  meta: {
    name: "limits",
    description: "Manage sub-account limits"
  },
  args: {},
  subCommands: {
    get,
    set,
    delete: deleteLimits
  }
});
