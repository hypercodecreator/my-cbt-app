// =========================================================
// [v10.1.5] app-logic.js: Part 1 - Clean Engine & Failsafe
// =========================================================

// 🚨 1. 알림창(팝업) 제거 및 부드러운 하단 토스트 메시지
window.esc = (s) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
window.showToast = function(msg) { 
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = "position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:rgba(15,23,42,0.9); color:white; padding:12px 24px; border-radius:30px; z-index:999999; font-weight:bold; box-shadow:0 4px 12px rgba(0,0,0,0.3); transition: opacity 0.3s;";
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2000);
};

// 🚨 2. 무적 부팅 엔진 (에러 방어)
window.startApp = function() {
    if(typeof window.renderBaseUI === 'function') window.renderBaseUI();
    if(typeof window.renderVersionHeader === 'function') window.renderVersionHeader();
    
    window.auth.onAuthStateChanged(async (user) => {
        if(user){ 
            const el = document.getElementById('user-email'); 
            if(el) el.textContent = user.email + "님 환영합니다."; 
            window.showView('subject-view'); 
            await window.loadSubjects(); 
        } else { 
            window.showView('login-view'); 
        }
    });
};
window.logOut = function() { if(confirm("로그아웃 하시겠습니까?")) { window.auth.signOut(); location.reload(); } };

// 🚨 3. 화면 이탈 시 오디오(TTS) 스탑
if(!window.isViewHooked) {
    const origShowView = window.showView;
    window.showView = function(id) {
        window.audioSessionId = (window.audioSessionId || 0) + 1;
        window.isAudioPlaying = false;
        if(window.speechSynthesis) window.speechSynthesis.cancel();
        document.querySelectorAll('.audio-btn').forEach(b => { b.innerHTML = "🎧 듣기"; b.style.background = ""; b.style.color = "#b45309"; });
        origShowView(id);
    };
    window.isViewHooked = true;
}

// --- D&D 및 UI 헬퍼 함수 ---
window.toggleInlineMoveUI = function(itemId) { const el = document.getElementById(`move-ui-${itemId}`); if(el) el.classList.toggle('hidden'); };
window.toggleCatMoveUI = function(catId) { const el = document.getElementById(`cat-move-ui-${catId}`); if(el) el.classList.toggle('hidden'); };
window.toggleInlineCreateUI = function(colName) { const el = document.getElementById(`inline-create-${colName}`); if(el) el.classList.toggle('hidden'); };
window.toggleAccordion = function(id, iconId) { const el = document.getElementById(id); const icon = document.getElementById(iconId); if(el) { el.classList.toggle('hidden'); if(icon) icon.textContent = el.classList.contains('hidden') ? '📁' : '📂'; } };

window.collapsedFolders = [];
window.toggleFolder = function(cat, iconId) {
    const idx = window.collapsedFolders.indexOf(cat);
    if(idx > -1) window.collapsedFolders.splice(idx, 1); else window.collapsedFolders.push(cat); 
    const icon = document.getElementById(iconId); if(icon) icon.textContent = window.collapsedFolders.includes(cat) ? '📁' : '📂';
    window.updateFolderVisibility();
};
window.updateFolderVisibility = function() {
    document.querySelectorAll('.category-group').forEach(el => {
        const cat = el.getAttribute('data-cat'); if(!cat) return;
        let isVisible = true;
        for (let collapsedCat of window.collapsedFolders) { if (cat !== collapsedCat && cat.startsWith(collapsedCat + '/')) { isVisible = false; break; } }
        el.style.display = isVisible ? 'block' : 'none';
    });
    document.querySelectorAll('.cat-content-wrapper').forEach(el => {
        const cat = el.getAttribute('data-parent-cat');
        el.style.display = window.collapsedFolders.includes(cat) ? 'none' : 'block';
    });
};

window.execInlineCreate = async function(colName) {
    const inp = document.getElementById(`create-inp-${colName}`).value.trim();
    if(!inp) return window.showToast("폴더 이름을 입력하세요."); window.showLoading();
    const orderRef = db.collection('settings').doc(`order_${colName}_${window.currentSubjectId||'main'}`);
    const doc = await orderRef.get(); let order = doc.exists ? doc.data().order : window.lastRenderedCategories[colName] || [];
    if(!order.includes(inp)) { order.push(inp); await orderRef.set({ order }); }
    document.getElementById(`create-inp-${colName}`).value = ''; window.toggleInlineCreateUI(colName);
    window.hideLoading(); window.refreshView(colName);
};

window.handleImageUpload = function(input, targetEl) {
    const file = input.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = function(e) { if(typeof targetEl === 'string') document.getElementById(targetEl).value = e.target.result; else targetEl.value = e.target.result; };
    reader.readAsDataURL(file);
};

window.openImageModal = function(src, desc='') {
    const qTextEl = document.querySelector('.q-text-display');
    let textHtml = qTextEl ? `<div style="color:white; font-size:1.1em; font-weight:bold; margin-bottom:20px; padding:15px 25px; background:rgba(0,0,0,0.75); border-radius:12px; max-width:90vw; text-align:center; box-shadow:0 4px 10px rgba(0,0,0,0.5); line-height:1.5;">${qTextEl.innerHTML}</div>` : '';
    let descHtml = desc ? `<div style="color:#fcd34d; font-size:1.1em; font-weight:bold; margin-top:15px; background:rgba(0,0,0,0.65); padding:10px 20px; border-radius:8px;">${desc}</div>` : '';
    
    const m = document.getElementById('modal-container');
    m.innerHTML = `<div class="modal-backdrop" style="background:rgba(15,23,42,0.9);" onclick="window.closeModal()"></div>
    <div style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:100001; width:100vw; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; pointer-events:none; padding:20px; box-sizing:border-box;">
        ${textHtml}
        <img src="${src}" style="max-width:95vw; max-height:60vh; border-radius:16px; box-shadow:0 10px 40px rgba(0,0,0,0.8); pointer-events:auto; border:2px solid #334155; cursor:zoom-out;" onclick="window.closeModal()">
        ${descHtml}
        <button class="button primary-button" style="margin-top:20px; padding:12px 35px; font-size:1.1em; background:#ef4444; border:none; border-radius:30px; box-shadow:0 4px 10px rgba(0,0,0,0.5); pointer-events:auto;" onclick="window.closeModal()">✖ 닫기</button>
    </div>`;
    m.classList.remove('hidden');
};

// --- D&D 엔진 ---
window.onDragStart = function(e, type, id, colName, currentCat) { 
    let ids = [id];
    if (type === 'item') {
        const cb = document.querySelector(`input[value="${id}"][type="checkbox"]`);
        if (cb && cb.checked) {
            const checkedIds = Array.from(document.querySelectorAll(`input[type="checkbox"]:checked`)).map(n => n.value).filter(v => v !== 'on');
            if(checkedIds.length > 0) { ids = checkedIds; type = 'multi-item'; }
        }
    }
    e.dataTransfer.setData('application/json', JSON.stringify({type, id, ids, colName, currentCat})); e.stopPropagation(); 
};

window.onDragOverCat = function(e) { 
    e.preventDefault(); e.stopPropagation(); 
    const rect = e.currentTarget.getBoundingClientRect(); const mid = rect.left + rect.width / 2;
    e.currentTarget.classList.remove('drag-over-left', 'drag-over-right');
    if (e.clientX < mid) e.currentTarget.classList.add('drag-over-left'); else e.currentTarget.classList.add('drag-over-right'); 
};
window.onDragLeaveCat = function(e) { e.currentTarget.classList.remove('drag-over-left', 'drag-over-right'); };

window.onDragOverItem = function(e) { 
    e.preventDefault(); e.stopPropagation(); 
    const rect = e.currentTarget.getBoundingClientRect(); const mid = rect.left + rect.width / 2;
    e.currentTarget.classList.remove('drag-over-left', 'drag-over-right', 'drag-over-item');
    if (e.clientX < mid) e.currentTarget.classList.add('drag-over-left'); else e.currentTarget.classList.add('drag-over-right'); 
};
window.onDragLeaveItem = function(e) { e.currentTarget.classList.remove('drag-over-left', 'drag-over-right', 'drag-over-item'); };

window.onDropOnCategory = async function(e, targetCat, colName) {
    e.preventDefault(); e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeft = (e.clientX < rect.left + rect.width / 2);
    e.currentTarget.classList.remove('drag-over-left', 'drag-over-right');
    
    const raw = e.dataTransfer.getData('application/json'); if(!raw) return;
    let data; try { data = JSON.parse(raw); } catch(err) { return; }
    if(data.colName !== colName) return window.showToast("다른 종류의 데이터입니다.");
    if(data.currentCat === targetCat && data.type === 'category') return; 
    
    window.showLoading();
    const field = colName === 'subjects' ? 'semester' : 'category';
    
    if (data.type === 'item' || data.type === 'multi-item') {
        const batch = db.batch();
        data.ids.forEach(itemId => {
            let ref = db.collection(colName).doc(itemId); if(colName !== 'subjects') ref = db.collection('subjects').doc(window.currentSubjectId).collection(colName).doc(itemId);
            batch.update(ref, { [field]: targetCat });
        });
        await batch.commit();
    } else if (data.type === 'category') {
        const orderRef = db.collection('settings').doc(`order_${colName}_${window.currentSubjectId||'main'}`);
        const doc = await orderRef.get(); let order = doc.exists && doc.data().order ? doc.data().order : [...(window.lastRenderedCategories[colName] || [])];

        if (!isLeft) {
            const folderName = data.currentCat.split('/').pop();
            const newCatName = targetCat === '최상위' ? folderName : targetCat + '/' + folderName;
            let query = db.collection(colName); if (colName !== 'subjects') query = db.collection('subjects').doc(window.currentSubjectId).collection(colName);
            const snap = await query.where(field, '==', data.currentCat).get();
            const batch = db.batch(); snap.docs.forEach(d => batch.update(d.ref, { [field]: newCatName })); await batch.commit();
            const idx = order.indexOf(data.currentCat); if (idx !== -1) { order[idx] = newCatName; await orderRef.set({ order }); }
        } else {
            const fromIdx = order.indexOf(data.currentCat);
            const toIdx = order.indexOf(targetCat);
            if(fromIdx !== -1 && toIdx !== -1) {
                const [el] = order.splice(fromIdx, 1);
                order.splice(toIdx, 0, el); 
                await orderRef.set({ order });
            }
        }
    }
    window.hideLoading(); window.refreshView(colName);
};

window.onDropOnItem = async function(e, targetId, colName) {
    e.preventDefault(); e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeft = (e.clientX < rect.left + rect.width / 2); 
    e.currentTarget.classList.remove('drag-over-left', 'drag-over-right', 'drag-over-item');
    
    const raw = e.dataTransfer.getData('application/json'); if(!raw) return;
    let data; try { data = JSON.parse(raw); } catch(err) { return; }
    if(data.colName !== colName || data.id === targetId || data.type === 'category') return;
    
    window.showLoading();
    const field = colName === 'subjects' ? 'semester' : 'category';
    let query = db.collection(colName); if(colName !== 'subjects') query = db.collection('subjects').doc(window.currentSubjectId).collection(colName);
    const tgtDoc = await query.doc(targetId).get();
    
    if(tgtDoc.exists) {
        const tgtCat = tgtDoc.data()[field] || '미분류';
        if (tgtCat === data.currentCat && data.type === 'item') {
            const snap = await query.where(field, '==', tgtCat).get();
            let items = snap.docs.map(d => ({id: d.id, qid: d.data().qid === undefined ? 99999 : d.data().qid }));
            items.sort((a, b) => a.qid - b.qid);
            
            const dragIdx = items.findIndex(i => i.id === data.id);
            const tgtIdx = items.findIndex(i => i.id === targetId);
            if (dragIdx > -1 && tgtIdx > -1) {
                const [dragItem] = items.splice(dragIdx, 1);
                items.splice(tgtIdx, 0, dragItem); 
                const batch = db.batch();
                items.forEach((item, index) => { batch.update(query.doc(item.id), { qid: index + 1 }); });
                await batch.commit();
            }
        } else {
            const batch = db.batch();
            data.ids.forEach(itemId => batch.update(query.doc(itemId), { [field]: tgtCat }));
            await batch.commit();
        }
    }
    window.hideLoading(); window.refreshView(colName);
};

window.refreshView = function(colName) { 
    if(colName === 'subjects') window.loadSubjects(); 
    else if(colName === 'questions') { window.fetchAllQuestions().then(()=>window.renderManagementList()); } 
    else if(colName === 'comparisons') window.openComparisonManager(); 
    else if(colName === 'notes') window.openNoteManager(); 
};

window.execInlineMove = async function(itemId, colName) {
    const sel = document.getElementById(`move-sel-${itemId}`).value; const inp = document.getElementById(`move-inp-${itemId}`).value.trim();
    const targetCat = inp || sel; if(!targetCat) return window.showToast("이동할 위치를 지정하세요.");
    window.showLoading(); const field = colName === 'subjects' ? 'semester' : 'category';
    let ref = db.collection(colName).doc(itemId); if(colName !== 'subjects') ref = db.collection('subjects').doc(window.currentSubjectId).collection(colName).doc(itemId);
    await ref.update({ [field]: targetCat }); window.hideLoading(); window.refreshView(colName);
};

window.execCatMove = async function(oldCat, catId, colName) {
    const sel = document.getElementById(`cat-move-sel-${catId}`).value; const inp = document.getElementById(`cat-move-inp-${catId}`).value.trim();
    const parentCat = inp || sel; if(!parentCat) return window.showToast("상위 폴더를 지정하세요.");
    const folderName = oldCat.split('/').pop(); const newCatName = parentCat === '최상위' ? folderName : parentCat + '/' + folderName;
    if (newCatName === oldCat) return; window.showLoading();
    const field = colName === 'subjects' ? 'semester' : 'category';
    let query = db.collection(colName); if (colName !== 'subjects') query = db.collection('subjects').doc(window.currentSubjectId).collection(colName);
    const snap = await query.where(field, '==', oldCat).get(); const batch = db.batch();
    snap.docs.forEach(doc => batch.update(doc.ref, { [field]: newCatName })); await batch.commit();
    
    const orderRef = db.collection('settings').doc(`order_${colName}_${window.currentSubjectId||'main'}`);
    const doc = await orderRef.get(); let order = doc.exists && doc.data().order ? doc.data().order : [];
    const idx = order.indexOf(oldCat); if (idx !== -1) { order[idx] = newCatName; await orderRef.set({ order }); }
    window.hideLoading(); window.refreshView(colName);
};

window.deleteCategoryPrompt = async function(catName, colName) {
    if(!confirm(`'${catName}' 폴더와 안의 모든 내용을 삭제할까요?`)) return; window.showLoading();
    const field = colName === 'subjects' ? 'semester' : 'category'; let query = db.collection(colName); if(colName !== 'subjects') query = db.collection('subjects').doc(window.currentSubjectId).collection(colName);
    const snap = await query.where(field, '==', catName).get(); const batch = db.batch(); snap.docs.forEach(doc => batch.delete(doc.ref)); await batch.commit();
    
    const orderRef = db.collection('settings').doc(`order_${colName}_${window.currentSubjectId||'main'}`);
    const doc = await orderRef.get(); let order = doc.exists && doc.data().order ? doc.data().order : [];
    order = order.filter(c => c !== catName); await orderRef.set({ order });
    window.hideLoading(); window.refreshView(colName);
};

