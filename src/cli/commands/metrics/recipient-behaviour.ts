import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { buildMetricsTimeSeries } from "../../utils/metrics/time-series";
import { tabulatedSections } from "../../utils/shared/sections";
import { toWordsKeys } from "../../utils/shared/style";
import { metricsReportArgs } from "../../utils/metrics/args";
import { MailChannelsClient, Metrics, type MetricsOptions } from "../../../mailchannels";

export default defineCommand({
  meta: {
    name: "recipient-behaviour",
    description: "Retrieve recipient behaviour metrics for messages sent from your account"
  },
  args: {
    ...metricsReportArgs
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const metrics = new Metrics(client);

    const { data, error } = await metrics.recipientBehaviour({
      startTime: args["start-time"],
      endTime: args["end-time"],
      campaignId: args["campaign-id"],
      interval: args["interval"] as MetricsOptions["interval"]
    });

    if (error) {
      console.error(`[Metrics] ${error.message}`);
      process.exit(1);
    }

    const { buckets, ...summary } = data;
    const timeSeries = buildMetricsTimeSeries(buckets);

    if (timeSeries.length === 0) {
      console.info("[Metrics] No recipient behaviour data available for the specified period.");
    }
    else {
      console.info("[Metrics] Recipient behaviour metrics time series by period:");
      console.table(toWordsKeys(timeSeries));
    }

    console.info("[Metrics] Recipient behaviour metrics summary:"
      + tabulatedSections(summary)
    );
  }
});
