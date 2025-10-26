// =========================================================================
// Rust Code (src-tauri/src/main.rs) - 外部プロキシクライアントに修正
// =========================================================================
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri;
use serde::{Deserialize, Serialize};
// AUTHORIZATIONとstd::envは不要になったため削除
use reqwest::header::{HeaderMap, CONTENT_TYPE};

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

// フロントエンドからのリクエスト全体（そのままWebサーバーへ転送）
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

// route.tsは { text: string, category: string } を返すため、これに合わせる
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
    // 🚨 以下のURLを、デプロイした route.ts の公開URLに置き換えてください 🚨
    const PROXY_API_URL: &str = "https://www.focalrina.com/api/gemini"; // 例

    // 1. 認証情報やプロンプト構築ロジックはWebサーバー側で行うため、すべて削除

    // 2. 外部WebサーバーのAPIエンドポイントへのリクエスト
    let client = reqwest::Client::new();

    // ヘッダーの設定
    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, "application/json".parse().unwrap());

    // 3. リクエストの送信
    // route.ts が受け取るオリジナルのペイロードをJSON形式で送信
    let response = client
        .post(PROXY_API_URL)
        .headers(headers)
        .json(&payload) // GeminiRequestPayload をそのまま転送
        .send()
        .await
        .map_err(|e| format!("外部Webサーバーへのリクエスト送信に失敗しました（URL: {}）。サーバーがデプロイされ、稼働しているか確認してください: {}", PROXY_API_URL, e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_else(|_| "応答本文なし".to_string());
        return Err(format!("Webサーバーからのエラー応答 (HTTP {}): {}", status, body));
    }

    // 4. レスポンスの解析 (ProxyResponseに合わせる)
    let proxy_response: ProxyResponse = response.json()
        .await
        .map_err(|e| format!("WebサーバーからのJSON解析に失敗しました: {}", e))?;
    
    // 5. 結果テキストの抽出
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