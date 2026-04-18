// [v9.5.0] app-parser.js: High-Precision Parser (Diagram & Tags Split)

window.showBulkAddModal = function() { 
    const m = document.getElementById('modal-container'); if(!m) return;
    m.innerHTML = `<div class="modal-backdrop" onclick="window.closeModal()"></div><div class="modal" style="max-width:900px; width:95%; background:#fff; border-radius:20px; padding:35px; box-shadow:0 10px 25px rgba(0,0,0,0.1); position:relative; z-index:100000;"><div style="text-align:center; margin-bottom:20px;"><h2 style="color:#0f172a; margin-bottom:10px; font-size:1.8em;">🤖 통합 스마트 지식 주입</h2><p style="color:#64748b; margin-bottom:20px;">AI가 요약한 [문제], [다단 비교표], [노트] 데이터를 한 번에 붙여넣으세요. (누락된 항목은 자동 공백 처리됩니다)</p></div><textarea id="bulk-input" style="width:100%; height:350px; padding:20px; border-radius:15px; border:2px solid #e2e8f0; font-family:'Consolas', monospace; line-height:1.6; font-size:1.05em; box-sizing:border-box; background:#f8fafc;" placeholder="여기에 텍스트를 붙여넣으세요..."></textarea><div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-top:25px;"><button class="button primary-button" style="height:60px; font-size:1.2em; border-radius:12px; background:#4f46e5; border:none;" onclick="window.processUnifiedBulkAdd()">🚀 데이터 분석 및 주입 시작</button><button class="button light-button" style="height:60px; font-size:1.2em; border-radius:12px; border:2px solid #cbd5e1;" onclick="window.closeModal()">취소</button></div></div>`;
    m.classList.remove('hidden');
};

