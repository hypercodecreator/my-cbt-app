// =========================================================
// [v24.0.0] app-parser.js: Grice & First Principles & Saussure
// (Zero Over-guessing, Structural Markdown Un-gluing)
// =========================================================

window.showBulkAddModal = function() { 
    const m = document.getElementById('modal-container'); if(!m) return;
    m.innerHTML = `<div class="modal-backdrop" onclick="window.closeModal()"></div>
    <div class="modal" style="max-width:1000px; width:95%; background:#fff; border-radius:20px; padding:35px; box-shadow:0 10px 40px rgba(0,0,0,0.15); position:relative; z-index:100000;">
        <div style="text-align:center; margin-bottom:20px;">
            <h2 style="color:#4f46e5; margin-bottom:10px; font-size:1.8em;">🤖 퀀텀 스마트 주입기 (그라이스 격률 적용)</h2>
            <p style="color:#64748b; margin-bottom:10px;">오지랖을 버렸습니다. 줄바꿈이 날아가고 글자가 떡져 있어도 <b>본질적인 구조</b>를 파악해 완벽하게 도려냅니다.</p>
            <p style="color:#ef4444; font-size:0.95em; font-weight:bold; background:#fee2e2; padding:10px; border-radius:8px;">🚨 붙여넣기 팁: AI에게 "사례분석과 비교표는 반드시 | 기호로 구분되는 마크다운 표로 출력해줘"라고 하시면 100% 성공합니다!</p>
        </div>
        <textarea id="bulk-input" style="width:100%; height:400px; padding:20px; border-radius:15px; border:2px solid #e2e8f0; font-family:'Consolas', monospace; line-height:1.6; font-size:1.05em; box-sizing:border-box; background:#f8fafc;" placeholder="여기에 텍스트를 통째로 붙여넣으세요..."></textarea>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-top:25px;">
            <button class="button primary-button" style="height:60px; font-size:1.2em; border-radius:12px; background:#4f46e5; border:none;" onclick="window.processUnifiedBulkAdd()">🚀 본질 구조 추출 시작</button>
            <button class="button light-button" style="height:60px; font-size:1.2em; border-radius:12px; border:2px solid #cbd5e1;" onclick="window.closeModal()">취소</button>
        </div>
    </div>`;
    m.classList.remove('hidden');
};

