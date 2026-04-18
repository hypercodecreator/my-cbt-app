// [v6.0] app-db.js: Firebase & Offline Engine
const firebaseConfig = {
        apiKey: "AIzaSyBl4mNG0HVKLY159dPjJEuYZTp9_ay_guk",
        authDomain: "my-cbt-app-2cdb9.firebaseapp.com",
        projectId: "my-cbt-app-2cdb9",
        storageBucket: "my-cbt-app-2cdb9.firebasestorage.app",
        messagingSenderId: "1091430877229",
        appId: "1:1091430877229:web:1c4fae4ff852df4e1610a4"
};

// 1. 파이어베이스 초기화
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
window.db = firebase.firestore();
window.auth = firebase.auth();

// 2. 오프라인 캐시 활성화 (0초 부팅 지원)
window.db.enablePersistence({synchronizeTabs: true}).catch((err) => {
    console.warn("오프라인 모드 상태:", err.code);
});

// ==========================================
// 🚨 모든 전역 변수 사전 선언 (에러 원천 차단)
// ==========================================
window.allSubjects = [];
window.currentSubjectId = null;
window.currentSubjectData = null;

window.allQuestionsForSubject = [];
window.filteredQuestionsForSubject = [];
window.quizQuestions = [];

window.currentQuizIndex = 0;
window.quizScore = 0;
window.selectedOption = null;

window.quizLevel = 1;
window.rhythmLevel = 1;
window.currentBlankWord = null;
window.selectedBlankOption = null;

window.itemsPerPage = 20;
window.currentPage = 1;

window.currentComparisons = [];
window.selectedCompId = null;
window.currentNotes = [];

window.connectionGraph = {};
window.connectionNodes = [];

// 리듬 게임 및 관리 필터 제어용 변수
window.isRhythmPlaying = false;
window.rhythmTimer = null;
window.rhythmFeedbackTimer = null;
window.currentRhythmSpeed = 1.0;
window.isGcmFilterOn = false;

// ==========================================
// 📡 공통 데이터 통신 헬퍼 함수
// ==========================================
window.fetchWithCache = async function(query) {
    try {
        const snap = await query.get({ source: 'cache' });
        if (!snap.empty) {
            if (typeof window.showSyncIndicator === 'function') window.showSyncIndicator();
            query.get({ source: 'server' }).finally(() => {
                if (typeof window.hideSyncIndicator === 'function') window.hideSyncIndicator();
            }).catch(()=>{});
            return snap;
        }
    } catch (e) {
        console.log("캐시 읽기 실패, 서버 요청 진행");
    }
    
    if (typeof window.showSyncIndicator === 'function') window.showSyncIndicator();
    const res = await query.get();
    if (typeof window.hideSyncIndicator === 'function') window.hideSyncIndicator();
    return res;
};

window.fetchDocWithCache = async function(docRef) {
    try {
        const doc = await docRef.get({ source: 'cache' });
        if (doc.exists) {
            docRef.get({ source: 'server' }).catch(()=>{});
            return doc;
        }
    } catch (e) {}
    return await docRef.get();
};

console.log("Module 1: app-db.js Loaded Successfully.");