# API and Runtime Contracts

This app is still able to run entirely local-first, but it now models the core service contracts a production AI operating system needs.

## Core service surfaces

### 1. Workspace Sync API
Purpose:
- persist the full workspace state
- support pull/push cloud sync
- enable multi-operator continuity

Current contract:
- storage key: `workspace_state.workspace_key`
- payload: full workspace JSON document
- timestamps: `updated_at`, `created_at`

### 2. Approval Queue Endpoint
Purpose:
- capture requests that require governed action
- separate request creation from privileged execution
- preserve auditability

Core payload fields:
- title
- type
- target id
- requested by
- approver role
- status
- reason
- requested action
- payload

### 3. Trace Ingestion Endpoint
Purpose:
- track AI quality, safety, latency, cost, and feedback
- detect runtime failures, not just prompt failures

Core payload fields:
- system id
- title
- latency ms
- token cost usd
- quality score
- safety score
- outcome
- feedback
- notes

### 4. Knowledge Registry Endpoint
Purpose:
- maintain source-of-truth quality
- distinguish canonical, stale, and needs-review knowledge
- reduce hallucination caused by stale or weak source data

Core payload fields:
- title
- owner
- kind
- status
- summary
- citations
- last reviewed
- freshness score
- sensitivity

### 5. Delivery Router Endpoint
Purpose:
- route alerts and workflow events to channels like dashboard, email, and Slack
- capture sent/queued outcomes for auditability

Core payload fields:
- channel id
- title
- summary
- status
- created at

## Runtime principles

The product now treats these runtime principles as first-class:

- no high-risk AI without human review
- no restricted automation without explicit approval path
- no trust without trace visibility
- no AI reliability without source freshness
- no operational safety without pause / lockdown controls
- no serious workflow without reminders and next steps

## Why this matters

The hardest modern AI failures are increasingly runtime failures, governance failures, and data-quality failures — not just answer-generation failures.

That means production AI needs:
- endpoint contracts
- delivery guarantees
- human overrides
- observable traces
- source governance
- rollback paths

This repo now includes those foundations.