window.processUnifiedBulkAdd = async function() {
    const inputArea = document.getElementById('bulk-input'); if (!inputArea) return;
    let input = inputArea.value; if (!input.trim()) return alert("주입할 텍스트가 없습니다.");
    window.showLoading();
    
    input = input.replace(/[\u00A0\u200B-\u200D\uFEFF]/g, ' ').replace(/\*\*/g, '');
    const lines = input.split('\n').map(l => l.trim());
    let qCount = 0, cCount = 0, nCount = 0, qObj = null, cObj = null, nObj = null, mode = '', field = '', buffer = [];

    const getAfter = (str, kw) => {
        const idx = str.indexOf(':');
        if(idx !== -1 && str.substring(0, idx).includes(kw)) return str.substring(idx+1).trim();
        return str.replace(new RegExp(`^.*?${kw}\\s*`), '').trim();
    };

    const saveField = () => {
        if (!mode || !field) return;
        const val = buffer.join('\n').trim();
        if (!val && field !== 'options') return;
        if (mode === 'Q' && qObj) {
            const map = { type: 'negativeType', text: 'text', ans: 'answer', diag: 'diagramFormula', short: 'shortExplanation', exp: 'explanation', knT: 'knTopic', knR: 'knowledgeNetwork', mne: 'mnemonic', mneD: 'mnemonicDesc' };
            if (map[field]) {
                qObj[map[field]] = val;
            } else if (field === 'path') {
                qObj.pathLevels = val.split(/\n|,|단계:/).map(s => s.trim().replace(/^\d+\s*/, '')).filter(Boolean);
            } else if (field === 'kw') {
                qObj.keywords = val.replace(/#/g, '').split(/[\s,]+/).filter(Boolean);
            } else if (field === 'tg') { // 🚨 태그 개별 파싱
                qObj.tags = val.replace(/#/g, '').split(/[\s,]+/).filter(Boolean);
            } else if (field === 'options') {
                let opts = val.split(/(?:\([1-5]\)|[①-⑤]|\d\)\s+|\d\.\s+|^O\s+\(맞다\)|^X\s+\(틀리다\))/gm).map(s => s.trim()).filter(Boolean);
                if (opts.length <= 1 && val.includes('\n')) opts = val.split('\n').map(s => s.trim()).filter(Boolean);
                qObj.options = opts;
            } else if (field.startsWith('optImg')) { 
                const idx = parseInt(field.replace('optImg', '')) - 1;
                if(!qObj.optionImages) qObj.optionImages = ['', '', '', '', ''];
                if(idx >= 0 && idx < 5) qObj.optionImages[idx] = val;
            } else if (field.startsWith('imgUrl')) { 
                const idx = parseInt(field.replace('imgUrl', '')) - 1;
                if(!qObj.images) qObj.images = [];
                while(qObj.images.length <= idx) qObj.images.push({url:'', desc:''});
                qObj.images[idx].url = val;
            } else if (field.startsWith('imgDesc')) { 
                const idx = parseInt(field.replace('imgDesc', '')) - 1;
                if(!qObj.images) qObj.images = [];
                while(qObj.images.length <= idx) qObj.images.push({url:'', desc:''});
                qObj.images[idx].desc = val;
            }
        } else if (mode === 'N' && nObj) nObj.content += val + '\n';
        buffer = [];
    };

    const flush = async () => {
        saveField(); const ts = firebase.firestore.FieldValue.serverTimestamp();
        if (qObj && qObj.text) { if(qObj.answer) qObj.answer = qObj.answer.replace(/^\d+\)\s*/, ''); qObj.updatedAt = ts; qObj.createdAt = ts; await window.db.collection('subjects').doc(window.currentSubjectId).collection('questions').add(qObj); qCount++; qObj = null; }
        if (cObj && cObj.rows && cObj.rows.length > 0) { cObj.createdAt = ts; cObj.updatedAt = ts; await window.db.collection('subjects').doc(window.currentSubjectId).collection('comparisons').add(cObj); cCount++; cObj = null; }
        if (nObj && nObj.content && nObj.content.trim()) { nObj.createdAt = ts; nObj.updatedAt = ts; await window.db.collection('subjects').doc(window.currentSubjectId).collection('notes').add(nObj); nCount++; nObj = null; }
    };

    for (let line of lines) {
        const clean = line.replace(/^[\s\-•]+/, ''); if(!clean) continue;
        
        if (clean.match(/문제\s*유형|^1\.\s*문제/)) { await flush(); mode = 'Q'; field = 'type'; qObj = { options: [], optionImages: ['', '', '', '', ''], images: [], pathLevels: [], keywords: [], tags: [], bookmarked: false }; buffer = [getAfter(clean, '유형')]; }
        else if (clean.match(/질문\s*내용|^2\.\s*/)) { saveField(); field = 'text'; buffer = [getAfter(clean, '내용')]; }
        else if (clean.match(/선택지|^3\.\s*/)) { saveField(); field = 'options'; }
        else if (clean.match(/정답|^4\.\s*/)) { saveField(); field = 'ans'; buffer = [getAfter(clean, '정답')]; }
        else if (clean.match(/^도식\s*및\s*공식|^도식|^공식/)) { saveField(); field = 'diag'; buffer = [getAfter(clean, '공식') || getAfter(clean, '도식')]; }
        else if (clean.match(/1줄\s*해설|^5\.\s*/)) { saveField(); field = 'short'; buffer = [getAfter(clean, '해설')]; }
        else if (clean.match(/상세\s*해설|^6\.\s*/)) { saveField(); field = 'exp'; buffer = [getAfter(clean, '해설')]; }
        else if (clean.match(/목차\s*정보|^7\.\s*/)) { saveField(); field = 'path'; buffer = [getAfter(clean, '정보')]; }
        else if (clean.match(/암기\s*코드|^8-1\.\s*/)) { saveField(); field = 'mne'; buffer = [getAfter(clean, '코드')]; }
        else if (clean.match(/해석\s*및\s*풀이|^8-2\.\s*/)) { saveField(); field = 'mneD'; buffer = [getAfter(clean, '풀이')]; }
        else if (clean.match(/^키워드/)) { saveField(); field = 'kw'; buffer = [getAfter(clean, '키워드')]; }
        else if (clean.match(/^태그/)) { saveField(); field = 'tg'; buffer = [getAfter(clean, '태그')]; } // 🚨 태그 파싱
        else if (clean.match(/^핵심\s*주제/)) { saveField(); field = 'knT'; buffer = [getAfter(clean, '주제')]; }
        else if (clean.match(/^연결\s*관계/)) { saveField(); field = 'knR'; buffer = [getAfter(clean, '관계')]; }
        else if (clean.match(/선택지\s*(\d)\s*이미지/)) { saveField(); const m = clean.match(/선택지\s*(\d)\s*이미지/); field = 'optImg' + m[1]; buffer = [getAfter(clean, '이미지')]; }
        else if (clean.match(/이미지\s*링크\s*(\d)|이미지\s*(\d)\s*URL|이미지\s*(\d)/i)) { saveField(); const m = clean.match(/(\d)/); field = 'imgUrl' + m[1]; buffer = [getAfter(clean, '링크') || getAfter(clean, 'URL') || getAfter(clean, '이미지')]; }
        else if (clean.match(/이미지\s*설명\s*(\d)|이미지\s*(\d)\s*설명/i)) { saveField(); const m = clean.match(/(\d)/); field = 'imgDesc' + m[1]; buffer = [getAfter(clean, '설명')]; }
        else if (clean.match(/이미지\s*링크|이미지\s*URL/i)) { saveField(); field = 'imgUrl1'; buffer = [getAfter(clean, '링크') || getAfter(clean, 'URL')]; }
        else if (clean.match(/이미지\s*설명/)) { saveField(); field = 'imgDesc1'; buffer = [getAfter(clean, '설명')]; }
        else if (clean.match(/비교표|주제:/) && !clean.includes('핵심 주제')) { await flush(); mode = 'C'; cObj = { title: clean.replace(/.*비교표\s*|주제:\s*/, '').replace(/\)$/, ''), col1Name: '', col2Name: '', col3Name: '', col4Name: '', rows: [] }; }
        else if (clean.match(/\[노트\]|📁|학습\s*데이터\s*프로토콜/)) { 
            await flush(); mode = 'N'; 
            let rawTitle = clean.replace(/.*📁|.*노트\]?\s*|.*프로토콜:?\s*/, '').trim();
            let parsedCat = "미분류"; let parsedTitle = rawTitle;
            if(rawTitle.includes(':')) { const parts = rawTitle.split(':'); parsedCat = parts[0].trim(); parsedTitle = parts.slice(1).join(':').trim(); }
            else if(rawTitle.includes('-')) { const parts = rawTitle.split('-'); parsedCat = parts[0].trim(); parsedTitle = parts.slice(1).join('-').trim(); }
            nObj = { category: parsedCat, title: parsedTitle, content: '' }; 
        }
        else {
            if (mode === 'C' && cObj) {
                let cols = clean.split(/\||\t|\s{2,}/).map(s=>s.trim()).filter(s=>s);
                if (cols.length >= 2 && !clean.match(/^[-|\s]+$/)) { 
                    if (!cObj.col1Name && !cols[0].includes('비교 항목')) { for(let i=0; i<cols.length && i<4; i++) cObj[`col${i+1}Name`] = cols[i]; } 
                    else if (cObj.col1Name || cols[0].includes('비교 항목')) {
                        if(cols[0].includes('비교 항목')) { for(let i=0; i<cols.length && i<4; i++) cObj[`col${i+1}Name`] = cols[i].replace('비교 항목', '').trim() || `항목${i+1}`; } 
                        else { cObj.rows.push({ col1: cols[0], col2: cols[1], col3: cols[2]||'', col4: cols[3]||'' }); }
                    }
                }
            } else { if(clean !== "지식 연결망") buffer.push(clean); }
        }
    }
    
    await flush(); window.hideLoading(); window.closeModal(); 
    if (window.currentSubjectId && typeof window.manageSubject === 'function') window.manageSubject(window.currentSubjectId);
    if(typeof window.showToast === 'function') window.showToast(`주입 완료: 문제 ${qCount}건, 비교표 ${cCount}건, 노트 ${nCount}건`);
};