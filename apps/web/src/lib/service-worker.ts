/** Wait for the app's worker, even when a parent landing worker controls the page. */
export async function registerAppServiceWorker(
  container: ServiceWorkerContainer,
  basePath: string
): Promise<void> {
  const scriptUrl = new URL(`${basePath}sw.js`, window.location.href).href;
  if (container.controller?.scriptURL === scriptUrl) return;
  const registration = await container.register(scriptUrl, { scope: basePath });
  const worker =
    registration.installing || registration.waiting || registration.active;
  if (!worker) throw new Error('App service worker is unavailable');
  if (worker.state === 'activated') return;
  await new Promise<void>((resolve, reject) => {
    const onState = () => {
      if (worker.state === 'activated' || worker.state === 'redundant') {
        worker.removeEventListener('statechange', onState);
        if (worker.state === 'activated') resolve();
        else reject(new Error('App service worker installation failed'));
      }
    };
    worker.addEventListener('statechange', onState);
    onState();
  });
}
