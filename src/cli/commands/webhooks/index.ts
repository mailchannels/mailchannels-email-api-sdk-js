import { defineCommand } from "citty";
import create from "./create";
import deleteAll from "./delete-all";
import list from "./list";
import batches from "./batches";
import resendBatch from "./resend-batch";
import validate from "./validate";

export default defineCommand({
  meta: {
    name: "webhooks",
    description: "Commands for managing webhooks"
  },
  args: {},
  subCommands: {
    create,
    "delete-all": deleteAll,
    list,
    batches,
    "resend-batch": resendBatch,
    validate
  }
});
