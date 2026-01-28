// -------------------- 連絡先・個人情報設定 --------------------
const STUDY_CONTACT = {
  name: '樋口　洋子',
  affiliation: '千葉工業大学 情報変革科学部 認知情報科学科',
  address: '千葉県習志野市津田沼2-17-1',
  phone: '047-478-0107',
  email: 'higuchi.yoko@p.chibakoudai.jp'
};

// -------------------- グローバル変数定義 --------------------
let participantInitials = 'unknown';

// -------------------- HELPER FUNCTIONS --------------------

function sanitizeFileNamePart(s) {
  if (!s) return 'unknown';
  return String(s).trim().replace(/[,\/\\()?%#:*"|<>]/g, '_').replace(/\s+/g, '_').slice(0, 50);
}

const EXCLUDED_NUMS = [999, 998, 997, 996, 995];
function generateSafe3Digit() {
    let num;
    do {
        num = Math.floor(Math.random() * 1000);
    } while (EXCLUDED_NUMS.includes(num));
    return String(num).padStart(3, '0');
}

// -------------------- サーバー送信関数 --------------------

async function saveFileToServer(filename, content, folderKey = 'main', contentType = 'text/csv', isBase64 = false) {
  try {
    const response = await fetch('/api/saveToDrive', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
          filename: filename, 
          content: content,
          folderKey: folderKey,
          contentType: contentType,
          isBase64: isBase64 
      })
    });
    
    if (!response.ok) {
      let errorText = await response.text();
      let errorJson = {};
      try { errorJson = JSON.parse(errorText); } catch (e) {}
      throw new Error(`Server error: ${response.status} - ${errorJson.error || errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Save failed:', error);
    throw error;
  }
}

async function saveCsvToServer(filename, csvText, folderKey = 'main') {
    return saveFileToServer(filename, csvText, folderKey, 'text/csv', false);
}

// -------------------- jsPsych 初期化 --------------------
const jsPsych = initJsPsych({
  on_finish: async function() {
    jsPsych.getDisplayElement().innerHTML = '<p style="font-size: 20px;">結果を集計・保存しています。しばらくお待ちください...</p>';
    try {
        const safeInitials = participantInitials || 'unknown_id';
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        const learning_trials = jsPsych.data.get().filter({ task_phase: 'learning' }).values();
        const image_rec_trials = jsPsych.data.get().filter({ task_phase: 'image_recognition' }).values();
        const sound_rec_trials = jsPsych.data.get().filter({ task_phase: 'sound_recognition' }).values();

        // ----------------------------------------------------
        // 学習フェーズのCSV作成
        // ----------------------------------------------------
        const learning_header = [
            'participant_initials', 'trial_index', 
            'image_category_correct', 'sound_pattern', 'pair_id', 'sound_filename', 
            'image_filename', 'response_key', 'response_category', 'correct', 'rt'
        ].join(',') + '\n';
        
        let learning_data_rows = [];
        learning_trials.forEach((trial, index) => {
            const trial_index = index + 1;
            const lowerFilename = (trial.image_filename || '').toLowerCase();
            const image_category_correct = lowerFilename.includes('indoor') ? 'indoor' : (lowerFilename.includes('outdoor') ? 'outdoor' : 'N/A');
            const response_category = trial.response === 'j' ? 'indoor' : (trial.response === 'k' ? 'outdoor' : 'N/A');
            
            const soundPath = trial.sound_filename || '';
            const soundFile = soundPath.split('/').pop() || 'N/A';

            const row = [
                safeInitials, 
                trial_index, 
                image_category_correct, 
                trial.sound_pattern || 'N/A', 
                trial.pair_id || 'N/A',      
                soundFile,                   
                trial.image_filename || 'N/A', 
                trial.response || 'N/A', 
                response_category, 
                trial.correct, 
                trial.rt || 'N/A'
            ].join(',');
            learning_data_rows.push(row);
        });
        const learning_csvData = learning_header + learning_data_rows.join('\n');
        const learning_filename = `learning_${safeInitials}_${timestamp}.csv`;

        // ----------------------------------------------------
        // データ集計
        // ----------------------------------------------------
        const image_info_map = new Map();
        learning_trials.forEach(trial => { 
            if (trial && trial.image_filename) {
                image_info_map.set(trial.image_filename, {
                    pattern: trial.sound_pattern,
                    pair_id: trial.pair_id
                });
            }
        });

        const image_rec_stats = { 'パターンA': { correct: 0, total: 0 }, 'パターンB': { correct: 0, total: 0 }, 'パターンX': { correct: 0, total: 0 } };
        image_rec_trials.forEach(trial => {
            if (!trial || trial.status !== 'old') return;
            const filename = trial.image_filename;
            if (!filename) return;
            const info = image_info_map.get(filename);
            if (info && info.pattern && image_rec_stats[info.pattern]) {
                image_rec_stats[info.pattern].total++;
                if (trial.correct === true) image_rec_stats[info.pattern].correct++;
            }
        });

        function calculate_accuracy(correct, total) { return total === 0 ? 0 : (correct / total) * 100; }
        
        const image_accuracy_A = calculate_accuracy(image_rec_stats['パターンA'].correct, image_rec_stats['パターンA'].total);
        const image_accuracy_B = calculate_accuracy(image_rec_stats['パターンB'].correct, image_rec_stats['パターンB'].total);
        const image_accuracy_X = calculate_accuracy(image_rec_stats['パターンX'].correct, image_rec_stats['パターンX'].total); 

        const sound_correct_count = sound_rec_trials.filter(trial => trial && trial.correct === true).length;
        const sound_accuracy = calculate_accuracy(sound_correct_count, sound_rec_trials.length || 0);
        
        const summary_data_string = `${safeInitials},${image_accuracy_A},${image_accuracy_B},${image_accuracy_X},${sound_accuracy}`;

        // ----------------------------------------------------
        // テストフェーズのCSV作成
        // ----------------------------------------------------
        const test_header = [
            'participant_initials', 
            'image_accuracy_A', 'image_accuracy_B', 'image_accuracy_X', 'sound_accuracy', 
            'trial_index', 'task_phase', 
            'stimulus_info_1', 'stimulus_info_2', 
            'original_pattern', 'original_pair_id', 
            'response_key', 'correct', 'rt', 'status_or_order'
        ].join(',') + '\n';

        let test_data_rows = [];
        let test_trial_index = 0;

        // 画像テスト行
        image_rec_trials.forEach(trial => {
            test_trial_index++;
            const info = image_info_map.get(trial.image_filename) || { pattern: 'New', pair_id: 'N/A' };
            const original_pattern = trial.status === 'new' ? 'New' : (info.pattern || 'N/A');
            const original_pair = trial.status === 'new' ? 'N/A' : (info.pair_id || 'N/A');

            const row = [
                summary_data_string, 
                test_trial_index, 
                trial.task_phase || 'image_recognition', 
                trial.image_filename || 'N/A', 
                'N/A',                         
                original_pattern,              
                original_pair,                 
                trial.response || 'N/A', 
                trial.correct, 
                trial.rt || 'N/A', 
                trial.status || 'N/A'
            ].join(',');
            test_data_rows.push(row);
        });

        // 音声テスト行
        sound_rec_trials.forEach(trial => {
            test_trial_index++;
            const old_pair_files = trial.old_pair ? trial.old_pair.map(p => p.split('/').pop()).join('-') : 'N/A';
            const new_pair_files = trial.new_pair ? trial.new_pair.map(p => p.split('/').pop()).join('-') : 'N/A';
            
            const order = trial.presentation_order; 
            const first_pair_type = order[0] === 'old' ? 'Correct(Old)' : 'Incorrect(New)';
            const second_pair_type = order[1] === 'old' ? 'Correct(Old)' : 'Incorrect(New)';
            
            const row = [
                summary_data_string, 
                test_trial_index, 
                trial.task_phase || 'sound_recognition', 
                old_pair_files,  
                new_pair_files,  
                'N/A',           
                'N/A',           
                trial.response || 'N/A', 
                trial.correct, 
                trial.rt || 'N/A', 
                `${first_pair_type} -> ${second_pair_type}` 
            ].join(',');
            test_data_rows.push(row);
        });

        const test_csvData = test_header + test_data_rows.join('\n');
        const test_filename = `test_${safeInitials}_${timestamp}.csv`;

        await Promise.all([ saveCsvToServer(learning_filename, learning_csvData), saveCsvToServer(test_filename, test_csvData) ]);

        jsPsych.getDisplayElement().innerHTML = `
            <div style="max-width: 800px; text-align: center; line-height: 1.6; font-size: 20px;">
                <h2>実験終了</h2><p>これで実験は終了です。</p><p>ありがとうございました！</p>
                <p>データが確認でき次第、謝礼のお支払いをいたします。</p><br><p>このウィンドウを閉じて終了してください。</p>
            </div>`;
    } catch (e) {
        console.error('Data saving failed:', e);
        jsPsych.getDisplayElement().innerHTML = `<div style="text-align: center; max-width: 800px; font-size: 20px;"><h2>エラー</h2><p>結果の保存中にエラーが発生しました。</p><p>詳細: ${e.message}</p></div>`;
    }
  }
});

// -------------------- 説明・同意・撤回・ID入力 (★ここを復活させました★) --------------------

// 1) 説明文書
const study_description_trial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function() {
    return `
    <div style="max-width: 900px; margin: 0 auto; line-height: 1.6; text-align: left; font-size: 16px;">
      <div style="margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px;">
        <h2 style="margin:0; text-align:center;">実験説明書</h2>
      </div>
      <div>
        <p style="text-align: right;"><strong>研究責任者：</strong>${STUDY_CONTACT.affiliation} 助教 ${STUDY_CONTACT.name}</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eee;">
          <h3 style="margin-top: 0; font-size: 1.1em; border-bottom: 2px solid #ddd; padding-bottom: 5px;">次ページの同意書署名の前に、以下をご確認ください</h3>
          <ul style="padding-left: 20px; margin-bottom: 0;">
            <li style="margin-bottom: 8px;"><strong>【研究目的・方法】</strong><br>画像と音声の記憶・判別課題を行います。所要時間は休憩を含め20分程度です。</li>
            <li style="margin-bottom: 8px;"><strong>【参加条件】</strong><br><span style="color:red;">18歳以上</span>であり、<span style="color:red;">視力（矯正含む）が0.8以上</span>であることが条件です。</li>
            <li style="margin-bottom: 8px;"><strong>【自由意思と中断】</strong><br>参加は任意です。実験中いつでも<span style="color:red;">不利益なく中断・同意撤回</span>が可能です。</li>
            <li style="margin-bottom: 8px;"><strong>【個人情報の保護とデータ公開】</strong><br>個人情報は厳重に管理されます。実験データは個人が特定されない統計データとして処理され、学会発表や<span style="color:red;">公的データベース（Open Science Framework等）で公開</span>される可能性があります。</li>
            <li style="margin-bottom: 8px;"><strong>【謝礼・交通費・権利】</strong><br>謝礼の支払いは規定に従います。交通費の支給はございません。本実験で得られたデータの知的財産権は参加者には帰属しません。</li>
          </ul>
        </div>
        <div style="margin-top: 20px; text-align: center;">
          <p style="font-size: 0.9em; margin-bottom: 10px;">※より詳細な手順や連絡先については、下のボタンから説明書をダウンロードしてご確認ください。</p>
          <a href="explanation/explanation.pdf" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 14px; font-weight: bold;">📄 詳細説明書をダウンロード</a>
        </div>
      </div>
      <hr style="margin: 20px 0;">
      <p style="text-align:center; font-size:1.1em; font-weight:bold;">上記の内容および説明書の内容を確認し、理解しましたら<br><span style="color:red; font-size:1.3em;">J キー</span> を押して同意書入力へ進んでください。</p>
    </div>`;
  },
  choices: ['j'],
  data: { task_phase: 'study_description' }
};

// 2) 同意書フォーム
const consent_form_html = `
  <div id="consent-container" style="max-width:800px; margin:0 auto; line-height:1.6; text-align:left; font-size:15px; background-color: #ffffff; padding: 40px; border-radius: 5px;">
    <h2 style="text-align:center;">研究参加同意書</h2>
    <p><strong>${STUDY_CONTACT.affiliation}<br>助教 ${STUDY_CONTACT.name} 殿</strong></p>
    <p>私は以下の項目について確認し、本研究の参加に同意します。</p>
    <form id="consent-form" style="border:1px solid #ccc; padding:20px; border-radius:5px; background-color:#fff;">
      <div style="margin-bottom: 10px;"><label><input type="checkbox" name="check1" required> 研究目的・研究方法</label></div>
      <div style="margin-bottom: 10px;"><label><input type="checkbox" name="check2" required> 参加条件（視力0.8以上、18歳以上等）</label></div>
      <div style="margin-bottom: 10px;"><label><input type="checkbox" name="check3" required> いつでも実験の中断や参加の同意を撤回できること</label></div>
      <div style="margin-bottom: 10px;"><label><input type="checkbox" name="check4" required> 個人情報の保護</label></div>
      <div style="margin-bottom: 10px;"><label><input type="checkbox" name="check5" required> 特定の個人を識別できない状態で測定データが公的データベースで公開される可能性があること</label></div>
      <div style="margin-bottom: 10px;"><label><input type="checkbox" name="check6" required> 謝礼・交通費</label></div>
      <div style="margin-bottom: 10px;"><label><input type="checkbox" name="check7" required> 知的財産の権利が自分にないこと</label></div>
      <div style="margin-bottom: 10px;"><label><input type="checkbox" name="check8" required> その他について</label></div>
      <hr>
      <div style="display:flex; gap:20px; margin-bottom:10px;">
        <div style="flex:1;"><label>フリガナ（必須）<br><input type="text" name="kana" required style="width:100%; padding:10px; margin-top:5px; border:1px solid #ccc; border-radius:4px; font-size:16px; box-sizing: border-box;"></label></div>
        <div style="flex:1;"><label>年齢（必須）<br><input type="number" name="age" min="18" required style="width:50%; padding:10px; margin-top:5px; border:1px solid #ccc; border-radius:4px; font-size:16px; box-sizing: border-box;"> 歳</label></div>
        <div style="flex:1;"><label>性別（必須）<br><select name="gender" required style="width:100%; padding:10px; margin-top:5px; border:1px solid #ccc; border-radius:4px; font-size:16px; box-sizing: border-box;"><option value="">選択してください</option><option value="male">男</option><option value="female">女</option><option value="other">その他/回答しない</option></select></label></div>
      </div>
      <div style="margin-bottom:10px;"><label>署名（必須：お名前を入力してください）<br><input type="text" name="signature" required style="width:100%; padding:10px; margin-top:5px; border:1px solid #ccc; border-radius:4px; font-size:16px; box-sizing: border-box;"></label></div>
      <div style="margin-bottom:10px;"><label>Email（必須）<br><input type="email" name="email" required style="width:100%; padding:10px; margin-top:5px; border:1px solid #ccc; border-radius:4px; font-size:16px; box-sizing: border-box;"></label></div>
      <p style="font-size:0.9em; text-align:right;">署名日：${new Date().toLocaleDateString()}</p>
      <div style="text-align:center; margin-top:20px;"><button type="button" id="btn-consent" style="padding:10px 30px; font-size:1.2em; cursor:pointer; background-color:#4CAF50; color:white; border:none; border-radius:5px;">次へ</button></div>
    </form>
    <div id="saving-message" style="display:none; text-align:center; color:blue; font-weight:bold; margin-top:10px;">同意書を保存しています...</div>
  </div>`;

const consent_form_trial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: consent_form_html,
  choices: "NO_KEYS",
  data: { task_phase: 'consent_form' },
  on_load: function() {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    document.head.appendChild(script);

    const form = document.getElementById('consent-form');
    const btn = document.getElementById('btn-consent');
    const container = document.getElementById('consent-container');
    const msg = document.getElementById('saving-message');

    btn.addEventListener('click', function() {
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      window.scrollTo(0, 0);
      btn.disabled = true;
      btn.style.display = 'none';
      msg.style.display = 'block';

      const formData = new FormData(form);
      const obj = {};
      for (const [k,v] of formData.entries()) { obj[k] = v; }
      
      const tempId = obj.kana ? sanitizeFileNamePart(obj.kana) : 'unknown';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `consent_${tempId}_${timestamp}.png`;

      if (typeof html2canvas !== 'undefined') {
        html2canvas(container, { scale: 2, backgroundColor: '#ffffff', scrollX: 0, scrollY: 0, useCORS: true }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const base64Content = imgData.split(',')[1];
            saveFileToServer(filename, base64Content, 'explanation', 'image/png', true)
                .then(() => {
                    jsPsych.data.write({ task_phase: 'consent_form', consent: true, consent_data: obj, saved_image: true });
                    jsPsych.finishTrial();
                })
                .catch(err => {
                    alert('同意書の保存に失敗しましたが、実験は継続します。');
                    jsPsych.data.write({ task_phase: 'consent_form', consent: true, consent_data: obj, saved_image: false });
                    jsPsych.finishTrial();
                });
        });
      } else {
        jsPsych.finishTrial();
      }
    });
  }
};

// 3) 同意撤回連絡先画面
const withdrawal_info_trial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function() {
    return `
      <div style="max-width: 800px; margin: 0 auto; line-height: 1.6; text-align: left;">
        <h2 style="text-align:center;">実験の中断・同意の撤回について</h2>
        <p>実験への参加は任意です。いつでも実験への参加を中断できます。また実験途中や実験後であっても同意を撤回することができます。同意撤回や実験の中断によって不利な扱いを受けることはありません。</p>
        <p>同意撤回の意思が示されたときは、学会等の発表前であれば計測データ等は破棄します。</p>
        <hr>
        <p>もし実験結果の使用などに同意の撤回をしたい場合は、下記アドレスまで連絡してください。</p>
        <div style="background-color:#f9f9f9; padding:20px; border-radius:5px; text-align:center;">
          <p><strong>研究責任者：${STUDY_CONTACT.name}</strong></p>
          <p>${STUDY_CONTACT.affiliation}</p>
          <p>${STUDY_CONTACT.address}</p>
          <p>電話：${STUDY_CONTACT.phone}</p>
          <p>Email: <a href="mailto:${STUDY_CONTACT.email}">${STUDY_CONTACT.email}</a></p>
        </div>
        <hr>
        <p style="text-align:center; font-size:1.1em; font-weight:bold;">内容を確認しましたら、<span style="color:red;">J キー</span> を押して実験を開始してください。</p>
      </div>`;
  },
  choices: ['j'],
  data: { task_phase: 'withdrawal_info' }
};

// 4) ID入力
const initials_trial = {
  type: jsPsychSurveyText,
  questions: [
    {
      prompt: `
        <div style="max-width: 800px; text-align: left; line-height: 1.6; margin-bottom: 20px;">
            <p>本実験は、画像の認識の速さを測ることが目的です。</p>
            <p>実験時間は個人差がありますが20分程度です。</p>
            <p>実験参加に同意していただける場合は以下のフォームに自身のイニシャルを入力してください</p>
            <hr>
            <p style="color: red; font-weight: bold;"><br>画像がうまく表示されない場合は、ページを再読み込みしてください。</p>
            <hr>
        </div>
        <p>あなたのイニシャル (例: YT) を入力してください。</p>
      `,
      name: "initialsInput",
      required: true,
      placeholder: "例: YT"
    }
  ],
  button_label: "IDを生成して開始",
  on_finish: function(data) {
    const initials = data.response.initialsInput.toUpperCase();
    const randomNumber = generateSafe3Digit();
    const generatedID = initials + randomNumber;
    participantInitials = generatedID;
    jsPsych.data.write({ participant_initials: generatedID, task_phase: 'ID_collection' });
    jsPsych.data.addProperties({ participant_initials: generatedID });
  }
};

// -------------------- ファイルリスト定義 --------------------
// 練習用画像
const practice_image_files = [
  'practice/scenes/amusementpark.jpg', 'practice/scenes/bar.jpg', 'practice/scenes/barm.jpg',
  'practice/scenes/bedroom.jpg', 'practice/scenes/bridge.jpg', 'practice/scenes/campsite.jpg',
  'practice/scenes/coast.jpg', 'practice/scenes/conferenceroom.jpg', 'practice/scenes/empty.jpg',
  'practice/scenes/studio.jpg'
];

// 本番用画像リスト
const raw_image_files = {
  INDOOR: {
    grocerystore: [ '056_2.jpg', 'idd_supermarche.jpg', '08082003_aisle.jpg', 'int89.jpg', '100-0067_IMG.jpg', 'intDSCF0784_PhotoRedukto.jpg', '1798025006_f8c475b3fd.jpg', 'integral-color4_detail.jpg', '20070831draguenewyorkOK.jpg', 'japanese-food-fruit-stand.jpg', '22184680.jpg', 'kays-1.jpg', '44l.jpg', 'main.jpg', '9d37cca1-088e-4812-a319-9f8d3fcf37a1.jpg', 'market.jpg', 'APRIL242002FakeGroceryStore.jpg', 'mod16b.jpg', 'Grocery Store 1.jpg', 'papas2.jpg', 'Grocery Store 2.jpg', 'safeway_fireworks.jpg', 'Grocery-store-Moscow.jpg', 'shop04.jpg', 'IMG_0104-Takashimaya-fruit.jpg', 'shop12.jpg', 'IMG_0637.jpg', 'shop13.jpg', 'Inside the supermarket.jpg', 'shop14.jpg', 'MG_56_belo grocery 2.jpg', 'shop15.jpg', 'MainFoodStoreProduce1.jpg', 'shop16.jpg', 'Market5.jpg', 'shop17.jpg', 'Modi-in-Ilit-Colonie-Supermarche-1-2.jpg', 'shop18.jpg', 'Picture_22.jpg', 'shop30.jpg', 'ahpf.supermarche02.jpg', 'store.counter.jpg', 'ahpf.supermarche4.jpg', 'super_market.jpg', 'big-Grocery-Store.jpg', 'supermarch_.jpg', 'cbra3.jpg', 'supermarche-1.jpg', 'coffee_sold_supermarket_1.jpg', 'supermarche3-1.jpg', 'courses01.jpg', 'supermarche33-1.jpg', 'duroseshopDM1710_468x527.jpg', 'supermarket.jpg', 'grocery-store-740716-1.jpg', 'supermarket5.jpg', 'grocery.jpg', 'supermarket66.jpg', 'gs-image-Grocery_LEED-09-10.jpg', 'supermarket_rear_case_isles.jpg' ],
    library: [ '130309783_f194f43f71.jpg', '207157437_14c21369e9.jpg', '28-06-06 Biblioth_que Municipale (19).jpg', '34_AvH_014_library_stacks.jpg', '43407107_204b8504b5.jpg', '470618728_18b5550006.jpg', '473767793_d3cafc4eff.jpg', '57048683_74701f9fa9.jpg', '763634302_e25f44402d.jpg', 'BM_Frejus Bibliotheque 1.jpg', 'Bibliotheque6.jpg', 'Bibliotheque_01.jpg', 'Concord_Free_Public_Library_Renovation_122.jpg', 'DSC02518.jpg', 'Day100006web.jpg', 'Dsc00613-3.jpg', 'Fairfield_Pub_Library_A.jpg', 'Homework2.jpg', 'JPB_Library.jpg', 'Library Pictures (3).jpg', 'Library Pictures.jpg', 'Library98.jpg', 'Library_P2150016.jpg', 'New York Public Library5.jpg', 'association_bibliotheque.jpg', 'biblio01.jpg', 'bibliotheque55.jpg', 'bibliotheque_0908.jpg', 'bibliotheque_photo.jpg', 'bookstore_more_books.jpg', 'ccls-img-buildingbos.jpg', 'danielkimberlylibrarycl1.jpg', 'fibiba1.jpg', 'fine_arts.jpg', 'gallerie-1130426509812-81.80.90.133.jpg', 'howland.jpg', 'image bibliotheque.jpg', 'image_preview.jpg', 'ins18.jpg', 'ins19.jpg', 'ins21.jpg', 'inside01.jpg', 'int91.jpg', 'la_bibliotheque_de_la_tour_du_valat.jpg', 'librairie-16.jpg', 'librairie.jpg', 'library bookshelves large.jpg', 'library01.jpg', 'library02.jpg', 'library03.jpg', 'library04.jpg', 'library05.jpg', 'library2.jpg', 'library4.jpg', 'library466.jpg', 'library5.jpg', 'library_journals_books.jpg', 'mainLibrary.jpg', 'meura1.jpg', 'neilson-hays-library02.jpg' ],
    restaurant: [ '19165-298-298-1-0.jpg', 'int576.jpg', 'restau.04.jpg', '2006_11_tastingroom.jpg', 'int577.jpg', 'restau.08.jpg', 'Bertucci_01_lg.jpg', 'int578.jpg', 'restau.12.jpg', 'Gaststatte_kl.jpg', 'int579.jpg', 'restau.14.jpg', 'INT236.jpg', 'int60.jpg', 'restau.15.jpg', 'Kulturhaus_kneipe.jpg', 'int603.jpg', 'restau.17.jpg', 'N190036.jpg', 'int604.jpg', 'restau.18.jpg', 'N190059.jpg', 'int606.jpg', 'restau.19.jpg', 'OriginalSteakhouse.jpg', 'int607.jpg', 'restau79c.l.jpg', 'Restau30C.L.jpg', 'int608.jpg', 'room106.jpg', 'Restau33C.L.jpg', 'int783.jpg', 'room143.jpg', 'Restau52C.L.jpg', 'int803.jpg', 'room149.jpg', 'RestauC.L.jpg', 'int862.jpg', 'room171.jpg', 'food2_450.jpg', 'int863.jpg', 'room172.jpg', 'food4_450.jpg', 'int867.jpg', 'room176.jpg', 'gaststaette1.jpg', 'int90.jpg', 'room230.jpg', 'gaststaette15.jpg', 'mortonsdr.jpg', 'room246.jpg', 'gaststaette5.jpg', 'olis.small.jpg', 'room250.jpg', 'int112.jpg', 'restau.01.jpg', 'room251.jpg', 'int131.jpg', 'restau.02.jpg', 'room252.jpg' ],
    kitchen: [ 'aa014484.jpg', 'cdmc1167.jpg', 'int360.jpg', 'k5.jpg', 'aa041720.jpg', 'cdmc1170.jpg', 'int362.jpg', 'k6.jpg', 'cdMC1148.jpg', 'cdmc1172.jpg', 'int365.jpg', 'k7.jpg', 'cdmc1119.jpg', 'cdmc1178.jpg', 'int422.jpg', 'k9.jpg', 'cdmc1120.jpg', 'cdmc1194.jpg', 'int423.jpg', 'kitchen003.jpg', 'cdmc1123.jpg', 'cdmc1289.jpg', 'int437.jpg', 'kitchen004.jpg', 'cdmc1126.jpg', 'cdmc1299.jpg', 'int474.jpg', 'kitchen031.jpg', 'cdmc1128.jpg', 'dining047.jpg', 'k1.jpg', 'kitchen032.jpg', 'cdmc1143.jpg', 'iclock.jpg', 'k10.jpg', 'kitchen054.jpg', 'cdmc1144.jpg', 'int166.jpg', 'k11.jpg', 'kitchen077.jpg', 'cdmc1145.jpg', 'int34.jpg', 'k12.jpg', 'kitchen081.jpg', 'cdmc1146.jpg', 'int347.jpg', 'k2.jpg', 'kitchen083.jpg', 'cdmc1151.jpg', 'int35.jpg', 'k3.jpg', 'kitchen086.jpg', 'cdmc1164.jpg', 'int357.jpg', 'k4.jpg', 'kitchen5.jpg' ],
    gym: [ 'Gym-Equipment.jpg', 'gym3.jpg', 'Gym05.jpg', 'gym45.jpg', 'Gym2_000.jpg', 'gym65.jpg', 'Gym432.jpg', 'gym_b.jpg', 'GymInt1.jpg', 'gym_b4.jpg', 'HO-00-01-5186-23_l.jpg', 'gym_left.jpg', 'HO-00-02-5304-28A_l.jpg', 'herade_inside.jpg', 'Image_Grande72.jpg', 'hotel-megeve-11.jpg', 'MSAC_Gym_-_20061515.jpg', 'int525.jpg', 'Photo-008.jpg', 'int838.jpg', 'Proflex gym lagos nigeria 4.jpg', 'junglegym-60.jpg', 'SALLE3.jpg', 'media39989.jpg', 'SalleMuscu.jpg', 'media40037.jpg', 'VA-02-01-6306-21_l.jpg', 'montreal_octo 030.jpg', 'bg-gym2.jpg', 'necker_salle_de_gym_reference.jpg', 'biosite-gym.jpg', 'p1a.jpg', 'csu6.jpg', 'refurbished-gym-equipment.jpg', 'fieldhouse-weightroom.jpg', 'room398.jpg', 'fitness_center3.jpg', 'room399.jpg', 'guyane_muscul.jpg', 'room424.jpg', 'gym001.jpg', 's1.jpg', 'saledemuscu11.jpg', 'gym03.jpg', 'salle-cardio-grand.jpg', 'gym04.jpg', 'salle_1.jpg', 'gym06.jpg', 'salle_9.jpg', 'gym07.jpg', 'southglade_gym-2.jpg', 'gym08.jpg', 'ucc_gym_photos_bg.jpg', 'gym09.jpg', 'uploads-images-photos_images-fullsize-gym.jpg', 'gym13.jpg', 'url.jpg', 'gym14.jpg', 'web-cardio-theatre-gym.jpg', 'gym2.jpg' ],
  },
  OUTDOOR: {
    castle: [ '087 Chateau Laurier.jpg', 'FreeFoto_castle_1_32.jpg', '38588-Chateau-De-Cruix-0.jpg', 'FreeFoto_castle_1_36.jpg', '7_12_chateau_de_chauvac-1.jpg', 'FreeFoto_castle_1_38.jpg', 'Chateau 1-1.jpg', 'FreeFoto_castle_1_40.jpg', "Chateau D'Usse.jpg", 'FreeFoto_castle_1_5.jpg', 'FreeFoto_castle_14_31.jpg', 'FreeFoto_castle_1_9.jpg', 'FreeFoto_castle_14_34.jpg', 'FreeFoto_castle_20_49.jpg', 'FreeFoto_castle_15_11.jpg', 'FreeFoto_castle_22_40.jpg', 'FreeFoto_castle_16_1.jpg', 'FreeFoto_castle_3_27.jpg', 'FreeFoto_castle_16_14.jpg', 'FreeFoto_castle_3_9.jpg', 'FreeFoto_castle_16_21.jpg', 'FreeFoto_castle_5_41.jpg', 'FreeFoto_castle_16_48.jpg', 'FreeFoto_castle_5_49.jpg', 'FreeFoto_castle_16_49.jpg', 'FreeFoto_castle_8_10.jpg', 'FreeFoto_castle_16_7.jpg', 'FreeFoto_castle_8_2.jpg', 'FreeFoto_castle_17_2.jpg', 'FreeFoto_castle_8_29.jpg', 'FreeFoto_castle_17_39.jpg', 'FreeFoto_castle_8_37.jpg', 'FreeFoto_castle_17_48.jpg', 'FreeFoto_castle_8_7.jpg', 'FreeFoto_castle_1_1.jpg', 'FreeFoto_castle_9_36.jpg', 'FreeFoto_castle_1_10.jpg', 'arques_chateau_3.jpg', 'FreeFoto_castle_1_12.jpg', 'build124.jpg', 'FreeFoto_castle_1_13.jpg', 'build155.jpg', 'FreeFoto_castle_1_15.jpg', 'build680.jpg', 'FreeFoto_castle_1_17.jpg', 'carcassonebridge.jpg', 'FreeFoto_castle_1_21.jpg', 'chateau-chillon-1.jpg', 'FreeFoto_castle_1_22.jpg', 'chateau-de-losse.jpg', 'FreeFoto_castle_1_24.jpg', 'chateau_barrail1.jpg', 'FreeFoto_castle_1_25.jpg', 'chateau_de_bran_chateau_de_dracula.jpg', 'FreeFoto_castle_1_26.jpg', 'chateau_frontenac.jpg', 'FreeFoto_castle_1_29.jpg', 'chateau_v.jpg', 'FreeFoto_castle_1_3.jpg', 'chenonceaux-chateau-de-chenonceau-chenony1-1.jpg' ],
    beach: [ '1147453287.jpg', 'beach_11_02_ask.jpg', '2006-02-13-15-28-07sml.jpg', 'beach_121_12_flickr.jpg', 'AYP0779018_P.jpg', 'beach_127_15_flickr.jpg', 'AYP0779641_P.jpg', 'beach_13_11_flickr.jpg', 'BLP0018661_P.jpg', 'beach_143_14_flickr.jpg', 'CCP0012536_P.jpg', 'beach_144_05_flickr.jpg', 'CCP0013242_P.jpg', 'beach_161_11_flickr.jpg', 'CCP0013911_P.jpg', 'beach_163_18_flickr.jpg', 'Cancun.jpg', 'beach_163_23_flickr.jpg', 'DVP1915541_P.jpg', 'beach_166_09_flickr.jpg', 'bambouseraie_45_05_google.jpg', 'beach_167_08_flickr.jpg', 'bea10.jpg', 'beach_167_15_flickr.jpg', 'bea2.jpg', 'beach_18_22_flickr.jpg', 'bea3.jpg', 'beach_19_07_altavista.jpg', 'bea4.jpg', 'beach_26_07_flickr.jpg', 'bea5.jpg', 'beach_28_18_flickr.jpg', 'beach.jpg', 'beach_30_16_flickr.jpg', 'beach_01_01_ask.jpg', 'beach_34_12_flickr.jpg', 'beach_01_02_google.jpg', 'beach_35_16_altavista.jpg', 'beach_01_03_altavista.jpg', 'beach_37_22_flickr.jpg', 'beach_01_03_google.jpg', 'beach_39_09_flickr.jpg', 'beach_01_05_askl.jpg', 'beach_45_01_altavista.jpg', 'beach_01_05_google.jpg', 'beach_47_02_altavista.jpg', 'beach_01_08_google.jpg', 'beach_51_15_altavista.jpg', 'beach_01_12_flickr.jpg', 'beach_55_21_flickr.jpg', 'beach_02_06_ask.jpg', 'beach_91_17_flickr.jpg', 'beach_04_06_ask.jpg', 'beach_95_03_flickr.jpg', 'beach_04_11_google.jpg', 'beach_dsc00550.jpg', 'beach_08_04_ask.jpg', 'cdMC839.jpg', 'beach_08_07_google.jpg', 'cdMC862.jpg' ],
    forest: [ '08Trees.jpg', 'cdMC349.jpg', '36021.jpg', 'cdMC398.jpg', '36032.jpg', 'cdMC413.jpg', '482063.jpg', 'cdMC617.jpg', 'AGP0027965_P.jpg', 'desktop.ini', 'AYP0783202_P-1.jpg', 'filenames.txt', 'AYP0783229_P.jpg', 'forest05.jpg', 'CBP1014811_P.jpg', 'forest10.jpg', 'CCP0014018_P-1.jpg', 'forest13.jpg', 'CYP0800679_P.jpg', 'forest20.jpg', 'CYP0801743_P.jpg', 'forest24.jpg', 'DVP4907648_P.jpg', 'forest25.jpg', 'DVP4962393_P.jpg', 'forest_01_01_ask.jpg', 'DVP4966497_P.jpg', 'forest_01_01_google.jpg', 'DVP4967677_P.jpg', 'forest_01_02_altavista.jpg', 'FAN1006576_P.jpg', 'forest_01_02_ask.jpg', 'FAN2016942_P.jpg', 'forest_02_11_altavista.jpg', 'FreeFoto_forest_11_32.jpg', 'forest_05_06_askl.jpg', 'FreeFoto_forest_11_36.jpg', 'forest_09_05_askl.jpg', 'FreeFoto_forest_2_47.jpg', 'forest_11_02_altavista.jpg', 'FreeFoto_forest_2_48.jpg', 'forest_11_06_askl.jpg', 'FreeFoto_forest_3_19.jpg', 'forest_11_20_yahoo.jpg', 'FreeFoto_forest_3_20.jpg', 'forest_14_16_yahoo.jpg', 'FreeFoto_forest_3_26.jpg', 'forest_17_01_askl.jpg', 'FreeFoto_forest_3_32.jpg', 'forest_18_04_askl.jpg', 'FreeFoto_forest_3_43.jpg', 'forest_30_02_yahoo.jpg', 'FreeFoto_forest_3_44.jpg', 'forest_31_02_altavista.jpg', 'FreeFoto_forest_9_7.jpg', 'forest_32_08_altavista.jpg', 'FreeFoto_national park_10_1.jpg', 'forest_36_05_altavista.jpg', 'bambouseraie_02_05_altavista.jpg', 'nat234.jpg', 'bambouseraie_12_10_altavista.jpg', 'nat408.jpg' ],
    desert: [ '034medanos.jpg', 'beach_115_11_flickr.jpg', '255055.jpg', 'beach_138_10_flickr.jpg', '480075.jpg', 'beach_165_20_flickr.jpg', '50092.jpg', 'beach_26_19_altavista.jpg', '611sahara.jpg', 'beach_34_01_flickr.jpg', '800px-Towering_Sand_Dunes.jpg', 'beach_40_21_flickr.jpg', 'AA005940.jpg', 'beach_91_12_flickr.jpg', 'AA005954.jpg', 'cdmc795.jpg', 'AA019096.jpg', 'des13.jpg', 'AA020480.jpg', 'des14.jpg', 'AIP0005723_P.jpg', 'des15.jpg', 'BXP0035855_P.jpg', 'des16.jpg', 'BXP0035856_P.jpg', 'des17.jpg', 'DVP4967429_P.jpg', 'des18.jpg', 'Desert_de_Gobi.jpg', 'des21.jpg', 'G02 Gobi Desert Sand Dunes.jpg', 'des22.jpg', 'Lone Palm, Sahara Desert-1.jpg', 'forest_34_08_altavista.jpg', 'MWP0020668_P.jpg', 'land514.jpg', 'NA000915.jpg', 'land526.jpg', 'NA001302.jpg', 'land564.jpg', 'NA004090.jpg', 'land616.jpg', 'NA004783.jpg', 'land645.jpg', 'NA006111.jpg', 'land656.jpg', 'NA006122.jpg', 'land657.jpg', 'NA006361.jpg', 'land658.jpg', 'NA006526.jpg', 'land701.jpg', 'NA007446.jpg', 'mountain_10_04_askl.jpg', 'NA008867.jpg', 'n251011.jpg', 'bambouseraie_42_12_google.jpg', 'natu539.jpg', 'beach_02_10_yahoo.jpg', 'natu89.jpg' ],
    mountain: [ 'BXP0029825_P.jpg', 'land143.jpg', 'CMP0003645_P.jpg', 'land145.jpg', 'DVP4967994_P.jpg', 'land16.jpg', 'DVP4969295_P.jpg', 'land161.jpg', 'FAN2009894_P.jpg', 'land165.jpg', 'FreeFoto_mountain_1_10.jpg', 'land179.jpg', 'FreeFoto_mountain_1_15.jpg', 'land18.jpg', 'FreeFoto_mountain_1_19.jpg', 'land188.jpg', 'FreeFoto_mountain_1_2.jpg', 'land210.jpg', 'FreeFoto_mountain_1_31.jpg', 'land387.jpg', 'FreeFoto_mountain_1_36.jpg', 'land680.jpg', 'FreeFoto_mountain_1_37.jpg', 'mountain05.jpg', 'FreeFoto_mountain_1_44.jpg', 'mountain06.jpg', 'FreeFoto_mountain_1_5.jpg', 'mountain08.jpg', 'FreeFoto_mountain_3_29.jpg', 'mountain09.jpg', 'FreeFoto_mountain_3_34.jpg', 'mountain19.jpg', 'FreeFoto_mountain_4_18.jpg', 'mountain50.jpg', 'FreeFoto_mountain_4_21.jpg', 'mountain52.jpg', 'FreeFoto_mountain_4_28.jpg', 'mountain54.jpg', 'FreeFoto_mountain_4_36.jpg', 'mountain59.jpg', 'FreeFoto_mountain_4_45.jpg', 'mountain62.jpg', 'FreeFoto_mountain_4_47.jpg', 'mountain64.jpg', 'FreeFoto_mountain_4_8.jpg', 'mountain76.jpg', 'FreeFoto_mountain_6_42.jpg', 'mountain77.jpg', 'FreeFoto_mountain_7_1.jpg', 'mountain80.jpg', 'FreeFoto_mountain_8_5.jpg', 'mountain86.jpg', 'cdmc181.jpg', 'mountain93.jpg', 'crique_13_08_google.jpg', 'mountain94.jpg', 'land130.jpg', 'mountain_03_02_askl.jpg', 'land132.jpg', 'n44002.jpg' ],
  },
};

// 音声リスト
const raw_sound_files = [
  'hu.wav', 'ri.wav', 'go.wav', 'ta.wav', 'no.wav', 'zu.wav', 'wa.wav', 'ku.wav', 'mu.wav', 'na.wav', 'zi.wav', 'do.wav', 'ze.wav', 'pe.wav', 'za.wav', 'pu.wav', 'se.wav', 'ko.wav', 'ga.wav', 'zo.wav', 'gu.wav', 'me.wav', 'po.wav', 'te.wav', 'bi.wav', 're.wav', 'ya.wav', 'ba.wav', 'da.wav', 'ra.wav', 'mo.wav', 'bo.wav', 'so.wav', 'ha.wav', 'hi.wav', 'si.wav', 'ru.wav', 'sa.wav', 'nu.wav', 'ke.wav', 'mi.wav', 'gi.wav', 'su.wav', 'de.wav', 'ro.wav', 'to.wav', 'bu.wav', 'ma.wav', 'pa.wav', 'ki.wav', 'ti.wav', 'pi.wav', 'yu.wav', 'ho.wav', 'he.wav', 'ni.wav', 'be.wav', 'tu.wav',
];

// パス生成
const image_files_pool = { indoor: {}, outdoor: {} };
const all_image_paths_flat = [];

for (const main_cat_key in raw_image_files) {
  const main_cat_lower = main_cat_key.toLowerCase();
  image_files_pool[main_cat_lower] = {};
  
  for (const sub_cat_key in raw_image_files[main_cat_key]) {
    const path_prefix = `scenes/${main_cat_key}/${sub_cat_key}/`;
    const paths = raw_image_files[main_cat_key][sub_cat_key].map(filename => path_prefix + filename);
    image_files_pool[main_cat_lower][sub_cat_key] = paths;
    all_image_paths_flat.push(...paths);
  }
}
const all_sounds = raw_sound_files.map(filename => `sounds/${filename}`);

// -------------------- 刺激生成ロジック --------------------

// 設定定数
const NUM_AB_PAIRS = 3;
const NUM_X_SOUNDS = 6;
const NUM_X_TRIALS = NUM_X_SOUNDS;
const NUM_IMAGES_PER_CATEGORY = 12; // 1カテゴリ12枚
const NUM_NEW_IMAGES_TOTAL = 30;
const NUM_DATASET_CANDIDATES = 5;

// カテゴリ定義 (★修正: 明示的に構造化)
const categories = {
  indoor: ['grocerystore', 'library', 'restaurant', 'kitchen', 'gym'],
  outdoor: ['castle', 'beach', 'forest', 'desert', 'mountain']
};
const main_cats = ['indoor', 'outdoor'];

/**
 * データセット候補を作成する関数
 */
function createStringDataset() {
    let learning_imgs = [];
    let used_images_set = new Set();

    // 1. 学習用画像の選出
    main_cats.forEach(main_cat => {
        // ★修正: 対応するサブカテゴリだけを回す
        const sub_cats = categories[main_cat];
        sub_cats.forEach(sub_cat => {
             if (image_files_pool[main_cat] && image_files_pool[main_cat][sub_cat]) {
                const sampled_paths = jsPsych.randomization.sampleWithoutReplacement(image_files_pool[main_cat][sub_cat], NUM_IMAGES_PER_CATEGORY);
                sampled_paths.forEach(path => {
                    learning_imgs.push(path);
                    used_images_set.add(path);
                });
            }
        });
    });
    learning_imgs = jsPsych.randomization.shuffle(learning_imgs);

    // 2. テスト用新規画像の選出
    const unused_paths = all_image_paths_flat.filter(path => !used_images_set.has(path));
    const new_imgs = jsPsych.randomization.sampleWithoutReplacement(unused_paths, NUM_NEW_IMAGES_TOTAL);

    return {
        learning: learning_imgs,
        new_test: new_imgs
    };
}

// -------------------- データセットの確定 --------------------

// 1. 候補を作成
const dataset_candidates = [];
for(let i=0; i<NUM_DATASET_CANDIDATES; i++) {
    dataset_candidates.push(createStringDataset());
}

// 2. 選択
const selected_dataset = jsPsych.randomization.sampleWithoutReplacement(dataset_candidates, 1)[0];

// 3. 展開
const learning_images = selected_dataset.learning;
const new_images_for_test = selected_dataset.new_test;

// デバッグ: 枚数確認 (学習120枚, テスト30枚)
console.log(`Dataset Ready. Learning: ${learning_images.length}, New: ${new_images_for_test.length}`);


// -------------------- 音声・刺激のペアリング (120回完全対応版) --------------------

let shuffled_sounds = jsPsych.randomization.shuffle(all_sounds);

// 音の割り当て
const sounds_for_A = shuffled_sounds.slice(0, NUM_AB_PAIRS); // 3音
const sounds_for_B = shuffled_sounds.slice(NUM_AB_PAIRS, NUM_AB_PAIRS * 2); // 3音
const sounds_for_X = shuffled_sounds.slice(NUM_AB_PAIRS * 2, NUM_AB_PAIRS * 2 + NUM_X_SOUNDS); // 6音

const learned_sound_pairs = [];
for (let i = 0; i < NUM_AB_PAIRS; i++) { learned_sound_pairs.push([sounds_for_A[i], sounds_for_B[i]]); }

// ★★★ 重要：120回の試行プールを厳密に作成 ★★★
// 合計120回 = A:40, B:40, X:40
// ABペア: 40ペア必要 (3種類を14, 13, 13で配分)
// X音声: 40回必要 (6種類を7, 7, 7, 7, 6, 6で配分)

let all_blocks = [];

// 1. ABペアブロックの作成 (40個)
const ab_counts = [14, 13, 13]; // 合計40
for (let i = 0; i < NUM_AB_PAIRS; i++) {
    for (let k = 0; k < ab_counts[i]; k++) {
        all_blocks.push({ 
            type: 'AB_PAIR', 
            sound_A: sounds_for_A[i], 
            sound_B: sounds_for_B[i],
            pair_id: i + 1 
        });
    }
}

// 2. X音声ブロックの作成 (40個)
const x_counts = [7, 7, 7, 7, 6, 6]; // 合計40
for (let i = 0; i < NUM_X_SOUNDS; i++) {
    for (let k = 0; k < x_counts[i]; k++) {
        all_blocks.push({ 
            type: 'X_TRIAL', 
            sound_X: sounds_for_X[i],
            pair_id: 'X' + (i + 1)
        }); 
    }
}

// 3. 全ブロックをシャッフル (合計80ブロック = 40ペア+40単独)
let shuffled_blocks = jsPsych.randomization.shuffle(all_blocks);

// 4. フラット展開 (音の数は 40*2 + 40*1 = 120個 になる)
const flat_sound_sequence = [];
shuffled_blocks.forEach(block => {
    if (block.type === 'AB_PAIR') {
        flat_sound_sequence.push({ 
            sound: block.sound_A, 
            pattern: 'パターンA', 
            pair_id: block.pair_id 
        });
        flat_sound_sequence.push({ 
            sound: block.sound_B, 
            pattern: 'パターンB', 
            pair_id: block.pair_id 
        });
    } else {
        flat_sound_sequence.push({ 
            sound: block.sound_X, 
            pattern: 'パターンX', 
            pair_id: block.pair_id 
        });
    }
});

// 5. 画像と結合 (数は120で完全に一致するはず)
const learning_stimuli = [];
learning_images.forEach((img, idx) => {
    if (idx < flat_sound_sequence.length) {
        const sound_info = flat_sound_sequence[idx];
        learning_stimuli.push({ 
            image: img, 
            sound: sound_info.sound, 
            sound_pattern: sound_info.pattern,
            pair_id: sound_info.pair_id,
            sound_filename: sound_info.sound
        });
    } else {
        console.error("Error: Image count exceeds sound sequence length.");
    }
});

const image_recognition_stimuli = [
  ...learning_images.map(img => ({ image: img, status: 'old', correct_response: 'j' })),
  ...new_images_for_test.map(img => ({ image: img, status: 'new', correct_response: 'k' }))
];

const TOTAL_SOUNDS_USED = (NUM_AB_PAIRS * 2) + NUM_X_SOUNDS;
const unused_sounds_for_test = shuffled_sounds.slice(TOTAL_SOUNDS_USED);
const new_sound_pairs = [];
if (unused_sounds_for_test.length < NUM_AB_PAIRS * 2) { console.error("Not enough unused sounds"); }
else { for (let i = 0; i < NUM_AB_PAIRS; i++) { new_sound_pairs.push([unused_sounds_for_test[i*2], unused_sounds_for_test[i*2 + 1]]); } }
const sound_2afc_stimuli = [];
const shuffled_old_pairs = jsPsych.randomization.shuffle(learned_sound_pairs);
const shuffled_new_pairs = jsPsych.randomization.shuffle(new_sound_pairs);
const num_sound_test_trials = Math.min(shuffled_old_pairs.length, shuffled_new_pairs.length);
for (let i = 0; i < num_sound_test_trials; i++) {
  const presentation_order = jsPsych.randomization.shuffle(['old', 'new']);
  sound_2afc_stimuli.push({ old_pair: shuffled_old_pairs[i], new_pair: shuffled_new_pairs[i], presentation_order: presentation_order, correct_response: presentation_order[0] === 'old' ? 'j' : 'k' });
}

// -------------------- 手順・ブロック定義 --------------------
// 音声チェック
let sound_check_sound = null;
const sound_check_trial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div style="max-width: 800px; text-align: center; line-height: 1.6;"><p>この実験では音が重要です。</p><p>これから短い音声が流れます。音声が聞こえることを確認してください。</p><br><p style="font-size: 1.2em;"><b>J</b> = 確認した / <b>K</b> = 確認できなかった</p></div>`,
    choices: ['j', 'k'],
    on_start: function(trial) {
        if (all_sounds && all_sounds.length > 0) {
            sound_check_sound = jsPsych.randomization.sampleWithoutReplacement(all_sounds, 1)[0];
            const audio = new Audio(sound_check_sound);
            setTimeout(() => { audio.play().catch(e => console.error("Audio play failed:", e)); }, 500);
        } else { console.error("Error: all_sounds is empty."); }
    },
    data: { task_phase: 'sound_check' }
};
const sound_check_loop_node = { timeline: [sound_check_trial], loop_function: function(data){ return data.values()[0].response === 'k'; } };

// 説明画面類
const task_explanation_trial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div style="max-width: 800px; text-align: center; line-height: 1.6;"><p>これから、画面に風景画像が表示され、同時に短い音声が再生されます。</p><p>あなたの課題は、表示された画像が<strong style="color: red;">「屋内」</strong>のものか<strong style="color: red;">「屋外」</strong>のものかを判断し、</br>できるだけ速く、正確にキーを押して回答することです。</p><br><div style="width: 200px; height: 200px; border: 1px solid black; display: flex; align-items: center; justify-content: center; margin: 20px auto; background-color: #eee;"><span style="font-size: 1.2em; color: #555;">風景画</span></div><br><p style="font-size: 1.2em;"><b>J</b> = 屋内画像の場合</p><p style="font-size: 1.2em;"><b>K</b> = 屋外画像の場合</p><br><p>準備ができたら、スペースキーを押して練習を開始してください。</p></div>`,
    choices: [' '], post_trial_gap: 500
};
const instructions_start = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div style="max-width: 800px; text-align: left; line-height: 1.6;"><p><strong>【課題の内容】</strong></p><p>画面に風景画像（屋内または屋外）が1枚ずつ表示され、それと同時に短い音声が再生されます。あなたの課題は、表示された画像が<strong style="color: red;">「屋内」</strong>のものか<strong style="color: red;">「屋外」</strong>のものかを判断し、できるだけ速く、正確にキーを押して回答することです。</p><p><strong>・屋内の場合：「J」キー</strong><br><strong>・屋外の場合：「K」キー</strong></p><p>この課題では、合計120枚の画像と音声が同時に提示されます。画像の「屋内」「屋外」の判断に集中してください。</p><p><strong>【注意点】</strong></p><p>静かで集中できる環境でご参加ください。<strong style="color: red;">PCのスピーカーまたはイヤホンから音声が聞こえる状態にしてください。</strong></p><p>準備ができましたら、<strong>スペースキー</strong>を押して音声確認を開始してください。</p></div>`,
    choices: [' '], post_trial_gap: 500
};
const practice_instructions_start = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `<div style="max-width: 800px; text-align: center; line-height: 1.6;"><p>まず、本番の実験と同じ形式で練習を行います。</p><p>画面に画像が一瞬だけ表示され、同時に音声が流れます。</p><p>画像が屋内か屋外かを判断し、<strong>「J」キー（屋内）</strong>または<strong>「K」キー（屋外）</strong>を押してください。</p><p>準備ができたら、<strong>スペースキー</strong>を押して練習を開始してください。</p></div>`,
  choices: [' '], post_trial_gap: 500
};
const practice_instructions_end = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `<div style="max-width: 800px; text-align: center; line-height: 1.6;"><p>これで練習は終了です。</p><p>スペースを押して本番を始めてください。</p></div>`,
  choices: [' '], post_trial_gap: 500
};
const learning_break_trial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div style="max-width: 800px; text-align: center; line-height: 1.6;"><p>これで前半の課題は終了です。</p><br><p>準備ができましたら、<strong>スペースキー</strong>を押して後半を開始してください。</p></div>`,
    choices: [' '], post_trial_gap: 500
};
const image_rec_break_trial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div style="max-width: 800px; text-align: center; line-height: 1.6;"><p>ここで一度休憩を取ります。</p><br><p>準備ができましたら、<strong>スペースキー</strong>を押してテストの続きを開始してください。</p></div>`,
    choices: [' '], post_trial_gap: 500
};
const instructions_image_rec = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div style="max-width: 800px; text-align: center; line-height: 1.6;"><p>これから画像の記憶テストを行います。</p><p>画面に一枚ずつ画像が表示されます。</p><p>その画像を先ほどの課題で見たかどうかを回答していただきます。</p><br><p style="font-size: 1.2em;">見た画像の場合：「J」キー</p><p style="font-size: 1.2em;">見ていない（初めて見る）画像の場合：「K」キー</p><br><p>できるだけ正確に回答するよう心がけてください。</p><p>準備ができましたら、<strong>スペースキー</strong>を押してテストを開始してください。</p></div>`,
    choices: [' '], post_trial_gap: 500
};
const instructions_sound_rec = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div style="max-width: 800px; text-align: center; line-height: 1.6;"><p>これから音の記憶テストを行います。</p><p>実は前半の課題では、いくつかの音の連続（イ→カなど）が繰り返されていました。</p><p>音の記憶テストでは音の連続が2つ提示されます。</p><p>1つ目の連続と、2つ目の連続、どちらを先ほどの課題フェーズの中で聞いたかを回答していただきます。</p><br><p style="font-size: 1.2em;">「1つ目を聞いた」と思った場合：「J」キー</p><p style="font-size: 1.2em;">「2つ目を聞いた」と思った場合：「K」キー</p><br><p>できるだけ正確に回答するよう心がけてください。</p><p>準備ができましたら、<strong>スペースキー</strong>を押してテストを開始してください。</p></div>`,
    choices: [' '], post_trial_gap: 500
};

