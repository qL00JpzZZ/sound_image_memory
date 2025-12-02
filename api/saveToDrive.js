import { google } from 'googleapis';

export default async function handler(req, res) {
  // POSTメソッド以外は拒否
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // データを受け取る（isBase64 フラグを追加）
    const { filename, content, folderKey, contentType, isBase64 } = req.body;

    // どのフォルダIDを使うか決める
    let targetFolderId;
    if (folderKey === 'sub') {
        targetFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID_SUB;
    } else if (folderKey === 'explanation') {
        // ★ 今回追加：同意書保存用のフォルダ
        targetFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID_explanation;
    } else {
        // デフォルト
        targetFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    }

    if (!targetFolderId) {
        throw new Error(`Target folder ID is missing for key: ${folderKey || 'default'}`);
    }

    // Google認証
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // ファイルのメタデータ
    const fileMetadata = {
      name: filename,
      parents: [targetFolderId],
    };

    // コンテンツの準備（画像の場合はBase64デコード、テキストの場合はそのまま）
    const media = {
      mimeType: contentType || 'text/csv',
      body: isBase64 ? Buffer.from(content, 'base64') : content,
    };

    // アップロード実行
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });

    res.status(200).json({ fileId: response.data.id });

  } catch (error) {
    console.error('Google Drive Upload Error:', error);
    res.status(500).json({ error: error.message });
  }
}