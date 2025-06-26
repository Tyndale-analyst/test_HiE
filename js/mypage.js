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

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('MyPage 초기화 시작');
    
    // 음성 합성 지원 확인
    if (!('speechSynthesis' in window)) {
        console.warn('이 브라우저는 음성 합성을 지원하지 않습니다.');
    }
    
    const myPage = new MyPageManager();
    
    // 디버깅용 전역 변수
    window.myPage = myPage;
    
    console.log('MyPage 초기화 완료');
}); 