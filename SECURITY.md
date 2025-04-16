# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 3.1.x   | :white_check_mark: |
| 3.0.x   | :white_check_mark: |
| < 3.0   | :x:               |

## Reporting a Vulnerability

We take the security of Soundboard seriously. If you believe you have found a security vulnerability, please follow these steps:

1. **Do Not** disclose the vulnerability publicly
2. Submit a report via GitHub’s [private security advisories](https://github.com/rubixvi/soundboard/security/advisories/new)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Your contact information

We will acknowledge receipt of your report within 48 hours and provide an estimated timeline for a fix.

## Security Measures

- All sound files are loaded locally and played through system audio
- No network connections are made during normal operation
- Application settings are stored locally in an encrypted format
- Auto-updates are verified using code signing

## Best Practices

1. Only download the application from official sources
2. Keep the application updated to the latest version
3. Do not modify the application files
4. Use sound files from trusted sources

## Third-Party Dependencies

We regularly monitor and update our dependencies to patch known vulnerabilities. Our build process includes security checks for known vulnerabilities in dependencies.
