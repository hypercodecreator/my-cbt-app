// =========================================================
// [v20.0.0] app-parser.js: AMD Chiplet-Inspired Architecture
// (L1/L2 Index Partitioning, 100% Immune to Formatting Errors)
// =========================================================

window.showBulkAddModal = function() { 
    const m = document.getElementById('modal-container'); if(!m) return;
    m.innerHTML = `<div class="modal-backdrop" onclick="window.closeModal()"></div>
    <div class="modal" style="max-width:1000px; width:95%; background:#fff; border-radius:20px; padding:35px; box-shadow:0 10px 40px rgba(0,0,0,0.15); position:relative; z-index:100000;">
        <div style="text-align:center; margin-bottom:20px;">
            <h2 style="color:#4f46e5; margin-bottom:10px; font-size:1.8em;">🤖 칩렛(Chiplet) 아키텍처 스마트 주입</h2>
            <p style="color:#64748b; margin-bottom:10px;">AI에서 작성한 데이터를 한 번에 복사+붙여넣기 하세요. 번호가 틀려도 칩렛 센서가 좌표를 추적해 완벽하게 도려냅니다.</p>
        </div>
        <textarea id="bulk-input" style="width:100%; height:400px; padding:20px; border-radius:15px; border:2px solid #e2e8f0; font-family:'Consolas', monospace; line-height:1.6; font-size:1.05em; box-sizing:border-box; background:#f8fafc;" placeholder="여기에 텍스트를 통째로 싹 붙여넣으세요..."></textarea>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-top:25px;">
            <button class="button primary-button" style="height:60px; font-size:1.2em; border-radius:12px; background:#4f46e5; border:none;" onclick="window.processUnifiedBulkAdd()">🚀 L1/L2 데이터 분석 및 자동 분리 시작</button>
            <button class="button light-button" style="height:60px; font-size:1.2em; border-radius:12px; border:2px solid #cbd5e1;" onclick="window.closeModal()">취소</button>
        </div>
    </div>`;
    m.classList.remove('hidden');
};

