class AudioBookPlayer {
    constructor() {
        this.sentences = [];
        this.translations = []; // 한국어 번역 배열
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isAutoPlaying = false;
        this.speechSynthesis = window.speechSynthesis;
        this.currentUtterance = null;
        this.playbackRate = 1.0;
        this.title = '';
        this.selectedVoice = 'mark'; // Default to Mark
        this.currentTooltip = null; // 툴팁 관리용
        this.currentPlayingWord = null; // 현재 발음 중인 단어 요소
        this.isSubtitleEnabled = false; // 자막 토글 상태 초기화
        
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeTheme();
        this.loadContent();
        this.setupFromURL();

        // Voice selection functionality
        this.setupVoiceSelection();

        // Word highlighting functionality
        this.wordDictionary = new Map();
        this.loadWordDictionary();
    }

    initializeElements() {
        this.sentenceText = document.getElementById('sentenceText');
        this.translationText = document.getElementById('translationText'); // 번역 텍스트 요소 추가
        this.translationCard = document.getElementById('translationCard'); // 번역 카드 요소 추가
        this.subtitleToggle = document.getElementById('subtitleToggle'); // 자막 토글 버튼 추가
        this.sentenceCard = document.getElementById('sentenceCard');
        this.playButton = document.getElementById('playButton');
        this.autoPlayButton = document.getElementById('autoPlayButton');
        this.prevButton = document.getElementById('prevButton');
        this.nextButton = document.getElementById('nextButton');
        this.speedSlider = document.getElementById('speedSlider');
        this.currentSpeed = document.getElementById('currentSpeed');
        this.currentSentenceSpan = document.getElementById('currentSentence');
        this.totalSentencesSpan = document.getElementById('totalSentences');
        this.pageTitle = document.getElementById('pageTitle');
        this.themeToggle = document.getElementById('themeToggle');
        this.titleIcon = document.getElementById('titleIcon');
        this.markVoice = document.getElementById('markVoice');
        this.susanVoice = document.getElementById('susanVoice');
        
        // 레코드 이미지 요소 추가
        this.recordImage = document.querySelector('.record-image');
        
        // 자막 토글 상태 초기화
        this.isSubtitleEnabled = false;
        
        // 디버깅: 자동재생 버튼 확인
        console.log('자동재생 버튼 요소:', this.autoPlayButton);
        if (!this.autoPlayButton) {
            console.error('자동재생 버튼을 찾을 수 없습니다! ID: autoPlayButton');
        }
        
        // Mark를 기본 선택 상태로 설정
        this.selectedVoice = 'mark';
        if (this.markVoice) {
            this.markVoice.classList.add('selected');
        }
    }

    initializeEventListeners() {
        this.playButton.addEventListener('click', () => this.togglePlayback());
        
        // 자동재생 버튼 이벤트 리스너 디버깅
        if (this.autoPlayButton) {
            console.log('자동재생 버튼 이벤트 리스너 추가 중...');
            this.autoPlayButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('자동재생 버튼 클릭됨!');
                console.log('현재 문장 개수:', this.sentences.length);
                console.log('현재 자동재생 상태:', this.isAutoPlaying);
                
                if (this.sentences.length === 0) {
                    console.error('문장이 로드되지 않았습니다!');
                    alert('텍스트가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
                    return;
                }
                
                try {
                    this.toggleAutoPlay();
                } catch (error) {
                    console.error('자동재생 토글 중 오류:', error);
                    alert('자동재생 중 오류가 발생했습니다: ' + error.message);
                }
            });
            
            // 추가 확인: 버튼 클릭 테스트
            console.log('자동재생 버튼 클릭 테스트...');
            this.autoPlayButton.style.border = '2px solid red'; // 디버깅용 빨간 테두리
            setTimeout(() => {
                if (this.autoPlayButton) {
                    this.autoPlayButton.style.border = ''; // 테두리 제거
                }
            }, 2000);
            
        } else {
            console.error('자동재생 버튼이 없어서 이벤트 리스너를 추가할 수 없습니다!');
        }
        
        this.prevButton.addEventListener('click', () => this.previousSentence());
        this.nextButton.addEventListener('click', () => this.nextSentence());
        
