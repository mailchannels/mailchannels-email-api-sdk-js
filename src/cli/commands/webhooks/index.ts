import { defineCommand } from "citty";
import create from "./create";
import deleteAll from "./delete-all";
import update from "./update";
import list from "./list";
import deleteFailureThreshold from "./delete-failure-threshold";
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
    update,
    batches,
    "resend-batch": resendBatch,
    "delete-failure-threshold": deleteFailureThreshold,
    validate
  }
});