window.renameCategoryPrompt = async function(oldName, colName) {
    const newName = prompt(`새 이름 (슬래시/로 하위폴더 지정 가능):`, oldName);
    if (!newName || newName === oldName) return; window.showLoading();
    const field = colName === 'subjects' ? 'semester' : 'category'; let query = db.collection(colName); if (colName !== 'subjects') query = db.collection('subjects').doc(window.currentSubjectId).collection(colName);
    const snap = await query.where(field, '==', oldName).get(); const batch = db.batch(); snap.docs.forEach(doc => batch.update(doc.ref, { [field]: newName })); await batch.commit();
    
    const orderRef = db.collection('settings').doc(`order_${colName}_${window.currentSubjectId||'main'}`);
    const doc = await orderRef.get(); let order = doc.exists && doc.data().order ? doc.data().order : [];
    const idx = order.indexOf(oldName); if (idx !== -1) { order[idx] = newName; await orderRef.set({ order }); }
    window.hideLoading(); window.refreshView(colName);
};

window.lastRenderedCategories = {};

// 🚨 4. 메인 과목 렌더링 (강제 알파벳 정렬 버그 완벽 제거)
window.loadSubjects = async function() {
    const snap = await window.fetchWithCache(db.collection('subjects')); window.allSubjects = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const list = document.getElementById('subject-list'); if(!list) return;
    const grouped = window.allSubjects.reduce((acc, s) => { const cat = s.semester || "미분류"; if(!acc[cat]) acc[cat] = []; acc[cat].push(s); return acc; }, {});
    
    const orderDoc = await db.collection('settings').doc('order_subjects_main').get();
    let savedOrder = orderDoc.exists && orderDoc.data().order ? orderDoc.data().order : [];
    let groupedKeys = Object.keys(grouped).sort(); 
    
    // 강제 .sort() 제거! 저장된 D&D 순서(savedOrder)를 100% 우선 존중
    let allCats = Array.from(new Set([...savedOrder, ...groupedKeys])); 
    allCats.forEach(c => { if(!grouped[c]) grouped[c] = []; }); window.lastRenderedCategories['subjects'] = allCats;

    let html = '';
    allCats.forEach(cat => {
        const catId = cat.replace(/[^a-zA-Z0-9]/g, '-');
        const catOpts = allCats.filter(c => c !== cat).map(c=>`<option value="${c}">${c}</option>`).join('');
        const depth = (cat.match(/\//g) || []).length; const indent = depth * 25; const folderName = cat.split('/').pop();
        
        // 폴더 내 아이템 고유번호(qid) 기준 정렬 
        grouped[cat].sort((a, b) => (a.qid || 0) - (b.qid || 0));

        html += `<div class="category-group" data-cat="${cat}" style="margin-left:${indent}px; margin-bottom:15px; border:2px solid #e2e8f0; border-radius:12px; background:white; overflow:hidden;">
            <div draggable="true" ondragstart="window.onDragStart(event, 'category', '${cat}', 'subjects', '${cat}')" ondragover="window.onDragOverCat(event)" ondragleave="window.onDragLeaveCat(event)" ondrop="window.onDropOnCategory(event, '${cat}', 'subjects')" 
                 style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:15px; cursor:pointer;" onclick="window.toggleFolder('${cat}', 'subj-icon-${catId}')">
                <h3 style="margin:0; font-size:1.1em; color:#1e40af;"><span id="subj-icon-${catId}">${window.collapsedFolders.includes(cat)?'📁':'📂'}</span> ${window.esc(folderName)} <span style="font-size:0.7em; color:#94a3b8;">(${grouped[cat].length})</span></h3>
                <div style="display:flex; gap:5px;" onclick="event.stopPropagation()">
                    <button class="button small-button light-button" onclick="window.toggleCatMoveUI('${catId}')">📂 이동</button>
                    <button class="button small-button light-button" onclick="window.renameCategoryPrompt('${cat}', 'subjects')">✏️</button>
                    <button class="button small-button" style="color:red; background:#fee2e2; border:none;" onclick="window.deleteCategoryPrompt('${cat}', 'subjects')">🗑️</button>
                </div>
            </div>
            <div id="cat-move-ui-${catId}" class="hidden" style="padding:15px; background:#fffbeb; border-bottom:1px solid #fcd34d; display:flex; gap:10px; align-items:center;" onclick="event.stopPropagation()">
                <span style="font-weight:bold; color:#b45309;">상위 폴더:</span>
                <select id="cat-move-sel-${catId}" style="flex:1; padding:8px; border-radius:6px;"><option value="최상위">-- 최상위로 빼기 --</option>${catOpts}</select>
                <input type="text" id="cat-move-inp-${catId}" placeholder="새 폴더명" style="flex:1; padding:8px; border-radius:6px;">
                <button class="button primary-button" style="background:#b45309; border:none;" onclick="window.execCatMove('${cat}', '${catId}', 'subjects')">이동 적용</button>
            </div>
            
            <div class="cat-content-wrapper" data-parent-cat="${cat}" style="padding:10px; background:white;">
            ${grouped[cat].length === 0 ? '<div style="padding:15px; text-align:center; color:#94a3b8;">항목을 끌어다 놓으세요.</div>' : ''}
            ${grouped[cat].map(s => `
                <div class="draggable-item" draggable="true" ondragstart="window.onDragStart(event, 'item', '${s.id}', 'subjects', '${cat}')" ondragover="window.onDragOverItem(event)" ondragleave="window.onDragLeaveItem(event)" ondrop="window.onDropOnItem(event, '${s.id}', 'subjects')"
                     style="background:white; padding:15px; border:1px solid #f1f5f9; border-radius:10px; margin-bottom:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:10px; flex:1;">
                            <input type="checkbox" class="subj-ck" value="${s.id}">
                            <b style="color:#334155; font-size:1.1em;">${window.esc(s.name)}</b>
                        </div>
                        <div style="display:flex; gap:5px; flex-wrap:wrap; justify-content:flex-end;">
                            <button class="button small-button light-button" onclick="window.toggleInlineMoveUI('${s.id}')">📂 이동</button>
                            <button class="button small-button" style="background:#3b82f6; color:white; border:none;" onclick="window.handleStartQuiz('${s.id}')">퀴즈</button>
                            <button class="button small-button" style="background:#10b981; color:white; border:none;" onclick="window.startFlashcard('${s.id}')">O/X</button>
                            <button class="button small-button" style="background:#f59e0b; color:white; border:none;" onclick="window.startConnectionQuiz('${s.id}')">🔗 연결</button>
                            <button class="button small-button" style="background:#ec4899; color:white; border:none;" onclick="window.startRhythmMenu('${s.id}')">🎵 리듬</button>
                            <button class="button small-button secondary-button" style="background:#64748b; color:white; border:none;" onclick="window.manageSubject('${s.id}')">관리</button>
                        </div>
                    </div>
                    <div id="move-ui-${s.id}" class="hidden" style="margin-top:15px; padding:15px; background:#f1f5f9; border-radius:8px; border:1px dashed #cbd5e1; display:flex; gap:10px; align-items:center;">
                        <span style="font-weight:bold; color:#475569;">이동할 위치:</span>
                        <select id="move-sel-${s.id}" style="flex:1; padding:10px; border-radius:6px;"><option value="">-- 폴더 선택 --</option>${catOpts}</select>
                        <input type="text" id="move-inp-${s.id}" placeholder="새 폴더명 (예: 수학/1단원)" style="flex:1; padding:10px; border-radius:6px;">
                        <button class="button primary-button" style="padding:10px 20px;" onclick="window.execInlineMove('${s.id}', 'subjects')">확인</button>
                    </div>
                </div>`).join('')}
            </div>
        </div>`;
    }); 
    list.innerHTML = html; window.updateFolderVisibility();
};

window.addSubject = async function() { const n = document.getElementById('new-subject-name').value.trim(); const c = document.getElementById('new-subject-category').value.trim() || "미분류"; if(!n) return alert("입력 필요"); window.showLoading(); try { await db.collection('subjects').add({ name: n, semester: c, createdAt: firebase.firestore.FieldValue.serverTimestamp(), qid: new Date().getTime() }); window.closeModal(); await window.loadSubjects(); } catch(e) {} window.hideLoading(); };

// =========================================================
// [v9.9.5] app-logic.js: Part 2 - Global Audio Stop & Clean TTS
// =========================================================

// 🚨 전역 화면 전환 감지 (메인 화면 이동 시 오디오 자동 종료 패치)
if(!window.isViewHooked) {
    const origShowView = window.showView;
    window.showView = function(id) {
        window.audioSessionId++;
        window.isAudioPlaying = false;
        window.currentPlayingNoteId = null;
        window.currentPlayingCompId = null;
        if(window.speechSynthesis) window.speechSynthesis.cancel();
        // 모든 오디오 버튼 UI 초기화
        document.querySelectorAll('.audio-btn').forEach(b => { b.innerHTML = "🎧 듣기"; b.style.background = ""; b.style.color = "#b45309"; });
        origShowView(id);
    };
    window.isViewHooked = true;
}

// --- 4. 지식 관리 (문제 리스트 & 북마크 필터) ---
window.manageSubject = async function(id) { window.currentSubjectId = id; localStorage.setItem('lastSubjectId', id); window.showLoading(); const doc = await window.fetchDocWithCache(db.collection('subjects').doc(id)); window.currentSubjectData = doc.data(); await window.fetchAllQuestions(); window.renderManagementView(); window.hideLoading(); };
window.fetchAllQuestions = async function() { const snap = await window.fetchWithCache(db.collection('subjects').doc(window.currentSubjectId).collection('questions')); window.allQuestionsForSubject = snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => (a.qid||0)-(b.qid||0)); window.filteredQuestionsForSubject = [...window.allQuestionsForSubject]; };

window.renderManagementView = function() {
    window.showView('management-view');
    document.getElementById('management-view').innerHTML = `<div style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;"><h2>[${window.currentSubjectData.name}] 지식 관리</h2><div style="display:flex; gap:10px;"><button class="button small-button" style="background:#8b5cf6; color:white; border:none;" onclick="window.openComparisonManager()">📊 비교표</button> <button class="button small-button" style="background:#10b981; color:white; border:none;" onclick="window.openNoteManager()">📚 노트</button></div></div>
    <div style="background:#f8fafc; padding:15px; border-radius:12px; margin-bottom:15px; display:flex; gap:10px; flex-wrap:wrap;"><button class="button small-button light-button" onclick="window.selectAll(true)">전체 선택</button><button class="button small-button light-button" onclick="window.selectAll(false)">해제</button><button class="button small-button" style="background:#dbeafe; color:#1e40af; border:1px solid #bfdbfe;" onclick="window.copySelected()">선택 복사</button><button class="button small-button" style="background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5;" onclick="window.deleteSelected()">선택 삭제</button><button class="button small-button primary-button" style="background:#8b5cf6; border:none;" onclick="window.toggleInlineCreateUI('questions')">+ 새 폴더 생성</button><div style="flex:1;"></div><button class="button small-button primary-button" onclick="window.showFullEditView()">+ 개별 추가</button><button class="button small-button" style="background:#ec4899; color:white; border:none;" onclick="window.showBulkAddModal()">🤖 스마트 추가</button></div>
    <div id="inline-create-questions" class="hidden" style="margin-bottom:15px; padding:15px; background:#f1f5f9; border-radius:10px; border:2px dashed #cbd5e1; display:flex; gap:10px;"><input type="text" id="create-inp-questions" placeholder="새 폴더명 입력" style="flex:1; padding:10px; border-radius:6px; border:1px solid #cbd5e1;"><button class="button primary-button" onclick="window.execInlineCreate('questions')">생성</button><button class="button light-button" onclick="window.toggleInlineCreateUI('questions')">취소</button></div>
    <div style="display:flex; gap:10px; margin-bottom:15px;">
        <input type="text" id="manage-search" placeholder="지식 내용 검색..." style="flex:1; padding:15px; border-radius:10px; border:2px solid #cbd5e1;" onkeyup="window.filterManagementList()">
        <button id="bm-filter-btn" class="button light-button" style="padding:0 15px; font-weight:bold; color:#f59e0b; border:1px solid #fcd34d;" onclick="window.toggleBmFilter()">⭐ 북마크</button>
        <button id="gcm-filter-btn" class="button light-button" style="padding:0 15px; font-weight:bold;" onclick="window.toggleGcmFilter()">🔗 GCM</button>
    </div><div id="q-list-wrapper"></div>`;
    window.renderManagementList();
};

window.isBmFilterOn = false;
window.toggleBmFilter = function() { window.isBmFilterOn = !window.isBmFilterOn; const btn = document.getElementById('bm-filter-btn'); btn.style.background = window.isBmFilterOn ? "#fef3c7" : "white"; window.filterManagementList(); };
window.toggleGcmFilter = function() { window.isGcmFilterOn = !window.isGcmFilterOn; const btn = document.getElementById('gcm-filter-btn'); btn.style.background = window.isGcmFilterOn ? "#f59e0b" : "#f1f5f9"; btn.style.color = window.isGcmFilterOn ? "white" : "#334155"; window.filterManagementList(); };

window.filterManagementList = () => { 
    const kw=document.getElementById('manage-search').value.toLowerCase(); 
    window.filteredQuestionsForSubject=window.allQuestionsForSubject.filter(q=>{ 
        const mKw=(q.text||'').toLowerCase().includes(kw) || (q.answer||'').toLowerCase().includes(kw); 
        const mGcm=window.isGcmFilterOn?!!q.knowledgeNetwork:true; 
        const mBm=window.isBmFilterOn?!!q.bookmarked:true;
        return mKw && mGcm && mBm; 
    }); 
    window.renderManagementList(); 
};

window.selectAll = (b) => document.querySelectorAll('.q-ck').forEach(c=>c.checked=b);
window.deleteSelected = async () => { const ids=Array.from(document.querySelectorAll('.q-ck:checked')).map(c=>c.value); if(ids.length===0||!confirm("삭제할까요?"))return; window.showLoading(); for(let id of ids) await db.collection('subjects').doc(window.currentSubjectId).collection('questions').doc(id).delete(); window.manageSubject(window.currentSubjectId); };
window.deleteProblem = async (id) => { if(confirm("삭제할까요?")){ window.showLoading(); await db.collection('subjects').doc(window.currentSubjectId).collection('questions').doc(id).delete(); window.manageSubject(window.currentSubjectId); } };
window.copySelected = async () => { const ids=Array.from(document.querySelectorAll('.q-ck:checked')).map(c=>c.value); if(ids.length===0||!confirm("선택 항목을 복사할까요?")) return; window.showLoading(); for(let id of ids) { const doc = await db.collection('subjects').doc(window.currentSubjectId).collection('questions').doc(id).get(); if(doc.exists) { let d = doc.data(); d.text = "[복사본] " + d.text; d.createdAt = firebase.firestore.FieldValue.serverTimestamp(); d.updatedAt = firebase.firestore.FieldValue.serverTimestamp(); d.qid = window.allQuestionsForSubject.length + 1; await db.collection('subjects').doc(window.currentSubjectId).collection('questions').add(d); } } window.manageSubject(window.currentSubjectId); };

window.toggleBookmark = async function(id, currentStatus) {
    window.showLoading();
    try {
        await db.collection('subjects').doc(window.currentSubjectId).collection('questions').doc(id).update({ bookmarked: !currentStatus });
        await window.fetchAllQuestions();
        window.renderManagementList();
    } catch(e) { alert("북마크 실패"); }
    window.hideLoading();
};

window.renderManagementList = async () => { 
    const wrap = document.getElementById('q-list-wrapper'); if(!wrap) return; 
    if(window.filteredQuestionsForSubject.length === 0) return wrap.innerHTML = '<div style="padding:40px; text-align:center; background:white; border-radius:12px; border:1px solid #cbd5e1;">데이터 없음</div>';
    
    const grouped = window.filteredQuestionsForSubject.reduce((acc, q) => { const cat = q.category || '미분류'; if(!acc[cat]) acc[cat] = []; acc[cat].push(q); return acc; }, {});
    const orderDoc = await db.collection('settings').doc(`order_questions_${window.currentSubjectId}`).get();
    let savedOrder = orderDoc.exists && orderDoc.data().order ? orderDoc.data().order : [];
    let groupedKeys = Object.keys(grouped).sort();
    let allCats = Array.from(new Set([...savedOrder, ...groupedKeys]));
    allCats.forEach(c => { if(!grouped[c]) grouped[c] = []; }); window.lastRenderedCategories['questions'] = allCats;

    let html = '';
    allCats.forEach(cat => {
        const catId = cat.replace(/[^a-zA-Z0-9]/g, '-');
        const depth = (cat.match(/\//g) || []).length; const indent = depth * 25; const folderName = cat.split('/').pop();
        const catOpts = allCats.filter(c => c !== cat).map(c=>`<option value="${c}">${c}</option>`).join('');
        
        grouped[cat].sort((a,b) => (a.qid||0) - (b.qid||0)); 

        html += `<div class="category-group" data-cat="${cat}" style="margin-left:${indent}px; margin-bottom:15px; border:1px solid #cbd5e1; border-radius:10px; overflow:hidden; background:white;">
            <div draggable="true" ondragstart="window.onDragStart(event, 'category', '${cat}', 'questions', '${cat}')" ondragover="window.onDragOverCat(event)" ondragleave="window.onDragLeaveCat(event)" ondrop="window.onDropOnCategory(event, '${cat}', 'questions')"
                 style="background:#f1f5f9; padding:12px 15px; display:flex; justify-content:space-between; cursor:pointer;" onclick="window.toggleFolder('${cat}', 'q-icon-${catId}')">
                <b style="color:#1e40af; display:flex; align-items:center; gap:8px;"><span id="q-icon-${catId}">${window.collapsedFolders.includes(cat)?'📁':'📂'}</span> ${window.esc(folderName)} <span style="font-size:0.8em; font-weight:normal;">(${grouped[cat].length})</span></b>
                <div style="display:flex; gap:5px;" onclick="event.stopPropagation()">
                    <button class="button small-button light-button" onclick="window.toggleCatMoveUI('${catId}')">이동</button>
                    <button class="button small-button light-button" onclick="window.renameCategoryPrompt('${cat}', 'questions')">✏️</button>
                    <button class="button small-button light-button" style="color:red;" onclick="window.deleteCategoryPrompt('${cat}', 'questions')">🗑️</button>
                </div>
            </div>
            
            <div id="cat-move-ui-${catId}" class="hidden" style="padding:10px 15px; background:#fffbeb; border-bottom:1px solid #fcd34d; display:flex; gap:10px; align-items:center;" onclick="event.stopPropagation()">
                <span style="font-weight:bold; color:#b45309; font-size:0.9em;">상위 폴더 지정:</span>
                <select id="cat-move-sel-${catId}" style="flex:1; padding:8px; border-radius:6px;"><option value="최상위">-- 최상위로 분리 --</option>${catOpts}</select>
                <input type="text" id="cat-move-inp-${catId}" placeholder="새 부모 폴더명" style="flex:1; padding:8px; border-radius:6px;">
                <button class="button primary-button" style="background:#b45309; border:none; padding:8px 15px;" onclick="window.execCatMove('${cat}', '${catId}', 'questions')">적용</button>
            </div>

            <div class="cat-content-wrapper" data-parent-cat="${cat}" style="padding:10px;">
                ${grouped[cat].length === 0 ? '<div style="padding:15px; text-align:center; color:#94a3b8; font-size:0.9em;">항목을 끌어다 놓으세요.</div>' : ''}
                ${grouped[cat].map((q, i) => {
                    let thumb = '';
                    if(q.images && q.images.length > 0 && q.images[0].url) thumb = `<img src="${q.images[0].url}" style="height:24px; width:24px; object-fit:cover; border-radius:4px; margin-right:8px;">`;
                    else if(q.imageUrl) thumb = `<img src="${q.imageUrl}" style="height:24px; width:24px; object-fit:cover; border-radius:4px; margin-right:8px;">`;
                    
                    return `<div class="draggable-item" draggable="true" ondragstart="window.onDragStart(event, 'item', '${q.id}', 'questions', '${cat}')" ondragover="window.onDragOverItem(event)" ondragleave="window.onDragLeaveItem(event)" ondrop="window.onDropOnItem(event, '${q.id}', 'questions')"
                         style="padding:12px; border-radius:8px; border:1px solid ${q.bookmarked?'#fde68a':'#f1f5f9'}; display:flex; flex-direction:column; margin-bottom:5px; background:${q.bookmarked?'#fffbeb':'white'};">
                        <div style="display:flex; align-items:center; gap:10px; cursor:pointer;" onclick="window.showFullEditView('${q.id}')">
                            <input type="checkbox" class="q-ck" value="${q.id}" onclick="event.stopPropagation()">
                            <button style="background:none; border:none; font-size:1.2em; cursor:pointer; padding:0;" onclick="event.stopPropagation(); window.toggleBookmark('${q.id}', ${!!q.bookmarked})">${q.bookmarked?'⭐':'☆'}</button>
                            <div style="flex:1; display:flex; align-items:center;">${thumb}<b>#${q.qid||i+1}</b>&nbsp;${window.esc(q.text).substring(0,50)}...</div>
                            <div style="display:flex; gap:5px;" onclick="event.stopPropagation()">
                                <button class="button small-button light-button" onclick="window.toggleInlineMoveUI('${q.id}')">📂 이동</button>
                                <button class="button small-button light-button" style="color:red;" onclick="window.deleteProblem('${q.id}')">삭제</button>
                            </div>
                        </div>
                        <div id="move-ui-${q.id}" class="hidden" style="margin-top:10px; padding:10px; background:#f8fafc; border-radius:6px; border:1px dashed #cbd5e1; display:flex; gap:8px;" onclick="event.stopPropagation()">
                            <select id="move-sel-${q.id}" style="flex:1; padding:5px; border-radius:4px;"><option value="">-- 부모 폴더 선택 --</option>${catOpts}</select>
                            <input type="text" id="move-inp-${q.id}" placeholder="새 이름 (상위폴더/이름)" style="width:120px; padding:5px;">
                            <button class="button small-button primary-button" onclick="window.execInlineMove('${q.id}', 'questions')">확인</button>
                        </div>
                    </div>`;
                }).join('')}
            </div></div>`;
    }); 
    wrap.innerHTML = html; window.updateFolderVisibility();
};

// --- 5. 일반 퀴즈 엔진 및 헬퍼 ---
window.getOptions = (q) => { 
    const type = String(q.negativeType || '').toLowerCase(); const ans = String(q.answer||'').trim(); 
    if(type.match(/ox|o\/x|진위/i) || ans.startsWith('O') || ans.startsWith('X') || ans.includes('맞다') || ans.includes('틀리다')) return ['O (맞다)', 'X (틀리다)'];
    let o = (q.options && q.options.length >= 2) ? [...q.options] : [ans]; while(o.length < 4) { const r = window.allQuestionsForSubject[Math.floor(Math.random()*window.allQuestionsForSubject.length)]?.answer; if(r && typeof r === 'string' && !o.includes(r)) o.push(r); if(o.length >= 4 || o.length >= window.allQuestionsForSubject.length) break; } return o.filter(Boolean).map(String).sort(() => Math.random()-0.5); 
};
window.extractBlankWord = (q) => { if(q.keywords?.length) return q.keywords[0]; const w = q.text.split(' ').filter(x => x.length >= 3); return w.length ? w[0] : null; };

window.handleStartQuiz = async function(id) { window.currentSubjectId=id; window.showLoading(); const snap=await window.fetchWithCache(db.collection('subjects').doc(id).collection('questions')); window.allQuestionsForSubject=snap.docs.map(d=>({id:d.id,...d.data()})); window.hideLoading(); window.quizQuestions=[...window.allQuestionsForSubject].sort(()=>Math.random()-0.5); window.currentQuizIndex=0; window.quizScore=0; window.isAudioPlaying = false; window.showView('quiz-view'); window.displayCurrentQuiz(); };

window.toggleInlineBookmarkList = function() {
    const el = document.getElementById('inline-bm-list');
    if(!el) return;
    if(el.classList.contains('hidden')) {
        const bms = window.quizQuestions.map((q, idx) => ({q, idx})).filter(x => x.q.bookmarked);
        if(bms.length === 0) return alert("북마크된 문제가 없습니다.");
        let listHtml = bms.map(b => `<button class="button light-button" style="text-align:left; padding:10px 15px; margin:5px; font-size:0.95em; border:1px solid #cbd5e1; background:white; cursor:pointer; border-radius:8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; box-shadow:0 2px 4px rgba(0,0,0,0.05);" onclick="window.currentQuizIndex=${b.idx}; window.displayCurrentQuiz();">⭐ #${b.idx+1} : ${window.esc(b.q.text).substring(0, 30)}...</button>`).join('');
        el.innerHTML = `<div style="padding:15px; background:#fffbeb; border:2px solid #fcd34d; border-radius:12px; margin-bottom:15px; max-height:250px; overflow-y:auto; display:flex; flex-wrap:wrap;">${listHtml}</div>`;
        el.classList.remove('hidden');
    } else {
        el.classList.add('hidden');
    }
};

window.toggleBookmarkFromQuiz = async function(id) {
    const q = window.quizQuestions[window.currentQuizIndex];
    const newStatus = !q.bookmarked;
    q.bookmarked = newStatus;
    const origQ = window.allQuestionsForSubject.find(x => x.id === id);
    if(origQ) origQ.bookmarked = newStatus;
    window.displayCurrentQuiz(); 
    try { await db.collection('subjects').doc(window.currentSubjectId).collection('questions').doc(id).update({ bookmarked: newStatus }); } catch(e) { console.error("북마크 업데이트 실패", e); }
};

// 🚨 오디오 엔진 (TTS) - 알림 제거 및 싱크 안정화
window.audioSessionId = 0;

window.toggleAudioMode = function() {
    if(!('speechSynthesis' in window)) return alert("이 브라우저는 음성 합성을 지원하지 않습니다.");
    if(window.isAudioPlaying) {
        window.isAudioPlaying = false; 
        window.audioSessionId++; 
        window.speechSynthesis.cancel();
        const btn = document.getElementById('audio-mode-btn');
        if(btn) { btn.innerHTML = "🎧 오디오 자동재생"; btn.style.background = "#f1f5f9"; btn.style.color = "#334155"; }
    } else {
        window.isAudioPlaying = true;
        const btn = document.getElementById('audio-mode-btn');
        if(btn) { btn.innerHTML = "⏹ 오디오 중지"; btn.style.background = "#fecaca"; btn.style.color = "#b91c1c"; }
        window.playCurrentAudioAndNext();
    }
};

window.playCurrentAudioAndNext = function() {
    if(!window.isAudioPlaying) return;
    window.audioSessionId++; 
    let currentSession = window.audioSessionId;
    window.speechSynthesis.cancel(); 

    if(window.currentQuizIndex >= window.quizQuestions.length) { 
        window.isAudioPlaying = false;
        const btn = document.getElementById('audio-mode-btn');
        if(btn) { btn.innerHTML = "🎧 오디오 자동재생"; btn.style.background = "#f1f5f9"; btn.style.color = "#334155"; }
        // 🚨 거슬리는 종료 알림창(alert) 제거
        return; 
    }
    
    const q = window.quizQuestions[window.currentQuizIndex];
    let koVoices = window.speechSynthesis.getVoices().filter(v => v.lang.includes('ko') || v.lang.includes('KR'));
    if(koVoices.length === 0) koVoices = window.speechSynthesis.getVoices(); 
    const vBase = koVoices[0 % koVoices.length];
    
    let sequence = [];
    sequence.push({ text: `문제 ${window.currentQuizIndex + 1}번. ${q.text}.`, voice: vBase, pitch: 1.0 });
    
    if(window.quizLevel <= 2 && q.options && q.options.length > 0) {
        let optText = "선택지. ";
        q.options.forEach((opt, i) => optText += `${i+1}번. ${opt}. `);
        sequence.push({ text: optText, voice: vBase, pitch: 1.3 });
    }
    
    sequence.push({ text: `정답은. ${q.answer} 입니다.`, voice: vBase, pitch: 0.8 });
    
    let expText = "";
    if(q.diagramFormula) expText += `관련 공식. ${q.diagramFormula}. `;
    if(window.rhythmLevel === 2 && q.explanation) expText += `해설. ${q.explanation}. `;
    if(expText) sequence.push({ text: expText, voice: vBase, pitch: 1.1 });

    let seqIndex = 0;
    function speakNext() {
        if(!window.isAudioPlaying || currentSession !== window.audioSessionId) return; 
        if(seqIndex >= sequence.length) {
            window.currentQuizIndex++;
            window.displayCurrentQuiz();
            setTimeout(() => { if(currentSession === window.audioSessionId) window.playCurrentAudioAndNext(); }, 1500 / window.currentRhythmSpeed);
            return;
        }
        
        let u = new SpeechSynthesisUtterance(sequence[seqIndex].text);
        u.voice = sequence[seqIndex].voice; u.pitch = sequence[seqIndex].pitch; u.rate = window.currentRhythmSpeed || 1.0; u.lang = 'ko-KR';
        
        u.onend = function() { if(window.isAudioPlaying && currentSession === window.audioSessionId) { seqIndex++; speakNext(); } };
        u.onerror = function(e) { console.warn("TTS Interrupted"); }; 
        window.speechSynthesis.speak(u);
    }
    speakNext(); 
};

window.jumpQuiz = function(action) {
    let wasPlaying = window.isAudioPlaying;
    if(wasPlaying) {
        window.isAudioPlaying = false; 
        window.audioSessionId++; 
        window.speechSynthesis.cancel(); 
    }

    if(action === 'first') window.currentQuizIndex = 0;
    else if(action === 'prev') window.currentQuizIndex = Math.max(0, window.currentQuizIndex - 1);
    else if(action === 'next') window.currentQuizIndex = Math.min(window.quizQuestions.length - 1, window.currentQuizIndex + 1);
    else if(action === 'last') window.currentQuizIndex = window.quizQuestions.length - 1;
    else if(action === 'go') {
        let val = parseInt(document.getElementById('quiz-jump-input').value) - 1;
        if(!isNaN(val) && val >= 0 && val < window.quizQuestions.length) window.currentQuizIndex = val;
        else { alert("유효한 번호를 입력하세요."); return; }
    }
    else if(action === 'next-bm' || action === 'prev-bm') {
        let step = action === 'next-bm' ? 1 : -1;
        let found = -1; let len = window.quizQuestions.length;
        for(let i = 1; i <= len; i++) {
            let idx = (window.currentQuizIndex + (i * step) + len) % len;
            if(window.quizQuestions[idx].bookmarked) { found = idx; break; }
        }
        if(found !== -1) window.currentQuizIndex = found;
        else { alert("북마크된 문제가 없습니다."); return; }
    }
    
    window.displayCurrentQuiz();
    
    if(wasPlaying) {
        window.isAudioPlaying = true;
        setTimeout(() => window.playCurrentAudioAndNext(), 500); 
    }
};

window.generateImageHtml = function(q) {
    let imgHtml = '';
    if (q.images && q.images.length > 0) {
        let validImgs = q.images.filter(img => img.url);
        if (validImgs.length > 0) {
            imgHtml = '<div style="display:flex; justify-content:center; gap:15px; flex-wrap:wrap; margin:15px 0;">';
            validImgs.forEach(img => {
                let safeDesc = window.esc(img.desc||'').replace(/'/g,"\\'").replace(/"/g,"&quot;");
                imgHtml += `<div style="text-align:center; flex:1; min-width:200px; max-width:32%;"><img src="${window.esc(img.url)}" onclick="window.openImageModal(this.src, '${safeDesc}')" style="max-width:100%; max-height:200px; border-radius:8px; box-shadow:0 4px 6px rgba(0,0,0,0.1); cursor:zoom-in;"><p style="font-size:0.85em; color:#64748b; margin-top:8px;">${window.esc(img.desc||'')}</p></div>`;
            });
            imgHtml += '</div>';
        }
    } else if (q.imageUrl) { 
        let safeDesc = window.esc(q.imageDesc||'').replace(/'/g,"\\'").replace(/"/g,"&quot;");
        imgHtml = `<div style="text-align:center; margin:15px 0;"><img src="${window.esc(q.imageUrl)}" onclick="window.openImageModal(this.src, '${safeDesc}')" style="max-width:100%; max-height:250px; border-radius:8px; box-shadow:0 4px 6px rgba(0,0,0,0.1); cursor:zoom-in;"><p style="font-size:0.85em; color:#64748b; margin-top:8px;">${window.esc(q.imageDesc||'')}</p></div>`;
    }
    return imgHtml;
};

window.displayCurrentQuiz = function() {
    if(window.currentQuizIndex >= window.quizQuestions.length) { document.getElementById('quiz-view').innerHTML = `<div style="text-align:center; padding:40px;"><h2>학습 완료!</h2><p>최종 점수: ${window.quizScore}</p><button class="button primary-button" onclick="window.showView('subject-view')">메인으로</button></div>`; return; }
    const q=window.quizQuestions[window.currentQuizIndex]; window.selectedOption=null; window.currentBlankWord=null; let qText = q.text || '';
    if(window.quizLevel === 2 || window.quizLevel === 4) { window.currentBlankWord = window.extractBlankWord(q); if(window.currentBlankWord) qText = qText.replace(new RegExp(window.currentBlankWord, 'g'), '[ ❓ ]'); }
    
    let audioBtnState = window.isAudioPlaying ? `style="padding:5px 10px; background:#fecaca; color:#b91c1c; border:1px solid #fca5a5;"` : `style="padding:5px 10px; background:#f1f5f9; color:#334155; border:1px solid #cbd5e1;"`;
    let audioBtnText = window.isAudioPlaying ? `⏹ 오디오 중지` : `🎧 오디오 자동재생`;

    let html = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-wrap:wrap; gap:10px;">
        <div style="display:flex; align-items:center; gap:8px;">
            <span style="color:#6366f1; font-weight:bold; font-size:1.1em; display:flex; align-items:center; gap:5px;">
                #${window.currentQuizIndex+1} (Lv.${window.quizLevel})
                <button style="background:none; border:none; cursor:pointer; font-size:1.2em; padding:0;" onclick="window.toggleBookmarkFromQuiz('${q.id}')" title="문제 북마크 저장">${q.bookmarked?'⭐':'☆'}</button>
            </span>
            <button class="button small-button light-button" style="padding:4px 8px; font-weight:bold; color:#b45309; border:1px solid #fcd34d; background:white;" onclick="window.toggleInlineBookmarkList()">⭐ 목록</button>
        </div>
        
        <div style="display:flex; gap:5px; align-items:center; background:#f1f5f9; padding:5px 10px; border-radius:8px; border:1px solid #cbd5e1;">
            <button class="button small-button light-button" style="padding:5px; color:#f59e0b;" onclick="window.jumpQuiz('prev-bm')" title="이전 북마크">⭐◀</button>
            <button class="button small-button light-button" style="padding:5px;" onclick="window.jumpQuiz('first')">⏮</button>
            <button class="button small-button light-button" style="padding:5px;" onclick="window.jumpQuiz('prev')">◀</button>
            <input type="number" id="quiz-jump-input" value="${window.currentQuizIndex+1}" style="width:45px; text-align:center; border:1px solid #cbd5e1; border-radius:4px; padding:4px; font-weight:bold;"> 
            <span style="color:#64748b; font-size:0.9em;">/ ${window.quizQuestions.length}</span>
            <button class="button small-button primary-button" style="padding:5px 10px; margin-left:5px;" onclick="window.jumpQuiz('go')">이동</button>
            <button class="button small-button light-button" style="padding:5px;" onclick="window.jumpQuiz('next')">▶</button>
            <button class="button small-button light-button" style="padding:5px;" onclick="window.jumpQuiz('last')">⏭</button>
            <button class="button small-button light-button" style="padding:5px; color:#f59e0b;" onclick="window.jumpQuiz('next-bm')" title="다음 북마크">▶⭐</button>
        </div>
        <div style="display:flex; gap:8px;">
            <button id="audio-mode-btn" class="button small-button" ${audioBtnState} onclick="window.toggleAudioMode()">${audioBtnText}</button>
            <button class="button small-button light-button" onclick="window.showView('subject-view')">중단</button>
        </div>
    </div>
    <div id="inline-bm-list" class="hidden"></div>
    <div class="q-text-display" style="background:white; padding:25px; border-radius:15px; border:1px solid #cbd5e1; font-size:1.1em; line-height:1.5;">Q. ${window.esc(qText)}</div>
    ${window.generateImageHtml(q)}`;
    
    if(window.quizLevel <= 2) { 
        window.getOptions(q).forEach((opt, i) => { 
            let optImgHtml = '';
            if (q.options && q.optionImages) {
                const origIdx = q.options.indexOf(opt);
                if (origIdx > -1 && q.optionImages[origIdx]) {
                    let safeOptText = window.esc(opt).replace(/'/g, "\\'").replace(/"/g, "&quot;");
                    optImgHtml = `<div style="margin-top:10px;"><img src="${window.esc(q.optionImages[origIdx])}" onclick="event.stopPropagation(); window.openImageModal(this.src, '선택지 ${i+1}: ${safeOptText}')" style="max-height:120px; border-radius:8px; cursor:zoom-in;"></div>`;
                }
            }
            html += `<div class="quiz-opt" id="opt-${i}" onclick="window.selectQuizOpt('${i}', '${opt.replace(/'/g,"\\'")}')" style="padding:15px; border:1px solid #e2e8f0; border-radius:10px; margin:10px 0; cursor:pointer; background:white; text-align:center; font-size:1.05em;"><b>${i+1}.</b> ${window.esc(opt)} ${optImgHtml}</div>`; 
        }); 
    } 
    else { html += `<div style="margin:15px 0;"><label style="font-weight:bold; font-size:0.9em; color:#64748b;">정답 입력</label><input type="text" id="sub-ans" placeholder="정답을 입력하세요" style="width:100%; padding:15px; border-radius:10px; border:2px solid #cbd5e1; margin-top:5px; box-sizing:border-box;"></div>`; if(window.quizLevel === 4 && window.currentBlankWord) { html += `<div style="margin-bottom:15px;"><label style="font-weight:bold; font-size:0.9em; color:#8b5cf6;">[ ❓ ] 빈칸 단어</label><input type="text" id="blank-ans" placeholder="빈칸에 들어갈 단어 입력" style="width:100%; padding:15px; border-radius:10px; border:2px solid #a5b4fc; margin-top:5px; box-sizing:border-box;"></div>`; } }
    html += `<div id="quiz-fb" class="hidden" style="padding:20px; border-radius:12px; margin:20px 0;"></div><div style="display:flex; gap:10px;"><button id="chk-btn" class="button primary-button" style="flex:1; height:60px;" onclick="window.checkUserAns()">정답 확인</button><button id="nxt-btn" class="button secondary-button hidden" style="flex:1; height:60px;" onclick="window.jumpQuiz('next')">다음 ▶</button></div>`;
    document.getElementById('quiz-view').innerHTML = html;
};

