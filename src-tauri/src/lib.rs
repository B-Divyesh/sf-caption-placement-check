use std::io::Write;

#[derive(Clone)]
struct OfflineSmokeState(bool);

#[tauri::command]
fn offline_smoke_enabled(state: tauri::State<'_, OfflineSmokeState>) -> bool {
    state.0
}

#[tauri::command]
fn complete_offline_smoke(
    app: tauri::AppHandle,
    state: tauri::State<'_, OfflineSmokeState>,
    result: serde_json::Value,
) -> Result<(), String> {
    if !state.0 {
        return Err("The desktop offline smoke test is not active.".to_string());
    }
    let body = serde_json::to_string(&result).map_err(|error| error.to_string())?;
    println!("CPC_OFFLINE_SMOKE_RESULT={body}");
    std::io::stdout()
        .flush()
        .map_err(|error| error.to_string())?;
    app.exit(
        if result.get("passed").and_then(serde_json::Value::as_bool) == Some(true) {
            0
        } else {
            1
        },
    );
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let offline_smoke = OfflineSmokeState(
        std::env::var_os("CPC_OFFLINE_SMOKE").as_deref() == Some(std::ffi::OsStr::new("1")),
    );
    tauri::Builder::default()
        .manage(offline_smoke)
        .invoke_handler(tauri::generate_handler![
            offline_smoke_enabled,
            complete_offline_smoke
        ])
        .run(tauri::generate_context!())
        .expect("error while running Caption Placement Check");
}
