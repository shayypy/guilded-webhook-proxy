import { Router, error, json } from "itty-router";
import { z } from "zod";
import { GitHubEventType, GitHubEventTypeToPayload, GitHubReactions, GitHubRepository, GitHubUser } from "./types/github";
import { APIEmbed, APIEmbedAuthor } from "./types/guilded";

const router = Router();

export interface Env {
}

const green = 0x69F362,
  red = 0xC45248,
  yellow = 0xE4E74B;

const getRepoUrl = (repo: z.infer<typeof GitHubRepository>): string => (
  `https://github.com/${repo.full_name}`
);

const githubUserToAuthor = (user: z.infer<typeof GitHubUser>): APIEmbedAuthor => ({
  name: user.login,
  icon_url: user.avatar_url
    ?? `https://avatars.githubusercontent.com/u/${user.id}?v=4`,
  url: `https://github.com/${user.login}`,
});

const getReactionsString = (reactions: z.infer<typeof GitHubReactions>): string | null => {
  const compiled: string[] = [];
  if (reactions["+1"]) {
    compiled.push(`👍 ${reactions["+1"]}`);
  }
  if (reactions["-1"]) {
    compiled.push(`👎 ${reactions["-1"]}`);
  }
  if (reactions.confused) {
    compiled.push(`😕 ${reactions.confused}`);
  }
  if (reactions.eyes) {
    compiled.push(`👀 ${reactions.eyes}`);
  }
  if (reactions.heart) {
    compiled.push(`❤️ ${reactions.heart}`);
  }
  if (reactions.hooray) {
    compiled.push(`🎉 ${reactions.hooray}`);
  }
  if (reactions.laugh) {
    compiled.push(`😆 ${reactions.laugh}`);
  }
  if (reactions.rocket) {
    compiled.push(`🚀 ${reactions.rocket}`);
  }
  return compiled.length === 0 ? null : compiled.join(" • ");
};

const getReactionsEmbed = (reactions: z.infer<typeof GitHubReactions>): APIEmbed | undefined => {
  const text = getReactionsString(reactions);
  if (text) {
    return {
      // author: { name: "Reactions" },
      description: text,
    };
  }
};

const shortCodeCommit = (commitId: string): string =>
  "`" + commitId.slice(0, 8) + "`";

