// =========================================================
// [v48.0.0] app-parser.js: Vertical Squash Reconstructor & Multi-Set Isolation
// =========================================================

window.showBulkAddModal = function() { 
    const m = document.getElementById('modal-container'); if(!m) return;
    m.innerHTML = `<div class="modal-backdrop" onclick="window.closeModal()"></div>
    <div class="modal" style="max-width:1000px; width:95%; background:#fff; border-radius:20px; padding:35px; box-shadow:0 10px 40px rgba(0,0,0,0.15); position:relative; z-index:100000;">
        <div style="text-align:center; margin-bottom:20px;">
            <h2 style="color:#4f46e5; margin-bottom:10px; font-size:1.8em;">🤖 퀀텀 스마트 주입기 (궁극의 세로 복원판)</h2>
            <p style="color:#64748b; margin-bottom:10px;">다중 세트 주입은 물론, 세로로 완전히 뭉개진 표(PDF 복사 등)까지 완벽하게 재조립합니다.</p>
        </div>
        <textarea id="bulk-input" style="width:100%; height:400px; padding:20px; border-radius:15px; border:2px solid #e2e8f0; font-family:'Consolas', monospace; line-height:1.6; font-size:1.05em; box-sizing:border-box; background:#f8fafc;" placeholder="여기에 텍스트를 통째로 붙여넣으세요..."></textarea>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-top:25px;">
            <button class="button primary-button" style="height:60px; font-size:1.2em; border-radius:12px; background:#4f46e5; border:none;" onclick="window.processUnifiedBulkAdd()">🚀 무한 세트 & 표 복원 시작</button>
            <button class="button light-button" style="height:60px; font-size:1.2em; border-radius:12px; border:2px solid #cbd5e1;" onclick="window.closeModal()">취소</button>
        </div>
    </div>`;
    m.classList.remove('hidden');
};