window.selectQuizOpt = (idx, val) => { window.selectedOption = val; document.querySelectorAll('.quiz-opt').forEach(el => el.style.background = 'white'); document.getElementById(`opt-${idx}`).style.background = '#e0e7ff'; };
window.checkUserAns = () => {
    const q = window.quizQuestions[window.currentQuizIndex]; let uAns = (window.quizLevel <= 2) ? window.selectedOption : document.getElementById('sub-ans').value.trim(); let uBlk = (window.quizLevel === 4) ? (document.getElementById('blank-ans')?.value.trim() || "") : null;
    const isWin = (uAns && uAns.toLowerCase() === q.answer.toLowerCase()) && (!window.currentBlankWord || (uBlk && uBlk.toLowerCase() === window.currentBlankWord.toLowerCase()));
    
    let diagHtml = q.diagramFormula ? `<div style="margin-top:15px; padding:15px; background:white; border-left:4px solid #3b82f6; border-radius:4px; box-shadow:0 2px 4px rgba(0,0,0,0.05);"><strong style="color:#1e40af; font-size:1.1em;">📐 도식 및 핵심 공식:</strong><p style="white-space:pre-wrap; margin:10px 0 0 0; font-family:monospace; line-height:1.5; color:#334155;">${window.esc(q.diagramFormula)}</p></div>` : '';
    
    const fb = document.getElementById('quiz-fb'); fb.classList.remove('hidden'); fb.style.background = isWin ? "#f0fdf4" : "#fff5f5"; fb.style.border = isWin ? "1px solid #bbf7d0" : "1px solid #fecaca";
    fb.innerHTML = `<h4>${isWin?'⭕ 정답입니다!':'❌ 오답입니다.'}</h4><p>정답: <b>${window.esc(q.answer)}</b>${window.currentBlankWord ? ' | 빈칸: <b>'+window.esc(window.currentBlankWord)+'</b>' : ''}</p><p style="font-size:0.95em; color:#475569; line-height:1.5;">${window.esc(q.explanation||'')}</p>${diagHtml}`;
    document.getElementById('chk-btn').classList.add('hidden'); document.getElementById('nxt-btn').classList.remove('hidden'); if(isWin) window.quizScore++;
};

