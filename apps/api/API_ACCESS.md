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

## Upgrading existing integrations

Earlier versions listened on all network interfaces. An integration on another machine now needs the remote-access settings above and must send the bearer token on each request, including health checks. A local integration can continue without a token using `http://127.0.0.1:3001/api`.

Replace an existing `CORS_ORIGIN=*` with the exact origins of your browser clients. The server rejects wildcard configuration at startup. Forwarded client addresses no longer enable token-free access through a remote proxy.

The optional TypeScript HTTP client supports a token for the current page session:

```typescript
import { api, setApiAuthToken, setApiBaseUrl } from '@/lib/api-http';

setApiBaseUrl('https://your-api.example');
setApiAuthToken(token); // Obtain the integration's token privately.
const accounts = await api.getAccounts();
setApiAuthToken(null); // Clear credentials when the integration session ends.
```

The token is kept in memory and is never saved in OPFS or browser storage. Configure it again after reloading the page. A nonempty token needs at least 32 characters and must contain no whitespace or line breaks.
