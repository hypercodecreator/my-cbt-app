// =========================================================
// [v16.5.0] app-ui.js: Added 'Core Remind' field to Editor
// =========================================================

// app-ui.js 내부의 window.renderQuizView 함수만 교체합니다!
window.renderQuizView = function() {
    window.showView('quiz-view');
    const qList = window.filteredQuestions;
    const view = document.getElementById('quiz-view');
    if (qList.length === 0) {
        view.innerHTML = `<div style="text-align:center; padding:50px;"><h2 style="color:#64748b;">표시할 문제가 없습니다.</h2><button class="button primary-button" onclick="window.manageSubject('${window.currentSubjectId}')">돌아가기</button></div>`;
        return;
    }
    const q = qList[window.currentQuizIndex];
    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <h2 style="margin:0; font-size:1.5em; color:#1e293b;">${window.currentSubjectData.name} <span style="color:#3b82f6;">(${window.currentQuizIndex + 1} / ${qList.length})</span></h2>
            <div style="display:flex; gap:10px;">
                <button id="elimination-btn" class="button light-button" style="border:2px solid #cbd5e1; font-weight:bold; transition:all 0.2s;" onclick="window.toggleEliminationMode()">❌ 소거법 모드 OFF</button>
                <button class="button light-button" style="border:2px solid #cbd5e1;" onclick="window.manageSubject('${window.currentSubjectId}')">종료</button>
            </div>
        </div>
        <div style="background:white; padding:30px; border-radius:20px; box-shadow:0 10px 25px rgba(0,0,0,0.05); margin-bottom:20px; border-top:5px solid #3b82f6;">
            <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
                <span style="background:#e0f2fe; color:#0369a1; padding:5px 12px; border-radius:20px; font-size:0.9em; font-weight:bold;">${window.esc(q.category)}</span>
                <span style="color:#64748b; font-size:0.9em;">유형: ${q.negativeType}</span>
            </div>
            <h3 style="font-size:1.4em; color:#0f172a; margin-bottom:20px; line-height:1.5;">${window.esc(q.text)}</h3>
            <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:25px;">`;

    q.options.forEach((opt, i) => {
        html += `<div class="quiz-option" style="padding:15px 20px; background:#f8fafc; border:2px solid #e2e8f0; border-radius:12px; font-size:1.1em; color:#334155; transition:all 0.2s ease;">
            <span style="font-weight:bold; margin-right:10px; color:#3b82f6;">${i + 1}.</span> ${window.esc(opt)}
        </div>`;
    });

    html += `</div>
        <button id="show-answer-btn" class="button primary-button" style="width:100%; height:60px; font-size:1.2em; border-radius:12px;" onclick="window.showAnswer()">정답 확인하기</button>
        <div id="answer-area" class="hidden" style="margin-top:25px; padding:25px; background:#f0fdf4; border-radius:15px; border:2px solid #bbf7d0;">
            <h3 style="color:#166534; margin-top:0; font-size:1.3em;">🎯 정답: ${window.esc(q.answer)}</h3>
            ${q.shortExplanation ? `<div style="background:#dcfce3; padding:12px; border-radius:8px; color:#166534; font-weight:bold; margin-bottom:15px;">${window.esc(q.shortExplanation)}</div>` : ''}
            <div style="color:#064e3b; line-height:1.6; font-size:1.05em; white-space:pre-wrap;">${window.esc(q.explanation)}</div>
            ${q.pathLevels && q.pathLevels.length > 0 ? `<div style="margin-top:20px; padding-top:15px; border-top:1px dashed #86efac; font-size:0.9em; color:#047857;">📍 출처: ${q.pathLevels.map(p => window.esc(p)).join(' > ')}</div>` : ''}
        </div>
        </div>
        <div style="display:flex; justify-content:space-between;">
            <button class="button light-button" style="height:50px; padding:0 25px; border:2px solid #cbd5e1;" onclick="window.prevQuiz()" ${window.currentQuizIndex === 0 ? 'disabled' : ''}>◀ 이전 문제</button>
            <button class="button primary-button" style="height:50px; padding:0 25px;" onclick="window.nextQuiz()" ${window.currentQuizIndex === qList.length - 1 ? 'disabled' : ''}>다음 문제 ▶</button>
        </div>`;
    view.innerHTML = html;
};

window.showView = function(id) {
    const views = ['subject-view', 'management-view', 'quiz-view', 'add-edit-view', 'note-view', 'flashcard-view', 'rhythm-view', 'compare-view'];
    views.forEach(v => { const el = document.getElementById(v); if (el) el.classList.toggle('hidden', v !== id); });
    window.scrollTo(0, 0);
};
window.renderVersionHeader = function() {}; 

