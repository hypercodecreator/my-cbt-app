// =========================================================
// [v14.0.0] app-parser.js: Unstoppable Semantic Parser
// (Strict Header Detection, Glued-Text Separation)
// =========================================================

window.showBulkAddModal = function() { 
    const m = document.getElementById('modal-container'); if(!m) return;
    m.innerHTML = `<div class="modal-backdrop" onclick="window.closeModal()"></div>
    <div class="modal" style="max-width:1000px; width:95%; background:#fff; border-radius:20px; padding:35px; box-shadow:0 10px 40px rgba(0,0,0,0.15); position:relative; z-index:100000;">
        <div style="text-align:center; margin-bottom:20px;">
            <h2 style="color:#4f46e5; margin-bottom:10px; font-size:1.8em;">🤖 7단계 프로토콜 스마트 주입</h2>
            <p style="color:#64748b; margin-bottom:10px;">AI나 노션에서 작성한 데이터를 복사+붙여넣기 하세요.</p>
            <p style="color:#ef4444; font-size:0.95em; font-weight:bold; background:#fee2e2; padding:10px; border-radius:8px;">🚨 꿀팁: 사례 분석이나 비교표를 붙여넣었을 때 글자가 다닥다닥 붙어서 깨진다면, AI에게 "표는 반드시 | 기호로 구분되는 마크다운 표 형식으로 출력해줘"라고 요청한 뒤 붙여넣어 보세요!</p>
        </div>
        <textarea id="bulk-input" style="width:100%; height:400px; padding:20px; border-radius:15px; border:2px solid #e2e8f0; font-family:'Consolas', monospace; line-height:1.6; font-size:1.05em; box-sizing:border-box; background:#f8fafc;" placeholder="여기에 텍스트를 붙여넣으세요..."></textarea>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-top:25px;">
            <button class="button primary-button" style="height:60px; font-size:1.2em; border-radius:12px; background:#4f46e5; border:none;" onclick="window.processUnifiedBulkAdd()">🚀 데이터 분석 및 7개 항목 주입 시작</button>
            <button class="button light-button" style="height:60px; font-size:1.2em; border-radius:12px; border:2px solid #cbd5e1;" onclick="window.closeModal()">취소</button>
        </div>
    </div>`;
    m.classList.remove('hidden');
};

