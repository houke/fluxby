import app from './app.js';

const PORT = process.env.PORT || 3001;

// Start server
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Finance API server running at http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`📊 Dashboard will be available at http://localhost:5173`);
  // eslint-disable-next-line no-console
  console.log(`🏠 Landing page will be available at http://localhost:5177`);
});
