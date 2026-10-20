/**
 * PeerJS and its WebRTC shims are large and only needed once sync starts, so
 * they load on demand instead of with the application's startup bundle.
 */
import type { Peer } from 'peerjs';

export interface PeerJsModule {
  Peer: typeof Peer;
}

let loadedModule: PeerJsModule | null = null;
let loading: Promise<PeerJsModule> | null = null;

/** Return PeerJS when it has already loaded, without waiting. */
export function getLoadedPeerJs(): PeerJsModule | null {
  return loadedModule;
}

/** Load PeerJS once; a failed load (for example offline) can be retried. */
export function loadPeerJs(): Promise<PeerJsModule> {
  if (!loading) {
    loading = import('peerjs').then(
      (module): PeerJsModule => (loadedModule = { Peer: module.Peer }),
      (error: unknown) => {
        loading = null;
        throw error;
      }
    );
  }
  return loading;
}
