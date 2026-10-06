# GitHub discovery mirror

Canonical source and contribution instructions: https://bitbucket.org/mailchannels/mailchannels-email-api-sdk-js

Install the official package from https://www.npmjs.com/package/mailchannels-sdk.
JavaScript quickstart: https://docs.mailchannels.com/email-api/javascript/quickstart

This repository mirrors public upstream main and release tags daily. Only `.github/` is
mirror-specific; SDK code, README, license and version tags retain upstream content.
A sync is not a new package release or a fresh SDK test run. Issues and changes belong
upstream; see its canonical repository. No package publication runs here.

The workflow runs Git operations only, never upstream package scripts. It refuses
upstream `.github/` content or source divergence, does not overwrite tags or delete refs,
and pushes main/tags atomically. Maintainers must investigate failed runs, restore a
clean mirror after conflicts, and monitor the Actions page for freshness. GitHub may
suspend schedules in inactive public repositories; reactivate and dispatch a sync if needed.
Disable the workflow to stop syncing. Credentials are the repository-scoped GITHUB_TOKEN;
no Bitbucket or MailChannels secret is required. Pull requests do not run this workflow.
