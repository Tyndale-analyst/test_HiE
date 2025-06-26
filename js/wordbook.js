class MyPageManager {
    constructor() {
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeTheme();
        this.loadUserData();
    }

    initializeElements() {
        this.backButton = document.getElementById('backButton');
        this.themeToggle = document.getElementById('themeToggle');
        this.themeIcon = document.getElementById('themeIcon');
        this.titleIcon = document.getElementById('titleIcon');
        
        // Progress elements
        this.progressFill = document.querySelector('.progress-fill');
        this.progressLabel = document.querySelector('.progress-label');
        
        // Vocabulary cards
        this.vocabCards = document.querySelectorAll('.vocab-card');
        
        // Audiobook items
        this.audiobookItems = document.querySelectorAll('.audiobook-item');
    }

    initializeEventListeners() {
        // Back button
        if (this.backButton) {
            this.backButton.addEventListener('click', () => this.goBack());
        }

        // Theme toggle
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Title icon click effect (mobile)
        if (this.titleIcon) {
            this.titleIcon.addEventListener('click', () => this.toggleIconColor());
        }

        // Vocabulary card interactions
        this.vocabCards.forEach(card => {
            card.addEventListener('click', () => this.pronounceWord(card));
        });

        // Audiobook item interactions
        this.audiobookItems.forEach(item => {
            item.addEventListener('click', () => this.openAudiobook(item));
        });

        // Add smooth animations on scroll
        this.setupScrollAnimations();
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
        
        console.log(`테마가 ${newTheme}로 변경되었습니다.`);
    }

    updateThemeIcon(theme) {
        if (this.themeIcon) {
            this.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    goBack() {
        // 메인 페이지로 돌아가기
        window.location.href = 'index.html';
    }

    toggleIconColor() {
        // 모바일에서만 동작하도록 화면 크기 확인
        if (window.innerWidth <= 768) {
            if (this.titleIcon) {
                this.titleIcon.classList.toggle('clicked');
                // 2초 후 클래스 제거
                setTimeout(() => {
                    this.titleIcon.classList.remove('clicked');
                }, 2000);
            }
        }
    }

    loadUserData() {
        // 사용자 데이터 로드 (localStorage 또는 API에서)
        this.loadProgress();
        this.loadVocabularyProgress();
        this.loadRecentAudiobooks();
    }

    loadProgress() {
        // 현재 듣고 있는 책의 진행률 업데이트
        const savedProgress = localStorage.getItem('currentBookProgress');
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            this.updateProgress(progress.current, progress.total);
        } else {
            // 기본값 설정 (페이지 단위)
            this.updateProgress(18, 63);
        }
    }

    updateProgress(currentPage, totalPages) {
        const percentage = (currentPage / totalPages) * 100;
        
        if (this.progressFill) {
            this.progressFill.style.width = `${percentage}%`;
        }
        
        if (this.progressLabel) {
            this.progressLabel.textContent = `${currentPage} / ${totalPages}`;
        }
    }

    loadVocabularyProgress() {
        // 단어장 진행률 로드
        const vocabProgress = localStorage.getItem('vocabularyProgress');
        if (vocabProgress) {
            const progress = JSON.parse(vocabProgress);
            console.log('단어장 진행률:', progress);
        }
    }

    loadRecentAudiobooks() {
        // 최근 들은 오디오북 목록 로드
        const recentBooks = localStorage.getItem('recentAudiobooks');
        if (recentBooks) {
            const books = JSON.parse(recentBooks);
            console.log('최근 오디오북:', books);
        }
    }

    pronounceWord(card) {
        const englishWord = card.querySelector('.vocab-english')?.textContent;
        const koreanWord = card.querySelector('.vocab-korean')?.textContent;
        
        if (!englishWord) return;

        // 카드 애니메이션 효과
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
            card.style.transform = '';
        }, 150);

        // 음성 재생
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(englishWord);
            
            // 영어 음성 설정
            const voices = speechSynthesis.getVoices();
            const englishVoice = voices.find(voice => 
                voice.lang.startsWith('en') && voice.name.toLowerCase().includes('mark')
            ) || voices.find(voice => voice.lang.startsWith('en'));
            
            if (englishVoice) {
                utterance.voice = englishVoice;
            }
            
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            
            speechSynthesis.speak(utterance);
            console.log(`단어 발음: ${englishWord} (${koreanWord})`);
        }
    }

    openAudiobook(item) {
        const title = item.querySelector('.audiobook-title')?.textContent;
        const category = item.querySelector('.audiobook-category')?.textContent;
        
        // 애니메이션 효과
        item.style.transform = 'scale(0.98)';
        setTimeout(() => {
            item.style.transform = '';
        }, 150);

        // 오디오북 페이지로 이동 (주몽 설화만 실제 구현됨)
        if (title === '주몽 설화') {
            const params = new URLSearchParams({
                category: '고대',
                item: '고구려',
                title: '고구려 - 주몽 설화'
            });
            window.location.href = `audiobook.html?${params.toString()}`;
        } else {
            // 다른 오디오북들은 준비 중 메시지
            this.showComingSoonMessage(title);
        }
        
        console.log(`오디오북 선택: ${title} (${category})`);
    }

    showComingSoonMessage(title) {
        // 간단한 알림 메시지
        const message = `"${title}" 오디오북은 곧 공개될 예정입니다! 🎧`;
        
        // 커스텀 알림 박스 생성
        const alertBox = document.createElement('div');
        alertBox.className = 'custom-alert';
        alertBox.innerHTML = `
            <div class="alert-content">
                <div class="alert-icon">🎧</div>
                <div class="alert-message">${message}</div>
                <button class="alert-close">확인</button>
            </div>
        `;
        
        // 스타일 추가
        alertBox.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;
        
        const alertContent = alertBox.querySelector('.alert-content');
        alertContent.style.cssText = `
            background: var(--card-bg);
            padding: 2rem;
            border-radius: 12px;
            text-align: center;
            max-width: 400px;
            margin: 1rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;
        
        const alertIcon = alertBox.querySelector('.alert-icon');
        alertIcon.style.cssText = `
            font-size: 3rem;
            margin-bottom: 1rem;
        `;
        
        const alertMessage = alertBox.querySelector('.alert-message');
        alertMessage.style.cssText = `
            font-size: 1.1rem;
            margin-bottom: 1.5rem;
            color: var(--text-color);
            line-height: 1.5;
        `;
        
        const alertClose = alertBox.querySelector('.alert-close');
        alertClose.style.cssText = `
            background: var(--primary-color);
            color: white;
            border: none;
            padding: 0.8rem 2rem;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            transition: background-color 0.3s ease;
        `;
        
        // 닫기 버튼 이벤트
        alertClose.addEventListener('click', () => {
            alertBox.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(alertBox);
            }, 300);
        });
        
        // 배경 클릭 시 닫기
        alertBox.addEventListener('click', (e) => {
            if (e.target === alertBox) {
                alertClose.click();
            }
        });
        
        document.body.appendChild(alertBox);
        
        // CSS 애니메이션 추가
        if (!document.querySelector('#alert-animations')) {
            const style = document.createElement('style');
            style.id = 'alert-animations';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    setupScrollAnimations() {
        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);
        
        // 애니메이션할 요소들 설정
        const animatedElements = document.querySelectorAll(
            '.current-book-card, .vocab-card, .audiobook-item'
        );
        
        animatedElements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
            observer.observe(el);
        });
    }

    // 유틸리티 메서드들
    saveProgress(currentPage, totalPages) {
        const progress = {
            current: currentPage,
            total: totalPages,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('currentBookProgress', JSON.stringify(progress));
    }

    addToVocabulary(english, korean) {
        let vocabulary = JSON.parse(localStorage.getItem('userVocabulary') || '[]');
        const newWord = {
            english,
            korean,
            addedAt: new Date().toISOString(),
            reviewCount: 0
        };
        
        // 중복 체크
        const exists = vocabulary.some(word => word.english.toLowerCase() === english.toLowerCase());
        if (!exists) {
            vocabulary.push(newWord);
            localStorage.setItem('userVocabulary', JSON.stringify(vocabulary));
            console.log(`단어 추가됨: ${english} - ${korean}`);
        }
    }
}

// 단어장 페이지 전용 클래스
class WordbookManager {
    constructor() {
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeTheme();
        this.loadWords();
    }

    initializeElements() {
        this.themeToggle = document.getElementById('themeToggle');
        this.themeIcon = document.getElementById('themeIcon');
        this.wordCards = document.querySelectorAll('.word-card');
        this.alphabetIcons = document.querySelectorAll('.alphabet-icon');
        this.showMoreBtn = document.getElementById('showMoreBtn');
        this.remainingCards = document.getElementById('remainingCards');
        this.sortButtons = document.querySelectorAll('.sort-btn');
        this.firstRowCards = document.querySelector('.first-row-cards');
    }

    initializeEventListeners() {
        // 테마 토글
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // 단어 카드 클릭 이벤트
        this.wordCards.forEach(card => {
            card.addEventListener('click', () => this.playWordPronunciation(card));
        });

        // 알파벳 아이콘 클릭 이벤트
        this.alphabetIcons.forEach(icon => {
            icon.addEventListener('click', () => this.filterByAlphabet(icon.textContent));
        });

        // 더보기 버튼 클릭 이벤트
        if (this.showMoreBtn) {
            this.showMoreBtn.addEventListener('click', () => this.toggleShowMore());
        }

        // 정렬 버튼 클릭 이벤트
        this.sortButtons.forEach(button => {
            button.addEventListener('click', () => this.handleSort(button));
        });

        // 카드 호버 효과 강화
        this.setupCardAnimations();
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
        if (this.themeIcon) {
            this.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    playWordPronunciation(card) {
        const englishWord = card.querySelector('.english-word').textContent;
        const koreanWord = card.querySelector('.korean-word').textContent;

        // 카드 클릭 애니메이션
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
            card.style.transform = '';
        }, 150);

        // 음성 재생 (마크 -> 수잔 순서)
        if ('speechSynthesis' in window) {
            this.playWithBothVoices(englishWord);
        }

        // 학습 진행률 업데이트
        this.updateLearningProgress(englishWord);
    }

    playWithBothVoices(text) {
        // 기존 음성 재생 중단
        speechSynthesis.cancel();

        const playVoice = (voiceType, delay = 0) => {
            setTimeout(() => {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.8;
                utterance.pitch = 1.0;

                const setVoice = () => {
                    const voices = speechSynthesis.getVoices();
                    const usEnglishVoices = voices.filter(voice =>
                        voice.lang === 'en-US' || voice.lang.startsWith('en-US')
                    );

                    let selectedVoice = null;

                    if (voiceType === 'mark') {
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
                    } else if (voiceType === 'susan') {
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
                        }
                    }

                    if (selectedVoice) {
                        utterance.voice = selectedVoice;
                        console.log(`${voiceType} 음성으로 재생: ${text} (${selectedVoice.name})`);
                    }

                    speechSynthesis.speak(utterance);
                };

                if (speechSynthesis.getVoices().length > 0) {
                    setVoice();
                } else {
                    speechSynthesis.addEventListener('voiceschanged', setVoice, { once: true });
                }
            }, delay);
        };

        // 마크 음성으로 먼저 재생
        playVoice('mark', 0);
        
        // 1.25초 후 수잔 음성으로 재생
        playVoice('susan', 1250);
    }

    filterByAlphabet(letter) {
        // 추후 알파벳별 필터링 기능 구현
        console.log(`${letter}로 시작하는 단어 필터링`);
        
        // 아이콘 클릭 효과
        const icon = Array.from(this.alphabetIcons).find(icon => icon.textContent === letter);
        if (icon) {
            icon.style.transform = 'scale(1.1)';
            setTimeout(() => {
                icon.style.transform = '';
            }, 200);
        }
    }

    setupCardAnimations() {
        // 카드 스크롤 애니메이션
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        this.wordCards.forEach((card, index) => {
            // 초기 상태 설정
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
            
            observer.observe(card);
        });
    }

    loadWords() {
        // 단어 학습 데이터 로드
        const learnedWords = this.getLearnedWords();
        this.updateWordProgress(learnedWords);
    }

    getLearnedWords() {
        const saved = localStorage.getItem('learnedWords');
        return saved ? JSON.parse(saved) : [];
    }

    updateLearningProgress(word) {
        const learnedWords = this.getLearnedWords();
        if (!learnedWords.includes(word)) {
            learnedWords.push(word);
            localStorage.setItem('learnedWords', JSON.stringify(learnedWords));
            this.updateWordProgress(learnedWords);
        }
    }

    updateWordProgress(learnedWords) {
        const totalWords = this.wordCards.length;
        const progress = (learnedWords.length / totalWords) * 100;
        
        // 진행률 표시 (필요시 UI 추가)
        console.log(`단어 학습 진행률: ${progress.toFixed(1)}% (${learnedWords.length}/${totalWords})`);
    }

    // 단어 추가 기능 (관리자용)
    addWord(english, korean, category) {
        // 추후 동적 단어 추가 기능
        console.log(`새 단어 추가: ${english} - ${korean} (${category})`);
    }

    toggleShowMore() {
        const isExpanded = this.remainingCards.classList.contains('show');
        const btnText = this.showMoreBtn.querySelector('.btn-text');
        const btnIcon = this.showMoreBtn.querySelector('.btn-icon');

        if (isExpanded) {
            // 숨기기
            this.remainingCards.classList.remove('show');
            this.showMoreBtn.classList.remove('expanded');
            btnText.textContent = '더보기';
            btnIcon.textContent = '▼';
            
            // 부드러운 스크롤로 더보기 버튼 위치로 이동
            setTimeout(() => {
                this.showMoreBtn.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }, 100);
        } else {
            // 보이기
            this.remainingCards.classList.add('show');
            this.showMoreBtn.classList.add('expanded');
            btnText.textContent = '접기';
            btnIcon.textContent = '▲';
            
            // 카드 애니메이션 재실행
            setTimeout(() => {
                this.setupCardAnimations();
            }, 100);
        }
    }

    handleSort(button) {
        // 이전 활성 버튼 제거
        this.sortButtons.forEach(btn => btn.classList.remove('active'));
        
        // 현재 버튼 활성화
        button.classList.add('active');
        
        const sortType = button.dataset.sort;
        this.sortCards(sortType);
    }

    sortCards(sortType) {
        // 모든 카드 가져오기 (첫 번째 행과 남은 카드들)
        const firstRowCards = Array.from(this.firstRowCards.children);
        const remainingCards = Array.from(this.remainingCards.children);
        const allCards = [...firstRowCards, ...remainingCards];
        
        // 정렬 함수 적용
        let sortedCards;
        switch(sortType) {
            case 'abc':
                sortedCards = this.sortByEnglish(allCards);
                break;
            case 'korean':
                sortedCards = this.sortByKorean(allCards);
                break;
            case 'recent':
                sortedCards = this.sortByRecent(allCards);
                break;
            case 'oldest':
                sortedCards = this.sortByOldest(allCards);
                break;
            default:
                sortedCards = allCards;
        }
        
        // 정렬된 카드들을 다시 배치
        this.redistributeCards(sortedCards);
        
        // 애니메이션 효과
        this.animateCardSorting();
    }

    sortByEnglish(cards) {
        return cards.sort((a, b) => {
            const englishA = a.querySelector('.english-word').textContent.toLowerCase();
            const englishB = b.querySelector('.english-word').textContent.toLowerCase();
            return englishA.localeCompare(englishB);
        });
    }

    sortByKorean(cards) {
        return cards.sort((a, b) => {
            const koreanA = a.querySelector('.korean-word').textContent;
            const koreanB = b.querySelector('.korean-word').textContent;
            return koreanA.localeCompare(koreanB, 'ko');
        });
    }

    sortByRecent(cards) {
        // 최근순 정렬 (기본 순서의 역순)
        return cards.reverse();
    }

    sortByOldest(cards) {
        // 오래된순 정렬 (원래 순서 유지)
        return cards;
    }

    redistributeCards(sortedCards) {
        // 기존 카드들 제거
        this.firstRowCards.innerHTML = '';
        this.remainingCards.innerHTML = '';
        
        // 첫 3개 카드는 첫 번째 행에, 나머지는 remainingCards에
        sortedCards.forEach((card, index) => {
            if (index < 3) {
                this.firstRowCards.appendChild(card);
            } else {
                this.remainingCards.appendChild(card);
            }
        });
        
        // 카드 요소들 다시 초기화
        this.wordCards = document.querySelectorAll('.word-card');
        this.initializeCardEventListeners();
    }

    initializeCardEventListeners() {
        // 새로 배치된 카드들에 이벤트 리스너 재설정
        this.wordCards.forEach(card => {
            // 기존 이벤트 리스너 제거 (중복 방지)
            card.removeEventListener('click', this.cardClickHandler);
            // 새 이벤트 리스너 추가
            this.cardClickHandler = () => this.playWordPronunciation(card);
            card.addEventListener('click', this.cardClickHandler);
        });
        
        this.setupCardAnimations();
    }

    animateCardSorting() {
        // 정렬 애니메이션 효과
        this.wordCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.3s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('페이지 초기화 시작');
    
    // 음성 합성 지원 확인
    if (!('speechSynthesis' in window)) {
        console.warn('이 브라우저는 음성 합성을 지원하지 않습니다.');
    }
    
    // 현재 페이지가 단어장인지 확인
    if (document.querySelector('.wordbook-header')) {
        // 단어장 페이지
        const wordbookManager = new WordbookManager();
        window.wordbook = wordbookManager; // 디버깅용
        console.log('단어장 매니저 초기화 완료');
    } else {
        // 기존 마이페이지 매니저 실행
        const myPageManager = new MyPageManager();
        window.myPage = myPageManager; // 디버깅용
        console.log('마이페이지 매니저 초기화 완료');
    }
    
    console.log('페이지 초기화 완료');
}); 