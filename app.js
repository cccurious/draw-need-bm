document.addEventListener('DOMContentLoaded', () => {
    // We add a 5th color (Red again)
    const cardColors = [
        'assets/card_red.png', 
        'assets/card_blue.png', 
        'assets/card_green.png', 
        'assets/card_gray.png',
        'assets/card_red.png' // 5th card
    ];
    
    const currContainer = document.getElementById('current-cards-container');
    const targetContainer = document.getElementById('target-cards-container');
    
    // Config state
    let numCards = 3;
    let cardState = []; // [{current: 0, target: 20}, ...]

    function initCardState(count) {
        cardState = [];
        for(let i=0; i<count; i++) {
            cardState.push({ current: 0, target: 20 });
        }
        renderCards();
    }

    function renderCards() {
        currContainer.innerHTML = '';
        targetContainer.innerHTML = '';

        cardState.forEach((state, i) => {
            const colorSrc = cardColors[i % cardColors.length];
            
            // Current Item
            const currItem = document.createElement('div');
            currItem.className = 'card-item';
            currItem.innerHTML = `
                <img src="${colorSrc}" alt="Card">
                <div class="stepper">
                    <button class="stepper-btn" data-idx="${i}" data-type="curr" data-val="-1" ${state.current <= 0 ? 'disabled' : ''}>-</button>
                    <div class="stepper-value">${state.current}</div>
                    <button class="stepper-btn" data-idx="${i}" data-type="curr" data-val="1" ${state.current >= 20 ? 'disabled' : ''}>+</button>
                </div>
            `;
            currContainer.appendChild(currItem);

            // Target Item
            const targetItem = document.createElement('div');
            targetItem.className = 'card-item';
            targetItem.innerHTML = `
                <img src="${colorSrc}" alt="Card">
                <div class="stepper">
                    <button class="stepper-btn" data-idx="${i}" data-type="target" data-val="-1" ${state.target <= 0 ? 'disabled' : ''}>-</button>
                    <div class="stepper-value">${state.target}</div>
                    <button class="stepper-btn" data-idx="${i}" data-type="target" data-val="1" ${state.target >= 20 ? 'disabled' : ''}>+</button>
                </div>
            `;
            targetContainer.appendChild(targetItem);
        });

        // Attach events
        document.querySelectorAll('.stepper-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.dataset.idx);
                const type = btn.dataset.type;
                const val = parseInt(btn.dataset.val);
                
                if (type === 'curr') {
                    cardState[idx].current = Math.max(0, Math.min(20, cardState[idx].current + val));
                } else {
                    cardState[idx].target = Math.max(0, Math.min(20, cardState[idx].target + val));
                }
                renderCards();
            });
        });
    }

    // Bulk Actions
    document.querySelectorAll('.bulk-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetType = e.target.closest('.bulk-actions').dataset.target;
            const val = parseInt(e.target.dataset.val);
            
            cardState.forEach(state => {
                if (targetType === 'current') {
                    state.current = val;
                } else {
                    state.target = val;
                }
            });
            renderCards();
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

        let needs = cardState.map(s => Math.max(0, s.target - s.current));
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
        
        // Fixed seed so the random sequence is EXACTLY the same for every click
        const prng = mulberry32(1234567);
        
        for(let i = 0; i < runs; i++) {
            let pulls = 0;
            let tickets = initialTickets;
            let currentNeeds = [...needs];
            
            while(true) {
                let totalDeficit = currentNeeds.reduce((a, b) => a + b, 0);
                let availableExchanges = Math.floor(tickets / 10);
                
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

        if (!supportBanner.classList.contains('show')) {
            supportBanner.classList.add('show');
        }
    }

    // Copy banner
    const copyBtn = document.getElementById('copy-btn');
    const toast = document.getElementById('toast');
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText('C-VtNQ').then(() => {
            toast.classList.remove('hidden');
            setTimeout(() => toast.classList.add('show'), 10);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.classList.add('hidden'), 300);
            }, 2000);
            supportBanner.classList.remove('show');
        });
    });
});
