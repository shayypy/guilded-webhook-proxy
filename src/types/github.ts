import z from "zod";

export const GitHubHeader = z.enum([
  "X-GitHub-Hook-ID",
  "X-GitHub-Event",
  "X-GitHub-Delivery",
  "X-Hub-Signature",
  "X-Hub-Signature-256",
  "User-Agent",
  "X-GitHub-Hook-Installation-Target-Type",
  "X-GitHub-Hook-Installation-Target-ID",
]);

export const GitHubEventType = z.enum([
  // "branch_protection_configuration",
  // "branch_protection_rule",
  "check_run",
  // "check_suite",
  // "code_scanning_alert",
  "commit_comment",
  // "create",
  // "custom_property",
  // "custom_property_values",
  "delete",
  // "dependabot_alert",
  // "deploy_key",
  // "deployment",
  // "deployment_protection_rule",
  // "deployment_review",
  // "deployment_status",
  // "discussion",
  // "discussion_comment",
  "fork",
  // "github_app_authorization",
  // "gollum",
  // "installation",
  // "installation_repositories",
  // "installation_target",
  "issue_comment",
  "issues",
  // "label",
  // "marketplace_purchase",
  // "member",
  // "membership",
  // "merge_group",
  "meta",
  // "milestone",
  // "org_block",
  // "organization",
  // "package",
  // "page_build",
  // "personal_access_token_request",
  "ping",
  // "project_card",
  // "project",
  // "project_column",
  // "projects_v2",
  // "projects_v2_item",
  "public",
  "pull_request",
  "pull_request_review_comment",
  "pull_request_review",
  "pull_request_review_thread",
  "push",
  // "registry_package",
  "release",
  // "repository_advisory",
  "repository",
  // "repository_dispatch",
  // "repository_import",
  // "repository_ruleset",
  // "repository_vulnerability_alert",
  // "secret_scanning_alert",
  // "secret_scanning_alert_location",
  // "security_advisory",
  // "security_and_analysis",
  // "sponsorship",
  "star",
  "status",
  // "team_add",
  // "team",
  "watch",
  // "workflow_dispatch",
  // "workflow_job",
  // "workflow_run",
]);

export const GitHubAuthorAssociation = z.enum([
  "COLLABORATOR", "CONTRIBUTOR", "FIRST_TIMER", "FIRST_TIME_CONTRIBUTOR", "MANNEQUIN", "MEMBER", "NONE", "OWNER"
]);

export const GitHubUser = z.object({
  login: z.string(),
  id: z.number(),
  name: z.ostring().nullable(),
  email: z.ostring().nullable(),
  avatar_url: z.ostring(),
  gravatar_id: z.ostring().nullable(),
  url: z.ostring(),
  html_url: z.ostring(),
  followers_url: z.ostring(),
  following_url: z.ostring(),
  gists_url: z.ostring(),
  starred_url: z.ostring(),
  subscriptions_url: z.ostring(),
  organizations_url: z.ostring(),
  repos_url: z.ostring(),
  events_url: z.ostring(),
  received_events_url: z.ostring(),
  type: z.enum(["Bot", "User", "Organization", "Mannequin"]).optional(),
  site_admin: z.boolean(),
  starred_at: z.ostring(),
});

export const GitHubRepository = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  owner: GitHubUser,
  private: z.boolean(),
  description: z.string().nullable(),
  fork: z.boolean(),
  url: z.string(),
  homepage: z.ostring().nullable(),
  language: z.ostring().nullable(),
  forks_count: z.onumber(),
  stargazers_count: z.onumber(),
  watchers_count: z.onumber(),
  size: z.onumber(),
  default_branch: z.ostring(),
  open_issues_count: z.onumber(),
  is_template: z.oboolean(),
  topics: z.string().array().optional(),
  has_issues: z.oboolean(),
  has_projects: z.oboolean(),
  has_wiki: z.oboolean(),
  has_pages: z.oboolean(),
  has_downloads: z.oboolean(),
  has_discussions: z.oboolean(),
  archived: z.oboolean(),
  disabled: z.oboolean(),
  visibility: z.ostring(),
  pushed_at: z.ostring().nullable(),
  created_at: z.ostring().nullable(),
  updated_at: z.ostring().nullable(),
  // ...
  forks: z.onumber(),
  open_issues: z.onumber(),
  watchers: z.onumber(),
  allow_forking: z.oboolean(),
});

