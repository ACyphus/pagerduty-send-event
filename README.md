# PagerDuty Send Event GitHub Action

[![GitHub Super-Linter](https://github.com/actions/javascript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/javascript-action/actions/workflows/ci.yml/badge.svg)

Trigger, acknowledge, and resolve events and incidents in PagerDuty with this GitHub Action.

Designed with useful defaults, this Action provides an easy way to start sending events to PagerDuty while allowing plenty of customization for your specific workflow needs.

## Getting started

To send events to PagerDuty, you'll need to set up a service integration and copy the integration key into an Actions secret in your repository:

1. Create a service integration in PagerDuty:
  a. Go to PagerDuty > "Services" > Pick your service > "Integrations" > "Add a new integration"
  b. Choose "Events API v2" and click "Add"
  c. Click the cog icon and copy the integration key
2. Set up an [Actions secret in your GitHub repository named `PAGERDUTY_INTEGRATION_KEY`](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository)

### Simple workflow

In your `steps`:

```yml
- name: Send event to PagerDuty
  uses: ACyphus/pagerduty-send-event@v1
  with:
    integration-key: ${{ secrets.PAGERDUTY_INTEGRATION_KEY }}
    dedup-key: ${{ github.run_id }}
```

This will trigger a critical alert in your service.

## Usage

This Action can be used in many ways, such as triggering an alert [if a CI job fails](https://docs.github.com/en/actions/learn-github-actions/expressions#failure) or when a new issue is opened with a specific label. The Action can also be used to acknowledge or resolve existing alerts.

### Inputs

#### `integration-key`

The PagerDuty Integration Key. Used to route your event to the correct service.

Required for all events

Default: None

#### `dedup-key`

Identifies the alert to `trigger`, `acknowledge`, or `resolve`.

Required, unless the `event_type` is `trigger`

Default: None

#### `event-action`

The type of event. Can be `trigger`, `acknowledge`, or `resolve`.

Default: `trigger`

#### `summary`

A brief text summary of the event, used to generate the summaries/titles of any
associated alerts.

Default: `Alert from ${{github.repository}} by ${{github.actor}}`

#### `source`

The unique location of the affected system.

Default: `GitHub Actions in ${{github.repository}}`

#### `severity`

The perceived severity of the status the event is describing with respect to the
affected system. Can be `info`, `warning`, `error`, or `critical`.

Default: `critical`

#### `client`

The name of the monitoring client that is triggering this event. This field is
only used for `trigger` events.

Default: `${{github.repository}}`

#### `client-url`

The URL of the monitoring client that is triggering this event. This field is
only used for `trigger` events.

Default:
`https://github.com/${{github.repository}}/actions/runs/${{github.run_id}}`

### Example alert on CI failure

This example will send an event to PagerDuty if any CI tests fail:

`.github/workflows/ci.yml`

```yml
name: Continuous Integration

on:
  pull_request:
    branches:
      - main
  push:
    branches:
      - main

jobs:
  test-javascript:
    name: JavaScript Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        id: checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        id: setup-node
        uses: actions/setup-node@v4

      - name: Install Dependencies
        id: npm-ci
        run: npm ci

      - name: Test
        id: npm-ci-test
        run: npm run ci-test

      - name: Alert PagerDuty on failure
        if: ${{ failure() }}
        uses: ACyphus/pagerduty-send-event@v1
        with:
          integration-key: ${{ secrets.PAGERDUTY_TESTING_TOKEN }}
          dedup-key: ${{ github.run_id }}
          event-action: trigger
          summary: 'CI test failure in ${{ github.repository }}'
          source: 'GitHub Actions in ${{ github.repository }}'
          severity: error
```

### Example alert on new issue with label

This example will send an event to PagerDuty when an issue with a specific label is opened:

`.github/workflows/vuln-alert.yml`

```yml
name: vuln alert

on:
  issues:
    types: opened

env:
  ISSUE_URL: ${{ github.event.issue.html_url }}
  ISSUE_ID: ${{ github.event.issue.number }}
  TITLE: ${{ github.event.issue.title }}

jobs:
  alert-on-vulnerability-report:
    if: contains(github.event.issue.labels.*.name,'vulnerability')
    runs-on: ubuntu-latest

    steps:
      - name: Alert PagerDuty on new vulnerability report
        uses: ACyphus/pagerduty-send-event@v1
        with:
          integration-key: ${{ secrets.PAGERDUTY_TESTING_TOKEN }}
          dedup-key: ${{ env.ISSUE_ID }}
          event-action: trigger
          summary: 'Vuln report: ${{ env.TITLE }}'
          source: 'GitHub Actions in ${{ github.repository }}'
          severity: critical
          client: '${{ github.respository}}#${{ env.ISSUE_ID }}'
          client-url: ${{ env.ISSUE_URL }}
```
