// =========================================================
// [v11.0.0] app-parser.js: Ultimate 7-Step Protocol Parser
// (Tab-separated Table Auto-Split, Missing Item Handling)
// =========================================================

window.showBulkAddModal = function() { 
    const m = document.getElementById('modal-container'); if(!m) return;
    m.innerHTML = `<div class="modal-backdrop" onclick="window.closeModal()"></div>
    <div class="modal" style="max-width:1000px; width:95%; background:#fff; border-radius:20px; padding:35px; box-shadow:0 10px 40px rgba(0,0,0,0.15); position:relative; z-index:100000;">
        <div style="text-align:center; margin-bottom:20px;">
            <h2 style="color:#4f46e5; margin-bottom:10px; font-size:1.8em;">🤖 7단계 프로토콜 스마트 주입</h2>
            <p style="color:#64748b; margin-bottom:20px;">AI나 노션에서 작성한 <b>[1] 핵심리마인드 ~ [7] 학습 데이터 프로토콜</b> 데이터를 그대로 붙여넣으세요.<br>표(사례 분석, 비교표)도 복사+붙여넣기 하시면 탭(Tab)을 인식해 자동으로 표 형태로 쪼개집니다! (빈 항목은 무시됩니다)</p>
        </div>
        <textarea id="bulk-input" style="width:100%; height:400px; padding:20px; border-radius:15px; border:2px solid #e2e8f0; font-family:'Consolas', monospace; line-height:1.6; font-size:1.05em; box-sizing:border-box; background:#f8fafc;" placeholder="[1] 핵심리마인드\n내용...\n\n[2] 실전대비 퀴즈 정리노트\n1. 문제 유형 : ..."></textarea>
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
    
    // 특수 공백 및 별표 마크다운 제거
    input = input.replace(/[\u00A0\u200B-\u200D\uFEFF]/g, ' ').replace(/\*\*/g, '');
    const lines = input.split('\n').map(l => l.trim());
    
    let counts = {q:0, c:0, n:0, v:0, s:0}, qObj = null, cObj = null, nObj = null, vObj = null, sObj = null;
    let mode = '', field = '', buffer = [];

    // 항목 추출 헬퍼 (콜론(:) 뒷부분 가져오기)
    const getAfter = (str, kw) => {
        const idx = str.indexOf(':');
        if(idx !== -1 && str.substring(0, idx).includes(kw)) return str.substring(idx+1).trim();
        return str.replace(new RegExp(`^.*?${kw}\\s*`), '').trim();
    };

    // 버퍼에 모인 텍스트를 각 필드에 저장
    const saveField = () => {
        if (!mode || !field) return;
        const val = buffer.join('\n').trim();
        
        // 값이 없거나 "없음"일 때의 공백 처리
        if (!val || val === '없음' || val === '공백') {
            if (mode === 'Q' && qObj && field === 'options') qObj.options = [];
            buffer = [];
            return;
        }

        if (mode === 'Q' && qObj) {
            const map = { type: 'negativeType', text: 'text', ans: 'answer', short: 'shortExplanation', exp: 'explanation', mne: 'mnemonic', mneD: 'mnemonicDesc', knR: 'knowledgeNetwork', diag: 'diagramFormula' };
            
            if (map[field]) { qObj[map[field]] = val; } 
            else if (field === 'options') {
                let opts = val.split(/(?:\([1-5]\)|[①-⑤]|\d\)\s+|\d\.\s+|^O\s+\(맞다\)|^X\s+\(틀리다\))/gm).map(s => s.trim()).filter(Boolean);
                if (opts.length <= 1 && val.includes('\n')) opts = val.split('\n').map(s => s.trim()).filter(Boolean);
                qObj.options = opts;
            } 
            else if (field === 'path') { qObj.pathLevels = val.split(/\n|,|단계:/).map(s => s.trim().replace(/^\d+\s*/, '')).filter(Boolean); }
        } 
        else if (mode === 'N' && nObj) nObj.content += val + '\n';
        else if (mode === 'V' && vObj) vObj.content += val + '\n';
        
        buffer = [];
    };

    // 완성된 객체를 파이어베이스에 업로드 (플러시)
    const flush = async () => {
        saveField(); const ts = firebase.firestore.FieldValue.serverTimestamp();
        if (qObj && qObj.text) { if(qObj.answer) qObj.answer = qObj.answer.replace(/^\d+\)\s*/, ''); qObj.updatedAt = ts; qObj.createdAt = ts; await window.db.collection('subjects').doc(window.currentSubjectId).collection('questions').add(qObj); counts.q++; qObj = null; }
        if (cObj && cObj.rows && cObj.rows.length > 0) { cObj.createdAt = ts; cObj.updatedAt = ts; await window.db.collection('subjects').doc(window.currentSubjectId).collection('comparisons').add(cObj); counts.c++; cObj = null; }
        if (nObj && nObj.content && nObj.content.trim()) { nObj.createdAt = ts; nObj.updatedAt = ts; await window.db.collection('subjects').doc(window.currentSubjectId).collection('notes').add(nObj); counts.n++; nObj = null; }
        if (vObj && vObj.content && vObj.content.trim()) { vObj.createdAt = ts; vObj.updatedAt = ts; await window.db.collection('subjects').doc(window.currentSubjectId).collection('visualMaps').add(vObj); counts.v++; vObj = null; }
        if (sObj && sObj.title) { sObj.createdAt = ts; sObj.updatedAt = ts; await window.db.collection('subjects').doc(window.currentSubjectId).collection('caseStudies').add(sObj); counts.s++; sObj = null; }
    };

    // 줄 단위 스마트 파싱 시작
    for (let line of lines) {
        let clean = line.replace(/^[\s\-•]+/, '').trim();
        if(!clean) continue;

        // 🚨 7단계 프로토콜 대분류 트리거
        if (clean.match(/^\[1\]\s*핵심\s*리마인드/i)) { await flush(); mode = 'N'; nObj = { category: '미분류', title: '핵심 리마인드', content: '' }; field = 'content'; continue; }
        else if (clean.match(/^\[2\]\s*실전대비/i)) { await flush(); mode = 'Q'; qObj = { options: [], optionImages: ['', '', '', '', ''], images: [], pathLevels: [], keywords: [], tags: [], bookmarked: false }; field = ''; continue; }
        else if (clean.match(/^\[3\]\s*지식\s*재구성/i)) { mode = 'Q'; continue; } // Q모드 유지
        else if (clean.match(/^\[4\]\s*시각적\s*구조화/i)) { await flush(); mode = 'V'; vObj = { title: '시각적 구조화', category: '미분류', content: '' }; field = 'content'; continue; }
        else if (clean.match(/^\[5\]\s*사례\s*분석/i)) { await flush(); mode = 'S'; sObj = { title: '사례 분석', category: '미분류', sit_c:'', sit_n:'', pri_c:'', pri_n:'', sta_c:'', sta_n:'', pnt_c:'', pnt_n:'' }; continue; }
        else if (clean.match(/^\[6\]\s*다단\s*비교표/i)) { await flush(); mode = 'C'; cObj = { title: '다단 비교표', col1Name: '', col2Name: '', col3Name: '', col4Name: '', rows: [] }; continue; }
        else if (clean.match(/^\[7\]\s*학습\s*데이터\s*프로토콜/i)) { await flush(); mode = 'N'; nObj = { category: '미분류', title: '학습 데이터 프로토콜', content: '' }; field = 'content'; continue; }

        // 🚨 [2], [3] 퀴즈 정리노트 세부 항목 매칭
        if (mode === 'Q') {
            if (clean.match(/^1\.\s*문제\s*유형/)) { saveField(); field = 'type'; buffer = [getAfter(clean, '유형')]; }
            else if (clean.match(/^2\.\s*질문\s*내용/)) { saveField(); field = 'text'; buffer = [getAfter(clean, '내용')]; }
            else if (clean.match(/^3\.\s*정답/)) { saveField(); field = 'ans'; buffer = [getAfter(clean, '정답')]; }
            else if (clean.match(/^4\.\s*선택지/)) { saveField(); field = 'options'; buffer = [getAfter(clean, '선택지')]; }
            else if (clean.match(/^5\.\s*1줄\s*해설/)) { saveField(); field = 'short'; buffer = [getAfter(clean, '해설')]; }
            else if (clean.match(/^6\.\s*상세\s*해설/)) { saveField(); field = 'exp'; buffer = [getAfter(clean, '해설')]; }
            else if (clean.match(/^7\.\s*목차\s*정보/)) { saveField(); field = 'path'; buffer = [getAfter(clean, '정보')]; }
            else if (clean.match(/^암기\s*코드/)) { saveField(); field = 'mne'; buffer = [getAfter(clean, '코드')]; }
            else if (clean.match(/^해석\s*및\s*풀이/)) { saveField(); field = 'mneD'; buffer = [getAfter(clean, '풀이')]; }
            else if (clean.match(/^지식\s*연결망/)) { saveField(); field = 'knR'; buffer = [getAfter(clean, '연결망')]; }
            else if (clean.match(/^도식\s*및\s*핵심\s*공식/)) { saveField(); field = 'diag'; buffer = [getAfter(clean, '원리') || getAfter(clean, '공식')]; }
            else { buffer.push(clean); }
        }
        // 🚨 [4], [1], [7] 텍스트 어펜드
        else if (mode === 'V' || mode === 'N') {
            buffer.push(clean);
        }
        // 🚨 [5] 사례 분석 테이블 파싱 (노션/엑셀 탭(\t) 완벽 인식)
        else if (mode === 'S' && sObj) {
            // 헤더 행 무시
            if(clean.match(/^구분/) && clean.match(/사례/)) continue;
            
            // 탭(\t), 파이프(|), 3개 이상의 띄어쓰기로 칸을 쪼갬
            let parts = clean.split(/\t|\|| {3,}/).map(s=>s.trim()).filter(s=>s);
            if (parts.length >= 2) {
                let key = parts[0].replace(/^:/, '').trim();
                let caseText = parts[1] || '';
                let nonCaseText = parts[2] || '';

                if (key.match(/상황/)) { sObj.sit_c = caseText; sObj.sit_n = nonCaseText; }
                else if (key.match(/원리|진단|판단/)) { sObj.pri_c = caseText; sObj.pri_n = nonCaseText; }
                else if (key.match(/상태|처치/)) { sObj.sta_c = caseText; sObj.sta_n = nonCaseText; }
                else if (key.match(/포인트/)) { sObj.pnt_c = caseText; sObj.pnt_n = nonCaseText; }
            } else {
                // 구분자 없이 ':' 콜론으로 붙여넣어졌을 때의 보험 로직
                if (clean.match(/^상황[:\s]/)) { const p = clean.replace(/^상황[:\s]*/, '').split(/\t|\|| {2,}/); sObj.sit_c = p[0]?.trim()||''; sObj.sit_n = p[1]?.trim()||''; }
                else if (clean.match(/^(작용\s*원리|진단|판단)[:\s]/)) { const p = clean.replace(/^(작용\s*원리|진단|판단)[:\s]*/, '').split(/\t|\|| {2,}/); sObj.pri_c = p[0]?.trim()||''; sObj.pri_n = p[1]?.trim()||''; }
                else if (clean.match(/^(생리적\s*상태|처치|즉각\s*처치)[:\s]/)) { const p = clean.replace(/^(생리적\s*상태|처치|즉각\s*처치)[:\s]*/, '').split(/\t|\|| {2,}/); sObj.sta_c = p[0]?.trim()||''; sObj.sta_n = p[1]?.trim()||''; }
                else if (clean.match(/^학습\s*포인트[:\s]/)) { const p = clean.replace(/^학습\s*포인트[:\s]*/, '').split(/\t|\|| {2,}/); sObj.pnt_c = p[0]?.trim()||''; sObj.pnt_n = p[1]?.trim()||''; }
            }
        }
        // 🚨 [6] 다단 비교표 테이블 파싱
        else if (mode === 'C' && cObj) {
            let cols = clean.split(/\t|\|| {3,}/).map(s=>s.trim()).filter(s=>s);
            if (cols.length >= 2 && !clean.match(/^[-|\s]+$/)) { 
                if (!cObj.col1Name && !cols[0].includes('비교 항목')) { 
                    for(let i=0; i<cols.length && i<4; i++) cObj[`col${i+1}Name`] = cols[i]; 
                } 
                else if (cObj.col1Name || cols[0].includes('비교 항목')) {
                    if(cols[0].includes('비교 항목')) { 
                        for(let i=0; i<cols.length && i<4; i++) cObj[`col${i+1}Name`] = cols[i].replace('비교 항목', '').trim() || `항목${i+1}`; 
                    } 
                    else { 
                        cObj.rows.push({ col1: cols[0], col2: cols[1], col3: cols[2]||'', col4: cols[3]||'' }); 
                    }
                }
            }
        }
    }
    
    await flush(); window.hideLoading(); window.closeModal(); 
    if (window.currentSubjectId && typeof window.manageSubject === 'function') window.manageSubject(window.currentSubjectId);
    if(typeof window.showToast === 'function') window.showToast(`✨ 7단계 주입 완료: 문제 ${counts.q}건, 시각맵 ${counts.v}건, 사례 ${counts.s}건, 비교표 ${counts.c}건, 노트 ${counts.n}건`);
};
