# ARM64 Linux Build Guide

This guide explains how to build Fluxby for ARM64 Linux devices (Raspberry Pi, Pine64, etc.).

## Overview

Tauri supports cross-compilation to `aarch64-unknown-linux-gnu` for ARM64 Linux. However, this requires:

1. Cross-compilation toolchain
2. ARM64 WebKit2GTK libraries
3. Proper linker configuration

## Build Methods

### Method 1: Native Build on ARM64 Device

The simplest approach is to build directly on an ARM64 device:

```bash
# On Raspberry Pi 4 (4GB+ RAM recommended) or similar ARM64 device

# Install dependencies
sudo apt-get update
sudo apt-get install -y \
  build-essential \
  curl \
  wget \
  libssl-dev \
  libgtk-3-dev \
  libwebkit2gtk-4.1-dev \
  librsvg2-dev \
  libayatana-appindicator3-dev

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install Node.js (v22+)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and build
git clone https://github.com/houke/fluxby.git
cd fluxby
npm install
npm run build:tauri
```

The built packages will be in `apps/tauri/target/release/bundle/`.

### Method 2: Cross-Compilation from x64

Cross-compile from an x86_64 machine using Docker:

```bash
# Create a cross-compilation container
docker run --rm -v $(pwd):/app -w /app \
  --platform linux/arm64 \
  rust:latest \
  bash -c "
    apt-get update && \
    apt-get install -y \
      libgtk-3-dev \
      libwebkit2gtk-4.1-dev \
      librsvg2-dev \
      libayatana-appindicator3-dev \
      nodejs npm && \
    npm install && \
    npm run build:tauri
  "
```

### Method 3: GitHub Actions with QEMU

Add ARM64 Linux to your CI/CD workflow:

```yaml
build-linux-arm64:
  runs-on: ubuntu-22.04
  steps:
    - uses: actions/checkout@v4
    
    - name: Set up QEMU
      uses: docker/setup-qemu-action@v3
      with:
        platforms: arm64
    
    - name: Build in ARM64 container
      run: |
        docker run --rm \
          --platform linux/arm64 \
          -v ${{ github.workspace }}:/app \
          -w /app \
          rust:bullseye \
          bash -c "
            apt-get update
            apt-get install -y \
              libgtk-3-dev \
              libwebkit2gtk-4.1-dev \
              librsvg2-dev \
              libayatana-appindicator3-dev \
              nodejs npm
            npm install
            npm run build:tauri
          "
    
    - name: Upload ARM64 artifacts
      uses: actions/upload-artifact@v4
      with:
        name: fluxby-linux-arm64
        path: |
          apps/tauri/target/release/bundle/appimage/*.AppImage
          apps/tauri/target/release/bundle/deb/*.deb
```

## Tauri Configuration

Update `apps/tauri/tauri.conf.json` for ARM64-specific settings if needed:

```json
{
  "bundle": {
    "linux": {
      "appimage": {
        "bundleMediaFramework": true
      },
      "deb": {
        "depends": [
          "libwebkit2gtk-4.1-0",
          "libgtk-3-0",
          "libayatana-appindicator3-1"
        ]
      }
    }
  }
}
```

## Device Compatibility

### Tested Devices

| Device | Status | Notes |
|--------|--------|-------|
| Raspberry Pi 4 (4GB+) | ✅ Works | 8GB recommended for building |
| Raspberry Pi 5 | ✅ Works | Best performance |
| Pine64 | ✅ Works | |
| Orange Pi 5 | ✅ Works | |
| NVIDIA Jetson | ✅ Works | |

### Minimum Requirements

- **RAM**: 2GB (4GB+ recommended for smooth operation)
- **Storage**: 500MB for the application
- **OS**: Debian-based ARM64 Linux (Ubuntu 22.04+, Raspberry Pi OS 64-bit)

## Installation on ARM64

### From DEB Package

```bash
# Download the ARM64 DEB
wget https://github.com/houke/fluxby/releases/download/v1.7.1/fluxby_1.7.1_arm64.deb

# Install
sudo dpkg -i fluxby_1.7.1_arm64.deb

# Fix dependencies if needed
sudo apt-get install -f
```

### From AppImage

```bash
# Download the ARM64 AppImage
wget https://github.com/houke/fluxby/releases/download/v1.7.1/fluxby_1.7.1_arm64.AppImage

# Make executable
chmod +x fluxby_1.7.1_arm64.AppImage

# Run
./fluxby_1.7.1_arm64.AppImage
```

## Performance Considerations

### Raspberry Pi Specific

1. **Increase GPU Memory**:
   ```bash
   # Edit /boot/config.txt
   gpu_mem=256
   ```

2. **Use a fast SD card or SSD**: Class 10 or A2 rated SD cards, or preferably USB SSD

3. **Enable hardware acceleration**:
   ```bash
   # For Raspberry Pi OS
   sudo raspi-config
   # Advanced Options > GL Driver > GL (Full KMS)
   ```

### General ARM64 Tips

- Close other applications to free memory
- Use a lightweight desktop environment (LXDE, XFCE)
- Consider disabling animations

## Troubleshooting

### Build Failures

**Out of memory during build**:
```bash
# Add swap space
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

**Missing WebKit**:
```bash
sudo apt-get install libwebkit2gtk-4.1-dev
```

### Runtime Issues

**Slow startup**:
- First launch compiles JIT code, subsequent launches faster
- Consider preloading: `LD_PRELOAD=/usr/lib/aarch64-linux-gnu/libGL.so fluxby`

**Display issues**:
- Ensure proper GPU drivers are installed
- Try with `GDK_BACKEND=x11 fluxby` if Wayland has issues

## Downloads Page Update

To add ARM64 Linux to the downloads page, update `apps/landing/src/components/Downloads.tsx`:

```typescript
{
  id: 'linux',
  name: t.downloads?.linux?.name || 'Linux',
  icon: AppWindow,
  description: t.downloads?.linux?.description,
  downloads: [
    {
      label: 'AppImage (x64)',
      link: getDownloadLink(`fluxby_${version}_amd64.AppImage`),
      type: 'x86_64',
    },
    {
      label: 'AppImage (ARM64)',
      link: getDownloadLink(`fluxby_${version}_arm64.AppImage`),
      type: 'ARM64 (Pi, etc.)',
    },
    // ... DEB, RPM options
  ],
}
```

## Contributing ARM64 Builds

If you have access to ARM64 hardware and want to help:

1. Build and test on your device
2. Report any issues in GitHub Issues
3. Consider sponsoring CI/CD ARM64 runners

## Resources

- [Tauri Cross-Compilation Guide](https://v2.tauri.app/distribute/cross-platform/)
- [Raspberry Pi WebKit2GTK](https://www.phoronix.com/news/WebKitGTK-Raspberry-Pi)
- [ARM64 Linux Performance](https://www.arm.com/solutions/computing/servers-and-hpc)
