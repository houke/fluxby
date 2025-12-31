import { execSync } from 'child_process';

try {
  execSync('cargo --version', { stdio: 'ignore' });
} catch {
  console.error('\n\x1b[31mError: Rust/Cargo is not installed.\x1b[0m');
  console.error('Tauri requires Rust to build native applications.');
  console.error('\nTo install Rust, run the following command:\n');
  console.error(
    '\x1b[32mcurl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh\x1b[0m\n'
  );
  console.error('After installation, restart your terminal and try again.\n');
  process.exit(1);
}
