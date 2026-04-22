// =========================================================
// [v15.0.0] app-parser.js: Multi-Section Smart Injector
// (User's Idea: Pre-separated textareas for zero cross-contamination)
// =========================================================

window.showBulkAddModal = function() { 
    const m = document.getElementById('modal-container'); if(!m) return;
    m.innerHTML = `<div class="modal-backdrop" onclick="window.closeModal()"></div>
    <div class="modal" style="max-width:1000px; width:95%; height:90vh; background:#fff; border-radius:20px; padding:30px; box-shadow:0 10px 40px rgba(0,0,0,0.15); display:flex; flex-direction:column; z-index:100000;">
        <div style="text-align:center; margin-bottom:15px;">
            <h2 style="color:#4f46e5; margin-bottom:5px; font-size:1.8em;">🤖 섹션 분리형 스마트 주입</h2>
            <p style="color:#64748b; font-size:0.95em;">원하는 항목의 칸에만 내용을 붙여넣으세요. 다른 항목과 절대 섞이지 않습니다! (빈칸은 자동 무시)</p>
        </div>
        
        <div style="flex:1; overflow-y:auto; padding-right:10px; display:flex; flex-direction:column; gap:15px;">
            <div style="border:1px solid #cbd5e1; border-radius:10px; overflow:hidden;">
                <div style="background:#f1f5f9; padding:8px 15px; font-weight:bold; color:#334155;">[1] 핵심 리마인드 (노트)</div>
                <textarea id="b-remind" style="width:100%; height:60px; border:none; padding:10px; box-sizing:border-box; font-family:monospace;"></textarea>
            </div>
            
            <div style="border:1px solid #c7d2fe; border-radius:10px; overflow:hidden;">
                <div style="background:#e0e7ff; padding:8px 15px; font-weight:bold; color:#4338ca;">[2~3] 퀴즈 & 지식 재구성 (문제유형, 질문내용, 정답, 해설, 암기코드, GCM 등)</div>
                <textarea id="b-quiz" style="width:100%; height:120px; border:none; padding:10px; box-sizing:border-box; font-family:monospace;"></textarea>
            </div>
            
            <div style="border:1px solid #bae6fd; border-radius:10px; overflow:hidden;">
                <div style="background:#e0f2fe; padding:8px 15px; font-weight:bold; color:#0369a1;">[4] 시각적 구조화 (마인드맵, 밴다이어그램)</div>
                <textarea id="b-visual" style="width:100%; height:80px; border:none; padding:10px; box-sizing:border-box; font-family:monospace;"></textarea>
            </div>
            
            <div style="border:1px solid #fed7aa; border-radius:10px; overflow:hidden;">
                <div style="background:#ffedd5; padding:8px 15px; font-weight:bold; color:#c2410c;">[5] 사례 분석 (상황, 작용원리, 상태, 포인트)</div>
                <textarea id="b-case" style="width:100%; height:100px; border:none; padding:10px; box-sizing:border-box; font-family:monospace;"></textarea>
            </div>
            
            <div style="border:1px solid #e9d5ff; border-radius:10px; overflow:hidden;">
                <div style="background:#f3e8ff; padding:8px 15px; font-weight:bold; color:#7e22ce;">[6] 다단 비교표 ( | 구분자 형식 권장)</div>
                <textarea id="b-comp" style="width:100%; height:100px; border:none; padding:10px; box-sizing:border-box; font-family:monospace;"></textarea>
            </div>
            
            <div style="border:1px solid #cbd5e1; border-radius:10px; overflow:hidden;">
                <div style="background:#f1f5f9; padding:8px 15px; font-weight:bold; color:#334155;">[7] 학습 데이터 프로토콜 (노트)</div>
                <textarea id="b-proto" style="width:100%; height:60px; border:none; padding:10px; box-sizing:border-box; font-family:monospace;"></textarea>
            </div>
        </div>

        <div style="display:flex; gap:15px; margin-top:20px;">
            <button class="button primary-button" style="flex:2; height:60px; font-size:1.2em; border-radius:12px; background:#4f46e5; border:none;" onclick="window.processSeparatedBulkAdd()">🚀 각 칸별 데이터 추출 및 저장</button>
            <button class="button light-button" style="flex:1; height:60px; font-size:1.2em; border-radius:12px; border:2px solid #cbd5e1;" onclick="window.closeModal()">취소</button>
        </div>
    </div>`;
    m.classList.remove('hidden');
};

