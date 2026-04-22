// =========================================================
// [v21.0.0] app-parser.js: The "First Principles" Parser
// (Structural extraction over keyword guessing)
// =========================================================

window.showBulkAddModal = function() { 
    const m = document.getElementById('modal-container'); if(!m) return;
    m.innerHTML = `<div class="modal-backdrop" onclick="window.closeModal()"></div>
    <div class="modal" style="max-width:1000px; width:95%; background:#fff; border-radius:20px; padding:35px; box-shadow:0 10px 40px rgba(0,0,0,0.15); position:relative; z-index:100000;">
        <div style="text-align:center; margin-bottom:20px;">
            <h2 style="color:#4f46e5; margin-bottom:10px; font-size:1.8em;">🤖 제1원칙 스마트 주입기</h2>
            <p style="color:#64748b; margin-bottom:10px;">어떤 형태, 어떤 단어로 들어와도 <b>본질적인 구조</b>를 파악해 100% 분리합니다.</p>
        </div>
        <textarea id="bulk-input" style="width:100%; height:400px; padding:20px; border-radius:15px; border:2px solid #e2e8f0; font-family:'Consolas', monospace; line-height:1.6; font-size:1.05em; box-sizing:border-box; background:#f8fafc;" placeholder="복사한 내용을 통째로 붙여넣으세요..."></textarea>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-top:25px;">
            <button class="button primary-button" style="height:60px; font-size:1.2em; border-radius:12px; background:#4f46e5; border:none;" onclick="window.processUnifiedBulkAdd()">🚀 본질 구조 분석 및 추출 시작</button>
            <button class="button light-button" style="height:60px; font-size:1.2em; border-radius:12px; border:2px solid #cbd5e1;" onclick="window.closeModal()">취소</button>
        </div>
    </div>`;
    m.classList.remove('hidden');
};

