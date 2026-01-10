# Security Checklist for Fluxby

## SQL Injection Prevention
- ✅ Always use parameterized queries with `db.runAsync(sql, params)` or `db.queryAsync(sql, params)`
- ❌ Never use string concatenation or template literals to build SQL queries
- ✅ Example: `db.runAsync('INSERT INTO accounts (id, name) VALUES (?, ?)', [id, name])`
- ❌ Example: `db.execAsync(\`INSERT INTO accounts VALUES ('${id}', '${name}')\`)`

## Password Security
- ✅ Passwords are hashed using PBKDF2 with 100k iterations
- ✅ Password verification should use the encryption module from `@fluxby/database`
- ❌ Never store plaintext passwords
- ❌ Never log passwords or encryption keys

## Local-First Data Protection
- ✅ All sensitive data stays in OPFS (Origin Private File System) - no server transmission by default
- ✅ Encryption keys are held in memory only, never persisted
- ✅ Use `encryptionKey?: Uint8Array` parameter for database initialization
- ⚠️ Be cautious with sync features - ensure encrypted transmission

## Input Validation
- ✅ Validate IBANs using the validation module from `@fluxby/core`
- ✅ Validate amounts, dates, and category names before database operations
- ✅ Sanitize CSV import data to prevent injection attacks
- ⚠️ Never trust user input from file imports

## API Security (for developers building custom interfaces)
- ✅ Validate `X-Profile-ID` header for multi-tenant isolation
- ✅ Use profile-scoped queries: `WHERE profile_id = ?`
- ❌ Never expose data from other profiles
- ✅ Implement rate limiting on import endpoints

## Frontend Security
- ✅ Use React's built-in XSS protection (JSX escaping)
- ❌ Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- ✅ Validate and sanitize data before rendering
- ✅ Use TypeScript strict mode for type safety
