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
            <p style="color:#64748b; margin-bottom:20px;">AI나 노션에서 작성한 <b>[1] 핵심리마인드 ~ [7] 학습 데이터 프로토콜</b> 데이터를 그대로 붙여넣으세요.<br>표(사례 분석, 비교표)도 복사+붙여넣기 하시면 탭(Tab)을 인식해 자동으로 표 형태로 쪼개집니다! (없음/공백은 자동 무시)</p>
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

    // 항목 추출 헬퍼 (유연한 콜론 매칭)
    const getAfter = (str, kw) => {
        const idx = str.indexOf(':');
        if(idx !== -1 && str.substring(0, idx).includes(kw)) return str.substring(idx+1).trim();
        const kwIdx = str.indexOf(kw);
        if(kwIdx !== -1) {
            let sub = str.substring(kwIdx + kw.length).trim();
            if(sub.match(/^[:\-=]/)) sub = sub.substring(1).trim();
            return sub;
        }
        return '';
    };

    // 버퍼에 모인 텍스트를 각 필드에 저장 ("없음" 처리 포함)
    const saveField = () => {
        if (!mode || !field) return;
        let val = buffer.join('\n').trim();
        
        // 🚨 "없음", "공백" 처리 (DB에 찌꺼기가 안 남게 청소)
        if (val === '없음' || val === '공백' || val === '-') val = ''; 

        if (mode === 'Q' && qObj) {
            const map = { type: 'negativeType', text: 'text', ans: 'answer', short: 'shortExplanation', exp: 'explanation', mne: 'mnemonic', mneD: 'mnemonicDesc', knR: 'knowledgeNetwork', diag: 'diagramFormula' };
            if (map[field]) { qObj[map[field]] = val; }
            else if (field === 'options') {
                if (!val) qObj.options = [];
                else {
                    let opts = val.split(/(?:\([1-5]\)|[①-⑤]|\d\)\s+|\d\.\s+|^O\s+\(맞다\)|^X\s+\(틀리다\))/gm).map(s => s.trim()).filter(Boolean);
                    if (opts.length <= 1 && val.includes('\n')) opts = val.split('\n').map(s => s.trim()).filter(Boolean);
                    qObj.options = opts;
                }
            }
            else if (field === 'path') { qObj.pathLevels = val ? val.split(/\n|,|단계:/).map(s => s.trim().replace(/^\d+\s*/, '')).filter(Boolean) : []; }
        } 
        else if (mode === 'N' && nObj) { if(val) nObj.content += (nObj.content?'\n':'') + val; }
        else if (mode === 'V' && vObj) { if(val) vObj.content += (vObj.content?'\n':'') + val; }
        buffer = [];
    };

    // 완성된 객체를 파이어베이스에 업로드
    const flush = async () => {
        saveField(); const ts = firebase.firestore.FieldValue.serverTimestamp();
        
        // 1. 문제 (Q) 저장 조건: 질문 내용이 없더라도 정답이나 선택지가 있으면 저장 (안전장치)
        if (qObj && (qObj.text || qObj.answer || qObj.options.length > 0)) { 
            if(!qObj.text) qObj.text = "질문 내용 없음 (스마트 추가됨)";
            if(qObj.answer) qObj.answer = qObj.answer.replace(/^\d+\)\s*/, ''); 
            qObj.updatedAt = ts; qObj.createdAt = ts; 
            await window.db.collection('subjects').doc(window.currentSubjectId).collection('questions').add(qObj); 
            counts.q++; qObj = null; 
        }
        // 2. 다단 비교표 (C)
        if (cObj && (cObj.rows.length > 0 || cObj.col1Name)) { 
            cObj.createdAt = ts; cObj.updatedAt = ts; 
            await window.db.collection('subjects').doc(window.currentSubjectId).collection('comparisons').add(cObj); 
            counts.c++; cObj = null; 
        }
        // 3. 수업 노트 (N)
        if (nObj && nObj.content && nObj.content.trim()) { 
            nObj.createdAt = ts; nObj.updatedAt = ts; 
            await window.db.collection('subjects').doc(window.currentSubjectId).collection('notes').add(nObj); 
            counts.n++; nObj = null; 
        }
        // 4. 시각적 구조화 (V)
        if (vObj && vObj.content && vObj.content.trim()) { 
            vObj.createdAt = ts; vObj.updatedAt = ts; 
            await window.db.collection('subjects').doc(window.currentSubjectId).collection('visualMaps').add(vObj); 
            counts.v++; vObj = null; 
        }
        // 5. 사례 분석 (S)
        if (sObj && (sObj.sit_c || sObj.pri_c || sObj.sta_c || sObj.pnt_c || sObj.sit_n || sObj.pri_n)) { 
            sObj.createdAt = ts; sObj.updatedAt = ts; 
            await window.db.collection('subjects').doc(window.currentSubjectId).collection('caseStudies').add(sObj); 
            counts.s++; sObj = null; 
        }
    };

    // 줄 단위 스마트 파싱 시작
    for (let line of lines) {
        let clean = line.replace(/^[\s\-•]+/, '').trim();
        if(!clean) continue;

        // 🚨 대분류(7단계) 트리거: 번호판 대괄호 [1]~[7] 완벽 인식
        if (clean.includes('[1]') && clean.includes('리마인드')) { await flush(); mode = 'N'; nObj = { category: '미분류', title: '핵심 리마인드', content: '' }; field = 'content'; continue; }
        else if (clean.includes('[2]') && clean.includes('실전대비')) { await flush(); mode = 'Q'; qObj = { options: [], optionImages: ['', '', '', '', ''], images: [], pathLevels: [], keywords: [], tags: [], bookmarked: false }; field = ''; continue; }
        else if (clean.includes('[3]') && clean.includes('재구성')) { mode = 'Q'; continue; } // 모드 유지 (문제에 종속됨)
        else if (clean.includes('[4]') && clean.includes('구조화')) { await flush(); mode = 'V'; vObj = { title: '시각적 구조화', category: '미분류', content: '' }; field = 'content'; continue; }
        else if (clean.includes('[5]') && clean.includes('사례')) { await flush(); mode = 'S'; sObj = { title: '사례 분석', category: '미분류', sit_c:'', sit_n:'', pri_c:'', pri_n:'', sta_c:'', sta_n:'', pnt_c:'', pnt_n:'' }; continue; }
        else if (clean.includes('[6]') && clean.includes('비교표')) { await flush(); mode = 'C'; cObj = { title: '다단 비교표', col1Name: '', col2Name: '', col3Name: '', col4Name: '', rows: [] }; continue; }
        else if (clean.includes('[7]') && clean.includes('프로토콜')) { await flush(); mode = 'N'; nObj = { category: '미분류', title: '학습 데이터 프로토콜', content: '' }; field = 'content'; continue; }

        // 🚨 세부 항목 속성 매칭
        if (mode === 'Q') {
            if (clean.includes('1.') && clean.includes('유형')) { saveField(); field = 'type'; buffer = [getAfter(clean, '유형')]; }
            else if (clean.includes('2.') && clean.includes('질문')) { saveField(); field = 'text'; buffer = [getAfter(clean, '내용')]; }
            else if (clean.includes('3.') && clean.includes('정답')) { saveField(); field = 'ans'; buffer = [getAfter(clean, '정답')]; }
            else if (clean.includes('4.') && clean.includes('선택지')) { saveField(); field = 'options'; buffer = [getAfter(clean, '선택지')]; }
            else if (clean.includes('5.') && (clean.includes('1줄') || clean.includes('해설 요약'))) { saveField(); field = 'short'; buffer = [getAfter(clean, '해설')||getAfter(clean, '1줄')]; }
            else if (clean.includes('6.') && clean.includes('상세')) { saveField(); field = 'exp'; buffer = [getAfter(clean, '해설')||getAfter(clean, '상세')]; }
            else if (clean.includes('7.') && clean.includes('목차')) { saveField(); field = 'path'; buffer = [getAfter(clean, '정보')||getAfter(clean, '목차')]; }
            else if (clean.includes('암기') && clean.includes('코드')) { saveField(); field = 'mne'; buffer = [getAfter(clean, '코드')]; }
            else if (clean.includes('해석') && clean.includes('풀이')) { saveField(); field = 'mneD'; buffer = [getAfter(clean, '풀이')]; }
            else if (clean.includes('지식') && clean.includes('연결망')) { saveField(); field = 'knR'; buffer = [getAfter(clean, '연결망')]; }
            else if (clean.includes('도식') && (clean.includes('공식') || clean.includes('원리'))) { saveField(); field = 'diag'; buffer = [getAfter(clean, '원리')||getAfter(clean, '공식')]; }
            else { buffer.push(clean); } // 해당 안 되면 이전 내용의 연속(줄바꿈)으로 인식
        }
        else if (mode === 'V' || mode === 'N') {
            buffer.push(clean); // 노트류는 그냥 다 집어넣음
        }
        // 🚨 사례 분석 (표 복사 인식 시스템)
        else if (mode === 'S' && sObj) {
            if (clean.includes('구분') && clean.includes('사례')) continue; // 헤더 무시
            
            // 노션이나 엑셀 표를 복사하면 \t(탭)이나 | 로 나뉨
            let p = clean.split(/\t|\|/);
            if (p.length >= 2) {
                let key = p[0].trim(); let cText = p[1].trim(); let nText = (p[2] || '').trim();
                if (cText === '없음' || cText === '공백') cText = '';
                if (nText === '없음' || nText === '공백') nText = '';

                if (key.includes('상황')) { sObj.sit_c = cText; sObj.sit_n = nText; }
                else if (key.includes('원리') || key.includes('진단')) { sObj.pri_c = cText; sObj.pri_n = nText; }
                else if (key.includes('상태') || key.includes('처치')) { sObj.sta_c = cText; sObj.sta_n = nText; }
                else if (key.includes('포인트')) { sObj.pnt_c = cText; sObj.pnt_n = nText; }
            } else {
                // 표 형태가 아니라 텍스트로 적혔을 때를 위한 보험
                if (clean.includes('상황')) { sObj.sit_c += getAfter(clean, '상황'); }
                else if (clean.includes('원리')) { sObj.pri_c += getAfter(clean, '원리'); }
                else if (clean.includes('상태') || clean.includes('처치')) { sObj.sta_c += getAfter(clean, '상태') || getAfter(clean, '처치'); }
                else if (clean.includes('포인트')) { sObj.pnt_c += getAfter(clean, '포인트'); }
            }
        }
        // 🚨 다단 비교표 (표 복사 인식 시스템)
        else if (mode === 'C' && cObj) {
            let cols = clean.split(/\t|\|/).map(s=>s.trim());
            if (cols.length >= 2 && !clean.match(/^[-|\s]+$/)) { 
                if (!cObj.col1Name && !cols[0].includes('항목')) { 
                    for(let i=0; i<cols.length && i<4; i++) cObj[`col${i+1}Name`] = cols[i]; 
                } 
                else if (cObj.col1Name || cols[0].includes('항목')) {
                    if(cols[0].includes('항목')) { 
                        for(let i=0; i<cols.length && i<4; i++) cObj[`col${i+1}Name`] = cols[i].replace(/비교\s*항목/g, '').trim() || `항목${i+1}`; 
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
