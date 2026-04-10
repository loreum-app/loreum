# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Loreum, please report it responsibly using [GitHub Security Advisories](https://github.com/loreum-app/loreum/security/advisories/new).

**Do NOT open a public issue for security vulnerabilities.**

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 1 week
- **Fix timeline**: Depends on severity, but we aim for:
  - Critical: 48 hours
  - High: 1 week
  - Medium: 2 weeks
  - Low: Next release cycle

### Scope

The following are in scope:

- Authentication and session management
- Authorization bypass
- Data exposure or leakage
- Injection vulnerabilities (SQL, XSS, command injection)
- MCP server security
- WebSocket security

### Out of scope

- Denial of service via rate limiting (already mitigated)
- Self-hosted misconfiguration
- Vulnerabilities in dependencies (report upstream, but let us know)
