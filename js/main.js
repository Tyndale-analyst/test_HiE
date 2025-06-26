console.log('main.js 파일이 로드되었습니다');

// 메뉴 데이터
const menuData = {
    '선사시대': ['구석기', '신석기', '청동기'],
    '부족연맹사회': ['고조선', '원삼국 시대'],
    '고대': ['고구려', '백제', '신라', '가야', '우산국'],
    '중세': ['고려', '원 간섭기'],
    '근세': ['조선 전반기', '임진왜란', '조선 후반기'],
    '근대': ['대한제국', '일제 강점기']
};

// 위치 데이터 (지도상의 대략적인 좌표)
const locationData = {
    '주몽설화': { x: '30%', y: '18%', title: '고구려 - 주몽 설화' },
    '평양성': { x: '28%', y: '40%', title: '고구려 - 장수왕의 남하' },
    '광개토대왕': { x: '59%', y: '9%', title: '고구려 - 광개토대왕' },
    '백제': { x: '45%', y: '55%', title: '백제' },
    '신라': { x: '74%', y: '70%', title: '신라' },
    '가야': { x: '65%', y: '78%', title: '가야' },
    '우산국': { x: '98%', y: '54%', title: '울릉도와 독도' }
};

// 카테고리별 여러 핀 데이터
const categoryPins = {
    '고구려': ['주몽설화', '평양성', '광개토대왕'],
    '백제': ['백제', '백제_부여', '백제_사비성'],  // 미래 확장
    '신라': ['신라', '신라_경주', '신라_통일']     // 미래 확장
};

let currentSelectedCategory = null;
let currentPin = null;

// 테마 토글 기능
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
    
    themeToggle.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    const themeIcon = document.getElementById('themeIcon');
    themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
}

// 모바일 사이드바 토글 기능
function initSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    
    sidebarToggle.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('hidden');
            if (sidebar.classList.contains('hidden')) {
                sidebarToggle.textContent = '▶';
                sidebarToggle.setAttribute('aria-label', '메뉴 열기');
                sidebarToggle.classList.add('floating');
            } else {
                sidebarToggle.textContent = '◀';
                sidebarToggle.setAttribute('aria-label', '메뉴 닫기');
                sidebarToggle.classList.remove('floating');
            }
        }
    });
    
    // 윈도우 리사이즈 시 사이드바 상태 조정
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('hidden');
            sidebarToggle.textContent = '◀';
            sidebarToggle.setAttribute('aria-label', '메뉴 닫기');
            sidebarToggle.classList.remove('floating');
        } else {
            // 모바일로 전환될 때 현재 상태 유지
            if (sidebar.classList.contains('hidden')) {
                sidebarToggle.classList.add('floating');
            } else {
                sidebarToggle.classList.remove('floating');
            }
        }
    });
}

// 사이드바 자동 숨김 (모바일에서 소주제 선택 시)
function hideSidebarOnMobile() {
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebarToggle');
        
        sidebar.classList.add('hidden');
        sidebarToggle.textContent = '▶';
        sidebarToggle.setAttribute('aria-label', '메뉴 열기');
        sidebarToggle.classList.add('floating');
    }
}

// 메뉴 생성
function createMenu() {
    const timeline = document.getElementById('timeline');
    
    Object.keys(menuData).forEach(category => {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        
        // 카테고리 버튼
        const categoryBtn = document.createElement('div');
        categoryBtn.className = 'menu-category';
        categoryBtn.innerHTML = `
            <span>${category}</span>
            <span class="category-arrow">▼</span>
        `;
        
        // 서브메뉴
        const submenu = document.createElement('div');
        submenu.className = 'submenu';
        
        menuData[category].forEach(subItem => {
            const submenuItem = document.createElement('div');
            submenuItem.className = 'submenu-item';
            submenuItem.textContent = subItem;
            submenuItem.setAttribute('aria-label', `${category} - ${subItem} 선택`);
            
            submenuItem.addEventListener('click', (e) => {
                console.log(`클릭된 서브메뉴: ${subItem}`);
                e.stopPropagation();
                selectSubmenuItem(subItem);
                hideSidebarOnMobile(); // 소주제 선택 시 모바일에서 사이드바 숨김
            });
            
            submenu.appendChild(submenuItem);
        });
        
        // 카테고리 클릭 이벤트
        categoryBtn.addEventListener('click', () => {
            toggleCategory(categoryBtn, submenu, category);
        });
        
        menuItem.appendChild(categoryBtn);
        menuItem.appendChild(submenu);
        timeline.appendChild(menuItem);
    });
}

