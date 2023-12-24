import { Router, error, json } from "itty-router";
import { GitHubEventType, GitHubEventTypeToPayload, GitHubRepository } from "./types/github";
import { z } from "zod";
import { APIEmbed } from "./types/guilded";

const router = Router()

export interface Env {
}

const getRepoSign = (repo: z.infer<typeof GitHubRepository>): string => (
  `${repo.owner.login}/${repo.full_name}`
)

const getRepoUrl = (repo: z.infer<typeof GitHubRepository>): string => (
  `https://github.com/${getRepoSign(repo)}`
)

router
  .get("/", () => new Response("Hello!"))
  .post("/webhooks/:id/:token", async (request) => {
    const { id, token } = request.params;
    console.log(id, token)
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
      if (d.pl.sender) {
        embed.author = {
          name: d.pl.sender.login,
          icon_url: d.pl.sender.avatar_url
            ?? `https://avatars.githubusercontent.com/u/${d.pl.sender.id}?v=4`,
          url: `https://github.com/${d.pl.sender.login}`,
        }
      }
      if ("repository" in d.pl && d.pl.repository) {
        embed.footer = {
          text: getRepoSign(d.pl.repository).slice(0, 2048),
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
          embed.title = `Forked to ${getRepoSign(d.pl.forkee)}`;
          embed.url = getRepoUrl(d.pl.forkee);
          break;
        case "ping":
          embed.title = "Ping";
          break;
        default:
          cont = false;
          break;
      }

      if (cont) {
        const webhookUrl = `https://media.guilded.gg/webhooks/${id}/${token}`;
        const response = await fetch(webhookUrl, {
          method: "POST",
          body: JSON.stringify({
            embeds: [embed],
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
