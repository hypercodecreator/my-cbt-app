// =========================================================
// [v17.0.0] app-parser.js: Unstoppable Semantic & Markdown Parser
// (Numbering Agnostic, Markdown Table Support, Indentation Preserved)
// =========================================================

window.showBulkAddModal = function() { 
    const m = document.getElementById('modal-container'); if(!m) return;
    m.innerHTML = `<div class="modal-backdrop" onclick="window.closeModal()"></div>
    <div class="modal" style="max-width:1000px; width:95%; background:#fff; border-radius:20px; padding:35px; box-shadow:0 10px 40px rgba(0,0,0,0.15); position:relative; z-index:100000;">
        <div style="text-align:center; margin-bottom:20px;">
            <h2 style="color:#4f46e5; margin-bottom:10px; font-size:1.8em;">🤖 7단계 프로토콜 스마트 주입</h2>
            <p style="color:#64748b; margin-bottom:10px;">AI에서 작성한 데이터를 복사+붙여넣기 하세요. 번호가 틀려도 핵심 키워드를 감지해 자동으로 분류합니다.</p>
            <p style="color:#ef4444; font-size:0.95em; font-weight:bold; background:#fee2e2; padding:10px; border-radius:8px;">🚨 꿀팁: 사례 분석과 비교표가 깨지지 않으려면, AI에게 <b>"표는 반드시 | (파이프) 기호로 구분되는 마크다운 형식으로 출력해줘"</b>라고 요청하세요!</p>
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
        
        // 🚨 떡진 텍스트를 찢어내는 초강력 줄바꿈 주입기 (번호 무시)
        input = input.replace(/([^\n])([\[(]?\d+[\])]?\.?\s*(정답\s*및\s*핵심\s*리마인드|핵심\s*리마인드|실전\s*대비|지식\s*재구성|시각적\s*구조화|사례\s*분석|다단\s*비교표|학습\s*데이터))/g, '$1\n$2');
        input = input.replace(/([^\n])([\[(]?\d+[\])]?\.?\s*(문제\s*유형|질문\s*내용|정답|선택지|1줄\s*해설|해설\s*요약|상세\s*해설|목차\s*정보))/g, '$1\n$2');
        input = input.replace(/([^\n])(암기\s*코드|해석\s*및\s*풀이|지식\s*연결망|도식\s*및\s*핵심\s*공식|도식\s*및\s*핵심\s*원리|키워드|태그)/g, '$1\n$2');
        input = input.replace(/([^\n])(작용\s*원리|작동|원리|진단|선택\s*에너지|생리적\s*상태|상태|결과|처치|이유|학습\s*포인트)/g, '$1\n$2');

        const lines = input.split('\n').filter(l => l.trim() !== '');
        
        let counts = {q:0, c:0, n:0, v:0, s:0};
        let qObj = null, cObj = null, nObj = null, vObj = null, sObj = null;
        let mode = '', field = '', buffer = [];

        // 원본 문장에서 키워드 뒷부분만 깔끔하게 도려내는 함수
        const getAfter = (str, kw) => {
            const regex = new RegExp(kw + '[\\s\\:\\-]*', 'i');
            const match = str.match(regex);
            if (match) return str.substring(match.index + match[0].length).trim();
            return '';
        };

        const saveField = () => {
            if (!mode || !field) return;
            let val = buffer.join('\n').trim();
            
            // 없음, 공백 완벽 처리
            if (['없음', '공백', '-', '해당없음'].includes(val.replace(/\s+/g, ''))) val = ''; 

            if (mode === 'Q' && qObj) {
                const map = { type: 'negativeType', text: 'text', ans: 'answer', short: 'shortExplanation', exp: 'explanation', mne: 'mnemonic', mneD: 'mnemonicDesc', knR: 'knowledgeNetwork', diag: 'diagramFormula', kw: 'keywords', tg: 'tags' };
                if (map[field]) { 
                    if(field === 'kw' || field === 'tg') {
                        qObj[map[field]] = val ? val.replace(/#/g,'').split(/[,|/]+|\s+/).map(s=>s.trim()).filter(Boolean) : [];
                    } else {
                        qObj[map[field]] = val; 
                    }
                }
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

        // 🚨 줄 단위 의미론적 파싱 시작
        for (let line of lines) {
            // 앞의 숫자(4. 5.)나 띄어쓰기를 싹 다 잘라내서 키워드 원형만 추출
            let rawStr = line.replace(/^[\s\-•\d\.\[\]]+/, ''); 
            let checkStr = rawStr.replace(/\s+/g, ''); 

            // 1. 7대 분류 트리거
            if (checkStr.startsWith('정답및핵심') || checkStr.startsWith('핵심리마인드')) { await flush(); mode='N'; nObj={category:'미분류', title:'핵심 리마인드', content:''}; field='content'; buffer=[getAfter(line, '리마인드')]; continue; }
            else if (checkStr.startsWith('실전대비') || checkStr.startsWith('퀴즈정리')) { await flush(); mode='Q'; qObj={negativeType:'', text:'', answer:'', shortExplanation:'', explanation:'', mnemonic:'', mnemonicDesc:'', knowledgeNetwork:'', diagramFormula:'', options:[], optionImages:['','','','',''], images:[], pathLevels:[], keywords:[], tags:[], bookmarked:false}; field=''; continue; }
            else if (checkStr.startsWith('지식재구성')) { mode='Q'; continue; } 
            else if (checkStr.startsWith('시각적구조화') || checkStr.startsWith('마인드맵') || checkStr.startsWith('밴다이어그램')) { await flush(); mode='V'; vObj={category:'미분류', title:'시각적 구조화', content:''}; field='content'; continue; }
            else if (checkStr.startsWith('사례분석') || checkStr.startsWith('비-사례')) { await flush(); mode='S'; sObj={title:'사례 분석', category:'미분류', sit_c:'', sit_n:'', pri_c:'', pri_n:'', sta_c:'', sta_n:'', pnt_c:'', pnt_n:''}; continue; }
            else if (checkStr.startsWith('다단비교') || checkStr.startsWith('비교표')) { await flush(); mode='C'; cObj={title:'다단 비교표', col1Name:'', col2Name:'', col3Name:'', col4Name:'', rows:[]}; continue; }
            else if (checkStr.startsWith('학습데이터') || checkStr.startsWith('프로토콜')) { await flush(); mode='N'; nObj={category:'미분류', title:'학습 데이터 프로토콜', content:''}; field='content'; continue; }

            // 2. 세부 속성 트리거
            if (mode === 'Q') {
                if (checkStr.startsWith('문제유형')) { saveField(); field='type'; buffer=[getAfter(line, '유형')]; }
                else if (checkStr.startsWith('질문내용')) { saveField(); field='text'; buffer=[getAfter(line, '내용')]; }
                else if (checkStr.startsWith('정답') && !checkStr.startsWith('정답및')) { saveField(); field='ans'; buffer=[getAfter(line, '정답')]; }
                else if (checkStr.startsWith('선택지')) { saveField(); field='options'; buffer=[getAfter(line, '선택지')]; }
                else if (checkStr.startsWith('1줄해설') || checkStr.startsWith('해설요약')) { saveField(); field='short'; buffer=[getAfter(line, '해설')||getAfter(line, '요약')]; }
                else if (checkStr.startsWith('상세해설')) { saveField(); field='exp'; buffer=[getAfter(line, '해설')]; }
                else if (checkStr.startsWith('목차정보')) { saveField(); field='path'; buffer=[getAfter(line, '정보')||getAfter(line, '목차')]; }
                else if (checkStr.startsWith('암기코드')) { saveField(); field='mne'; buffer=[getAfter(line, '코드')]; }
                else if (checkStr.startsWith('해석및풀이') || checkStr.startsWith('해석및')) { saveField(); field='mneD'; buffer=[getAfter(line, '풀이')]; }
                else if (checkStr.startsWith('지식연결망')) { saveField(); field='knR'; buffer=[getAfter(line, '연결망')]; }
                else if (checkStr.startsWith('도식및') || checkStr.startsWith('핵심공식') || checkStr.startsWith('핵심원리')) { saveField(); field='diag'; buffer=[getAfter(line, '원리') || getAfter(line, '공식')]; }
                else if (checkStr.startsWith('키워드')) { saveField(); field='kw'; buffer=[getAfter(line, '키워드')]; }
                else if (checkStr.startsWith('태그')) { saveField(); field='tg'; buffer=[getAfter(line, '태그')]; }
                else { buffer.push(line.replace(/^\s{0,2}/, '')); } // 원본 들여쓰기 훼손 방지
            }
            else if (mode === 'N' || mode === 'V') {
                // 시각적 구조화 가독성을 위해 들여쓰기(스페이스)를 최대한 유지합니다.
                buffer.push(line);
            }
            // 3. 사례 분석 파싱 (마크다운 완벽 지원)
            else if (mode === 'S' && sObj) {
                if (checkStr.startsWith('구분사례') || checkStr.startsWith('구분|구체적') || checkStr.startsWith('---|---')) continue;
                let p = line.split(/\t|\|/).map(s=>s.trim()).filter(Boolean);
                if (p.length >= 2) {
                    let kCheck = p[0].replace(/\s+/g, '');
                    let cText = p[1]; let nText = p[2] || '';
                    if (['없음', '공백', '-', '해당없음'].includes(cText.replace(/\s+/g, ''))) cText = '';
                    if (['없음', '공백', '-', '해당없음'].includes(nText.replace(/\s+/g, ''))) nText = '';
                    
                    if (kCheck.includes('상황')) { sObj.sit_c = cText; sObj.sit_n = nText; }
                    else if (kCheck.includes('원리') || kCheck.includes('진단') || kCheck.includes('작동') || kCheck.includes('선택에너지')) { sObj.pri_c = cText; sObj.pri_n = nText; }
                    else if (kCheck.includes('상태') || kCheck.includes('처치') || kCheck.includes('결과') || kCheck.includes('이유')) { sObj.sta_c = cText; sObj.sta_n = nText; }
                    else if (kCheck.includes('포인트')) { sObj.pnt_c = cText; sObj.pnt_n = nText; }
                } else {
                    if (checkStr.startsWith('상황')) sObj.sit_c += line.replace(/^.*?상황[:\s]*/, '') + '\n';
                    else if (checkStr.startsWith('작동') || checkStr.startsWith('작용원리') || checkStr.startsWith('원리') || checkStr.startsWith('진단') || checkStr.startsWith('선택에너지')) sObj.pri_c += line.replace(/^.*?(작동|작용\s*원리|원리|진단|선택\s*에너지)[:\s]*/, '') + '\n';
                    else if (checkStr.startsWith('결과') || checkStr.startsWith('생리적상태') || checkStr.startsWith('상태') || checkStr.startsWith('처치') || checkStr.startsWith('이유')) sObj.sta_c += line.replace(/^.*?(결과|생리적\s*상태|상태|처치|이유)[:\s]*/, '') + '\n';
                    else if (checkStr.startsWith('학습포인트') || checkStr.startsWith('포인트')) sObj.pnt_c += line.replace(/^.*?(학습\s*포인트|포인트)[:\s]*/, '') + '\n';
                    else sObj.sit_c += line + '\n'; 
                }
            }
            // 4. 비교표 파싱 (마크다운 완벽 지원)
            else if (mode === 'C' && cObj) {
                if (checkStr.startsWith('---') || checkStr.startsWith('===')) continue;
                let cols = line.split(/\t|\|/).map(s=>s.trim()).filter(Boolean);
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
                } else if (cols.length === 1 && line.trim().length > 0) {
                    if (!cObj.col1Name) { cObj.col1Name = '항목'; cObj.col2Name = '내용'; }
                    cObj.rows.push({ col1: line.trim(), col2: '-', col3: '', col4: '' }); 
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
