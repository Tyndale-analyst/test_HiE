// 게임 상태 관리
const gameState = {
    gameRunning: false,
    score: 0,
    lives: 5,
    words: [],
    wordsDestroyed: 0,
    wordList: [],
    audioContext: null,
    microphoneStream: null,
    micPermissionGranted: false,
    speechRecognition: null,
    speechStream: [], // 실시간 음성 스트림 단어 배열
    wordMap: new Map(), // 단어별 스파이크 빠른 검색용
    lastVolumeUpdate: 0 // 볼륨 업데이트 스로틀링용
};

// DOM 요소 참조
const gameContainer = document.getElementById('gameContainer');
const scoreDisplay = document.getElementById('scoreDisplay');
const heartsContainer = document.getElementById('heartsContainer');
const micStatus = document.getElementById('micStatus');
const micText = document.getElementById('micText');
const micIndicator = document.getElementById('micIndicator');
const gameOverModal = document.getElementById('gameOverModal');
const loadingScreen = document.getElementById('loadingScreen');
const loadingText = document.getElementById('loadingText');
const progressFill = document.getElementById('progressFill');
const startButton = document.getElementById('startButton');
const voiceInputText = document.getElementById('voiceInputText');
const voiceEngineStatus = document.getElementById('voiceEngineStatus');

// 다크 모드 토글
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// 저장된 테마 적용
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

// 테마 토글 버튼 이벤트 리스너 추가
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.querySelector('.theme-toggle');
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', toggleTheme);
    }
});

// CSV에서 단어 목록 로드
async function loadWordList() {
    try {
        progressFill.style.width = '20%';
        loadingText.textContent = '단어 목록 로딩 중...';
        
        const response = await fetch('source/nounlist.csv');
        const csvText = await response.text();
        
        // CSV 파싱 (전체 단어 사용)
        const lines = csvText.split('\n');
        gameState.wordList = lines
            .map(line => line.trim().toLowerCase())
            .filter(word => word && word.length > 1 && word.length <= 8 && !word.includes(' '));
        
        console.log('✅ 단어 목록 로드 완료:', gameState.wordList.length, '개 단어');
        console.log('📋 처음 10개 단어:', gameState.wordList.slice(0, 10));
        progressFill.style.width = '40%';
    } catch (error) {
        console.error('❌ 단어 목록 로드 실패:', error);
        // 기본 단어 목록 사용
        gameState.wordList = ['apple', 'banana', 'cherry', 'dog', 'elephant', 'fire', 'green', 'house', 'ice', 'jump', 'key', 'lion', 'moon', 'nose', 'ocean', 'paper', 'queen', 'river', 'star', 'tree'];
        progressFill.style.width = '40%';
    }
}

// 마이크 권한 및 설정
async function setupMicrophone() {
    try {
        loadingText.textContent = '마이크 권한 요청 중...';
        progressFill.style.width = '50%';
        
        console.log('🎤 마이크 권한 요청 시작...');
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 44100
            } 
        });
        
        gameState.microphoneStream = stream;
        gameState.micPermissionGranted = true;
        
        console.log('✅ 마이크 권한 허용됨');
        loadingText.textContent = '마이크 설정 완료!';
        progressFill.style.width = '60%';
        
        // AudioContext 설정 (볼륨 모니터링용)
        gameState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = gameState.audioContext.createMediaStreamSource(stream);
        const analyser = gameState.audioContext.createAnalyser();
        source.connect(analyser);
        
        // 최적화된 실시간 볼륨 모니터링 (30fps로 감소)
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        function updateVolume() {
            if (!gameState.micPermissionGranted) return;
            
            const now = performance.now();
            // 33ms 간격으로 제한 (30fps)
            if (now - gameState.lastVolumeUpdate < 33) {
                requestAnimationFrame(updateVolume);
                return;
            }
            gameState.lastVolumeUpdate = now;
            
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
            
            // 상태 변경시에만 DOM 업데이트
            const isListening = average > 10;
            const hasClass = micIndicator.classList.contains('listening');
            
            if (isListening && !hasClass) {
                micIndicator.classList.add('listening');
            } else if (!isListening && hasClass) {
                micIndicator.classList.remove('listening');
            }
            
            requestAnimationFrame(updateVolume);
        }
        updateVolume();
        
        return true;
    } catch (error) {
        console.error('❌ 마이크 권한 거부 또는 오류:', error);
        
        // 구체적인 에러 메시지 표시
        let errorMessage = '마이크 권한이 필요합니다!';
        if (error.name === 'NotAllowedError') {
            errorMessage = '마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크를 허용해주세요.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = '마이크를 찾을 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.';
        } else if (error.name === 'NotReadableError') {
            errorMessage = '마이크에 접근할 수 없습니다. 다른 프로그램이 사용 중일 수 있습니다.';
        }
        
        loadingText.textContent = errorMessage;
        console.log('🔧 마이크 없이도 게임 진행 가능 (음성 인식 비활성화)');
        
        // 마이크 없이도 게임은 진행 가능하도록 설정
        gameState.micPermissionGranted = false;
        return true; // 실패해도 true 반환해서 게임은 시작되도록
    }
}