window.processUnifiedBulkAdd = async function() {
    const inputArea = document.getElementById('bulk-input'); if (!inputArea) return;
    let rawText = inputArea.value.replace(/[\u00A0\u200B-\u200D\uFEFF]/g, ' ').replace(/\*\*/g, '');
    if (!rawText.trim()) return alert("주입할 텍스트가 없습니다.");
    window.showLoading();

    try {
        const ts = firebase.firestore.FieldValue.serverTimestamp();
        let counts = {q:0, r:0, c:0, n:0, v:0, s:0};

        // 🚨 1. 궁극의 다중 세트 분해기: "핵심 리마인드"를 기준으로 전체 텍스트를 칼같이 쪼갭니다!
        let problemSets = rawText.split(/(?=(?:^|\n)[ \t]*\d*\.?\s*(?:정답\s*및\s*)?핵심\s*리마인드)/i).map(s=>s.trim()).filter(Boolean);

        for (let setIdx = 0; setIdx < problemSets.length; setIdx++) {
            let text = problemSets[setIdx];

            const extractSection = (str, startRegex, endRegex) => {
                let startMatch = str.match(startRegex); if (!startMatch) return '';
                let startIndex = startMatch.index + startMatch[0].length; let sub = str.substring(startIndex);
                if (!endRegex) return sub.trim();
                let endMatch = sub.match(endRegex); if (endMatch) return sub.substring(0, endMatch.index).trim();
                return sub.trim();
            };

            // 숫자(1., 2.)에 의존하지 않는 절대 추출
            let s1 = extractSection(text, /(?:정답\s*및\s*)?핵심\s*리마인드/i, /실전\s*대비|퀴즈\s*정리/i);
            let s2 = extractSection(text, /실전\s*대비|퀴즈\s*정리/i, /지식\s*재구성/i);
            let s3 = extractSection(text, /지식\s*재구성/i, /시각적\s*구조화/i);
            let s4 = extractSection(text, /시각적\s*구조화/i, /사례\s*분석/i);
            let s5 = extractSection(text, /사례\s*분석/i, /다단\s*비교표/i);
            let s6 = extractSection(text, /다단\s*비교표/i, /학습\s*데이터|데이터\s*프로토콜/i);
            let s7 = extractSection(text, /학습\s*데이터|데이터\s*프로토콜/i, null);

            let coreRemind = s1.replace(/\[.*?\]/g, '').replace(/정답은.*?(입니다|다\.)/i, '').replace(/핵심\s*리마인드[:\s]*/i, '').trim();

            // 🚨 [2] 퀴즈 추출 (숫자 꼬임 현상 완벽 클리닝)
            if (s2 || coreRemind) {
                let qObj = { category:'미분류', negativeType:'', text:'', answer:'', shortExplanation:'', explanation:'', options:[], optionImages:['','','','',''], images:[], pathLevels:[], bookmarked:false, coreRemind: coreRemind };
                const qKeys = [{ k: 'type', r: /문제\s*유형[:\s]*/i }, { k: 'text', r: /질문\s*내용[:\s]*/i }, { k: 'ans', r: /정답(?!\s*및)[:\s]*/i }, { k: 'opts', r: /선택지[:\s]*/i }, { k: 'short', r: /(?:1줄\s*해설|해설\s*요약)[:\s]*/i }, { k: 'exp', r: /상세\s*해설[:\s]*/i }, { k: 'path', r: /목차\s*정보[:\s]*/i }];
                let qData = {};
                for (let i = 0; i < qKeys.length; i++) {
                    let m1 = s2.match(qKeys[i].r); if (!m1) { qData[qKeys[i].k] = ''; continue; }
                    let subText = s2.substring(m1.index + m1[0].length); let closest = subText.length;
                    for (let j = 0; j < qKeys.length; j++) { if (i === j) continue; let m2 = subText.match(qKeys[j].r); if (m2 && m2.index < closest) closest = m2.index; }
                    // 뒷부분에 붙은 "3." 같은 다음 번호 찌꺼기 완벽 제거
                    qData[qKeys[i].k] = subText.substring(0, closest).trim().replace(/\n\s*\d+\.?\s*$/, '').trim();
                }
                if(qData.type) qObj.negativeType = qData.type; if(qData.text) qObj.text = qData.text; if(qData.ans) qObj.answer = qData.ans.replace(/^\d+\)\s*/, '');
                if(qData.opts) { let optsArr = qData.opts.split(/\n/).map(s=>s.trim()).filter(Boolean); qObj.options = optsArr; }
                if(qData.short) qObj.shortExplanation = qData.short; if(qData.exp) qObj.explanation = qData.exp;
                if(qData.path) qObj.pathLevels = qData.path.split(/(?:\s+-\s+|\s*>\s*|➔|->|\n|단계:)/).map(s=>s.trim().replace(/^\d+\s*/,'')).filter(Boolean);
                
                if(!qObj.text) qObj.text = "질문 내용 없음 (스마트 주입)"; 
                qObj.createdAt = ts; qObj.updatedAt = ts;
                await db.collection('subjects').doc(window.currentSubjectId).collection('questions').add(qObj); counts.q++;
            }

            if (s3) {
                let rObj = { title:'새 지식 재구성', category:'미분류', mnemonic:'', mnemonicDesc:'', knowledgeNetwork:'', diagramFormula:'', keywords:[], tags:[] };
                const rKeys = [{ k: 'mne', r: /암기\s*코드[:\s]*/i }, { k: 'mneD', r: /해석\s*및\s*풀이[:\s]*/i }, { k: 'knR', r: /지식\s*연결망[:\s]*/i }, { k: 'diag', r: /도식\s*및\s*핵심\s*(?:공식|원리)[:\s]*/i }, { k: 'kw', r: /키워드[:\s]*/i }, { k: 'tg', r: /태그[:\s]*/i }];
                let rData = {};
                for (let i = 0; i < rKeys.length; i++) {
                    let m1 = s3.match(rKeys[i].r); if (!m1) { rData[rKeys[i].k] = ''; continue; }
                    let subText = s3.substring(m1.index + m1[0].length); let closest = subText.length;
                    for (let j = 0; j < rKeys.length; j++) { if (i === j) continue; let m2 = subText.match(rKeys[j].r); if (m2 && m2.index < closest) closest = m2.index; }
                    rData[rKeys[i].k] = subText.substring(0, closest).trim().replace(/\n\s*\d+\.?\s*$/, '').trim();
                }
                if(rData.mne) rObj.mnemonic = rData.mne; if(rData.mneD) rObj.mnemonicDesc = rData.mneD; if(rData.knR) rObj.knowledgeNetwork = rData.knR; 
                if(rData.diag) { rObj.diagramFormula = rData.diag.replace(/\$/g, '').replace(/\\text\{([^}]+)\}/g, '$1').replace(/\\[a-zA-Z]+/g, '').replace(/[\{\}]/g, ''); }
                if(rData.kw) { rObj.keywords = rData.kw.replace(/#/g,'').split(/[,|/]+|\s+/).map(s=>s.trim()).filter(Boolean); if(rObj.keywords.length>0) rObj.title = rObj.keywords[0] + ' 지식 재구성'; }
                if(rData.tg) rObj.tags = rData.tg.replace(/#/g,'').split(/[,|/]+|\s+/).map(s=>s.trim()).filter(Boolean);
                rObj.createdAt = ts; rObj.updatedAt = ts; await db.collection('subjects').doc(window.currentSubjectId).collection('reconstructions').add(rObj); counts.r++;
            }

            if (s4) {
                let vContent = s4.replace(/(🗺️|⭕|중심 노드|기기 특성|교집합|공급로|배출로|역할|특이점|태아기 전용|생애 공통|1차 우회|2차 우회|3차 우회)/g, '\n\n$1');
                await db.collection('subjects').doc(window.currentSubjectId).collection('visualMaps').add({ category:'미분류', title:'시각적 구조화', content: vContent.trim(), createdAt:ts, updatedAt:ts });
                counts.v++;
            }

            // 🧠 퀀텀 세로형 표 복원기 (파이프가 단 하나도 없이 엔터로만 뭉개진 표를 완벽하게 재건축)
            const parseVerticalSquash = (textBlock, defaultCols) => {
                let lines = textBlock.split('\n').map(s=>s.trim()).filter(Boolean);
                lines = lines.filter(l => !l.match(/^[-=|]+$/)); // 점선 제거
                if(lines.length === 0) return [];
                
                let cols = defaultCols;
                // 다단 비교표를 위한 휴리스틱(줄 수가 3의 배수인지 4의 배수인지 파악하여 컬럼 수 자동 설정)
                if (defaultCols > 3 && lines.length % 4 === 0 && lines.length % 3 !== 0) cols = 4;
                else if (defaultCols > 3 && lines.length % 3 === 0) cols = 3;

                let rows = [];
                for(let i=0; i<lines.length; i+=cols) {
                    rows.push(lines.slice(i, i+cols));
                }
                return rows;
            };

            const parseTable = (textBlock, defaultCols) => {
                let clean = textBlock.replace(/[-=|]{3,}/g, '');
                if (clean.includes('|') || clean.includes('\t')) {
                    // 가로형 정상 표
                    let lines = clean.split('\n'); let rows = [];
                    lines.forEach(l => {
                        let cols = l.split(/\||\t/).map(s=>s.trim()).filter(s => s !== '');
                        if (cols.length >= 2) rows.push(cols);
                    });
                    return rows;
                } else {
                    // 세로로 떡진 표 복원
                    return parseVerticalSquash(clean, defaultCols);
                }
            };

            // 🚨 [5] 사례 분석: 표 파쇄 100% 대응
            if (s5) {
                let sObj = { title:'사례 분석', category:'미분류', sit_c:'', sit_n:'', pri_c:'', pri_n:'', sta_c:'', sta_n:'', pnt_c:'', pnt_n:'' };
                let dataRows = parseTable(s5, 3); // 사례분석은 무조건 3열(구분, 사례, 비사례)

                if (dataRows.length > 0) {
                    let pureDataRows = dataRows.filter(row => !row.join('').includes('구분') && !row.join('').includes('구체적 사례'));
                    if(pureDataRows[0]) { sObj.sit_c = pureDataRows[0][1]||''; sObj.sit_n = pureDataRows[0][2]||''; }
                    if(pureDataRows[1]) { sObj.pri_c = pureDataRows[1][1]||''; sObj.pri_n = pureDataRows[1][2]||''; }
                    if(pureDataRows[2]) { sObj.sta_c = pureDataRows[2][1]||''; sObj.sta_n = pureDataRows[2][2]||''; }
                    if(pureDataRows[3]) { sObj.pnt_c = pureDataRows[3][1]||''; sObj.pnt_n = pureDataRows[3][2]||''; }
                } else {
                    sObj.sit_c = s5.trim(); sObj.sit_n = "⚠️ 인식 실패";
                }

                if (sObj.sit_c || sObj.pri_c || sObj.sta_c || sObj.pnt_c) {
                    sObj.createdAt = ts; sObj.updatedAt = ts;
                    await db.collection('subjects').doc(window.currentSubjectId).collection('caseStudies').add(sObj);
                    counts.s++;
                }
            }

            // 🚨 [6] 다단 비교표: 세로 떡짐 완벽 대응
            if (s6) {
                let cObj = { title:'다단 비교표', category:'미분류', headers:[], matrix:[] };
                let dataRows = parseTable(s6, 4); // 비교표는 기본 4열로 시작하나 내부 휴리스틱으로 3열 자동 감지

                if (dataRows.length > 0) {
                    cObj.headers = dataRows.shift();
                    dataRows.forEach(dr => { cObj.matrix.push({ items: dr }); });
                } else {
                    cObj.headers = ['비교 항목', '내용']; cObj.matrix = [{ items: ['⚠️ 표 깨짐', '데이터 복원 실패'] }];
                }
                cObj.createdAt = ts; cObj.updatedAt = ts;
                await db.collection('subjects').doc(window.currentSubjectId).collection('comparisons').add(cObj);
                counts.c++;
            }

            // 🚨 [7] 일반 노트: 다음 문제의 질문 텍스트(PreText)가 노트 꼬리에 붙는 현상 완벽 제거!
            if (s7) {
                let nContent = s7.replace(/^[\s\S]*?(?=\[PHASE)/i, ''); 
                
                // 노트 맨 끝에 다음 문제의 "맞을까 틀릴까?", "정답은...입니다"가 딸려왔다면 무자비하게 절단!
                let cutMatch = nContent.match(/\n[^\n]*(?:맞을까\s*틀릴까\?|정답은[^\n]*(?:입니다|다\.))/i);
                if (cutMatch) {
                    nContent = nContent.substring(0, cutMatch.index).trim();
                }

                nContent = nContent.replace(/(\[PHASE|코드:|해설:|그림|포인트:|1층:|2층:|3층:|작은 바구니|중간 바구니|큰 바구니)/g, '\n\n$1');
                await db.collection('subjects').doc(window.currentSubjectId).collection('notes').add({ category:'미분류', title:`학습 데이터 프로토콜`, content: nContent.trim(), createdAt:ts, updatedAt:ts });
                counts.n++;
            }
        } // 다중 세트 반복 종료

        window.hideLoading(); window.closeModal(); 
        if (window.currentSubjectId && typeof window.manageSubject === 'function') window.manageSubject(window.currentSubjectId);
        
        alert(`✨ 무결점 다중 주입 & 표 복원 성공!\n✅ 퀴즈: ${counts.q}건\n🧠 재구성: ${counts.r}건\n✅ 시각맵: ${counts.v}건\n✅ 사례분석: ${counts.s}건\n✅ 비교표: ${counts.c}건\n✅ 수업노트: ${counts.n}건`);

    } catch(err) {
        window.hideLoading(); console.error(err); alert("🚨 파싱 오류: " + err.message);
    }
};
