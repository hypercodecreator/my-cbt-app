// =========================================================
// [v19.0.0] app-parser.js: Unstoppable State-Machine Parser
// (Line-by-line semantic extraction, Markdown Table Native Support)
// =========================================================

window.showBulkAddModal = function() { 
    const m = document.getElementById('modal-container'); if(!m) return;
    m.innerHTML = `<div class="modal-backdrop" onclick="window.closeModal()"></div>
    <div class="modal" style="max-width:1000px; width:95%; background:#fff; border-radius:20px; padding:35px; box-shadow:0 10px 40px rgba(0,0,0,0.15); position:relative; z-index:100000;">
        <div style="text-align:center; margin-bottom:20px;">
            <h2 style="color:#4f46e5; margin-bottom:10px; font-size:1.8em;">🤖 7단계 프로토콜 스마트 주입</h2>
            <p style="color:#64748b; margin-bottom:10px;">AI에서 작성한 데이터를 한 번에 복사+붙여넣기 하세요.</p>
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
        // 🚨 핵심 리마인드를 저장할 수 있는 퀴즈 객체 초기화
        let qObj = { category:'미분류', negativeType:'1', text:'', answer:'', shortExplanation:'', explanation:'', mnemonic:'', mnemonicDesc:'', knowledgeNetwork:'', diagramFormula:'', options:[], optionImages:['','','','',''], images:[], pathLevels:[], keywords:[], tags:[], bookmarked:false, coreRemind:'' };
        let cObj = null, nObj = null, vObj = null, sObj = null;
        let mode = '', field = '', buffer = [];

        // 원본 문장에서 키워드 뒷부분만 깔끔하게 도려내는 헬퍼 (숫자 1을 절대 파괴하지 않음!)
        const extractAfter = (str, kw) => {
            let idx = str.indexOf(':');
            if (idx !== -1) {
                let left = str.substring(0, idx).replace(/\s+/g, '');
                if (left.includes(kw)) return str.substring(idx + 1).trim();
            }
            let reg = new RegExp(kw + '[\\s\\:\\-]*', 'i');
            let m = str.match(reg);
            if (m) return str.substring(m.index + m[0].length).trim();
            return '';
        };

        const saveField = () => {
            if (!mode || !field) return;
            let val = buffer.join('\n').trim();
            let checkVal = val.replace(/\s+/g, '');
            if (['없음', '공백', '-', '해당없음'].includes(checkVal)) val = ''; 

            if (mode === 'Q') {
                if (field === 'coreRemind') qObj.coreRemind = val;
                else if (field === 'type') qObj.negativeType = val;
                else if (field === 'text') qObj.text = val;
                else if (field === 'ans') qObj.answer = val;
                else if (field === 'options') {
                    if (!val) qObj.options = [];
                    else {
                        let opts = val.split(/(?:\([1-5]\)|[①-⑤]|\d\)\s+|\d\.\s+|^O\s+\(맞다\)|^X\s+\(틀리다\))/gm).map(s=>s.trim()).filter(Boolean);
                        if(opts.length <= 1 && val.includes('\n')) opts = val.split('\n').map(s=>s.trim()).filter(Boolean);
                        qObj.options = opts;
                    }
                }
                else if (field === 'short') qObj.shortExplanation = val;
                else if (field === 'exp') qObj.explanation = val;
                // 🚨 목차 정보 1단계, 2단계를 완벽하게 배열로 쪼갬
                else if (field === 'path') qObj.pathLevels = val ? val.split('\n').map(s => s.replace(/^\d+단계[\s:]*/, '').trim()).filter(Boolean) : [];
                else if (field === 'mne') qObj.mnemonic = val;
                else if (field === 'mneD') qObj.mnemonicDesc = val;
                else if (field === 'knR') qObj.knowledgeNetwork = val;
                else if (field === 'diag') qObj.diagramFormula = val;
                else if (field === 'kw') qObj.keywords = val ? val.replace(/#/g,'').split(/[,|/]+|\s+/).map(s=>s.trim()).filter(Boolean) : [];
                else if (field === 'tg') qObj.tags = val ? val.replace(/#/g,'').split(/[,|/]+|\s+/).map(s=>s.trim()).filter(Boolean) : [];
            } 
            else if (mode === 'N' && nObj) nObj.content = val;
            else if (mode === 'V' && vObj) vObj.content = val;
            buffer = [];
            field = '';
        };

        const flush = async () => {
            saveField(); 
            const ts = firebase.firestore.FieldValue.serverTimestamp();
            if (qObj && (qObj.text || qObj.answer || qObj.options.length > 0 || qObj.coreRemind)) { 
                if(!qObj.text) qObj.text = "질문 내용이 없습니다.";
                if(qObj.answer) qObj.answer = qObj.answer.replace(/^\d+\)\s*/, ''); 
                qObj.updatedAt = ts; qObj.createdAt = ts; 
                await window.db.collection('subjects').doc(window.currentSubjectId).collection('questions').add(qObj); 
                counts.q++; 
                qObj = { category:'미분류', negativeType:'1', text:'', answer:'', shortExplanation:'', explanation:'', mnemonic:'', mnemonicDesc:'', knowledgeNetwork:'', diagramFormula:'', options:[], optionImages:['','','','',''], images:[], pathLevels:[], keywords:[], tags:[], bookmarked:false, coreRemind:'' };
            }
            if (cObj) { 
                if(!cObj.col1Name && cObj.rows.length === 0) cObj.rows.push({col1:'-', col2:'-', col3:'', col4:''});
                cObj.createdAt = ts; cObj.updatedAt = ts; 
                await window.db.collection('subjects').doc(window.currentSubjectId).collection('comparisons').add(cObj); 
                counts.c++; cObj = null; 
            }
            if (nObj && nObj.content) { 
                nObj.createdAt = ts; nObj.updatedAt = ts; 
                await window.db.collection('subjects').doc(window.currentSubjectId).collection('notes').add(nObj); 
                counts.n++; nObj = null; 
            }
            if (vObj && vObj.content) { 
                vObj.createdAt = ts; vObj.updatedAt = ts; 
                await window.db.collection('subjects').doc(window.currentSubjectId).collection('visualMaps').add(vObj); 
                counts.v++; vObj = null; 
            }
            if (sObj && (sObj.sit_c || sObj.pri_c || sObj.sta_c || sObj.pnt_c)) { 
                sObj.createdAt = ts; sObj.updatedAt = ts; 
                await window.db.collection('subjects').doc(window.currentSubjectId).collection('caseStudies').add(sObj); 
                counts.s++; sObj = null; 
            }
        };

        // 🚨 줄 단위 의미론적 파싱 시작
        for (let line of lines) {
            let cleanLine = line.trim();
            if (!cleanLine) continue;

            // 순수 텍스트 비교를 위해 앞의 목차 번호(1. 2.)만 안전하게 제거
            let rawStr = cleanLine.replace(/^[\[(]?\d+[\])]?\.?\s*/, ''); 
            let noSpace = rawStr.replace(/\s+/g, '');

            // 1. 대분류 트리거 (발견 즉시 모드 변경)
            if (noSpace.startsWith('정답및핵심') || noSpace.startsWith('핵심리마인드')) {
                saveField(); mode = 'Q'; field = 'coreRemind'; buffer = [extractAfter(rawStr, '리마인드')]; continue;
            }
            if (noSpace.startsWith('실전대비') || noSpace.startsWith('퀴즈정리') || noSpace.startsWith('지식재구성')) {
                saveField(); mode = 'Q'; field = ''; continue;
            }
            if (noSpace.startsWith('시각적구조화') || noSpace.startsWith('마인드맵') || noSpace.startsWith('밴다이어그램')) {
                saveField(); mode = 'V'; field = 'content'; 
                if(!vObj) vObj = { category:'미분류', title:'시각적 구조화', content:'' }; 
                buffer = [extractAfter(rawStr, '구조화')]; continue;
            }
            if (noSpace.startsWith('사례분석') || noSpace.startsWith('비-사례')) {
                saveField(); mode = 'S'; field = ''; 
                if(!sObj) sObj = { title:'사례 분석', category:'미분류', sit_c:'', sit_n:'', pri_c:'', pri_n:'', sta_c:'', sta_n:'', pnt_c:'', pnt_n:'' }; continue;
            }
            if (noSpace.startsWith('다단비교') || noSpace.startsWith('비교표')) {
                saveField(); mode = 'C'; field = ''; 
                if(!cObj) cObj = { title:'다단 비교표', col1Name:'', col2Name:'', col3Name:'', col4Name:'', rows:[] }; continue;
            }
            if (noSpace.startsWith('학습데이터') || noSpace.startsWith('프로토콜')) {
                saveField(); mode = 'N'; field = 'content'; 
                if(!nObj) nObj = { category:'미분류', title:'학습 데이터 프로토콜', content:'' }; 
                buffer = [extractAfter(rawStr, '프로토콜')]; continue;
            }

            // 2. 세부 속성 트리거
            if (mode === 'Q') {
                if (noSpace.startsWith('문제유형')) { saveField(); field='type'; buffer=[extractAfter(rawStr, '유형')]; }
                else if (noSpace.startsWith('질문내용')) { saveField(); field='text'; buffer=[extractAfter(rawStr, '내용')]; }
                else if (noSpace.startsWith('정답') && !noSpace.startsWith('정답및')) { saveField(); field='ans'; buffer=[extractAfter(rawStr, '정답')]; }
                else if (noSpace.startsWith('선택지')) { saveField(); field='options'; buffer=[extractAfter(rawStr, '선택지')]; }
                else if (noSpace.startsWith('1줄해설') || noSpace.startsWith('해설요약')) { saveField(); field='short'; buffer=[extractAfter(rawStr, '해설')||extractAfter(rawStr, '요약')]; }
                else if (noSpace.startsWith('상세해설')) { saveField(); field='exp'; buffer=[extractAfter(rawStr, '해설')]; }
                else if (noSpace.startsWith('목차정보')) { saveField(); field='path'; buffer=[extractAfter(rawStr, '정보')]; }
                else if (noSpace.startsWith('암기코드')) { saveField(); field='mne'; buffer=[extractAfter(rawStr, '코드')]; }
                else if (noSpace.startsWith('해석및풀이') || noSpace.startsWith('해석및')) { saveField(); field='mneD'; buffer=[extractAfter(rawStr, '풀이')]; }
                else if (noSpace.startsWith('지식연결망')) { saveField(); field='knR'; buffer=[extractAfter(rawStr, '망')]; }
                else if (noSpace.startsWith('도식및') || noSpace.startsWith('핵심공식') || noSpace.startsWith('핵심원리')) { saveField(); field='diag'; buffer=[extractAfter(rawStr, '원리') || extractAfter(rawStr, '공식') || extractAfter(rawStr, '도식')]; }
                else if (noSpace.startsWith('키워드')) { saveField(); field='kw'; buffer=[extractAfter(rawStr, '키워드')]; }
                else if (noSpace.startsWith('태그')) { saveField(); field='tg'; buffer=[extractAfter(rawStr, '태그')]; }
                else { if(field) buffer.push(cleanLine); } // 해당 항목이 아니면 기존 항목의 내용으로 버퍼에 누적 보존
            }
            else if (mode === 'N' || mode === 'V') {
                if(field) buffer.push(cleanLine);
            }
            // 3. 사례 분석 파싱 (유연성 끝판왕 적용)
            else if (mode === 'S' && sObj) {
                if (noSpace.startsWith('구분사례') || noSpace.startsWith('구분|구체적') || noSpace.startsWith('---|---') || noSpace.startsWith('구분|')) continue;
                if (cleanLine.includes('|')) {
                    let p = cleanLine.split('|').map(s=>s.trim()).filter(Boolean);
                    if (p.length >= 2) {
                        let kCheck = p[0].replace(/\s+/g, '').replace(/^[:\-•\d\.\[\]\s]+/, '');
                        let c = p[1]; let n = p[2] || '';
                        if (['없음','공백','-','해당없음'].includes(c.replace(/\s+/g,''))) c = '';
                        if (['없음','공백','-','해당없음'].includes(n.replace(/\s+/g,''))) n = '';
                        
                        if (kCheck.includes('상황')) { sObj.sit_c = c; sObj.sit_n = n; }
                        else if (kCheck.includes('원리')||kCheck.includes('진단')||kCheck.includes('설정')||kCheck.includes('에너지')||kCheck.includes('판단')||kCheck.includes('선택')) { sObj.pri_c = c; sObj.pri_n = n; }
                        else if (kCheck.includes('상태')||kCheck.includes('처치')||kCheck.includes('결과')||kCheck.includes('이유')||kCheck.includes('근거')) { sObj.sta_c = c; sObj.sta_n = n; }
                        else if (kCheck.includes('포인트')) { sObj.pnt_c = c; sObj.pnt_n = n; }
                    }
                } else {
                    if (noSpace.startsWith('상황')) sObj.sit_c += cleanLine.replace(/^.*?상황[:\s]*/, '') + '\n';
                    else if (noSpace.startsWith('작동') || noSpace.startsWith('작용원리') || noSpace.startsWith('원리') || noSpace.startsWith('진단') || noSpace.startsWith('선택에너지')) sObj.pri_c += cleanLine.replace(/^.*?(작동|작용\s*원리|원리|진단|선택\s*에너지)[:\s]*/, '') + '\n';
                    else if (noSpace.startsWith('결과') || noSpace.startsWith('생리적상태') || noSpace.startsWith('상태') || noSpace.startsWith('처치') || noSpace.startsWith('이유') || noSpace.startsWith('판단근거')) sObj.sta_c += cleanLine.replace(/^.*?(결과|생리적\s*상태|상태|처치|이유|판단\s*근거)[:\s]*/, '') + '\n';
                    else if (noSpace.startsWith('학습포인트') || noSpace.startsWith('포인트')) sObj.pnt_c += cleanLine.replace(/^.*?(학습\s*포인트|포인트)[:\s]*/, '') + '\n';
                    else sObj.sit_c += cleanLine + '\n'; 
                }
            }
            // 4. 다단 비교표 파싱 (제목 줄 완벽 자동 인식)
            else if (mode === 'C' && cObj) {
                if (noSpace.startsWith('---') || noSpace.startsWith('===') || noSpace.startsWith('리듬분류') || noSpace.startsWith('비교항목')) {
                    if (cleanLine.includes('|') && !cObj.col1Name && !noSpace.startsWith('---')) {
                        let cols = cleanLine.split('|').map(s=>s.trim()).filter(Boolean);
                        for(let i=0; i<cols.length && i<4; i++) cObj[`col${i+1}Name`] = cols[i];
                    }
                    continue;
                }
                if (cleanLine.includes('|')) {
                    let cols = cleanLine.split('|').map(s=>s.trim()).filter(Boolean);
                    if (cols.length >= 2) { 
                        if (!cObj.col1Name) { 
                            for(let i=0; i<cols.length && i<4; i++) cObj[`col${i+1}Name`] = cols[i]; 
                        } else { 
                            let c1 = ['없음','공백','-'].includes(cols[0].replace(/\s+/g,'')) ? '-' : cols[0];
                            let c2 = ['없음','공백','-'].includes(cols[1].replace(/\s+/g,'')) ? '-' : cols[1];
                            cObj.rows.push({ col1: c1, col2: c2, col3: cols[2]||'', col4: cols[3]||'' }); 
                        }
                    }
                }
            }
        }
        
        await flush(); 
        window.hideLoading(); window.closeModal(); 
        if (window.currentSubjectId && typeof window.manageSubject === 'function') window.manageSubject(window.currentSubjectId);
        
        alert(`✨ 완벽 스마트 주입 성공!\n✅ 퀴즈/재구성(리마인드): ${counts.q}건\n✅ 시각맵: ${counts.v}건\n✅ 사례분석: ${counts.s}건\n✅ 비교표: ${counts.c}건\n✅ 일반노트: ${counts.n}건`);

    } catch (err) {
        window.hideLoading(); console.error("파서 에러:", err);
        alert("🚨 오류 발생: " + err.message);
    }
};