// 카테고리 토글
function toggleCategory(categoryBtn, submenu, category) {
    const wasActive = categoryBtn.classList.contains('active');
    
    // 모든 카테고리 비활성화
    document.querySelectorAll('.menu-category').forEach(btn => {
        btn.classList.remove('active');
        btn.querySelector('.category-arrow').classList.remove('open');
    });
    
    document.querySelectorAll('.submenu').forEach(menu => {
        menu.classList.remove('open');
    });
    
    // 현재 카테고리 활성화 (이미 활성화된 경우 닫기)
    if (!wasActive) {
        categoryBtn.classList.add('active');
        categoryBtn.querySelector('.category-arrow').classList.add('open');
        submenu.classList.add('open');
        currentSelectedCategory = category;
        
        // URL 파라미터로 선택된 카테고리 저장
        const url = new URL(window.location);
        url.searchParams.set('category', category);
        window.history.replaceState({}, '', url);
    } else {
        currentSelectedCategory = null;
        // 카테고리가 닫힐 때 지도를 원래대로 되돌림
        changeMapImage(null);
        // 모든 핀 제거
        clearAllPins();
        // URL 파라미터 제거
        const url = new URL(window.location);
        url.searchParams.delete('category');
        window.history.replaceState({}, '', url);
    }
}

// 지도 이미지 변경 함수 (중복 생성 방지 강화)
function changeMapImage(country) {
    const mapWrapper = document.querySelector('.map-wrapper');
    const mapImage = document.querySelector('.map-image');
    const targetSrc = country === '고구려' ? 'img/Korean_map_Goguryeo.png' : 'img/Korean_map.png';
    
    // 기존 오버레이 확인
    const existingOverlay = mapWrapper.querySelector('.map-overlay');
    
    // 고구려가 아닌 경우 기존 오버레이만 fade out
    if (country !== '고구려') {
        if (existingOverlay) {
            console.log('기존 오버레이 fade out 시작');
            existingOverlay.style.transition = 'opacity 2s ease';
            existingOverlay.style.opacity = '0';
            
            setTimeout(() => {
                if (existingOverlay.parentNode) {
                    existingOverlay.remove();
                    console.log('기존 오버레이 제거 완료');
                }
            }, 2000);
        }
        console.log('원본 지도로 복원');
        return;
    }
    
    // 고구려인 경우 - 이미 오버레이가 있으면 새로 만들지 않음
    if (existingOverlay) {
        console.log('고구려 오버레이가 이미 존재함 - 새로 생성하지 않음');
        return;
    }
    
    console.log(`지도 변경: 기존 지도 위에 ${targetSrc} 오버레이`);
    
    // 새 이미지를 미리 로드
    const newImage = new Image();
    
    newImage.onload = function() {
        // 로드 완료 후 다시 한 번 중복 확인
        const doubleCheckOverlay = mapWrapper.querySelector('.map-overlay');
        if (doubleCheckOverlay) {
            console.log('로드 완료 후 중복 확인 - 이미 오버레이 존재');
            return;
        }
        
        console.log('새 이미지 로드 완료, 오버레이 생성');
        
        // 기존 지도 이미지의 정확한 위치와 크기 가져오기
        const mapRect = mapImage.getBoundingClientRect();
        const wrapperRect = mapWrapper.getBoundingClientRect();
        
        // 오버레이 이미지 엘리먼트 생성
        const overlayImage = document.createElement('img');
        overlayImage.src = targetSrc;
        overlayImage.className = 'map-overlay';
        overlayImage.alt = '고구려 지도';
        
        // 기존 이미지와 정확히 동일한 위치와 크기로 설정
        overlayImage.style.position = 'absolute';
        overlayImage.style.top = `${mapRect.top - wrapperRect.top}px`;
        overlayImage.style.left = `${mapRect.left - wrapperRect.left}px`;
        overlayImage.style.width = `${mapRect.width}px`;
        overlayImage.style.height = `${mapRect.height}px`;
        overlayImage.style.borderRadius = '12px';
        overlayImage.style.opacity = '0';
        overlayImage.style.transition = 'opacity 2s ease';
        overlayImage.style.zIndex = '1';
        
        console.log(`오버레이 위치: top=${mapRect.top - wrapperRect.top}px, left=${mapRect.left - wrapperRect.left}px`);
        console.log(`오버레이 크기: width=${mapRect.width}px, height=${mapRect.height}px`);
        
        // 기존 지도 z-index 설정
        mapImage.style.zIndex = '0';
        
        // 오버레이를 mapWrapper에 추가
        mapWrapper.appendChild(overlayImage);
        
        // 브라우저 강제 리플로우
        overlayImage.offsetHeight;
        
        // 2초에 걸쳐 서서히 나타남
        overlayImage.style.opacity = '1';
        
        console.log('2초 오버레이 페이드인 시작');
    };
    
    newImage.onerror = function() {
        console.error(`이미지 로드 실패: ${targetSrc}`);
    };
    
    // 이미지 로드 시작
    newImage.src = targetSrc;
}