// 手順定義
const practice_procedure = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function() { return `<div style="width: 800px; min-height: 600px; display: flex; align-items: center; justify-content: center;"><img id="practice_image" src="${jsPsych.timelineVariable('image')}" style="max-width: 100%; max-height: 600px; height: auto;"></div>`; },
  choices: ['j', 'k'],
  stimulus_duration: 1000,
  prompt: '<p style="font-size: 1.2em; text-align: center;"><b>J</b> = 屋内 / <b>K</b> = 屋外</p>',
  data: { task_phase: 'practice', image_filename: jsPsych.timelineVariable('image') },
  on_start: function(trial) {
    if (all_sounds && all_sounds.length > 0) { const random_sound = jsPsych.randomization.sampleWithoutReplacement(all_sounds, 1)[0]; const audio = new Audio(random_sound); audio.play().catch(e => console.error("Practice audio play failed:", e)); }
  }
};
const learning_procedure = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function() { return `<div style="width: 800px; min-height: 600px; display: flex; align-items: center; justify-content: center;"><img id="learning_image" src="${jsPsych.timelineVariable('image')}" style="max-width: 100%; max-height: 600px; height: auto;"></div>`; },
  choices: ['j', 'k'],
  prompt: '<p style="font-size: 1.2em; text-align: center;"><b>J</b> = 屋内 / <b>K</b> = 屋外</p>',
  stimulus_duration: 1000,
  post_trial_gap: 500,
  data: { 
      image_filename: jsPsych.timelineVariable('image'), 
      sound_pattern: jsPsych.timelineVariable('sound_pattern'), 
      pair_id: jsPsych.timelineVariable('pair_id'),
      sound_filename: jsPsych.timelineVariable('sound_filename'),
      task_phase: 'learning' 
  },
  on_start: function(trial) {
    const sound_path = jsPsych.timelineVariable('sound');
    if (sound_path) { const audio = new Audio(sound_path); audio.play().catch(e => console.error("Learning audio play failed:", e)); }
  },
  on_finish: function(data) {
    const filename = (data.image_filename || '').toLowerCase();
    let correct_response = null;
    if (filename.includes('indoor')) correct_response = 'j';
    else if (filename.includes('outdoor')) correct_response = 'k';
    data.correct = correct_response ? (data.response === correct_response) : null;
  }
};
const image_recognition_procedure = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function() { const image_path = jsPsych.timelineVariable('image'); return `<div style="width: 800px; min-height: 600px; display: flex; align-items: center; justify-content: center;"><img src="${image_path}" style="max-width: 100%; max-height: 600px; height: auto;"></div>`; },
  choices: ['j', 'k'],
  prompt: `<p style="text-align: center;">この画像は、先ほどの課題フェーズで見ましたか？</p><p style="font-size: 1.2em; text-align: center;"><b>J</b> = はい、見ました / <b>K</b> = いいえ、見ていません</p>`,
  data: { image_filename: jsPsych.timelineVariable('image'), status: jsPsych.timelineVariable('status'), correct_response: jsPsych.timelineVariable('correct_response'), task_phase: 'image_recognition' },
  on_finish: function(data) { data.correct = data.response === data.correct_response; }
};
const sound_recognition_trial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '<p style="font-size: 1.5em; text-align: center;">音声を再生します...</p>',
    choices: "NO_KEYS",
    prompt: `<p style="font-size: 1.2em; text-align: center;"><b>1つ目のパターンの場合は「J」キー</b></p><p style="font-size: 1.2em; text-align: center;"><b>2つ目のパターンの場合は「K」キー</b></p>`,
    trial_duration: null,
    response_ends_trial: true,
    data: function(){
        return {
            old_pair: jsPsych.timelineVariable('old_pair'),
            new_pair: jsPsych.timelineVariable('new_pair'),
            presentation_order: jsPsych.timelineVariable('presentation_order'),
            correct_response: jsPsych.timelineVariable('correct_response'),
            task_phase: 'sound_recognition'
        };
    },
    on_load: function() {
        jsPsych.pluginAPI.cancelAllKeyboardResponses();
        const presentation_order = jsPsych.timelineVariable('presentation_order');
        const old_pair = jsPsych.timelineVariable('old_pair');
        const new_pair = jsPsych.timelineVariable('new_pair');
        const first_pair_sounds = presentation_order[0] === 'old' ? old_pair : new_pair;
        const second_pair_sounds = presentation_order[1] === 'old' ? old_pair : new_pair;
        const audio1 = new Audio(first_pair_sounds[0]);
        const audio2 = new Audio(first_pair_sounds[1]);
        const audio3 = new Audio(second_pair_sounds[0]);
        const audio4 = new Audio(second_pair_sounds[1]);
        const stimulus_div = jsPsych.getDisplayElement().querySelector('.jspsych-html-keyboard-response-stimulus');
        
        let soundsPlayed = 0;
        const enableResponse = () => {
            if (stimulus_div) stimulus_div.innerHTML = `<p style="text-align: center;">どちらのペアが課題フェーズで聞いたペアでしたか？</p>`;
             jsPsych.pluginAPI.getKeyboardResponse({
                 callback_function: (info) => { jsPsych.finishTrial({ rt: info.rt, response: info.key }); },
                 valid_responses: ['j', 'k'], rt_method: 'performance', persist: false, allow_held_key: false
             });
        };
        const soundEnded = () => {
            soundsPlayed++;
            if (soundsPlayed >= 4) { setTimeout(enableResponse, 500); }
        };
        [audio1, audio2, audio3, audio4].forEach(a => { a.addEventListener('ended', soundEnded); a.addEventListener('error', soundEnded); });
        
        audio1.addEventListener('ended', () => setTimeout(() => audio2.play().catch(soundEnded), 100));
        audio2.addEventListener('ended', () => setTimeout(() => audio3.play().catch(soundEnded), 700));
        audio3.addEventListener('ended', () => setTimeout(() => audio4.play().catch(soundEnded), 100));
        setTimeout(() => { if(stimulus_div) stimulus_div.innerHTML = '<p style="font-size: 1.5em; text-align: center;">1組目...</p>'; audio1.play().catch(soundEnded); }, 500);
    },
    on_finish: function(data) { data.correct = data.response === data.correct_response; }
};

