// =========================================================
// [v20.0.0] app-parser.js: The Ultimate Semantic State-Machine
// (Indestructible Keyword Matching, Markdown Table Auto-Header)
// =========================================================

window.showBulkAddModal = function() { 
    const m = document.getElementById('modal-container'); if(!m) return;
    m.innerHTML = `<div class="modal-backdrop" onclick="window.closeModal()"></div>
    <div class="modal" style="max-width:1000px; width:95%; background:#fff; border-radius:20px; padding:35px; box-shadow:0 10px 40px rgba(0,0,0,0.15); position:relative; z-index:100000;">
        <div style="text-align:center; margin-bottom:20px;">
            <h2 style="color:#4f46e5; margin-bottom:10px; font-size:1.8em;">🤖 7단계 프로토콜 스마트 주입</h2>
            <p style="color:#64748b; margin-bottom:10px;">AI에서 작성한 데이터를 한 번에 복사+붙여넣기 하세요. 번호가 틀려도 핵심 키워드를 감지해 자동으로 분류합니다.</p>
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
        const lines = input.split('\n').filter(l => l.trim() !== '');
        
        let counts = {q:0, c:0, n:0, v:0, s:0};
        let qObj = { category:'미분류', negativeType:'1', text:'', answer:'', shortExplanation:'', explanation:'', mnemonic:'', mnemonicDesc:'', knowledgeNetwork:'', diagramFormula:'', options:[], optionImages:['','','','',''], images:[], pathLevels:[], keywords:[], tags:[], bookmarked:false, coreRemind:'' };
        let cObj = null, nObj = null, vObj = null, sObj = null;
        let mode = '', field = '', buffer = [];

        const extractAfter = (str, kw) => {
            let reg = new RegExp(`^.*${kw}[\\s\\:\\-]*`, 'i');
            return str.replace(reg, '').trim();
        };

        const saveField = () => {
            if (!mode || !field) return;
            let val = buffer.join('\n').trim();
            if (['없음', '공백', '-', '해당없음'].includes(val.replace(/\s+/g, ''))) val = ''; 

            if (mode === 'Q') {
                if (field === 'coreRemind') qObj.coreRemind = val;
                else if (field === 'type') {
                    let typeNorm = val.replace(/\s+/g,'');
                    if(typeNorm.includes('빈칸')) qObj.negativeType = '2';
                    else if(typeNorm.includes('주관')) qObj.negativeType = '3';
                    else if(typeNorm.includes('심화')) qObj.negativeType = '4';
                    else qObj.negativeType = '1'; // 진위형, 객관식 등은 모두 기본형(1)으로 처리
                }
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
            buffer = []; field = '';
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

        for (let line of lines) {
            let cleanLine = line.trim();
            // 🚨 핵심 포인트: 띄어쓰기만 제거하고 숫자는 절대 훼손하지 않음 (1줄 해설 보호)
            let noSpace = cleanLine.replace(/\s+/g, '');
            
            // 앞의 기호나 숫자만 살짝 잘라낸 검색용 텍스트
            let stripped = noSpace.replace(/^[\d\.\[\]()]+/, '');

            // 1. 대분류 트리거 (발견 시 저장하고 모드 변경)
            if (stripped.startsWith('정답및핵심') || stripped.startsWith('핵심리마인드')) {
                saveField(); mode = 'Q'; field = 'coreRemind'; buffer = [extractAfter(cleanLine, '리마인드')]; continue;
            }
            if (stripped.startsWith('실전대비') || stripped.startsWith('퀴즈정리') || stripped.startsWith('지식재구성')) {
                saveField(); mode = 'Q'; field = ''; continue;
            }
            if (stripped.startsWith('시각적구조화') || stripped.startsWith('마인드맵') || stripped.startsWith('밴다이어그램')) {
                saveField(); mode = 'V'; field = 'content'; 
                if(!vObj) vObj = { category:'미분류', title:'시각적 구조화', content:'' }; 
                buffer = [extractAfter(cleanLine, '구조화')]; continue;
            }
            if (stripped.startsWith('사례분석') || stripped.startsWith('비-사례') || stripped.startsWith('비사례')) {
                saveField(); mode = 'S'; field = ''; 
                if(!sObj) sObj = { title:'사례 분석', category:'미분류', sit_c:'', sit_n:'', pri_c:'', pri_n:'', sta_c:'', sta_n:'', pnt_c:'', pnt_n:'' }; continue;
            }
            if (stripped.startsWith('다단비교') || stripped.startsWith('비교표')) {
                saveField(); mode = 'C'; field = ''; 
                if(!cObj) cObj = { title:'다단 비교표', col1Name:'', col2Name:'', col3Name:'', col4Name:'', rows:[] }; continue;
            }
            if (stripped.startsWith('학습데이터') || stripped.startsWith('프로토콜')) {
                saveField(); mode = 'N'; field = 'content'; 
                if(!nObj) nObj = { category:'미분류', title:'학습 데이터 프로토콜', content:'' }; 
                buffer = [extractAfter(cleanLine, '프로토콜')]; continue;
            }

            // 2. 세부 속성 트리거
            if (mode === 'Q') {
                if (stripped.startsWith('문제유형')) { saveField(); field='type'; buffer=[extractAfter(cleanLine, '유형')]; }
                else if (stripped.startsWith('질문내용')) { saveField(); field='text'; buffer=[extractAfter(cleanLine, '내용')]; }
                else if (stripped.startsWith('정답') && !stripped.startsWith('정답및')) { saveField(); field='ans'; buffer=[extractAfter(cleanLine, '정답')]; }
                else if (stripped.startsWith('선택지')) { saveField(); field='options'; buffer=[extractAfter(cleanLine, '선택지')]; }
                else if (stripped.startsWith('1줄해설') || stripped.startsWith('해설요약')) { saveField(); field='short'; buffer=[extractAfter(cleanLine, '해설')||extractAfter(cleanLine, '요약')]; }
                else if (stripped.startsWith('상세해설')) { saveField(); field='exp'; buffer=[extractAfter(cleanLine, '해설')]; }
                else if (stripped.startsWith('목차정보')) { saveField(); field='path'; buffer=[extractAfter(cleanLine, '정보')]; }
                else if (stripped.startsWith('암기코드')) { saveField(); field='mne'; buffer=[extractAfter(cleanLine, '코드')]; }
                else if (stripped.startsWith('해석및풀이') || stripped.startsWith('해석및')) { saveField(); field='mneD'; buffer=[extractAfter(cleanLine, '풀이')]; }
                else if (stripped.startsWith('지식연결망')) { saveField(); field='knR'; buffer=[extractAfter(cleanLine, '연결망')]; }
                else if (stripped.startsWith('도식및') || stripped.startsWith('핵심공식') || stripped.startsWith('핵심원리')) { saveField(); field='diag'; buffer=[extractAfter(cleanLine, '원리') || extractAfter(cleanLine, '공식') || extractAfter(cleanLine, '도식')]; }
                else if (stripped.startsWith('키워드')) { saveField(); field='kw'; buffer=[extractAfter(cleanLine, '키워드')]; }
                else if (stripped.startsWith('태그')) { saveField(); field='tg'; buffer=[extractAfter(cleanLine, '태그')]; }
                else { if(field) buffer.push(cleanLine); } // 해당 항목이 아니면 보존
            }
            else if (mode === 'N' || mode === 'V') {
                if(field) buffer.push(cleanLine);
            }
            // 🚨 3. 사례 분석 파싱 (표 제목이 낯설어도 완벽 대응)
            else if (mode === 'S' && sObj) {
                if (noSpace.includes('구분사례') || noSpace.includes('구분|구체적') || noSpace.includes('---|---')) continue;
                if (cleanLine.includes('|')) {
                    let p = cleanLine.split('|').map(s=>s.trim()).filter(Boolean);
                    if (p.length >= 2) {
                        let kCheck = p[0].replace(/\s+/g, '').replace(/^[:\-•\d\.\[\]\s]+/, '');
                        let c = p[1] || ''; let n = p[2] || '';
                        
                        if (kCheck.includes('상황')) { sObj.sit_c = c; sObj.sit_n = n; }
                        else if (kCheck.includes('원리')||kCheck.includes('진단')||kCheck.includes('설정')||kCheck.includes('에너지')||kCheck.includes('판단')||kCheck.includes('선택')) { sObj.pri_c = c; sObj.pri_n = n; }
                        else if (kCheck.includes('상태')||kCheck.includes('처치')||kCheck.includes('결과')||kCheck.includes('이유')||kCheck.includes('근거')) { sObj.sta_c = c; sObj.sta_n = n; }
                        else if (kCheck.includes('포인트')) { sObj.pnt_c = c; sObj.pnt_n = n; }
                    }
                }
            }
            // 🚨 4. 다단 비교표 파싱 (표 제목 줄 자동 감지)
            else if (mode === 'C' && cObj) {
                if (noSpace.includes('---') || noSpace.includes('===') || stripped.startsWith('다단비교')) continue;
                if (cleanLine.includes('|')) {
                    let cols = cleanLine.split('|').map(s=>s.trim()).filter(Boolean);
                    // 제목 줄인지 파악 (아직 헤더가 없고, 내용에 '항목', '분류', '구분' 등이 있으면 헤더로 지정)
                    if (!cObj.col1Name && (noSpace.includes('항목') || noSpace.includes('분류') || noSpace.includes('구분') || noSpace.includes('폭') || noSpace.includes('에너지'))) {
                        for(let i=0; i<cols.length && i<4; i++) cObj[`col${i+1}Name`] = cols[i];
                    } else { 
                        if (!cObj.col1Name) { // 보험용: 제목이 낯설어도 첫 줄이면 무조건 헤더로 지정
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
