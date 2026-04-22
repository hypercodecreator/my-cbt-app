// =========================================================
// [v23.0.0] app-parser.js: Grice's Maxims Applied
// (No over-parsing, Strict clarity, Safe ungluing)
// =========================================================

window.showBulkAddModal = function() { 
    const m = document.getElementById('modal-container'); if(!m) return;
    m.innerHTML = `<div class="modal-backdrop" onclick="window.closeModal()"></div>
    <div class="modal" style="max-width:1000px; width:95%; background:#fff; border-radius:20px; padding:35px; box-shadow:0 10px 40px rgba(0,0,0,0.15); position:relative; z-index:100000;">
        <div style="text-align:center; margin-bottom:20px;">
            <h2 style="color:#4f46e5; margin-bottom:10px; font-size:1.8em;">🤖 퀀텀 스마트 주입기 (그라이스 격률 적용)</h2>
            <p style="color:#64748b; margin-bottom:10px;">모호한 유추를 버리고, <b>명료하고 있는 그대로의 데이터</b>만 완벽하게 분리합니다.</p>
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
        // L1 칩렛: 거대 7구역 순차 도려내기
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
        let s7 = extractSection(text, /7\.?\s*학습\s*데이터\s*프로토콜(?:.*?2\.4)?/i, null);

        const ts = firebase.firestore.FieldValue.serverTimestamp();
        let counts = {q:0, c:0, n:0, v:0, s:0};

        // [1] 핵심 리마인드 정리
        let coreRemind = s1.replace(/\[.*?\]/g, '').replace(/정답은.*?(입니다|다\.)/i, '').replace(/핵심\s*리마인드[:\s]*/i, '').trim();

        // 🚨 [2~3] 퀴즈 추출
        if (s23 || coreRemind) {
            let qObj = { category:'미분류', negativeType:'', text:'', answer:'', shortExplanation:'', explanation:'', mnemonic:'', mnemonicDesc:'', knowledgeNetwork:'', diagramFormula:'', options:[], optionImages:['','','','',''], images:[], pathLevels:[], keywords:[], tags:[], bookmarked:false, coreRemind: coreRemind };
            
            const qKeys = {
                type: /문제\s*유형[:\s]*/i, text: /질문\s*내용[:\s]*/i, ans: /정답(?!\s*및)[:\s]*/i, opts: /선택지[:\s]*/i,
                short: /(?:1줄\s*해설|해설\s*요약)[:\s]*/i, exp: /상세\s*해설[:\s]*/i, path: /목차\s*정보[:\s]*/i,
                mne: /암기\s*코드[:\s]*/i, mneD: /해석\s*및\s*풀이[:\s]*/i, knR: /지식\s*연결망[:\s]*/i,
                diag: /도식\s*및\s*핵심\s*(?:공식|원리)[:\s]*/i, kw: /키워드[:\s]*/i, tg: /태그[:\s]*/i
            };

            let qData = {};
            for (let k of Object.keys(qKeys)) {
                let startMatch = s23.match(qKeys[k]);
                if (!startMatch) { qData[k] = ''; continue; }
                let startIndex = startMatch.index + startMatch[0].length;
                let subText = s23.substring(startIndex);
                
                let closest = subText.length;
                for (let otherK of Object.keys(qKeys)) {
                    if (k === otherK) continue;
                    let m = subText.match(qKeys[otherK]);
                    if (m && m.index < closest) closest = m.index;
                }
                qData[k] = subText.substring(0, closest).trim();
            }

            // 🚨 태도의 격률: 오지랖 강제 변환 제거. 있는 그대로 입력!
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

        // [4] 시각적 구조화 가독성 복원
        if (s4) {
            let vContent = s4.replace(/(🗺️|⭕|중심 노드|좁은 QRS|넓은 QRS|기기 특성|교집합|일반 성인|임신부 영역|규칙적|불규칙적|좁규|넓규)/g, '\n\n$1');
            await db.collection('subjects').doc(window.currentSubjectId).collection('visualMaps').add({ category:'미분류', title:'시각적 구조화', content: vContent.trim(), createdAt:ts, updatedAt:ts });
            counts.v++;
        }

        // 🚨 [5] 사례 분석 (안전한 떡진 표 분해)
        if (s5) {
            let sObj = { title:'사례 분석', category:'미분류', sit_c:'', sit_n:'', pri_c:'', pri_n:'', sta_c:'', sta_n:'', pnt_c:'', pnt_n:'' };
            
            // 파이프(|)가 누락되어 떡진 경우, 알려진 헤더 앞에만 파이프를 안전하게 삽입
            let s5Clean = s5.replace(/([가-힣a-zA-Z0-9)])(상황|에너지\s*설정|작용\s*원리|판단\s*근거|생리적\s*상태|학습\s*포인트)\s*\|/g, '$1 | $2 |');
            let sCells = s5Clean.split(/\|/).map(s=>s.trim()).filter(Boolean);
            
            sCells = sCells.filter(s => !s.includes('구분') && !s.includes('구체적 사례') && !s.includes('비-사례') && !s.match(/^[-:=]+$/));
            
            for(let i=0; i<sCells.length; i+=3) {
                let k = sCells[i].replace(/\s+/g,'');
                let c = sCells[i+1]||''; let n = sCells[i+2]||'';
                if (k.includes('상황')) { sObj.sit_c = c; sObj.sit_n = n; }
                else if (k.includes('원리')||k.includes('진단')||k.includes('설정')||k.includes('판단')||k.includes('근거')) { sObj.pri_c = c; sObj.pri_n = n; }
                else if (k.includes('상태')||k.includes('처치')||k.includes('결과')||k.includes('이유')) { sObj.sta_c = c; sObj.sta_n = n; }
                else if (k.includes('포인트')) { sObj.pnt_c = c; sObj.pnt_n = n; }
            }
            if (sObj.sit_c || sObj.pri_c || sObj.sta_c || sObj.pnt_c) {
                sObj.createdAt = ts; sObj.updatedAt = ts;
                await db.collection('subjects').doc(window.currentSubjectId).collection('caseStudies').add(sObj);
                counts.s++;
            }
        }

        // 🚨 [6] 다단 비교표 (안전한 떡진 표 분해 - 'QRS 폭' 보호)
        if (s6) {
            let cObj = { title:'다단 비교표', category:'미분류', col1Name:'', col2Name:'', col3Name:'', col4Name:'', rows:[] };
            
            // QRS 폭 같은 단어를 파괴하지 않고, 100 J심방세동 처럼 단위 뒤에 붙은 단어만 안전하게 분해
            let s6Clean = s6.replace(/(J|초|s|점)\s*([가-힣A-Z])/g, '$1 | $2'); 
            s6Clean = s6Clean.replace(/(에너지|여부|시점|규칙성)\s*(PSVT|심방|심실|[A-Z]{2,})/g, '$1 | $2');

            let cCells = s6Clean.split(/\|/).map(s=>s.trim()).filter(Boolean).filter(s => !s.match(/^[-=]+$/));
            
            if(cCells.length >= 4) {
                cObj.col1Name = cCells[0]; cObj.col2Name = cCells[1]; cObj.col3Name = cCells[2]; cObj.col4Name = cCells[3];
                for(let i=4; i<cCells.length; i+=4) {
                    cObj.rows.push({
                        col1: cCells[i]||'-', col2: cCells[i+1]||'-', col3: cCells[i+2]||'', col4: cCells[i+3]||''
                    });
                }
            }
            if (cObj.rows.length > 0) {
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