// 서브메뉴 아이템 선택
function selectSubmenuItem(item) {
    console.log(`서브메뉴 선택: ${item}`);
    
    // 기존 핀들 모두 제거
    clearAllPins();
    
    // 지도 이미지 변경
    console.log(`지도 변경 함수 호출: ${item}`);
    changeMapImage(item);
    
    // 카테고리에 여러 핀이 있는 경우 모두 표시
    if (categoryPins[item]) {
        categoryPins[item].forEach(pinItem => {
            if (locationData[pinItem]) {
                createMapPin(pinItem, locationData[pinItem], item);
            }
        });
    } else if (locationData[item]) {
        // 단일 핀인 경우
        createMapPin(item, locationData[item], item);
    }
}

// 모든 핀 제거 함수
function clearAllPins() {
    const existingPins = document.querySelectorAll('.map-pin');
    existingPins.forEach(pin => pin.remove());
    currentPin = null;
}

// 지도 핀 생성 (수정됨)
function createMapPin(pinId, location, originalItem) {
    const mapWrapper = document.querySelector('.map-wrapper');
    const mapImage = document.querySelector('.map-image');
    
    // 이미지가 로드될 때까지 기다림
    if (mapImage.complete) {
        addPin();
    } else {
        mapImage.addEventListener('load', addPin);
    }
    
    function addPin() {
        const pin = document.createElement('div');
        pin.className = 'map-pin visible';
        pin.dataset.pinId = pinId;
        pin.dataset.originalItem = originalItem;
        pin.dataset.isSelected = 'false';
        
        // 퍼센트 값을 픽셀 값으로 변환
        const xPercent = parseFloat(location.x) / 100;
        const yPercent = parseFloat(location.y) / 100;
        
        // 이미지의 실제 표시 크기 기준으로 위치 계산
        const imageRect = mapImage.getBoundingClientRect();
        const wrapperRect = mapWrapper.getBoundingClientRect();
        
        // 이미지 내에서의 실제 위치 계산
        const xPos = (imageRect.width * xPercent);
        const yPos = (imageRect.height * yPercent);
        
        pin.style.left = `${xPos}px`;
        pin.style.top = `${yPos}px`;
        pin.setAttribute('aria-label', `${location.title} 위치로 이동`);
        pin.innerHTML = `
            <img src="img/flag.png" alt="위치 핀" style="width: 100%; height: 100%;">
            <div class="location-title">${location.title}</div>
        `;
        
        // 2단계 클릭 시스템
        pin.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const isCurrentlySelected = pin.dataset.isSelected === 'true';
            
            if (!isCurrentlySelected) {
                // 첫 번째 클릭: 다른 핀들 선택 해제하고 현재 핀 선택
                clearPinSelections();
                selectPin(pin);
            } else {
                // 두 번째 클릭: 이동 처리
                if (pinId === '주몽설화') {
                    // 최근 오디오북에 추가
                    addToRecentAudiobooks('고대', '고구려', '주몽 설화');
                    
                    // 주몽설화만 실제 이동
                    const params = new URLSearchParams({
                        category: currentSelectedCategory || '',
                        item: originalItem,
                        title: location.title
                    });
                    window.location.href = `audiobook.html?${params.toString()}`;
                } else {
                    // 데모 핀들은 진동 효과
                    // 현재 위치 정보 저장
                    const currentLeft = pin.style.left;
                    const currentTop = pin.style.top;
                    
                    // 진동 효과 적용
                    pin.classList.add('shaking');
                    pin.style.animation = 'shake 0.5s ease-in-out';
                    
                    setTimeout(() => {
                        pin.style.animation = '';
                        pin.classList.remove('shaking');
                        // 원래 위치로 강제 복원
                        pin.style.left = currentLeft;
                        pin.style.top = currentTop;
                        pin.style.transform = 'translate(-50%, -50%)';
                    }, 500);
                }
            }
        });
        
        mapWrapper.appendChild(pin);
        
        // 첫 번째 핀을 currentPin으로 설정 (리사이즈 대응용)
        if (!currentPin) {
            currentPin = pin;
        }
    }
}