// ブロック定義
const practice_selection = jsPsych.randomization.sampleWithoutReplacement(practice_image_files, 3);
const practice_timeline_variables = practice_selection.map(img_path => { return { image: img_path }; });
const practice_block = { timeline: [practice_procedure], timeline_variables: practice_timeline_variables, randomize_order: true };

const learning_stimuli_part1 = learning_stimuli.slice(0, Math.ceil(learning_stimuli.length / 2));
const learning_stimuli_part2 = learning_stimuli.slice(Math.ceil(learning_stimuli.length / 2));
const learning_block_1 = { timeline: [learning_procedure], timeline_variables: learning_stimuli_part1, randomize_order: true };
const learning_block_2 = { timeline: [learning_procedure], timeline_variables: learning_stimuli_part2, randomize_order: true };

const image_rec_part_size = Math.ceil(image_recognition_stimuli.length / 3);
const image_recognition_stimuli_part1 = image_recognition_stimuli.slice(0, image_rec_part_size);
const image_recognition_stimuli_part2 = image_recognition_stimuli.slice(image_rec_part_size, image_rec_part_size * 2);
const image_recognition_stimuli_part3 = image_recognition_stimuli.slice(image_rec_part_size * 2);
const image_recognition_block_1 = { timeline: [image_recognition_procedure], timeline_variables: image_recognition_stimuli_part1, randomize_order: true };
const image_recognition_block_2 = { timeline: [image_recognition_procedure], timeline_variables: image_recognition_stimuli_part2, randomize_order: true };
const image_recognition_block_3 = { timeline: [image_recognition_procedure], timeline_variables: image_recognition_stimuli_part3, randomize_order: true };
const sound_recognition_block = { timeline: [sound_recognition_trial], timeline_variables: sound_2afc_stimuli, randomize_order: true };