// Web Speech API 초기화
function initWebSpeechAPI() {
    loadingText.textContent = 'Web Speech API 초기화 중...';
    progressFill.style.width = '70%';
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.error('❌ Web Speech API를 지원하지 않는 브라우저');
        loadingText.textContent = 'Web Speech API를 지원하지 않는 브라우저입니다. 수동으로 단어를 입력하셔야 합니다.';
        voiceEngineStatus.textContent = '엔진: 지원되지 않음';
        voiceEngineStatus.className = 'voice-engine-status error';
        return true; // 음성 인식 없이도 게임 진행 가능
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    gameState.speechRecognition = new SpeechRecognition();
    
    // Web Speech API 설정 (반응성 향상)
    gameState.speechRecognition.continuous = true;
    gameState.speechRecognition.interimResults = true; // interim 결과도 처리해서 반응성 향상
    gameState.speechRecognition.lang = 'en-US';
    gameState.speechRecognition.maxAlternatives = 1; // 최고 후보만 사용
    gameState.speechRecognition.serviceURI = null; // 로컬 처리 우선

    gameState.speechRecognition.onstart = () => {
        console.log('🎤 음성 인식 시작됨');
        voiceEngineStatus.textContent = '엔진: Web Speech API 🎤';
        voiceEngineStatus.className = 'voice-engine-status';
    };

    // 음성 인식 결과 디바운싱
    let voiceInputTimeout = null;
    
    gameState.speechRecognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        // 임시 결과도 표시하여 반응성 향상
        const currentTranscript = finalTranscript || interimTranscript;
        console.log('🎯 음성 인식:', currentTranscript, finalTranscript ? '(최종)' : '(임시)');
        
        // 음성 입력 박스에 표시 (디바운싱 적용)
        if (currentTranscript && currentTranscript.trim()) {
            voiceInputText.textContent = `"${currentTranscript.trim()}"`;
            voiceInputText.classList.add('listening');
            
            // 기존 타이머 클리어
            if (voiceInputTimeout) {
                clearTimeout(voiceInputTimeout);
            }
            
            // 최종 결과가 있으면 즉시 처리
            if (finalTranscript.trim()) {
                voiceInputText.classList.remove('listening');
                handleVoiceInput(finalTranscript);
            }
            // 임시 결과도 충분히 긴 경우 처리 (빠른 반응, 100ms 디바운싱)
            else if (interimTranscript.trim().length >= 3) {
                voiceInputTimeout = setTimeout(() => {
                    handleVoiceInput(interimTranscript, true);
                }, 100);
            }
        } else {
            voiceInputText.textContent = '음성 인식 대기 중...';
        }
    };

    gameState.speechRecognition.onerror = (event) => {
        console.error('❌ Web Speech API 오류:', event.error);
        
        if (event.error === 'no-speech') {
            console.log('🔄 no-speech 오류 - 자동 재시작');
            voiceEngineStatus.textContent = '엔진: 음성 감지 대기 중...';
        } else {
            voiceEngineStatus.textContent = `엔진: 오류 - ${event.error}`;
            voiceEngineStatus.className = 'voice-engine-status error';
        }
        
        // 자동 재시작 시도
        if (gameState.gameRunning && event.error !== 'aborted') {
            setTimeout(() => {
                try {
                    if (gameState.speechRecognition && gameState.gameRunning) {
                        gameState.speechRecognition.start();
                        console.log('🔄 음성 인식 자동 재시작');
                    }
                } catch (restartError) {
                    console.error('❌ 자동 재시작 실패:', restartError);
                }
            }, 1000);
        }
    };

    gameState.speechRecognition.onend = () => {
        console.log('🛑 Web Speech API 종료됨');
        
        if (gameState.gameRunning) {
            console.log('🔄 게임 중이므로 음성 인식 재시작');
            setTimeout(() => {
                try {
                    if (gameState.speechRecognition && gameState.gameRunning) {
                        gameState.speechRecognition.start();
                    }
                } catch (error) {
                    console.error('❌ 재시작 실패:', error);
                }
            }, 100);
        } else {
            voiceEngineStatus.textContent = '엔진: 대기 중';
        }
    };

    console.log('✅ Web Speech API 초기화 완료');
    progressFill.style.width = '80%';
    return true;
}

