// =========================================================
// [v16.5.0] app-ui.js: Added 'Core Remind' field to Editor
// =========================================================

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
