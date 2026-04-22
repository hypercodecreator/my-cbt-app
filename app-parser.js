// =========================================================
// [v11.5.0] app-parser.js: Unbreakable 7-Step Protocol Parser
// (Tab-separated Table Auto-Split, Missing Item Handling)
// =========================================================

window.showBulkAddModal = function() { 
    const m = document.getElementById('modal-container'); if(!m) return;
    m.innerHTML = `<div class="modal-backdrop" onclick="window.closeModal()"></div>
    <div class="modal" style="max-width:1000px; width:95%; background:#fff; border-radius:20px; padding:35px; box-shadow:0 10px 40px rgba(0,0,0,0.15); position:relative; z-index:100000;">
        <div style="text-align:center; margin-bottom:20px;">
            <h2 style="color:#4f46e5; margin-bottom:10px; font-size:1.8em;">🤖 7단계 프로토콜 스마트 주입</h2>
            <p style="color:#64748b; margin-bottom:20px;">AI나 노션에서 작성한 <b>[1] 핵심리마인드 ~ [7] 학습 데이터 프로토콜</b> 데이터를 그대로 붙여넣으세요.<br>표(사례 분석, 비교표)도 복사+붙여넣기 하시면 탭(Tab)을 인식해 자동으로 표 형태로 쪼개집니다! (없음/공백은 자동 무시)</p>
        </div>
        <textarea id="bulk-input" style="width:100%; height:400px; padding:20px; border-radius:15px; border:2px solid #e2e8f0; font-family:'Consolas', monospace; line-height:1.6; font-size:1.05em; box-sizing:border-box; background:#f8fafc;" placeholder="[1] 핵심리마인드\n내용...\n\n[2] 실전대비 퀴즈 정리노트\n1. 문제 유형 : ..."></textarea>
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
        const lines = input.split('\n').map(l => l.trim());
        
        let counts = {q:0, c:0, n:0, v:0, s:0};
        let qObj = null, cObj = null, nObj = null, vObj = null, sObj = null;
        let mode = '', field = '', buffer = [];

        // 항목 추출 헬퍼
        const getAfter = (str, kw) => {
            const idx = str.indexOf(':');
            if(idx !== -1 && str.substring(0, idx).includes(kw)) return str.substring(idx+1).trim();
            const kwIdx = str.indexOf(kw);
            if(kwIdx !== -1) {
                let sub = str.substring(kwIdx + kw.length).trim();
                if(sub.match(/^[:\-=]/)) sub = sub.substring(1).trim();
                return sub;
            }
            return '';
        };

        const saveField = () => {
            if (!mode || !field) return;
            let val = buffer.join('\n').trim();
            // 🚨 무적 패치: "없음" 등의 단어를 공백으로 안전하게 처리
            if (val === '없음' || val === '공백' || val === '-') val = ''; 

            if (mode === 'Q' && qObj) {
                const map = { type: 'negativeType', text: 'text', ans: 'answer', short: 'shortExplanation', exp: 'explanation', mne: 'mnemonic', mneD: 'mnemonicDesc', knR: 'knowledgeNetwork', diag: 'diagramFormula' };
                if (map[field]) { qObj[map[field]] = val; }
                else if (field === 'options') {
                    if (!val) qObj.options = [];
                    else {
                        let opts = val.split(/(?:\([1-5]\)|[①-⑤]|\d\)\s+|\d\.\s+|^O\s+\(맞다\)|^X\s+\(틀리다\))/gm).map(s => s.trim()).filter(Boolean);
                        if (opts.length <= 1 && val.includes('\n')) opts = val.split('\n').map(s => s.trim()).filter(Boolean);
                        qObj.options = opts;
                    }
                }
                else if (field === 'path') { qObj.pathLevels = val ? val.split(/\n|,|단계:/).map(s => s.trim().replace(/^\d+\s*/, '')).filter(Boolean) : []; }
            } 
            else if (mode === 'N' && nObj) { if(val) nObj.content += (nObj.content?'\n':'') + val; }
            else if (mode === 'V' && vObj) { if(val) vObj.content += (vObj.content?'\n':'') + val; }
            buffer = [];
        };

        const flush = async () => {
            saveField(); const ts = firebase.firestore.FieldValue.serverTimestamp();
            
            // 🚨 무적 패치: 헤더만 트리거 되면 내용이 비어있어도 무조건 객체를 강제 생성
            if (qObj) { 
                if(!qObj.text) qObj.text = "질문 내용 없음 (스마트 주입)";
                if(qObj.answer) qObj.answer = qObj.answer.replace(/^\d+\)\s*/, ''); 
                qObj.updatedAt = ts; qObj.createdAt = ts; 
                await window.db.collection('subjects').doc(window.currentSubjectId).collection('questions').add(qObj); 
                counts.q++; qObj = null; 
            }
            if (cObj) { 
                if(!cObj.col1Name && cObj.rows.length === 0) cObj.rows.push({col1:'-', col2:'-', col3:'', col4:''});
                cObj.createdAt = ts; cObj.updatedAt = ts; 
                await window.db.collection('subjects').doc(window.currentSubjectId).collection('comparisons').add(cObj); 
                counts.c++; cObj = null; 
            }
            if (nObj) { 
                if(!nObj.content) nObj.content = "내용 없음";
                nObj.createdAt = ts; nObj.updatedAt = ts; 
                await window.db.collection('subjects').doc(window.currentSubjectId).collection('notes').add(nObj); 
                counts.n++; nObj = null; 
            }
            if (vObj) { 
                if(!vObj.content) vObj.content = "내용 없음";
                vObj.createdAt = ts; vObj.updatedAt = ts; 
                await window.db.collection('subjects').doc(window.currentSubjectId).collection('visualMaps').add(vObj); 
                counts.v++; vObj = null; 
            }
            if (sObj) { 
                if(!sObj.sit_c && !sObj.pri_c && !sObj.sta_c) sObj.sit_c = "내용 없음";
                sObj.createdAt = ts; sObj.updatedAt = ts; 
                await window.db.collection('subjects').doc(window.currentSubjectId).collection('caseStudies').add(sObj); 
                counts.s++; sObj = null; 
            }
        };

        for (let line of lines) {
            let clean = line.replace(/^[\s\-•]+/, '').trim();
            if(!clean) continue;

            // 🚨 대분류 트리거 (더욱 유연하게 매칭하여 괄호가 깨져도 인식)
            if (clean.match(/\[1\]\s*핵심|핵심\s*리마인드/i)) { await flush(); mode = 'N'; nObj = { category: '미분류', title: '핵심 리마인드', content: '' }; field = 'content'; continue; }
            else if (clean.match(/\[2\]\s*실전|실전\s*대비|퀴즈\s*정리/i)) { await flush(); mode = 'Q'; qObj = { negativeType:'', text:'', answer:'', shortExplanation:'', explanation:'', mnemonic:'', mnemonicDesc:'', knowledgeNetwork:'', diagramFormula:'', options:[], optionImages:['','','','',''], images:[], pathLevels:[], keywords:[], tags:[], bookmarked:false }; field = ''; continue; }
            else if (clean.match(/\[3\]\s*지식|지식\s*재구성/i)) { mode = 'Q'; continue; }
            else if (clean.match(/\[4\]\s*시각적|시각적\s*구조화/i)) { await flush(); mode = 'V'; vObj = { title: '시각적 구조화', category: '미분류', content: '' }; field = 'content'; continue; }
            else if (clean.match(/\[5\]\s*사례|사례\s*분석/i)) { await flush(); mode = 'S'; sObj = { title: '사례 분석', category: '미분류', sit_c:'', sit_n:'', pri_c:'', pri_n:'', sta_c:'', sta_n:'', pnt_c:'', pnt_n:'' }; continue; }
            else if (clean.match(/\[6\]\s*다단|다단\s*비교/i)) { await flush(); mode = 'C'; cObj = { title: '다단 비교표', col1Name: '', col2Name: '', col3Name: '', col4Name: '', rows: [] }; continue; }
            else if (clean.match(/\[7\]\s*학습|학습\s*데이터|프로토콜/i)) { await flush(); mode = 'N'; nObj = { category: '미분류', title: '학습 데이터 프로토콜', content: '' }; field = 'content'; continue; }

            if (mode === 'Q') {
                if (clean.match(/^1\.\s*문제\s*유형/)) { saveField(); field = 'type'; buffer = [getAfter(clean, '유형')]; }
                else if (clean.match(/^2\.\s*질문\s*내용/)) { saveField(); field = 'text'; buffer = [getAfter(clean, '내용')]; }
                else if (clean.match(/^3\.\s*정답/)) { saveField(); field = 'ans'; buffer = [getAfter(clean, '정답')]; }
                else if (clean.match(/^4\.\s*선택지/)) { saveField(); field = 'options'; buffer = [getAfter(clean, '선택지')]; }
                else if (clean.match(/^5\.\s*(1줄|해설\s*요약)/)) { saveField(); field = 'short'; buffer = [getAfter(clean, '해설')||getAfter(clean, '요약')]; }
                else if (clean.match(/^6\.\s*상세\s*해설/)) { saveField(); field = 'exp'; buffer = [getAfter(clean, '해설')]; }
                else if (clean.match(/^7\.\s*목차\s*정보/)) { saveField(); field = 'path'; buffer = [getAfter(clean, '정보')||getAfter(clean, '목차')]; }
                else if (clean.match(/^암기\s*코드/)) { saveField(); field = 'mne'; buffer = [getAfter(clean, '코드')]; }
                else if (clean.match(/^해석\s*및\s*풀이/)) { saveField(); field = 'mneD'; buffer = [getAfter(clean, '풀이')]; }
                else if (clean.match(/^지식\s*연결망/)) { saveField(); field = 'knR'; buffer = [getAfter(clean, '연결망')]; }
                else if (clean.match(/^도식\s*및\s*핵심\s*공식|^도식\s*및\s*핵심\s*원리/)) { saveField(); field = 'diag'; buffer = [getAfter(clean, '원리') || getAfter(clean, '공식')]; }
                else { buffer.push(clean); }
            }
            else if (mode === 'V' || mode === 'N') {
                buffer.push(clean);
            }
            else if (mode === 'S' && sObj) {
                if (clean.match(/구분|사례|---|비사례/)) continue;
                let p = clean.split(/\t|\|/).map(s=>s.trim()).filter(s=>s);
                if (p.length >= 2) {
                    let key = p[0]; let cText = p[1]; let nText = p[2] || '';
                    if (cText === '없음' || cText === '공백' || cText === '-') cText = '';
                    if (nText === '없음' || nText === '공백' || nText === '-') nText = '';
                    
                    if (key.match(/상황/)) { sObj.sit_c = cText; sObj.sit_n = nText; }
                    else if (key.match(/원리|진단|판단/)) { sObj.pri_c = cText; sObj.pri_n = nText; }
                    else if (key.match(/상태|처치/)) { sObj.sta_c = cText; sObj.sta_n = nText; }
                    else if (key.match(/포인트/)) { sObj.pnt_c = cText; sObj.pnt_n = nText; }
                } else {
                    if (clean.match(/상황/)) { sObj.sit_c += getAfter(clean, '상황'); }
                    else if (clean.match(/원리/)) { sObj.pri_c += getAfter(clean, '원리'); }
                    else if (clean.match(/상태|처치/)) { sObj.sta_c += getAfter(clean, '상태') || getAfter(clean, '처치'); }
                    else if (clean.match(/포인트/)) { sObj.pnt_c += getAfter(clean, '포인트'); }
                }
            }
            else if (mode === 'C' && cObj) {
                if (clean.match(/---|===/)) continue;
                let cols = clean.split(/\t|\|/).map(s=>s.trim()).filter(s=>s);
                if (cols.length >= 2) { 
                    if (!cObj.col1Name && !cols[0].match(/항목/)) { 
                        for(let i=0; i<cols.length && i<4; i++) cObj[`col${i+1}Name`] = cols[i]; 
                    } 
                    else if (cObj.col1Name || cols[0].match(/항목/)) {
                        if(cols[0].match(/항목/)) { 
                            for(let i=0; i<cols.length && i<4; i++) cObj[`col${i+1}Name`] = cols[i].replace(/비교\s*항목/g, '').trim() || `항목${i+1}`; 
                        } 
                        else { 
                            let c1 = cols[0]==='없음'||cols[0]==='공백'?'-':cols[0];
                            let c2 = cols[1]==='없음'||cols[1]==='공백'?'-':cols[1];
                            cObj.rows.push({ col1: c1, col2: c2, col3: cols[2]||'', col4: cols[3]||'' }); 
                        }
                    }
                }
            }
        }
        
        await flush(); 
        window.hideLoading(); 
        window.closeModal(); 
        if (window.currentSubjectId && typeof window.manageSubject === 'function') window.manageSubject(window.currentSubjectId);
        
        // 🚨 성공 팝업창 띄우기
        alert(`✨ 스마트 주입 완료!\n✅ 문제: ${counts.q}건\n✅ 시각맵: ${counts.v}건\n✅ 사례분석: ${counts.s}건\n✅ 비교표: ${counts.c}건\n✅ 노트: ${counts.n}건`);

    } catch (err) {
        window.hideLoading();
        console.error("스마트 파서 에러:", err);
        alert("🚨 파싱 중 오류가 발생했습니다. 개발자 도구를 확인하세요.\n에러 내용: " + err.message);
    }
};