// 핀 선택 함수
function selectPin(pin) {
    pin.classList.add('selected');
    pin.dataset.isSelected = 'true';
}

// 모든 핀 선택 해제 함수
function clearPinSelections() {
    const allPins = document.querySelectorAll('.map-pin');
    allPins.forEach(pin => {
        pin.classList.remove('selected');
        pin.dataset.isSelected = 'false';
    });
}

// 지도 클릭 시 모든 핀 선택 해제
function initMapClickHandler() {
    const mapContainer = document.querySelector('.map-container');
    mapContainer.addEventListener('click', (e) => {
        // 핀이 아닌 영역 클릭 시 모든 선택 해제
        if (!e.target.closest('.map-pin')) {
            clearPinSelections();
        }
    });
}

// 윈도우 리사이즈 시 핀 위치 재조정 (수정됨)
function updatePinPositions() {
    const existingPins = document.querySelectorAll('.map-pin');
    const mapWrapper = document.querySelector('.map-wrapper');
    const existingOverlay = mapWrapper.querySelector('.map-overlay');
    
    if (existingPins.length > 0) {
        const originalItem = existingPins[0].dataset.originalItem;
        
        // 오버레이가 있다면 위치와 크기만 재조정
        if (existingOverlay) {
            const mapImage = document.querySelector('.map-image');
            const mapRect = mapImage.getBoundingClientRect();
            const wrapperRect = mapWrapper.getBoundingClientRect();
            
            existingOverlay.style.top = `${mapRect.top - wrapperRect.top}px`;
            existingOverlay.style.left = `${mapRect.left - wrapperRect.left}px`;
            existingOverlay.style.width = `${mapRect.width}px`;
            existingOverlay.style.height = `${mapRect.height}px`;
        }
        
        // 모든 핀 제거하고 다시 생성
        clearAllPins();
        
        // 원래 선택된 아이템으로 핀들 재생성 (오버레이는 재생성하지 않음)
        if (originalItem) {
            // selectSubmenuItem 대신 핀만 재생성
            recreatePinsOnly(originalItem);
        }
    }
}

// 핀만 재생성하는 함수 (오버레이는 건드리지 않음)
function recreatePinsOnly(item) {
    // 카테고리에 여러 핀이 있는 경우 모두 표시
    if (categoryPins[item]) {
        categoryPins[item].forEach(pinItem => {
            if (locationData[pinItem]) {
                createMapPin(pinItem, locationData[pinItem], item);
            }
        });
    } else if (locationData[item]) {
        // 단일 핀인 경우
        createMapPin(item, locationData[item], item);
    }
}

