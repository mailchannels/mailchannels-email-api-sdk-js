# SDK-API Mapping

This page provides a mapping between the MailChannels SDK module methods and the corresponding API endpoint reference.

## Email API

### 📧 Emails

  | SDK Method | API Reference |
  | --- | --- |
  | [`Emails.send()`](/modules/emails/send) | [Send an Email](https://docs.mailchannels.com/api-reference/send/send-an-email) |
  | [`Emails.queue()`](/modules/emails/queue) | [Send an Email Asynchronously](https://docs.mailchannels.com/api-reference/send/send-an-email-asynchronously) |

### 🌐 Domains

  | SDK Method | API Reference |
  | --- | --- |
  | [`Domains.check()`](/modules/domains/check) | [DKIM, SPF & Domain Lockdown Check](https://docs.mailchannels.com/api-reference/dkim/dkim-spf-&-domain-lockdown-check) |
  | [`Domains.dkim.create()`](/modules/domains/dkim-create) | [Create DKIM Key Pair](https://docs.mailchannels.com/api-reference/dkim/create-dkim-key-pair) |
  | [`Domains.dkim.list()`](/modules/domains/dkim-list) | [Retrieve DKIM Keys](https://docs.mailchannels.com/api-reference/dkim/retrieve-dkim-keys) |
  | [`Domains.dkim.updateStatus()`](/modules/domains/dkim-update-status) | [Update DKIM Key Status](https://docs.mailchannels.com/api-reference/dkim/update-dkim-key-status) |
  | [`Domains.dkim.rotate()`](/modules/domains/dkim-rotate) | [Rotate DKIM Key Pair](https://docs.mailchannels.com/api-reference/dkim/rotate-dkim-key-pair) |
  | [`Domains.customTracking.create()`](/modules/domains/custom-tracking-create) | [Register Custom Tracking Domain](https://docs.mailchannels.com/api-reference/custom-tracking/register-custom-tracking-domain) |
  | [`Domains.customTracking.list()`](/modules/domains/custom-tracking-list) | [Retrieve Custom Tracking Domains](https://docs.mailchannels.com/api-reference/custom-tracking/retrieve-custom-tracking-domains) |
  | [`Domains.customTracking.update()`](/modules/domains/custom-tracking-update) | [Update Custom Tracking Domain](https://docs.mailchannels.com/api-reference/custom-tracking/update-custom-tracking-domain) |
  | [`Domains.customTracking.delete()`](/modules/domains/custom-tracking-delete) | [Delete Custom Tracking Domain](https://docs.mailchannels.com/api-reference/custom-tracking/delete-custom-tracking-domain) |

### 📢 Webhooks

  | SDK Method | API Reference |
  | --- | --- |
  | [`Webhooks.create()`](/modules/webhooks/create) | [Enroll for Webhook Notifications](https://docs.mailchannels.com/api-reference/webhooks/enroll-for-webhook-notifications) |
  | [`Webhooks.list()`](/modules/webhooks/list) | [Retrieve Customer Webhooks](https://docs.mailchannels.com/api-reference/webhooks/retrieve-customer-webhooks) |
  | [`Webhooks.deleteAll()`](/modules/webhooks/delete-all) | [Delete Customer Webhooks](https://docs.mailchannels.com/api-reference/webhooks/delete-customer-webhooks) |
  | [`Webhooks.getSigningKey()`](/modules/webhooks/get-signing-key) | [Retrieve Webhook Signing Key](https://docs.mailchannels.com/api-reference/webhooks/retrieve-webhook-signing-key) |
  | [`Webhooks.validate()`](/modules/webhooks/validate) | [Validate Enrolled Webhook](https://docs.mailchannels.com/api-reference/webhooks/validate-enrolled-webhook) |
  | [`Webhooks.verify()`](/modules/webhooks/verify) | SDK only |
  | [`Webhooks.batches()`](/modules/webhooks/batches) | [Retrieve Webhook Batches](https://docs.mailchannels.com/api-reference/webhooks/retrieve-webhook-batches) |
  | [`Webhooks.resendBatch()`](/modules/webhooks/resend-batch) | [Resend Events](https://docs.mailchannels.com/api-reference/webhooks/resend-events) |

### 🪪 Sub-accounts

  | SDK Method | API Reference |
  | --- | --- |
  | [`SubAccounts.create()`](/modules/sub-accounts/create) | [Create Sub-account](https://docs.mailchannels.com/api-reference/sub-accounts/create-sub-account) |
  | [`SubAccounts.list()`](/modules/sub-accounts/list) | [Retrieve Sub-accounts](https://docs.mailchannels.com/api-reference/sub-accounts/retrieve-sub-accounts) |
  | [`SubAccounts.delete()`](/modules/sub-accounts/delete) | [Delete Sub-account](https://docs.mailchannels.com/api-reference/sub-accounts/delete-sub-account) |
  | [`SubAccounts.suspend()`](/modules/sub-accounts/suspend) | [Suspend Sub-account](https://docs.mailchannels.com/api-reference/sub-accounts/suspend-sub-account) |
  | [`SubAccounts.activate()`](/modules/sub-accounts/activate) | [Activate Sub-account](https://docs.mailchannels.com/api-reference/sub-accounts/activate-sub-account) |
  | [`SubAccounts.apiKeys.create()`](/modules/sub-accounts/api-keys-create) | [Create Sub-account API Key](https://docs.mailchannels.com/api-reference/sub-accounts/create-sub-account-api-key) |
  | [`SubAccounts.apiKeys.delete()`](/modules/sub-accounts/api-keys-delete) | [Delete Sub-account API Key](https://docs.mailchannels.com/api-reference/sub-accounts/delete-sub-account-api-key) |
  | [`SubAccounts.apiKeys.list()`](/modules/sub-accounts/api-keys-list) | [Retrieve Sub-account API Keys](https://docs.mailchannels.com/api-reference/sub-accounts/retrieve-sub-account-api-keys) |
  | [`SubAccounts.smtpPasswords.create()`](/modules/sub-accounts/smtp-passwords-create) | [Create Sub-account SMTP Password](https://docs.mailchannels.com/api-reference/sub-accounts/create-sub-account-smtp-password) |
  | [`SubAccounts.smtpPasswords.delete()`](/modules/sub-accounts/smtp-passwords-delete) | [Delete Sub-account SMTP Password](https://docs.mailchannels.com/api-reference/sub-accounts/delete-sub-account-smtp-password) |
  | [`SubAccounts.smtpPasswords.list()`](/modules/sub-accounts/smtp-passwords-list) | [Retrieve Sub-account SMTP Passwords](https://docs.mailchannels.com/api-reference/sub-accounts/retrieve-sub-account-smtp-passwords) |
  | [`SubAccounts.limits.get()`](/modules/sub-accounts/limits-get) | [Retrieve Sub-account Limit](https://docs.mailchannels.com/api-reference/sub-accounts/retrieve-sub-account-limit) |
  | [`SubAccounts.limits.set()`](/modules/sub-accounts/limits-set) | [Set Sub-account Limit](https://docs.mailchannels.com/api-reference/sub-accounts/set-sub-account-limit) |
  | [`SubAccounts.limits.delete()`](/modules/sub-accounts/limits-delete) | [Delete Sub-account Limit](https://docs.mailchannels.com/api-reference/sub-accounts/delete-sub-account-limit) |
  | [`SubAccounts.getUsage()`](/modules/sub-accounts/get-usage) | [Retrieve Sub-account Usage Stats](https://docs.mailchannels.com/api-reference/sub-accounts/retrieve-sub-account-usage-stats) |

### 📊 Metrics

  | SDK Method | API Reference |
  | --- | --- |
  | [`Metrics.engagement()`](/modules/metrics/engagement) | [Retrieve Engagement Metrics](https://docs.mailchannels.com/api-reference/metrics/retrieve-engagement-metrics) |
  | [`Metrics.performance()`](/modules/metrics/performance) | [Retrieve Performance Metrics](https://docs.mailchannels.com/api-reference/metrics/retrieve-performance-metrics) |
  | [`Metrics.recipientBehaviour()`](/modules/metrics/recipient-behaviour) | [Retrieve Recipient Behaviour Metrics](https://docs.mailchannels.com/api-reference/metrics/retrieve-recipient-behaviour-metrics) |
  | [`Metrics.usage()`](/modules/metrics/usage) | [Retrieve Usage Stats](https://docs.mailchannels.com/api-reference/usage/retrieve-usage-stats) |
  | [`Metrics.volume()`](/modules/metrics/volume) | [Retrieve Volume Metrics](https://docs.mailchannels.com/api-reference/metrics/retrieve-volume-metrics) |
  | [`Metrics.senders()`](/modules/metrics/senders) | [Retrieve Sender Metrics](https://docs.mailchannels.com/api-reference/metrics/retrieve-sender-metrics) |

### 🚫 Suppressions

  | SDK Method | API Reference |
  | --- | --- |
  | [`Suppressions.create()`](/modules/suppressions/create) | [Create Suppression Entries](https://docs.mailchannels.com/api-reference/suppression/create-suppression-entries) |
  | [`Suppressions.delete()`](/modules/suppressions/delete) | [Delete Suppression Entry](https://docs.mailchannels.com/api-reference/suppression/delete-suppression-entry) |
  | [`Suppressions.list()`](/modules/suppressions/list) | [Retrieve Suppression List](https://docs.mailchannels.com/api-reference/suppression/retrieve-suppression-list) |
