# Metrics and Usage

The metrics module exposes the operational view of your traffic. Usage exposes
billing-period totals.

### Time-Series Metrics

The four time-series methods share the same `MetricsOptions` parameter shape: optional
`startTime`, `endTime`, `campaignId`, and `interval`.

```ts
import { MailChannels } from 'mailchannels-sdk'

const mc = new MailChannels('YOUR-API-KEY')

const { data, error } = await mc.metrics.volume({
  startTime: '2026-04-01',
  endTime:   '2026-05-01T00:00:00Z',
  interval:  'day',        // 'hour' | 'day' | 'week' | 'month' (default 'day')
  campaignId: 'welcome'   // optional filter
})
if (error) { /*...*/ }

// Same parameter shape — pass the same options to any of these:
const { data: engagement, error: engErr }   = await mc.metrics.engagement({ interval: 'day' })
const { data: perf,       error: perfErr }  = await mc.metrics.performance({ interval: 'day' })
const { data: behaviour,  error: behErr }   = await mc.metrics.recipientBehaviour({ interval: 'day' })
```

Time formats accepted: `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SSZ`. Defaults: `startTime` is
one month ago, `endTime` is now.

#### Buckets

Each response includes both totals **and** a `buckets` object grouped by metric name, each
containing a list of `{ count, periodStart }` rows aligned to `interval`.

```ts
const { data, error } = await mc.metrics.volume({ interval: 'day' })
if (error) { /*...*/ }

for (const bucket of data?.buckets.processed ?? []) {
  console.log(bucket.periodStart, bucket.count)
}
```

#### Volume Buckets

`data.buckets` has `processed`, `delivered`, `dropped`.

#### Engagement Buckets

`data.buckets` has `open`, `click`, `openTrackingDelivered`, `clickTrackingDelivered`.

#### Performance Buckets

`data.buckets` has `processed`, `delivered`, `bounced`.

#### Recipient Behaviour Buckets

`data.buckets` has `unsubscribed`, `unsubscribeDelivered`.

### Sender Metrics

`mc.metrics.senders()` lists per-sender totals grouped either by campaign or sub-account.

```ts
const { data, error } = await mc.metrics.senders(
  'campaigns',           // required: 'campaigns' | 'sub-accounts'
  {
    startTime:  '2026-04-01',
    endTime:    '2026-05-01',
    limit:      50,          // 1..1000, default 10
    offset:     0,
    sortOrder:  'desc'       // 'asc' | 'desc', default desc (by processed + dropped)
  }
)
if (error) { /*...*/ }

for (const sender of data?.senders ?? []) {
  console.log(sender.name, sender.processed, sender.bounced)
}
```

Senders with **zero traffic in the time range are omitted** from the response.

### Usage

```ts
const { data: usage, error } = await mc.metrics.usage()
if (error) { /*...*/ }

console.log(usage?.total, usage?.startDate, usage?.endDate)
```

For a specific sub-account, use `mc.subAccounts.getUsage(handle)` instead. See
[sub-accounts](sub-accounts.md).

### Common Patterns

- **Daily dashboard**: `mc.metrics.volume({ interval: 'day' })` plus
  `mc.metrics.engagement({ interval: 'day' })` over the same range.
- **Campaign post-mortem**: pass `campaignId` on each call, then read totals and buckets.
- **Top senders by sub-account**: `mc.metrics.senders('sub-accounts', { sortOrder: 'desc' })`.
- **Billing reconciliation**: `mc.metrics.usage()` plus each sub-account's
  `mc.subAccounts.getUsage(handle)` should sum within the parent's limit.