// 페이지 로드 시 URL 파라미터 확인
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const item = urlParams.get('item');
    
    if (category && menuData[category]) {
        // 해당 카테고리 열기
        setTimeout(() => {
            const categoryBtns = document.querySelectorAll('.menu-category');
            categoryBtns.forEach(btn => {
                if (btn.querySelector('span').textContent === category) {
                    btn.click();
                    
                    // item 파라미터가 있으면 해당 서브메뉴도 선택
                    if (item) {
                        setTimeout(() => {
                            const submenuItems = document.querySelectorAll('.submenu-item');
                            submenuItems.forEach(submenuItem => {
                                if (submenuItem.textContent === item) {
                                    submenuItem.click();
                                }
                            });
                        }, 200); // 카테고리 열린 후 서브메뉴 선택
                    }
                }
            });
        }, 100);
    }
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM이 로드되었습니다');
    console.log('메뉴 생성을 시작합니다');
    
    initThemeToggle();
    createMenu();
    checkUrlParams();
    initSidebarToggle();
    initRightSidebarToggle(); // 오른쪽 사이드바 토글 초기화
    initRecentAudiobooks(); // 최근 오디오북 초기화
    loadWordList(); // 단어장 모듈 초기화
    
    // 윈도우 리사이즈 시 핀 위치 재조정
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updatePinPositions();
        }, 100); // 100ms 디바운스
    });

    initMapClickHandler();
    
    // 5초 후 자동 단어 새로고침 시작
    setTimeout(startWordRefresh, 5000);
    
    console.log('모든 초기화가 완료되었습니다');
});

// 오른쪽 사이드바 토글 초기화
function initRightSidebarToggle() {
    const rightSidebarToggle = document.getElementById('rightSidebarToggle');
    const rightSidebar = document.getElementById('rightSidebar');
    
    if (rightSidebarToggle && rightSidebar) {
        rightSidebarToggle.addEventListener('click', () => {
            rightSidebar.classList.toggle('hidden');
            rightSidebarToggle.classList.toggle('floating');
            
            // 버튼 텍스트 변경
            if (rightSidebar.classList.contains('hidden')) {
                rightSidebarToggle.textContent = '◀';
                rightSidebarToggle.setAttribute('aria-label', '학습 정보 열기');
            } else {
                rightSidebarToggle.textContent = '▶';
                rightSidebarToggle.setAttribute('aria-label', '학습 정보 닫기');
            }
        });
    }
}

// 최근 오디오북 초기화
function initRecentAudiobooks() {
    loadRecentAudiobooks();
    setupRecentItemClicks();
}

// localStorage에서 최근 오디오북 불러오기
function loadRecentAudiobooks() {
    // 기본 데모 데이터 (항상 유지되어야 함)
    const defaultDemoData = [
        { category: '부족연맹사회', item: '원삼국시대', title: '부여와 5부족', isDemo: true },
        { category: '선사시대', item: '청동기', title: '청동 거울의 힘', isDemo: true },
        { category: '선사시대', item: '신석기', title: '환웅과 웅녀', isDemo: true }
    ];
    
    const recentItems = JSON.parse(localStorage.getItem('recentAudiobooks') || '[]');
    const recentList = document.getElementById('recentList');
    
    // 데모 데이터가 아닌 실제 데이터만 필터링
    const realRecentItems = recentItems.filter(item => !item.isDemo);
    
    // 실제 최근 데이터 + 데모 데이터 결합 (실제 데이터가 위에)
    const combinedItems = [...realRecentItems, ...defaultDemoData];
    
    // 리스트 업데이트
    recentList.innerHTML = '';
    combinedItems.forEach(item => {
        const recentItem = document.createElement('div');
        recentItem.className = 'recent-item';
        recentItem.dataset.category = item.category;
        recentItem.dataset.item = item.item;
        recentItem.dataset.title = item.title;
        
        // 데모 데이터인 경우 표시
        if (item.isDemo) {
            recentItem.classList.add('demo-item');
        }
        
        recentItem.innerHTML = `
            <div class="recent-category">[${item.category}] - [${item.item}]</div>
            <div class="recent-title">${item.title}</div>
        `;
        
        recentList.appendChild(recentItem);
    });
    
    setupRecentItemClicks();
}

// 최근 오디오북 클릭 이벤트 설정
function setupRecentItemClicks() {
    const recentItems = document.querySelectorAll('.recent-item');
    recentItems.forEach(item => {
        item.addEventListener('click', () => {
            const category = item.dataset.category;
            const itemName = item.dataset.item;
            const title = item.dataset.title;
            
            // 주몽 설화만 실제로 이동 가능
            if (category === '고대' && itemName === '고구려' && title === '주몽 설화') {
                const params = new URLSearchParams({
                    category: category,
                    item: itemName,
                    title: title
                });
                window.location.href = `audiobook.html?${params.toString()}`;
            } else {
                // 다른 항목들은 흔들림 효과
                // 원래 transform 상태 저장
                const originalTransform = getComputedStyle(item).transform;
                
                item.style.animation = 'shake-item 0.5s ease-in-out';
                setTimeout(() => {
                    item.style.animation = '';
                    // 원래 transform 상태 복원
                    if (originalTransform && originalTransform !== 'none') {
                        item.style.transform = originalTransform;
                    } else {
                        item.style.transform = '';
                    }
                }, 500);
            }
        });
    });
}

