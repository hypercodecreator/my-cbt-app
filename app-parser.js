// =========================================================
// [v36.0.0] app-parser.js: Surgical Precision Ungluing
// (No more false positive splits. Only targets glued boundaries)
// =========================================================

window.showBulkAddModal = function() { 
    const m = document.getElementById('modal-container'); if(!m) return;
    m.innerHTML = `<div class="modal-backdrop" onclick="window.closeModal()"></div>
    <div class="modal" style="max-width:1000px; width:95%; background:#fff; border-radius:20px; padding:35px; box-shadow:0 10px 40px rgba(0,0,0,0.15); position:relative; z-index:100000;">
        <div style="text-align:center; margin-bottom:20px;">
            <h2 style="color:#4f46e5; margin-bottom:10px; font-size:1.8em;">🤖 퀀텀 스마트 주입기 (마스터피스)</h2>
            <p style="color:#64748b; margin-bottom:10px;">완벽한 마크다운 표는 절대 건드리지 않으며, 떡진 텍스트만 정밀 타겟팅하여 복원합니다.</p>
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

        // 🧠 범용 파서: | 기호 또는 \t 기호로 표를 분해
        const parseUniversalTable = (textBlock) => {
            let lines = textBlock.split('\n');
            let rows = [];
            lines.forEach(l => {
                if (l.replace(/\s+/g,'').match(/^[-=|]+$/)) return;
                let cols = l.split(/\||\t/).map(s=>s.trim());
                if (cols.length > 0 && cols[0] === '') cols.shift();
                if (cols.length > 0 && cols[cols.length-1] === '') cols.pop();
                if (cols.length >= 2) rows.push(cols);
            });
            return rows;
        };

        // 🚨 [5] 사례 분석: 정밀 타겟팅 심폐소생술
        if (s5) {
            let sObj = { title:'사례 분석', category:'미분류', sit_c:'', sit_n:'', pri_c:'', pri_n:'', sta_c:'', sta_n:'', pnt_c:'', pnt_n:'' };
            let s5Clean = s5.replace(/[-=|]{3,}/g, ''); // 쓸데없는 마크다운 선만 조용히 날림
            
            // 💡 외과 수술: 앞 문장 끝과 다음 줄 제목이 붙어있는 곳만 정확히 찢어서 엔터(\n) 주입!
            s5Clean = s5Clean.replace(/([^\n|])\s*(상황|작용\s*원리|에너지\s*설정|판단\s*근거|생리적\s*상태|학습\s*포인트)\s*\|/g, '$1 |\n$2 |');
            
            let dataRows = parseUniversalTable(s5Clean);

            if (dataRows.length > 0) {
                dataRows.forEach(row => {
                    let k = (row[0] || '').replace(/\s+/g,'');
                    if(k.includes('구분') || k.includes('구체적사례')) return; // 제목줄 스킵
                    
                    let c = row[1] || ''; let n = row[2] || '';
                    if(['없음','공백','-','해당없음'].includes(c.replace(/\s+/g,''))) c = '';
                    if(['없음','공백','-','해당없음'].includes(n.replace(/\s+/g,''))) n = '';

                    // 유동적 단어 매핑 (판단 근거 -> 생리적 상태로 맵핑 등)
                    if (k.includes('상황')) { sObj.sit_c = c; sObj.sit_n = n; }
                    else if (k.match(/원리|진단|설정|에너지|작동/)) { sObj.pri_c = c; sObj.pri_n = n; }
                    else if (k.match(/상태|처치|결과|이유|근거|판단/)) { sObj.sta_c = c; sObj.sta_n = n; }
                    else if (k.match(/포인트/)) { sObj.pnt_c = c; sObj.pnt_n = n; }
                });
            } else {
                sObj.sit_c = s5.trim();
                sObj.sit_n = "⚠️ 표 데이터 인식 실패. AI에게 마크다운 표 출력을 요청하세요.";
            }

            if (sObj.sit_c || sObj.pri_c || sObj.sta_c || sObj.pnt_c) {
                sObj.createdAt = ts; sObj.updatedAt = ts;
                await db.collection('subjects').doc(window.currentSubjectId).collection('caseStudies').add(sObj);
                counts.s++;
            }
        }

        // 🚨 [6] 다단 비교표: 정밀 타겟팅 심폐소생술 (괄호 찢김 완벽 방지)
        if (s6) {
            let cObj = { title:'다단 비교표', category:'미분류', headers:[], matrix:[] };
            let s6Clean = s6.replace(/[-=|]{3,}/g, ''); // 쓸데없는 마크다운 선 날림

            // 💡 외과 수술: (J|에너지) 뒤에 (PSVT|심방|심실)이 바로 붙어있을 때만 찢어서 엔터(\n) 주입!
            // 이렇게 하면 (Biphasic) 에너지 같은 멀쩡한 제목은 절대 찢어지지 않습니다.
            s6Clean = s6Clean.replace(/(J|에너지|여부|규칙성|적|음|조동|세동|빈맥)\s*(PSVT|심방|심실|정상|비정상|동성|단형|다형)/g, '$1 |\n$2');

            let dataRows = parseUniversalTable(s6Clean);

            if (dataRows.length > 0) {
                cObj.headers = dataRows.shift(); // 첫 줄은 무조건 헤더 배열로 통째로 저장 (5칸 완벽 보존)
                dataRows.forEach(dr => {
                    cObj.matrix.push({ items: dr }); // 데이터도 무한정 배열로 저장
                });
            } else {
                cObj.headers = ['비교 항목', '내용']; 
                cObj.matrix = [{ items: ['⚠️ 표 깨짐', '데이터 복원 실패'] }];
            }
            cObj.createdAt = ts; cObj.updatedAt = ts;
            await db.collection('subjects').doc(window.currentSubjectId).collection('comparisons').add(cObj);
            counts.c++;
        }

        // [7] 일반 노트 (2.4 찌꺼기 완벽 청소)
        if (s7) {
            let nContent = s7.replace(/^[\s\S]*?(?=\[PHASE)/i, ''); // [PHASE 가 나오기 전의 모든 텍스트(예: 2.4) 증발!
            nContent = nContent.replace(/(\[PHASE|코드:|해설:|그림|포인트:|1층:|2층:|3층:|작은 바구니|중간 바구니|큰 바구니)/g, '\n\n$1');
            await db.collection('subjects').doc(window.currentSubjectId).collection('notes').add({ category:'미분류', title:'학습 데이터 프로토콜', content: nContent.trim(), createdAt:ts, updatedAt:ts });
            counts.n++;
        }

        window.hideLoading(); window.closeModal(); 
        if (window.currentSubjectId && typeof window.manageSubject === 'function') window.manageSubject(window.currentSubjectId);
        
        alert(`✨ 무결점 퀀텀 주입 완벽 성공!\n✅ 퀴즈: ${counts.q}건\n🧠 재구성: ${counts.r}건\n✅ 시각맵: ${counts.v}건\n✅ 사례분석: ${counts.s}건\n✅ 비교표: ${counts.c}건\n✅ 수업노트: ${counts.n}건`);

    } catch(err) {
        window.hideLoading(); console.error(err); alert("🚨 파싱 오류: " + err.message);
    }
};
