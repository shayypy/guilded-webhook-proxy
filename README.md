Prior to December 2023, Guilded had a native implementation of incoming GitHub webhook payloads. Unfortunately, this was removed along with some other webhook changes. This application brings it back as a drop-in replacement!

For brevity, this application (guilded-webhook-proxy) will be referred to as "GWP" going forward.

## How to use

Simply replace `media.guilded.gg` in your webhook URL with `guilded.shayy.workers.dev`. Keep the content type set to `application/json`.

## Goodies

### Silent errors

Guilded sent errors about unknown event types through as a message, but this proxy does not. If you want to see everything without errors in your chat channel, just enable "Send me everything".

<!-- ### Immersive discussion

Pass `?immersive=true` at the end of the webhook URL to enable immersive discussion mode.  -->

### Reactions (optional)

By default, GWP will show reaction counts (if any) under some applicable events. If you don't like this, you can pass `reactions=false` as a query parameter to disable it.

## Supported Events

- [ ] branch_protection_configuration
- [ ] branch_protection_rule
<!-- - [x] check_run -->
- [ ] check_suite
- [ ] code_scanning_alert
- [x] commit_comment
- [ ] create
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
- [x] public
- [x] pull_request
- [x] pull_request_review_comment
- [x] pull_request_review
- [ ] pull_request_review_thread
<!-- - [x] push -->
- [ ] registry_package
<!-- - [x] release -->
- [ ] repository_advisory
<!-- - [x] repository -->
- [ ] repository_dispatch
- [ ] repository_import
- [ ] repository_ruleset
- [ ] repository_vulnerability_alert
- [ ] secret_scanning_alert
- [ ] secret_scanning_alert_location
- [ ] security_advisory
- [ ] security_and_analysis
- [ ] sponsorship
<!-- - [x] star -->
<!-- - [x] status -->
- [ ] team_add
- [ ] team
<!-- - [x] watch -->
- [ ] workflow_dispatch
- [ ] workflow_job
- [ ] workflow_run

## Limitations

The native Guilded implementation of this feature could create threads for pull request comments, but that is not possible as a regular application like GWP.
