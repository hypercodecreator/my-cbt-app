// =========================================================
// [v12.0.0] app-parser.js: Unstoppable Semantic Parser
// (Numbering Agnostic, Keyword-based Semantic Extraction)
// =========================================================

window.showBulkAddModal = function() { 
    const m = document.getElementById('modal-container'); if(!m) return;
    m.innerHTML = `<div class="modal-backdrop" onclick="window.closeModal()"></div>
    <div class="modal" style="max-width:1000px; width:95%; background:#fff; border-radius:20px; padding:35px; box-shadow:0 10px 40px rgba(0,0,0,0.15); position:relative; z-index:100000;">
        <div style="text-align:center; margin-bottom:20px;">
            <h2 style="color:#4f46e5; margin-bottom:10px; font-size:1.8em;">🤖 7단계 프로토콜 스마트 주입</h2>
            <p style="color:#64748b; margin-bottom:10px;">AI나 노션에서 작성한 데이터를 복사+붙여넣기 하세요. 번호나 양식이 조금 틀려도 핵심 키워드를 감지해 자동으로 분류합니다. (빈칸은 자동 공백 처리)</p>
            <p style="color:#ef4444; font-size:0.95em; font-weight:bold; background:#fee2e2; padding:10px; border-radius:8px;">🚨 꿀팁: 사례 분석이나 비교표를 붙여넣었을 때 글자가 다닥다닥 붙어서 깨진다면, AI에게 "표는 반드시 | 기호로 구분되는 마크다운 형식으로 출력해줘"라고 요청한 뒤 붙여넣어 보세요!</p>
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
        
        // 🚨 강제 줄바꿈 주입: 텍스트가 한 줄로 뭉쳐서 들어와도 에러 안 나도록 강제 분해
        input = input
            .replace(/(\[?\d+\]?\.?\s*정답\s*및\s*핵심\s*리마인드)/g, '\n$1')
            .replace(/(\[?\d+\]?\.?\s*실전\s*대비)/g, '\n$1')
            .replace(/(\[?\d+\]?\.?\s*지식\s*재구성)/g, '\n$1')
            .replace(/(\[?\d+\]?\.?\s*시각적\s*구조화)/g, '\n$1')
            .replace(/(\[?\d+\]?\.?\s*사례\s*분석)/g, '\n$1')
            .replace(/(\[?\d+\]?\.?\s*다단\s*비교표)/g, '\n$1')
            .replace(/(\[?\d+\]?\.?\s*학습\s*데이터)/g, '\n$1')
            .replace(/(\[?\d+\]?\.?\s*문제\s*유형)/g, '\n$1')
            .replace(/(\[?\d+\]?\.?\s*질문\s*내용)/g, '\n$1')
            .replace(/(\[?\d+\]?\.?\s*정답)/g, '\n$1')
            .replace(/(\[?\d+\]?\.?\s*선택지)/g, '\n$1')
            .replace(/(\[?\d+\]?\.?\s*1줄\s*해설)/g, '\n$1')
            .replace(/(\[?\d+\]?\.?\s*해설\s*요약)/g, '\n$1')
            .replace(/(\[?\d+\]?\.?\s*상세\s*해설)/g, '\n$1')
            .replace(/(\[?\d+\]?\.?\s*목차\s*정보)/g, '\n$1')
            .replace(/(암기\s*코드:)/g, '\n$1')
            .replace(/(해석\s*및\s*풀이:)/g, '\n$1')
            .replace(/(지식\s*연결망:)/g, '\n$1')
            .replace(/(도식\s*및\s*핵심\s*공식,?\s*원리:)/g, '\n$1');

        const lines = input.split('\n').map(l => l.trim()).filter(Boolean);
        
        let counts = {q:0, c:0, n:0, v:0, s:0};
        let qObj = null, cObj = null, nObj = null, vObj = null, sObj = null;
        let mode = '', field = '', buffer = [];

        // 콜론(:) 뒤의 내용만 영리하게 뽑아내는 헬퍼
        const getAfter = (str, kw) => {
            const idx = str.indexOf(':');
            if (idx !== -1 && str.substring(0, idx).replace(/\s+/g,'').includes(kw)) return str.substring(idx + 1).trim();
            const regex = new RegExp(`.*${kw}[\\s\\:\\-]*`, 'i');
            return str.replace(regex, '').trim();
        };

        const saveField = () => {
            if (!mode || !field) return;
            let val = buffer.join('\n').trim();
            
            // "없음/공백" 등을 진짜 빈칸으로 깔끔하게 처리
            let checkVal = val.replace(/\s+/g, '');
            if (['없음', '공백', '-', '해당없음'].includes(checkVal)) val = ''; 

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

        const flush = async () => {
            saveField(); const ts = firebase.firestore.FieldValue.serverTimestamp();
            if (qObj) { 
                if(!qObj.text) qObj.text = "질문 내용이 없습니다.";
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

        // 🚨 줄 단위 의미론적 파싱 시작
        for (let line of lines) {
            let cleanLine = line.trim();
            // 띄어쓰기를 모두 없애서 키워드 인식률 100% 보장
            let checkStr = cleanLine.replace(/\s+/g, ''); 

            // 1. 대분류 트리거 (번호 무시, 키워드만 감지)
            if (checkStr.includes('정답및핵심') || checkStr.includes('핵심리마인드')) { await flush(); mode='N'; nObj={category:'미분류', title:'핵심 리마인드', content:''}; field='content'; buffer=[getAfter(cleanLine, '리마인드')]; continue; }
            else if (checkStr.includes('실전대비') || checkStr.includes('퀴즈정리')) { await flush(); mode='Q'; qObj={negativeType:'', text:'', answer:'', shortExplanation:'', explanation:'', mnemonic:'', mnemonicDesc:'', knowledgeNetwork:'', diagramFormula:'', options:[], optionImages:['','','','',''], images:[], pathLevels:[], keywords:[], tags:[], bookmarked:false}; field=''; continue; }
            else if (checkStr.includes('지식재구성')) { mode='Q'; continue; } 
            else if (checkStr.includes('시각적구조화') || checkStr.includes('마인드맵') || checkStr.includes('밴다이어그램')) { await flush(); mode='V'; vObj={category:'미분류', title:'시각적 구조화', content:''}; field='content'; continue; }
            else if (checkStr.includes('사례분석') || checkStr.includes('비-사례')) { await flush(); mode='S'; sObj={title:'사례 분석', category:'미분류', sit_c:'', sit_n:'', pri_c:'', pri_n:'', sta_c:'', sta_n:'', pnt_c:'', pnt_n:''}; continue; }
            else if (checkStr.includes('다단비교') || checkStr.includes('비교표')) { await flush(); mode='C'; cObj={title:'다단 비교표', col1Name:'', col2Name:'', col3Name:'', col4Name:'', rows:[]}; continue; }
            else if (checkStr.includes('학습데이터') || checkStr.includes('프로토콜')) { await flush(); mode='N'; nObj={category:'미분류', title:'학습 데이터 프로토콜', content:''}; field='content'; continue; }

            // 2. 세부 속성 트리거
            if (mode === 'Q') {
                if (checkStr.includes('문제유형')) { saveField(); field='type'; buffer=[getAfter(cleanLine, '유형')]; }
                else if (checkStr.includes('질문내용')) { saveField(); field='text'; buffer=[getAfter(cleanLine, '내용')]; }
                else if (checkStr.includes('정답') && !checkStr.includes('진위형') && !checkStr.includes('정답및')) { saveField(); field='ans'; buffer=[getAfter(cleanLine, '정답')]; }
                else if (checkStr.includes('선택지')) { saveField(); field='options'; buffer=[getAfter(cleanLine, '선택지')]; }
                else if (checkStr.includes('1줄해설') || checkStr.includes('해설요약')) { saveField(); field='short'; buffer=[getAfter(cleanLine, '해설')||getAfter(cleanLine, '요약')]; }
                else if (checkStr.includes('상세해설')) { saveField(); field='exp'; buffer=[getAfter(cleanLine, '해설')]; }
                else if (checkStr.includes('목차정보')) { saveField(); field='path'; buffer=[getAfter(cleanLine, '정보')]; }
                else if (checkStr.includes('암기코드')) { saveField(); field='mne'; buffer=[getAfter(cleanLine, '코드')]; }
                else if (checkStr.includes('해석및풀이')) { saveField(); field='mneD'; buffer=[getAfter(cleanLine, '풀이')]; }
                else if (checkStr.includes('지식연결망')) { saveField(); field='knR'; buffer=[getAfter(cleanLine, '연결망')]; }
                else if (checkStr.includes('도식및') || checkStr.includes('핵심공식') || checkStr.includes('핵심원리')) { saveField(); field='diag'; buffer=[getAfter(cleanLine, '원리') || getAfter(cleanLine, '공식')]; }
                else { buffer.push(cleanLine); } 
            }
            else if (mode === 'N' || mode === 'V') {
                buffer.push(cleanLine);
            }
            // 3. 사례 분석 파싱 (표가 깨져서 들어와도 텍스트로 강제 저장)
            else if (mode === 'S' && sObj) {
                if (checkStr.includes('구분사례') || checkStr.includes('구분구체적')) continue;
                let p = cleanLine.split(/\t|\|/).map(s=>s.trim()).filter(s=>s);
                if (p.length >= 2) {
                    let key = p[0].replace(/^[:\-•\d\.\[\]\s]+/, '');
                    let cText = p[1]; let nText = p[2] || '';
                    if (['없음', '공백', '-', '해당없음'].includes(cText.replace(/\s+/g, ''))) cText = '';
                    if (['없음', '공백', '-', '해당없음'].includes(nText.replace(/\s+/g, ''))) nText = '';
                    
                    let kCheck = key.replace(/\s+/g, '');
                    if (kCheck.includes('상황')) { sObj.sit_c = cText; sObj.sit_n = nText; }
                    else if (kCheck.includes('원리') || kCheck.includes('진단') || kCheck.includes('판단')) { sObj.pri_c = cText; sObj.pri_n = nText; }
                    else if (kCheck.includes('상태') || kCheck.includes('처치')) { sObj.sta_c = cText; sObj.sta_n = nText; }
                    else if (kCheck.includes('포인트')) { sObj.pnt_c = cText; sObj.pnt_n = nText; }
                } else {
                    if (checkStr.includes('상황')) sObj.sit_c += cleanLine.replace(/^.*?상황[:\s]*/, '');
                    else if (checkStr.includes('작용원리') || checkStr.includes('원리') || checkStr.includes('진단')) sObj.pri_c += cleanLine.replace(/^.*?(작용원리|원리|진단)[:\s]*/, '');
                    else if (checkStr.includes('생리적상태') || checkStr.includes('상태') || checkStr.includes('처치')) sObj.sta_c += cleanLine.replace(/^.*?(생리적상태|상태|처치)[:\s]*/, '');
                    else if (checkStr.includes('학습포인트') || checkStr.includes('포인트')) sObj.pnt_c += cleanLine.replace(/^.*?(학습포인트|포인트)[:\s]*/, '');
                }
            }
            // 4. 비교표 파싱
            else if (mode === 'C' && cObj) {
                if (checkStr.includes('---') || checkStr.includes('===')) continue;
                let cols = cleanLine.split(/\t|\|/).map(s=>s.trim()).filter(s=>s);
                if (cols.length >= 2) { 
                    if (!cObj.col1Name && !checkStr.includes('항목')) { 
                        for(let i=0; i<cols.length && i<4; i++) cObj[`col${i+1}Name`] = cols[i]; 
                    } 
                    else if (cObj.col1Name || checkStr.includes('항목')) {
                        if(checkStr.includes('항목')) { 
                            for(let i=0; i<cols.length && i<4; i++) cObj[`col${i+1}Name`] = cols[i].replace(/비교\s*항목/g, '').trim() || `항목${i+1}`; 
                        } 
                        else { 
                            let c1 = ['없음','공백','-'].includes(cols[0].replace(/\s+/g,'')) ? '-' : cols[0];
                            let c2 = ['없음','공백','-'].includes(cols[1].replace(/\s+/g,'')) ? '-' : cols[1];
                            cObj.rows.push({ col1: c1, col2: c2, col3: cols[2]||'', col4: cols[3]||'' }); 
                        }
                    }
                } else if (cols.length === 1) {
                    cObj.rows.push({ col1: cols[0], col2: '-', col3: '', col4: '' }); 
                }
            }
        }
        
        await flush(); 
        window.hideLoading(); window.closeModal(); 
        if (window.currentSubjectId && typeof window.manageSubject === 'function') window.manageSubject(window.currentSubjectId);
        
        // 🚨 추출 성공 팝업창
        alert(`✨ 스마트 주입 완료!\n✅ 퀴즈/재구성: ${counts.q}건\n✅ 시각맵: ${counts.v}건\n✅ 사례분석: ${counts.s}건\n✅ 비교표: ${counts.c}건\n✅ 일반노트: ${counts.n}건`);

    } catch (err) {
        window.hideLoading(); console.error("파서 에러:", err);
        alert("🚨 오류 발생: " + err.message);
    }
};