// --- 6. 특수 퀴즈 엔진 ---
window.startFlashcard = async function(id) { window.currentSubjectId=id; window.showLoading(); const snap=await window.fetchWithCache(db.collection('subjects').doc(id).collection('questions')); const qs=snap.docs.map(d=>({id:d.id,...d.data()})); window.quizQuestions=qs.map(q=>{ const ans = String(q.answer||'').trim().toUpperCase(); const isExplicitOX = q.negativeType?.match(/ox|o\/x|진위/i) || ans.startsWith('O') || ans.startsWith('X') || ans.includes('맞다') || ans.includes('틀리다'); if (isExplicitOX) { return { ...q, isExplicitOX: true, isCorrectTarget: ans.startsWith('O') || ans.includes('맞다') }; } else { const isC = Math.random()>0.5; return { ...q, isExplicitOX: false, pres: isC ? q.answer : (q.options?.find(o=>o!==q.answer)||"오답 함정"), isCorrectTarget: isC }; } }).sort(()=>Math.random()-0.5); window.hideLoading(); window.currentQuizIndex=0; window.showView('flashcard-view'); window.displayFlashcard(); };
window.displayFlashcard = function() {
    if(window.currentQuizIndex>=window.quizQuestions.length) return window.showView('subject-view'); const q=window.quizQuestions[window.currentQuizIndex]; const limit = 5000 / window.currentRhythmSpeed;
    
    let optImgHtml = '';
    if(!q.isExplicitOX && q.options && q.optionImages) {
        const origIdx = q.options.indexOf(q.pres);
        if(origIdx > -1 && q.optionImages[origIdx]) {
            let safeOptText = window.esc(q.pres).replace(/'/g, "\\'").replace(/"/g, "&quot;");
            optImgHtml = `<div style="margin-top:10px;"><img src="${window.esc(q.optionImages[origIdx])}" onclick="event.stopPropagation(); window.openImageModal(this.src, '제시: ${safeOptText}')" style="max-height:120px; border-radius:8px; cursor:zoom-in;"></div>`;
        }
    }
    let presHtml = q.isExplicitOX ? '' : `<div style="padding:20px; background:#e0e7ff; font-weight:bold; font-size:1.3em; margin-bottom:20px; border-radius:10px; text-align:center;">제시: "${window.esc(q.pres)}" ${optImgHtml}</div>`;
    
    document.getElementById('flashcard-view').innerHTML=`<div style="text-align:center; padding:30px; background:white; border-radius:20px; box-shadow:0 4px 10px rgba(0,0,0,0.05); max-width:700px; margin:auto;"><div style="display:flex; justify-content:space-between; margin-bottom:10px;"><span>#${window.currentQuizIndex+1}</span><button class="button small-button light-button" onclick="window.showView('subject-view'); clearTimeout(window.flashTimer);">중단</button></div><h2 style="color:#10b981;">[O/X 판별]</h2><div class="q-text-display" style="background:#f8fafc; padding:25px; border-radius:12px; margin-bottom:15px; text-align:left; font-size:1.2em; border:1px solid #cbd5e1;">Q. ${window.esc(q.text)}</div>${window.generateImageHtml(q)}${presHtml}<div style="width:100%; height:10px; background:#eee; border-radius:5px; margin-bottom:20px; overflow:hidden;"><div id="flash-bar" class="rhythm-bar-fill" style="width:100%;"></div></div><div id="ox-btns" style="display:flex; gap:20px; justify-content:center;"><button id="ox-btn-o" class="button" style="flex:1; background:white; color:#10b981; border:3px solid #10b981; font-size:1.8em; font-weight:900; padding:20px 0; border-radius:15px; cursor:pointer;" onclick="window.clickOX(true, ${q.isCorrectTarget}, 'ox-btn-o')">O (맞다)</button><button id="ox-btn-x" class="button" style="flex:1; background:white; color:#ef4444; border:3px solid #ef4444; font-size:1.8em; font-weight:900; padding:20px 0; border-radius:15px; cursor:pointer;" onclick="window.clickOX(false, ${q.isCorrectTarget}, 'ox-btn-x')">X (틀리다)</button></div><div id="ox-fb" class="hidden" style="margin-top:20px; padding:25px; background:#f1f5f9; border-radius:12px; text-align:left;"><h3 id="ox-res-title" style="margin-top:0; font-size:1.5em;"></h3><p style="font-size:1.2em;"><b>실제 정답:</b> ${window.esc(q.answer)}</p>${window.rhythmLevel===2?`<p style="background:white; padding:15px; border-radius:8px; border:1px dashed #cbd5e1;">💡 ${window.esc(q.explanation||'해설 없음')}</p>`:''}<button class="button primary-button" style="width:100%; height:60px; font-size:1.2em; margin-top:15px; border-radius:12px;" onclick="window.currentQuizIndex++; window.displayFlashcard()">다음 문제 ▶</button></div></div>`;
    setTimeout(() => { const bar=document.getElementById('flash-bar'); if(bar){ bar.style.transitionDuration=limit+'ms'; bar.style.width='0%'; } }, 50); window.flashTimer = setTimeout(() => window.processFlashcard(null, q.isCorrectTarget), limit);
};
window.clickOX = function(isO, target, btnId) { document.getElementById('ox-btn-o').style.background='white'; document.getElementById('ox-btn-o').style.color='#10b981'; document.getElementById('ox-btn-o').style.pointerEvents='none'; document.getElementById('ox-btn-x').style.background='white'; document.getElementById('ox-btn-x').style.color='#ef4444'; document.getElementById('ox-btn-x').style.pointerEvents='none'; const btn = document.getElementById(btnId); btn.style.background = isO ? '#10b981' : '#ef4444'; btn.style.color = 'white'; window.processFlashcard(isO, target); };
window.processFlashcard = (choice, actual) => { clearTimeout(window.flashTimer); document.getElementById('ox-btns').classList.add('hidden'); document.getElementById('ox-fb').classList.remove('hidden'); const res = document.getElementById('ox-res-title'); if(choice === null) res.innerHTML="<span style='color:#f59e0b;'>⏳ 시간 초과!</span>"; else res.innerHTML=(choice===actual)?"<span style='color:#10b981;'>⭕ 정확합니다!</span>":"<span style='color:#ef4444;'>❌ 틀렸습니다!</span>"; };

