// =========================================================
// [v16.5.0] app-parser.js: Readability Restorer & Core Remind Integration
// =========================================================

window.showBulkAddModal = function() { 
    const m = document.getElementById('modal-container'); if(!m) return;
    m.innerHTML = `<div class="modal-backdrop" onclick="window.closeModal()"></div>
    <div class="modal" style="max-width:1000px; width:95%; background:#fff; border-radius:20px; padding:35px; box-shadow:0 10px 40px rgba(0,0,0,0.15); position:relative; z-index:100000;">
        <div style="text-align:center; margin-bottom:20px;">
            <h2 style="color:#4f46e5; margin-bottom:10px; font-size:1.8em;">🚀 1-Click 스마트 만능 주입기</h2>
            <p style="color:#64748b; margin-bottom:10px;">AI에서 복사한 데이터를 <b>여기에 단 한 번만 통째로 붙여넣으세요!</b></p>
            <p style="color:#ef4444; font-size:0.95em; font-weight:bold; background:#fee2e2; padding:10px; border-radius:8px;">🚨 꿀팁: 텍스트가 줄바꿈 없이 떡져서 복사되어도 AI가 알아서 보기 좋게 복원합니다!</p>
        </div>
        <textarea id="bulk-input" style="width:100%; height:400px; padding:20px; border-radius:15px; border:2px solid #e2e8f0; font-family:'Consolas', monospace; line-height:1.6; font-size:1.05em; box-sizing:border-box; background:#f8fafc;" placeholder="여기에 한 번에 싹 다 붙여넣으세요!"></textarea>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-top:25px;">
            <button class="button primary-button" style="height:60px; font-size:1.2em; border-radius:12px; background:#4f46e5; border:none;" onclick="window.processUnifiedBulkAdd()">✨ 데이터 분석 및 7단계 자동 분리 저장</button>
            <button class="button light-button" style="height:60px; font-size:1.2em; border-radius:12px; border:2px solid #cbd5e1;" onclick="window.closeModal()">취소</button>
        </div>
    </div>`;
    m.classList.remove('hidden');
};

