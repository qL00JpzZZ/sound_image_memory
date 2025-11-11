// ファイルパス: api/saveToDrive.js


const { google } = require('googleapis');

// Vercelのサーバーレス関数の標準的な形式
export default async function handler(req, res) {
  // POSTメソッド以外のリクエストは受け付けないようにする
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // フロントエンドから送られてきたJSONデータを取得
  const experimentData = req.body;

  try {
    // Google APIの認証情報を設定
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        // 環境変数から秘密鍵を読み込む際、改行文字を正しく復元
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // 保存するファイルの情報（ファイル名、保存先フォルダ）を設定
    const fileMetadata = {
      name: experimentData.filename,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    };

    // 保存するデータの中身（CSVテキスト）を設定
    const media = {
      mimeType: 'text/csv',
      body: experimentData.csv,
    };

    // Google Driveにファイルを新規作成
    await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
      supportsAllDrives: true,
    });

    // 成功したことをフロントエンドに伝える
    return res.status(200).json({ message: 'Result saved successfully!' });

  } catch (error) {
    // エラーが発生した場合、その内容を記録し、フロントエンドにエラーを伝える
    console.error('Error saving to Google Drive:', error);
    return res.status(500).json({ error: 'Failed to save result.', details: error.message });
  }
}