window.processUnifiedBulkAdd = async function() {
    const inputArea = document.getElementById('bulk-input'); if (!inputArea) return;
    let rawText = inputArea.value; if (!rawText.trim()) return alert("주입할 텍스트가 없습니다.");
    window.showLoading();

    try {
        let text = rawText.replace(/[\u00A0\u200B-\u200D\uFEFF]/g, ' ').replace(/\*\*/g, '');

        // 🚨 제1원칙 1: 거대 7구역 본질 분해 (번호 무시, 줄바꿈 유지)
        text = text.replace(/([\[(]?1[\])]?\.?\s*(정답\s*및\s*)?핵심\s*리마인드)/i, '§§SEC1§§');
        text = text.replace(/([\[(]?2[\])]?\.?\s*실전\s*대비(?:\s*퀴즈\s*정리노트)?)/i, '§§SEC2§§');
        text = text.replace(/([\[(]?3[\])]?\.?\s*지식\s*재구성)/i, '§§SEC3§§');
        text = text.replace(/([\[(]?4[\])]?\.?\s*시각적\s*구조화)/i, '§§SEC4§§');
        text = text.replace(/([\[(]?5[\])]?\.?\s*사례\s*분석(?:\s*&\s*비-?사례)?)/i, '§§SEC5§§');
        text = text.replace(/([\[(]?6[\])]?\.?\s*다단\s*비교표)/i, '§§SEC6§§');
        text = text.replace(/([\[(]?7[\])]?\.?\s*학습\s*데이터\s*프로토콜)/i, '§§SEC7§§');

        let parts = text.split('§§SEC');
        let sections = { s1:'', s2:'', s3:'', s4:'', s5:'', s6:'', s7:'' };

        parts.forEach(p => {
            if(p.startsWith('1§§')) sections.s1 = p.substring(3).trim();
            else if(p.startsWith('2§§')) sections.s2 = p.substring(3).trim();
            else if(p.startsWith('3§§')) sections.s3 = p.substring(3).trim();
            else if(p.startsWith('4§§')) sections.s4 = p.substring(3).trim();
            else if(p.startsWith('5§§')) sections.s5 = p.substring(3).trim();
            else if(p.startsWith('6§§')) sections.s6 = p.substring(3).trim();
            else if(p.startsWith('7§§')) sections.s7 = p.substring(3).trim();
        });

        const ts = firebase.firestore.FieldValue.serverTimestamp();
        let counts = {q:0, c:0, n:0, v:0, s:0};

        // 🚨 제1원칙 2: 텍스트 가독성의 본질 (줄바꿈 원형 보존)
        if (sections.s7) {
            await db.collection('subjects').doc(window.currentSubjectId).collection('notes').add({
                category: '미분류', title: '학습 데이터 프로토콜', content: sections.s7, createdAt: ts, updatedAt: ts
            });
            counts.n++;
        }

        if (sections.s4) {
            await db.collection('subjects').doc(window.currentSubjectId).collection('visualMaps').add({
                category: '미분류', title: '시각적 구조화', content: sections.s4, createdAt: ts, updatedAt: ts
            });
            counts.v++;
        }

        // 🚨 제1원칙 3: 표의 본질 (단어를 안 보고, | 기호의 위치 배열로만 데이터를 넣는다)
        if (sections.s5) {
            let sObj = { title:'사례 분석', category:'미분류', sit_c:'', sit_n:'', pri_c:'', pri_n:'', sta_c:'', sta_n:'', pnt_c:'', pnt_n:'' };
            let tableLines = sections.s5.split('\n').filter(l => l.includes('|'));
            let dataRows = [];

            tableLines.forEach(l => {
                if (l.replace(/\s+/g,'').includes('---|')) return; // 마크다운 구분선 무시
                let cols = l.split('|').map(s=>s.trim());
                if(cols[0] === '') cols.shift();
                if(cols[cols.length-1] === '') cols.pop();
                dataRows.push(cols);
            });

            // 1행(0번)은 헤더. 그 다음 4줄이 무조건 데이터! 제목이 달라도 상관없음.
            if(dataRows.length > 1) {
                if(dataRows[1]) { sObj.sit_c = dataRows[1][1]||''; sObj.sit_n = dataRows[1][2]||''; }
                if(dataRows[2]) { sObj.pri_c = dataRows[2][1]||''; sObj.pri_n = dataRows[2][2]||''; }
                if(dataRows[3]) { sObj.sta_c = dataRows[3][1]||''; sObj.sta_n = dataRows[3][2]||''; }
                if(dataRows[4]) { sObj.pnt_c = dataRows[4][1]||''; sObj.pnt_n = dataRows[4][2]||''; }
            } else if (sections.s5.trim() !== '') {
                sObj.sit_c = sections.s5; // 깨진 경우 통째로 보존
            }

            if (sObj.sit_c || sObj.pri_c) {
                sObj.createdAt = ts; sObj.updatedAt = ts;
                await db.collection('subjects').doc(window.currentSubjectId).collection('caseStudies').add(sObj);
                counts.s++;
            }
        }

        // 🚨 다단 비교표의 본질: 첫 줄은 제목, 둘째 줄은 선, 나머지는 데이터
        if (sections.s6) {
            let cObj = { title:'다단 비교표', category:'미분류', col1Name:'', col2Name:'', col3Name:'', col4Name:'', rows:[] };
            let tableLines = sections.s6.split('\n').filter(l => l.includes('|'));
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
                cObj.col1Name = headers[0] || '항목1';
                cObj.col2Name = headers[1] || '항목2';
                cObj.col3Name = headers[2] || '';
                cObj.col4Name = headers[3] || '';

                for (let i = 1; i < dataRows.length; i++) {
                    let dr = dataRows[i];
                    cObj.rows.push({
                        col1: dr[0] || '-',
                        col2: dr[1] || '-',
                        col3: dr[2] || '',
                        col4: dr[3] || ''
                    });
                }
                cObj.createdAt = ts; cObj.updatedAt = ts;
                await db.collection('subjects').doc(window.currentSubjectId).collection('comparisons').add(cObj);
                counts.c++;
            }
        }

        // 🚨 제1원칙 4: 퀴즈 세부 분해 (구분자 강제 삽입 후 쪼개기)
        let quizText = (sections.s2 + '\n' + sections.s3).trim();
        if (quizText || sections.s1) {
            let qObj = { category:'미분류', negativeType:'1', text:'', answer:'', shortExplanation:'', explanation:'', mnemonic:'', mnemonicDesc:'', knowledgeNetwork:'', diagramFormula:'', options:[], optionImages:['','','','',''], images:[], pathLevels:[], keywords:[], tags:[], bookmarked:false, coreRemind: sections.s1 || '' };

            let qText = quizText;
            qText = qText.replace(/([\[(]?1[\])]?\.?\s*문제\s*유형)/i, '§§F1§§');
            qText = qText.replace(/([\[(]?2[\])]?\.?\s*질문\s*내용)/i, '§§F2§§');
            qText = qText.replace(/([\[(]?3[\])]?\.?\s*정답)/i, '§§F3§§');
            qText = qText.replace(/([\[(]?4[\])]?\.?\s*선택지)/i, '§§F4§§');
            qText = qText.replace(/([\[(]?5[\])]?\.?\s*(?:1줄\s*해설|해설\s*요약))/i, '§§F5§§');
            qText = qText.replace(/([\[(]?6[\])]?\.?\s*상세\s*해설)/i, '§§F6§§');
            qText = qText.replace(/([\[(]?7[\])]?\.?\s*목차\s*정보)/i, '§§F7§§');
            qText = qText.replace(/(암기\s*코드)/i, '§§F8§§');
            qText = qText.replace(/(해석\s*및\s*풀이)/i, '§§F9§§');
            qText = qText.replace(/(지식\s*연결망)/i, '§§F10§§');
            qText = qText.replace(/(도식\s*및\s*핵심\s*(?:공식|원리))/i, '§§F11§§');
            qText = qText.replace(/(키워드)/i, '§§F12§§');
            qText = qText.replace(/(태그)/i, '§§F13§§');

            let fParts = qText.split('§§F');
            fParts.forEach(p => {
                let content = p.replace(/^[\s:\-]+/, '').trim(); 
                if (content === '없음' || content === '-' || content === '공백') content = '';

                if(p.startsWith('1§§')) {
                    // 문제 유형의 본질: select option value 맞추기!
                    let t = content.replace(/\s+/g,'');
                    if(t.includes('빈칸')) qObj.negativeType = '2';
                    else if(t.includes('주관')) qObj.negativeType = '3';
                    else if(t.includes('심화')) qObj.negativeType = '4';
                    else qObj.negativeType = '1'; // 진위형(O/X) 등 알 수 없는 값은 1번으로 통일
                }
                else if(p.startsWith('2§§')) qObj.text = content;
                else if(p.startsWith('3§§')) qObj.answer = content.replace(/^\d+\)\s*/, '');
                else if(p.startsWith('4§§')) {
                    if(content) {
                        let opts = content.split(/(?:\([1-5]\)|[①-⑤]|\d\)\s+|\d\.\s+|^O\s+\(맞다\)|^X\s+\(틀리다\))/gm).map(s=>s.trim()).filter(Boolean);
                        if(opts.length <= 1) opts = content.split('\n').map(s=>s.trim()).filter(Boolean);
                        qObj.options = opts;
                    }
                }
                else if(p.startsWith('5§§')) qObj.shortExplanation = content;
                else if(p.startsWith('6§§')) qObj.explanation = content;
                else if(p.startsWith('7§§')) qObj.pathLevels = content ? content.split(/\n|,|단계:/).map(s=>s.trim().replace(/^\d+\s*/,'')).filter(Boolean) : [];
                else if(p.startsWith('8§§')) qObj.mnemonic = content;
                else if(p.startsWith('9§§')) qObj.mnemonicDesc = content;
                else if(p.startsWith('10§§')) qObj.knowledgeNetwork = content;
                else if(p.startsWith('11§§')) qObj.diagramFormula = content;
                else if(p.startsWith('12§§')) qObj.keywords = content ? content.replace(/#/g,'').split(/[,|/]+|\s+/).map(s=>s.trim()).filter(Boolean) : [];
                else if(p.startsWith('13§§')) qObj.tags = content ? content.replace(/#/g,'').split(/[,|/]+|\s+/).map(s=>s.trim()).filter(Boolean) : [];
            });

            if(!qObj.text) qObj.text = "질문 내용 없음 (스마트 주입)";
            qObj.createdAt = ts; qObj.updatedAt = ts;
            await db.collection('subjects').doc(window.currentSubjectId).collection('questions').add(qObj);
            counts.q++;
        }

        window.hideLoading(); window.closeModal(); 
        if (window.currentSubjectId && typeof window.manageSubject === 'function') window.manageSubject(window.currentSubjectId);
        
        alert(`✨ 제1원칙 스마트 주입 완벽 성공!\n✅ 퀴즈/재구성(리마인드 포함): ${counts.q}건\n✅ 시각맵: ${counts.v}건\n✅ 사례분석: ${counts.s}건\n✅ 비교표: ${counts.c}건\n✅ 일반노트: ${counts.n}건`);

    } catch(err) {
        window.hideLoading(); console.error(err); alert("🚨 파싱 오류: " + err.message);
    }
};
