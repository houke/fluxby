# Developer API access

The developer API is separate from the browser's local OPFS database. By default it listens only on `127.0.0.1:3001`. Token-free requests must originate from an actual loopback socket; `X-Forwarded-For` is never trusted.

Set `API_AUTH_TOKEN` to a secret of at least 32 characters to require authentication, including on loopback. Every API request, Swagger UI and health request then needs `Authorization: Bearer <token>`. The `X-Profile-ID` header chooses the local dataset; it is not an authentication credential or a user-level permission boundary.

Remote access requires all three settings:

```dotenv
HOST=0.0.0.0
API_ALLOW_REMOTE=1
API_AUTH_TOKEN=<a-random-secret-at-least-32-characters>
CORS_ORIGIN=https://your-authorized-interface.example
```

Keep the secret on the client/server that owns the integration. Remote HTTP must be protected by HTTPS at a trusted reverse proxy or private tunnel. The API does not terminate TLS. Wildcard CORS origins are rejected. Requests with an Origin header outside the configured list are refused, even if they supply a correct token. CORS is an additional browser boundary; authentication still protects non-browser callers.

Use an authorization header in cURL, Bruno, or another client. A normal browser navigation to Swagger UI does not supply that header; use an authenticated reverse proxy or a client capable of adding it when token authentication is enabled.

The default permitted browser origins are `http://localhost:5177`, `http://localhost:3000`, and `https://fluxby.local:5177`. Replace this list with comma-separated explicit origins through `CORS_ORIGIN` when needed.