// 게임 초기화
async function initGame() {
    console.log('🎮 게임 초기화 시작...');
    
    try {
        // 단어 목록 로드
        await loadWordList();
        
        // 마이크 설정 (실패해도 계속 진행)
        const micSuccess = await setupMicrophone();
        console.log('🎤 마이크 설정 결과:', micSuccess ? '성공' : '실패 (게임은 계속 진행)');
        
        // Web Speech API 초기화 (실패해도 계속 진행)
        const speechSuccess = initWebSpeechAPI();
        console.log('🗣️ 음성 인식 설정 결과:', speechSuccess ? '성공' : '실패 (게임은 계속 진행)');
        
        progressFill.style.width = '100%';
        
        // 마이크 상태 업데이트
        if (gameState.micPermissionGranted && gameState.speechRecognition) {
            loadingText.textContent = '준비 완료! 음성 인식이 활성화되었습니다.';
            micText.textContent = '마이크: 준비됨';
            voiceEngineStatus.textContent = '엔진: Web Speech API 준비';
        } else {
            loadingText.textContent = '준비 완료! (음성 인식 비활성화 - 키보드 입력 모드)';
            micText.textContent = '마이크: 비활성화';
            voiceEngineStatus.textContent = '엔진: 키보드 입력 모드';
            voiceEngineStatus.className = 'voice-engine-status fallback';
        }
        
        // 게임 시작 버튼 표시 (자동 시작 방지)
        startButton.style.display = 'block';
        startButton.onclick = () => {
            loadingScreen.style.display = 'none';
            startGame();
        };
        
        console.log('✅ 게임 초기화 완료 - 시작 버튼 대기 중');
        return true;
        
    } catch (error) {
        console.error('❌ 게임 초기화 중 오류:', error);
        loadingText.textContent = '초기화 중 오류가 발생했습니다. 새로고침해주세요.';
        micText.textContent = '마이크: 오류';
        return false;
    }
}

