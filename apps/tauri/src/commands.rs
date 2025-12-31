use serde::{Deserialize, Serialize};
use tauri_plugin_dialog::{DialogExt, FilePath};
use std::sync::mpsc;

#[derive(Debug, Serialize)]
pub struct AppInfo {
    pub name: String,
    pub version: String,
    pub tauri_version: String,
}

/// Get application info
#[tauri::command]
pub fn get_app_info() -> AppInfo {
    AppInfo {
        name: "Fluxby".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        tauri_version: tauri::VERSION.to_string(),
    }
}

#[derive(Debug, Deserialize)]
pub struct SaveDialogOptions {
    pub title: Option<String>,
    pub default_name: Option<String>,
    pub filters: Option<Vec<DialogFilter>>,
}

#[derive(Debug, Deserialize)]
pub struct OpenDialogOptions {
    pub title: Option<String>,
    pub filters: Option<Vec<DialogFilter>>,
    pub multiple: Option<bool>,
    pub directory: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct DialogFilter {
    pub name: String,
    pub extensions: Vec<String>,
}

/// Show save file dialog
#[tauri::command]
pub async fn show_save_dialog(
    app: tauri::AppHandle,
    options: SaveDialogOptions,
) -> Result<Option<String>, String> {
    let mut dialog = app.dialog().file();

    if let Some(title) = options.title {
        dialog = dialog.set_title(&title);
    }

    if let Some(name) = options.default_name {
        dialog = dialog.set_file_name(&name);
    }

    if let Some(filters) = options.filters {
        for filter in filters {
            let extensions: Vec<&str> = filter.extensions.iter().map(|s| s.as_str()).collect();
            dialog = dialog.add_filter(&filter.name, &extensions);
        }
    }

    let (tx, rx) = mpsc::channel();
    dialog.save_file(move |path| {
        let _ = tx.send(path);
    });

    let res = rx.recv().map_err(|e| e.to_string())?;

    match res {
        Some(FilePath::Path(path)) => Ok(Some(path.to_string_lossy().to_string())),
        _ => Ok(None),
    }
}

/// Show open file dialog
#[tauri::command]
pub async fn show_open_dialog(
    app: tauri::AppHandle,
    options: OpenDialogOptions,
) -> Result<Option<Vec<String>>, String> {
    let mut dialog = app.dialog().file();

    if let Some(title) = options.title {
        dialog = dialog.set_title(&title);
    }

    if let Some(filters) = options.filters {
        for filter in filters {
            let extensions: Vec<&str> = filter.extensions.iter().map(|s| s.as_str()).collect();
            dialog = dialog.add_filter(&filter.name, &extensions);
        }
    }

    if options.directory.unwrap_or(false) {
        let (tx, rx) = mpsc::channel();
        dialog.pick_folder(move |path| {
            let _ = tx.send(path);
        });
        let res = rx.recv().map_err(|e| e.to_string())?;
        match res {
            Some(FilePath::Path(path)) => Ok(Some(vec![path.to_string_lossy().to_string()])),
            _ => Ok(None),
        }
    } else if options.multiple.unwrap_or(false) {
        let (tx, rx) = mpsc::channel();
        dialog.pick_files(move |paths| {
            let _ = tx.send(paths);
        });
        let res = rx.recv().map_err(|e| e.to_string())?;
        match res {
            Some(paths) => Ok(Some(
                paths
                    .into_iter()
                    .filter_map(|fp| match fp {
                        FilePath::Path(p) => Some(p.to_string_lossy().to_string()),
                        _ => None,
                    })
                    .collect(),
            )),
            None => Ok(None),
        }
    } else {
        let (tx, rx) = mpsc::channel();
        dialog.pick_file(move |path| {
            let _ = tx.send(path);
        });
        let res = rx.recv().map_err(|e| e.to_string())?;
        match res {
            Some(FilePath::Path(path)) => Ok(Some(vec![path.to_string_lossy().to_string()])),
            _ => Ok(None),
        }
    }
}