// 최근 오디오북에 새 항목 추가
function addToRecentAudiobooks(category, item, title) {
    const recentItems = JSON.parse(localStorage.getItem('recentAudiobooks') || '[]');
    
    // 데모 데이터가 아닌 실제 데이터만 필터링
    const realRecentItems = recentItems.filter(recent => !recent.isDemo);
    
    // 중복 제거 (실제 데이터에서만)
    const filteredItems = realRecentItems.filter(recent => 
        !(recent.category === category && recent.item === item && recent.title === title)
    );
    
    // 맨 앞에 새 항목 추가 (isDemo: false 명시)
    filteredItems.unshift({ category, item, title, timestamp: Date.now(), isDemo: false });
    
    // 최대 10개까지만 보관 (실제 데이터만)
    const limitedItems = filteredItems.slice(0, 10);
    
    localStorage.setItem('recentAudiobooks', JSON.stringify(limitedItems));
    loadRecentAudiobooks();
}

// 단어장 모듈 관련 기능
let wordList = [];

// 영어-한국어 사전 (주요 단어들)
const wordDictionary = {
    'against': '~에 반대하여',
    'ago': '전에',
    'alone': '혼자',
    'also': '또한',
    'angry': '화난',
    'animals': '동물들',
    'archer': '궁수',
    'arrows': '화살',
    'asked': '물었다',
    'away': '멀리',
    'baby': '아기',
    'back': '뒤로',
    'bad': '나쁜',
    'battle': '전투',
    'beautiful': '아름다운',
    'became': '되었다',
    'because': '왜냐하면',
    'big': '큰',
    'birth': '출생',
    'body': '몸',
    'bow': '활',
    'boy': '소년',
    'break': '부수다',
    'bridge': '다리',
    'broke': '부러뜨렸다',
    'build': '건설하다',
    'called': '불렀다',
    'came': '왔다',
    'cannot': '할 수 없다',
    'capital': '수도',
    'caught': '잡았다',
    'chasing': '쫓는',
    'city': '도시',
    'country': '나라',
    'cross': '건너다',
    'daughter': '딸',
    'day': '날',
    'did': '했다',
    'down': '아래로',
    'egg': '알',
    'every': '모든',
    'far': '멀리',
    'fish': '물고기',
    'fisherman': '어부',
    'fly': '날다',
    'found': '발견했다',
    'friends': '친구들',
    'funeral': '장례식',
    'gave': '주었다',
    'go': '가다',
    'good': '좋은',
    'great': '위대한',
    'grew': '자랐다',
    'hearing': '듣기',
    'held': '잡았다',
    'help': '도움',
    'him': '그를',
    'honor': '명예',
    'horse': '말',
    'human': '인간',
    'jealous': '질투하는',
    'kept': '지켰다',
    'king': '왕',
    'kingdom': '왕국',
    'land': '땅',
    'leader': '지도자',
    'leave': '떠나다',
    'left': '왼쪽',
    'let': '허락하다',
    'live': '살다',
    'local': '지역의',
    'long': '긴',
    'looked': '보았다',
    'luck': '운',
    'made': '만들었다',
    'make': '만들다',
    'man': '남자',
    'many': '많은',
    'marry': '결혼하다',
    'me': '나를',
    'means': '의미하다',
    'missed': '놓쳤다',
    'month': '달',
    'morning': '아침',
    'mother': '어머니',
    'my': '나의',
    'name': '이름',
    'nearby': '근처의',
    'never': '결코',
    'new': '새로운',
    'next': '다음',
    'old': '오래된',
    'oldest': '가장 오래된',
    'one': '하나',
    'out': '밖으로',
    'own': '자신의',
    'palace': '궁전',
    'part': '부분',
    'people': '사람들',
    'place': '장소',
    'plan': '계획',
    'play': '놀다',
    'please': '제발',
    'prayed': '기도했다',
    'pregnant': '임신한',
    'protected': '보호했다',
    'ran': '달렸다',
    'reached': '도달했다',
    'ruled': '통치했다',
    'safely': '안전하게',
    'said': '말했다',
    'saw': '보았다',
    'seeds': '씨앗들',
    'sent': '보냈다',
    'seven': '일곱',
    'shocked': '충격받은',
    'shot': '쏘았다',
    'shrine': '신사',
    'side': '옆',
    'sleep': '잠',
    'small': '작은',
    'smart': '똑똑한',
    'soldiers': '병사들',
    'some': '몇몇',
    'sometimes': '때때로',
    'son': '아들',
    'soon': '곧',
    'south': '남쪽',
    'special': '특별한',
    'story': '이야기',
    'strong': '강한',
    'sunlight': '햇빛',
    'them': '그들을',
    'then': '그때',
    'there': '거기',
    'three': '셋',
    'throw': '던지다',
    'time': '시간',
    'told': '말했다',
    'took': '가져갔다',
    'touched': '만졌다',
    'turtles': '거북이들',
    'want': '원하다',
    'wanted': '원했다',
    'warm': '따뜻한',
    'well': '잘',
    'went': '갔다',
    'were': '였다',
    'when': '언제',
    'which': '어떤',
    'whip': '채찍',
    'wife': '아내',
    'year': '연도',
    'yes': '네',
    'you': '당신'
};

