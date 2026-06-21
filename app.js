document.addEventListener('DOMContentLoaded', () => {
    // We add a 5th color (Red again)
    const cardColors = [
        'assets/card_red.png', 
        'assets/card_blue.png', 
        'assets/card_green.png', 
        'assets/card_gray.png'
    ];
    
    // Config state
    let numCards = 3;
    let stateBm = []; // [{current: 0, target: 20, colorIdx: 0}, ...]
    let stateLuck = []; // [{current: 0, colorIdx: 0}, ...]

    function initCardState(count) {
        stateBm = [];
        stateLuck = [];
        for(let i=0; i<count; i++) {
            stateBm.push({ current: 0, target: 20, colorIdx: i % 4 });
            stateLuck.push({ current: 0, colorIdx: i % 4 });
        }
        renderAllGrids();
    }

    function renderGrid(containerId, stateArray, type) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        stateArray.forEach((state, i) => {
            const colorSrc = cardColors[state.colorIdx];
            const item = document.createElement('div');
            item.className = 'card-item';
            
            let val = type === 'target' ? state.target : state.current;
            
            item.innerHTML = `
                <img src="${colorSrc}" alt="Card" class="card-img" data-idx="${i}" data-view="${containerId}">
                <div class="stepper">
                    <button class="stepper-btn" data-idx="${i}" data-type="${type}" data-view="${containerId}" data-val="-1" ${val <= 0 ? 'disabled' : ''}>-</button>
                    <div class="stepper-value">${val}</div>
                    <button class="stepper-btn" data-idx="${i}" data-type="${type}" data-view="${containerId}" data-val="1" ${val >= 20 ? 'disabled' : ''}>+</button>
                </div>
            `;
            container.appendChild(item);
        });
    }

    function renderAllGrids() {
        renderGrid('current-cards-bm', stateBm, 'current');
        renderGrid('target-cards-bm', stateBm, 'target');
        renderGrid('current-cards-luck', stateLuck, 'current');
    }

    // Global Event Delegation for Cards
    document.addEventListener('click', (e) => {
        // Stepper buttons
        if (e.target.classList.contains('stepper-btn')) {
            const idx = parseInt(e.target.dataset.idx);
            const type = e.target.dataset.type; // 'current' or 'target'
            const viewId = e.target.dataset.view; // 'current-cards-bm' etc.
            const val = parseInt(e.target.dataset.val);
            
            let targetState = viewId === 'current-cards-luck' ? stateLuck[idx] : stateBm[idx];

            if (type === 'current') {
                targetState.current = Math.max(0, Math.min(20, targetState.current + val));
            } else {
                targetState.target = Math.max(0, Math.min(20, targetState.target + val));
            }
            renderAllGrids();
        }

        // Card Image Color Picker
        if (e.target.classList.contains('card-img')) {
            const idx = parseInt(e.target.dataset.idx);
            const viewId = e.target.dataset.view;
            openColorPicker(idx, viewId);
        }
    });

    // Bulk Actions
    document.querySelectorAll('.bulk-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetType = e.target.closest('.bulk-actions').dataset.target; // 'bm-current', 'bm-target', 'luck-current'
            const val = parseInt(e.target.dataset.val);
            
            if (targetType === 'bm-current') {
                stateBm.forEach(s => s.current = val);
            } else if (targetType === 'bm-target') {
                stateBm.forEach(s => s.target = val);
            } else if (targetType === 'luck-current') {
                stateLuck.forEach(s => s.current = val);
            }
            renderAllGrids();
        });
    });

    // Initialize with 3 cards
    initCardState(numCards);

    // Template buttons
    document.querySelectorAll('.tmpl-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tmpl-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const type = parseInt(e.target.dataset.type);
            numCards = type;
            initCardState(numCards);

            // Update multipliers based on selection
            const multiplierInput = document.getElementById('target-card-multiplier');
            const otherCardInput = document.getElementById('other-card-count');
            
            otherCardInput.value = 83; // 常に一律83枚
            
            switch(type) {
                case 2: multiplierInput.value = 28; break;
                case 3: multiplierInput.value = 24; break;
                case 4: multiplierInput.value = 21; break;
                case 5: multiplierInput.value = 21; break;
            }
        });
    });

    // Menu logic
    const menuBtn = document.getElementById('menu-btn');
    const sideMenu = document.getElementById('side-menu');
    const menuOverlay = document.getElementById('menu-overlay');

    function toggleMenu() {
        menuBtn.classList.toggle('open');
        sideMenu.classList.toggle('open');
        menuOverlay.classList.toggle('open');
    }
    menuBtn.addEventListener('click', toggleMenu);
    menuOverlay.addEventListener('click', toggleMenu);

    // Routing Logic
    const menuLinks = document.querySelectorAll('.menu-link');
    const views = document.querySelectorAll('.view-section');
    const headerTitle = document.getElementById('header-title');

    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = e.target.dataset.view;
            if (!viewId) return;

            // Update active link
            menuLinks.forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');

            // Update views
            views.forEach(v => {
                v.classList.remove('active');
                v.classList.add('hidden');
            });
            const targetId = viewId === 'bm' ? 'view-bm-calc' : 'view-luck-checker';
            const targetView = document.getElementById(targetId);
            if (targetView) {
                targetView.classList.remove('hidden');
                targetView.classList.add('active');
                
                // Move settings section to be just above the primary button in the active view
                const settingsSec = document.querySelector('.settings-section');
                const primaryBtn = targetView.querySelector('.primary-btn');
                if (settingsSec && primaryBtn) {
                    targetView.insertBefore(settingsSec, primaryBtn);
                }
            }
            
            // Hide support banner when switching views
            const supportBanner = document.getElementById('support-banner');
            if (supportBanner) {
                supportBanner.classList.remove('show');
            }

            // Update Header
            if (viewId === 'bm') {
                headerTitle.innerText = '必要BM予測ツール';
            } else {
                headerTitle.innerText = 'ガチャ運 偏差値判定ツール';
            }

            toggleMenu(); // close side menu
        });
    });

    // Accordion Logic
    const advancedToggle = document.getElementById('advanced-settings-toggle');
    const advancedContent = document.getElementById('advanced-settings-content');
    advancedToggle.addEventListener('click', () => {
        advancedToggle.classList.toggle('open');
        advancedContent.classList.toggle('open');
    });

    // Modal
    const formulaBtn = document.getElementById('menu-about');
    const formulaModal = document.getElementById('formula-modal');
    const closeModal = document.getElementById('close-modal-btn');

    formulaBtn.addEventListener('click', (e) => {
        e.preventDefault();
        formulaModal.classList.add('show');
        toggleMenu(); // close side menu
    });
    closeModal.addEventListener('click', () => {
        formulaModal.classList.remove('show');
    });
    formulaModal.addEventListener('click', (e) => {
        if (e.target === formulaModal) {
            formulaModal.classList.remove('show');
        }
    });

    // Color Modal Logic
    let pickingIdx = -1;
    let pickingView = null;
    const colorModal = document.getElementById('color-modal');
    
    function openColorPicker(idx, viewId) {
        pickingIdx = idx;
        pickingView = viewId;
        const currentState = viewId === 'current-cards-luck' ? stateLuck[idx] : stateBm[idx];
        const currentColor = currentState.colorIdx;
        
        document.querySelectorAll('.color-option').forEach(opt => {
            if (parseInt(opt.dataset.color) === currentColor) {
                opt.classList.add('selected');
            } else {
                opt.classList.remove('selected');
            }
        });
        colorModal.classList.add('show');
    }

    document.querySelectorAll('.color-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
            if (pickingIdx >= 0 && pickingView) {
                const colorIdx = parseInt(e.target.dataset.color);
                if (pickingView === 'current-cards-luck') {
                    stateLuck[pickingIdx].colorIdx = colorIdx;
                } else {
                    stateBm[pickingIdx].colorIdx = colorIdx;
                }
                renderAllGrids();
                colorModal.classList.remove('show');
            }
        });
    });

    document.getElementById('close-color-modal').addEventListener('click', () => {
        colorModal.classList.remove('show');
    });
    
    colorModal.addEventListener('click', (e) => {
        if (e.target === colorModal) {
            colorModal.classList.remove('show');
        }
    });

    // Calculation Logic
    const calcBtn = document.getElementById('calc-btn');
    const resultSec = document.getElementById('result-section');
    const supportBanner = document.getElementById('support-banner');

    // Seeded Random Generator (Mulberry32)
    function mulberry32(a) {
        return function() {
          var t = a += 0x6D2B79F5;
          t = Math.imul(t ^ t >>> 15, t | 1);
          t ^= t + Math.imul(t ^ t >>> 7, t | 61);
          return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
    }

    calcBtn.addEventListener('click', () => {
        const probPercent = 50; // Central value logic
        const initialTickets = parseInt(document.getElementById('current-tickets').value) || 0;
        const multiplier = parseFloat(document.getElementById('target-card-multiplier').value);
        const otherCards = parseFloat(document.getElementById('other-card-count').value);
        const urRate = parseFloat(document.getElementById('total-ur-rate').value) / 100;

        const pSpecific = (1 * multiplier) / ((numCards * multiplier) + otherCards) * urRate;

        let needs = stateBm.map(s => Math.max(0, s.target - s.current));
        let totalNeeds = needs.reduce((a, b) => a + b, 0);

        if (totalNeeds === 0) {
            showResult(0, 0, 0);
            return;
        }

        // Show loading state
        const originalText = calcBtn.innerHTML;
        calcBtn.disabled = true;
        calcBtn.innerHTML = '<span class="spinner"></span>計算中...';
        calcBtn.style.opacity = '0.8';
        calcBtn.style.cursor = 'not-allowed';

        // Yield to browser rendering before heavy calculation
        setTimeout(() => {
            const pulls = simulatePulls(pSpecific, numCards, needs, initialTickets, probPercent);
            const earnedTickets = Math.floor(pulls / 40);
            
            let batches = Math.floor(pulls / 60);
            let singles = pulls % 60;
            let singlesCost = singles * 100;
            if (singlesCost >= 5000) { singlesCost = 5000; }
            const totalBM = batches * 5000 + singlesCost;

            showResult(totalBM, pulls, earnedTickets);

            // Restore button
            calcBtn.disabled = false;
            calcBtn.innerHTML = originalText;
            calcBtn.style.opacity = '1';
            calcBtn.style.cursor = 'pointer';
        }, 50);
    });

    function simulatePulls(P_target, typesCount, needs, initialTickets, probPercent) {
        const runs = 5000; 
        let results = new Int32Array(runs);
        
        // Dynamic seed so results fluctuate per calculation
        const seed = Math.floor(Math.random() * 0xFFFFFFFF);
        const prng = mulberry32(seed);
        
        for(let i = 0; i < runs; i++) {
            let pulls = 0;
            let tickets = initialTickets;
            let currentNeeds = [...needs];
            
            while(true) {
                let totalDeficit = currentNeeds.reduce((a, b) => a + b, 0);
                let availableExchanges = Math.floor(tickets / 20);
                
                if (totalDeficit <= availableExchanges) {
                    break;
                }
                
                pulls++;
                
                if (prng() < (P_target * typesCount)) {
                    let typeIdx = Math.floor(prng() * typesCount);
                    if (currentNeeds[typeIdx] > 0) {
                        currentNeeds[typeIdx]--;
                    }
                }
                
                if (pulls % 40 === 0) tickets++;
            }
            results[i] = pulls;
        }
        
        results.sort();
        let idx = Math.floor(runs * (probPercent / 100));
        if (idx >= runs) idx = runs - 1;
        return results[idx];
    }

    function showResult(bm, pulls, earnedTickets) {
        document.getElementById('result-bm').innerText = `${bm.toLocaleString()} BM`;
        document.getElementById('result-pulls').innerText = `合計 ${pulls.toLocaleString()}連`;
        
        resultSec.classList.remove('hidden');
        setTimeout(() => resultSec.classList.add('show'), 10);
        setTimeout(() => { resultSec.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 100);

        triggerSupportBanner();
    }

    const resetBmBtn = document.getElementById('reset-bm-btn');
    if (resetBmBtn) {
        resetBmBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo(0, 0);
            resultSec.classList.remove('show');
            setTimeout(() => resultSec.classList.add('hidden'), 300);
        });
    }

    // Luck Checker Logic
    const luckCalcBtn = document.getElementById('luck-calc-btn');
    const luckResultSec = document.getElementById('luck-result-section');
    const luckScoreEl = document.getElementById('luck-result-score');
    const luckTextEl = document.getElementById('luck-result-text');

    if (luckCalcBtn) {
        luckCalcBtn.addEventListener('click', () => {
            const pulls = parseInt(document.getElementById('luck-pulls-input').value) || 0;
            
            if (pulls <= 0) {
                luckScoreEl.innerText = '--.-';
                luckTextEl.innerText = '回数を入力してください';
                luckTextEl.style.color = '#fff';
                luckResultSec.classList.remove('hidden');
                return;
            }

            const multiplier = parseFloat(document.getElementById('target-card-multiplier').value);
            const otherCards = parseFloat(document.getElementById('other-card-count').value);
            const urRate = parseFloat(document.getElementById('total-ur-rate').value) / 100;

            const pSpecific = (1 * multiplier) / ((numCards * multiplier) + otherCards) * urRate;
            const P_any_target = pSpecific * numCards;

            const currentTickets = parseInt(document.getElementById('current-tickets').value) || 0;

            // B案: 獲得チケット枚数を計算し、手持ちチケット分を差し引いて消費済みチケットを割り出す
            // 40回で1チケット
            const earnedTickets = Math.floor(pulls / 40);
            
            // 獲得したはずのチケットより現在所持チケットが少ない場合、その差分を消費したとみなす
            const spentTickets = Math.max(0, earnedTickets - currentTickets);

            // 20チケット消費で1枚のカードと交換したとみなして純粋な引きを算出する
            const exchangedCards = Math.floor(spentTickets / 20);
            
            let totalCurrent = stateLuck.reduce((sum, state) => sum + state.current, 0);
            let pureGachaHits = Math.max(0, totalCurrent - exchangedCards);

            const expected = pulls * P_any_target;
            const variance = pulls * P_any_target * (1 - P_any_target);
            const sd = Math.sqrt(variance);

            let zScore = 0;
            if (sd > 0) {
                zScore = (pureGachaHits - expected) / sd;
            }

            let hensachi = 50 + (zScore * 10);
            // Limit display range slightly to avoid wild numbers on extreme edges
            hensachi = Math.max(10, Math.min(100, hensachi));

            luckScoreEl.innerText = hensachi.toFixed(1);

            if (hensachi >= 70) {
                luckTextEl.innerText = '神引き！超絶上振れ！';
                luckTextEl.style.color = '#f56565';
                luckResultSec.style.borderColor = '#f56565';
                luckScoreEl.style.color = '#f56565';
            } else if (hensachi >= 60) {
                luckTextEl.innerText = '上振れ！運がいいですね！';
                luckTextEl.style.color = '#ed8936';
                luckResultSec.style.borderColor = '#ed8936';
                luckScoreEl.style.color = '#ed8936';
            } else if (hensachi >= 45) {
                luckTextEl.innerText = '普通（確率通り）です';
                luckTextEl.style.color = '#48bb78';
                luckResultSec.style.borderColor = '#48bb78';
                luckScoreEl.style.color = '#48bb78';
            } else if (hensachi >= 35) {
                luckTextEl.innerText = '下振れ...少し運が悪いかも';
                luckTextEl.style.color = '#4299e1';
                luckResultSec.style.borderColor = '#4299e1';
                luckScoreEl.style.color = '#4299e1';
            } else {
                luckTextEl.innerText = '大爆死...元気を出して...';
                luckTextEl.style.color = '#9f7aea';
                luckResultSec.style.borderColor = '#9f7aea';
                luckScoreEl.style.color = '#9f7aea';
            }

            luckResultSec.classList.remove('hidden');
            setTimeout(() => luckResultSec.classList.add('show'), 10);
            setTimeout(() => { luckResultSec.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 100);

            triggerSupportBanner();
        });
    }

    const resetLuckBtn = document.getElementById('reset-luck-btn');
    if (resetLuckBtn) {
        resetLuckBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo(0, 0);
            luckResultSec.classList.remove('show');
            setTimeout(() => luckResultSec.classList.add('hidden'), 300);
        });
    }

    // Support Banner Logic
    const copyBtn = document.getElementById('copy-btn');
    const toast = document.getElementById('toast');

    function triggerSupportBanner() {
        const supportBanner = document.getElementById('support-banner');
        if (supportBanner && !supportBanner.classList.contains('show')) {
            const msg = document.getElementById('banner-msg');
            const code = document.getElementById('banner-code');
            if (msg && code) {
                msg.classList.remove('hide');
                code.classList.remove('show');
            }
            supportBanner.classList.add('show');
            setTimeout(() => {
                if (supportBanner.classList.contains('show') && msg && code) {
                    msg.classList.add('hide');
                    code.classList.add('show');
                }
            }, 2500);
        }
    }

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText('C-VtNQ').then(() => {
            toast.classList.remove('hidden');
            setTimeout(() => toast.classList.add('show'), 10);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.classList.add('hidden'), 300);
            }, 2000);
            const supportBanner = document.getElementById('support-banner');
            if (supportBanner) {
                supportBanner.classList.remove('show');
            }
        });
    });
});
