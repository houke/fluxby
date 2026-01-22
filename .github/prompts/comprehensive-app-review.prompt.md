# Fluxby Comprehensive App Review

## Executive Summary

This document provides a thorough review of the Fluxby application across all platforms (iOS, Android, Windows, macOS) covering the complete user flow from landing page to first-time use, Tauri update procedures, and peer-to-peer synchronization functionality.

**Review Date**: January 22, 2026  
**App Version**: 1.7.0  
**Reviewer**: Automated Analysis

---

## Table of Contents

1. [Landing Page Review](#1-landing-page-review)
2. [First-Time User Experience](#2-first-time-user-experience)
3. [Tauri Update Procedures](#3-tauri-update-procedures)
4. [Peer-to-Peer Sync Analysis](#4-peer-to-peer-sync-analysis)
5. [Platform-Specific Issues](#5-platform-specific-issues)
6. [Action Items & Recommendations](#6-action-items--recommendations)

---

## 1. Landing Page Review

### 1.1 Current Structure

| Component | Path | Purpose |
|-----------|------|---------|
| Hero | `components/Hero.tsx` | Main CTA, animated avatar, language toggle |
| Features | `components/Features.tsx` | Feature highlights |
| Screenshots | `components/Screenshots.tsx` | App screenshots carousel |
| Developer | `components/Developer.tsx` | API documentation links |
| HelpCenter | `components/HelpCenter.tsx` | Help links |
| Downloads | `components/Downloads.tsx` | Platform-specific download links |
| CTA | `components/CTA.tsx` | Final call-to-action |
| Footer | `components/Footer.tsx` | Legal links, social |

### 1.2 Routes Configuration

```
/ → Landing Page
/docs/* → Developer Documentation
/help/* → Help Center
/privacy, /terms, etc. → Legal Modals (overlay on landing)
/app/ → Proxied to Web App (port 5178)
```

### 1.3 Identified Issues

#### 🔴 Critical

| Issue | Location | Impact | Suggested Fix |
|-------|----------|--------|---------------|
| No PWA install prompt on landing | `Downloads.tsx` | Users only see native downloads, not PWA option | Add PWA install detection and prompt to landing page |

#### 🟡 Medium Priority

| Issue | Location | Impact | Suggested Fix |
|-------|----------|--------|---------------|
| Downloads hardcoded version mismatch | `Downloads.tsx` line ~15 | Download links use `__APP_VERSION__` but may not match Tauri version | Ensure version sync between Tauri config and build-time injection |
| Mobile responsiveness on hero | `Hero.tsx` | Avatar size jumps at 768px breakpoint | Add intermediate breakpoint (640px) for smoother transition |
| No loading state on "Get Started" | `Hero.tsx` line ~560 | User sees no feedback when clicking CTA | Add loading spinner or navigation feedback |

#### 🟢 Low Priority

| Issue | Location | Impact | Suggested Fix |
|-------|----------|--------|---------------|
| Bokeh animations cause jank on low-end devices | `Hero.tsx` | Performance issue on mobile | Add `prefers-reduced-motion` media query check |
| Language selector flags only (no text) | `Hero.tsx` line ~292 | Accessibility concern | Add `aria-label` with language name |

---

## 2. First-Time User Experience

### 2.1 Flow Overview

```
┌─────────────────┐
│  Landing Page   │
│  "Get Started"  │
└────────┬────────┘
         ▼
┌─────────────────┐
│ SecuritySetup   │ ← First screen for new users
│ (Language pick) │
└────────┬────────┘
         ▼
┌─────────────────┐
│ SecuritySetup   │
│  (Name input)   │
└────────┬────────┘
         ▼
┌─────────────────┐
│ SecuritySetup   │
│ (Password x2)   │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Loading Screen  │ ← Shows progress: Demo data creation
│ (Seeding data)  │   Categories → Transactions → Budgets
└────────┬────────┘
         ▼
┌─────────────────┐
│   Dashboard     │ ← Main app with onboarding overlay
│  + Onboarding   │
└─────────────────┘
```

### 2.2 SecuritySetup Component Analysis

**File**: `apps/web/src/components/SecuritySetup.tsx`

| Step | Name | Validation | Notes |
|------|------|------------|-------|
| 1 | Language | Click NL/EN flag | Saves to LanguageContext |
| 2 | Name | Any non-empty string | Stored in user table |
| 3 | Password | ≥8 chars, must match | PBKDF2 hashed |
| 4 | Loading | Progress bar 0-100% | Demo profile + seed data |

### 2.3 Onboarding Tour

**File**: `apps/web/src/components/onboarding/onboarding-data.ts`

| Chapter | Steps | Route | Key Elements |
|---------|-------|-------|--------------|
| Welcome | 1 | /dashboard | Welcome message |
| Navigation | 7 | /dashboard | Sidebar, date filter, search, privacy mode, theme, profile, mascot |
| Dashboard | 8 | /dashboard | Greeting, accounts, stats, income/expense, recent transactions |
| Transactions | 6 | /transactions | Table, sorting, filtering, inline edit, details |
| Categories | 4 | /categories | List, rules, budgets |
| Analytics | 4 | /analytics | Charts, insights |
| Budgets | 4 | /budgets | Overview, add, edit |
| Subscriptions | 4 | /subscriptions | List, detection |
| Address Book | 3 | /addressbook | Contacts |
| Import | 3 | /import | Drag/drop, mapping |
| Settings | 4 | /settings | Tabs, profile, sync |
| Completion | 1 | /dashboard | Finish message |

### 2.4 Identified Issues

#### 🔴 Critical

| Issue | Location | Impact | Suggested Fix |
|-------|----------|--------|---------------|
| Password recovery impossible | `SecuritySetup.tsx` | User loses access if password forgotten | Add clear warning + optional recovery hint |
| Demo seeding can timeout | `SecuritySetup.tsx` line ~250 | Large data sets on slow devices | Add timeout handling, retry button |

#### 🟡 Medium Priority

| Issue | Location | Impact | Suggested Fix |
|-------|----------|--------|---------------|
| Keyboard covers input on iOS | `SecuritySetup.tsx` | Hard to type password on mobile Safari | Already has `isKeyboardVisible` state but may need CSS adjustment |
| No "skip" option during seeding | `SecuritySetup.tsx` | Users must wait for full demo data | Add ability to skip demo data creation |
| Onboarding doesn't respect `prefers-reduced-motion` | `OnboardingModal.tsx` | Animations may be distracting | Check media query, reduce animations |

#### 🟢 Low Priority

| Issue | Location | Impact | Suggested Fix |
|-------|----------|--------|---------------|
| Progress bar steps are artificial | `SecuritySetup.tsx` line ~235 | Fixed timing, not actual progress | Connect to real seeding events |
| Name step could be skipped | `SecuritySetup.tsx` | Some users may not want to share name | Make name optional |

---

## 3. Tauri Update Procedures

### 3.1 Current Configuration

**File**: `apps/tauri/tauri.conf.json`

```json
{
  "version": "1.7.0",
  "plugins": {
    "updater": {
      "pubkey": "dW50cn...",
      "endpoints": [
        "https://github.com/houke/fluxby/releases/latest/download/latest.json"
      ],
      "windows": {
        "installMode": "passive"
      }
    }
  }
}
```

### 3.2 Update Flow

```
App Start
    │
    ▼
┌─────────────────────┐
│ UpdateChecker mount │ → 2s delay before check
└─────────┬───────────┘
          ▼
    ┌─────────────┐
    │ check() via │ → Fetches latest.json from GitHub
    │ plugin-updater│
    └──────┬──────┘
           ▼
    ┌──────┴──────┐
    │ Update      │ No→ Toast "Up to date"
    │ Available?  │
    └──────┬──────┘
           │ Yes
           ▼
    ┌─────────────────┐
    │ Show UI Banner  │ → Version, date, release notes
    └─────────┬───────┘
              ▼
        User clicks
        "Download"
              │
              ▼
    ┌─────────────────────┐
    │ downloadAndInstall()│ → Progress events
    └─────────┬───────────┘
              ▼
    ┌─────────────────┐
    │  relaunch()     │ → App restarts with new version
    └─────────────────┘
```

### 3.3 Build Targets

| Platform | Format | File Pattern |
|----------|--------|--------------|
| macOS | DMG | `Fluxby_{version}_aarch64.dmg`, `Fluxby_{version}_x64.dmg` |
| Windows | NSIS EXE | `Fluxby_{version}_x64-setup.exe` |
| Linux | AppImage | `fluxby_{version}_amd64.AppImage` |
| Linux | DEB | `fluxby_{version}_amd64.deb` |

### 3.4 Updater Artifacts

Set in `tauri.conf.json`:
```json
"createUpdaterArtifacts": true
```

This generates:
- `latest.json` - Version manifest
- `.sig` files - Signatures for verification

### 3.5 Identified Issues

#### 🔴 Critical

| Issue | Location | Impact | Suggested Fix |
|-------|----------|--------|---------------|
| GitHub endpoint hardcoded | `tauri.conf.json` | No fallback if GitHub is down | Add secondary endpoint or CDN fallback |
| No update check in background | `UpdateChecker.tsx` | Users only see updates when viewing Settings | Add periodic background check |

#### 🟡 Medium Priority

| Issue | Location | Impact | Suggested Fix |
|-------|----------|--------|---------------|
| Windows passive install may be silent | `tauri.conf.json` | User doesn't see progress | Consider `basicUi` mode for Windows |
| No rollback mechanism | N/A | Failed update corrupts app | Implement backup before update |
| ARM64 Windows not supported | `Downloads.tsx` | Surface Pro X, etc. can't use native app | Add ARM64 Windows build target |

#### 🟢 Low Priority

| Issue | Location | Impact | Suggested Fix |
|-------|----------|--------|---------------|
| Release notes may be in wrong language | `UpdateChecker.tsx` | GitHub releases are typically in one language | Add i18n support for release notes |
| Auto-check on mount may fail silently | `UpdateChecker.tsx` line ~296 | Network error not shown | Add retry button if initial check fails |

---

## 4. Peer-to-Peer Sync Analysis

### 4.1 Architecture Overview

```
Device A                                    Device B
┌─────────────────┐                    ┌─────────────────┐
│ EnhancedPeerSync│◄──── PeerJS ────►│ EnhancedPeerSync│
│                 │     (WebRTC)       │                 │
│  ┌───────────┐  │                    │  ┌───────────┐  │
│  │SyncEngine │  │                    │  │SyncEngine │  │
│  └───────────┘  │                    │  └───────────┘  │
│        │        │                    │        │        │
│  ┌───────────┐  │                    │  ┌───────────┐  │
│  │  OPFS DB  │  │                    │  │  OPFS DB  │  │
│  └───────────┘  │                    │  └───────────┘  │
└─────────────────┘                    └─────────────────┘
```

### 4.2 Sync Protocol

**Version**: 1 (SYNC_PROTOCOL_VERSION)

| Message Type | Purpose |
|--------------|---------|
| `sync:handshake` | Initial connection, exchange device info + schema version |
| `sync:handshake-ack` | Confirm/reject handshake |
| `sync:heartbeat` | Keep-alive (every 5s) |
| `sync:heartbeat-ack` | Response to heartbeat |
| `sync:request` | Request changes since timestamp |
| `sync:manifest` | List of changed row IDs |
| `sync:fetch` | Request specific rows |
| `sync:data` | Actual row data (chunked) |
| `sync:push` | Proactive push of changes |
| `sync:ack` | Acknowledge received data |
| `sync:error` | Error during sync |
| `sync:debug-ping` | Connectivity test |
| `sync:debug-pong` | Response to ping |

### 4.3 Pairing Flow

```
Device A                              Device B
────────                              ────────
Generate 6-char code
(e.g., "XK7M3P")
    │
    ▼
Display QR + Code ──────────────────► User enters code
                                          │
                                          ▼
                                     Connect to PeerJS
                                     with code as peer ID
    │◄────────────────────────────────────│
    │      WebRTC connection              │
    ▼                                     │
Send pairing-request ─────────────────────►
                                          │
                                          ▼
                                     Show "Accept/Reject"
                                     dialog
    │◄────────────────────────────────────│
    │      pairing-accept                 │
    ▼                                     │
Store paired device                  Store paired device
Start sync                           Start sync
```

### 4.4 Conflict Resolution

**Strategy**: Last-Write-Wins (LWW) based on `updated_at` timestamp

```typescript
// From sync-protocol.ts
if (remoteRow.updated_at > localRow.updated_at) {
  applyRemoteChange(remoteRow);
} else {
  // Local wins, remote change ignored
}
```

### 4.5 ICE Servers Configuration

**File**: `packages/core/src/peer.ts` line ~123

```typescript
iceServers: [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  // OpenRelay free TURN server
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
]
```

### 4.6 Identified Issues

#### 🔴 Critical

| Issue | Location | Impact | Suggested Fix |
|-------|----------|--------|---------------|
| OpenRelay TURN is unreliable/free tier | `peer.ts` line ~130 | May fail under load, no SLA | Self-host TURN or use paid TURN service (Twilio, Xirsys) |
| Schema mismatch blocks sync silently | `sync-protocol.ts` | Different app versions can't sync | Show clear error message with upgrade prompt |
| No encryption for sync messages | `peer-enhanced.ts` | Data transmitted unencrypted over WebRTC | Add E2E encryption layer (already planned in architecture) |

#### 🟡 Medium Priority

| Issue | Location | Impact | Suggested Fix |
|-------|----------|--------|---------------|
| Heartbeat timeout too aggressive | `sync-protocol.ts` DEFAULT_SYNC_CONFIG | 15s timeout may disconnect on slow networks | Make configurable, increase default to 30s |
| No offline queue | `SyncContext.tsx` | Changes made offline are lost | Queue changes in IndexedDB, sync when online |
| Reconnection attempts limited to 5 | `sync-protocol.ts` | May not recover from temporary network issues | Add exponential backoff with unlimited retries |
| PeerJS public server rate limits | `peer.ts` | High traffic may hit limits | Consider self-hosted PeerJS server |

#### 🟢 Low Priority

| Issue | Location | Impact | Suggested Fix |
|-------|----------|--------|---------------|
| Pairing code uses ambiguous chars | `peer.ts` line ~57 | Already excludes 0,O,1,I but "L" included | Consider excluding "L" too |
| Debug panel requires triple-click | `SyncSettings.tsx` | Hidden feature, no docs | Document in developer docs |
| No sync history/log UI | N/A | Users can't see what synced | Add sync history viewer |

---

## 5. Platform-Specific Issues

### 5.1 iOS (PWA via Safari)

| Issue | Impact | Status | Fix |
|-------|--------|--------|-----|
| Safari OPFS support limited | May fail on older iOS | ⚠️ | Check Safari 17+ requirement |
| PWA installation flow different | Users may not know how to install | ⚠️ | Add iOS-specific install instructions |
| Keyboard covers input fields | Hard to type in forms | ⚠️ | Already has `isKeyboardVisible` detection |
| No push notifications | Users miss sync updates | ℹ️ | PWA limitation, document in Help |
| Background sync unavailable | App must be open to sync | ℹ️ | PWA limitation, document in Help |

### 5.2 Android (PWA via Chrome)

| Issue | Impact | Status | Fix |
|-------|--------|--------|-----|
| PWA install prompt works | Good UX | ✅ | `beforeinstallprompt` handled |
| OPFS fully supported | Data persists | ✅ | N/A |
| WebRTC works well | Sync functions | ✅ | N/A |
| No native app alternative | Some users prefer native | ℹ️ | Consider Tauri mobile in future |

### 5.3 Windows (Tauri)

| Issue | Impact | Status | Fix |
|-------|--------|--------|-----|
| NSIS installer works | Clean install | ✅ | N/A |
| Auto-update works | Seamless updates | ✅ | N/A |
| ARM64 not supported | Surface Pro X users excluded | 🔴 | Add ARM64 build target |
| Windows Defender may flag | First-run warning | ⚠️ | Code sign with EV certificate |
| CSP blocking some resources | May affect WebGL | ⚠️ | Review CSP in tauri.conf.json |

### 5.4 macOS (Tauri)

| Issue | Impact | Status | Fix |
|-------|--------|--------|-----|
| DMG for both architectures | Universal support | ✅ | Apple Silicon + Intel |
| Gatekeeper warning | First-run requires approval | ⚠️ | Code sign + notarize |
| Menu bar integration | Native feel | ✅ | Full menu implemented |
| No app sandbox | Security concern | ⚠️ | Enable hardened runtime |
| Minimum macOS 10.15 | Excludes older Macs | ℹ️ | Acceptable, 10.15 is from 2019 |

### 5.5 Linux (Tauri)

| Issue | Impact | Status | Fix |
|-------|--------|--------|-----|
| AppImage works universally | Good compatibility | ✅ | N/A |
| DEB for Debian/Ubuntu | Native package manager | ✅ | N/A |
| No RPM package | Fedora/RHEL users must use AppImage | ⚠️ | Add RPM build target |
| No Flatpak/Snap | Limited discoverability | ⚠️ | Consider Flatpak support |
| ARM64 Linux not supported | Raspberry Pi users excluded | ⚠️ | Add ARM64 Linux build |

### 5.6 Web Browser (PWA)

| Issue | Impact | Status | Fix |
|-------|--------|--------|-----|
| COOP/COEP headers required | SharedArrayBuffer for WASM | ✅ | Configured in Vite |
| Service Worker updates | App stays fresh | ✅ | Update detection in UpdateChecker |
| OPFS in all major browsers | Data persistence | ✅ | Chrome, Firefox, Safari 17+ |
| Firefox OPFS performance | May be slower | ⚠️ | Test and document limitations |

---

## 6. Action Items & Recommendations

### 6.1 Critical (Must Fix)

| # | Item | Priority | Effort | Owner |
|---|------|----------|--------|-------|
| 1 | Replace OpenRelay TURN with reliable service | P0 | High | Backend |
| 2 | Add E2E encryption for sync messages | P0 | High | Core |
| 3 | Show clear error when schema mismatch blocks sync | P0 | Low | Frontend |
| 4 | Add GitHub endpoint fallback for Tauri updater | P0 | Medium | Build |
| 5 | Add ARM64 Windows build | P0 | Medium | Build |

### 6.2 High Priority (Should Fix)

| # | Item | Priority | Effort | Owner |
|---|------|----------|--------|-------|
| 6 | Add PWA install prompt to landing page | P1 | Low | Landing |
| 7 | Add offline change queue for sync | P1 | High | Core |
| 8 | Increase heartbeat timeout to 30s | P1 | Low | Core |
| 9 | Add background update check for Tauri | P1 | Medium | Frontend |
| 10 | Code sign Windows and macOS builds | P1 | Medium | DevOps |

### 6.3 Medium Priority (Nice to Have)

| # | Item | Priority | Effort | Owner |
|---|------|----------|--------|-------|
| 11 | Add `prefers-reduced-motion` support | P2 | Low | Frontend |
| 12 | Add intermediate mobile breakpoint for Hero | P2 | Low | Landing |
| 13 | Make demo data seeding optional | P2 | Medium | Onboarding |
| 14 | Add sync history viewer | P2 | Medium | Frontend |
| 15 | Add RPM package for Linux | P2 | Low | Build |
| 16 | Self-host PeerJS server | P2 | Medium | DevOps |

### 6.4 Low Priority (Future Consideration)

| # | Item | Priority | Effort | Owner |
|---|------|----------|--------|-------|
| 17 | Add Flatpak/Snap support | P3 | Medium | Build |
| 18 | Add ARM64 Linux build | P3 | Low | Build |
| 19 | Consider Tauri mobile app | P3 | High | Mobile |
| 20 | Add i18n for release notes | P3 | Low | Frontend |

---

## 7. Testing Checklist

### 7.1 Landing → App Flow

- [ ] Click "Get Started" from landing page
- [ ] Verify redirect to `/app/` works
- [ ] Check language selector saves preference
- [ ] Verify theme toggle works
- [ ] Test all legal modal links

### 7.2 First-Time User

- [ ] Complete language selection
- [ ] Enter name (test empty, long, unicode names)
- [ ] Enter password (test <8 chars, mismatch, valid)
- [ ] Watch demo data creation progress
- [ ] Verify onboarding starts automatically
- [ ] Complete all onboarding chapters
- [ ] Click mascot to restart onboarding

### 7.3 Tauri Updates

- [ ] Fresh install on macOS Apple Silicon
- [ ] Fresh install on macOS Intel
- [ ] Fresh install on Windows x64
- [ ] Fresh install on Linux AppImage
- [ ] Trigger update check manually
- [ ] Download and install update
- [ ] Verify app relaunches with new version

### 7.4 P2P Sync

- [ ] Generate pairing code on Device A
- [ ] Enter code on Device B
- [ ] Accept pairing request
- [ ] Verify devices appear as paired
- [ ] Create transaction on Device A
- [ ] Verify it appears on Device B
- [ ] Test offline → online sync
- [ ] Test reconnection after network drop

### 7.5 Platform-Specific

- [ ] iOS Safari: Install as PWA
- [ ] iOS Safari: Test keyboard overlay
- [ ] Android Chrome: Install as PWA
- [ ] Android Chrome: Test background sync
- [ ] Windows: Test NSIS installer
- [ ] macOS: Test Gatekeeper approval
- [ ] Linux: Test AppImage permission

---

## 8. Conclusion

The Fluxby application has a solid foundation with a well-architected local-first design. The main areas requiring attention are:

1. **Sync reliability**: The TURN server situation needs immediate attention for consistent P2P connectivity.
2. **Platform coverage**: ARM64 Windows and Linux builds would expand the user base.
3. **Security**: E2E encryption for sync messages should be prioritized.
4. **UX polish**: Several small improvements (PWA install on landing, reduced motion, keyboard handling) would improve the overall experience.

The test suite provides good coverage of the sync protocol and utility functions, but integration tests for the full sync flow are recommended.

---

*This review was generated automatically. Please validate findings manually before implementing changes.*