window.processUnifiedBulkAdd = async function() {
    const inputArea = document.getElementById('bulk-input'); if (!inputArea) return;
    let input = inputArea.value; if (!input.trim()) return alert("주입할 텍스트가 없습니다.");
    window.showLoading();
    
    try {
        input = input.replace(/[\u00A0\u200B-\u200D\uFEFF]/g, ' ').replace(/\*\*/g, '');
        const lines = input.split('\n');
        
        let counts = {q:0, c:0, n:0, v:0, s:0};
        let qObj = null, cObj = null, nObj = null, vObj = null, sObj = null;
        let mode = '', field = '', buffer = [];

        const saveField = () => {
            if (!mode || !field) return;
            let val = buffer.join('\n').trim();
            if (['없음', '공백', '-', '해당없음'].includes(val.replace(/\s+/g, ''))) val = ''; 

            if (mode === 'Q' && qObj) {
                const map = { type: 'negativeType', text: 'text', ans: 'answer', short: 'shortExplanation', exp: 'explanation', mne: 'mnemonic', mneD: 'mnemonicDesc', knR: 'knowledgeNetwork', diag: 'diagramFormula', kw: 'keywords', tg: 'tags' };
                if (map[field]) { 
                    if(field === 'kw' || field === 'tg') {
                        qObj[map[field]] = val ? val.replace(/#/g,'').split(/[,|/]+|\s+/).map(s=>s.trim()).filter(Boolean) : [];
                    } else {
                        qObj[map[field]] = val; 
                    }
                } else if (field === 'options') {
                    if (!val) qObj.options = [];
                    else {
                        let opts = val.split(/(?:\([1-5]\)|[①-⑤]|\d\)\s+|\d\.\s+|^O\s+\(맞다\)|^X\s+\(틀리다\))/gm).map(s => s.trim()).filter(Boolean);
                        if (opts.length <= 1 && val.includes('\n')) opts = val.split('\n').map(s => s.trim()).filter(Boolean);
                        qObj.options = opts;
                    }
                } else if (field === 'path') { qObj.pathLevels = val ? val.split(/\n|,|단계:/).map(s => s.trim().replace(/^\d+\s*/, '')).filter(Boolean) : []; }
            } 
            else if (mode === 'N' && nObj) { if(val) nObj.content += (nObj.content?'\n':'') + val; }
            else if (mode === 'V' && vObj) { if(val) vObj.content += (vObj.content?'\n':'') + val; }
            buffer = [];
        };

        const flush = async () => {
            saveField(); const ts = firebase.firestore.FieldValue.serverTimestamp();
            if (qObj) { 
                if(!qObj.text) qObj.text = "질문 내용 없음 (스마트 주입)";
                if(qObj.answer) qObj.answer = qObj.answer.replace(/^\d+\)\s*/, ''); 
                qObj.updatedAt = ts; qObj.createdAt = ts; 
                await window.db.collection('subjects').doc(window.currentSubjectId).collection('questions').add(qObj); 
                counts.q++; qObj = null; 
            }
            if (cObj) { 
                if(!cObj.col1Name && cObj.rows.length === 0) cObj.rows.push({col1:'-', col2:'-', col3:'', col4:''});
                cObj.createdAt = ts; cObj.updatedAt = ts; 
                await window.db.collection('subjects').doc(window.currentSubjectId).collection('comparisons').add(cObj); 
                counts.c++; cObj = null; 
            }
            if (nObj) { 
                if(!nObj.content) nObj.content = "내용 없음";
                nObj.createdAt = ts; nObj.updatedAt = ts; 
                await window.db.collection('subjects').doc(window.currentSubjectId).collection('notes').add(nObj); 
                counts.n++; nObj = null; 
            }
            if (vObj) { 
                if(!vObj.content) vObj.content = "내용 없음";
                vObj.createdAt = ts; vObj.updatedAt = ts; 
                await window.db.collection('subjects').doc(window.currentSubjectId).collection('visualMaps').add(vObj); 
                counts.v++; vObj = null; 
            }
            if (sObj) { 
                if(!sObj.sit_c && !sObj.pri_c && !sObj.sta_c) sObj.sit_c = "내용 없음";
                sObj.createdAt = ts; sObj.updatedAt = ts; 
                await window.db.collection('subjects').doc(window.currentSubjectId).collection('caseStudies').add(sObj); 
                counts.s++; sObj = null; 
            }
        };

        for (let line of lines) {
            let clean = line.trim();
            if (!clean) continue;

            // 🚨 1. 정확한 대제목 7단계 매칭 (중간 단어 속임수 완벽 방어)
            if (clean.match(/^[\[(]?1[\]\)]?\.?\s*정답\s*및\s*핵심\s*리마인드/)) { await flush(); mode='N'; nObj={category:'미분류', title:'핵심 리마인드', content:''}; field='content'; continue; }
            if (clean.match(/^[\[(]?2[\]\)]?\.?\s*실전\s*대비/)) { await flush(); mode='Q'; qObj={negativeType:'', text:'', answer:'', shortExplanation:'', explanation:'', mnemonic:'', mnemonicDesc:'', knowledgeNetwork:'', diagramFormula:'', options:[], optionImages:['','','','',''], images:[], pathLevels:[], keywords:[], tags:[], bookmarked:false}; field=''; continue; }
            if (clean.match(/^[\[(]?3[\]\)]?\.?\s*지식\s*재구성/)) { mode='Q'; continue; }
            if (clean.match(/^[\[(]?4[\]\)]?\.?\s*시각적\s*구조화/)) { await flush(); mode='V'; vObj={category:'미분류', title:'시각적 구조화', content:''}; field='content'; continue; }
            if (clean.match(/^[\[(]?5[\]\)]?\.?\s*사례\s*분석/)) { await flush(); mode='S'; sObj={title:'사례 분석', category:'미분류', sit_c:'', sit_n:'', pri_c:'', pri_n:'', sta_c:'', sta_n:'', pnt_c:'', pnt_n:''}; continue; }
            if (clean.match(/^[\[(]?6[\]\)]?\.?\s*다단\s*비교/)) { await flush(); mode='C'; cObj={title:'다단 비교표', col1Name:'', col2Name:'', col3Name:'', col4Name:'', rows:[]}; continue; }
            if (clean.match(/^[\[(]?7[\]\)]?\.?\s*학습\s*데이터/)) { await flush(); mode='N'; nObj={category:'미분류', title:'학습 데이터 프로토콜', content:''}; field='content'; continue; }

            // 2. 항목별 세부 분류
            if (mode === 'Q') {
                if (clean.match(/^[\[(]?1[\]\)]?\.?\s*문제\s*유형/)) { saveField(); field='type'; buffer=[clean.replace(/^.*?문제\s*유형[:\s]*/, '')]; }
                else if (clean.match(/^[\[(]?2[\]\)]?\.?\s*질문\s*내용/)) { saveField(); field='text'; buffer=[clean.replace(/^.*?질문\s*내용[:\s]*/, '')]; }
                else if (clean.match(/^[\[(]?3[\]\)]?\.?\s*정답/)) { saveField(); field='ans'; buffer=[clean.replace(/^.*?정답[:\s]*/, '')]; }
                else if (clean.match(/^[\[(]?4[\]\)]?\.?\s*선택지/)) { saveField(); field='options'; buffer=[clean.replace(/^.*?선택지[:\s]*/, '')]; }
                else if (clean.match(/^[\[(]?5[\]\)]?\.?\s*(1줄\s*해설|해설\s*요약)/)) { saveField(); field='short'; buffer=[clean.replace(/^.*?(1줄\s*해설|해설\s*요약)[:\s]*/, '')]; }
                else if (clean.match(/^[\[(]?6[\]\)]?\.?\s*상세\s*해설/)) { saveField(); field='exp'; buffer=[clean.replace(/^.*?상세\s*해설[:\s]*/, '')]; }
                else if (clean.match(/^[\[(]?7[\]\)]?\.?\s*목차\s*정보/)) { saveField(); field='path'; buffer=[clean.replace(/^.*?목차\s*정보[:\s]*/, '')]; }
                else if (clean.match(/^암기\s*코드/)) { saveField(); field='mne'; buffer=[clean.replace(/^.*?암기\s*코드[:\s]*/, '')]; }
                else if (clean.match(/^해석\s*및\s*풀이/)) { saveField(); field='mneD'; buffer=[clean.replace(/^.*?해석\s*및\s*풀이[:\s]*/, '')]; }
                else if (clean.match(/^지식\s*연결망/)) { saveField(); field='knR'; buffer=[clean.replace(/^.*?지식\s*연결망[:\s]*/, '')]; }
                else if (clean.match(/^도식\s*및\s*핵심\s*공식|^도식\s*및\s*핵심\s*원리/)) { saveField(); field='diag'; buffer=[clean.replace(/^.*?(도식\s*및\s*핵심\s*공식|도식\s*및\s*핵심\s*원리)[:\s]*/, '')]; }
                else if (clean.match(/^키워드/)) { saveField(); field='kw'; buffer=[clean.replace(/^.*?키워드[:\s]*/, '')]; }
                else if (clean.match(/^태그/)) { saveField(); field='tg'; buffer=[clean.replace(/^.*?태그[:\s]*/, '')]; }
                else { buffer.push(clean); }
            }
            else if (mode === 'N' || mode === 'V') {
                buffer.push(clean);
            }
            // 🚨 3. 사례 분석 (떡진 표 강제 복원 로직)
            else if (mode === 'S' && sObj) {
                if (clean.match(/구분\s*구체적\s*사례|구분\s*\|\s*구체적/)) continue;
                let parts = clean.split(/\t|\|/).map(s=>s.trim()).filter(s=>s);
                if (parts.length >= 2) {
                    let k = parts[0]; let cText = parts[1]; let nText = parts[2]||'';
                    if (k.includes('상황')) { sObj.sit_c = cText; sObj.sit_n = nText; }
                    else if (k.includes('작용')||k.includes('원리')||k.includes('진단')||k.includes('선택')) { sObj.pri_c = cText; sObj.pri_n = nText; }
                    else if (k.includes('상태')||k.includes('결과')||k.includes('처치')||k.includes('이유')) { sObj.sta_c = cText; sObj.sta_n = nText; }
                    else if (k.includes('포인트')) { sObj.pnt_c = cText; sObj.pnt_n = nText; }
                } else {
                    // 표가 떡진 경우 긴급 복구
                    if (clean.startsWith('상황')) sObj.sit_c += clean.replace(/^상황/, '') + '\n';
                    else if (clean.match(/^(작용\s*원리|선택\s*에너지|원리|진단|판단)/)) sObj.pri_c += clean.replace(/^(작용\s*원리|선택\s*에너지|원리|진단|판단)/, '') + '\n';
                    else if (clean.match(/^(생리적\s*상태|결과|처치|이유)/)) sObj.sta_c += clean.replace(/^(생리적\s*상태|결과|처치|이유)/, '') + '\n';
                    else if (clean.match(/^학습\s*포인트/)) sObj.pnt_c += clean.replace(/^학습\s*포인트/, '') + '\n';
                    else sObj.sit_c += clean + '\n'; // 완전 깨진 경우 지워지지 않도록 최상단에 덤프
                }
            }
            // 4. 다단 비교표
            else if (mode === 'C' && cObj) {
                if (clean.match(/^---|===/)) continue;
                let cols = clean.split(/\t|\|/).map(s=>s.trim()).filter(s=>s);
                if (cols.length >= 2) {
                    if (!cObj.col1Name && !clean.includes('항목')) {
                        for(let i=0; i<cols.length && i<4; i++) cObj[`col${i+1}Name`] = cols[i];
                    } else if (cObj.col1Name || clean.includes('항목')) {
                        if(clean.includes('항목')) {
                            for(let i=0; i<cols.length && i<4; i++) cObj[`col${i+1}Name`] = cols[i].replace(/비교\s*항목/g, '').trim() || `항목${i+1}`;
                        } else {
                            cObj.rows.push({ col1: cols[0]||'-', col2: cols[1]||'-', col3: cols[2]||'', col4: cols[3]||'' });
                        }
                    }
                } else if (cols.length === 1 && clean.length > 0) {
                    if (!cObj.col1Name) { cObj.col1Name = '항목'; cObj.col2Name = '내용'; }
                    cObj.rows.push({ col1: clean, col2: '-', col3: '', col4: '' });
                }
            }
        }
        
        await flush(); 
        window.hideLoading(); window.closeModal(); 
        if (window.currentSubjectId && typeof window.manageSubject === 'function') window.manageSubject(window.currentSubjectId);
        
        alert(`✨ 스마트 주입 완료!\n✅ 퀴즈/재구성: ${counts.q}건\n✅ 시각맵: ${counts.v}건\n✅ 사례분석: ${counts.s}건\n✅ 비교표: ${counts.c}건\n✅ 일반노트: ${counts.n}건`);

    } catch (err) {
        window.hideLoading(); console.error("파서 에러:", err);
        alert("🚨 오류 발생: " + err.message);
    }
};
