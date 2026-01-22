# Self-Hosted PeerJS Server Setup

This guide explains how to set up a self-hosted PeerJS server for Fluxby's device sync feature.

## Why Self-Host?

The default PeerJS cloud server has rate limits that may affect high-traffic deployments. Self-hosting gives you:

- **No rate limits**: Scale to your needs
- **Data sovereignty**: Signaling data stays on your infrastructure
- **Lower latency**: Choose a server location close to your users
- **Custom authentication**: Add API key requirements

> **Note**: The PeerJS server only handles WebRTC signaling (connection setup). Actual sync data travels directly peer-to-peer and is never sent through the PeerJS server.

## Quick Start with Docker

The easiest way to deploy a PeerJS server:

```bash
# Pull the official PeerJS server image
docker pull peerjs/peerjs-server

# Run on port 9000
docker run -d \
  --name peerjs-server \
  -p 9000:9000 \
  peerjs/peerjs-server \
  --port 9000

# Or with an API key requirement
docker run -d \
  --name peerjs-server \
  -p 9000:9000 \
  peerjs/peerjs-server \
  --port 9000 \
  --key your-secret-api-key
```

## Docker Compose

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  peerjs:
    image: peerjs/peerjs-server
    container_name: peerjs-server
    ports:
      - '9000:9000'
    command:
      - '--port'
      - '9000'
      - '--path'
      - '/'
      - '--allow_discovery'
    restart: unless-stopped

  # Optional: Add nginx for HTTPS
  nginx:
    image: nginx:alpine
    ports:
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - peerjs
    restart: unless-stopped
```

## Manual Installation (Node.js)

```bash
# Install globally
npm install -g peer

# Run the server
peerjs --port 9000 --path /

# Or with options
peerjs --port 9000 --path / --key your-api-key
```

## Production Setup with HTTPS

For production, you need HTTPS (WSS). Here's a sample nginx configuration:

```nginx
upstream peerjs {
    server 127.0.0.1:9000;
}

server {
    listen 443 ssl http2;
    server_name peerjs.example.com;

    ssl_certificate /etc/ssl/certs/your-cert.pem;
    ssl_certificate_key /etc/ssl/private/your-key.pem;

    location / {
        proxy_pass http://peerjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeout
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

## Configuring Fluxby

### Environment Variables

Set these environment variables in your `.env` file:

```bash
# PeerJS Server Configuration
VITE_PEERJS_HOST=peerjs.example.com    # Your server hostname
VITE_PEERJS_PORT=443                    # Port (443 for HTTPS)
VITE_PEERJS_PATH=/                      # Path (default: /)
VITE_PEERJS_SECURE=true                 # Use HTTPS/WSS
VITE_PEERJS_KEY=your-api-key           # Optional API key
```

### Programmatic Configuration

You can also configure the PeerJS server in code:

```typescript
import { createPeerSync, PeerServerConfig } from '@fluxby/core';

const peerServer: PeerServerConfig = {
  host: 'peerjs.example.com',
  port: 443,
  path: '/',
  secure: true,
  key: 'your-api-key',  // Optional
};

const peerSync = createPeerSync({
  deviceId: 'your-device-id',
  deviceName: 'My Device',
  peerServer,  // Custom server
  // ... other options
});
```

## Health Checks

Test your PeerJS server:

```bash
# Check if server is running
curl http://localhost:9000/

# With HTTPS
curl https://peerjs.example.com/
```

## Monitoring

The PeerJS server logs connections. For production monitoring:

1. **Docker logs**: `docker logs -f peerjs-server`
2. **Metrics**: Consider adding Prometheus metrics via custom middleware
3. **Health endpoint**: Check `/` returns 200 OK

## Security Considerations

1. **Use HTTPS**: Always use WSS (WebSocket Secure) in production
2. **API Key**: Require an API key to prevent unauthorized use
3. **Rate Limiting**: Add rate limiting at the nginx/load balancer level
4. **Firewall**: Only expose the necessary port (443)

## Troubleshooting

### Connection Issues

1. **Check CORS**: Ensure your PeerJS server allows requests from your domain
2. **WebSocket Support**: Verify your proxy/load balancer supports WebSocket upgrades
3. **Firewall**: Ensure port 443 (or your chosen port) is open
4. **SSL Certificate**: Verify your SSL certificate is valid and trusted

### Common Errors

| Error                         | Cause                       | Solution                      |
| ----------------------------- | --------------------------- | ----------------------------- |
| `WebSocket connection failed` | Wrong host/port or firewall | Verify server is reachable    |
| `SSL_ERROR`                   | Invalid certificate         | Check SSL certificate         |
| `Unauthorized`                | Missing/wrong API key       | Add correct `VITE_PEERJS_KEY` |
| `Connection timeout`          | Server not responding       | Check server logs             |

## Scaling

For high availability:

1. **Multiple instances**: Run multiple PeerJS servers behind a load balancer
2. **Sticky sessions**: Enable sticky sessions for WebSocket connections
3. **Redis adapter**: Use Redis for cross-instance peer discovery

## Resources

- [PeerJS Server GitHub](https://github.com/peers/peerjs-server)
- [PeerJS Documentation](https://peerjs.com/docs/)
- [WebRTC Best Practices](https://webrtc.org/getting-started/overview)

## Combined with TURN Server

For the best peer-to-peer connectivity, combine your PeerJS server with a TURN server:

```bash
# Environment variables for both
VITE_PEERJS_HOST=peerjs.example.com
VITE_PEERJS_PORT=443
VITE_PEERJS_SECURE=true

VITE_TURN_SERVER_URL=turn:turn.example.com:443
VITE_TURN_USERNAME=your-username
VITE_TURN_CREDENTIAL=your-credential
```

See [TURN-SERVER-SETUP.md](./TURN-SERVER-SETUP.md) for TURN server configuration.