window.startConnectionQuiz = async function(id) { window.currentSubjectId=id; window.showLoading(); const snap=await window.fetchWithCache(db.collection('subjects').doc(id).collection('questions')); const qs=snap.docs.map(d=>d.data()); window.connectionGraph={}; qs.forEach(q=>{ if(q.knowledgeNetwork) q.knowledgeNetwork.split('\n').forEach(l=>{ const p=l.split(/-|➔|–/).map(s=>s.trim()).filter(s=>s); if(p.length>=3){ if(!window.connectionGraph[p[0]]) window.connectionGraph[p[0]]=[]; window.connectionGraph[p[0]].push({target:p[2],rel:p[1]}); } }); }); window.connectionNodes=Object.keys(window.connectionGraph).sort(()=>Math.random()-0.5); window.hideLoading(); if(window.connectionNodes.length===0) return alert("저장된 GCM 데이터가 없습니다."); window.currentQuizIndex=0; window.showView('flashcard-view'); window.displayConnectionQuiz(); };
window.displayConnectionQuiz = function() {
    if(window.currentQuizIndex>=window.connectionNodes.length) return window.showView('subject-view'); const node=window.connectionNodes[window.currentQuizIndex];
    document.getElementById('flashcard-view').innerHTML=`<div style="text-align:center; padding:30px; background:white; border-radius:20px; max-width:700px; margin:auto; box-shadow:0 4px 10px rgba(0,0,0,0.05);"><div style="display:flex; justify-content:space-between;"><span>#${window.currentQuizIndex+1}</span><button class="button small-button light-button" onclick="window.showView('subject-view')">중단</button></div><h2>🔗 지식 연결망 (GCM)</h2><div style="font-size:1.8em; font-weight:900; color:#f59e0b; margin:30px 0; background:#fef3c7; padding:20px; border-radius:12px;">${window.esc(node)}</div><div style="display:flex; gap:10px; margin-bottom:20px; align-items:center;"><input type="text" id="conn-rel" placeholder="관계 (예: ~의 원인은)" style="flex:1; padding:15px; border-radius:8px; border:2px solid #cbd5e1;"><span style="font-size:2em; color:#94a3b8;">➔</span><input type="text" id="conn-target" placeholder="도착 대상" style="flex:2; padding:15px; border-radius:8px; border:2px solid #cbd5e1;"></div><button class="button primary-button" style="width:100%; height:60px; font-size:1.2em;" onclick="window.checkConnectionAnswer('${window.esc(node)}')">연결망 검증</button><div id="conn-fb" class="hidden" style="margin-top:20px; text-align:left; padding:20px; background:#f8fafc; border-radius:12px;"><h3 id="conn-res"></h3><ul id="conn-list" style="line-height:1.8;"></ul><button class="button primary-button" style="width:100%; height:55px; margin-top:10px;" onclick="window.currentQuizIndex++; window.displayConnectionQuiz()">다음 ▶</button></div></div>`;
};
window.checkConnectionAnswer = (node) => { const r=document.getElementById('conn-rel').value.trim(); const t=document.getElementById('conn-target').value.trim(); const win=r&&t&&window.connectionGraph[node].some(e=>e.rel.includes(r)&&e.target.includes(t)); document.getElementById('conn-fb').classList.remove('hidden'); document.getElementById('conn-res').innerHTML=win?"<span style='color:green'>⭕ 연결 성공!</span>":"<span style='color:red'>❌ 끊어진 연결</span>"; document.getElementById('conn-list').innerHTML=window.connectionGraph[node].map(e=>`<li><b>${window.esc(node)}</b> ➔ [${window.esc(e.rel)}] ➔ <b>${window.esc(e.target)}</b></li>`).join(''); };

window.startRhythmMenu = async function(id) { window.currentSubjectId=id; window.showLoading(); const snap=await window.fetchWithCache(db.collection('subjects').doc(id).collection('questions')); window.quizQuestions=snap.docs.map(d=>({id:d.id,...d.data()})).sort(()=>Math.random()-0.5); window.hideLoading(); window.showView('rhythm-view'); document.getElementById('rhythm-view').innerHTML=`<div style="text-align:center; padding:50px; background:white; border-radius:20px; max-width:700px; margin:auto; box-shadow:0 4px 10px rgba(0,0,0,0.05);"><h1 style="color:#ec4899; font-size:2.5em; margin-bottom:10px;">🎵 리듬 엔진</h1><p style="color:#64748b; margin-bottom:30px;">현재 배속: <b>${window.currentRhythmSpeed}x</b></p><div style="display:flex; gap:15px; justify-content:center;"><button class="button primary-button" style="height:60px; font-size:1.2em; padding:0 30px;" onclick="window.startRhythmPlay('auto')">🎧 오토 모드</button><button class="button primary-button" style="height:60px; font-size:1.2em; padding:0 30px; background:#8b5cf6;" onclick="window.startRhythmPlay('touch')">🎮 터치 모드</button></div><button class="button light-button" style="margin-top:25px;" onclick="window.showView('subject-view')">나가기</button></div>`; };
window.startRhythmPlay = function(m) { window.currentQuizIndex=0; window.isRhythmPlaying=true; window.displayRhythmQuiz(m); };
window.displayRhythmQuiz = function(m) {
    if(window.currentQuizIndex>=window.quizQuestions.length||!window.isRhythmPlaying){ if(window.isRhythmPlaying) window.showToast("리듬 훈련 완료!"); return window.showView('subject-view'); } 
    const q=window.quizQuestions[window.currentQuizIndex]; const limit=(5000/window.currentRhythmSpeed); const opts = window.getOptions(q); 
    
    const optsHtml = opts.map(opt=>{
        let optImgHtml = '';
        if (q.options && q.optionImages) {
            const origIdx = q.options.indexOf(opt);
            if (origIdx > -1 && q.optionImages[origIdx]) {
                let safeOptText = window.esc(opt).replace(/'/g, "\\'").replace(/"/g, "&quot;");
                optImgHtml = `<br><img src="${window.esc(q.optionImages[origIdx])}" onclick="event.stopPropagation(); window.openImageModal(this.src, '${safeOptText}')" style="max-height:80px; border-radius:6px; cursor:zoom-in;">`;
            }
        }
        return `<button class="button" style="height:auto; min-height:80px; background:white; border:2px solid #ec4899; cursor:pointer; font-weight:bold; font-size:1.1em; border-radius:12px; padding:10px;" onclick="window.checkRhythmAns('${opt.replace(/'/g,"\\'")}','${String(q.answer).replace(/'/g,"\\'")}','touch')">${window.esc(opt)}${optImgHtml}</button>`;
    }).join('');
    
    document.getElementById('rhythm-view').innerHTML=`<div style="text-align:center;"><div style="display:flex; justify-content:space-between; margin-bottom:15px;"><span style="color:#ec4899; font-weight:bold;">Track #${window.currentQuizIndex+1} (${window.currentRhythmSpeed}x Speed)</span><button class="button small-button light-button" onclick="window.isRhythmPlaying=false; clearTimeout(window.rhythmTimer); window.showView('subject-view')">중단</button></div><div style="background:#fdf2f8; padding:30px; border-radius:20px; margin-bottom:20px; border:1px solid #fbcfe8;"><h3 class="q-text-display" style="margin:0;">${window.esc(q.text)}</h3>${window.generateImageHtml(q)}</div><div style="width:100%; height:12px; background:#eee; border-radius:6px; margin-bottom:20px; overflow:hidden;"><div id="rhythm-bar" class="rhythm-bar-fill" style="width:100%;"></div></div><div id="rhythm-opts" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">${m==='touch'?optsHtml:'<p style="grid-column:span 2; color:#94a3b8;">정답 대기중...</p>'}</div></div>`;
    setTimeout(()=>{ const bar=document.getElementById('rhythm-bar'); if(bar){ bar.style.transitionDuration=limit+'ms'; bar.style.width='0%'; } }, 50);
    if(m==='touch') window.rhythmTimer=setTimeout(()=>window.checkRhythmAns('',q.answer,'touch'), limit); 
    else window.rhythmTimer=setTimeout(()=>{ const d=document.getElementById('rhythm-opts'); if(d) { d.innerHTML=`<div style="grid-column:span 2; padding:30px; background:#ec4899; color:white; font-size:1.8em; font-weight:bold; border-radius:15px; box-shadow:0 4px 10px rgba(236,72,153,0.3);">${window.esc(q.answer)}${window.rhythmLevel===2&&q.explanation?`<div style="font-size:0.45em; margin-top:15px; line-height:1.5; text-align:left; background:rgba(0,0,0,0.1); padding:10px; border-radius:8px;">💡 ${window.esc(q.explanation)}</div>`:''}</div>`; window.rhythmFeedbackTimer=setTimeout(()=>{ window.currentQuizIndex++; if(window.isRhythmPlaying) window.displayRhythmQuiz('auto'); }, 2000/window.currentRhythmSpeed); } }, limit);
};
window.checkRhythmAns = (u, c, m) => { clearTimeout(window.rhythmTimer); const win=(u===c); const q=window.quizQuestions[window.currentQuizIndex]; document.getElementById('rhythm-view').innerHTML=`<div style="text-align:center; padding:50px; background:${win?'#f0fdf4':'#fff5f5'}; border-radius:20px; border:4px solid ${win?'#4ade80':'#f87171'}; max-width:700px; margin:auto;"><h1 style="font-size:3.5em; color:${win?'#166534':'#991b1b'}; margin:0 0 10px 0;">${win?'⭕ HIT!':'❌ MISS!'}</h1><p style="font-size:1.5em; font-weight:bold; margin-bottom:20px;">정답: ${window.esc(c)}</p>${window.rhythmLevel===2&&q.explanation?`<p style="margin-top:20px; background:white; padding:15px; border-radius:10px; border:1px dashed #cbd5e1; text-align:left;">💡 <b>해설:</b> ${window.esc(q.explanation)}</p>`:''}<button class="button primary-button" style="margin-top:30px; width:100%; height:60px; font-size:1.2em; border-radius:12px;" onclick="clearTimeout(window.rhythmFeedbackTimer); window.currentQuizIndex++; window.displayRhythmQuiz('${m}')">다음 비트 ▶</button></div>`; window.rhythmFeedbackTimer=setTimeout(()=>{ window.currentQuizIndex++; if(window.isRhythmPlaying) window.displayRhythmQuiz(m); }, 2500/window.currentRhythmSpeed); };

// =========================================================
// [v9.9.5] app-logic.js: Part 3 - Notes/Comps Audio & Advanced Editor
// =========================================================

// --- 8. 다단 비교표 관리자 ---
window.openComparisonManager = async function() { 
    window.showView('compare-view'); window.showLoading(); 
    const snap=await window.fetchWithCache(db.collection('subjects').doc(window.currentSubjectId).collection('comparisons')); 
    window.currentComparisons=snap.docs.map(d=>({id: d.id, ...d.data()})); 
    window.filteredComparisons = [...window.currentComparisons]; 
    if(window.filteredComparisons.length>0 && !window.selectedCompId) window.selectedCompId=window.filteredComparisons[0].id;
    window.hideLoading(); window.renderComparisonUI(); 
};