// =========================================================================
// タイムラインの構築と実行 (すべて冒頭でロードする方式)
// =========================================================================

// ヘルパー: 配列を分割する関数
function chunkArray(array, parts) {
    let result = [];
    if (array.length === 0) return result;
    const actualParts = Math.min(parts, array.length); 
    const chunkSize = Math.ceil(array.length / actualParts);
    for (let i = 0; i < actualParts; i++) {
        const start = i * chunkSize;
        const end = start + chunkSize;
        const chunk = array.slice(start, end);
        if(chunk.length > 0) result.push(chunk);
    }
    return result;
}

const timeline = [];

// ---------------------------------------------------------
// 1. 音声のプリロード
// ---------------------------------------------------------
const sound_chunks = chunkArray([...all_sounds], 4);
sound_chunks.forEach((chunk, index) => {
    if(chunk.length > 0){
        timeline.push({
            type: jsPsychPreload, 
            audio: chunk,
            message: `<div style="text-align:center;"><p>実験データを準備しています...</p><p>音声の読み込み中 (${index + 1}/${sound_chunks.length})</p><div style="margin: 20px auto; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #e74c3c; border-radius: 50%; animation: spin 1s linear infinite;"></div></div>`,
            max_load_time: 60000, 
            continue_after_error: false
        });
    }
});

