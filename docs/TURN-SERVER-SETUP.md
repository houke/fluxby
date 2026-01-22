# TURN Server Setup Guide

Fluxby uses WebRTC for peer-to-peer device synchronization. In most cases, direct connections work via STUN servers. However, when devices are behind symmetric NAT (common in corporate networks and some mobile carriers), a TURN server is required to relay traffic.

## Default Configuration

By default, Fluxby uses:

- **STUN**: Google's free STUN servers (stun.l.google.com)
- **TURN**: Metered's free OpenRelay servers (openrelay.metered.ca)

The free TURN servers have rate limits and no SLA. For production deployments with many users, we recommend configuring your own TURN server.

## Configuration Options

### Option 1: Environment Variables (Recommended)

Set these environment variables in your `.env` file:

```bash
VITE_TURN_SERVER_URL=turn:your-turn-server.com:3478
VITE_TURN_USERNAME=your-username
VITE_TURN_CREDENTIAL=your-credential
```

For multiple TURN servers (e.g., UDP + TCP):

```bash
# Primary TURN server (UDP)
VITE_TURN_SERVER_URL=turn:your-turn-server.com:3478

# The username and credential apply to all TURN servers
VITE_TURN_USERNAME=your-username
VITE_TURN_CREDENTIAL=your-credential
```

### Option 2: Programmatic Configuration

When using the `PeerSync` or `EnhancedPeerSync` classes directly:

```typescript
import { PeerSync, IceServerConfig } from '@fluxby/core';

const customIceServers: IceServerConfig[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:your-turn-server.com:3478',
    username: 'your-username',
    credential: 'your-credential',
  },
];

const peerSync = new PeerSync({
  deviceId: 'device-123',
  deviceName: 'My Device',
  iceServers: customIceServers,
  // ... other options
});
```

## Self-Hosted TURN Server Options

### Coturn (Recommended)

[Coturn](https://github.com/coturn/coturn) is a free, open-source TURN server.

#### Docker Installation

```bash
docker run -d \
  --name coturn \
  --network host \
  -v /path/to/turnserver.conf:/etc/turnserver.conf \
  coturn/coturn
```

#### Example turnserver.conf

```conf
# TURN server configuration
listening-port=3478
tls-listening-port=5349
listening-ip=0.0.0.0
relay-ip=YOUR_PUBLIC_IP
external-ip=YOUR_PUBLIC_IP

# Authentication
lt-cred-mech
user=fluxby:your-secure-password

# Realm (use your domain)
realm=yourdomain.com

# TLS certificates (optional but recommended)
cert=/etc/ssl/certs/turn.pem
pkey=/etc/ssl/private/turn.key

# Logging
verbose
log-file=/var/log/turnserver.log

# Performance
total-quota=100
max-bps=0
```

#### Firewall Rules

Open the following ports:

- **TCP/UDP 3478**: Standard TURN port
- **TCP/UDP 5349**: TLS TURN port
- **UDP 49152-65535**: Relay ports (or configure a smaller range)

### Cloud TURN Services

If you prefer managed services:

| Service                                         | Free Tier     | Pricing       | Notes              |
| ----------------------------------------------- | ------------- | ------------- | ------------------ |
| [Twilio TURN](https://www.twilio.com/stun-turn) | No            | Pay-per-use   | Most reliable      |
| [Xirsys](https://xirsys.com/)                   | Yes (limited) | Plans from $0 | Good documentation |
| [Metered](https://www.metered.ca/)              | Yes (limited) | Plans from $0 | Default fallback   |

### Twilio Configuration Example

```bash
# Get credentials from Twilio Console
VITE_TURN_SERVER_URL=turn:global.turn.twilio.com:3478?transport=tcp
VITE_TURN_USERNAME=your-twilio-api-key-sid
VITE_TURN_CREDENTIAL=your-twilio-api-key-secret
```

Note: Twilio requires generating short-lived credentials. For Twilio, you'd need to implement credential refresh on your backend.

## Testing Your TURN Server

### Using Trickle ICE

1. Go to [https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/)
2. Add your TURN server URL
3. Click "Gather candidates"
4. You should see "relay" candidates if TURN is working

### Using Fluxby Debug Panel

1. Open Fluxby settings
2. Triple-click on "Device Syncing" header to reveal debug panel
3. Click "Ping" to test connectivity
4. Check browser console for ICE connection state

## Troubleshooting

### No relay candidates

- Check firewall rules allow TURN ports
- Verify username/credential are correct
- Ensure TURN server is accessible from client's network

### Connection times out

- Increase `heartbeatTimeout` in sync configuration
- Check if corporate firewall blocks WebRTC
- Try TURN over TCP (port 443) which looks like HTTPS traffic

### High latency

- Use a TURN server geographically close to your users
- Consider multiple TURN servers in different regions
- Ensure adequate bandwidth on TURN server

## Security Considerations

1. **Use TLS**: Configure TURN with TLS certificates for encrypted connections
2. **Rotate credentials**: If using long-term credentials, rotate them periodically
3. **Rate limiting**: Configure TURN server with quotas to prevent abuse
4. **Monitoring**: Monitor TURN server bandwidth usage and connection counts

## Performance Tips

1. **Prefer direct connections**: Most connections don't need TURN; ensure STUN is working
2. **Relay only when needed**: WebRTC automatically uses relay only when direct fails
3. **Geographic distribution**: Deploy TURN servers near your user base
4. **Bandwidth allocation**: Plan for ~100kbps per sync session during active transfer

---

For questions or issues, please open a GitHub issue at https://github.com/houke/fluxby/issues
