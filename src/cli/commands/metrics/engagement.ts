import { defineCommand } from "citty";
import { getApiKey } from "../../utils/shared/get-api-key";
import { buildMetricsTimeSeries } from "../../utils/metrics/time-series";
import { tabulatedSections } from "../../utils/shared/sections";
import { toWordsKeys } from "../../utils/shared/style";
import { metricsReportArgs } from "../../utils/metrics/args";
import { MailChannelsClient, Metrics, type MetricsOptions } from "../../../mailchannels";

export default defineCommand({
  meta: {
    name: "engagement",
    description: "Retrieve engagement metrics for messages sent from your account"
  },
  args: {
    ...metricsReportArgs
  },
  async run ({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    const client = new MailChannelsClient(apiKey);
    const metrics = new Metrics(client);

    const { data, error } = await metrics.engagement({
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

    const timeSeries = buildMetricsTimeSeries({
      click: buckets.click,
      clickTrackingDelivered: buckets.clickTrackingDelivered,
      open: buckets.open,
      openTrackingDelivered: buckets.openTrackingDelivered
    });

    const uniqueTimeSeries = buildMetricsTimeSeries({
      uniqueClick: buckets.uniqueClick,
      uniqueClickTrackingDelivered: buckets.uniqueClickTrackingDelivered,
      uniqueOpen: buckets.uniqueOpen,
      uniqueOpenTrackingDelivered: buckets.uniqueOpenTrackingDelivered
    });

    if (timeSeries.length === 0) {
      console.info("[Metrics] No engagement data available for the specified period.");
    }
    else {
      console.info("[Metrics] Engagement metrics time series by period:");
      console.table(toWordsKeys(timeSeries));
    }

    if (uniqueTimeSeries.length > 0) {
      console.info("[Metrics] Unique engagement metrics time series by period:");
      console.table(toWordsKeys(uniqueTimeSeries));
    }

    console.info("[Metrics] Engagement metrics summary:"
      + tabulatedSections(summary)
    );
  }
});
