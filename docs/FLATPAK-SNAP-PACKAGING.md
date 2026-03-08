# Flatpak and Snap Packaging for Fluxby

This document outlines how to create Flatpak and Snap packages for Fluxby.

> **Note**: Tauri doesn't natively support Flatpak or Snap as build targets. These packages must be created as a post-build step using the AppImage or binary output.

## Flatpak

### Prerequisites

```bash
# Install Flatpak and Flatpak Builder
sudo apt install flatpak flatpak-builder

# Add Flathub repository
flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
```

### Manifest File

Create `com.fluxby.desktop.yml`:

```yaml
app-id: com.fluxby.desktop
runtime: org.freedesktop.Platform
runtime-version: '23.08'
sdk: org.freedesktop.Sdk
command: fluxby

finish-args:
  # X11 and Wayland support
  - --socket=x11
  - --socket=wayland
  # GPU acceleration for WebView
  - --device=dri
  # Network access for sync
  - --share=network
  # Access to home directory for exports
  - --filesystem=home
  # For WebRTC audio/video (if needed)
  - --socket=pulseaudio
  # Needed for WebKit
  - --share=ipc

modules:
  # WebKit dependencies
  - name: webkit2gtk
    buildsystem: cmake-ninja
    config-opts:
      - -DPORT=GTK
      - -DCMAKE_BUILD_TYPE=Release
      - -DENABLE_GAMEPAD=OFF
      - -DENABLE_MINIBROWSER=OFF
      - -DUSE_SOUP2=OFF
    sources:
      - type: archive
        url: https://webkitgtk.org/releases/webkitgtk-2.42.0.tar.xz
        sha256: # Add checksum

  - name: fluxby
    buildsystem: simple
    build-commands:
      - install -D fluxby /app/bin/fluxby
      - install -D fluxby.desktop /app/share/applications/com.fluxby.desktop.desktop
      - install -D icon-128.png /app/share/icons/hicolor/128x128/apps/com.fluxby.desktop.png
      - install -D icon-256.png /app/share/icons/hicolor/256x256/apps/com.fluxby.desktop.png
    sources:
      - type: file
        path: target/release/fluxby
      - type: file
        path: fluxby.desktop
      - type: file
        path: icons/128x128.png
        dest-filename: icon-128.png
      - type: file
        path: icons/256x256.png
        dest-filename: icon-256.png
```

### Build Flatpak

```bash
# Build the flatpak
flatpak-builder --force-clean build-dir com.fluxby.desktop.yml

# Test locally
flatpak-builder --run build-dir com.fluxby.desktop.yml fluxby

# Create distributable bundle
flatpak-builder --repo=repo --force-clean build-dir com.fluxby.desktop.yml
flatpak build-bundle repo fluxby.flatpak com.fluxby.desktop
```

## Snap

### Prerequisites

```bash
# Install Snapcraft
sudo snap install snapcraft --classic
```

### Snap Configuration

Create `snap/snapcraft.yaml`:

```yaml
name: fluxby
version: '1.7.1'
summary: Local-first financial dashboard
description: |
  Fluxby is a privacy-first financial dashboard for visualizing bank transactions.
  All your data stays local on your device.

base: core22
grade: stable
confinement: strict

architectures:
  - build-on: amd64

apps:
  fluxby:
    command: fluxby
    desktop: share/applications/fluxby.desktop
    extensions:
      - gnome
    plugs:
      - home
      - network
      - network-bind
      - x11
      - wayland
      - desktop
      - desktop-legacy
      - gsettings
      - opengl
      - audio-playback

parts:
  fluxby:
    plugin: dump
    source: .
    source-type: local
    build-packages:
      - curl
      - wget
    stage-packages:
      - libwebkit2gtk-4.1-0
      - libgtk-3-0
      - libayatana-appindicator3-1
    organize:
      target/release/fluxby: bin/fluxby
      apps/tauri/icons/128x128.png: share/icons/hicolor/128x128/apps/fluxby.png
    prime:
      - bin/fluxby
      - share/icons/
      - share/applications/

  desktop-file:
    plugin: dump
    source: .
    organize:
      fluxby.desktop: share/applications/fluxby.desktop
    prime:
      - share/applications/fluxby.desktop
```

### Desktop File

Create `fluxby.desktop`:

```desktop
[Desktop Entry]
Type=Application
Name=Fluxby
Comment=Local-first financial dashboard
Exec=fluxby
Icon=${SNAP}/share/icons/hicolor/128x128/apps/fluxby.png
Terminal=false
Categories=Finance;Office;
Keywords=finance;budget;money;transactions;
```

### Build Snap

```bash
# Build the snap
snapcraft

# Install locally for testing
sudo snap install fluxby_1.7.1_amd64.snap --dangerous

# Publish to Snap Store (requires account)
snapcraft upload fluxby_1.7.1_amd64.snap --release=stable
```

## CI/CD Integration

### GitHub Actions Workflow

Add to `.github/workflows/build.yml`:

```yaml
build-flatpak:
  runs-on: ubuntu-22.04
  needs: build-linux
  steps:
    - uses: actions/checkout@v4

    - name: Download Linux build
      uses: actions/download-artifact@v4
      with:
        name: linux-build
        path: target/release/

    - name: Install Flatpak Builder
      run: |
        sudo apt-get update
        sudo apt-get install -y flatpak flatpak-builder
        flatpak remote-add --user --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo

    - name: Build Flatpak
      run: |
        flatpak-builder --force-clean --repo=repo build-dir com.fluxby.desktop.yml
        flatpak build-bundle repo fluxby.flatpak com.fluxby.desktop

    - name: Upload Flatpak
      uses: actions/upload-artifact@v4
      with:
        name: fluxby-flatpak
        path: fluxby.flatpak

build-snap:
  runs-on: ubuntu-22.04
  needs: build-linux
  steps:
    - uses: actions/checkout@v4

    - name: Download Linux build
      uses: actions/download-artifact@v4
      with:
        name: linux-build
        path: target/release/

    - uses: snapcore/action-build@v1
      id: build

    - uses: actions/upload-artifact@v4
      with:
        name: fluxby-snap
        path: ${{ steps.build.outputs.snap }}
```

## Distribution

### Flathub

To publish on Flathub:

1. Fork [flathub/flathub](https://github.com/flathub/flathub)
2. Add your manifest as `com.fluxby.desktop.yml`
3. Submit a pull request
4. Pass review process

### Snap Store

To publish on Snap Store:

1. Create an account at [snapcraft.io](https://snapcraft.io)
2. Register the "fluxby" name
3. Upload with `snapcraft upload`
4. Set release channel (stable/edge)

## Notes

- **AppImage remains recommended**: For simplicity, the AppImage is still the recommended Linux format as it requires no installation
- **WebKit dependencies**: Both Flatpak and Snap require bundling WebKit2GTK, which significantly increases package size (~100MB+)
- **Auto-updates**: Neither Flatpak nor Snap support Tauri's built-in updater. Updates come through the respective package managers instead
- **Sandbox limitations**: Some features may require additional permissions in sandboxed environments

## Resources

- [Flatpak Documentation](https://docs.flatpak.org/)
- [Snapcraft Documentation](https://snapcraft.io/docs)
- [Tauri Linux Bundle](https://v2.tauri.app/distribute/linux/)
