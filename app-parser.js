// =========================================================
// [v30.0.0] app-parser.js: Infinite Columns & Absolute Extraction
// =========================================================

window.showBulkAddModal = function() { 
    const m = document.getElementById('modal-container'); if(!m) return;
    m.innerHTML = `<div class="modal-backdrop" onclick="window.closeModal()"></div>
    <div class="modal" style="max-width:1000px; width:95%; background:#fff; border-radius:20px; padding:35px; box-shadow:0 10px 40px rgba(0,0,0,0.15); position:relative; z-index:100000;">
        <div style="text-align:center; margin-bottom:20px;">
            <h2 style="color:#4f46e5; margin-bottom:10px; font-size:1.8em;">🤖 퀀텀 스마트 주입기 (무한 테이블 확장판)</h2>
            <p style="color:#64748b; margin-bottom:10px;">표의 칸이 몇 개든 상관없습니다. 글자가 떡져있어도 절대 좌표로 찢어발깁니다.</p>
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
        let s2 = extractSection(text, /2\.?\s*실전\s*대비(?:.*?정리노트)?/i, /3\.?\s*지식\s*재구성/i);
        let s3 = extractSection(text, /3\.?\s*지식\s*재구성/i, /4\.?\s*시각적\s*구조화/i);
        let s4 = extractSection(text, /4\.?\s*시각적\s*구조화/i, /5\.?\s*사례\s*분석/i);
        let s5 = extractSection(text, /5\.?\s*사례\s*분석(?:.*?비-?사례)?/i, /6\.?\s*다단\s*비교표/i);
        let s6 = extractSection(text, /6\.?\s*다단\s*비교표/i, /7\.?\s*학습\s*데이터/i);
        let s7 = extractSection(text, /7\.?\s*학습\s*데이터(?:.*?프로토콜)?/i, null);

        const ts = firebase.firestore.FieldValue.serverTimestamp();
        let counts = {q:0, r:0, c:0, n:0, v:0, s:0};

        let coreRemind = s1.replace(/\[.*?\]/g, '').replace(/정답은.*?(입니다|다\.)/i, '').replace(/핵심\s*리마인드[:\s]*/i, '').trim();

        if (s2 || coreRemind) {
            let qObj = { category:'미분류', negativeType:'', text:'', answer:'', shortExplanation:'', explanation:'', options:[], optionImages:['','','','',''], images:[], pathLevels:[], bookmarked:false, coreRemind: coreRemind };
            const qKeys = [{ k: 'type', r: /문제\s*유형[:\s]*/i }, { k: 'text', r: /질문\s*내용[:\s]*/i }, { k: 'ans', r: /정답(?!\s*및)[:\s]*/i }, { k: 'opts', r: /선택지[:\s]*/i }, { k: 'short', r: /(?:1줄\s*해설|해설\s*요약)[:\s]*/i }, { k: 'exp', r: /상세\s*해설[:\s]*/i }, { k: 'path', r: /목차\s*정보[:\s]*/i }];
            let qData = {};
            for (let i = 0; i < qKeys.length; i++) {
                let m1 = s2.match(qKeys[i].r); if (!m1) { qData[qKeys[i].k] = ''; continue; }
                let subText = s2.substring(m1.index + m1[0].length); let closest = subText.length;
                for (let j = 0; j < qKeys.length; j++) { if (i === j) continue; let m2 = subText.match(qKeys[j].r); if (m2 && m2.index < closest) closest = m2.index; }
                qData[qKeys[i].k] = subText.substring(0, closest).trim();
            }
            if(qData.type) qObj.negativeType = qData.type; if(qData.text) qObj.text = qData.text; if(qData.ans) qObj.answer = qData.ans.replace(/^\d+\)\s*/, '');
            if(qData.opts) { let optsArr = qData.opts.split(/(?:\([1-5]\)|[①-⑤]|\d\)\s+|\d\.\s+|^O\s+\(맞다\)|^X\s+\(틀리다\))/gm).map(s=>s.trim()).filter(Boolean); if(optsArr.length <= 1) optsArr = qData.opts.split('\n').map(s=>s.trim()).filter(Boolean); qObj.options = optsArr; }
            if(qData.short) qObj.shortExplanation = qData.short; if(qData.exp) qObj.explanation = qData.exp;
            if(qData.path) qObj.pathLevels = qData.path.split(/(?:\s+-\s+|\s*>\s*|➔|->|\n|단계:)/).map(s=>s.trim().replace(/^\d+\s*/,'')).filter(Boolean);
            if(!qObj.text) qObj.text = "질문 내용 없음 (스마트 주입)"; qObj.createdAt = ts; qObj.updatedAt = ts;
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
                rData[rKeys[i].k] = subText.substring(0, closest).trim();
            }
            if(rData.mne) rObj.mnemonic = rData.mne; if(rData.mneD) rObj.mnemonicDesc = rData.mneD; if(rData.knR) rObj.knowledgeNetwork = rData.knR; if(rData.diag) rObj.diagramFormula = rData.diag;
            if(rData.kw) { rObj.keywords = rData.kw.replace(/#/g,'').split(/[,|/]+|\s+/).map(s=>s.trim()).filter(Boolean); if(rObj.keywords.length>0) rObj.title = rObj.keywords[0] + ' 지식 재구성'; }
            if(rData.tg) rObj.tags = rData.tg.replace(/#/g,'').split(/[,|/]+|\s+/).map(s=>s.trim()).filter(Boolean);
            rObj.createdAt = ts; rObj.updatedAt = ts; await db.collection('subjects').doc(window.currentSubjectId).collection('reconstructions').add(rObj); counts.r++;
        }

        if (s4) {
            let vContent = s4.replace(/(🗺️|⭕|중심 노드|좁은 QRS|넓은 QRS|기기 특성|교집합|일반 성인|임신부 영역|규칙적|불규칙적|좁규|넓규)/g, '\n\n$1');
            await db.collection('subjects').doc(window.currentSubjectId).collection('visualMaps').add({ category:'미분류', title:'시각적 구조화', content: vContent.trim(), createdAt:ts, updatedAt:ts });
            counts.v++;
        }

        // 🚨 [5] 사례 분석: 떡진 문자열 절대 좌표 추출 (가장 강력한 블록 도려내기)
        if (s5) {
            let sObj = { title:'사례 분석', category:'미분류', sit_c:'', sit_n:'', pri_c:'', pri_n:'', sta_c:'', sta_n:'', pnt_c:'', pnt_n:'' };
            let s5Clean = s5.replace(/[-=|]{3,}/g, ''); // 마크다운 선 완전 파괴

            // 키워드를 기준으로 그 사이의 문자열을 무식하게 뜯어오는 함수
            const extractRow = (txt, currReg, nextReg) => {
                let m = txt.match(currReg); if(!m) return ['', ''];
                let sub = txt.substring(m.index + m[0].length);
                if(nextReg) { let nm = sub.match(nextReg); if(nm) sub = sub.substring(0, nm.index); }
                let cols = sub.split('|').map(s=>s.trim());
                return [cols[0]||'', cols[1]||''];
            };

            let r1 = extractRow(s5Clean, /(상황)\s*\|?/, /(작용\s*원리|에너지\s*설정|판단\s*근거|생리적\s*상태|처치|결과|학습\s*포인트)\s*\|?/);
            let r2 = extractRow(s5Clean, /(작용\s*원리|에너지\s*설정|판단\s*근거)\s*\|?/, /(생리적\s*상태|상태|처치|결과|이유)\s*\|?/);
            let r3 = extractRow(s5Clean, /(생리적\s*상태|상태|처치|결과|이유)\s*\|?/, /(학습\s*포인트|포인트)\s*\|?/);
            let r4 = extractRow(s5Clean, /(학습\s*포인트|포인트)\s*\|?/, null);

            sObj.sit_c = r1[0]; sObj.sit_n = r1[1];
            sObj.pri_c = r2[0]; sObj.pri_n = r2[1];
            sObj.sta_c = r3[0]; sObj.sta_n = r3[1];
            sObj.pnt_c = r4[0]; sObj.pnt_n = r4[1];

            if (sObj.sit_c || sObj.pri_c || sObj.sta_c || sObj.pnt_c) {
                sObj.createdAt = ts; sObj.updatedAt = ts;
                await db.collection('subjects').doc(window.currentSubjectId).collection('caseStudies').add(sObj);
                counts.s++;
            }
        }

        // 🚨 [6] 다단 비교표: 사용자의 아이디어 적용 (무한 배열 저장 방식 도입)
        if (s6) {
            let cObj = { title:'다단 비교표', category:'미분류', headers:[], matrix:[] };
            let s6Clean = s6.replace(/(J|s|초|점|\)|에너지|여부|규칙성|적|음|조동|세동|빈맥)\s*([가-힣A-Za-z])/g, (m,p1,p2) => {
                if(p1==='S' && p2==='폭') return m; return p1+'\n'+p2;
            });
            let tableLines = s6Clean.split('\n').filter(l => l.includes('|'));
            let dataRows = [];
            tableLines.forEach(l => {
                if (l.replace(/\s+/g,'').includes('---|') || l.replace(/\s+/g,'').includes('===')) return;
                let cols = l.split('|').map(s=>s.trim());
                if(cols[0] === '') cols.shift(); if(cols[cols.length-1] === '') cols.pop();
                dataRows.push(cols);
            });

            if (dataRows.length > 0) {
                cObj.headers = dataRows.shift(); // 5칸이든 10칸이든 배열 통째로 헤더로 저장
                dataRows.forEach(dr => cObj.matrix.push(dr)); // 남은 데이터도 무한정 배열로 저장
            } else {
                cObj.headers = ['비교 항목', '내용']; cObj.matrix = [['⚠️ 표 깨짐', '데이터 복원 실패']];
            }
            cObj.createdAt = ts; cObj.updatedAt = ts;
            await db.collection('subjects').doc(window.currentSubjectId).collection('comparisons').add(cObj);
            counts.c++;
        }

        // 🚨 [7] 일반 노트 2.4 찌꺼기 제거
        if (s7) {
            let nContent = s7.replace(/^[\d\.\s]+/, ''); // 맨 앞의 2.4 등 버전 넘버 강제 청소
            nContent = nContent.replace(/(\[PHASE|코드:|해설:|그림|포인트:|1층:|2층:|3층:|작은 바구니|중간 바구니|큰 바구니)/g, '\n\n$1');
            await db.collection('subjects').doc(window.currentSubjectId).collection('notes').add({ category:'미분류', title:'학습 데이터 프로토콜', content: nContent.trim(), createdAt:ts, updatedAt:ts });
            counts.n++;
        }

        window.hideLoading(); window.closeModal(); 
        if (window.currentSubjectId && typeof window.manageSubject === 'function') window.manageSubject(window.currentSubjectId);
        
        alert(`✨ 퀀텀 주입 완벽 성공!\n✅ 퀴즈: ${counts.q}건\n🧠 재구성: ${counts.r}건\n✅ 시각맵: ${counts.v}건\n✅ 사례분석: ${counts.s}건\n✅ 비교표: ${counts.c}건\n✅ 수업노트: ${counts.n}건`);

    } catch(err) {
        window.hideLoading(); console.error(err); alert("🚨 파싱 오류: " + err.message);
    }
};
