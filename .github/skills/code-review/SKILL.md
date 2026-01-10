---
name: code-review
description: Comprehensive code review for Fluxby - checks security, performance, and coding standards specific to the local-first financial dashboard architecture.
---

# Skill Instructions

The code review skill helps ensure code quality, security, and performance in Fluxby's TypeScript/React codebase with OPFS database backend.

## Purpose

This skill helps developers identify potential problems before code reaches production, with special focus on:
- Local-first architecture security (OPFS, encryption)
- OPFS database performance patterns (transactions for bulk operations)
- TypeScript strict mode compliance
- Bilingual UI requirements (NL/EN)

## When to Use

Activate this skill when:
- Reviewing code changes before committing
- Adding new features (especially database operations)
- Modifying API endpoints
- Working with CSV imports or bulk data operations
- Making UI changes that affect end users

## Step-by-Step Process

1. **Security Check**: 
   - Verify parameterized queries (no SQL injection)
   - Check password handling (PBKDF2 hashing)
   - Validate input sanitization for CSV imports
   - Ensure profile isolation in multi-tenant queries

2. **Performance Analysis**:
   - Verify bulk operations use `db.transactionAsync()` (CRITICAL for OPFS)
   - Check query efficiency (specific columns, indexes)
   - Validate React Query usage for data fetching
   - Review pagination for large datasets

3. **Coding Standards**:
   - TypeScript strict mode compliance
   - Proper naming conventions (camelCase, PascalCase, UPPER_SNAKE_CASE)
   - Internationalization (all UI strings in language files)
   - UI/UX guidelines (tooltips, button styles, toast notifications)

4. **Documentation**:
   - Swagger docs updated for API changes
   - Bruno request files for new endpoints
   - Developer and Help Center docs updated
   - Translations added (NL + EN)

## Example Commands

- Review all aspects: `Perform a comprehensive code review`
- Focus area: `Check this code for OPFS performance issues`
- Security: `Review this database query for SQL injection vulnerabilities`
- Standards: `Verify this code follows Fluxby coding standards`

## Resources

- `security-checklist.md`: Fluxby-specific security requirements
- `performance-optimization.md`: OPFS performance patterns and best practices
- `coding-standards.md`: TypeScript, React, and UI/UX guidelines
- `/Users/houkebv/Apps/fluxby/AGENTS.md`: Complete project documentation
