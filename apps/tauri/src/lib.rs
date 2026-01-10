use tauri::{
    menu::{Menu, MenuItem, Submenu},
    Emitter, Manager,
};

pub mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            // Create application menu
            let file_menu = Submenu::with_items(
                app,
                "Bestand",
                true,
                &[
                    &MenuItem::with_id(app, "import", "Importeer CSV...", true, Some("CmdOrCtrl+I"))?,
                    &MenuItem::with_id(app, "export", "Exporteer Data...", true, Some("CmdOrCtrl+E"))?,
                    &MenuItem::with_id(app, "backup", "Maak Backup...", true, Some("CmdOrCtrl+B"))?,
                    &MenuItem::with_id(app, "restore", "Herstel Backup...", true, None::<&str>)?,
                    &tauri::menu::PredefinedMenuItem::separator(app)?,
                    &tauri::menu::PredefinedMenuItem::quit(app, Some("Afsluiten"))?,
                ],
            )?;

            let edit_menu = Submenu::with_items(
                app,
                "Bewerken",
                true,
                &[
                    &tauri::menu::PredefinedMenuItem::undo(app, Some("Ongedaan maken"))?,
                    &tauri::menu::PredefinedMenuItem::redo(app, Some("Opnieuw"))?,
                    &tauri::menu::PredefinedMenuItem::separator(app)?,
                    &tauri::menu::PredefinedMenuItem::cut(app, Some("Knippen"))?,
                    &tauri::menu::PredefinedMenuItem::copy(app, Some("Kopiëren"))?,
                    &tauri::menu::PredefinedMenuItem::paste(app, Some("Plakken"))?,
                    &tauri::menu::PredefinedMenuItem::select_all(app, Some("Alles selecteren"))?,
                ],
            )?;

            let view_menu = Submenu::with_items(
                app,
                "Weergave",
                true,
                &[
                    &MenuItem::with_id(app, "dashboard", "Dashboard", true, Some("CmdOrCtrl+1"))?,
                    &MenuItem::with_id(app, "transactions", "Transacties", true, Some("CmdOrCtrl+2"))?,
                    &MenuItem::with_id(app, "budgets", "Budgetten", true, Some("CmdOrCtrl+3"))?,
                    &MenuItem::with_id(app, "categories", "Categorieën", true, Some("CmdOrCtrl+4"))?,
                    &tauri::menu::PredefinedMenuItem::separator(app)?,
                    &tauri::menu::PredefinedMenuItem::fullscreen(app, Some("Volledig scherm"))?,
                ],
            )?;

            let help_menu = Submenu::with_items(
                app,
                "Help",
                true,
                &[
                    &MenuItem::with_id(app, "help", "Help Center", true, Some("F1"))?,
                    &MenuItem::with_id(app, "about", "Over Fluxby", true, None::<&str>)?,
                ],
            )?;

            let menu = Menu::with_items(app, &[&file_menu, &edit_menu, &view_menu, &help_menu])?;

            app.set_menu(menu)?;

            // Handle menu events
            app.on_menu_event(|app, event| {
                match event.id().as_ref() {
                    "import" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("menu-action", "import");
                        }
                    }
                    "export" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("menu-action", "export");
                        }
                    }
                    "backup" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("menu-action", "backup");
                        }
                    }
                    "restore" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("menu-action", "restore");
                        }
                    }
                    "dashboard" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("navigate", "/");
                        }
                    }
                    "transactions" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("navigate", "/transactions");
                        }
                    }
                    "budgets" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("navigate", "/budgets");
                        }
                    }
                    "categories" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("navigate", "/categories");
                        }
                    }
                    "help" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("navigate", "/help");
                        }
                    }
                    "about" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("show-about", ());
                        }
                    }
                    _ => {}
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_app_info,
            commands::show_save_dialog,
            commands::show_open_dialog,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