router
  .get("/", () => new Response(null, {
    status: 302,
    headers: {
      Location: "https://github.com/shayypy/guilded-webhook-proxy#readme",
    },
  }))
  .post("/webhooks/:id/:token", async (request) => {
    const { id, token } = request.params;
    const search = new URL(request.url).searchParams;
    const showReactions = search.get("reactions") !== "false",
      showDrafts = search.get("drafts") === "true",
      immersiveRaw = search.get("immersive");

    const immersiveMode = ["chat", "embeds"].includes(immersiveRaw || "")
      ? immersiveRaw as "chat" | "embeds"
      : null;

    const ua = request.headers.get("User-Agent"),
      eventType_ = request.headers.get("X-GitHub-Event");

    if (!ua?.startsWith("GitHub-Hookshot/")) {
      return json({ code: "ProxyBadUserAgent", message: "Invalid user agent." }, { status: 400 });
    }
    if (!eventType_) {
      return json({ code: "ProxyNoEventType", message: "No event type provided." }, { status: 400 });
    }
    const eventTypeParse = await GitHubEventType.safeParseAsync(eventType_);
    if (!eventTypeParse.success) {
      return json({ code: "ProxyBadEventType", message: "Unsupported event type." }, { status: 400 });
    }
    const eventType = eventTypeParse.data;
    const payloadValidator = GitHubEventTypeToPayload[eventType as keyof typeof GitHubEventTypeToPayload];
    if (payloadValidator) {
      const d = await payloadValidator.parseAsync({ type: eventType, pl: await request.json() });
      let cont = true;
      const embed: APIEmbed = { color: 0xfefefe };
      let immContent: string | undefined = undefined;
      const immEmbed: APIEmbed = { color: 0xfefefe };
      let reactions: z.infer<typeof GitHubReactions> | undefined = undefined;
      if (d.pl.sender) {
        embed.author = githubUserToAuthor(d.pl.sender);
      }
      if ("repository" in d.pl && d.pl.repository) {
        embed.footer = {
          text: d.pl.repository.full_name.slice(0, 2048),
        };
      }
      switch (d.type) {
        case "commit_comment":
          reactions = d.pl.comment.reactions;
          embed.title = "Commit comment created";
          embed.url =
            `${getRepoUrl(d.pl.repository)}/commit/${d.pl.comment.commit_id}#commitcomment-${d.pl.comment.id}`;
          embed.description = d.pl.comment.body.slice(0, 2048);

          immContent = d.pl.comment.body;
          immEmbed.title = `Replying to commit ${shortCodeCommit(d.pl.comment.commit_id ?? "")}`;
          immEmbed.url = d.pl.comment.html_url;
          break;
        case "create":
          embed.title = `${d.pl.ref_type === "branch" ? "Branch" : "Tag"} created: ${d.pl.ref}`;
          embed.url = `${getRepoUrl(d.pl.repository)}/tree/${d.pl.ref}`;
          if (d.pl.description) {
            embed.description = d.pl.description.slice(0, 2048);
          }
          embed.color = green;
          break;
        case "delete":
          embed.title = `${d.pl.ref_type === "branch" ? "Branch" : "Tag"} deleted: ${d.pl.ref}`;
          embed.color = red;
          break;
        case "fork":
          embed.title = `Forked to ${d.pl.forkee.full_name}`;
          embed.url = getRepoUrl(d.pl.forkee);
          break;
        case "issue_comment":
        case "pull_request_review_comment": {
          reactions = d.pl.comment.reactions;

          embed.author = githubUserToAuthor(d.pl.comment.user);
          embed.description = d.pl.comment.body.slice(0, 2048);
          embed.title = d.type === "issue_comment"
            ? `Comment ${d.pl.action} on issue #${d.pl.issue.number}`
            : `Comment ${d.pl.action} on pull request #${d.pl.pull_request.number}`;
          embed.url = d.pl.comment.html_url;

          // This is too vague for pull request comments
          immContent = d.pl.comment.body;
          immEmbed.title = `Replying to ${d.type === "issue_comment" ? `issue #${d.pl.issue.number}` : `pull request #${d.pl.pull_request.number}`}`;
          immEmbed.url = d.pl.comment.html_url;

          if (d.pl.action === "created") {
            embed.color = green;
          } else if (d.pl.action === "deleted") {
            embed.color = red;
          } else {
            cont = false;
          }
          break;
        }
        case "issues": {
          reactions = d.pl.issue.reactions;
          embed.title = `Issue ${d.pl.action} (#${d.pl.issue.number}) - ${d.pl.issue.title}`;
          embed.url = d.pl.issue.html_url;

          switch (d.pl.action) {
            case "opened":
              embed.color = green;
              embed.description = d.pl.issue.body ? d.pl.issue.body.slice(0, 2048) : undefined;
              break;
            case "closed":
              embed.color = red;
              embed.description = d.pl.issue.body ? d.pl.issue.body.slice(0, 2048) : undefined;
              break;
            case "locked":
              embed.color = red;
              embed.title = `Issue #${d.pl.issue.number} locked as ${d.pl.issue.active_lock_reason}`;
              break;
            default:
              break;
          }
          break;
        }
        case "meta":
          embed.title = "Webhook deleted";
          embed.description = "👋 Goodbye";
          embed.color = red;
          break;
        case "ping":
          embed.title = "Ping";
          embed.description = `You have added this webhook correctly! Thanks for using [guilded-webhook-proxy](${new URL(request.url).origin}).`;
          break;
        // case "public":
        //   embed.title = "Repository visibility changed to public";
        //   break;
        case "pull_request":
          embed.title = `Pull request #${d.pl.number} ${d.pl.action.replace(/_/g, " ")} - ${d.pl.pull_request.title}`;
          embed.url = d.pl.pull_request.html_url;

          switch (d.pl.action) {
            case "opened": {
              embed.color = green;
              embed.description = d.pl.pull_request.body ? d.pl.pull_request.body.slice(0, 2048) : undefined;
              if (d.pl.pull_request.user) {
                embed.author = githubUserToAuthor(d.pl.pull_request.user);
              }
              embed.fields = [];
              const assignees = d.pl.pull_request.assignees.filter(Boolean).map(u => u as NonNullable<typeof u>);
              if (assignees.length !== 0) {
                embed.fields.push({
                  name: "Assignees",
                  value: assignees.map(u => u.login).join(", ").slice(0, 1024),
                });
              }
              break;
            }
            case "closed":
              embed.color = red;
              embed.description = d.pl.pull_request.body ? d.pl.pull_request.body.slice(0, 2048) : undefined;
              break;
            case "locked":
              embed.color = red;
              embed.title = `Pull request #${d.pl.number} locked as ${d.pl.pull_request.active_lock_reason}`;
              break;
            default:
              break;
          }
          break;
        case "pull_request_review":
          if (d.pl.action !== "submitted") {
            cont = false;
            break;
          }
          if (d.pl.review.user) {
            embed.author = githubUserToAuthor(d.pl.review.user);
          }
          embed.title = `Review submitted on pull request #${d.pl.pull_request.number}`;
          embed.url = d.pl.review.html_url;
          embed.color = green;
          embed.description = shortCodeCommit(d.pl.review.commit_id);
          if (d.pl.review.body) {
            embed.description += " ";
            embed.description += d.pl.review.body.slice(0, 2048 - embed.description.length);

          }
          immContent = d.pl.review.body ?? undefined;
          immEmbed.title = `Reviewing pull request #${d.pl.pull_request.number}`;
          immEmbed.url = d.pl.review.html_url;
          break;
        case "push":
          if (d.pl.commits.length === 0) {
            cont = false;
            break;
          }

          embed.title = `[${d.pl.ref.replace(/^refs?\/(tags|heads)\//, "")}] ${d.pl.commits.length.toLocaleString()} new commit${d.pl.commits.length === 1 ? "" : "s"}`;
          embed.url = d.pl.compare;
          embed.description = "";
          for (const commit of d.pl.commits) {
            const line = `[${commit.id.slice(0, 8)}](${commit.url}) ${commit.message.slice(0, 50)} - ${commit.author.username ?? commit.author.name}\n`;
            const remaining = 2048 - embed.description.length;
            if (remaining >= line.length) {
              embed.description += line;
            } else {
              const msg = `\n... ${d.pl.commits.length - embed.description.split("\n").length} more`;
              if (remaining >= msg.length) {
                embed.description += msg;
              }
              break;
            }
          }
          break;
        case "release":
          reactions = d.pl.release.reactions;
          if (d.pl.release.draft && !showDrafts) {
            // Most people probably don't want draft notifications
            cont = false;
            break;
          }

          if (d.pl.release.body && ["created", "released", "prereleased", "published", "deleted"].includes(d.pl.action)) {
            embed.description = d.pl.release.body.slice(0, 2048);
          }
          embed.title = `${d.pl.release.draft ? "Draft" : "Release"} ${d.pl.action} - ${d.pl.release.name ?? d.pl.release.tag_name}`;
          embed.url = d.pl.release.html_url;

          if (["created", "published", "released"].includes(d.pl.action)) {
            if (d.pl.release.draft) embed.color = yellow;
            else embed.color = green;
          } else if (["deleted", "unpublished"].includes(d.pl.action)) {
            embed.color = red;
          }

          if (d.pl.release.assets.length !== 0) {
            embed.fields = [{
              name: "Assets",
              value: d.pl.release.assets
                .map(asset => `[${asset.name}](${asset.browser_download_url}) ${asset.download_count.toLocaleString()} 📥`)
                .join("\n")
                .slice(0, 1024),
              inline: false,
            }];
          }
          break;
        case "repository":
          embed.title = `Repository ${d.pl.action}`;
          embed.url = getRepoUrl(d.pl.repository);
          if (d.pl.repository.owner.type === "Organization" || d.pl.action === "created") {
            embed.title += ` - ${d.pl.repository.name}`;
          }

          switch (d.pl.action) {
            case "created": {
              embed.color = green;
              embed.description = d.pl.repository.description?.slice(0, 2048);
              if (d.pl.repository.fork) {
                embed.title += " (fork)";
              }
              break;
            }
            case "deleted":
              embed.color = red;
              embed.description = d.pl.repository.description?.slice(0, 2048);
              break;
            case "publicized":
              embed.title = embed.title.replace(d.pl.action, "visibility set to public");
              break;
            case "privatized":
              embed.title = embed.title.replace(d.pl.action, "visibility set to private");
              break;
            case "renamed":
              embed.title = `Repository renamed: ${d.pl.changes.repository.name.from} -> ${d.pl.repository.name}`;
              break;
            case "transferred": {
              const lastOwner = d.pl.changes.owner.from;
              embed.title = `Repository transferred from @${lastOwner.organization?.login ?? lastOwner.user?.login} to @${d.pl.repository.owner.login}`;
              break;
            }
            default:
              break;
          }
          break;
        case "star":
          // This event is kind of weird.
          // I'm not sure we need to be tracking who stars and unstars a repo?
          embed.title = `Star ${d.pl.action === "created" ? "added" : "removed"}`;
          embed.description = `${d.pl.repository.name} now has ${d.pl.repository.stargazers_count} star${d.pl.repository.stargazers_count === 1 ? "" : "s"}`;
          if (d.pl.action === "created") {
            embed.color = 0xDCB556;
          } else {
            embed.color = red;
          }
          break;
        case "status":
          embed.url = d.pl.commit.html_url;
          embed.description = d.pl.description?.slice(0, 2048);
          embed.title = `Status updated for commit ${shortCodeCommit(d.pl.commit.sha)}: ${d.pl.state}`;
          switch (d.pl.state) {
            case "error":
            case "failure":
              embed.color = red;
              break;
            case "pending":
              embed.color = yellow;
              break;
            case "success":
              embed.color = green;
              break;
            default:
              cont = false;
              break;
          }
          break;
        default:
          cont = false;
          break;
      }

      if (cont) {
        const embeds = [embed];
        const immEmbeds = [immEmbed];
        if (reactions && showReactions) {
          const reactionEmbed = getReactionsEmbed(reactions);
          if (reactionEmbed) {
            reactionEmbed.color = embed.color;
            embeds.push(reactionEmbed);
            immEmbeds.push(reactionEmbed);
          }
        }

        let payload: {
          content?: string;
          embeds?: APIEmbed[];
          username?: string;
          avatar_url?: string;
        } = {
          embeds,
          username: "GitHub",
          avatar_url: "https://cdn.gilcdn.com/UserAvatar/3f8e4273b8b9dcacd57379a637a773f4-Large.png",
        };

        if (immersiveMode && immContent !== undefined) {
          immContent = immContent
            .replace(/[^<]?@([\w.-]+)/gm, "[@$1](https://github.com/$1)")
            .replace(/<@(\w+)>/gm, "@$1");

          if (immEmbeds.length === 2) {
            immEmbeds[1].color = immEmbed.color;
          }
          if (immersiveMode === "chat") {
            payload = {
              content: immContent.slice(0, 2000),
              embeds: immEmbeds,
              username: embed.author?.name,
              avatar_url: embed.author?.icon_url,
            };
          } else if (immersiveMode === "embeds") {
            immEmbed.description = immContent.slice(0, 2048);
            payload = {
              embeds: immEmbeds,
              username: embed.author?.name?.slice(0, 128),
              avatar_url: embed.author?.icon_url,
            };
          }
        }

        const webhookUrl = `https://media.guilded.gg/webhooks/${id}/${token}`;
        const response = await fetch(webhookUrl, {
          method: "POST",
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json",
          }
        });
        const data = await response.json();
        return json(data, { status: response.status });
      }
      return json({ code: "ProxyNoMessage", message: "There was no message to send. This can be ignored." });
    }

    return error(400);
  })
  .all("*", () => error(404));

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> =>
    router
      .handle(request, env, ctx)
      .catch(error)
};
