import app from './app.js';
import { getApiAccessConfig } from './middleware/api-access.js';

const PORT = process.env.PORT || 3001;
const { host } = getApiAccessConfig();

// Start server
app.listen(Number(PORT), host, () => {
  // eslint-disable-next-line no-console
  console.log(
    `🚀 Fluxby API server running at http://${host.includes(':') ? `[${host}]` : host}:${PORT}`
  );
  // eslint-disable-next-line no-console
  console.log(
    `📖 API documentation: http://${host.includes(':') ? `[${host}]` : host}:${PORT}/api/docs`
  );
  // eslint-disable-next-line no-console
  console.log(`\n💡 This API is for developers building custom interfaces.`);
  // eslint-disable-next-line no-console
  console.log(`   The main Fluxby app uses OPFS for local-first storage.`);
});
