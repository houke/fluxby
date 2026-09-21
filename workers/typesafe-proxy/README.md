# Fluxby TypeSafe Worker

This small Cloudflare Worker keeps the Fluxby web app on GitHub Pages while
forwarding TypeSafe requests from an allowed browser origin. It does not store
API keys or request bodies. The user's TypeSafe key is forwarded only for the
single request.

## Deploy

1. Create or log in to a Cloudflare account.
2. Install Wrangler or run it through `npx`.
3. From the repository root, deploy the Worker:

   ```bash
   npx wrangler deploy --config workers/typesafe-proxy/wrangler.jsonc
   ```

4. Add a custom domain in Cloudflare Workers, for example:
   `api.fluxby.app`.
5. Set `VITE_TYPESAFE_WEB_PROXY_URL` to
   `https://api.fluxby.app/typesafe/systemone` when building the web app.

The Worker accepts only `POST /typesafe/systemone`, requires one of the Fluxby
production browser origins, and handles the browser `OPTIONS` preflight. No
`TYPESAFE_API_KEY` secret is needed because Fluxby intentionally keeps the
existing user-supplied-key model. Add a Cloudflare rate-limiting rule for this
route if usage grows beyond the Workers Free quota.

## Local verification

After deployment, verify the preflight response:

```bash
curl -i -X OPTIONS https://api.fluxby.app/typesafe/systemone \
  -H 'Origin: https://fluxby.app' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: authorization,content-type'
```

The response should be `204` and include
`Access-Control-Allow-Origin: https://fluxby.app`.
