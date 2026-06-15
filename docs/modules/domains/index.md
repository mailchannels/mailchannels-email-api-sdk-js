---
title: 🌐 Domains
---

# 🌐 Domains<llm-exclude> <Badge>module</Badge> <Badge>Email API</Badge></llm-exclude>

<!-- #region description -->
This module allows you to check a domain's email authentication and manage DKIM keys for secure email delivery.
<!-- #endregion description -->

## Type declarations

<<< @/snippets/domains.ts
<<< @/snippets/domains-dkim.ts

<details>
  <summary>All type declarations</summary>

  **Response type declarations**

  <<< @/snippets/error-response.ts
  <<< @/snippets/data-response.ts
  <<< @/snippets/success-response.ts

  **Domain check type declarations**

  <<< @/snippets/domains-check.ts
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
</details>
