import { google } from 'googleapis';
import { Readable } from 'stream'; // データ転送エラー(pipe is not a function)を防ぐためのライブラリ

export default async function handler(req, res) {
  // POSTメソッド以外は拒否
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // フロントエンドからデータを受け取る
    // folderKey: 保存先フォルダを指定する合言葉
    // isBase64: 画像データなどの場合に true になる
    const { filename, content, folderKey, contentType, isBase64 } = req.body;

    // ---------------------------------------------------------
    // 1. 保存先フォルダの決定
    // ---------------------------------------------------------
    let targetFolderId;
    if (folderKey === 'sub') {
        // 新しい保存先（サブ）
        targetFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID_SUB;
    } else if (folderKey === 'explanation') {
        // 同意書画像用の保存先（今回追加した共有ドライブのフォルダ）
        targetFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID_explanation;
    } else {
        // デフォルト（メイン）
        targetFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    }

    // フォルダIDが見つからない場合はエラー
    if (!targetFolderId) {
        throw new Error(`Target folder ID is missing for key: ${folderKey || 'default'}`);
    }

    // ---------------------------------------------------------
    // 2. Google認証
    // ---------------------------------------------------------
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        // Vercel環境変数での改行コード問題を回避
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // ---------------------------------------------------------
    // 3. データ処理 (ストリーム変換)
    // ---------------------------------------------------------
    
    // データ(content)をバッファに変換
    const buffer = isBase64 
      ? Buffer.from(content, 'base64') 
      : Buffer.from(content);

    // バッファを「Readableストリーム」に変換
    // ※ googleapis が画像等のアップロード時にストリーム形式を要求するため
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null); // ストリームの終わりを通知

    // ---------------------------------------------------------
    // 4. アップロード実行
    // ---------------------------------------------------------
    const fileMetadata = {
      name: filename,
      parents: [targetFolderId],
    };

    const media = {
      mimeType: contentType || 'text/csv',
      body: stream, // バッファではなくストリームを渡す
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
      // ★★★ 最重要：共有ドライブ(Shared Drive)対応 ★★★
      // これがないと、権限があっても「File not found」エラーになります
      supportsAllDrives: true, 
    });

    // 成功したらファイルIDを返す
    res.status(200).json({ fileId: response.data.id });

  } catch (error) {
    console.error('Google Drive Upload Error:', error);
    // エラー詳細をクライアントに返す
    res.status(500).json({ error: error.message });
  }
}