window.renderComparisonUI = function() { 
    const c=document.getElementById('compare-view'); 
    let h=`<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;"><h2 style="margin:0; color:#8b5cf6;">📊 다단 비교표 관리</h2><button class="button small-button light-button" onclick="window.manageSubject('${window.currentSubjectId}')">돌아가기</button></div>
    <div style="display:flex; gap:10px; margin-bottom:15px;"><button class="button small-button light-button" onclick="window.selectAllComps(true)">전체 선택</button><button class="button small-button light-button" onclick="window.selectAllComps(false)">해제</button><button class="button small-button" style="background:#dbeafe; color:#1e40af; border:1px solid #bfdbfe;" onclick="window.copySelectedComps()">선택 복사</button><button class="button small-button" style="background:#fee2e2; color:#b91c1c; border:none;" onclick="window.deleteSelectedComps()">선택 삭제</button><button class="button small-button primary-button" style="background:#8b5cf6; border:none;" onclick="window.toggleInlineCreateUI('comparisons')">+ 새 폴더 생성</button></div>
    <div id="inline-create-comparisons" class="hidden" style="margin-bottom:15px; padding:15px; background:#f1f5f9; border-radius:10px; border:2px dashed #cbd5e1; display:flex; gap:10px;"><input type="text" id="create-inp-comparisons" placeholder="새 폴더명 입력 (예: 1단원/기초)" style="flex:1; padding:10px; border-radius:6px; border:1px solid #cbd5e1;"><button class="button primary-button" onclick="window.execInlineCreate('comparisons')">생성</button><button class="button light-button" onclick="window.toggleInlineCreateUI('comparisons')">취소</button></div>
    <input type="text" id="comp-search" placeholder="비교표 검색..." style="width:100%; padding:15px; border-radius:10px; border:2px solid #cbd5e1; margin-bottom:20px;" onkeyup="window.filterComparisons()">`;
    let layout=`<div style="display:flex; background:#fff; padding:20px; border-radius:20px; border:1px solid #e2e8f0; min-height:600px;"><div style="width:300px; border-right:1px solid #e2e8f0; padding-right:15px; display:flex; flex-direction:column;"><button class="button small-button primary-button" style="width:100%; margin-bottom:15px; background:#8b5cf6;" onclick="window.showComparisonEditor()">+ 새 비교표 작성</button><div id="comp-list-wrapper" style="flex:1; overflow-y:auto; padding-right:10px;"></div></div><div id="comp-main-wrapper" style="flex:1; padding-left:20px; overflow-y:auto;"></div></div>`;
    c.innerHTML = h + layout; window.renderComparisonList(); window.renderComparisonMain();
};

