# OpenAPI Specification

This directory contains the OpenAPI specifications of MailChannels Email API.

## Maintenance

The following files are intended for monitoring and testing purposes to ensure parity with the current Email API version.

Use `pnpm parity:fixtures` to refresh these files:

| File                                      | Purpose                                            |
| ----------------------------------------- | -------------------------------------------------- |
| `/docs/.openapi/email-api.yaml`           | Monitoring and comparing Email API version changes |
| `/README.md`                              | Note on current built Email API version            |
| `/test/fixtures/email-api-endpoints.json` | Mapped Email API endpoints for parity testing      |