// 최적화된 음성 입력 처리
function handleVoiceInput(transcript, isInterim = false) {
    if (!transcript || !gameState.gameRunning) return;
    
    // 문장부호 제거 및 단어 분리
    const cleanTranscript = transcript.replace(/[.,!?'"()[\]{};:\-]/g, ' ');
    const words = cleanTranscript.toLowerCase().split(/\s+/);
    let wordMatched = false;
    
    for (let word of words) {
        word = word.trim().replace(/[^a-z]/g, ''); // 알파벳만 남기기
        if (word.length < 2) continue;
        
        console.log('🔍 처리 중인 단어:', word, isInterim ? '(임시)' : '(최종)');
        
        // 최종 결과만 음성 스트림에 추가
        if (!isInterim) {
            addToSpeechStream(word);
        }
        
        // Map을 사용한 빠른 단어 검색
        const wordSpikes = gameState.wordMap.get(word);
        if (wordSpikes && wordSpikes.length > 0) {
            // 가장 오른쪽에 있는 (X값이 큰) 스파이크 찾기
            let targetSpike = null;
            let targetIndex = -1;
            let maxX = -1;
            
            for (let i = 0; i < wordSpikes.length; i++) {
                const spike = wordSpikes[i];
                if (!spike.destroyed && spike.x > maxX) {
                    targetSpike = spike;
                    targetIndex = gameState.words.indexOf(spike);
                    maxX = spike.x;
                }
            }
            
            // 매칭된 스파이크가 있다면 파괴
            if (targetSpike && targetIndex !== -1) {
                console.log('🎯 매칭된 단어:', word, '-> 파괴! (X위치:', maxX.toFixed(1), ')');
                destroyWordSpike(targetSpike, targetIndex);
                
                // 음성 스트림에서도 해당 단어를 성공 표시로 교체 (최종 결과만)
                if (!isInterim) {
                    replaceInSpeechStream(word, `✅${word}`);
                }
                
                wordMatched = true;
                
                // 음성 입력 성공 표시
                voiceInputText.textContent = `✅ "${word}" 파괴!`;
                voiceInputText.style.color = '#00ff00';
                
                return; // 한 번에 하나씩만 파괴
            }
        }
    }
    
    if (!wordMatched && !isInterim) {
        // 매칭되지 않은 경우에도 단어들은 이미 스트림에 추가됨 (최종 결과만)
        console.log('🔍 매칭되지 않은 단어들이 스트림에 추가됨');
    }
}

// 단어+스파이크 파괴
function destroyWordSpike(wordSpike, index) {
    wordSpike.destroyed = true;
    gameState.score += 10;
    gameState.wordsDestroyed++;
    
    // wordMap에서 해당 스파이크 제거
    const wordSpikes = gameState.wordMap.get(wordSpike.word);
    if (wordSpikes) {
        const spikeIndex = wordSpikes.indexOf(wordSpike);
        if (spikeIndex !== -1) {
            wordSpikes.splice(spikeIndex, 1);
            if (wordSpikes.length === 0) {
                gameState.wordMap.delete(wordSpike.word);
            }
        }
    }
    
    // 빠른 스파이크(0.6px)에 특별 클래스 추가
    if (wordSpike.speed === 0.6 && gameState.lives < 5) {
        gameState.lives++;
        console.log('💚 빠른 스파이크 파괴로 하트 회복!', gameState.lives);
        
        // 하트 회복 시각적 효과
        document.body.style.boxShadow = 'inset 0 0 30px rgba(0, 255, 0, 0.3)';
        setTimeout(() => {
            document.body.style.boxShadow = '';
        }, 500);
        
        updateHearts();
    }
    
    updateScore();
    
    // 스파이크 이미지를 dead 버전으로 변경
    const spikeImg = wordSpike.element.querySelector('.spike-img');
    spikeImg.src = 'img/spike_dead.png';
    
    // 단어를 회색 박스로 변경
    const wordText = wordSpike.element.querySelector('.word-text');
    wordText.classList.add('dead');
    
    // 애니메이션 중지
    if (wordSpike.animationId) {
        cancelAnimationFrame(wordSpike.animationId);
    }
    
    // CSS 애니메이션으로 페이드아웃 (즉시 DOM에서 제거)
    wordSpike.element.classList.add('dying');
    
    // 3초 후 요소 제거 (CSS transition과 동기화)
    setTimeout(() => {
        if (wordSpike.element.parentNode) {
            wordSpike.element.parentNode.removeChild(wordSpike.element);
        }
        const arrayIndex = gameState.words.indexOf(wordSpike);
        if (arrayIndex !== -1) {
            gameState.words.splice(arrayIndex, 1);
        }
    }, 3000);
}

// 게임 시작
async function startGame() {
    gameState.gameRunning = true;
    gameState.score = 0;
    gameState.lives = 5;
    gameState.words = [];
    gameState.wordsDestroyed = 0;
    gameState.speechStream = []; // 음성 스트림 초기화
    gameState.wordMap.clear(); // wordMap 초기화
    
    updateScore();
    updateHearts();
    updateSpeechStreamDisplay(); // 음성 스트림 표시 초기화
    
    // 음성 입력 표시 초기화
    if (gameState.speechRecognition && gameState.micPermissionGranted) {
        voiceInputText.textContent = '음성 인식 대기 중...';
        voiceInputText.style.color = 'white';
    } else {
        voiceInputText.textContent = '키보드로 단어 입력 (Enter/Space로 확인)';
        voiceInputText.style.color = '#00aaff';
    }
    
    // 음성 인식 시작 (사용 가능한 경우만)
    if (gameState.speechRecognition && gameState.micPermissionGranted) {
        try {
            console.log('🚀 Web Speech API 시작...');
            gameState.speechRecognition.start();
            micText.textContent = 'Web Speech: 활성';
            micIndicator.classList.add('active');
            voiceEngineStatus.textContent = '엔진: Web Speech API 🎤';
            console.log('🎤 Web Speech API 음성 인식 시작됨');
        } catch (error) {
            console.error('❌ 음성 인식 시작 실패:', error);
            micText.textContent = '마이크: 오류 발생';
            voiceEngineStatus.textContent = `엔진: 시작 실패 - ${error.message}`;
            voiceEngineStatus.className = 'voice-engine-status error';
            
            // 음성 인식 실패해도 게임은 계속 진행
            voiceInputText.textContent = '음성 인식 비활성화됨 (수동 플레이)';
            voiceInputText.style.color = '#ffaa00';
        }
    } else {
        // 음성 인식이 사용 불가능한 경우
        console.log('🔇 음성 인식 비활성화 상태로 게임 시작');
        micText.textContent = '마이크: 비활성화';
        micIndicator.classList.remove('active');
        voiceEngineStatus.textContent = '엔진: 키보드 입력 모드';
        voiceEngineStatus.className = 'voice-engine-status fallback';
        voiceInputText.textContent = '키보드로 단어 입력 (Enter/Space로 확인)';
        voiceInputText.style.color = '#00aaff';
    }
    
    // 단어 생성 시작
    spawnWordLoop();
}

// 단어 생성 루프
function spawnWordLoop() {
    if (!gameState.gameRunning) return;
    
    createWordSpike();
    
    // 4-10초 간격으로 새 단어 생성 (기존 2-5초에서 반으로 줄임)
    const nextSpawnTime = 4000 + Math.random() * 6000;
    setTimeout(spawnWordLoop, nextSpawnTime);
}

// 최적화된 단어+스파이크 생성
function createWordSpike() {
    const word = gameState.wordList[Math.floor(Math.random() * gameState.wordList.length)];
    
    // 화면 내에서만 생성되도록 Y 위치 계산 (위아래 100px 여백)
    const headerHeight = 90; // 헤더 높이
    const spikeHeight = 90; // 스파이크 높이
    const wordHeight = 50; // 단어 텍스트 높이 (여유분 포함)
    const topMargin = 100; // 상단 여백
    const bottomMargin = 100; // 하단 여백
    const minY = headerHeight + topMargin; // 헤더 아래 + 상단 여백
    const maxY = window.innerHeight - spikeHeight - wordHeight - bottomMargin; // 화면 아래 - 하단 여백
    
    // 안전한 범위 확인
    const safeMaxY = Math.max(minY + 100, maxY); // 최소 100px 높이 보장
    const yPosition = minY + Math.random() * (safeMaxY - minY);
    
    console.log(`📏 화면 크기: ${window.innerWidth}x${window.innerHeight}, Y 범위: ${minY}~${safeMaxY}, 선택된 Y: ${yPosition.toFixed(0)}`);
    
    const wordSpikeElement = document.createElement('div');
    wordSpikeElement.className = 'word-spike';
    wordSpikeElement.style.left = '-120px';
    wordSpikeElement.style.top = yPosition + 'px';
    
    // 확률 기반 속도 선택: 0.300~0.349 랜덤 60%, 0.350~0.400 랜덤 30%, 0.6 고정 10%
    const random = Math.random() * 100; // 0-100 범위
    let randomSpeed;
    if (random < 60) {
        // 60% 확률: 0.300~0.349 사이 랜덤
        randomSpeed = 0.300 + Math.random() * 0.049; // 0.300 + 0~0.049
    } else if (random < 90) {
        // 30% 확률: 0.350~0.400 사이 랜덤
        randomSpeed = 0.350 + Math.random() * 0.050; // 0.350 + 0~0.050
    } else {
        // 10% 확률: 0.6 고정 (초록 광원 효과 유지)
        randomSpeed = 0.6;
    }
    
    // 빠른 스파이크(0.6px)에 특별 클래스 추가
    if (randomSpeed === 0.6) {
        wordSpikeElement.classList.add('fast-spike');
    }
    
    wordSpikeElement.innerHTML = `
        <img src="img/spike.png" alt="스파이크" class="spike-img">
        <div class="word-text">${word}</div>
    `;
    
    gameContainer.appendChild(wordSpikeElement);
    
    const wordSpike = {
        element: wordSpikeElement,
        word: word,
        x: -120,
        y: yPosition,
        speed: randomSpeed,
        destroyed: false,
        animationId: null
    };
    
    gameState.words.push(wordSpike);
    
    // wordMap에 스파이크 등록 (빠른 검색용)
    if (!gameState.wordMap.has(word)) {
        gameState.wordMap.set(word, []);
    }
    gameState.wordMap.get(word).push(wordSpike);
    
    console.log(`🚀 스파이크 생성: "${word}" 위치: (${wordSpike.x}, ${yPosition.toFixed(0)}) 속도: ${randomSpeed}px/frame (${(randomSpeed * 60).toFixed(1)}px/초)${randomSpeed === 0.6 ? ' ⚡빠른 스파이크!' : ''}`);
    
    // 이동 시작
    startMovingWordSpike(wordSpike);
}

function startMovingWordSpike(wordSpike) {
    function animate() {
        if (wordSpike.destroyed) return;
        
        wordSpike.x += wordSpike.speed;
        wordSpike.element.style.left = wordSpike.x + 'px';
        
        // 화면 오른쪽 끝에 도달하면 하트 잃고 스파이크 제거
        if (wordSpike.x > window.innerWidth) {
            gameState.lives--;
            console.log('💔 하트 잃음! 남은 하트:', gameState.lives);
            
            // 하트 손실 시각적 효과
            showHeartLossEffect();
            updateHearts();
            
            // wordMap에서 제거
            const wordSpikes = gameState.wordMap.get(wordSpike.word);
            if (wordSpikes) {
                const spikeIndex = wordSpikes.indexOf(wordSpike);
                if (spikeIndex !== -1) {
                    wordSpikes.splice(spikeIndex, 1);
                    if (wordSpikes.length === 0) {
                        gameState.wordMap.delete(wordSpike.word);
                    }
                }
            }
            
            // 스파이크 제거
            if (wordSpike.element.parentNode) {
                wordSpike.element.parentNode.removeChild(wordSpike.element);
            }
            const index = gameState.words.indexOf(wordSpike);
            if (index !== -1) {
                gameState.words.splice(index, 1);
            }
            
            // 게임 오버 체크
            if (gameState.lives <= 0) {
                gameOver();
                return;
            }
            
            return;
        }
        
        wordSpike.animationId = requestAnimationFrame(animate);
    }
    
    animate();
}

function updateScore() {
    scoreDisplay.textContent = `점수: ${gameState.score}`;
}

function updateHearts() {
    const hearts = heartsContainer.querySelectorAll('.heart');
    hearts.forEach((heart, index) => {
        if (index < gameState.lives) {
            heart.classList.remove('lost');
        } else {
            heart.classList.add('lost');
        }
    });
}

// 하트 손실 효과
function showHeartLossEffect() {
    // 빨간색 플래시 효과
    document.body.style.boxShadow = 'inset 0 0 50px rgba(255, 0, 0, 0.5)';
    
    // 하트들에 흔들림 효과
    const hearts = heartsContainer.querySelectorAll('.heart');
    hearts.forEach(heart => {
        heart.style.animation = 'heartLoss 0.6s ease-out';
    });
    
    setTimeout(() => {
        document.body.style.boxShadow = '';
        hearts.forEach(heart => {
            heart.style.animation = '';
        });
    }, 600);
}

// 게임 오버
function gameOver() {
    gameState.gameRunning = false;
    
    // 음성 인식 중지
    if (gameState.speechRecognition) {
        try {
            gameState.speechRecognition.stop();
            micText.textContent = '마이크: 비활성';
            micIndicator.classList.remove('active', 'listening');
            voiceEngineStatus.textContent = '엔진: 게임 종료';
        } catch (error) {
            console.log('음성 인식 중지 중 오류 (무시 가능):', error);
        }
    }
    
    // 남은 스파이크들의 애니메이션 중지
    gameState.words.forEach(wordSpike => {
        if (wordSpike.animationId) {
            cancelAnimationFrame(wordSpike.animationId);
        }
    });
    
    // 게임 결과 표시
    document.getElementById('finalScore').textContent = `최종 점수: ${gameState.score}`;
    document.getElementById('wordsDestroyed').textContent = `파괴한 단어: ${gameState.wordsDestroyed}개`;
    
    // 게임 오버 모달 표시
    gameOverModal.style.display = 'flex';
    
    console.log('🎮 게임 종료 - 점수:', gameState.score, '파괴한 단어:', gameState.wordsDestroyed);
}

// 게임 재시작
function restartGame() {
    // 모달 숨기기
    gameOverModal.style.display = 'none';
    
    // 기존 스파이크들 모두 제거
    gameState.words.forEach(wordSpike => {
        if (wordSpike.animationId) {
            cancelAnimationFrame(wordSpike.animationId);
        }
        if (wordSpike.element.parentNode) {
            wordSpike.element.parentNode.removeChild(wordSpike.element);
        }
    });
    
    // 상태 초기화
    gameState.words = [];
    gameState.wordMap.clear();
    
    // 게임 시작
    startGame();
}

// 실시간 음성 스트림에 단어 추가 (텍스트박스 방식)
function addToSpeechStream(word) {
    if (!word || word.length < 2) return;
    
    gameState.speechStream.push(word);
    
    // 텍스트박스가 너무 길어지면 (30개 단어 초과) 처음 단어들 제거
    const maxWords = 30;
    if (gameState.speechStream.length > maxWords) {
        const removeCount = gameState.speechStream.length - maxWords;
        gameState.speechStream.splice(0, removeCount);
    }
    
    // DOM 업데이트를 다음 프레임으로 지연 (배칭)
    requestAnimationFrame(updateSpeechStreamDisplay);
}

// 음성 스트림에서 단어 교체 (매칭 성공시)
function replaceInSpeechStream(oldWord, newWord) {
    const lastIndex = gameState.speechStream.lastIndexOf(oldWord);
    if (lastIndex !== -1) {
        gameState.speechStream[lastIndex] = newWord;
        
        // DOM 업데이트
        requestAnimationFrame(updateSpeechStreamDisplay);
        
        // 2초 후 성공 표시 제거
        setTimeout(() => {
            const successIndex = gameState.speechStream.indexOf(newWord);
            if (successIndex !== -1) {
                gameState.speechStream.splice(successIndex, 1);
                updateSpeechStreamDisplay();
            }
        }, 2000);
    }
}

// 음성 스트림 표시 업데이트 (텍스트박스 형태)
function updateSpeechStreamDisplay() {
    const container = document.getElementById('recentWordsContainer');
    if (!container) return;
    
    // 기존 내용 지우고 새로 만들기
    container.innerHTML = '';
    
    // 스트림이 비어있으면 대기 메시지 표시
    if (gameState.speechStream.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'speech-stream-content empty';
        emptyDiv.textContent = '실시간 음성 스트림 대기 중...';
        container.appendChild(emptyDiv);
        return;
    }
    
    // 스트림 내용을 하나의 텍스트박스로 표시
    const streamDiv = document.createElement('div');
    streamDiv.className = 'speech-stream-content';
    
    // 단어들을 공백으로 구분해서 한 줄로 표시
    const streamText = gameState.speechStream.join(' ');
    streamDiv.textContent = streamText;
    
    container.appendChild(streamDiv);
    
    // 스크롤을 맨 아래로 (가장 최신 단어가 보이도록)
    container.scrollTop = container.scrollHeight;
}

// 페이지 로드시 게임 초기화
window.addEventListener('load', async () => {
    console.log('🌐 페이지 로드됨, 게임 초기화 시작...');
    
    // 초기 상태 설정
    micText.textContent = '마이크: 초기화 중...';
    voiceEngineStatus.textContent = '엔진: 초기화 중...';
    startButton.style.display = 'none'; // 초기화 완료까지 버튼 숨김
    
    const success = await initGame();
    if (!success) {
        // 초기화 실패시에도 최소한의 상태 표시
        startButton.style.display = 'block';
        startButton.onclick = () => {
            alert('초기화에 실패했습니다. 페이지를 새로고침해주세요.');
        };
    }
});

// 키보드 입력으로 단어 입력 기능 (음성 인식 대체용)
let keyboardInput = '';
let keyboardInputTimeout = null;

document.addEventListener('keydown', (event) => {
    if (!gameState.gameRunning) return;
    
    // 알파벳 키만 처리
    if (event.key.length === 1 && /[a-zA-Z]/.test(event.key)) {
        keyboardInput += event.key.toLowerCase();
        
        // 음성 입력 박스에 현재 입력 표시
        voiceInputText.textContent = `⌨️ "${keyboardInput}"`;
        voiceInputText.style.color = '#00aaff';
        
        // 입력 중 타이머 리셋
        if (keyboardInputTimeout) {
            clearTimeout(keyboardInputTimeout);
        }
        
        // 1초 후 자동으로 단어 처리
        keyboardInputTimeout = setTimeout(() => {
            if (keyboardInput.length >= 2) {
                console.log('⌨️ 키보드 입력:', keyboardInput);
                handleVoiceInput(keyboardInput, false);
                addToSpeechStream(keyboardInput);
            }
            keyboardInput = '';
        }, 1000);
        
        event.preventDefault();
    }
    // 엔터나 스페이스로 즉시 입력
    else if ((event.key === 'Enter' || event.key === ' ') && keyboardInput.length >= 2) {
        if (keyboardInputTimeout) {
            clearTimeout(keyboardInputTimeout);
        }
        
        console.log('⌨️ 키보드 입력 (즉시):', keyboardInput);
        handleVoiceInput(keyboardInput, false);
        addToSpeechStream(keyboardInput);
        keyboardInput = '';
        
        event.preventDefault();
    }
    // 백스페이스로 글자 지우기
    else if (event.key === 'Backspace' && keyboardInput.length > 0) {
        keyboardInput = keyboardInput.slice(0, -1);
        
        if (keyboardInput.length > 0) {
            voiceInputText.textContent = `⌨️ "${keyboardInput}"`;
        } else {
            voiceInputText.textContent = '키보드로 단어 입력 중...';
            voiceInputText.style.color = 'white';
        }
        
        event.preventDefault();
    }
}); 