        // 속도 슬라이더 개선된 이벤트 리스너들
        this.speedSlider.addEventListener('input', (e) => this.updateSpeed(e.target.value));
        this.speedSlider.addEventListener('change', (e) => this.updateSpeed(e.target.value));
        this.speedSlider.addEventListener('mousemove', (e) => {
            if (e.buttons === 1) { // 마우스 버튼이 눌린 상태
                this.updateSpeed(e.target.value);
            }
        });
        this.speedSlider.addEventListener('touchmove', (e) => this.updateSpeed(e.target.value));
        
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // 성우 선택 이벤트
        if (this.markVoice) {
            this.markVoice.addEventListener('click', () => this.selectVoice('mark'));
        }
        if (this.susanVoice) {
            this.susanVoice.addEventListener('click', () => this.selectVoice('susan'));
        }

        // 자막 토글 이벤트
        if (this.subtitleToggle) {
            this.subtitleToggle.addEventListener('click', () => this.toggleSubtitle());
        }

        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    this.togglePlayback();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousSentence();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextSentence();
                    break;
            }
        });

        // 음성 합성 이벤트
        this.speechSynthesis.addEventListener('voiceschanged', () => {
            console.log('음성 목록이 업데이트되었습니다.');
        });
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.dataset.theme = savedTheme;
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.dataset.theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.dataset.theme = newTheme;
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const themeIcon = document.getElementById('themeIcon');
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    async loadContent() {
        try {
            // URL 파라미터에서 정보 가져오기
            const urlParams = new URLSearchParams(window.location.search);
            this.title = urlParams.get('title') || '오디오북';
            this.pageTitle.textContent = this.title;

            // 영어 텍스트와 한국어 번역 파일을 병렬로 로드
            const [englishResponse, koreanResponse] = await Promise.all([
                fetch('source/0101_goguryeo_jumong.txt'),
                fetch('source/0101_goguryeo_jumong_korean.txt')
            ]);
            
            if (!englishResponse.ok) {
                throw new Error('영어 텍스트 파일을 불러올 수 없습니다.');
            }
            if (!koreanResponse.ok) {
                throw new Error('한국어 번역 파일을 불러올 수 없습니다.');
            }
            
            const englishText = await englishResponse.text();
            const koreanText = await koreanResponse.text();
            
            // 영어 문장과 한국어 번역 파싱
            this.sentences = this.parseSentences(englishText);
            this.translations = this.parseTranslations(koreanText);
            
            console.log(`영어 문장: ${this.sentences.length}개, 한국어 번역: ${this.translations.length}개`);
            
            if (this.sentences.length === 0) {
                throw new Error('텍스트에서 문장을 찾을 수 없습니다.');
            }

            this.totalSentencesSpan.textContent = this.sentences.length;
            this.updateDisplay();
            
        } catch (error) {
            console.error('콘텐츠 로드 오류:', error);
            this.sentenceText.innerHTML = `
                <div class="error-message">
                    콘텐츠를 불러오는 중 오류가 발생했습니다.<br>
                    ${error.message}
                </div>
            `;
        }
    }

    parseSentences(text) {
        // 줄 바꿈 단위로 먼저 분리
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        // 각 줄을 문장 단위로 세분화 (문장 기호 보존)
        const sentences = [];
        
        for (const line of lines) {
            // 문장 기호(. ! ?)를 기준으로 분리하되, 기호 포함
            const lineSentences = line.split(/(?<=[.!?])\s+/)
                .map(sentence => sentence.trim())
                .filter(sentence => sentence.length > 0);
            
            sentences.push(...lineSentences);
        }
        
        // 빈 문장 제거 및 최종 필터링
        return sentences.filter(sentence => sentence.length > 0);
    }

    // 한국어 번역 파싱 함수
    parseTranslations(text) {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const translations = [];
        
        // 홀수 줄(인덱스 1, 3, 5...)이 한국어 번역
        for (let i = 1; i < lines.length; i += 2) {
            if (lines[i]) {
                translations.push(lines[i]);
            }
        }
        
        return translations;
    }

    updateDisplay() {
        if (this.sentences.length === 0) return;

        this.sentenceText.textContent = this.sentences[this.currentIndex];
        this.currentSentenceSpan.textContent = this.currentIndex + 1;
        
        // 한국어 번역 표시 (자막이 켜져있을 때만)
        if (this.isSubtitleEnabled) {
            if (this.translations && this.translations[this.currentIndex]) {
                this.translationText.textContent = this.translations[this.currentIndex];
                this.translationCard.classList.remove('hidden');
            } else {
                this.translationText.textContent = '번역을 찾을 수 없습니다.';
                this.translationCard.classList.remove('hidden');
            }
        } else {
            this.translationCard.classList.add('hidden');
        }
        
        // 단어 하이라이트 적용
        this.applySentenceHighlighting();
        
        // 버튼 상태 업데이트
        this.prevButton.disabled = this.currentIndex === 0;
        this.nextButton.disabled = this.currentIndex === this.sentences.length - 1;
        
        // 재생 중이 아닐 때 카드 스타일 초기화
        if (!this.isPlaying) {
            this.sentenceCard.classList.remove('speaking');
        }
    }

    togglePlayback() {
        if (this.isPlaying) {
            this.stopSpeech();
        } else {
            this.startSpeech();
        }
    }

    toggleAutoPlay() {
        console.log('toggleAutoPlay 호출됨! 현재 자동재생 상태:', this.isAutoPlaying);
        if (this.isAutoPlaying) {
            this.stopAutoPlay();
        } else {
            this.startAutoPlay();
        }
    }

    startAutoPlay() {
        console.log('자동재생 시작!');
        console.log('현재 문장 개수:', this.sentences.length);
        console.log('현재 인덱스:', this.currentIndex);
        
        if (this.sentences.length === 0) {
            console.error('문장이 없어서 자동재생을 시작할 수 없습니다!');
            alert('텍스트가 로드되지 않았습니다.');
            return;
        }
        
        this.isAutoPlaying = true;
        if (this.autoPlayButton) {
            this.autoPlayButton.textContent = '자동재생 중...';
            this.autoPlayButton.classList.add('auto-playing');
        }
        
        // 현재 문장부터 자동 재생 시작
        this.startSpeech();
    }

    stopAutoPlay() {
        console.log('자동재생 중지!');
        this.isAutoPlaying = false;
        if (this.autoPlayButton) {
            this.autoPlayButton.textContent = '자동재생';
            this.autoPlayButton.classList.remove('auto-playing');
        }
        
        // 현재 재생 중인 음성 정지
        this.stopSpeech();
    }

    startSpeech() {
        console.log('startSpeech 호출됨');
        console.log('문장 개수:', this.sentences.length);
        console.log('현재 인덱스:', this.currentIndex);
        
        if (this.sentences.length === 0) {
            console.error('문장이 없습니다!');
            return;
        }

        // 기존 음성 중지
        this.speechSynthesis.cancel();

        const text = this.sentences[this.currentIndex];
        console.log('재생할 텍스트:', text);
        
        this.currentUtterance = new SpeechSynthesisUtterance(text);
        
        // 음성 설정
        this.currentUtterance.rate = this.playbackRate;
        this.currentUtterance.pitch = 1.0;
        this.currentUtterance.volume = 1.0;
        
        // 사용 가능한 음성 목록 확인
        const voices = this.speechSynthesis.getVoices();
        console.log('=== 사용 가능한 TTS 음성 목록 ===');
        voices.forEach((voice, index) => {
            console.log(`${index}: ${voice.name} (${voice.lang}) - ${voice.localService ? 'Local' : 'Remote'}`);
        });
        
        // 미국 영어 음성 필터링
        const usEnglishVoices = voices.filter(voice => 
            voice.lang === 'en-US' || voice.lang.startsWith('en-US')
        );
        
        let selectedVoice = null;
        
        if (this.selectedVoice === 'mark') {
            // Microsoft Mark 음성 찾기
            selectedVoice = voices.find(voice => 
                voice.name.toLowerCase().includes('mark') && 
                (voice.lang === 'en-US' || voice.lang.startsWith('en-US'))
            );
            
            // Mark가 없으면 다른 남성 음성 중에서 찾기
            if (!selectedVoice) {
                selectedVoice = usEnglishVoices.find(voice => 
                    voice.name.toLowerCase().includes('male') ||
                    voice.name.toLowerCase().includes('david') ||
                    voice.name.toLowerCase().includes('guy')
                );
            }
        } else if (this.selectedVoice === 'susan') {
            // Microsoft Susan 음성 찾기
            selectedVoice = voices.find(voice => 
                voice.name.toLowerCase().includes('susan') && 
                (voice.lang === 'en-US' || voice.lang.startsWith('en-US'))
            );
            
            // Susan이 없으면 여성 음성 중에서 찾기
            if (!selectedVoice) {
                selectedVoice = usEnglishVoices.find(voice => 
                    voice.name.toLowerCase().includes('female') ||
                    voice.name.toLowerCase().includes('zira') ||
                    voice.name.toLowerCase().includes('aria') ||
                    voice.name.toLowerCase().includes('jenny') ||
                    voice.name.toLowerCase().includes('samantha')
                );
            }
        }
        
        // 선택된 성우 음성이 없으면 기본 음성 사용
        if (!selectedVoice && usEnglishVoices.length > 0) {
            selectedVoice = usEnglishVoices[0];
        }
        
        // 미국 영어 음성이 없으면 다른 영어 음성 사용
        if (!selectedVoice) {
            const englishVoices = voices.filter(voice => 
                voice.lang.startsWith('en')
            );
            
            if (englishVoices.length > 0) {
                selectedVoice = englishVoices[0];
                console.log(`대체 음성: ${selectedVoice.name} (${selectedVoice.lang})`);
            } else {
                console.log('영어 음성을 찾을 수 없습니다. 기본 음성을 사용합니다.');
            }
        } else {
            console.log(`선택된 성우 음성: ${selectedVoice.name} (${this.selectedVoice})`);
        }
        
        if (selectedVoice) {
            this.currentUtterance.voice = selectedVoice;
        }

        // 이벤트 리스너
        this.currentUtterance.onstart = () => {
            console.log('음성 재생 시작됨');
            this.isPlaying = true;
            this.playButton.innerHTML = '<span style="transform: scale(1.3); display: inline-block;">⏸</span>';
            this.playButton.setAttribute('aria-label', '일시정지');
            this.playButton.style.paddingLeft = '0px';
            this.playButton.style.paddingBottom = '5px';
            this.sentenceCard.classList.add('speaking');
            // 레코드 회전 시작
            this.startRecordSpinning();
        };

        this.currentUtterance.onend = () => {
            console.log('음성 재생 완료됨. 자동재생 상태:', this.isAutoPlaying);
            this.isPlaying = false;
            this.playButton.innerHTML = '▶';
            this.playButton.setAttribute('aria-label', '재생');
            this.playButton.style.paddingLeft = '3px';
            this.playButton.style.paddingBottom = '0px';
            this.sentenceCard.classList.remove('speaking');
            // 레코드 회전 정지
            this.stopRecordSpinning();
            
            // 자동재생 중이면 다음 문장으로 이동
            if (this.isAutoPlaying) {
                console.log('자동재생 중 - 다음 문장으로 이동');
                if (this.currentIndex < this.sentences.length - 1) {
                    this.currentIndex++;
                    this.updateDisplay();
                    console.log('다음 문장으로 이동됨. 새 인덱스:', this.currentIndex);
                    // 짧은 지연 후 다음 문장 재생
                    setTimeout(() => {
                        if (this.isAutoPlaying) {
                            console.log('다음 문장 재생 시작');
                            this.startSpeech();
                        }
                    }, 500);
                } else {
                    // 마지막 문장이면 자동재생 종료
                    console.log('마지막 문장 완료 - 자동재생 종료');
                    this.stopAutoPlay();
                }
            }
        };

        this.currentUtterance.onerror = (event) => {
            console.error('음성 합성 오류:', event);
            this.isPlaying = false;
            this.playButton.innerHTML = '▶';
            this.playButton.setAttribute('aria-label', '재생');
            this.playButton.style.paddingLeft = '3px';
            this.playButton.style.paddingBottom = '0px';
            this.sentenceCard.classList.remove('speaking');
            // 레코드 회전 정지
            this.stopRecordSpinning();
            
            // 자동재생 중 오류 발생 시 자동재생 중단
            if (this.isAutoPlaying) {
                console.log('음성 오류로 인한 자동재생 중단');
                this.stopAutoPlay();
            }
        };

        // 음성 재생 시작
        console.log('speechSynthesis.speak() 호출');
        this.speechSynthesis.speak(this.currentUtterance);
    }

    stopSpeech() {
        this.speechSynthesis.cancel();
        this.isPlaying = false;
        this.playButton.innerHTML = '▶';
        this.playButton.setAttribute('aria-label', '재생');
        this.playButton.style.paddingLeft = '3px';
        this.playButton.style.paddingBottom = '0px';
        this.sentenceCard.classList.remove('speaking');
        // 레코드 회전 정지
        this.stopRecordSpinning();
    }

    previousSentence() {
        if (this.currentIndex > 0) {
            this.stopSpeech();
            // 자동재생 중이면 중단
            if (this.isAutoPlaying) {
                this.stopAutoPlay();
            }
            this.currentIndex--;
            this.updateDisplay();
        }
    }

    nextSentence() {
        if (this.currentIndex < this.sentences.length - 1) {
            this.stopSpeech();
            // 자동재생 중이면 중단
            if (this.isAutoPlaying) {
                this.stopAutoPlay();
            }
            this.currentIndex++;
            this.updateDisplay();
        }
    }

    updateSpeed(value) {
        this.playbackRate = parseFloat(value);
        this.currentSpeed.textContent = `${this.playbackRate.toFixed(1)}x`;
        
        // 현재 재생 중인 경우 속도 업데이트
        if (this.currentUtterance && this.isPlaying) {
            // 현재 재생을 중지하고 새로운 속도로 다시 시작
            const wasAutoPlaying = this.isAutoPlaying;
            this.stopSpeech();
            
            // 짧은 지연 후 다시 시작
            setTimeout(() => {
                if (wasAutoPlaying) {
                    this.startSpeech(); // 자동재생 상태 유지
                }
            }, 100);
        }
    }

    setupFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        const item = urlParams.get('item');
        const title = urlParams.get('title');
        
        // 헤더 제목 설정
        if (title) {
            document.getElementById('pageTitle').textContent = decodeURIComponent(title);
        }
    }

    toggleIconColor() {
        // 모바일에서만 동작하도록 화면 크기 확인
        if (window.innerWidth <= 768) {
            if (this.titleIcon) {
                this.titleIcon.classList.toggle('clicked');
            }
        }
    }

    selectVoice(voiceType) {
        this.selectedVoice = voiceType;
        
        // UI 업데이트
        if (this.markVoice) {
            this.markVoice.classList.remove('selected');
        }
        if (this.susanVoice) {
            this.susanVoice.classList.remove('selected');
        }
        
        if (voiceType === 'mark' && this.markVoice) {
            this.markVoice.classList.add('selected');
        } else if (voiceType === 'susan' && this.susanVoice) {
            this.susanVoice.classList.add('selected');
        }
        
        console.log(`성우 변경: ${voiceType}`);
    }

    setupVoiceSelection() {
        const markBtn = document.getElementById('markVoice');
        const susanBtn = document.getElementById('susanVoice');
        
        // Set default selection to Mark
        if (markBtn) {
            markBtn.classList.add('selected');
        }
        
        if (markBtn) {
            markBtn.addEventListener('click', () => {
                this.selectedVoice = 'mark';
                markBtn.classList.add('selected');
                if (susanBtn) {
                    susanBtn.classList.remove('selected');
                }
                console.log('Mark 음성 선택됨');
            });
        }
        
        if (susanBtn) {
            susanBtn.addEventListener('click', () => {
                this.selectedVoice = 'susan';
                susanBtn.classList.add('selected');
                if (markBtn) {
                    markBtn.classList.remove('selected');
                }
                console.log('Susan 음성 선택됨');
            });
        }
    }

    // 레코드 회전 제어 메서드들 추가
    startRecordSpinning() {
        if (this.recordImage) {
            this.recordImage.classList.add('spinning');
        }
    }

    stopRecordSpinning() {
        if (this.recordImage) {
            this.recordImage.classList.remove('spinning');
        }
    }

    // Word highlighting functionality
    async loadWordDictionary() {
        try {
            const response = await fetch('source/nounlist_korean.csv');
            const csvText = await response.text();
            const lines = csvText.trim().split('\n');
            
            this.wordDictionary.clear();
            
            lines.forEach(line => {
                const [english, korean] = line.split(',');
                if (english && korean) {
                    // Clean up the words
                    const cleanEnglish = english.trim().toLowerCase();
                    const cleanKorean = korean.trim();
                    this.wordDictionary.set(cleanEnglish, cleanKorean);
                }
            });
            
            console.log(`Loaded ${this.wordDictionary.size} words into dictionary`);
            
            // 단어 사전이 로드된 후 현재 문장에 하이라이트 적용
            if (this.sentences.length > 0) {
                this.applySentenceHighlighting();
            }
        } catch (error) {
            console.error('Error loading word dictionary:', error);
        }
    }

    // Highlight words in text
    highlightWords(text) {
        if (!text || this.wordDictionary.size === 0) {
            return text;
        }
        
        // Split text into words while preserving punctuation and spacing
        const words = text.split(/(\s+|[.,!?;"()[\]{}])/);
        
        return words.map(word => {
            // Check if this is a word (not whitespace or punctuation)
            if (/^\s+$/.test(word) || /^[.,!?;"()[\]{}]+$/.test(word)) {
                return word;
            }
            
            // Clean word for lookup (remove punctuation, convert to lowercase)
            const cleanWord = word.replace(/[.,!?;"()[\]{}]/g, '').toLowerCase().trim();
            
            if (cleanWord && this.wordDictionary.has(cleanWord)) {
                const meaning = this.wordDictionary.get(cleanWord);
                return `<span class="highlighted-word" data-meaning="${meaning}" data-word="${cleanWord}">${word}</span>`;
            }
            
            return word;
        }).join('');
    }

    // Apply highlighting to sentence text
    applySentenceHighlighting() {
        const sentenceTextElement = document.getElementById('sentenceText');
        if (!sentenceTextElement) return;
        
        const currentText = sentenceTextElement.textContent;
        const highlightedText = this.highlightWords(currentText);
        sentenceTextElement.innerHTML = highlightedText;
        
        // Add event listeners for tooltips and word pronunciation
        const highlightedWords = sentenceTextElement.querySelectorAll('.highlighted-word');
        highlightedWords.forEach(wordElement => {
            wordElement.addEventListener('mouseenter', (e) => this.showTooltip(e));
            wordElement.addEventListener('mouseleave', () => this.hideTooltip());
            wordElement.addEventListener('mousemove', (e) => this.moveTooltip(e));
            wordElement.addEventListener('click', (e) => this.pronounceWord(e));
        });
    }

    // Pronounce single word
    pronounceWord(event) {
        const word = event.target.dataset.word;
        if (!word) return;
        const targetEl = event.target;
        
        // Visual flash feedback
        targetEl.classList.add('flash');
        setTimeout(() => {
            targetEl.classList.remove('flash');
        }, 600);
        
        // Cancel any queued individual word utterances but keep sentence speech
        // (speechSynthesis.cancel() would stop all, so avoid)
        
        const wordUtterance = new SpeechSynthesisUtterance(word);
        wordUtterance.rate = this.playbackRate;
        wordUtterance.pitch = 1.0;
        wordUtterance.volume = 1.0;
        
        // Voice selection logic (same as before)
        const voices = this.speechSynthesis.getVoices();
        let selectedVoice = null;
        
        if (this.selectedVoice === 'mark') {
            selectedVoice = voices.find(voice => 
                voice.name.toLowerCase().includes('mark') && 
                (voice.lang === 'en-US' || voice.lang.startsWith('en-US'))
            );
            
            if (!selectedVoice) {
                selectedVoice = voices.find(voice => 
                    (voice.lang === 'en-US' || voice.lang.startsWith('en-US')) &&
                    (voice.name.toLowerCase().includes('male') ||
                     voice.name.toLowerCase().includes('david') ||
                     voice.name.toLowerCase().includes('guy'))
                );
            }
        } else if (this.selectedVoice === 'susan') {
            selectedVoice = voices.find(voice => 
                voice.name.toLowerCase().includes('susan') && 
                (voice.lang === 'en-US' || voice.lang.startsWith('en-US'))
            );
            
            if (!selectedVoice) {
                selectedVoice = voices.find(voice => 
                    (voice.lang === 'en-US' || voice.lang.startsWith('en-US')) &&
                    (voice.name.toLowerCase().includes('female') ||
                     voice.name.toLowerCase().includes('zira') ||
                     voice.name.toLowerCase().includes('aria') ||
                     voice.name.toLowerCase().includes('jenny') ||
                     voice.name.toLowerCase().includes('samantha'))
                );
            }
        }
        
        // Fallback to any English voice
        if (!selectedVoice) {
            const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));
            if (englishVoices.length > 0) {
                selectedVoice = englishVoices[0];
            }
        }
        
        if (selectedVoice) {
            wordUtterance.voice = selectedVoice;
        }
        
        // Highlight handling
        wordUtterance.onstart = () => {
            // Remove highlight from any previous word
            if (this.currentPlayingWord) {
                this.currentPlayingWord.classList.remove('playing-word');
            }
            targetEl.classList.add('playing-word');
            this.currentPlayingWord = targetEl;
        };
        
        const clearHighlight = () => {
            if (targetEl.classList.contains('playing-word')) {
                targetEl.classList.remove('playing-word');
            }
            if (this.currentPlayingWord === targetEl) {
                this.currentPlayingWord = null;
            }
        };
        
        wordUtterance.onend = clearHighlight;
        wordUtterance.onerror = clearHighlight;
        
        this.speechSynthesis.speak(wordUtterance);
        console.log(`단어 발음: ${word}`);
    }

    // Tooltip functions
    showTooltip(event) {
        const meaning = event.target.dataset.meaning;
        const word = event.target.dataset.word;
        
        if (!meaning) return;
        
        // Remove existing tooltip
        this.hideTooltip();
        
        // Create tooltip
        this.currentTooltip = document.createElement('div');
        this.currentTooltip.className = 'word-tooltip';
        this.currentTooltip.innerHTML = `
            <div class="tooltip-word">${word}</div>
            <div class="tooltip-meaning">${meaning}</div>
        `;
        
        document.body.appendChild(this.currentTooltip);
        
        // Position tooltip
        this.moveTooltip(event);
    }

    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }

    moveTooltip(event) {
        if (!this.currentTooltip) return;
        
        const rect = this.currentTooltip.getBoundingClientRect();
        let x = event.clientX + 10;
        let y = event.clientY - rect.height - 10;
        
        // Adjust position if tooltip goes off screen
        if (x + rect.width > window.innerWidth) {
            x = event.clientX - rect.width - 10;
        }
        if (y < 0) {
            y = event.clientY + 20;
        }
        
        this.currentTooltip.style.left = x + 'px';
        this.currentTooltip.style.top = y + 'px';
    }

    toggleSubtitle() {
        this.isSubtitleEnabled = !this.isSubtitleEnabled;
        
        if (this.isSubtitleEnabled) {
            this.subtitleToggle.textContent = '한글자막 ON';
            this.subtitleToggle.classList.add('active');
        } else {
            this.subtitleToggle.textContent = '한글자막 OFF';
            this.subtitleToggle.classList.remove('active');
        }
        
        // 화면 업데이트
        this.updateDisplay();
        
        console.log(`자막 토글: ${this.isSubtitleEnabled ? 'ON' : 'OFF'}`);
    }
}

// 페이지 로드 시 AudioBookPlayer 초기화
document.addEventListener('DOMContentLoaded', () => {
    // Web Speech API 지원 확인
    if (!('speechSynthesis' in window)) {
        document.getElementById('sentenceText').innerHTML = `
            <div class="error-message">
                죄송합니다. 이 브라우저는 음성 합성을 지원하지 않습니다.<br>
                Chrome, Firefox, Safari 등의 최신 브라우저를 사용해주세요.
            </div>
        `;
        return;
    }

    const player = new AudioBookPlayer();
    
    // 추가 디버깅 정보
    window.debugPlayer = player;
    console.log('AudioBookPlayer 초기화 완료. window.debugPlayer로 접근 가능');
    
    // 콘솔에서 테스트할 수 있는 함수들
    window.testAutoPlay = function() {
        console.log('=== 수동 자동재생 테스트 ===');
        if (player.sentences.length === 0) {
            console.error('문장이 로드되지 않았습니다!');
            return;
        }
        player.toggleAutoPlay();
    };
    
    window.testPlayButton = function() {
        console.log('=== 재생 버튼 테스트 ===');
        player.togglePlayback();
    };
}); 