import { Router, error, json } from "itty-router";
import { generateGithubPayload } from "./generate";

const router = Router();

router
  .get(
    "/",
    () =>
      new Response(null, {
        status: 302,
        headers: {
          Location: "https://gwp.shay.cat",
        },
      }),
  )
  .post("/raw/github", async (request) => {
    // const url = new URL(request.url);
    // url.searchParams.delete("immersive");
    // request.url = url.href;

    const payload = await generateGithubPayload(request);
    if (payload instanceof Response) {
      return payload;
    }
    if (payload === null) {
      return json({});
    }

    return json({ embeds: payload.embeds ?? [] });
  })
  .post("/webhooks/:id/:token", async (request) => {
    const { id, token } = request.params;

    const ua = request.headers.get("User-Agent");
    if (!ua?.startsWith("GitHub-Hookshot/")) {
      return json(
        { code: "ProxyBadUserAgent", message: "Invalid user agent." },
        { status: 400 },
      );
    }

    const payload = await generateGithubPayload(request);
    if (payload instanceof Response) {
      return payload;
    }
    if (payload === null) {
      return json({
        code: "ProxyNoMessage",
        message: "There was no message to send. This can be ignored.",
      });
    }

    const webhookUrl = `https://media.guilded.gg/webhooks/${id}/${token}`;
    const response = await fetch(webhookUrl, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return json(data, { status: response.status });
  })
  .all("*", () => error(404));

export type Env = Record<string, never>;

export default {
  fetch: (
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> => router.handle(request, env, ctx).catch(error),
};