export const GitHubApp = z.object({
  id: z.number(),
  slug: z.ostring(),
  node_id: z.string(),
  owner: GitHubUser,
  name: z.string(),
  description: z.string().nullable(),
  external_url: z.string(),
  html_url: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  permissions: z.object({
    issues: z.ostring(),
    checks: z.ostring(),
    metadata: z.ostring(),
    contents: z.ostring(),
    deployments: z.ostring(),
  }),
  events: z.string().array(),
  installations_count: z.onumber(),
  client_id: z.ostring(),
  client_secret: z.ostring(),
  webhook_secret: z.ostring().nullable(),
  pem: z.ostring(),
});

export const GitHubBranch = z.object({
  ref: z.string(),
  sha: z.string(),
  repo: z.object({
    id: z.number(),
    url: z.string(),
    name: z.string(),
  }),
});

export const GitHubPullRequestPartial = z.object({
  id: z.number(),
  number: z.number(),
  url: z.string(),
  head: GitHubBranch,
  base: GitHubBranch,
});

export const GitHubActiveLockReason = z.enum(["resolved", "off-topic", "too heated", "spam"]);

export const GitHubIssueLabel = z.object({
  color: z.string(),
  default: z.boolean(),
  description: z.string().nullable(),
  id: z.number(),
  name: z.string(),
  url: z.string(),
});

export const GitHubPullRequest = z.object({
  _links: z.record(
    z.enum(["comments", "commits", "html", "issue", "review_comment", "review_comments", "self", "statuses"]),
    z.object({ href: z.string() }),
  ),
  id: z.number(),
  number: z.number(),
  url: z.string(),
  active_lock_reason: GitHubActiveLockReason.nullable(),
  additions: z.onumber(),
  assignee: GitHubUser.nullable(),
  assignees: GitHubUser.nullable().array(),
  author_association: GitHubAuthorAssociation,
  auto_merge: z.object({
    commit_message: z.string().nullable(),
    commit_title: z.string().nullable(),
    enabled_by: GitHubUser.nullable(),
    merge_method: z.enum(["merge", "squash", "rebase"]),
  }).nullable(),
  base: z.object({
    label: z.string(),
    ref: z.string(),
    repo: GitHubRepository,
    sha: z.string(),
    user: GitHubUser.nullable(),
  }),
  body: z.string().nullable(),
  changed_files: z.onumber(),
  closed_at: z.string().nullable(),
  comments: z.onumber(),
  comments_url: z.string(),
  commits: z.onumber(),
  commits_url: z.string(),
  created_at: z.string(),
  deletions: z.onumber(),
  diff_url: z.string(),
  draft: z.boolean(),
  // head,
  html_url: z.string(),
  issue_url: z.string(),
  labels: GitHubIssueLabel.array(),
  locked: z.boolean(),
  maintainer_can_modify: z.oboolean(),
  merge_commit_sha: z.string().nullable(),
  mergeable: z.oboolean().nullable(),
  mergeable_state: z.ostring(),
  merged: z.oboolean().nullable(),
  merged_at: z.string().nullable(),
  merged_by: GitHubUser.nullable(),
  // milestone,
  patch_url: z.string(),
  rebaseable: z.oboolean().nullable(),
  // requested_reviewers: array,
  review_comments: z.onumber(),
  review_comments_url: z.string(),
  state: z.enum(["open", "closed"]),
  title: z.string(),
  updated_at: z.string(),
  user: GitHubUser.nullable(),
});

