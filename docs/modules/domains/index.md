---
title: 🌐 Domains
---

# 🌐 Domains<llm-exclude> <Badge>module</Badge> <Badge>Email API</Badge></llm-exclude>

<!-- #region description -->
This module allows you to check a domain's email authentication, manage DKIM keys for secure email delivery, and manage custom tracking domains.
<!-- #endregion description -->

## Type declarations

<<< @/snippets/domains.ts
<<< @/snippets/domains-dkim.ts
<<< @/snippets/domains-custom-tracking.ts

<details>
  <summary>All type declarations</summary>

  **Response type declarations**

  <<< @/snippets/error-response.ts
  <<< @/snippets/data-response.ts
  <<< @/snippets/success-response.ts

  **Domain check type declarations**

  <<< @/snippets/domains-check-dkim.ts
  <<< @/snippets/domains-check-options.ts
  <<< @/snippets/domains-check-verdict.ts
  <<< @/snippets/domains-check-response.ts

  **Create DKIM Key type declarations**

  <<< @/snippets/domains-dkim-create-options.ts
  <<< @/snippets/domains-dkim-key-status.ts
  <<< @/snippets/domains-dkim-key.ts
  <<< @/snippets/domains-dkim-create-response.ts

  **List DKIM Keys type declarations**

  <<< @/snippets/domains-dkim-list-options.ts
  <<< @/snippets/optional.ts
  <<< @/snippets/domains-dkim-list-response.ts

  **Update DKIM Key type declarations**

  <<< @/snippets/domains-dkim-update-status-options.ts

  **Rotate DKIM Key type declarations**

  <<< @/snippets/domains-dkim-rotate-options.ts
  <<< @/snippets/domains-dkim-rotate-response.ts

  **Custom Tracking Domain type declarations**

  <<< @/snippets/domains-custom-tracking-scope.ts
  <<< @/snippets/domains-custom-tracking-domain.ts
  <<< @/snippets/domains-custom-tracking-with-dns-setup-required.ts

  **Create Custom Tracking Domain type declarations**

  <<< @/snippets/domains-custom-tracking-dns-setup-required.ts
  <<< @/snippets/domains-custom-tracking-create-response.ts

  **List Custom Tracking Domains response type declarations**

  <<< @/snippets/domains-custom-tracking-list-options.ts
  <<< @/snippets/domains-custom-tracking-list-response.ts

  **Update Custom Tracking Domain type declarations**

  <<< @/snippets/domains-custom-tracking-update-options.ts
  <<< @/snippets/domains-custom-tracking-dns-setup-required.ts
  <<< @/snippets/domains-custom-tracking-with-dns-setup-required.ts
  <<< @/snippets/domains-custom-tracking-update-response.ts
</details>