window.processUnifiedBulkAdd = async function() {
    const inputArea = document.getElementById('bulk-input'); if (!inputArea) return;
    let text = inputArea.value.replace(/[\u00A0\u200B-\u200D\uFEFF]/g, ' ').replace(/\*\*/g, '');
    if (!text.trim()) return alert("주입할 텍스트가 없습니다.");
    window.showLoading();

    try {
        // 🚨 1. 대분류 구조 강제 복원 (떡진 텍스트 도려내기)
        text = text.replace(/([^\n])([\[(]?1[\])]?\.?\s*(?:정답\s*및\s*)?핵심\s*리마인드)/i, '$1\n$2');
        text = text.replace(/([^\n])([\[(]?2[\])]?\.?\s*실전\s*대비)/i, '$1\n$2');
        text = text.replace(/([^\n])([\[(]?3[\])]?\.?\s*지식\s*재구성)/i, '$1\n$2');
        text = text.replace(/([^\n])([\[(]?4[\])]?\.?\s*시각적\s*구조화)/i, '$1\n$2');
        text = text.replace(/([^\n])([\[(]?5[\])]?\.?\s*사례\s*분석)/i, '$1\n$2');
        text = text.replace(/([^\n])([\[(]?6[\])]?\.?\s*다단\s*비교표)/i, '$1\n$2');
        text = text.replace(/([^\n])([\[(]?7[\])]?\.?\s*학습\s*데이터)/i, '$1\n$2');

        const extractSection = (str, startRegex, endRegex) => {
            let startMatch = str.match(startRegex);
            if (!startMatch) return '';
            let startIndex = startMatch.index + startMatch[0].length;
            let sub = str.substring(startIndex);
            if (!endRegex) return sub.trim();
            let endMatch = sub.match(endRegex);
            if (endMatch) return sub.substring(0, endMatch.index).trim();
            return sub.trim();
        };

        let s1 = extractSection(text, /1\.?\s*(?:정답\s*및\s*)?핵심\s*리마인드/i, /2\.?\s*실전\s*대비/i);
        let s23 = extractSection(text, /2\.?\s*실전\s*대비(?:.*?정리노트)?/i, /4\.?\s*시각적\s*구조화/i);
        let s4 = extractSection(text, /4\.?\s*시각적\s*구조화/i, /5\.?\s*사례\s*분석/i);
        let s5 = extractSection(text, /5\.?\s*사례\s*분석(?:.*?비-?사례)?/i, /6\.?\s*다단\s*비교표/i);
        let s6 = extractSection(text, /6\.?\s*다단\s*비교표/i, /7\.?\s*학습\s*데이터/i);
        let s7 = extractSection(text, /7\.?\s*학습\s*데이터(?:.*?프로토콜)?/i, null);

        const ts = firebase.firestore.FieldValue.serverTimestamp();
        let counts = {q:0, c:0, n:0, v:0, s:0};

        let coreRemind = s1.replace(/\[.*?\]/g, '').replace(/정답은.*?(입니다|다\.)/i, '').replace(/핵심\s*리마인드[:\s]*/i, '').trim();

        // 🚨 2. 퀴즈 파트 세부 도려내기 (오지랖 제거)
        if (s23 || coreRemind) {
            let qObj = { category:'미분류', negativeType:'', text:'', answer:'', shortExplanation:'', explanation:'', mnemonic:'', mnemonicDesc:'', knowledgeNetwork:'', diagramFormula:'', options:[], optionImages:['','','','',''], images:[], pathLevels:[], keywords:[], tags:[], bookmarked:false, coreRemind: coreRemind };
            
            const qKeys = [
                { k: 'type', r: /문제\s*유형[:\s]*/i }, { k: 'text', r: /질문\s*내용[:\s]*/i }, { k: 'ans', r: /정답(?!\s*및)[:\s]*/i },
                { k: 'opts', r: /선택지[:\s]*/i }, { k: 'short', r: /(?:1줄\s*해설|해설\s*요약)[:\s]*/i }, { k: 'exp', r: /상세\s*해설[:\s]*/i },
                { k: 'path', r: /목차\s*정보[:\s]*/i }, { k: 'mne', r: /암기\s*코드[:\s]*/i }, { k: 'mneD', r: /해석\s*및\s*풀이[:\s]*/i },
                { k: 'knR', r: /지식\s*연결망[:\s]*/i }, { k: 'diag', r: /도식\s*및\s*핵심\s*(?:공식|원리)[:\s]*/i },
                { k: 'kw', r: /키워드[:\s]*/i }, { k: 'tg', r: /태그[:\s]*/i }
            ];

            let qData = {};
            for (let i = 0; i < qKeys.length; i++) {
                let startMatch = s23.match(qKeys[i].r);
                if (!startMatch) { qData[qKeys[i].k] = ''; continue; }
                let startIndex = startMatch.index + startMatch[0].length;
                let subText = s23.substring(startIndex);
                
                let closest = subText.length;
                for (let j = 0; j < qKeys.length; j++) {
                    if (i === j) continue;
                    let m = subText.match(qKeys[j].r);
                    if (m && m.index < closest) closest = m.index;
                }
                qData[qKeys[i].k] = subText.substring(0, closest).trim();
            }

            // 그라이스 적용: 원본 텍스트 그대로 넣음! 강제 '1' 변환 폐기!
            if(qData.type) qObj.negativeType = qData.type; 
            if(qData.text) qObj.text = qData.text;
            if(qData.ans) qObj.answer = qData.ans.replace(/^\d+\)\s*/, '');
            if(qData.opts) {
                let optsArr = qData.opts.split(/(?:\([1-5]\)|[①-⑤]|\d\)\s+|\d\.\s+|^O\s+\(맞다\)|^X\s+\(틀리다\))/gm).map(s=>s.trim()).filter(Boolean);
                if(optsArr.length <= 1) optsArr = qData.opts.split('\n').map(s=>s.trim()).filter(Boolean);
                qObj.options = optsArr;
            }
            if(qData.short) qObj.shortExplanation = qData.short;
            if(qData.exp) qObj.explanation = qData.exp;
            if(qData.path) qObj.pathLevels = qData.path.split(/\n|,|단계:/).map(s=>s.trim().replace(/^\d+\s*/,'')).filter(Boolean);
            if(qData.mne) qObj.mnemonic = qData.mne;
            if(qData.mneD) qObj.mnemonicDesc = qData.mneD;
            if(qData.knR) qObj.knowledgeNetwork = qData.knR;
            if(qData.diag) qObj.diagramFormula = qData.diag;
            if(qData.kw) qObj.keywords = qData.kw.replace(/#/g,'').split(/[,|/]+|\s+/).map(s=>s.trim()).filter(Boolean);
            if(qData.tg) qObj.tags = qData.tg.replace(/#/g,'').split(/[,|/]+|\s+/).map(s=>s.trim()).filter(Boolean);

            if(!qObj.text) qObj.text = "질문 내용 없음 (스마트 주입)";
            qObj.createdAt = ts; qObj.updatedAt = ts;
            await db.collection('subjects').doc(window.currentSubjectId).collection('questions').add(qObj);
            counts.q++;
        }

        // 🚨 [4] 시각적 구조화 가독성 복원
        if (s4) {
            let vContent = s4.replace(/(🗺️|⭕|중심 노드|좁은 QRS|넓은 QRS|기기 특성|교집합|일반 성인|임신부 영역|규칙적|불규칙적|좁규|넓규)/g, '\n\n$1');
            await db.collection('subjects').doc(window.currentSubjectId).collection('visualMaps').add({ category:'미분류', title:'시각적 구조화', content: vContent.trim(), createdAt:ts, updatedAt:ts });
            counts.v++;
        }

        // 🚨 [5] 사례 분석 (소쉬르의 구조주의 표 분해 - 제목에 상관없이 위치로 매핑)
        if (s5) {
            let sObj = { title:'사례 분석', category:'미분류', sit_c:'', sit_n:'', pri_c:'', pri_n:'', sta_c:'', sta_n:'', pnt_c:'', pnt_n:'' };
            
            // 표가 떡진 경우 알려진 '기둥' 앞에만 엔터와 파이프를 삽입해 숨통을 틔워줌
            let s5Clean = s5.replace(/([^\n|])\s*(상황|작용\s*원리|판단\s*근거|에너지\s*설정|선택\s*에너지|생리적\s*상태|처치|학습\s*포인트|판단|결과|원리|상태|포인트|이유)\s*\|/g, '$1\n$2 |');
            
            let tableLines = s5Clean.split('\n').filter(l => l.includes('|'));
            let dataRows = [];
            tableLines.forEach(l => {
                if (l.replace(/\s+/g,'').includes('---|')) return;
                let cols = l.split('|').map(s=>s.trim());
                if(cols[0] === '') cols.shift();
                if(cols[cols.length-1] === '') cols.pop();
                if(!cols.join('').includes('구분') && !cols.join('').includes('구체적 사례')) {
                    dataRows.push(cols);
                }
            });

            if(dataRows.length > 0) {
                if(dataRows[0]) { sObj.sit_c = dataRows[0][1]||''; sObj.sit_n = dataRows[0][2]||''; }
                if(dataRows[1]) { sObj.pri_c = dataRows[1][1]||''; sObj.pri_n = dataRows[1][2]||''; }
                if(dataRows[2]) { sObj.sta_c = dataRows[2][1]||''; sObj.sta_n = dataRows[2][2]||''; }
                if(dataRows[3]) { sObj.pnt_c = dataRows[3][1]||''; sObj.pnt_n = dataRows[3][2]||''; }
            } else {
                sObj.sit_c = s5; // 심각하게 깨진 경우 통째로 보존
            }

            if (sObj.sit_c || sObj.pri_c) {
                sObj.createdAt = ts; sObj.updatedAt = ts;
                await db.collection('subjects').doc(window.currentSubjectId).collection('caseStudies').add(sObj);
                counts.s++;
            }
        }

        // 🚨 [6] 다단 비교표 (안전한 떡진 표 분해 - 'QRS 폭' 보호, 단위 뒤만 공략)
        if (s6) {
            let cObj = { title:'다단 비교표', category:'미분류', col1Name:'', col2Name:'', col3Name:'', col4Name:'', rows:[] };
            
            // QRS 폭 같은 단어를 파괴하지 않음. 에너지(J) 단위나 규칙성 같은 명확한 끝점 뒤에 한글/알파벳이 오면 분해
            let s6Clean = s6.replace(/(J|s|초|점|\)|에너지|여부|규칙성)\s*([가-힣A-Za-z])/g, '$1\n$2');

            let tableLines = s6Clean.split('\n').filter(l => l.includes('|'));
            let dataRows = [];
            tableLines.forEach(l => {
                if (l.replace(/\s+/g,'').includes('---|')) return;
                let cols = l.split('|').map(s=>s.trim());
                if(cols[0] === '') cols.shift();
                if(cols[cols.length-1] === '') cols.pop();
                dataRows.push(cols);
            });

            if (dataRows.length > 0) {
                let headers = dataRows[0];
                cObj.col1Name = headers[0] || '항목1'; cObj.col2Name = headers[1] || '항목2';
                cObj.col3Name = headers[2] || ''; cObj.col4Name = headers[3] || '';

                for (let i = 1; i < dataRows.length; i++) {
                    let dr = dataRows[i];
                    let c1 = dr[0]||'-'; let c2 = dr[1]||'-';
                    if(['없음','공백'].includes(c1.replace(/\s+/g,''))) c1 = '-';
                    if(['없음','공백'].includes(c2.replace(/\s+/g,''))) c2 = '-';
                    cObj.rows.push({ col1: c1, col2: c2, col3: dr[2]||'', col4: dr[3]||'' });
                }
                cObj.createdAt = ts; cObj.updatedAt = ts;
                await db.collection('subjects').doc(window.currentSubjectId).collection('comparisons').add(cObj);
                counts.c++;
            }
        }

        // [7] 일반 노트 가독성 복원
        if (s7) {
            let nContent = s7.replace(/(\[PHASE|코드:|해설:|그림|포인트:|1층:|2층:|3층:|작은 바구니|중간 바구니|큰 바구니)/g, '\n\n$1');
            await db.collection('subjects').doc(window.currentSubjectId).collection('notes').add({ category:'미분류', title:'학습 데이터 프로토콜', content: nContent.trim(), createdAt:ts, updatedAt:ts });
            counts.n++;
        }

        window.hideLoading(); window.closeModal(); 
        if (window.currentSubjectId && typeof window.manageSubject === 'function') window.manageSubject(window.currentSubjectId);
        
        alert(`✨ 제1원칙 퀀텀 주입 완벽 성공!\n✅ 퀴즈/재구성(리마인드): ${counts.q}건\n✅ 시각맵: ${counts.v}건\n✅ 사례분석: ${counts.s}건\n✅ 비교표: ${counts.c}건\n✅ 일반노트: ${counts.n}건`);

    } catch(err) {
        window.hideLoading(); console.error(err); alert("🚨 파싱 오류: " + err.message);
    }
};
