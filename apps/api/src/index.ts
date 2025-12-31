import app from './app.js';

const PORT = process.env.PORT || 3001;

// Start server
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Fluxby API server running at http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`📖 API documentation: http://localhost:${PORT}/api/docs`);
  // eslint-disable-next-line no-console
  console.log(`\n💡 This API is for developers building custom interfaces.`);
  // eslint-disable-next-line no-console
  console.log(`   The main Fluxby app uses OPFS for local-first storage.`);
});
