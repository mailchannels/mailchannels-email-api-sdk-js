# SDK-API Mapping

This page provides a mapping between the MailChannels SDK module methods and the corresponding API endpoint reference.

## Email API

### 📧 Emails

  | SDK Method | API Reference |
  | --- | --- |
  | [`Emails.send()`](/modules/emails/send) | [Send an Email](https://docs.mailchannels.net/email-api/api-reference/send-an-email) |
  | [`Emails.sendAsync()`](/modules/emails/send-async) | [Send an Email Asynchronously](https://docs.mailchannels.net/email-api/api-reference/send-an-email-asynchronously) |

### 🌐 Domains

  | SDK Method | API Reference |
  | --- | --- |
  | [`Domains.check()`](/modules/domains/check) | [DKIM, SPF & Domain Lockdown Check](https://docs.mailchannels.net/email-api/api-reference/dkim-spf-domain-lockdown-check) |
  | [`Domains.dkim.create()`](/modules/domains/dkim-create) | [Create DKIM Key Pair](https://docs.mailchannels.net/email-api/api-reference/create-dkim-key-pair) |
  | [`Domains.dkim.list()`](/modules/domains/dkim-list) | [Retrieve DKIM Keys](https://docs.mailchannels.net/email-api/api-reference/retrieve-dkim-keys) |
  | [`Domains.dkim.update()`](/modules/domains/dkim-update) | [Update DKIM Key Status](https://docs.mailchannels.net/email-api/api-reference/update-dkim-key-status) |
  | [`Domains.dkim.rotate()`](/modules/domains/dkim-rotate) | [Rotate DKIM Key Pair](https://docs.mailchannels.net/email-api/api-reference/rotate-dkim-key-pair) |

### 📢 Webhooks

  | SDK Method | API Reference |
  | --- | --- |
  | [`Webhooks.enroll()`](/modules/webhooks/enroll) | [Enroll for Webhook Notifications](https://docs.mailchannels.net/email-api/api-reference/enroll-for-webhook-notifications) |
  | [`Webhooks.list()`](/modules/webhooks/list) | [Retrieve Customer Webhooks](https://docs.mailchannels.net/email-api/api-reference/retrieve-customer-webhooks) |
  | [`Webhooks.deleteAll()`](/modules/webhooks/delete-all) | [Delete Customer Webhooks](https://docs.mailchannels.net/email-api/api-reference/delete-customer-webhooks) |
  | [`Webhooks.getSigningKey()`](/modules/webhooks/get-signing-key) | [Retrieve Webhook Signing Key](https://docs.mailchannels.net/email-api/api-reference/retrieve-webhook-signing-key) |
  | [`Webhooks.validate()`](/modules/webhooks/validate) | [Validate Enrolled Webhook](https://docs.mailchannels.net/email-api/api-reference/validate-enrolled-webhook) |
  | [`Webhooks.verify()`](/modules/webhooks/verify) | SDK only |
  | [`Webhooks.batches()`](/modules/webhooks/batches) | [Retrieve Webhook Batches](https://docs.mailchannels.net/email-api/api-reference/retrieve-webhook-batches) |
  | [`Webhooks.resendBatch()`](/modules/webhooks/resend-batch) | [Resend Events](https://docs.mailchannels.net/email-api/api-reference/resend-events) |

### 🪪 Sub-accounts

  | SDK Method | API Reference |
  | --- | --- |
  | [`SubAccounts.create()`](/modules/sub-accounts/create) | [Create Sub-account](https://docs.mailchannels.net/email-api/api-reference/create-sub-account) |
  | [`SubAccounts.list()`](/modules/sub-accounts/list) | [Retrieve Sub-accounts](https://docs.mailchannels.net/email-api/api-reference/retrieve-sub-accounts) |
  | [`SubAccounts.delete()`](/modules/sub-accounts/delete) | [Delete Sub-account](https://docs.mailchannels.net/email-api/api-reference/delete-sub-account) |
  | [`SubAccounts.suspend()`](/modules/sub-accounts/suspend) | [Suspend Sub-account](https://docs.mailchannels.net/email-api/api-reference/suspend-sub-account) |
  | [`SubAccounts.activate()`](/modules/sub-accounts/activate) | [Activate Sub-account](https://docs.mailchannels.net/email-api/api-reference/activate-sub-account) |
  | [`SubAccounts.createApiKey()`](/modules/sub-accounts/create-api-key) | [Create Sub-account API Key](https://docs.mailchannels.net/email-api/api-reference/create-sub-account-api-key) |
  | [`SubAccounts.deleteApiKey()`](/modules/sub-accounts/delete-api-key) | [Delete Sub-account API Key](https://docs.mailchannels.net/email-api/api-reference/delete-sub-account-api-key) |
  | [`SubAccounts.listApiKeys()`](/modules/sub-accounts/list-api-keys) | [Retrieve Sub-account API Keys](https://docs.mailchannels.net/email-api/api-reference/retrieve-sub-account-api-keys) |
  | [`SubAccounts.createSmtpPassword()`](/modules/sub-accounts/create-smtp-password) | [Create Sub-account SMTP Password](https://docs.mailchannels.net/email-api/api-reference/create-sub-account-smtp-password) |
  | [`SubAccounts.deleteSmtpPassword()`](/modules/sub-accounts/delete-smtp-password) | [Delete Sub-account SMTP Password](https://docs.mailchannels.net/email-api/api-reference/delete-sub-account-smtp-password) |
  | [`SubAccounts.listSmtpPasswords()`](/modules/sub-accounts/list-smtp-passwords) | [Retrieve Sub-account SMTP Passwords](https://docs.mailchannels.net/email-api/api-reference/retrieve-sub-account-smtp-passwords) |
  | [`SubAccounts.getLimit()`](/modules/sub-accounts/get-limit) | [Retrieve Sub-account Limit](https://docs.mailchannels.net/email-api/api-reference/retrieve-sub-account-limit) |
  | [`SubAccounts.setLimit()`](/modules/sub-accounts/set-limit) | [Set Sub-account Limit](https://docs.mailchannels.net/email-api/api-reference/set-sub-account-limit) |
  | [`SubAccounts.deleteLimit()`](/modules/sub-accounts/delete-limit) | [Delete Sub-account Limit](https://docs.mailchannels.net/email-api/api-reference/delete-sub-account-limit) |
  | [`SubAccounts.getUsage()`](/modules/sub-accounts/get-usage) | [Retrieve Sub-account Usage Stats](https://docs.mailchannels.net/email-api/api-reference/retrieve-sub-account-usage-stats) |

### 📊 Metrics

  | SDK Method | API Reference |
  | --- | --- |
  | [`Metrics.engagement()`](/modules/metrics/engagement) | [Retrieve Engagement Metrics](https://docs.mailchannels.net/email-api/api-reference/retrieve-engagement-metrics) |
  | [`Metrics.performance()`](/modules/metrics/performance) | [Retrieve Performance Metrics](https://docs.mailchannels.net/email-api/api-reference/retrieve-performance-metrics) |
  | [`Metrics.recipientBehaviour()`](/modules/metrics/recipient-behaviour) | [Retrieve Recipient Behaviour Metrics](https://docs.mailchannels.net/email-api/api-reference/retrieve-recipient-behaviour-metrics) |
  | [`Metrics.usage()`](/modules/metrics/usage) | [Retrieve Usage Stats](https://docs.mailchannels.net/email-api/api-reference/retrieve-usage-stats) |
  | [`Metrics.volume()`](/modules/metrics/volume) | [Retrieve Volume Metrics](https://docs.mailchannels.net/email-api/api-reference/retrieve-volume-metrics) |
  | [`Metrics.senders()`](/modules/metrics/senders) | [Retrieve Sender Metrics](https://docs.mailchannels.net/email-api/api-reference/retrieve-sender-metrics) |

### 🚫 Suppressions

  | SDK Method | API Reference |
  | --- | --- |
  | [`Suppressions.create()`](/modules/suppressions/create) | [Create Suppression Entries](https://docs.mailchannels.net/email-api/api-reference/create-suppression-entries) |
  | [`Suppressions.delete()`](/modules/suppressions/delete) | [Delete Suppression Entry](https://docs.mailchannels.net/email-api/api-reference/delete-suppression-entry) |
  | [`Suppressions.list()`](/modules/suppressions/list) | [Retrieve Suppression List](https://docs.mailchannels.net/email-api/api-reference/retrieve-suppression-list) |
