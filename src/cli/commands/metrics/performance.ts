import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { buildMetricsTimeSeries } from "../../utils/metrics/time-series";
import { tabulatedSections } from "../../utils/shared/sections";
import { toWordsKeys } from "../../utils/shared/style";
import { metricsReportArgs } from "../../utils/metrics/args";
import { MailChannelsClient, Metrics, type MetricsOptions } from "../../../mailchannels";

export default defineCommand({
  meta: {
    name: "performance",
    description: "Retrieve performance metrics for messages sent from your account"
  },
  args: {
    ...metricsReportArgs
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const metrics = new Metrics(client);

    const { data, error } = await metrics.performance({
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
      console.info("[Metrics] No performance data available for the specified period.");
    }
    else {
      console.info("[Metrics] Performance metrics time series by period:");
      console.table(toWordsKeys(timeSeries));
    }

    console.info("[Metrics] Performance metrics summary:"
      + tabulatedSections(summary)
    );
  }
});
