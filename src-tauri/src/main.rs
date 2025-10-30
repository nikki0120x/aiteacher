// =========================================================================
// Rust Code (src-tauri/src/main.rs) - 外部プロキシクライアント完全版
// =========================================================================
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri;
use serde::{Deserialize, Serialize};
use reqwest::header::{HeaderMap, CONTENT_TYPE};
use std::env;

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

#[derive(Debug, Deserialize)]
struct ProxyResponse {
    text: String,
    category: String,
}

// =========================================================================
// 3. Tauri Command (Rustの公開関数)
// =========================================================================

#[tauri::command]
async fn process_gemini_request(payload: GeminiRequestPayload) -> Result<String, String> {
    // 環境変数から URL を取得
    let proxy_url = env::var("GEMINI_API_URL")
        .unwrap_or_else(|_| "https://www.focalrina.com/api/gemini".to_string());

    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::limited(5)) // リダイレクトを最大5回追跡
        .build()
        .map_err(|e| format!("HTTPクライアントの作成に失敗しました: {:?}", e))?;

    let mut headers = HeaderMap::new();
        headers.insert(CONTENT_TYPE, "application/json".parse().unwrap());
        headers.insert("Accept", "application/json".parse().unwrap());
        headers.insert("User-Agent", "curl/8.2.1".parse().unwrap());

    println!("DEBUG: Sending request to {}", proxy_url);
    println!("DEBUG: Payload = {:?}", payload);

    let response = client
        .post(&proxy_url)
        .headers(headers)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("外部Webサーバーへのリクエスト送信に失敗しました（URL: {}）。{:?}", proxy_url, e))?;

    println!("DEBUG: Received HTTP status: {}", response.status());

    let body_text = response
        .text()
        .await
        .unwrap_or_else(|_| "<empty response>".to_string());

    // JSONかどうか簡易チェック
    if !body_text.trim_start().starts_with('{') {
        println!("DEBUG: Non-JSON response:\n{}", body_text);
        return Err(format!("WebサーバーからJSON以外の応答が返されました:\n{}", body_text));
    }

    // JSON解析
    let proxy_response: ProxyResponse = serde_json::from_str(&body_text)
        .map_err(|e| format!("WebサーバーからのJSON解析に失敗しました: {:?}\nResponse body: {}", e, body_text))?;

    println!("DEBUG: Response text: {}", proxy_response.text);
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
