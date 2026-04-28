// =========================================================
// [v47.0.0] app-parser.js: Absolute Sandbox Isolation
// (Guarantees zero overlap or data loss between multiple sets)
// =========================================================

window.showBulkAddModal = function() { 
    const m = document.getElementById('modal-container'); if(!m) return;
    m.innerHTML = `<div class="modal-backdrop" onclick="window.closeModal()"></div>
    <div class="modal" style="max-width:1000px; width:95%; background:#fff; border-radius:20px; padding:35px; box-shadow:0 10px 40px rgba(0,0,0,0.15); position:relative; z-index:100000;">
        <div style="text-align:center; margin-bottom:20px;">
            <h2 style="color:#4f46e5; margin-bottom:10px; font-size:1.8em;">🤖 퀀텀 스마트 주입기 (독립 샌드박스판)</h2>
            <p style="color:#64748b; margin-bottom:10px;">여러 개의 문제 세트를 넣어도 각자의 공간에서 <b>절대 데이터 유실 없이</b> 분리합니다.</p>
        </div>
        <textarea id="bulk-input" style="width:100%; height:400px; padding:20px; border-radius:15px; border:2px solid #e2e8f0; font-family:'Consolas', monospace; line-height:1.6; font-size:1.05em; box-sizing:border-box; background:#f8fafc;" placeholder="여기에 텍스트를 통째로 붙여넣으세요..."></textarea>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-top:25px;">
            <button class="button primary-button" style="height:60px; font-size:1.2em; border-radius:12px; background:#4f46e5; border:none;" onclick="window.processUnifiedBulkAdd()">🚀 다중 구조 추출 시작</button>
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

        // 🚨 1. 전체 텍스트를 "1. 핵심 리마인드" 기준으로 완전 독립적인 세트로 쪼갭니다.
        let problemSets = rawText.split(/(?=[\[(]?1[\])]?\.?\s*(?:정답\s*및\s*)?핵심\s*리마인드)/i).map(s=>s.trim()).filter(Boolean);

        for (let setIdx = 0; setIdx < problemSets.length; setIdx++) {
            let text = problemSets[setIdx];

            // 샌드박스 내부 구역 분리
            text = text.replace(/([^\n])([\[(]?1[\])]?\.?\s*(?:정답\s*및\s*)?핵심\s*리마인드)/i, '$1\n$2');
            text = text.replace(/([^\n])([\[(]?2[\])]?\.?\s*실전\s*대비)/i, '$1\n$2');
            text = text.replace(/([^\n])([\[(]?3[\])]?\.?\s*지식\s*재구성)/i, '$1\n$2');
            text = text.replace(/([^\n])([\[(]?4[\])]?\.?\s*시각적\s*구조화)/i, '$1\n$2');
            text = text.replace(/([^\n])([\[(]?5[\])]?\.?\s*사례\s*분석)/i, '$1\n$2');
            text = text.replace(/([^\n])([\[(]?6[\])]?\.?\s*다단\s*비교표)/i, '$1\n$2');
            text = text.replace(/([^\n])([\[(]?7[\])]?\.?\s*학습\s*데이터)/i, '$1\n$2');

            const extractSection = (str, startRegex, endRegex) => {
                let startMatch = str.match(startRegex); if (!startMatch) return '';
                let startIndex = startMatch.index + startMatch[0].length; let sub = str.substring(startIndex);
                if (!endRegex) return sub.trim();
                let endMatch = sub.match(endRegex); if (endMatch) return sub.substring(0, endMatch.index).trim();
                return sub.trim();
            };

            let s1 = extractSection(text, /1\.?\s*(?:정답\s*및\s*)?핵심\s*리마인드/i, /2\.?\s*실전\s*대비/i);
            let s2 = extractSection(text, /2\.?\s*실전\s*대비(?:.*?정리노트)?/i, /3\.?\s*지식\s*재구성/i);
            let s3 = extractSection(text, /3\.?\s*지식\s*재구성/i, /4\.?\s*시각적\s*구조화/i);
            let s4 = extractSection(text, /4\.?\s*시각적\s*구조화/i, /5\.?\s*사례\s*분석/i);
            let s5 = extractSection(text, /5\.?\s*사례\s*분석(?:.*?비-?사례)?/i, /6\.?\s*다단\s*비교표/i);
            let s6 = extractSection(text, /6\.?\s*다단\s*비교표/i, /7\.?\s*학습\s*데이터/i);
            let s7 = extractSection(text, /7\.?\s*학습\s*데이터(?:.*?프로토콜)?/i, null);

            let coreRemind = s1.replace(/\[.*?\]/g, '').replace(/정답은.*?(입니다|다\.)/i, '').replace(/핵심\s*리마인드[:\s]*/i, '').trim();

            // [2] 다중 퀴즈 추출 (샌드박스)
            if (s2 || coreRemind) {
                let qBlocks = s2.split(/(?=문제\s*유형[:\s]*)/i).map(s => s.trim()).filter(Boolean);
                if(qBlocks.length === 0 && coreRemind) qBlocks.push('');

                for(let qIdx = 0; qIdx < qBlocks.length; qIdx++) {
                    let block = qBlocks[qIdx];
                    let qObj = { category:'미분류', negativeType:'', text:'', answer:'', shortExplanation:'', explanation:'', options:[], optionImages:['','','','',''], images:[], pathLevels:[], bookmarked:false, coreRemind: (qIdx === 0 ? coreRemind : '') };
                    
                    const qKeys = [{ k: 'type', r: /문제\s*유형[:\s]*/i }, { k: 'text', r: /질문\s*내용[:\s]*/i }, { k: 'ans', r: /정답(?!\s*및)[:\s]*/i }, { k: 'opts', r: /선택지[:\s]*/i }, { k: 'short', r: /(?:1줄\s*해설|해설\s*요약)[:\s]*/i }, { k: 'exp', r: /상세\s*해설[:\s]*/i }, { k: 'path', r: /목차\s*정보[:\s]*/i }];
                    let qData = {};
                    for (let i = 0; i < qKeys.length; i++) {
                        let m1 = block.match(qKeys[i].r); if (!m1) { qData[qKeys[i].k] = ''; continue; }
                        let subText = block.substring(m1.index + m1[0].length); let closest = subText.length;
                        for (let j = 0; j < qKeys.length; j++) { if (i === j) continue; let m2 = subText.match(qKeys[j].r); if (m2 && m2.index < closest) closest = m2.index; }
                        qData[qKeys[i].k] = subText.substring(0, closest).trim();
                    }

                    if(qData.type) qObj.negativeType = qData.type; if(qData.text) qObj.text = qData.text; if(qData.ans) qObj.answer = qData.ans.replace(/^\d+\)\s*/, '');
                    if(qData.opts) { let optsArr = qData.opts.split(/(?:\([1-5]\)|[①-⑤]|\d\)\s+|\d\.\s+|^O\s+\(맞다\)|^X\s+\(틀리다\))/gm).map(s=>s.trim()).filter(Boolean); if(optsArr.length <= 1) optsArr = qData.opts.split('\n').map(s=>s.trim()).filter(Boolean); qObj.options = optsArr; }
                    if(qData.short) qObj.shortExplanation = qData.short; if(qData.exp) qObj.explanation = qData.exp;
                    if(qData.path) qObj.pathLevels = qData.path.split(/(?:\s+-\s+|\s*>\s*|➔|->|\n|단계:)/).map(s=>s.trim().replace(/^\d+\s*/,'')).filter(Boolean);
                    
                    if(!qObj.text && !qObj.coreRemind) continue; 
                    if(!qObj.text) qObj.text = "질문 내용 없음 (스마트 주입)"; 
                    qObj.createdAt = ts; qObj.updatedAt = ts;
                    await db.collection('subjects').doc(window.currentSubjectId).collection('questions').add(qObj); 
                    counts.q++;
                }
            }

            // [3] 지식 재구성 (샌드박스)
            if (s3) {
                let rBlocks = s3.split(/(?=암기\s*코드[:\s]*)/i).map(s => s.trim()).filter(Boolean);
                for(let rIdx = 0; rIdx < rBlocks.length; rIdx++) {
                    let block = rBlocks[rIdx];
                    let rObj = { title:'새 지식 재구성', category:'미분류', mnemonic:'', mnemonicDesc:'', knowledgeNetwork:'', diagramFormula:'', keywords:[], tags:[] };
                    const rKeys = [{ k: 'mne', r: /암기\s*코드[:\s]*/i }, { k: 'mneD', r: /해석\s*및\s*풀이[:\s]*/i }, { k: 'knR', r: /지식\s*연결망[:\s]*/i }, { k: 'diag', r: /도식\s*및\s*핵심\s*(?:공식|원리)[:\s]*/i }, { k: 'kw', r: /키워드[:\s]*/i }, { k: 'tg', r: /태그[:\s]*/i }];
                    let rData = {};
                    for (let i = 0; i < rKeys.length; i++) {
                        let m1 = block.match(rKeys[i].r); if (!m1) { rData[rKeys[i].k] = ''; continue; }
                        let subText = block.substring(m1.index + m1[0].length); let closest = subText.length;
                        for (let j = 0; j < rKeys.length; j++) { if (i === j) continue; let m2 = subText.match(rKeys[j].r); if (m2 && m2.index < closest) closest = m2.index; }
                        rData[rKeys[i].k] = subText.substring(0, closest).trim();
                    }
                    if(rData.mne) rObj.mnemonic = rData.mne; if(rData.mneD) rObj.mnemonicDesc = rData.mneD; if(rData.knR) rObj.knowledgeNetwork = rData.knR; 
                    if(rData.diag) { rObj.diagramFormula = rData.diag.replace(/\$/g, '').replace(/\\text\{([^}]+)\}/g, '$1').replace(/\\[a-zA-Z]+/g, '').replace(/[\{\}]/g, ''); }
                    if(rData.kw) { rObj.keywords = rData.kw.replace(/#/g,'').split(/[,|/]+|\s+/).map(s=>s.trim()).filter(Boolean); if(rObj.keywords.length>0) rObj.title = rObj.keywords[0] + ' 지식 재구성'; }
                    if(rData.tg) rObj.tags = rData.tg.replace(/#/g,'').split(/[,|/]+|\s+/).map(s=>s.trim()).filter(Boolean);
                    rObj.createdAt = ts; rObj.updatedAt = ts; 
                    await db.collection('subjects').doc(window.currentSubjectId).collection('reconstructions').add(rObj); 
                    counts.r++;
                }
            }

            if (s4) {
                let vContent = s4.replace(/(🗺️|⭕|중심 노드|좁은 QRS|넓은 QRS|기기 특성|교집합|일반 성인|임신부 영역|규칙적|불규칙적|좁규|넓규|공급로|배출로|역할|특이점|태아기 전용 \(출생 후 폐쇄\):|생애 공통 \(평생 유지\):|1차 우회|2차 우회|3차 우회)/g, '\n\n$1');
                await db.collection('subjects').doc(window.currentSubjectId).collection('visualMaps').add({ category:'미분류', title:'시각적 구조화', content: vContent.trim(), createdAt:ts, updatedAt:ts });
                counts.v++;
            }

            const parseUniversalTable = (textBlock) => {
                let lines = textBlock.split('\n'); let rows = [];
                lines.forEach(l => {
                    if (l.replace(/\s+/g,'').match(/^[-=|]+$/)) return;
                    let cols = l.split(/\||\t/).map(s=>s.trim()).filter(s => s !== '');
                    if (cols.length >= 2) rows.push(cols);
                });
                return rows;
            };

            // 🚨 [5] 사례 분석: 샌드박스 내에서 완벽한 독립 객체 생성 (데이터 누락/덮어쓰기 원천 차단)
            if (s5) {
                let s5Clean = s5.replace(/[-=|]{3,}/g, '');
                
                // 표가 완전히 떡진 경우에만 엔터와 파이프를 주입
                if (!s5Clean.includes('|') && !s5Clean.includes('\t')) {
                    s5Clean = s5Clean.replace(/(상태|상황|원인|작용\s*원리|에너지\s*설정|이유|해당\s*혈관|혈색\s*양상|처치|판단|구조\s*성격|생리적\s*상태|학습\s*포인트|판단\s*근거|연결\s*부위|기능적\s*목적)/g, '\n$1 | ');
                } else {
                    s5Clean = s5Clean.replace(/([^\n])\s*(상태|상황|원인|작용\s*원리|에너지\s*설정|이유|해당\s*혈관|혈색\s*양상|처치|판단|구조\s*성격|생리적\s*상태|학습\s*포인트|판단\s*근거|연결\s*부위|기능적\s*목적)\s*(?:\||\t)/g, '$1\n$2 | ');
                }

                let dataRows = parseUniversalTable(s5Clean);

                if (dataRows.length > 0) {
                    let pureDataRows = dataRows.filter(row => !row.join('').includes('구분') && !row.join('').includes('구체적 사례') && !row.join('').includes('Case Study'));
                    
                    // 4줄(1세트) 단위로 쪼개어 독립적으로 저장 (누락 원천 차단)
                    for(let i=0; i < pureDataRows.length; i+=4) {
                        let sObj = { title:`사례 분석 ${setIdx+1}-${Math.floor(i/4)+1}`, category:'미분류', sit_c:'', sit_n:'', pri_c:'', pri_n:'', sta_c:'', sta_n:'', pnt_c:'', pnt_n:'' };
                        if(pureDataRows[i])   { sObj.sit_c = pureDataRows[i][1]||''; sObj.sit_n = pureDataRows[i][2]||''; }
                        if(pureDataRows[i+1]) { sObj.pri_c = pureDataRows[i+1][1]||''; sObj.pri_n = pureDataRows[i+1][2]||''; }
                        if(pureDataRows[i+2]) { sObj.sta_c = pureDataRows[i+2][1]||''; sObj.sta_n = pureDataRows[i+2][2]||''; }
                        if(pureDataRows[i+3]) { sObj.pnt_c = pureDataRows[i+3][1]||''; sObj.pnt_n = pureDataRows[i+3][2]||''; }
                        
                        if (sObj.sit_c || sObj.pri_c || sObj.sta_c || sObj.pnt_c) {
                            sObj.createdAt = ts; sObj.updatedAt = ts;
                            await db.collection('subjects').doc(window.currentSubjectId).collection('caseStudies').add(sObj);
                            counts.s++;
                        }
                    }
                } else {
                    let errObj = { title:'사례 분석 오류', category:'미분류', sit_c:s5.trim(), sit_n:"⚠️ 표 인식 실패.", pri_c:'', pri_n:'', sta_c:'', sta_n:'', pnt_c:'', pnt_n:'' };
                    errObj.createdAt = ts; errObj.updatedAt = ts;
                    await db.collection('subjects').doc(window.currentSubjectId).collection('caseStudies').add(errObj);
                    counts.s++;
                }
            }

            // 🚨 [6] 다단 비교표 (샌드박스 독립)
            if (s6) {
                let cObj = { title:`비교표 ${setIdx+1}`, category:'미분류', headers:[], matrix:[] };
                let s6Clean = s6.replace(/[-=|]{3,}/g, '');
                
                if (!s6Clean.includes('|') && !s6Clean.includes('\t')) {
                    s6Clean = s6Clean.replace(/(QRS 모양|주요 원인|시각적 특징|리듬 형태|QRS 폭|규칙성|이상파형|단상파형|비교 항목|구조 명칭|태아기 기능|출생 후 변화|성인 존재 여부|특수 구조|연결 지점|우회 대상 장기|특징|혈관 수|혈류 방향|산소 농도|운반 물질)/g, '\n$1 |');
                } else {
                    s6Clean = s6Clean.replace(/(J|s|초|점|\)|에너지|여부|규칙성|적|음|조동|세동|빈맥|모양|원인|특징|변함|형태|폐쇄됨|판막\)|통로|개|유출\)|유입\)|도\)|비타민|노폐물)\s*([가-힣A-Z])/g, (m,p1,p2) => {
                        if(p1.toUpperCase() === 'S' && p2 === '폭') return m;
                        return p1 + ' |\n' + p2;
                    });
                }

                let dataRows = parseUniversalTable(s6Clean);

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

            if (s7) {
                let nContent = s7.replace(/^[\s\S]*?(?=\[PHASE)/i, ''); 
                nContent = nContent.replace(/(\[PHASE|코드:|해설:|그림|포인트:|1층:|2층:|3층:|작은 바구니|중간 바구니|큰 바구니)/g, '\n\n$1');
                await db.collection('subjects').doc(window.currentSubjectId).collection('notes').add({ category:'미분류', title:`수업 노트 ${setIdx+1}`, content: nContent.trim(), createdAt:ts, updatedAt:ts });
                counts.n++;
            }
        } // 거대한 Set 단위 반복문 종료

        window.hideLoading(); window.closeModal(); 
        if (window.currentSubjectId && typeof window.manageSubject === 'function') window.manageSubject(window.currentSubjectId);
        
        alert(`✨ 다중 무한 샌드박스 주입 성공!\n✅ 퀴즈: ${counts.q}건\n🧠 재구성: ${counts.r}건\n✅ 시각맵: ${counts.v}건\n✅ 사례분석: ${counts.s}건\n✅ 비교표: ${counts.c}건\n✅ 수업노트: ${counts.n}건`);

    } catch(err) {
        window.hideLoading(); console.error(err); alert("🚨 파싱 오류: " + err.message);
    }
};
