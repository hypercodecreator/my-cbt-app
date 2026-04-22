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
            <p style="color:#ef4444; font-size:0.95em; font-weight:bold; background:#fee2e2; padding:10px; border-radius:8px;">🚨 꿀팁: 사례 분석이나 비교표 표가 제대로 안 쪼개진다면, AI에게 "표는 반드시 | 기호로 구분되는 마크다운 표 형식으로 출력해줘"라고 요청한 뒤 붙여넣으세요!</p>
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
        const lines = input.split('\n').map(l => l.trim());
        
        let counts = {q:0, c:0, n:0, v:0, s:0};
        let qObj = null, cObj = null, nObj = null, vObj = null, sObj = null;
        let mode = '', field = '', buffer = [];

        // 콜론(:) 뒤의 내용만 영리하게 뽑아내는 함수
        const getAfter = (str) => {
            const idx = str.indexOf(':');
            if (idx !== -1) return str.substring(idx + 1).trim();
            return '';
        };

        const saveField = () => {
            if (!mode || !field) return;
            let val = buffer.join('\n').trim();
            // 공백 강제 처리
            if (val === '없음' || val === '공백' || val === '-' || val === '해당 없음') val = ''; 

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
            // 앞에 붙은 숫자, 대괄호, 점, 띄어쓰기를 전부 박살내서 핵심 단어만 남김
            let clean = line.replace(/^[\s\-•\d\.\[\]]+/, '').trim(); 
            if(!clean) continue;

            // 1. 대분류 트리거 (번호가 [1]이든 1.이든 상관없이 단어로 인식)
            if (clean.match(/^정답\s*및\s*핵심\s*리마인드|^핵심\s*리마인드/)) { await flush(); mode='N'; nObj={category:'미분류', title:'핵심 리마인드', content:''}; field='content'; buffer=[getAfter(line)]; continue; }
            if (clean.match(/^실전\s*대비|^퀴즈\s*정리/)) { await flush(); mode='Q'; qObj={negativeType:'', text:'', answer:'', shortExplanation:'', explanation:'', mnemonic:'', mnemonicDesc:'', knowledgeNetwork:'', diagramFormula:'', options:[], optionImages:['','','','',''], images:[], pathLevels:[], keywords:[], tags:[], bookmarked:false}; field=''; continue; }
            if (clean.match(/^지식\s*재구성/)) { mode='Q'; continue; } // Q 모드 그대로 유지
            if (clean.match(/^시각적\s*구조화/)) { await flush(); mode='V'; vObj={category:'미분류', title:'시각적 구조화', content:''}; field='content'; continue; }
            if (clean.match(/^사례\s*분석/)) { await flush(); mode='S'; sObj={title:'사례 분석', category:'미분류', sit_c:'', sit_n:'', pri_c:'', pri_n:'', sta_c:'', sta_n:'', pnt_c:'', pnt_n:''}; continue; }
            if (clean.match(/^다단\s*비교표/)) { await flush(); mode='C'; cObj={title:'다단 비교표', col1Name:'', col2Name:'', col3Name:'', col4Name:'', rows:[]}; continue; }
            if (clean.match(/^학습\s*데이터\s*프로토콜/)) { await flush(); mode='N'; nObj={category:'미분류', title:'학습 데이터 프로토콜', content:''}; field='content'; continue; }

            // 2. 세부 속성 트리거
            if (mode === 'Q') {
                if (clean.match(/^문제\s*유형/)) { saveField(); field='type'; buffer=[getAfter(line)]; }
                else if (clean.match(/^질문\s*내용/)) { saveField(); field='text'; buffer=[getAfter(line)]; }
                else if (clean.match(/^정답/) && !clean.match(/리마인드/)) { saveField(); field='ans'; buffer=[getAfter(line)]; }
                else if (clean.match(/^선택지/)) { saveField(); field='options'; buffer=[getAfter(line)]; }
                else if (clean.match(/^1줄\s*해설|^해설\s*요약/)) { saveField(); field='short'; buffer=[getAfter(line)]; }
                else if (clean.match(/^상세\s*해설/)) { saveField(); field='exp'; buffer=[getAfter(line)]; }
                else if (clean.match(/^목차\s*정보/)) { saveField(); field='path'; buffer=[getAfter(line)]; }
                else if (clean.match(/^암기\s*코드/)) { saveField(); field='mne'; buffer=[getAfter(line)]; }
                else if (clean.match(/^해석\s*및\s*풀이/)) { saveField(); field='mneD'; buffer=[getAfter(line)]; }
                else if (clean.match(/^지식\s*연결망/)) { saveField(); field='knR'; buffer=[getAfter(line)]; }
                else if (clean.match(/^도식/)) { saveField(); field='diag'; buffer=[getAfter(line)]; }
                else { buffer.push(line.trim()); } // 원본 문장을 유지하며 버퍼에 넣음
            }
            else if (mode === 'N' || mode === 'V') {
                buffer.push(line.trim());
            }
            // 3. 사례 분석 표 쪼개기 (마크다운 파이프 | 와 탭 완벽 지원)
            else if (mode === 'S' && sObj) {
                if (clean.match(/^구분|사례|---|비사례/)) continue;
                let p = line.split(/\t|\|/).map(s=>s.trim()).filter(s=>s);
                if (p.length >= 2) {
                    let key = p[0].replace(/^[:\-•\d\.\[\]\s]+/, '');
                    let cText = p[1]; let nText = p[2] || '';
                    if (cText === '없음' || cText === '공백' || cText === '-') cText = '';
                    if (nText === '없음' || nText === '공백' || nText === '-') nText = '';
                    
                    if (key.match(/상황/)) { sObj.sit_c = cText; sObj.sit_n = nText; }
                    else if (key.match(/원리|진단|판단/)) { sObj.pri_c = cText; sObj.pri_n = nText; }
                    else if (key.match(/상태|처치/)) { sObj.sta_c = cText; sObj.sta_n = nText; }
                    else if (key.match(/포인트/)) { sObj.pnt_c = cText; sObj.pnt_n = nText; }
                } else {
                    // 표가 다 깨져서 텍스트로 합쳐졌을 때의 긴급 복구 로직
                    if (clean.match(/^상황/)) sObj.sit_c += clean.replace(/^상황[:\s]*/, '');
                    else if (clean.match(/^작용\s*원리|^원리|^진단/)) sObj.pri_c += clean.replace(/^(작용\s*원리|원리|진단)[:\s]*/, '');
                    else if (clean.match(/^생리적\s*상태|^상태|^처치/)) sObj.sta_c += clean.replace(/^(생리적\s*상태|상태|처치)[:\s]*/, '');
                    else if (clean.match(/^학습\s*포인트|^포인트/)) sObj.pnt_c += clean.replace(/^(학습\s*포인트|포인트)[:\s]*/, '');
                }
            }
            // 4. 다단 비교표 쪼개기
            else if (mode === 'C' && cObj) {
                if (clean.match(/^---|===/)) continue;
                let cols = line.split(/\t|\|/).map(s=>s.trim()).filter(s=>s);
                if (cols.length >= 2) { 
                    if (!cObj.col1Name && !clean.match(/항목/)) { 
                        for(let i=0; i<cols.length && i<4; i++) cObj[`col${i+1}Name`] = cols[i]; 
                    } 
                    else if (cObj.col1Name || clean.match(/항목/)) {
                        if(clean.match(/항목/)) { 
                            for(let i=0; i<cols.length && i<4; i++) cObj[`col${i+1}Name`] = cols[i].replace(/비교\s*항목/g, '').trim() || `항목${i+1}`; 
                        } 
                        else { 
                            let c1 = cols[0]==='없음'||cols[0]==='공백'?'-':cols[0];
                            let c2 = cols[1]==='없음'||cols[1]==='공백'?'-':cols[1];
                            cObj.rows.push({ col1: c1, col2: c2, col3: cols[2]||'', col4: cols[3]||'' }); 
                        }
                    }
                }
            }
        }
        
        await flush(); 
        window.hideLoading(); 
        window.closeModal(); 
        if (window.currentSubjectId && typeof window.manageSubject === 'function') window.manageSubject(window.currentSubjectId);
        
        // 🚨 추출 성공 개수 팝업 띄우기
        alert(`✨ 스마트 주입 완료!\n✅ 퀴즈(문제): ${counts.q}건\n✅ 노트(리마인드/프로토콜): ${counts.n}건\n✅ 시각맵: ${counts.v}건\n✅ 사례분석: ${counts.s}건\n✅ 비교표: ${counts.c}건`);

    } catch (err) {
        window.hideLoading();
        console.error("스마트 파서 에러:", err);
        alert("🚨 텍스트를 파싱하는 도중 오류가 발생했습니다.\n형식이 너무 많이 깨졌을 수 있습니다.");
    }
};