window.processSeparatedBulkAdd = async function() {
    window.showLoading();
    let counts = {q:0, c:0, n:0, v:0, s:0};
    const ts = firebase.firestore.FieldValue.serverTimestamp();

    const cleanStr = (str) => str.replace(/[\u00A0\u200B-\u200D\uFEFF]/g, ' ').replace(/\*\*/g, '').trim();
    const isBlank = (str) => ['없음', '공백', '-', '해당없음'].includes(str.replace(/\s+/g, ''));

    try {
        // [1] 핵심 리마인드 (노트)
        let vRemind = cleanStr(document.getElementById('b-remind').value);
        if(vRemind && !isBlank(vRemind)) {
            let nObj = { category: '미분류', title: '핵심 리마인드', content: vRemind.replace(/^.*?(정답\s*및\s*핵심\s*리마인드|핵심\s*리마인드)[:\s]*/, ''), createdAt: ts, updatedAt: ts };
            await db.collection('subjects').doc(window.currentSubjectId).collection('notes').add(nObj);
            counts.n++;
        }

        // [7] 프로토콜 (노트)
        let vProto = cleanStr(document.getElementById('b-proto').value);
        if(vProto && !isBlank(vProto)) {
            let nObj = { category: '미분류', title: '학습 데이터 프로토콜', content: vProto.replace(/^.*?(학습\s*데이터\s*프로토콜)[:\s]*/, ''), createdAt: ts, updatedAt: ts };
            await db.collection('subjects').doc(window.currentSubjectId).collection('notes').add(nObj);
            counts.n++;
        }

        // [4] 시각적 구조화
        let vVisual = cleanStr(document.getElementById('b-visual').value);
        if(vVisual && !isBlank(vVisual)) {
            let vObj = { category: '미분류', title: '시각적 구조화', content: vVisual.replace(/^.*?(시각적\s*구조화)[:\s]*/, ''), createdAt: ts, updatedAt: ts };
            await db.collection('subjects').doc(window.currentSubjectId).collection('visualMaps').add(vObj);
            counts.v++;
        }

        // [2~3] 퀴즈 & 지식 재구성
        let vQuizRaw = cleanStr(document.getElementById('b-quiz').value);
        if(vQuizRaw && !isBlank(vQuizRaw)) {
            // 강제 줄바꿈 주입 (떡진 글자 찢기)
            let vQuiz = vQuizRaw
                .replace(/([^\n])(문제\s*유형:?|1\.\s*문제\s*유형)/g, '$1\n문제유형:')
                .replace(/([^\n])(질문\s*내용:?|2\.\s*질문\s*내용)/g, '$1\n질문내용:')
                .replace(/([^\n])(정답:?|3\.\s*정답)/g, '$1\n정답:')
                .replace(/([^\n])(선택지:?|4\.\s*선택지)/g, '$1\n선택지:')
                .replace(/([^\n])(1줄\s*해설:?|해설\s*요약:?|5\.\s*1줄\s*해설)/g, '$1\n1줄해설:')
                .replace(/([^\n])(상세\s*해설:?|6\.\s*상세\s*해설)/g, '$1\n상세해설:')
                .replace(/([^\n])(목차\s*정보:?|7\.\s*목차\s*정보)/g, '$1\n목차정보:')
                .replace(/([^\n])(암기\s*코드:?)/g, '$1\n암기코드:')
                .replace(/([^\n])(해석\s*및\s*풀이:?)/g, '$1\n해석및풀이:')
                .replace(/([^\n])(지식\s*연결망:?)/g, '$1\n지식연결망:')
                .replace(/([^\n])(도식\s*및\s*핵심\s*공식,?\s*원리:?|도식\s*및\s*핵심\s*공식:?)/g, '$1\n도식및핵심공식:')
                .replace(/([^\n])(키워드:?)/g, '$1\n키워드:')
                .replace(/([^\n])(태그:?)/g, '$1\n태그:');

            let qObj = { category:'미분류', negativeType:'', text:'질문 내용 없음', answer:'', shortExplanation:'', explanation:'', mnemonic:'', mnemonicDesc:'', knowledgeNetwork:'', diagramFormula:'', options:[], keywords:[], tags:[], optionImages:['','','','',''], images:[], pathLevels:[], bookmarked:false };
            
            let lines = vQuiz.split('\n').map(l=>l.trim()).filter(Boolean);
            let field = ''; let buffer = [];

            const saveQ = () => {
                if(!field) return;
                let val = buffer.join('\n').trim();
                if(isBlank(val)) val = '';
                const map = { type:'negativeType', text:'text', ans:'answer', short:'shortExplanation', exp:'explanation', mne:'mnemonic', mneD:'mnemonicDesc', knR:'knowledgeNetwork', diag:'diagramFormula' };
                
                if(map[field]) { qObj[map[field]] = val; }
                else if(field === 'kw' || field === 'tg') { qObj[field==='kw'?'keywords':'tags'] = val ? val.replace(/#/g,'').split(/[,|/]+|\s+/).map(s=>s.trim()).filter(Boolean) : []; }
                else if(field === 'path') { qObj.pathLevels = val ? val.split(/\n|,|단계:/).map(s=>s.trim().replace(/^\d+\s*/,'')).filter(Boolean) : []; }
                else if(field === 'options') { 
                    if(val) {
                        let opts = val.split(/(?:\([1-5]\)|[①-⑤]|\d\)\s+|\d\.\s+|^O\s+\(맞다\)|^X\s+\(틀리다\))/gm).map(s=>s.trim()).filter(Boolean);
                        if(opts.length<=1 && val.includes('\n')) opts = val.split('\n').map(s=>s.trim()).filter(Boolean);
                        qObj.options = opts;
                    }
                }
                buffer = [];
            };

            for(let line of lines) {
                let checkStr = line.replace(/\s+/g, '');
                if(checkStr.startsWith('문제유형')) { saveQ(); field='type'; buffer=[line.replace(/^.*?문제유형[:\s]*/,'')]; }
                else if(checkStr.startsWith('질문내용')) { saveQ(); field='text'; buffer=[line.replace(/^.*?질문내용[:\s]*/,'')]; }
                else if(checkStr.startsWith('정답') && !checkStr.includes('진위형')) { saveQ(); field='ans'; buffer=[line.replace(/^.*?정답[:\s]*/,'')]; }
                else if(checkStr.startsWith('선택지')) { saveQ(); field='options'; buffer=[line.replace(/^.*?선택지[:\s]*/,'')]; }
                else if(checkStr.startsWith('1줄해설')||checkStr.startsWith('해설요약')) { saveQ(); field='short'; buffer=[line.replace(/^.*?(1줄해설|해설요약)[:\s]*/,'')]; }
                else if(checkStr.startsWith('상세해설')) { saveQ(); field='exp'; buffer=[line.replace(/^.*?상세해설[:\s]*/,'')]; }
                else if(checkStr.startsWith('목차정보')) { saveQ(); field='path'; buffer=[line.replace(/^.*?목차정보[:\s]*/,'')]; }
                else if(checkStr.startsWith('암기코드')) { saveQ(); field='mne'; buffer=[line.replace(/^.*?암기코드[:\s]*/,'')]; }
                else if(checkStr.startsWith('해석및풀이')) { saveQ(); field='mneD'; buffer=[line.replace(/^.*?해석및풀이[:\s]*/,'')]; }
                else if(checkStr.startsWith('지식연결망')) { saveQ(); field='knR'; buffer=[line.replace(/^.*?지식연결망[:\s]*/,'')]; }
                else if(checkStr.startsWith('도식및')) { saveQ(); field='diag'; buffer=[line.replace(/^.*?도식및핵심공식[:\s]*/,'')]; }
                else if(checkStr.startsWith('키워드')) { saveQ(); field='kw'; buffer=[line.replace(/^.*?키워드[:\s]*/,'')]; }
                else if(checkStr.startsWith('태그')) { saveQ(); field='tg'; buffer=[line.replace(/^.*?태그[:\s]*/,'')]; }
                else if(!checkStr.startsWith('실전대비') && !checkStr.startsWith('지식재구성')) { buffer.push(line); }
            }
            saveQ();
            if(qObj.answer) qObj.answer = qObj.answer.replace(/^\d+\)\s*/, '');
            qObj.createdAt = ts; qObj.updatedAt = ts;
            await db.collection('subjects').doc(window.currentSubjectId).collection('questions').add(qObj);
            counts.q++;
        }

        // [5] 사례 분석
        let vCaseRaw = cleanStr(document.getElementById('b-case').value);
        if(vCaseRaw && !isBlank(vCaseRaw)) {
            let vCase = vCaseRaw
                .replace(/([^\n])(상황:?)/g, '$1\n상황:')
                .replace(/([^\n])(작동:?|작용\s*원리:?|원리:?|진단:?|선택\s*에너지:?)/g, '$1\n작용원리:')
                .replace(/([^\n])(생리적\s*상태:?|상태:?|처치:?|결과:?|이유:?)/g, '$1\n생리적상태:')
                .replace(/([^\n])(학습\s*포인트:?)/g, '$1\n학습포인트:');

            let sObj = { title:'사례 분석', category:'미분류', sit_c:'', sit_n:'', pri_c:'', pri_n:'', sta_c:'', sta_n:'', pnt_c:'', pnt_n:'' };
            let lines = vCase.split('\n').map(l=>l.trim()).filter(Boolean);
            
            for(let line of lines) {
                let checkStr = line.replace(/\s+/g, '');
                if(checkStr.startsWith('구분')||checkStr.startsWith('사례분석')) continue;
                
                let p = line.split(/\t|\|/).map(s=>s.trim()).filter(Boolean);
                if(p.length >= 2) {
                    let k = p[0].replace(/^[:\-•\d\.\[\]\s]+/, '');
                    let cText = isBlank(p[1]) ? '' : p[1];
                    let nText = p[2] ? (isBlank(p[2]) ? '' : p[2]) : '';
                    if (k.includes('상황')) { sObj.sit_c = cText; sObj.sit_n = nText; }
                    else if (k.includes('원리')||k.includes('진단')||k.includes('선택')) { sObj.pri_c = cText; sObj.pri_n = nText; }
                    else if (k.includes('상태')||k.includes('처치')||k.includes('결과')||k.includes('이유')) { sObj.sta_c = cText; sObj.sta_n = nText; }
                    else if (k.includes('포인트')) { sObj.pnt_c = cText; sObj.pnt_n = nText; }
                } else {
                    if (checkStr.startsWith('상황')) sObj.sit_c += line.replace(/^.*?상황[:\s]*/,'') + '\n';
                    else if (checkStr.startsWith('작용원리')) sObj.pri_c += line.replace(/^.*?작용원리[:\s]*/,'') + '\n';
                    else if (checkStr.startsWith('생리적상태')) sObj.sta_c += line.replace(/^.*?생리적상태[:\s]*/,'') + '\n';
                    else if (checkStr.startsWith('학습포인트')) sObj.pnt_c += line.replace(/^.*?학습포인트[:\s]*/,'') + '\n';
                    else sObj.sit_c += line + '\n';
                }
            }
            if(!sObj.sit_c && !sObj.pri_c && !sObj.sta_c) sObj.sit_c = "내용 없음";
            sObj.createdAt = ts; sObj.updatedAt = ts;
            await db.collection('subjects').doc(window.currentSubjectId).collection('caseStudies').add(sObj);
            counts.s++;
        }

        // [6] 다단 비교표
        let vCompRaw = cleanStr(document.getElementById('b-comp').value);
        if(vCompRaw && !isBlank(vCompRaw)) {
            let cObj = { title:'다단 비교표', category:'미분류', col1Name:'', col2Name:'', col3Name:'', col4Name:'', rows:[] };
            let lines = vCompRaw.split('\n').map(l=>l.trim()).filter(Boolean);
            
            for(let line of lines) {
                if(line.includes('---') || line.includes('===') || line.replace(/\s+/g,'').startsWith('다단비교')) continue;
                let cols = line.split(/\t|\|/).map(s=>s.trim()).filter(s=>s);
                if(cols.length >= 2) {
                    if(!cObj.col1Name && !line.includes('항목')) {
                        for(let i=0; i<cols.length && i<4; i++) cObj[`col${i+1}Name`] = cols[i];
                    } else if(cObj.col1Name || line.includes('항목')) {
                        if(line.includes('항목')) {
                            for(let i=0; i<cols.length && i<4; i++) cObj[`col${i+1}Name`] = cols[i].replace(/비교\s*항목/g,'').trim() || `항목${i+1}`;
                        } else {
                            cObj.rows.push({ col1: isBlank(cols[0])?'-':cols[0], col2: isBlank(cols[1])?'-':cols[1], col3: cols[2]||'', col4: cols[3]||'' });
                        }
                    }
                } else if(cols.length === 1) {
                    if(!cObj.col1Name) { cObj.col1Name = '항목'; cObj.col2Name = '내용'; }
                    cObj.rows.push({ col1: cols[0], col2: '-', col3: '', col4: '' });
                }
            }
            if(!cObj.col1Name && cObj.rows.length === 0) cObj.rows.push({col1:'-', col2:'-', col3:'', col4:''});
            cObj.createdAt = ts; cObj.updatedAt = ts;
            await db.collection('subjects').doc(window.currentSubjectId).collection('comparisons').add(cObj);
            counts.c++;
        }

        window.hideLoading(); window.closeModal(); 
        if (window.currentSubjectId && typeof window.manageSubject === 'function') window.manageSubject(window.currentSubjectId);
        
        alert(`✨ 분리형 스마트 주입 완료!\n✅ 퀴즈/재구성: ${counts.q}건\n✅ 시각맵: ${counts.v}건\n✅ 사례분석: ${counts.s}건\n✅ 비교표: ${counts.c}건\n✅ 일반노트: ${counts.n}건`);

    } catch (err) {
        window.hideLoading(); console.error("파서 에러:", err);
        alert("🚨 오류 발생: " + err.message);
    }
};