window.renderBaseUI = function() {
    let authCont = document.getElementById('auth-container');
    authCont.innerHTML = `<div id="logged-in-view" style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:15px 25px; border-bottom:1px solid #cbd5e1; margin-bottom:10px;"><span id="user-email" style="font-weight:900;">확인 중...</span><button class="button small-button light-button" style="border:1px solid #94a3b8; background:white;" onclick="window.logOut()">로그아웃</button></div>`;

    let vHead = document.getElementById('v-header');
    if (!vHead) { vHead = document.createElement('div'); vHead.id = 'v-header'; authCont.after(vHead); }
    vHead.style = "background:#0f172a; color:#fff; padding:12px 25px; display:flex; border-radius:12px; margin:0 15px 15px 15px;";
    vHead.innerHTML = `<span style="background:#10b981; padding:3px 10px; border-radius:6px; font-weight:900; font-size:0.85em; margin-right:10px;">v16.5.0</span> <span style="font-size:0.9em;">[Core Remind & Readability Update]</span>`;

    let masterNav = document.getElementById('master-nav');
    if (!masterNav) { masterNav = document.createElement('div'); masterNav.id = 'master-nav'; vHead.after(masterNav); }
    masterNav.style = "margin:0 15px 20px 15px;";
    masterNav.innerHTML = `<button class="button primary-button" style="width:100%; height:55px; font-size:1.1em; font-weight:900; background:linear-gradient(to right, #4f46e5, #6366f1); border:none; border-radius:12px; box-shadow:0 4px 10px rgba(79,70,229,0.2);" onclick="window.showView('subject-view')">🏠 메인 페이지로 돌아가기</button>`;

    if (!document.getElementById('core-styles')) {
        const s = document.createElement('style'); s.id = 'core-styles';
        s.innerHTML = `.rhythm-bar-fill { height:100%; background:linear-gradient(90deg, #ec4899, #8b5cf6); transition: width linear; } .drag-over-left { border-left: 8px solid #3b82f6 !important; background: linear-gradient(90deg, rgba(59,130,246,0.15) 0%, transparent 100%) !important; } .drag-over-right { border-right: 8px solid #10b981 !important; background: linear-gradient(270deg, rgba(16,185,129,0.15) 0%, transparent 100%) !important; } .drag-over-item { border-top: 4px solid #f59e0b !important; } .draggable-item { cursor: grab; transition: transform 0.1s; } .draggable-item:active { cursor: grabbing; transform: scale(0.98); }`;
        document.head.appendChild(s);
    }

    const sv = document.getElementById('subject-view');
    const speeds = []; for(let i=0.25; i<=4; i+=0.25) speeds.push(i);
    sv.innerHTML = `
        <div style="display:flex; gap:10px; margin-bottom:20px; background:#fffbeb; padding:15px; border-radius:15px; border:1px solid #fde68a;">
            <div style="flex:1;"><label style="font-weight:bold; color:#b45309; font-size:0.85em;">📝 퀴즈 난이도</label><select id="global-quiz-level" onchange="window.quizLevel = parseInt(this.value)" style="width:100%; padding:8px; border-radius:8px; border:1px solid #fcd34d;"><option value="1">Lv.1 객관식</option><option value="2">Lv.2 빈칸</option><option value="3">Lv.3 주관식</option><option value="4">Lv.4 심화</option></select></div>
            <div style="flex:1;"><label style="font-weight:bold; color:#be185d; font-size:0.85em;">🎵 리듬/OX 배속</label><select id="rhythm-speed-select" onchange="window.currentRhythmSpeed = parseFloat(this.value)" style="width:100%; padding:8px; border-radius:8px; border:1px solid #f9a8d4;">${speeds.map(v => `<option value="${v}" ${v===1?'selected':''}>${v}x</option>`).join('')}</select></div>
            <div style="flex:1;"><label style="font-weight:bold; color:#4338ca; font-size:0.85em;">💡 해설 표시</label><select id="global-rhythm-level" onchange="window.rhythmLevel = parseInt(this.value)" style="width:100%; padding:8px; border-radius:8px; border:1px solid #a5b4fc;"><option value="1">정답만</option><option value="2">정답+해설</option></select></div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;"><h2 style="margin:0; font-size:1.5em;">📚 과목 리스트</h2><button class="button small-button primary-button" style="background:#8b5cf6; border:none;" onclick="window.toggleInlineCreateUI('subjects')">+ 새 폴더 생성</button></div>
        <div id="inline-create-subjects" class="hidden" style="margin-bottom:20px; padding:20px; background:#f1f5f9; border-radius:12px; border:2px dashed #cbd5e1; display:flex; gap:10px;"><input type="text" id="create-inp-subjects" placeholder="새 폴더명 (슬래시/로 하위폴더 지정 가능)" style="flex:1; padding:12px; border-radius:8px; border:1px solid #cbd5e1;"><button class="button primary-button" onclick="window.execInlineCreate('subjects')">생성</button><button class="button light-button" onclick="window.toggleInlineCreateUI('subjects')">취소</button></div>
        <div id="subject-list"></div> 
        <button class="button primary-button" onclick="window.showAddSubjectModal()" style="width:100%; padding:18px; margin-top:20px; font-size:1.1em; background:#0f172a; border-radius:15px;">+ 새 과목 추가</button>
    `;
};



window.showAddSubjectModal = function() { const m = document.getElementById('modal-container'); m.innerHTML = `<div class="modal-backdrop" onclick="window.closeModal()"></div><div class="modal"><h3>🆕 새 과목 추가</h3><div class="form-group"><label>폴더 지정 (예: 1학년/1학기)</label><input type="text" id="new-subject-category" placeholder="빈칸 시 미분류로 이동"></div><div class="form-group"><label>과목명</label><input type="text" id="new-subject-name"></div><div style="display:flex; gap:10px;"><button class="button primary-button" style="flex:1;" onclick="window.addSubject()">추가</button><button class="button light-button" style="flex:1;" onclick="window.closeModal()">취소</button></div></div>`; };
window.showLoading = function() { let el = document.getElementById('floating-loader'); if(!el) { el = document.createElement('div'); el.id = 'floating-loader'; el.style = "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#1e293b; color:white; padding:12px 30px; border-radius:30px; font-weight:bold; z-index:99999;"; document.body.appendChild(el); } el.innerHTML = `⏳ 시스템 처리 중...`; el.style.display = 'flex'; };
window.hideLoading = function() { const el = document.getElementById('floating-loader'); if(el) el.style.display = 'none'; };
window.closeModal = function() { document.getElementById('modal-container').innerHTML = ''; };
