// =========================================================================
// Rust Code (src-tauri/src/main.rs) - 外部プロキシクライアント完全版
// =========================================================================
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use reqwest::header::{HeaderMap, CONTENT_TYPE};
use serde::{Deserialize, Serialize};
// 💡 tauri::api::path のインポートを削除しました
use tauri; 
// use tauri::api::path; // 💡 パス取得APIを削除
// 💡 実行パス取得のために std::env をインポート
use std::env;
// 💡 ファイル操作のために std::fs::File と std::io::Write をインポート
use std::fs::File;
use std::io::Write; 
use std::path::PathBuf;


// =========================================================================
// 1. フロントエンドから受け取るデータ構造 (route.tsと共通)
// =========================================================================

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct SwitchOptions {
    summary: Option<bool>,
    guidance: Option<bool>,
    explanation: Option<bool>,
    answer: Option<bool>,
}

#[derive(Debug, Deserialize, Serialize)]
struct SliderOptions {
    politeness: Option<f64>,
}

#[derive(Debug, Deserialize, Serialize)]
struct ImageSet {
    // フロントエンドからBase64文字列の配列が送られてくることを想定
    problem: Option<Vec<String>>,
    solution: Option<Vec<String>>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct GeminiRequestPayload {
    prompt: String,
    options: Option<SwitchOptions>,
    sliders: Option<SliderOptions>,
    images: Option<ImageSet>,
}

// =========================================================================
// 2. 応答データ構造 (route.tsからの応答に合わせる)
// =========================================================================

// プロキシサーバーの応答形式に合わせる
#[derive(Debug, Deserialize)]
struct ProxyResponse {
    text: String,
}

// =========================================================================
// 3. Tauri Command (Rustの公開関数)
// =========================================================================

// 💡 AppHandle を引数から削除し、ログパス取得を std::env::current_exe() ベースに切り替えます
#[tauri::command]
async fn process_gemini_request(payload: GeminiRequestPayload) -> Result<String, String> {
    
    // 💡 ログパス取得のロジックを修正: std::env::current_exe() を使用
    // 実行ファイルのあるディレクトリを取得し、"app_logs" フォルダを結合
    let log_dir = env::current_exe()
        .map(|mut path| {
            path.pop(); // 実行ファイル名 (例: tauri-gemini.exe) を削除
            path.join("app_logs") // app_logs ディレクトリを作成
        })
        .unwrap_or_else(|_| {
            // 取得失敗時のフォールバック
            PathBuf::from("./temp_logs")
        });

    // コンパイル時に埋め込まれた環境変数を使用。見つからない場合はフォールバックURLを使用。
    let proxy_url = option_env!("GEMINI_API_URL").unwrap_or("https://www.focalrina.com/api/gemini");

    let client = reqwest::Client::builder()
        // リダイレクトを最大5回追跡
        .redirect(reqwest::redirect::Policy::limited(5)) 
        // タイムアウトを設定 (例: 60秒)
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|e| format!("HTTPクライアントの作成に失敗しました: {:?}", e))?;

    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, "application/json".parse().unwrap());
    headers.insert("Accept", "application/json".parse().unwrap());
    headers.insert("User-Agent", "Tauri-Gemini-Client/1.0".parse().unwrap());

    println!("DEBUG: Sending request to {}", proxy_url);
    println!("DEBUG: Payload = {:?}", payload);

    let response = client
        .post(proxy_url)
        .headers(headers)
        .json(&payload) 
        .send()
        .await
        .map_err(|e| {
            format!(
                "外部Webサーバーへのリクエスト送信に失敗しました（URL: {}）。{:?}",
                proxy_url, e
            )
        })?;

    println!("DEBUG: Received HTTP status: {}", response.status());

    let status = response.status();
    let body_text = response
        .text()
        .await
        .unwrap_or_else(|_| "<empty response>".to_string());

    // 200 OK 以外の場合はエラーとして処理
    if !status.is_success() {
        // 💡 サーバーエラー発生時もログファイルに書き出す
        // 確実にディレクトリが存在することを確認
        let _ = std::fs::create_dir_all(&log_dir);
        let log_path = log_dir.join("error_response.html");
        
        if let Ok(mut file) = File::create(&log_path) {
            let _ = file.write_all(body_text.as_bytes());
            println!("DEBUG: Wrote error response to: {:?}", log_path);
        }

        // ★ 修正点: エラーメッセージにファイルパスを含める
        return Err(format!(
            "Webサーバーがエラー応答を返しました (Status: {})。\nエラー詳細はログファイルに保存されました: {}",
            status, log_path.display()
        ));
    }

    // JSONかどうか簡易チェックを強化 (HTML応答の検知)
    if body_text.trim_start().starts_with("<!DOCTYPE") || !body_text.trim_start().starts_with('{') {
        
        // 💡 HTML応答を検知した場合、ファイルを保存してパスを返す
        // 確実にディレクトリが存在することを確認
        let _ = std::fs::create_dir_all(&log_dir);
        
        let log_path = log_dir.join("html_response_body.html");
        
        if let Ok(mut file) = File::create(&log_path) {
            let _ = file.write_all(body_text.as_bytes());
            println!("DEBUG: Wrote HTML response to: {:?}", log_path);
        } else {
            println!("DEBUG: Failed to write HTML response to file.");
        }

        // ★ 修正点: エラーメッセージにファイルパスを含める
        return Err(format!(
            "WebサーバーからJSON以外の応答が返されました（HTML応答を検知）。\n詳細なHTMLボディはログファイルに保存されました: {}",
            log_path.display()
        ));
    }

    // JSON解析
    let proxy_response: ProxyResponse = serde_json::from_str(&body_text).map_err(|e| {
        format!(
            "WebサーバーからのJSON解析に失敗しました: {:?}\nResponse body: {}",
            e, body_text
        )
    })?;

    println!("DEBUG: Response text: {}", proxy_response.text);
    // 最終的にフロントエンドには応答のテキスト部分のみを返す
    Ok(proxy_response.text)
}

// =========================================================================
// 4. Rust Program Entry Point (main function)
// =========================================================================

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![process_gemini_request])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
