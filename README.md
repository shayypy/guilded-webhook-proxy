# guilded-webhook-proxy

Prior to December 2023, Guilded had a native implementation of incoming GitHub webhook payloads. Unfortunately, this was removed along with some other webhook changes. This application brings it back as a drop-in replacement!

For brevity, this application (guilded-webhook-proxy) will be referred to as "GWP" going forward.

## How to use

Simply replace `media.guilded.gg` in your webhook URL with `guilded.shayy.workers.dev`. Keep the content type set to `application/json`. You can also use [this handy URL generator](https://gwp.shay.cat)!

## Goodies

### Silent errors

Guilded sent errors about unknown event types through as a message, but this proxy does not. If you want to see everything without errors in your chat channel, just enable "Send me everything" (although you may want to disable `star` and `watch` for particularly large repositories).

### Custom profiles

Guilded forced a webhook name of GitHub and avatar of the GitHub logo, but this can be disabled in GWP by passing `branded=false` as a query parameter. This will cause the messages to use the default name & avatar configured in Guilded settings. To customize even further, pass `username=xxx` and/or `avatarUrl=yyy`, where `xxx` is a URL-encoded string up to 128 characters, and `yyy` is a URL-encoded image URL for the profile picture. This is particularly useful if you want to use the same webhook for multiple repositories or organizations. This will be ignored for applicable [immersive mode](#immersive-discussion) messages.

### Immersive discussion

Pass `immersive=chat` at the end of the webhook URL to enable immersive discussion mode. This feature makes use of custom profiles to make it appear like GitHub users are chatting in your webhook channel. To display user messages with embeds (different sub/superset of markdown), use `immersive=embeds` instead.

### Reactions (optional)

By default, GWP will show reaction counts (if any) under some applicable events. If you don't like this, you can pass `reactions=false` as a query parameter to disable it.

### No draft spam

By default, to avoid spam, messages generated for the `release` event will not be sent if the release is still marked as a draft. To disable this and see messages for draft releases, pass `drafts=true` as a query parameter.

### API

This service exposes a `POST /raw/github` endpoint which will return the raw webhook request body, including [Guilded formatted embeds](https://www.guilded.gg/docs/api/chat/ChatEmbed), as the response body when a [GitHub event](https://docs.github.com/en/webhooks/webhook-events-and-payloads) is provided as the request. Be sure to preserve the headers, except for the user agent.

This endpoint may return an empty message if your query parameters dictated that a particular event should be ignored.

## Supported Events

- [ ] branch_protection_configuration
- [ ] branch_protection_rule
- [ ] check_run
- [ ] check_suite
- [ ] code_scanning_alert
- [x] commit_comment
- [x] create
- [ ] custom_property
- [ ] custom_property_values
- [x] delete
- [ ] dependabot_alert
- [ ] deploy_key
- [ ] deployment
- [ ] deployment_protection_rule
- [ ] deployment_review
- [ ] deployment_status
- [ ] discussion
- [ ] discussion_comment
- [x] fork
- [ ] github_app_authorization
- [ ] gollum
- [ ] installation
- [ ] installation_repositories
- [ ] installation_target
- [x] issue_comment
- [x] issues
- [ ] label
- [ ] marketplace_purchase
- [ ] member
- [ ] membership
- [ ] merge_group
- [x] meta
- [ ] milestone
- [ ] org_block
- [ ] organization
- [ ] package
- [ ] page_build
- [ ] personal_access_token_request
- [x] ping
- [ ] project_card
- [ ] project
- [ ] project_column
- [ ] projects_v2
- [ ] projects_v2_item
- [ ] public (uses `repository.publicized` instead)
- [x] pull_request
- [x] pull_request_review_comment
- [x] pull_request_review
- [ ] pull_request_review_thread
- [x] push
- [ ] registry_package
- [x] release
- [ ] repository_advisory
- [x] repository
- [ ] repository_dispatch
- [ ] repository_import
- [ ] repository_ruleset
- [ ] repository_vulnerability_alert
- [ ] secret_scanning_alert
- [ ] secret_scanning_alert_location
- [ ] security_advisory
- [ ] security_and_analysis
- [ ] sponsorship
- [x] star
- [x] status
- [ ] team_add
- [ ] team
- [x] watch
- [ ] workflow_dispatch
- [ ] workflow_job
- [ ] workflow_run

## Limitations

The native Guilded implementation of this feature could create threads for pull request comments, but that is not possible as a regular application like GWP.

## Terms of Use

Do not use this application to intentionally send spam to a Guilded webhook. Do not impersonate a GitHub webhook agent.

## Privacy

This is a stateless application. Incoming data is reformatted for and delivered to the Guilded webhook endpoint specified by the chosen URL, then it is discarded. For concerns, contact [shay on Guilded](https://www.guilded.gg/bearger) or [create an issue](https://github.com/shayypy/guilded-webhook-proxy/issues).