// ---------------------------------------------------------
// 2. 画像のプリロード（すべて最初にロード！）
// ---------------------------------------------------------
// 使う画像すべてを1つのリストにまとめます
const all_experiment_images = [
    ...practice_image_files,
    ...learning_images,      // 選出された学習用
    ...new_images_for_test   // 選出されたテスト用
];

// これを10枚ずつ、約15個の塊に分けます
const image_chunks = chunkArray(all_experiment_images, 15);

image_chunks.forEach((chunk, index) => {
    if (chunk.length > 0) {
        timeline.push({
            type: jsPsychPreload,
            images: chunk,
            message: `<div style="text-align:center;">
                        <p>実験データを準備しています...</p>
                        <p>画像の読み込み中 (${index + 1}/${image_chunks.length})</p>
                        <div style="margin: 20px auto; width: 200px; height: 20px; background-color: #ddd; border-radius: 10px; overflow: hidden;">
                          <div style="width: ${((index + 1) / image_chunks.length) * 100}%; height: 100%; background-color: #3498db;"></div>
                        </div>
                      </div>`,
            show_progress_bar: false, 
            max_load_time: 60000,
            continue_after_error: false 
        });
    }
});


// ---------------------------------------------------------
// 3. 実験本編（すべてロード済みなので、通常のブロック定義でOK）
// ---------------------------------------------------------

timeline.push(study_description_trial);
timeline.push(consent_form_trial);
timeline.push(withdrawal_info_trial);
timeline.push(initials_trial);

timeline.push(instructions_start);
timeline.push(sound_check_loop_node);
timeline.push(task_explanation_trial);

timeline.push(practice_instructions_start);
timeline.push(practice_block);
timeline.push(practice_instructions_end);

timeline.push(learning_block_1);
timeline.push(learning_break_trial);
timeline.push(learning_block_2);

timeline.push(instructions_image_rec);
timeline.push(image_recognition_block_1);
timeline.push(image_rec_break_trial);
timeline.push(image_recognition_block_2);
timeline.push(image_rec_break_trial);
timeline.push(image_recognition_block_3);

timeline.push(instructions_sound_rec);
timeline.push(sound_recognition_block);

// 実験実行
jsPsych.run(timeline);