export const GitHubReactions = z.object({
  "+1": z.number(),
  "-1": z.number(),
  confused: z.number(),
  eyes: z.number(),
  heart: z.number(),
  hooray: z.number(),
  laugh: z.number(),
  rocket: z.number(),
  total_count: z.number(),
  url: z.string(),
});

export const GitHubIssue = z.object({
  active_lock_reason: GitHubActiveLockReason.nullable(),
  assignee: GitHubUser.nullable(),
  assignees: GitHubUser.nullable().array(),
  author_association: GitHubAuthorAssociation,
  body: z.string().nullable(),
  closed_at: z.string().nullable(),
  comments: z.number(),
  comments_url: z.string(),
  created_at: z.string(),
  draft: z.oboolean(),
  html_url: z.string(),
  id: z.number(),
  labels: GitHubIssueLabel.array(),
  locked: z.boolean(),
  number: z.number(),
  pull_request: z.object({
    diff_url: z.ostring(),
    html_url: z.ostring(),
    merged_at: z.ostring().nullable(),
    patch_url: z.ostring(),
    url: z.ostring(),
  }).optional(),
  reactions: GitHubReactions,
  repository_url: z.string(),
  state: z.enum(["open", "closed"]),
  state_reason: z.ostring().nullable(),
  timeline_url: z.ostring(),
  title: z.string(),
  updated_at: z.string(),
  url: z.string(),
  user: GitHubUser,
});

export const GitHubComment = z.object({
  author_association: GitHubAuthorAssociation,
  body: z.string(),
  commit_id: z.ostring(),
  created_at: z.string(),
  html_url: z.string(),
  id: z.number(),
  in_reply_to_id: z.onumber(),
  line: z.onumber().nullable(),
  path: z.ostring().nullable(),
  position: z.onumber().nullable(),
  reactions: GitHubReactions.optional(),
  user: GitHubUser,
});

export const GitHubWebhook = z.object({
  active: z.boolean(),
  app_id: z.onumber(),
  config: z.object({
    content_type: z.enum(["json", "form"]).optional(),
    insecure_ssl: z.string().or(z.number()).optional(),
    secret: z.ostring(),
    url: z.ostring(),
  }),
  created_at: z.string(),
  deliveries_url: z.ostring(),
  events: z.string().array(),
  id: z.number(),
  last_response: z.object({
    code: z.number().nullable(),
    status: z.string().nullable(),
    message: z.string().nullable(),
  }).optional(),
  name: z.literal("web"),
  ping_url: z.ostring(),
  test_url: z.ostring(),
  type: z.string(),
  updated_at: z.string(),
  url: z.ostring(),
});