// CSV에서 단어 목록 로드
async function loadWordList() {
    try {
        const response = await fetch('source/nounlist.csv');
        const csvText = await response.text();
        
        // CSV 파싱
        const lines = csvText.split('\n');
        wordList = lines
            .map(line => line.trim().toLowerCase())
            .filter(word => word && word.length > 1 && word.length <= 8 && !word.includes(' '));
        
        console.log('✅ 단어 목록 로드 완료:', wordList.length, '개 단어');
        
        // 단어장 모듈 초기화
        initWordModule();
    } catch (error) {
        console.error('❌ 단어 목록 로드 실패:', error);
        // 기본 단어 목록 사용
        wordList = ['apple', 'banana', 'cherry', 'dog', 'elephant', 'fire', 'green', 'house', 'ice', 'jump', 'key', 'lion', 'moon', 'nose', 'ocean', 'paper', 'queen', 'river', 'star', 'tree'];
        initWordModule();
    }
}

// 랜덤 단어 3개 선택
function getRandomWords(count = 3) {
    if (wordList.length === 0) return [];
    
    const shuffled = [...wordList].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// 단어장 모듈 초기화
function initWordModule() {
    // 기존 word-item 요소들 찾기
    const wordItems = document.querySelectorAll('.word-item');
    if (wordItems.length === 0) return;
    
    // 랜덤 단어 3개로 업데이트
    const randomWords = getRandomWords(3);
    wordItems.forEach((item, index) => {
        if (randomWords[index]) {
            const word = randomWords[index];
            const korean = wordDictionary[word] || '뜻 없음';
            item.innerHTML = `
                <span class="word-english">${word}</span>
                <span class="word-korean">${korean}</span>
            `;
        }
    });
    
    // 자동 새로고침 시작
    startWordRefresh();
}

// 단어 새로고침 (5초마다 자동 업데이트)
function refreshWords() {
    if (wordList.length === 0) return;
    
    const wordItems = document.querySelectorAll('.word-item');
    const randomWords = getRandomWords(3);
    
    wordItems.forEach((item, index) => {
        if (randomWords[index]) {
            const word = randomWords[index];
            const korean = wordDictionary[word] || '뜻 없음';
            
            // 페이드 아웃 효과
            item.style.opacity = '0';
            setTimeout(() => {
                item.innerHTML = `
                    <span class="word-english">${word}</span>
                    <span class="word-korean">${korean}</span>
                `;
                item.style.opacity = '1';
            }, 200);
        }
    });
}

// 자동 단어 새로고침 시작
function startWordRefresh() {
    setInterval(refreshWords, 5000); // 5초마다 새로고침
} 