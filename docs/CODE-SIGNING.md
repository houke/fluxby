# Code Signing Setup for Fluxby

This document explains how to set up code signing for Fluxby releases on Windows and macOS.

## Overview

Code signing is essential for distributing desktop applications:

- **macOS**: Required for Gatekeeper validation; unsigned apps are blocked by default
- **Windows**: Reduces SmartScreen warnings and builds user trust
- **Users**: Verifies the app hasn't been tampered with

## macOS Code Signing

### Prerequisites

1. **Apple Developer Account** ($99/year)
   - Required for Developer ID certificates
   - Enroll at: https://developer.apple.com/programs/

2. **Developer ID Certificate**
   - Type: "Developer ID Application"
   - Used for distributing apps outside the Mac App Store

### Setting Up macOS Signing

#### 1. Create a Developer ID Certificate

1. Open **Xcode** → **Settings** → **Accounts**
2. Select your Apple ID → **Manage Certificates**
3. Click **+** → **Developer ID Application**
4. Export the certificate as a `.p12` file with a password

#### 2. Create App-Specific Password

1. Go to https://appleid.apple.com
2. **Security** → **App-Specific Passwords** → **Generate**
3. Save the generated password

#### 3. Configure GitHub Secrets

Add these secrets to your GitHub repository:

```
APPLE_CERTIFICATE        # Base64-encoded .p12 certificate
APPLE_CERTIFICATE_PASSWORD  # Password for the .p12 file
APPLE_ID                 # Your Apple ID email
APPLE_PASSWORD           # App-specific password (NOT your Apple ID password)
APPLE_TEAM_ID            # Your Apple Developer Team ID (found in Apple Developer portal)
```

To encode your certificate as base64:

```bash
base64 -i certificate.p12 | pbcopy
```

#### 4. GitHub Actions Workflow

The Tauri GitHub Action handles signing automatically when secrets are set:

```yaml
- uses: tauri-apps/tauri-action@v0
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    # macOS signing
    APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
    APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
    APPLE_SIGNING_IDENTITY: 'Developer ID Application: Your Name (TEAM_ID)'
    APPLE_ID: ${{ secrets.APPLE_ID }}
    APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
    APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

### macOS Notarization

macOS 10.15+ requires notarization for Gatekeeper validation:

1. The Tauri action automatically notarizes when `APPLE_ID` and `APPLE_PASSWORD` are set
2. Notarization uploads your app to Apple for malware scanning
3. Takes 1-15 minutes to complete
4. Staples the notarization ticket to the app

### Troubleshooting macOS

**"Your app is damaged"**

- The app wasn't properly signed or notarized
- Remove the quarantine attribute: `xattr -cr /Applications/Fluxby.app`

**Notarization fails**

- Check the notarization log: `xcrun notarytool log <submission-id> --apple-id <id>`
- Common issues: hardened runtime violations, unsigned binaries

## Windows Code Signing

### Certificate Options

#### Option 1: Extended Validation (EV) Certificate (Recommended)

- **Cost**: $200-500/year
- **Advantage**: Immediate SmartScreen trust
- **Providers**: DigiCert, Sectigo, GlobalSign
- **Hardware**: Requires USB hardware token (HSM)

#### Option 2: Standard Code Signing Certificate

- **Cost**: $60-200/year
- **Disadvantage**: Builds SmartScreen reputation over time
- **Providers**: Certum, Sectigo, DigiCert

### Setting Up Windows Signing

#### For CI/CD with Cloud Signing (Recommended)

Use a cloud signing service that supports CI/CD:

1. **Azure Trusted Signing** (Microsoft)
   - No hardware token required
   - Integrates with GitHub Actions
   - $9.99/month

2. **DigiCert KeyLocker**
   - Cloud-based EV certificate
   - No hardware token required

3. **SignPath.io**
   - Free for open source
   - Supports EV certificates

#### Configure GitHub Secrets

For Azure Trusted Signing:

```
AZURE_TENANT_ID          # Azure tenant ID
AZURE_CLIENT_ID          # Azure service principal ID
AZURE_CLIENT_SECRET      # Azure service principal secret
AZURE_SIGNING_ACCOUNT    # Trusted Signing account name
AZURE_CERT_PROFILE       # Certificate profile name
```

#### GitHub Actions Workflow

```yaml
- name: Sign Windows executable
  if: matrix.os == 'windows-latest'
  uses: azure/trusted-signing-action@v0
  with:
    azure-tenant-id: ${{ secrets.AZURE_TENANT_ID }}
    azure-client-id: ${{ secrets.AZURE_CLIENT_ID }}
    azure-client-secret: ${{ secrets.AZURE_CLIENT_SECRET }}
    endpoint: https://weu.codesigning.azure.net/
    trusted-signing-account-name: ${{ secrets.AZURE_SIGNING_ACCOUNT }}
    certificate-profile-name: ${{ secrets.AZURE_CERT_PROFILE }}
    files-folder: ${{ github.workspace }}/target/release/bundle
    files-folder-filter: exe,msi
    file-digest: SHA256
    timestamp-rfc3161: http://timestamp.acs.microsoft.com
    timestamp-digest: SHA256
```

### Windows SmartScreen

Even with a valid certificate, SmartScreen may show warnings initially:

- **EV certificates**: Immediate trust
- **Standard certificates**: Build reputation over downloads (weeks to months)
- **Unsigned**: Always shows "Unknown publisher" warning

### Troubleshooting Windows

**SmartScreen still shows warning**

- New certificates need reputation (standard certs)
- Try submitting to Microsoft: https://www.microsoft.com/wdsi/filesubmission

**"Windows protected your PC"**

- Right-click installer → Properties → Unblock
- Users can click "More info" → "Run anyway"

## Current Fluxby Configuration

The Fluxby release workflow (`.github/workflows/fluxby-release.yml`) is prepared for code signing:

### To Enable macOS Signing

1. Set up GitHub secrets (see above)
2. Add to workflow environment:

```yaml
env:
  APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
  APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
  APPLE_SIGNING_IDENTITY: 'Developer ID Application: [Your Name] ([Team ID])'
  APPLE_ID: ${{ secrets.APPLE_ID }}
  APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
  APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

### To Enable Windows Signing

1. Choose a signing provider (Azure recommended)
2. Set up GitHub secrets
3. Add signing step after the build step

## Cost Summary

| Platform | Option                  | Annual Cost |
| -------- | ----------------------- | ----------- |
| macOS    | Apple Developer Program | $99         |
| Windows  | Azure Trusted Signing   | ~$120/year  |
| Windows  | Standard Certificate    | $60-200     |
| Windows  | EV Certificate          | $200-500    |

## Resources

- [Tauri Code Signing Guide](https://tauri.app/distribute/sign/macos)
- [Apple Developer Documentation](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Azure Trusted Signing](https://learn.microsoft.com/en-us/azure/trusted-signing/)
- [SignPath.io for Open Source](https://about.signpath.io/product/open-source)

## Notes for Contributors

If you're setting up code signing for a fork:

1. **Don't commit certificates** - Use GitHub Secrets only
2. **Rotate secrets** if exposed
3. **Test signing locally** before CI/CD
4. **Use test certificates** for development (not for distribution)