export const GitHubEventTypeToPayload = {
  check_run: z.object({
    type: z.literal("check_run"),
    pl: z.object({
      action: z.enum(["completed", "created", "requested_action", "rerequested"]),
      check_run: z.object({
        app: GitHubApp,
        check_suite: z.object({
          after: z.ostring().nullable(),
          app: GitHubApp,
          before: z.ostring().nullable(),
          conclusion: z.enum([
            "success",
            "failure",
            "neutral",
            "cancelled",
            "skipped",
            "timed_out",
            "action_required",
            "stale",
            "startup_failure",
          ]).nullable(),
          created_at: z.ostring(),
          head_branch: z.ostring(),
          head_sha: z.ostring(),
          id: z.onumber(),
          node_id: z.ostring(),
          pull_requests: GitHubPullRequestPartial.array(),
          repository: GitHubRepository,
          status: z.enum([
            "queued",
            "in_progress",
            "completed",
            "pending",
            "waiting",
          ]).optional(),
          waiting_at: z.ostring(),
          url: z.ostring(),
        }),
        completed_at: z.string().nullable(),
        // conclusion: z.string().nullable(),
        // ...
      }),
      repository: GitHubRepository,
      requested_action: z.object({
        identifier: z.ostring(),
      }).optional(),
      sender: GitHubUser,
    })
  }),
  commit_comment: z.object({
    type: z.literal("commit_comment"),
    pl: z.object({
      action: z.literal("created"),
      comment: GitHubComment,
      repository: GitHubRepository,
      sender: GitHubUser,
    })
  }),
  delete: z.object({
    type: z.literal("delete"),
    pl: z.object({
      pusher_type: z.string(),
      ref: z.string(),
      ref_type: z.enum(["tag", "branch"]),
      repository: GitHubRepository,
      sender: GitHubUser,
    })
  }),
  fork: z.object({
    type: z.literal("fork"),
    pl: z.object({
      forkee: GitHubRepository,
      repository: GitHubRepository,
      sender: GitHubUser,
    }),
  }),
  issue_comment: z.object({
    type: z.literal("issue_comment"),
    pl: z.object({
      action: z.enum(["created", "deleted", "edited"]),
      comment: GitHubComment,
      issue: GitHubIssue,
      repository: GitHubRepository,
      sender: GitHubUser,
    }),
  }),
  issues: z.object({
    type: z.literal("issues"),
    pl: z.object({
      action: z.enum(["assigned", "closed", "deleted", "demilestoned", "edited", "labeled", "locked", "milestoned", "opened", "pinned", "reopened", "transferred", "unassigned", "unlabeled", "unlocked", "unpinned"]),
      assignee: GitHubUser.optional(),
      issue: GitHubIssue,
      repository: GitHubRepository,
      sender: GitHubUser,
    }),
  }),
  meta: z.object({
    type: z.literal("meta"),
    pl: z.object({
      action: z.literal("deleted"),
      hook: GitHubWebhook,
      hook_id: z.number(),
      repository: GitHubRepository.optional(),
      sender: GitHubUser.optional(),
    }),
  }),
  ping: z.object({
    type: z.literal("ping"),
    pl: z.object({
      hook: GitHubWebhook.optional(),
      hook_id: z.onumber(),
      repository: GitHubRepository.optional(),
      sender: GitHubUser.optional(),
      zen: z.ostring(),
    }),
  }),
  public: z.object({
    type: z.literal("public"),
    pl: z.object({
      repository: GitHubRepository,
      sender: GitHubUser,
    }),
  }),
  pull_request: z.object({
    type: z.literal("pull_request"),
    pl: z.object({
      action: z.enum([
        "assigned",
        "auto_merge_disabled",
        "auto_merge_enabled",
        "closed",
        "converted_to_draft",
        "demilestoned",
        "dequeued",
        "edited",
        "enqueued",
        "labeled",
        "locked",
        "milestoned",
        "opened",
        "ready_for_review",
        "reopened",
        "review_request_removed",
        "review_requested",
        "synchronize",
        "unassigned",
        "unlabeled",
        "unlocked",
      ]),
      assignee: GitHubUser.optional(),
      number: z.number(),
      pull_request: GitHubPullRequest,
      repository: GitHubRepository,
      sender: GitHubUser,
    }),
  }),
  pull_request_review_comment: z.object({
    type: z.literal("pull_request_review_comment"),
    pl: z.object({
      action: z.enum(["created", "deleted", "edited"]),
      comment: GitHubComment,
      pull_request: GitHubPullRequest,
      repository: GitHubRepository,
      sender: GitHubUser,
    }),
  }),
  pull_request_review: z.object({
    type: z.literal("pull_request_review"),
    pl: z.object({
      action: z.enum(["submitted", "dismissed", "edited"]),
      review: z.object({
        _links: z.record(
          z.enum(["html", "pull_request"]),
          z.object({ href: z.string() }),
        ),
        author_association: GitHubAuthorAssociation,
        body: z.string().nullable(),
        commit_id: z.string(),
        html_url: z.string(),
        id: z.number(),
        user: GitHubUser.nullable(),
      }),
      pull_request: GitHubPullRequest,
      repository: GitHubRepository,
      sender: GitHubUser,
    }),
  }),
};
