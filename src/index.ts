import { Router, error, json } from "itty-router";
import { GitHubEventType, GitHubEventTypeToPayload, GitHubReactions, GitHubRepository, GitHubUser } from "./types/github";
import { z } from "zod";
import { APIEmbed, APIEmbedAuthor } from "./types/guilded";

const router = Router()

export interface Env {
}

const green = 0x69F362,
  red = 0xC45248;

const getRepoUrl = (repo: z.infer<typeof GitHubRepository>): string => (
  `https://github.com/${repo.full_name}`
)

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
}

const getReactionsEmbed = (reactions: z.infer<typeof GitHubReactions>): APIEmbed | undefined => {
  const text = getReactionsString(reactions);
  if (text) {
    return {
      // author: { name: "Reactions" },
      description: text,
    }
  }
}

router
  .get("/", () => new Response("Hello!"))
  .post("/webhooks/:id/:token", async (request) => {
    const { id, token } = request.params;
    const search = new URL(request.url).searchParams;
    const showReactions = search.get("reactions") !== "false";

    const ua = request.headers.get("User-Agent"),
      eventType_ = request.headers.get("X-GitHub-Event");

    if (!ua?.startsWith("GitHub-Hookshot/")) {
      return json({ code: "ProxyBadUserAgent", message: "Invalid user agent." }, { status: 400 })
    }
    if (!eventType_) {
      return json({ code: "ProxyNoEventType", message: "No event type provided." }, { status: 400 })
    }
    const eventTypeParse = await GitHubEventType.safeParseAsync(eventType_);
    if (!eventTypeParse.success) {
      return json({ code: "ProxyBadEventType", message: "Unsupported event type." }, { status: 400 })
    }
    const eventType = eventTypeParse.data;
    const payloadValidator = GitHubEventTypeToPayload[eventType as keyof typeof GitHubEventTypeToPayload];
    if (payloadValidator) {
      const d = await payloadValidator.parseAsync({ type: eventType, pl: await request.json() });
      let cont = true;
      const embed: APIEmbed = { color: 0xfefefe };
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
          embed.title = "Commit comment created";
          embed.url =
            `${getRepoUrl(d.pl.repository)}/commit/${d.pl.comment.commit_id}#commitcomment-${d.pl.comment.id}`;
          embed.description = d.pl.comment.body.slice(0, 2048);
          break;
        case "delete":
          embed.title = `${d.pl.ref_type} deleted: ${d.pl.ref.split("/")[1]}`;
          break;
        case "fork":
          embed.title = `Forked to ${d.pl.forkee.full_name}`;
          embed.url = getRepoUrl(d.pl.forkee);
          break;
        case "issue_comment": {
          reactions = d.pl.comment.reactions;

          embed.author = githubUserToAuthor(d.pl.comment.user);
          embed.description = d.pl.comment.body.slice(0, 2048);
          embed.title = `Comment ${d.pl.action} on issue #${d.pl.issue.number}`;
          embed.url = `${getRepoUrl(d.pl.repository)}/issues/${d.pl.issue.number}#issuecomment-${d.pl.comment.id}`;

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
          embed.url = `${getRepoUrl(d.pl.repository)}/issues/${d.pl.issue.number}`;

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
        case "ping":
          embed.title = "Ping";
          break;
        default:
          cont = false;
          break;
      }

      if (cont) {
        const embeds = [embed];
        if (reactions && showReactions) {
          const reactionEmbed = getReactionsEmbed(reactions);
          if (reactionEmbed) {
            reactionEmbed.color = embed.color;
            embeds.push(reactionEmbed);
          }
        }

        const webhookUrl = `https://media.guilded.gg/webhooks/${id}/${token}`;
        const response = await fetch(webhookUrl, {
          method: "POST",
          body: JSON.stringify({
            embeds,
            username: "GitHub",
            avatar_url: "https://cdn.gilcdn.com/UserAvatar/3f8e4273b8b9dcacd57379a637a773f4-Large.png",
          }),
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