window.renderComparisonList = () => { 
    const wrap = document.getElementById('comp-list-wrapper'); if(!wrap) return; 
    if(window.filteredComparisons.length === 0) return wrap.innerHTML = '<div style="padding:20px; text-align:center; color:#94a3b8;">데이터 없음</div>';
    
    const grouped = window.filteredComparisons.reduce((acc, c) => { const cat = c.category || '미분류'; if(!acc[cat]) acc[cat] = []; acc[cat].push(c); return acc; }, {});
    const orderDoc = db.collection('settings').doc(`order_comparisons_${window.currentSubjectId}`);
    let allCats = Array.from(new Set([...(window.lastRenderedCategories['comparisons']||[]), ...Object.keys(grouped)])).sort();
    allCats.forEach(c => { if(!grouped[c]) grouped[c] = []; }); window.lastRenderedCategories['comparisons'] = allCats;

    let html = '';
    allCats.forEach(cat => {
        const catId = cat.replace(/[^a-zA-Z0-9]/g, '-');
        const depth = (cat.match(/\//g) || []).length; const indent = depth * 20; const folderName = cat.split('/').pop();
        const catOpts = allCats.filter(c => c !== cat).map(c=>`<option value="${c}">${c}</option>`).join('');
        
        html += `<div class="category-group" data-cat="${cat}" style="margin-left:${indent}px; margin-bottom:10px; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
            <div draggable="true" ondragstart="window.onDragStart(event, 'category', '${cat}', 'comparisons', '${cat}')" ondragover="window.onDragOverCat(event)" ondragleave="window.onDragLeaveCat(event)" ondrop="window.onDropOnCategory(event, '${cat}', 'comparisons')"
                 style="background:#f8fafc; padding:10px; cursor:pointer; display:flex; justify-content:space-between;" onclick="window.toggleFolder('${cat}', 'c-icon-${catId}')">
                <b style="color:#5b21b6; font-size:0.9em; display:flex; align-items:center; gap:5px;"><span id="c-icon-${catId}">${window.collapsedFolders.includes(cat)?'📁':'📂'}</span> ${window.esc(folderName)} <span style="font-size:0.8em; font-weight:normal;">(${grouped[cat].length})</span></b>
                <div style="display:flex; gap:5px;" onclick="event.stopPropagation()">
                    <button class="button small-button light-button" onclick="window.toggleCatMoveUI('${catId}')">이동</button>
                    <button class="button small-button light-button" onclick="window.renameCategoryPrompt('${cat}', 'comparisons')">✏️</button>
                    <button class="button small-button light-button" style="color:red;" onclick="window.deleteCategoryPrompt('${cat}', 'comparisons')">🗑️</button>
                </div>
            </div>
            
            <div id="cat-move-ui-${catId}" class="hidden" style="padding:10px; background:#fffbeb; border-bottom:1px solid #fcd34d; display:flex; gap:5px; align-items:center; flex-direction:column;" onclick="event.stopPropagation()">
                <select id="cat-move-sel-${catId}" style="width:100%; padding:5px; border-radius:4px;"><option value="최상위">-- 최상위로 분리 --</option>${catOpts}</select>
                <button class="button primary-button" style="background:#b45309; border:none; width:100%; padding:5px;" onclick="window.execCatMove('${cat}', '${catId}', 'comparisons')">적용</button>
            </div>

            <div class="cat-content-wrapper" data-parent-cat="${cat}" style="padding:5px;">
            ${grouped[cat].length === 0 ? '<div style="padding:10px; text-align:center; color:#94a3b8; font-size:0.8em;">항목을 끌어다 놓으세요.</div>' : ''}
            ${grouped[cat].map(c=>`
                <div class="draggable-item" draggable="true" ondragstart="window.onDragStart(event, 'item', '${c.id}', 'comparisons', '${cat}')" ondragover="window.onDragOverItem(event)" ondragleave="window.onDragLeaveItem(event)" ondrop="window.onDropOnItem(event, '${c.id}', 'comparisons')"
                     style="padding:10px; background:${c.id===window.selectedCompId?'#ede9fe':'white'}; border:1px solid #f1f5f9; border-radius:6px; margin-bottom:5px;">
                    <div style="display:flex; align-items:center; gap:5px;">
                        <input type="checkbox" class="comp-ck" value="${c.id}" onclick="event.stopPropagation()">
                        <div onclick="window.selectedCompId='${c.id}'; window.renderComparisonList(); window.renderComparisonMain();" style="cursor:pointer; flex:1; font-size:0.85em; font-weight:bold;">${window.esc(c.title)}</div>
                        <button class="button small-button light-button" onclick="window.toggleInlineMoveUI('${c.id}')">📂</button>
                    </div>
                    <div id="move-ui-${c.id}" class="hidden" style="margin-top:8px; padding:8px; background:#f8fafc; border-radius:4px; display:flex; flex-direction:column; gap:5px;" onclick="event.stopPropagation()">
                        <select id="move-sel-${c.id}" style="width:100%; padding:4px;">${catOpts}</select>
                        <div style="display:flex; gap:5px;"><input type="text" id="move-inp-${c.id}" placeholder="새 폴더명" style="flex:1; padding:4px;"><button class="button small-button primary-button" onclick="window.execInlineMove('${c.id}', 'comparisons')">이동</button></div>
                    </div>
                </div>`).join('')}
            </div></div>`;
    }); 
    wrap.innerHTML = html; window.updateFolderVisibility();
};

// 🚨 비교표 오디오 재생 기능
window.playCompAudio = function(id) {
    if(!('speechSynthesis' in window)) return alert("음성 합성을 지원하지 않는 브라우저입니다.");
    if (window.currentPlayingCompId === id && window.isAudioPlaying) {
        window.speechSynthesis.cancel();
        window.isAudioPlaying = false;
        window.currentPlayingCompId = null;
        const btn = document.getElementById('comp-audio-btn');
        if(btn) { btn.innerHTML = "🎧 듣기"; btn.style.background = "white"; btn.style.color = "#b45309"; }
        return;
    }
    window.speechSynthesis.cancel();
    window.isAudioPlaying = true;
    window.currentPlayingCompId = id;
    
    document.querySelectorAll('.audio-btn').forEach(b => { b.innerHTML = "🎧 듣기"; b.style.background = "white"; b.style.color = "#b45309"; });

    const act = window.currentComparisons.find(x => x.id === id);
    if(!act) return;

    let text = `비교표. ${act.title}. `;
    const cols = [act.col1Name, act.col2Name, act.col3Name, act.col4Name];
    act.rows.forEach((r, i) => {
        text += `${i+1}번 항목. `;
        if(cols[0] && r.col1) text += `${cols[0]}은, ${r.col1}. `;
        if(cols[1] && r.col2) text += `${cols[1]}은, ${r.col2}. `;
        if(cols[2] && r.col3) text += `${cols[2]}은, ${r.col3}. `;
        if(cols[3] && r.col4) text += `${cols[3]}은, ${r.col4}. `;
    });

    const msg = new SpeechSynthesisUtterance(text);
    msg.rate = window.currentRhythmSpeed || 1.0;
    msg.lang = 'ko-KR';
    msg.onend = function() {
        window.isAudioPlaying = false;
        window.currentPlayingCompId = null;
        const btn = document.getElementById('comp-audio-btn');
        if(btn) { btn.innerHTML = "🎧 듣기"; btn.style.background = "white"; btn.style.color = "#b45309"; }
    };
    msg.onerror = function() { window.isAudioPlaying = false; window.currentPlayingCompId = null; };
    
    const btn = document.getElementById('comp-audio-btn');
    if(btn) { btn.innerHTML = "⏹ 중지"; btn.style.background = "#fef3c7"; btn.style.color = "#d97706"; }
    window.speechSynthesis.speak(msg);
};

window.renderComparisonMain = () => { 
    const wrap = document.getElementById('comp-main-wrapper'); if(!wrap) return; 
    const act=window.currentComparisons.find(x=>x.id===window.selectedCompId); 
    if(act){ 
        let btnState = (window.currentPlayingCompId === act.id && window.isAudioPlaying) ? `style="border:1px solid #fcd34d; color:#d97706; background:#fef3c7; font-weight:bold;"` : `style="border:1px solid #fcd34d; color:#b45309; background:white; font-weight:bold;"`;
        let btnText = (window.currentPlayingCompId === act.id && window.isAudioPlaying) ? `⏹ 중지` : `🎧 듣기`;
        
        wrap.innerHTML=`<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h3 style="margin:0; border-left:4px solid #8b5cf6; padding-left:15px;">${window.esc(act.title)}</h3>
            <div style="display:flex; gap:8px;">
                <button id="comp-audio-btn" class="button small-button audio-btn" ${btnState} onclick="window.playCompAudio('${act.id}')">${btnText}</button>
                <button class="button small-button light-button" onclick="window.showComparisonEditor('${act.id}')">✏️ 내용 수정하기</button>
            </div>
        </div>
        <table style="width:100%; border-collapse:collapse; border:1px solid #cbd5e1; background:white; border-radius:8px; overflow:hidden;"><thead><tr style="background:#f1f5f9; border-bottom:2px solid #94a3b8;">${[1,2,3,4].map(i=>act[`col${i}Name`]?`<th style="padding:15px; text-align:left; border-right:1px solid #cbd5e1;">${window.esc(act[`col${i}Name`])}</th>`:'').join('')}</tr></thead><tbody>${act.rows.map(r=>`<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:15px; border-right:1px solid #e2e8f0; line-height:1.5; vertical-align:top;">${window.esc(r.col1)}</td><td style="padding:15px; border-right:1px solid #e2e8f0; line-height:1.5; vertical-align:top;">${window.esc(r.col2)}</td><td style="padding:15px; border-right:1px solid #e2e8f0; line-height:1.5; vertical-align:top;">${window.esc(r.col3)}</td><td style="padding:15px; line-height:1.5; vertical-align:top;">${window.esc(r.col4)}</td></tr>`).join('')}</tbody></table>`; 
    } else { 
        wrap.innerHTML=`<div style="height:100%; display:flex; align-items:center; justify-content:center; color:#94a3b8; background:#f8fafc; border-radius:15px; border:2px dashed #e2e8f0;">비교표를 선택하세요.</div>`; 
    } 
};

window.filterComparisons = () => { const kw=document.getElementById('comp-search').value.toLowerCase(); window.filteredComparisons=window.currentComparisons.filter(c=>{ const cols = [c.col1Name, c.col2Name, c.col3Name, c.col4Name].filter(Boolean).join(' '); const rows = (c.rows||[]).map(r=>`${r.col1} ${r.col2} ${r.col3} ${r.col4}`).join(' '); return `${c.title||''} ${cols} ${rows}`.toLowerCase().includes(kw); }); window.renderComparisonList(); };
window.selectAllComps = (b) => document.querySelectorAll('.comp-ck').forEach(c=>c.checked=b);
window.deleteSelectedComps = async function() { const ids=Array.from(document.querySelectorAll('.comp-ck:checked')).map(c=>c.value); if(ids.length===0||!confirm(`선택한 ${ids.length}개의 비교표를 삭제할까요?`)) return; window.showLoading(); for(let id of ids) await db.collection('subjects').doc(window.currentSubjectId).collection('comparisons').doc(id).delete(); window.selectedCompId=null; window.openComparisonManager(); };
window.copySelectedComps = async function() { const ids=Array.from(document.querySelectorAll('.comp-ck:checked')).map(c=>c.value); if(ids.length===0||!confirm("선택 항목을 복사할까요?")) return; window.showLoading(); for(let id of ids) { const doc = await db.collection('subjects').doc(window.currentSubjectId).collection('comparisons').doc(id).get(); if(doc.exists) { let d=doc.data(); d.title="[복사본] "+d.title; d.createdAt=firebase.firestore.FieldValue.serverTimestamp(); d.updatedAt=firebase.firestore.FieldValue.serverTimestamp(); await db.collection('subjects').doc(window.currentSubjectId).collection('comparisons').add(d); } } window.openComparisonManager(); };

window.showComparisonEditor = function(id=null) { window.showView('add-edit-view'); const c=id?window.currentComparisons.find(x=>x.id===id):{title:'',category:'미분류',col1Name:'',col2Name:'',col3Name:'',col4Name:'',rows:[]}; let rStr=c.rows.map(r=>`${r.col1}|${r.col2}|${r.col3}|${r.col4}`).join('\n'); document.getElementById('add-edit-view').innerHTML=`<div style="background:white; padding:30px; border-radius:20px; border:1px solid #e2e8f0; max-width:800px; margin:auto; box-shadow:0 4px 10px rgba(0,0,0,0.05);"><div style="display:flex; justify-content:space-between; margin-bottom:20px;"><h2>📊 비교표 편집</h2><button class="button small-button light-button" onclick="window.openComparisonManager()">취소</button></div><div class="form-group"><label>📂 폴더(카테고리)</label><input type="text" id="c-cat" value="${window.esc(c.category)}" style="width:100%; padding:15px; border-radius:8px; border:1px solid #cbd5e1;" placeholder="예: 1단원/기초"></div><div class="form-group"><label>제목</label><input type="text" id="c-title" value="${window.esc(c.title)}" style="width:100%; padding:15px; border-radius:8px; border:1px solid #cbd5e1;"></div><div style="display:flex; gap:10px; margin-bottom:20px;"><input type="text" id="c-col1" value="${window.esc(c.col1Name)}" placeholder="열1" style="flex:1; padding:10px; border-radius:8px; border:1px solid #cbd5e1;"><input type="text" id="c-col2" value="${window.esc(c.col2Name)}" placeholder="열2" style="flex:1; padding:10px; border-radius:8px; border:1px solid #cbd5e1;"><input type="text" id="c-col3" value="${window.esc(c.col3Name)}" placeholder="열3" style="flex:1; padding:10px; border-radius:8px; border:1px solid #cbd5e1;"><input type="text" id="c-col4" value="${window.esc(c.col4Name)}" placeholder="열4" style="flex:1; padding:10px; border-radius:8px; border:1px solid #cbd5e1;"></div><div class="form-group"><label>표 데이터 (줄바꿈 행, | 열 구분)</label><textarea id="c-rows" style="width:100%; height:250px; padding:15px; border-radius:8px; border:1px solid #cbd5e1;">${rStr}</textarea></div><button class="button primary-button" style="width:100%; height:60px; font-size:1.2em; margin-top:10px;" onclick="window.saveComparison('${id||''}')">💾 저장</button></div>`; };
window.saveComparison = async function(id) { const cat=document.getElementById('c-cat').value.trim()||'미분류'; const title=document.getElementById('c-title').value.trim(); const cols=[document.getElementById('c-col1').value.trim(), document.getElementById('c-col2').value.trim(), document.getElementById('c-col3').value.trim(), document.getElementById('c-col4').value.trim()]; if(!title)return; const rows=document.getElementById('c-rows').value.split('\n').filter(l=>l.trim()).map(l=>{const p=l.split('|').map(s=>s.trim()); return {col1:p[0]||'', col2:p[1]||'', col3:p[2]||'', col4:p[3]||''};}); const data={category:cat, title, col1Name:cols[0], col2Name:cols[1], col3Name:cols[2], col4Name:cols[3], rows, updatedAt: firebase.firestore.FieldValue.serverTimestamp()}; window.showLoading(); if(id) await db.collection('subjects').doc(window.currentSubjectId).collection('comparisons').doc(id).update(data); else { data.createdAt=firebase.firestore.FieldValue.serverTimestamp(); await db.collection('subjects').doc(window.currentSubjectId).collection('comparisons').add(data); } window.openComparisonManager(); };

// --- 9. 수업 노트 관리자 ---
window.openNoteManager = async function() { window.showView('note-view'); window.showLoading(); const snap=await window.fetchWithCache(db.collection('subjects').doc(window.currentSubjectId).collection('notes').orderBy('createdAt','desc')); window.currentNotes=snap.docs.map(d=>({id:d.id,...d.data()})); window.filteredNotes=[...window.currentNotes]; window.hideLoading(); window.renderNoteUI(); };
window.renderNoteUI = function() { 
    document.getElementById('note-view').innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;"><h2 style="margin:0; color:#10b981;">📚 수업 노트 관리</h2><div><button class="button small-button primary-button" style="background:#059669; border:none; margin-right:10px;" onclick="window.showNoteEditor()">+ 새 노트 작성</button><button class="button small-button light-button" onclick="window.manageSubject('${window.currentSubjectId}')">돌아가기</button></div></div>
    <div style="display:flex; gap:10px; margin-bottom:15px;"><button class="button small-button light-button" onclick="window.selectAllNotes(true)">전체 선택</button><button class="button small-button light-button" onclick="window.selectAllNotes(false)">해제</button><button class="button small-button" style="background:#dbeafe; color:#1e40af; border:1px solid #bfdbfe;" onclick="window.copySelectedNotes()">선택 복사</button><button class="button small-button" style="background:#fee2e2; color:#b91c1c; border:none;" onclick="window.deleteSelectedNotes()">선택 삭제</button><button class="button small-button primary-button" style="background:#10b981; border:none;" onclick="window.toggleInlineCreateUI('notes')">+ 새 폴더 생성</button></div>
    <div id="inline-create-notes" class="hidden" style="margin-bottom:15px; padding:15px; background:#f1f5f9; border-radius:10px; border:2px dashed #cbd5e1; display:flex; gap:10px;"><input type="text" id="create-inp-notes" placeholder="새 폴더명 입력 (예: 1단원/기초)" style="flex:1; padding:10px; border-radius:6px; border:1px solid #cbd5e1;"><button class="button primary-button" onclick="window.execInlineCreate('notes')">생성</button><button class="button light-button" onclick="window.toggleInlineCreateUI('notes')">취소</button></div>
    <input type="text" id="note-search" placeholder="노트 검색..." style="width:100%; padding:15px; border-radius:10px; border:2px solid #cbd5e1; margin-bottom:20px;" onkeyup="window.filterNotes()">
    <div id="note-list-wrapper"></div>`; 
    window.renderNoteList(); 
};
window.filterNotes = () => { const kw=document.getElementById('note-search').value.toLowerCase(); window.filteredNotes=window.currentNotes.filter(n=>(n.title||'').toLowerCase().includes(kw) || (n.content||'').toLowerCase().includes(kw)); window.renderNoteList(); };

// 🚨 수업 노트 오디오 재생 기능
window.playNoteAudio = function(id) {
    if(!('speechSynthesis' in window)) return alert("음성 합성을 지원하지 않는 브라우저입니다.");
    if (window.currentPlayingNoteId === id && window.isAudioPlaying) {
        window.speechSynthesis.cancel();
        window.isAudioPlaying = false;
        window.currentPlayingNoteId = null;
        const btn = document.getElementById(`note-audio-btn-${id}`);
        if(btn) { btn.innerHTML = "🎧 듣기"; btn.style.background = "white"; btn.style.color = "#b45309"; }
        return;
    }
    window.speechSynthesis.cancel();
    window.isAudioPlaying = true;
    window.currentPlayingNoteId = id;
    
    document.querySelectorAll('.note-audio-btn').forEach(b => { b.innerHTML = "🎧 듣기"; b.style.background = "white"; b.style.color = "#b45309"; });

    const act = window.currentNotes.find(x => x.id === id);
    if(!act) return;

    let text = `노트 제목. ${act.title}. 내용. ${act.content}`;
    const msg = new SpeechSynthesisUtterance(text);
    msg.rate = window.currentRhythmSpeed || 1.0;
    msg.lang = 'ko-KR';
    msg.onend = function() {
        window.isAudioPlaying = false;
        window.currentPlayingNoteId = null;
        const btn = document.getElementById(`note-audio-btn-${id}`);
        if(btn) { btn.innerHTML = "🎧 듣기"; btn.style.background = "white"; btn.style.color = "#b45309"; }
    };
    msg.onerror = function() { window.isAudioPlaying = false; window.currentPlayingNoteId = null; };
    
    const btn = document.getElementById(`note-audio-btn-${id}`);
    if(btn) { btn.innerHTML = "⏹ 중지"; btn.style.background = "#fef3c7"; btn.style.color = "#d97706"; }
    window.speechSynthesis.speak(msg);
};

window.renderNoteList = () => { 
    const wrap = document.getElementById('note-list-wrapper'); if(!wrap) return; 
    if(window.filteredNotes.length===0) return wrap.innerHTML=`<div style="padding:50px; text-align:center; color:#94a3b8; background:white; border-radius:15px; border:1px solid #e2e8f0;">데이터가 없습니다.</div>`; 
    
    const grouped = window.filteredNotes.reduce((acc, n) => { const cat = n.category || "미분류"; if(!acc[cat]) acc[cat] = []; acc[cat].push(n); return acc; }, {});
    const orderDoc = db.collection('settings').doc(`order_notes_${window.currentSubjectId}`);
    let allCats = Array.from(new Set([...(window.lastRenderedCategories['notes']||[]), ...Object.keys(grouped)])).sort();
    allCats.forEach(c => { if(!grouped[c]) grouped[c] = []; }); window.lastRenderedCategories['notes'] = allCats;

    let html = '';
    allCats.forEach(cat => {
        const catId = cat.replace(/[^a-zA-Z0-9]/g, '-');
        const catOpts = allCats.filter(c => c !== cat).map(c=>`<option value="${c}">${c}</option>`).join('');
        const depth = (cat.match(/\//g) || []).length; const indent = depth * 25; const folderName = cat.split('/').pop();

        html += `<div class="category-group" data-cat="${cat}" style="margin-left:${indent}px; margin-bottom:20px; border:1px solid #cbd5e1; border-radius:12px; background:white; overflow:hidden;">
            <div draggable="true" ondragstart="window.onDragStart(event, 'category', '${cat}', 'notes', '${cat}')" ondragover="window.onDragOverCat(event)" ondragleave="window.onDragLeaveCat(event)" ondrop="window.onDropOnCategory(event, '${cat}', 'notes')"
                 style="background:#f1f5f9; padding:15px; display:flex; justify-content:space-between; cursor:pointer;" onclick="window.toggleFolder('${cat}', 'n-icon-${catId}')">
                <b style="color:#064e3b; display:flex; align-items:center; gap:8px;"><span id="n-icon-${catId}">${window.collapsedFolders.includes(cat)?'📁':'📂'}</span> ${window.esc(folderName)} <span style="font-size:0.8em; font-weight:normal;">(${grouped[cat].length})</span></b>
                <div style="display:flex; gap:5px;" onclick="event.stopPropagation()">
                    <button class="button small-button light-button" onclick="window.toggleCatMoveUI('${catId}')">이동</button>
                    <button class="button small-button light-button" onclick="window.renameCategoryPrompt('${cat}', 'notes')">✏️</button>
                    <button class="button small-button light-button" style="color:red;" onclick="window.deleteCategoryPrompt('${cat}', 'notes')">🗑️</button>
                </div>
            </div>
            
            <div id="cat-move-ui-${catId}" class="hidden" style="padding:10px 15px; background:#fffbeb; border-bottom:1px solid #fcd34d; display:flex; gap:10px; align-items:center;" onclick="event.stopPropagation()">
                <span style="font-weight:bold; color:#b45309; font-size:0.9em;">상위 폴더 지정:</span>
                <select id="cat-move-sel-${catId}" style="flex:1; padding:8px; border-radius:6px;"><option value="최상위">-- 최상위로 분리 --</option>${catOpts}</select>
                <button class="button primary-button" style="background:#b45309; border:none; padding:8px 15px;" onclick="window.execCatMove('${cat}', '${catId}', 'notes')">적용</button>
            </div>

            <div class="cat-content-wrapper" data-parent-cat="${cat}" style="padding:10px;">
            ${grouped[cat].length === 0 ? '<div style="padding:15px; text-align:center; color:#94a3b8;">항목을 끌어다 놓으세요.</div>' : ''}
            ${grouped[cat].map(n=> {
                let btnState = (window.currentPlayingNoteId === n.id && window.isAudioPlaying) ? `style="border:1px solid #fcd34d; color:#d97706; background:#fef3c7; font-weight:bold;"` : `style="border:1px solid #fcd34d; color:#b45309; background:white; font-weight:bold;"`;
                let btnText = (window.currentPlayingNoteId === n.id && window.isAudioPlaying) ? `⏹ 중지` : `🎧 듣기`;
                return `
                <div class="draggable-item" draggable="true" ondragstart="window.onDragStart(event, 'item', '${n.id}', 'notes', '${cat}')" ondragover="window.onDragOverItem(event)" ondragleave="window.onDragLeaveItem(event)" ondrop="window.onDropOnItem(event, '${n.id}', 'notes')" 
                     style="border:1px solid #e2e8f0; border-radius:10px; margin-bottom:10px; overflow:hidden; background:white;">
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; background:#f8fafc; cursor:pointer;" onclick="window.toggleAccordion('note-content-${n.id}', '')">
                        <div style="display:flex; align-items:center; gap:10px; flex:1;" onclick="event.stopPropagation()">
                            <input type="checkbox" class="note-ck" value="${n.id}">
                            <h4 style="margin:0; font-size:1.1em; color:#334155;">${window.esc(n.title)}</h4>
                        </div>
                        <div style="display:flex; gap:5px;" onclick="event.stopPropagation()">
                            <button id="note-audio-btn-${n.id}" class="button small-button audio-btn note-audio-btn" ${btnState} onclick="window.playNoteAudio('${n.id}')">${btnText}</button>
                            <button class="button small-button light-button" onclick="window.toggleInlineMoveUI('${n.id}')">📂 이동</button>
                            <button class="button small-button light-button" onclick="window.showNoteEditor('${n.id}', \`${window.esc(n.category)}\`, \`${window.esc(n.title)}\`, \`${window.esc(n.content).replace(/\$/g,'\\$')}\`)">✏️ 수정</button> 
                        </div>
                    </div>
                    <div id="move-ui-${n.id}" class="hidden" style="padding:10px; background:#f1f5f9; border-top:1px solid #e2e8f0; display:flex; gap:8px;" onclick="event.stopPropagation()">
                        <select id="move-sel-${n.id}" style="flex:1; padding:5px; border-radius:4px;"><option value="">-- 부모 폴더 선택 --</option>${catOpts}</select>
                        <input type="text" id="move-inp-${n.id}" placeholder="새 폴더명" style="width:120px; padding:5px;">
                        <button class="button small-button primary-button" onclick="window.execInlineMove('${n.id}', 'notes')">확인</button>
                    </div>
                    <div id="note-content-${n.id}" class="hidden" style="padding:20px; border-top:1px dashed #cbd5e1;"><p style="white-space:pre-wrap; margin:0; line-height:1.6; color:#475569;">${window.esc(n.content)}</p></div>
                </div>`;
            }).join('')}
            </div></div>`;
    }); 
    wrap.innerHTML = html; window.updateFolderVisibility();
};

window.selectAllNotes = (b) => document.querySelectorAll('.note-ck').forEach(c=>c.checked=b);
window.deleteSelectedNotes = async function() { const ids=Array.from(document.querySelectorAll('.note-ck:checked')).map(c=>c.value); if(ids.length===0||!confirm("삭제할까요?")) return; window.showLoading(); for(let id of ids) await db.collection('subjects').doc(window.currentSubjectId).collection('notes').doc(id).delete(); window.openNoteManager(); };
window.copySelectedNotes = async function() { const ids=Array.from(document.querySelectorAll('.note-ck:checked')).map(c=>c.value); if(ids.length===0||!confirm("복사할까요?")) return; window.showLoading(); for(let id of ids) { const doc=await db.collection('subjects').doc(window.currentSubjectId).collection('notes').doc(id).get(); if(doc.exists){ let d=doc.data(); d.title="[복사본] "+d.title; d.createdAt=firebase.firestore.FieldValue.serverTimestamp(); d.updatedAt=firebase.firestore.FieldValue.serverTimestamp(); await db.collection('subjects').doc(window.currentSubjectId).collection('notes').add(d); } } window.openNoteManager(); };

window.showNoteEditor = function(id=null, cat='', t='', c='') { document.getElementById('note-view').innerHTML=`<div style="background:white; padding:30px; border-radius:20px; border:1px solid #e2e8f0; max-width:800px; margin:auto; box-shadow:0 4px 10px rgba(0,0,0,0.05);"><div style="display:flex; justify-content:space-between; margin-bottom:20px;"><h2>📝 노트 작성</h2><button class="button small-button light-button" onclick="window.openNoteManager()">취소</button></div><div class="form-group"><label style="font-weight:bold;">📂 폴더(카테고리)</label><input type="text" id="n-cat" value="${cat}" placeholder="예: 산부인과/기초" style="width:100%; padding:15px; border-radius:10px; border:1px solid #cbd5e1; box-sizing:border-box;"></div><div class="form-group"><label style="font-weight:bold;">제목</label><input type="text" id="n-t" value="${t}" style="width:100%; padding:15px; border-radius:10px; border:1px solid #cbd5e1; box-sizing:border-box;"></div><div class="form-group"><label style="font-weight:bold;">본문 내용</label><textarea id="n-c" style="width:100%; height:400px; padding:15px; border-radius:10px; border:1px solid #cbd5e1; box-sizing:border-box; line-height:1.6;">${c}</textarea></div><button class="button primary-button" style="width:100%; height:60px; font-size:1.2em; background:#10b981; border:none; margin-top:10px;" onclick="window.saveNote('${id||''}')">💾 저장</button></div>`; };
window.saveNote = async function(id) { const cat=document.getElementById('n-cat').value.trim()||'미분류'; const t=document.getElementById('n-t').value.trim(); const c=document.getElementById('n-c').value; if(!t)return alert("제목을 입력하세요."); window.showLoading(); if(id) await db.collection('subjects').doc(window.currentSubjectId).collection('notes').doc(id).update({category:cat, title:t,content:c, updatedAt: firebase.firestore.FieldValue.serverTimestamp()}); else await db.collection('subjects').doc(window.currentSubjectId).collection('notes').add({category:cat, title:t,content:c, createdAt: firebase.firestore.FieldValue.serverTimestamp()}); window.openNoteManager(); };

// --- 10. 정밀 편집기 및 저장 ---
window.qImageCount = 0; 

window.addQImageSlot = function(url = '', desc = '') {
    const id = window.qImageCount++;
    const container = document.getElementById('q-images-container');
    const div = document.createElement('div');
    div.className = 'q-img-slot';
    div.innerHTML = `
        <div style="background:white; padding:15px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:10px; position:relative;">
            <div style="display:flex; gap:10px; align-items:center;">
                <span style="font-weight:bold; color:#64748b;">🖼️</span>
                <input type="text" class="q-img-url" value="${window.esc(url)}" placeholder="이미지 URL 입력" style="flex:1; padding:8px; border-radius:6px; border:1px solid #cbd5e1; font-size:0.9em;">
                <label class="button light-button" style="padding:8px 12px; cursor:pointer;">파일선택<input type="file" accept="image/*" style="display:none;" onchange="window.handleImageUpload(this, this.parentElement.previousElementSibling)"></label>
                <button class="button small-button" style="background:#fee2e2; color:#ef4444; border:none; padding:8px 12px;" onclick="this.closest('.q-img-slot').remove()">❌ 삭제</button>
            </div>
            <input type="text" class="q-img-desc" value="${window.esc(desc)}" placeholder="이미지 설명 / 캡션 (선택)" style="width:100%; margin-top:8px; padding:8px; border-radius:6px; border:1px solid #cbd5e1; font-size:0.9em; box-sizing:border-box;">
        </div>
    `;
    container.appendChild(div);
};

window.showFullEditView = function(qId = null) {
    window.showView('add-edit-view'); const q = qId ? window.allQuestionsForSubject.find(i=>i.id===qId) : {}; 
    const esc = window.esc;
    
    let optImgs = q.optionImages || ['', '', '', '', ''];
    let optsHtml=''; 
    for(let i=0; i<5; i++) {
        optsHtml += `
        <div style="margin-bottom:12px; padding:12px; background:white; border:1px solid #cbd5e1; border-radius:10px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                <span style="font-weight:bold; width:20px; color:#475569;">${i+1}.</span>
                <input type="text" id="q-opt-${i}" value="${esc(q.options&&q.options[i])}" placeholder="선택지 텍스트 내용" style="flex:1; padding:10px; border-radius:8px; border:1px solid #cbd5e1;">
            </div>
            <div style="display:flex; align-items:center; gap:8px; margin-left:28px;">
                <span style="font-size:0.9em; color:#64748b;">🖼️</span>
                <input type="text" id="q-opt-img-${i}" value="${esc(optImgs[i])}" placeholder="선택지 이미지 전용 URL" style="flex:1; padding:8px; border-radius:6px; border:1px dashed #94a3b8; font-size:0.9em;">
                <label class="button light-button" style="padding:6px 12px; font-size:0.85em; cursor:pointer;">파일찾기<input type="file" accept="image/*" style="display:none;" onchange="window.handleImageUpload(this, this.parentElement.previousElementSibling)"></label>
            </div>
        </div>`;
    }

    let paths = q.pathLevels ? [...q.pathLevels] : []; while(paths.length < 5) paths.push(''); 
    let pathHtml = paths.map((p, i) => `<div class="path-item" style="display:flex; gap:5px; margin-bottom:8px; align-items:center;"><span class="path-num" style="width:20px; text-align:center; font-weight:bold; color:#64748b;">${i+1}</span><input type="text" class="path-input" value="${esc(p)}" placeholder="대단원, 중단원 등..." style="flex:1; padding:10px; border:1px solid #cbd5e1; border-radius:8px;"><button class="button small-button light-button" onclick="this.parentElement.remove(); window.updatePathNumbers();" style="border:none; color:#ef4444;">❌</button></div>`).join('');

    document.getElementById('add-edit-view').innerHTML = `
    <div style="background:white; padding:30px; border:1px solid #e2e8f0; max-width:800px; margin:auto; border-radius:20px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
        <div style="display:flex; justify-content:space-between; margin-bottom:20px;"><h2 style="margin:0;">📝 문제 정밀 편집</h2><button class="button small-button light-button" onclick="window.manageSubject('${window.currentSubjectId}')">취소</button></div>
        
        <div class="form-group"><label style="font-weight:bold; color:#1e40af;">📂 폴더(카테고리)</label><input type="text" id="q-category" value="${esc(q.category||'미분류')}" placeholder="슬래시(/)로 하위폴더 지정" style="width:100%; padding:12px; border-radius:8px; border:1px solid #bfdbfe; box-sizing:border-box;"></div>
        <div class="form-group"><label style="font-weight:bold;">1. 문제 유형</label><input type="text" id="q-type" value="${esc(q.negativeType||'객관식')}" style="width:100%; padding:12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box;"></div>
        <div class="form-group"><label style="font-weight:bold;">2. 질문 내용</label><textarea id="q-text" style="width:100%; height:80px; padding:12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box;">${q.text||''}</textarea></div>
        
        <div class="form-group" style="background:#f8fafc; padding:20px; border-radius:12px; border:1px dashed #cbd5e1; margin-bottom:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <label style="font-weight:bold; color:#0f172a; margin:0;">🖼️ 문제 이미지 첨부</label>
                <button class="button small-button primary-button" style="background:#3b82f6; border:none;" onclick="window.addQImageSlot()">+ 이미지 추가</button>
            </div>
            <div id="q-images-container"></div>
        </div>
        
        <div style="background:#f1f5f9; padding:20px; border-radius:12px; margin-bottom:20px; border:1px solid #e2e8f0;">
            <div style="display:flex; justify-content:space-between; margin-bottom:15px;"><label style="font-weight:bold;">3. 선택지 분할 (이미지 지원)</label><button class="button small-button primary-button" onclick="window.autoSplitOptions()">🪄 텍스트 자동 분할</button></div>
            ${optsHtml}
        </div>
        
        <div class="form-group"><label style="font-weight:bold;">4. 정답</label><input type="text" id="q-answer" value="${esc(q.answer)}" style="width:100%; padding:12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box; color:#059669; font-weight:bold;"></div>
        
        <div class="form-group"><label style="font-weight:bold;">5. 해설 요약</label><textarea id="q-short" style="width:100%; height:60px; padding:12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box;">${q.shortExplanation||''}</textarea></div>
        <div class="form-group"><label style="font-weight:bold;">6. 상세 해설</label><textarea id="q-explanation" style="width:100%; height:120px; padding:12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box;">${q.explanation||''}</textarea></div>
        
        <div class="form-group" style="background:#f1f5f9; padding:15px; border-radius:12px; margin-bottom:20px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;"><label style="font-weight:bold;">7. 목차 정보</label><button class="button small-button light-button" onclick="window.addPathInput()" style="background:white; border:1px solid #cbd5e1; font-weight:bold;">+ 항목 추가</button></div>
            <div id="path-container">${pathHtml}</div>
        </div>
        
        <div class="form-group" style="margin-top:15px;"><label style="font-weight:bold;">8-1. 암기 코드</label><input type="text" id="q-mne" value="${esc(q.mnemonic)}" style="width:100%; padding:12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box;"></div>
        <div class="form-group" style="margin-bottom:20px;"><label style="font-weight:bold;">8-2. 해석 및 풀이</label><input type="text" id="q-mneD" value="${esc(q.mnemonicDesc)}" style="width:100%; padding:12px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box;"></div>
        
        <div class="form-group" style="margin-bottom:15px;">
            <label style="color:#6366f1; font-weight:bold; display:block; margin-bottom:5px;">🔑 키워드 (쉼표 구분)</label>
            <input type="text" id="q-kw" value="${esc((q.keywords||[]).join(', '))}" style="width:100%; padding:12px; border-radius:8px; border:1px solid #c7d2fe; box-sizing:border-box;">
        </div>
        <div class="form-group" style="margin-bottom:20px;">
            <label style="color:#8b5cf6; font-weight:bold; display:block; margin-bottom:5px;">🏷️ 태그 (쉼표 구분)</label>
            <input type="text" id="q-tags" value="${esc((q.tags||[]).join(', '))}" style="width:100%; padding:12px; border-radius:8px; border:1px solid #ddd6fe; box-sizing:border-box;">
        </div>
        
        <div style="background:#fffbeb; padding:20px; border-radius:15px; border:1px solid #fde68a; margin-bottom:20px;">
            <label style="font-weight:bold; color:#b45309; display:block; margin-bottom:10px;">🕸️ 지식 연결망 (GCM)</label>
            <textarea id="q-kn" placeholder="관계 (A ➔ B)" style="width:100%; height:80px; padding:12px; border-radius:8px; border:1px solid #fcd34d; box-sizing:border-box;">${q.knowledgeNetwork||''}</textarea>
        </div>

        <div class="form-group">
            <label style="font-weight:bold; color:#3b82f6;">📐 도식 및 핵심 공식</label>
            <textarea id="q-diagram" style="width:100%; height:100px; padding:12px; border-radius:8px; border:1px solid #93c5fd; box-sizing:border-box; font-family:monospace; background:#eff6ff;" placeholder="문제의 핵심 구조, 도식, 공식을 자유롭게 입력하세요.">${esc(q.diagramFormula||'')}</textarea>
        </div>
        
        <button class="button primary-button" style="width:100%; height:65px; font-size:1.2em; margin-top:20px; box-shadow:0 4px 12px rgba(59,130,246,0.3);" onclick="window.saveFullUpdate('${qId||''}')">💾 저장 완료</button>
    </div>`;

    window.qImageCount = 0;
    let qImgs = q.images || [];
    if (q.imageUrl && qImgs.length === 0) qImgs.push({url: q.imageUrl, desc: q.imageDesc});
    if (qImgs.length === 0) window.addQImageSlot();
    else qImgs.forEach(img => window.addQImageSlot(img.url, img.desc));
};

window.addPathInput = function() { 
    const cont = document.getElementById('path-container'); 
    const div = document.createElement('div'); div.className = 'path-item'; div.style = "display:flex; gap:5px; margin-bottom:8px; align-items:center;"; 
    div.innerHTML = `<span class="path-num" style="width:20px; text-align:center; font-weight:bold; color:#64748b;"></span><input type="text" class="path-input" placeholder="추가 목차..." style="flex:1; padding:10px; border-radius:8px; border:1px solid #cbd5e1;"><button class="button small-button light-button" onclick="this.parentElement.remove(); window.updatePathNumbers();" style="border:none; color:#ef4444;">❌</button>`; 
    cont.appendChild(div); window.updatePathNumbers(); 
};
window.updatePathNumbers = function() { document.querySelectorAll('.path-num').forEach((el, i) => el.textContent = i + 1); };

window.autoSplitOptions = function() { 
    let c=''; for(let i=0;i<5;i++){ const v=document.getElementById(`q-opt-${i}`).value; if(v) c+='\n'+v; } 
    let p=c.split(/(?:\([1-5]\)|[①-⑤]|\d\)\s+|\d\.\s+)/g).map(s=>s.trim()).filter(Boolean); 
    if(p.length<=1&&c.includes('\n')) p=c.split('\n').map(s=>s.trim()).filter(Boolean); 
    for(let i=0;i<5;i++) document.getElementById(`q-opt-${i}`).value=p[i]||''; 
};

window.saveFullUpdate = async function(qId) { 
    const opts=[], optImgs=[], images=[]; 
    for(let i=0; i<5; i++) { 
        const v = document.getElementById(`q-opt-${i}`).value.trim();
        const vi = document.getElementById(`q-opt-img-${i}`).value.trim();
        if(v || vi) { opts.push(v); optImgs.push(vi); } 
    } 
    
    document.querySelectorAll('.q-img-slot').forEach(slot => {
        const u = slot.querySelector('.q-img-url').value.trim();
        const d = slot.querySelector('.q-img-desc').value.trim();
        if(u || d) images.push({url: u, desc: d});
    });
    
    const paths = Array.from(document.querySelectorAll('.path-input')).map(i => i.value.trim()).filter(Boolean);
    const data = { 
        category: document.getElementById('q-category').value.trim()||'미분류', 
        negativeType: document.getElementById('q-type').value, 
        text: document.getElementById('q-text').value, 
        options: opts, 
        optionImages: optImgs,
        images: images,
        answer: document.getElementById('q-answer').value, 
        diagramFormula: document.getElementById('q-diagram').value, 
        shortExplanation: document.getElementById('q-short').value, 
        explanation: document.getElementById('q-explanation').value, 
        knowledgeNetwork: document.getElementById('q-kn').value, 
        pathLevels: paths, 
        keywords: document.getElementById('q-kw').value.split(',').map(s=>s.trim()).filter(Boolean), 
        tags: document.getElementById('q-tags').value.split(',').map(s=>s.trim()).filter(Boolean), 
        mnemonic: document.getElementById('q-mne').value, 
        mnemonicDesc: document.getElementById('q-mneD').value, 
        updatedAt: firebase.firestore.FieldValue.serverTimestamp() 
    }; 
    
    if(!qId) data.bookmarked = false;

    window.showLoading();
    try { 
        if(qId) await db.collection('subjects').doc(window.currentSubjectId).collection('questions').doc(qId).update(data); 
        else { 
            data.qid = window.allQuestionsForSubject.length+1; 
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp(); 
            await db.collection('subjects').doc(window.currentSubjectId).collection('questions').add(data); 
        } 
        await window.manageSubject(window.currentSubjectId); 
    } catch(e) { window.hideLoading(); alert("저장 실패"); } 
};

console.log("Module 4: app-logic.js Complete Audio, Bookmark, & Editor Patch (v9.9.5).");
window.startApp();