window.processUnifiedBulkAdd = async function() {
    const inputArea = document.getElementById('bulk-input'); if (!inputArea) return;
    let text = inputArea.value; if (!text.trim()) return alert("주입할 텍스트가 없습니다.");
    window.showLoading();
    let counts = {q:0, c:0, n:0, v:0, s:0};
    const ts = firebase.firestore.FieldValue.serverTimestamp();
    const isBlank = (s) => ['없음','공백','-','해당없음',''].includes((s||'').replace(/\s+/g,''));

    try {
        // 1. 공백 정규화
        text = text.replace(/[\u00A0\u200B-\u200D\uFEFF]/g, ' ').replace(/\*\*/g, '');

        // 🚨 2. 가독성 심폐소생술 (잃어버린 엔터 강제 복원)
        text = text.replace(/([^\n])(\[진위형 정답\]|핵심 리마인드:|1\.?\s*문제\s*유형|2\.?\s*질문\s*내용|3\.?\s*정답|4\.?\s*선택지|5\.?\s*1줄\s*해설|6\.?\s*상세\s*해설|7\.?\s*목차\s*정보|암기\s*코드:|해석\s*및\s*풀이:|지식\s*연결망:|도식\s*및\s*핵심\s*공식,|원리:|키워드:|태그:|🗺️ 마인드맵:|⭕ 밴다이어그램:|구체적\s*사례|비-사례|상황|판단|작동|작용\s*원리|진단|선택\s*에너지|생리적\s*상태|처치|이유|학습\s*포인트|\[PHASE)/g, '$1\n\n$2');

        // 3. 6대 섹션 도려내기
        text = text.replace(/1\.?\s*정답\s*및\s*핵심\s*리마인드|\[1\]\s*핵심\s*리마인드/i, '§§SEC1§§');
        text = text.replace(/2\.?\s*실전\s*대비(\s*퀴즈\s*정리노트)?|\[2\]\s*실전\s*대비/i, '§§SEC2§§');
        text = text.replace(/4\.?\s*시각적\s*구조화|\[4\]\s*시각적\s*구조화/i, '§§SEC4§§');
        text = text.replace(/5\.?\s*사례\s*분석|\[5\]\s*사례\s*분석/i, '§§SEC5§§');
        text = text.replace(/6\.?\s*다단\s*비교표|\[6\]\s*다단\s*비교표/i, '§§SEC6§§');
        text = text.replace(/7\.?\s*학습\s*데이터\s*프로토콜|\[7\]\s*학습\s*데이터\s*프로토콜/i, '§§SEC7§§');

        let blocks = { remind:'', quiz:'', visual:'', case:'', comp:'', proto:'' };
        let parts = text.split('§§SEC');
        parts.forEach(p => {
            if(p.startsWith('1§§')) blocks.remind = p.substring(3).trim();
            else if(p.startsWith('2§§')) blocks.quiz = p.substring(3).trim();
            else if(p.startsWith('4§§')) blocks.visual = p.substring(3).trim();
            else if(p.startsWith('5§§')) blocks.case = p.substring(3).trim();
            else if(p.startsWith('6§§')) blocks.comp = p.substring(3).trim();
            else if(p.startsWith('7§§')) blocks.proto = p.substring(3).trim();
        });

        // [7] 일반 노트 (프로토콜만 노트로 저장)
        if(blocks.proto && !isBlank(blocks.proto)) {
            await db.collection('subjects').doc(window.currentSubjectId).collection('notes').add({ category:'미분류', title:'학습 데이터 프로토콜', content: blocks.proto, createdAt:ts, updatedAt:ts });
            counts.n++;
        }

        // [4] 시각적 구조화
        if(blocks.visual && !isBlank(blocks.visual)) {
            await db.collection('subjects').doc(window.currentSubjectId).collection('visualMaps').add({ category:'미분류', title:'시각적 구조화', content: blocks.visual, createdAt:ts, updatedAt:ts });
            counts.v++;
        }

        // 🚨 [1~3] 핵심 리마인드를 퀴즈(문제) 객체로 통합!
        if(blocks.quiz || blocks.remind) {
            let qText = blocks.quiz || '';
            qText = qText.replace(/1\.?\s*문제\s*유형/i, '§§Q1§§');
            qText = qText.replace(/2\.?\s*질문\s*내용/i, '§§Q2§§');
            qText = qText.replace(/3\.?\s*정답/i, '§§Q3§§');
            qText = qText.replace(/4\.?\s*선택지/i, '§§Q4§§');
            qText = qText.replace(/5\.?\s*(1줄\s*해설|해설\s*요약)/i, '§§Q5§§');
            qText = qText.replace(/6\.?\s*상세\s*해설/i, '§§Q6§§');
            qText = qText.replace(/7\.?\s*목차\s*정보/i, '§§Q7§§');
            qText = qText.replace(/암기\s*코드:?/i, '§§Q8§§');
            qText = qText.replace(/해석\s*및\s*풀이:?/i, '§§Q9§§');
            qText = qText.replace(/지식\s*연결망:?/i, '§§Q10§§');
            qText = qText.replace(/도식\s*및\s*핵심\s*(공식|원리)[,\s\w]*:?/i, '§§Q11§§');
            qText = qText.replace(/키워드:?/i, '§§Q12§§');
            qText = qText.replace(/태그:?/i, '§§Q13§§');

            let qParts = qText.split('§§Q');
            let qObj = { category:'미분류', negativeType:'', text:'질문 내용 없음', answer:'', shortExplanation:'', explanation:'', mnemonic:'', mnemonicDesc:'', knowledgeNetwork:'', diagramFormula:'', options:[], keywords:[], tags:[], optionImages:['','','','',''], images:[], pathLevels:[], bookmarked:false, coreRemind: blocks.remind };

            qParts.forEach(p => {
                if(p.startsWith('1§§')) qObj.negativeType = p.substring(3).trim();
                if(p.startsWith('2§§')) qObj.text = p.substring(3).trim();
                if(p.startsWith('3§§')) qObj.answer = p.substring(3).replace(/^\d+\)\s*/, '').trim();
                if(p.startsWith('4§§')) {
                    let optStr = p.substring(3).trim();
                    if(!isBlank(optStr)) {
                        let opts = optStr.split(/(?:\([1-5]\)|[①-⑤]|\d\)\s+|\d\.\s+)/).map(s=>s.trim()).filter(Boolean);
                        if(opts.length <= 1) opts = optStr.split('\n').map(s=>s.trim()).filter(Boolean);
                        qObj.options = opts;
                    }
                }
                if(p.startsWith('5§§')) qObj.shortExplanation = p.substring(3).trim();
                if(p.startsWith('6§§')) qObj.explanation = p.substring(3).trim();
                if(p.startsWith('7§§')) qObj.pathLevels = p.substring(3).split(/\d단계:/).map(s=>s.trim().replace(/^\d+\s*/,'')).filter(Boolean);
                if(p.startsWith('8§§')) qObj.mnemonic = p.substring(3).trim();
                if(p.startsWith('9§§')) qObj.mnemonicDesc = p.substring(3).trim();
                if(p.startsWith('10§§')) qObj.knowledgeNetwork = p.substring(4).trim();
                if(p.startsWith('11§§')) qObj.diagramFormula = p.substring(4).trim();
                if(p.startsWith('12§§')) { let k = p.substring(4).trim(); if(!isBlank(k)) qObj.keywords = k.replace(/#/g,'').split(/[,|/]+|\s+/).map(s=>s.trim()).filter(Boolean); }
                if(p.startsWith('13§§')) { let t = p.substring(4).trim(); if(!isBlank(t)) qObj.tags = t.replace(/#/g,'').split(/[,|/]+|\s+/).map(s=>s.trim()).filter(Boolean); }
            });

            if(qObj.text || qObj.answer || qObj.options.length > 0 || qObj.coreRemind) {
                if(!qObj.text) qObj.text = "질문 내용 없음 (스마트 주입)";
                qObj.createdAt = ts; qObj.updatedAt = ts;
                await db.collection('subjects').doc(window.currentSubjectId).collection('questions').add(qObj);
                counts.q++;
            }
        }

        // [5] 사례 분석 (깨진 표 복원 로직)
        if(blocks.case && !isBlank(blocks.case)) {
            let sText = blocks.case;
            sText = sText.replace(/(상황)/, '§§S1§§$1');
            sText = sText.replace(/(판단|작용\s*원리|작동|원리|진단|선택\s*에너지)/, '§§S2§§$1');
            sText = sText.replace(/(처치|생리적\s*상태|상태|결과|이유)/, '§§S3§§$1');
            sText = sText.replace(/(학습\s*포인트)/, '§§S4§§$1');
            
            let sObj = { title:'사례 분석', category:'미분류', sit_c:'', sit_n:'', pri_c:'', pri_n:'', sta_c:'', sta_n:'', pnt_c:'', pnt_n:'' };
            let sParts = sText.split('§§S');
            
            sParts.forEach(p => {
                let c = p.substring(3).replace(/^(상황|판단|작용\s*원리|작동|원리|진단|선택\s*에너지|처치|생리적\s*상태|상태|결과|이유|학습\s*포인트)[:\s]*/,'').trim();
                if(isBlank(c)) c = '';
                if(p.startsWith('1§§')) sObj.sit_c = c;
                if(p.startsWith('2§§')) sObj.pri_c = c;
                if(p.startsWith('3§§')) sObj.sta_c = c;
                if(p.startsWith('4§§')) sObj.pnt_c = c;
            });
            sObj.createdAt = ts; sObj.updatedAt = ts;
            await db.collection('subjects').doc(window.currentSubjectId).collection('caseStudies').add(sObj);
            counts.s++;
        }

        // [6] 비교표
        if(blocks.comp && !isBlank(blocks.comp)) {
            let cObj = { title:'다단 비교표', category:'미분류', col1Name:'', col2Name:'', col3Name:'', col4Name:'', rows:[] };
            let cLines = blocks.comp.split('\n').filter(l=>l.trim());
            cLines.forEach(line => {
                if(line.includes('---') || line.includes('===') || line.replace(/\s+/g,'').startsWith('다단비교')) return;
                let cols = line.split(/\||\t/).map(s=>s.trim()).filter(s=>s);
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
                }
            });
            if(!cObj.col1Name && cObj.rows.length === 0) {
                 cObj.col1Name = '비교 항목'; cObj.col2Name = '비교 내용';
                 cObj.rows.push({col1: blocks.comp.substring(0, 100) + '...', col2: blocks.comp, col3:'', col4:''});
            }
            cObj.createdAt = ts; cObj.updatedAt = ts;
            await db.collection('subjects').doc(window.currentSubjectId).collection('comparisons').add(cObj);
            counts.c++;
        }

        window.hideLoading(); window.closeModal(); 
        if (window.currentSubjectId && typeof window.manageSubject === 'function') window.manageSubject(window.currentSubjectId);
        
        alert(`✨ 1-Click 스마트 주입 성공!\n✅ 퀴즈(핵심리마인드 포함): ${counts.q}건\n✅ 시각맵: ${counts.v}건\n✅ 사례분석: ${counts.s}건\n✅ 비교표: ${counts.c}건\n✅ 프로토콜: ${counts.n}건`);

    } catch(err) {
        window.hideLoading(); console.error(err);
        alert("🚨 파싱 오류 발생: 형식이 너무 많이 깨졌습니다.");
    }
};