window.processUnifiedBulkAdd = async function() {
    const inputArea = document.getElementById('bulk-input'); if (!inputArea) return;
    let text = inputArea.value; if (!text.trim()) return alert("주입할 텍스트가 없습니다.");
    window.showLoading();
    
    try {
        // 공백 정규화 (보이지 않는 특수문자 제거)
        text = text.replace(/[\u00A0\u200B-\u200D\uFEFF]/g, ' ').replace(/\*\*/g, '');
        
        // =========================================================
        // 🚀 L1 파티셔닝: 거대 7대 구역(섹션) 분할 칩렛
        // =========================================================
        const mainMarkers = [
            { id: 'remind', regex: /(?:\[\d+\]|\d+\.)?\s*(?:정답\s*및\s*)?핵심\s*리마인드/i },
            { id: 'quiz1', regex: /(?:\[\d+\]|\d+\.)?\s*실전\s*대비/i },
            { id: 'quiz2', regex: /(?:\[\d+\]|\d+\.)?\s*지식\s*재구성/i },
            { id: 'visual', regex: /(?:\[\d+\]|\d+\.)?\s*시각적\s*구조화/i },
            { id: 'case', regex: /(?:\[\d+\]|\d+\.)?\s*사례\s*분석/i },
            { id: 'comp', regex: /(?:\[\d+\]|\d+\.)?\s*다단\s*비교표/i },
            { id: 'proto', regex: /(?:\[\d+\]|\d+\.)?\s*학습\s*데이터\s*프로토콜/i }
        ];

        let mFound = [];
        mainMarkers.forEach(m => {
            let match = text.match(m.regex);
            if(match) mFound.push({ id: m.id, start: match.index, end: match.index + match[0].length });
        });
        mFound.sort((a,b) => a.start - b.start); // 등장 순서대로 정렬

        // 구역별로 텍스트 도려내기
        let sections = {};
        for(let i=0; i<mFound.length; i++) {
            let curr = mFound[i];
            let next = mFound[i+1];
            let content = text.substring(curr.end, next ? next.start : text.length).replace(/^[\s:\-]+/, '').trim();
            sections[curr.id] = content;
        }

        let counts = {q:0, c:0, n:0, v:0, s:0};
        const ts = firebase.firestore.FieldValue.serverTimestamp();

        // =========================================================
        // 🚀 L2 세부 추출: 각 구역(섹션)별 마이크로 데이터 저장
        // =========================================================
        
        // 1. 일반 노트 (학습 데이터 프로토콜)
        if(sections['proto']) {
            await db.collection('subjects').doc(window.currentSubjectId).collection('notes').add({ category:'미분류', title:'학습 데이터 프로토콜', content: sections['proto'], createdAt:ts, updatedAt:ts });
            counts.n++;
        }
        
        // 2. 시각적 구조화 (마인드맵 등)
        if(sections['visual']) {
            await db.collection('subjects').doc(window.currentSubjectId).collection('visualMaps').add({ category:'미분류', title:'시각적 구조화', content: sections['visual'], createdAt:ts, updatedAt:ts });
            counts.v++;
        }

        // 3. 퀴즈 & 지식 재구성 칩렛 (가장 복잡한 추출)
        let quizBlock = (sections['quiz1'] || '') + '\n\n' + (sections['quiz2'] || '');
        if(quizBlock.trim() || sections['remind']) {
            let qObj = { category:'미분류', negativeType:'1', text:'질문 내용 없음', answer:'', shortExplanation:'', explanation:'', mnemonic:'', mnemonicDesc:'', knowledgeNetwork:'', diagramFormula:'', options:[], optionImages:['','','','',''], images:[], pathLevels:[], keywords:[], tags:[], bookmarked:false, coreRemind: sections['remind'] || '' };
            
            const qMarkers = [
                { id: 'type', regex: /(?:\[\d+\]|\d+\.)?\s*문제\s*유형/i },
                { id: 'text', regex: /(?:\[\d+\]|\d+\.)?\s*질문\s*내용/i },
                { id: 'ans', regex: /(?:\[\d+\]|\d+\.)?\s*정답/i },
                { id: 'opts', regex: /(?:\[\d+\]|\d+\.)?\s*선택지/i },
                { id: 'short', regex: /(?:\[\d+\]|\d+\.)?\s*(?:1줄\s*해설|해설\s*요약)/i },
                { id: 'exp', regex: /(?:\[\d+\]|\d+\.)?\s*상세\s*해설/i },
                { id: 'path', regex: /(?:\[\d+\]|\d+\.)?\s*목차\s*정보/i },
                { id: 'mne', regex: /(?:\[\d+\]|\d+\.)?\s*암기\s*코드/i },
                { id: 'mneD', regex: /(?:\[\d+\]|\d+\.)?\s*해석\s*및\s*풀이/i },
                { id: 'knR', regex: /(?:\[\d+\]|\d+\.)?\s*지식\s*연결망/i },
                { id: 'diag', regex: /(?:\[\d+\]|\d+\.)?\s*도식\s*및\s*핵심\s*(?:공식|원리)/i },
                { id: 'kw', regex: /(?:\[\d+\]|\d+\.)?\s*키워드/i },
                { id: 'tg', regex: /(?:\[\d+\]|\d+\.)?\s*태그/i }
            ];

            let qFound = [];
            qMarkers.forEach(m => {
                let match = quizBlock.match(m.regex);
                if(match) qFound.push({ id: m.id, start: match.index, end: match.index + match[0].length });
            });
            qFound.sort((a,b) => a.start - b.start);

            let qData = {};
            for(let i=0; i<qFound.length; i++) {
                let curr = qFound[i];
                let next = qFound[i+1];
                qData[curr.id] = quizBlock.substring(curr.end, next ? next.start : quizBlock.length).replace(/^[\s:\-]+/, '').trim();
            }

            if(qData['type']) {
                let t = qData['type'].replace(/\s+/g,'');
                if(t.includes('빈칸')) qObj.negativeType = '2';
                else if(t.includes('주관')) qObj.negativeType = '3';
                else if(t.includes('심화')) qObj.negativeType = '4';
            }
            if(qData['text']) qObj.text = qData['text'];
            if(qData['ans']) qObj.answer = qData['ans'].replace(/^\d+\)\s*/, '');
            if(qData['opts']) {
                let o = qData['opts'];
                let optsArr = o.split(/(?:\([1-5]\)|[①-⑤]|\d\)\s+|\d\.\s+|^O\s+\(맞다\)|^X\s+\(틀리다\))/gm).map(s=>s.trim()).filter(Boolean);
                if(optsArr.length <= 1 && o.includes('\n')) optsArr = o.split('\n').map(s=>s.trim()).filter(Boolean);
                qObj.options = optsArr;
            }
            if(qData['short']) qObj.shortExplanation = qData['short'];
            if(qData['exp']) qObj.explanation = qData['exp'];
            if(qData['path']) qObj.pathLevels = qData['path'].split(/\n|,|단계:/).map(s=>s.trim().replace(/^\d+\s*/,'')).filter(Boolean);
            if(qData['mne']) qObj.mnemonic = qData['mne'];
            if(qData['mneD']) qObj.mnemonicDesc = qData['mneD'];
            if(qData['knR']) qObj.knowledgeNetwork = qData['knR'];
            if(qData['diag']) qObj.diagramFormula = qData['diag'];
            if(qData['kw']) qObj.keywords = qData['kw'].replace(/#/g,'').split(/[,|/]+|\s+/).map(s=>s.trim()).filter(Boolean);
            if(qData['tg']) qObj.tags = qData['tg'].replace(/#/g,'').split(/[,|/]+|\s+/).map(s=>s.trim()).filter(Boolean);

            ['answer','shortExplanation','explanation','mnemonic','mnemonicDesc','knowledgeNetwork','diagramFormula'].forEach(k => {
                if(['없음','공백','-','해당없음'].includes((qObj[k]||'').replace(/\s+/g,''))) qObj[k] = '';
            });

            qObj.createdAt = ts; qObj.updatedAt = ts;
            await db.collection('subjects').doc(window.currentSubjectId).collection('questions').add(qObj);
            counts.q++;
        }

        // 4. 사례 분석 칩렛 (마크다운 표 분해 지원)
        if(sections['case']) {
            let sObj = { title:'사례 분석', category:'미분류', sit_c:'', sit_n:'', pri_c:'', pri_n:'', sta_c:'', sta_n:'', pnt_c:'', pnt_n:'' };
            let lines = sections['case'].split('\n').map(l=>l.trim()).filter(Boolean);
            let isMarkdown = lines.some(l => l.includes('|'));
            
            if(isMarkdown) {
                lines.forEach(l => {
                    if(l.match(/구분|---|===/)) return;
                    let p = l.split('|').map(s=>s.trim()).filter(Boolean);
                    if(p.length >= 2) {
                        let k = p[0].replace(/\s+/g,'');
                        let c = p[1]||''; let n = p[2]||'';
                        if(k.includes('상황')) { sObj.sit_c=c; sObj.sit_n=n; }
                        else if(k.includes('원리')||k.includes('진단')||k.includes('설정')||k.includes('판단')||k.includes('선택')) { sObj.pri_c=c; sObj.pri_n=n; }
                        else if(k.includes('상태')||k.includes('처치')||k.includes('결과')||k.includes('이유')||k.includes('근거')) { sObj.sta_c=c; sObj.sta_n=n; }
                        else if(k.includes('포인트')) { sObj.pnt_c=c; sObj.pnt_n=n; }
                    }
                });
            } else {
                // 표가 텍스트로 박살나서 들어온 경우를 대비한 서브 칩렛
                const sMarkers = [
                    { id:'sit', regex:/상황/i },
                    { id:'pri', regex:/작동|작용\s*원리|원리|진단|선택\s*에너지|에너지\s*설정|판단\s*근거/i },
                    { id:'sta', regex:/생리적\s*상태|상태|결과|처치|이유/i },
                    { id:'pnt', regex:/학습\s*포인트/i }
                ];
                let sFound = [];
                sMarkers.forEach(m => {
                    let match = sections['case'].match(m.regex);
                    if(match) sFound.push({ id: m.id, start: match.index, end: match.index + match[0].length });
                });
                sFound.sort((a,b) => a.start - b.start);
                if(sFound.length > 0) {
                    for(let i=0; i<sFound.length; i++) {
                        let curr = sFound[i]; let next = sFound[i+1];
                        let content = sections['case'].substring(curr.end, next?next.start:sections['case'].length).replace(/^[\s:\-]+/, '').trim();
                        if(curr.id==='sit') sObj.sit_c = content;
                        if(curr.id==='pri') sObj.pri_c = content;
                        if(curr.id==='sta') sObj.sta_c = content;
                        if(curr.id==='pnt') sObj.pnt_c = content;
                    }
                } else {
                    sObj.sit_c = sections['case'];
                }
            }
            sObj.createdAt = ts; sObj.updatedAt = ts;
            await db.collection('subjects').doc(window.currentSubjectId).collection('caseStudies').add(sObj);
            counts.s++;
        }

        // 5. 다단 비교표 칩렛
        if(sections['comp']) {
            let cObj = { title:'다단 비교표', category:'미분류', col1Name:'', col2Name:'', col3Name:'', col4Name:'', rows:[] };
            let lines = sections['comp'].split('\n').map(l=>l.trim()).filter(Boolean);
            lines.forEach(l => {
                if(l.match(/---|===/)) return;
                if(l.includes('|')) {
                    let cols = l.split('|').map(s=>s.trim()).filter(Boolean);
                    let nosp = l.replace(/\s+/g,'');
                    if(!cObj.col1Name && (nosp.includes('항목')||nosp.includes('분류')||nosp.includes('폭')||nosp.includes('에너지'))) {
                        for(let i=0; i<cols.length&&i<4; i++) cObj[`col${i+1}Name`] = cols[i].replace(/비교\s*항목/g,'').trim();
                    } else if(!cObj.col1Name) { // 보험용
                        for(let i=0; i<cols.length&&i<4; i++) cObj[`col${i+1}Name`] = cols[i];
                    } else {
                        let c1 = ['없음','공백','-'].includes(cols[0].replace(/\s+/g,'')) ? '-' : cols[0];
                        let c2 = ['없음','공백','-'].includes(cols[1].replace(/\s+/g,'')) ? '-' : cols[1];
                        cObj.rows.push({ col1: c1, col2: c2, col3: cols[2]||'', col4: cols[3]||'' });
                    }
                }
            });
            cObj.createdAt = ts; cObj.updatedAt = ts;
            await db.collection('subjects').doc(window.currentSubjectId).collection('comparisons').add(cObj);
            counts.c++;
        }

        window.hideLoading(); window.closeModal(); 
        if (window.currentSubjectId && typeof window.manageSubject === 'function') window.manageSubject(window.currentSubjectId);
        
        alert(`✨ 칩렛 아키텍처 1-Click 주입 성공!\n✅ 퀴즈(리마인드/재구성): ${counts.q}건\n✅ 시각맵: ${counts.v}건\n✅ 사례분석: ${counts.s}건\n✅ 비교표: ${counts.c}건\n✅ 일반노트(프로토콜): ${counts.n}건`);

    } catch (err) {
        window.hideLoading(); console.error("파서 에러:", err);
        alert("🚨 오류 발생: " + err.message);
    }
};
