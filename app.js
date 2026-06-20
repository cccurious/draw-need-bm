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
                    <button class="stepper-btn" data-idx="${i}" data-type="curr" data-val="-1">-</button>
                    <input type="number" value="${state.current}" readonly>
                    <button class="stepper-btn" data-idx="${i}" data-type="curr" data-val="1">+</button>
                </div>
            `;
            currContainer.appendChild(currItem);

            // Target Item
            const targetItem = document.createElement('div');
            targetItem.className = 'card-item';
            targetItem.innerHTML = `
                <img src="${colorSrc}" alt="Card">
                <div class="stepper">
                    <button class="stepper-btn" data-idx="${i}" data-type="target" data-val="-1">-</button>
                    <input type="number" value="${state.target}" readonly>
                    <button class="stepper-btn" data-idx="${i}" data-type="target" data-val="1">+</button>
                </div>
            `;
            targetContainer.appendChild(targetItem);
        });

        // Attach events
        document.querySelectorAll('.stepper-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.idx);
                const type = e.target.dataset.type;
                const val = parseInt(e.target.dataset.val);
                
                if (type === 'curr') {
                    cardState[idx].current = Math.max(0, cardState[idx].current + val);
                } else {
                    cardState[idx].target = Math.max(0, cardState[idx].target + val);
                }
                renderCards();
            });
        });
    }

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

    // Modal
    const formulaBtn = document.getElementById('formula-menu-btn');
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

    // Slider
    const probSlider = document.getElementById('probability-slider');
    const probVal = document.getElementById('prob-val');
    probSlider.addEventListener('input', (e) => {
        probVal.textContent = e.target.value;
    });

    // Calculation Logic
    const calcBtn = document.getElementById('calculate-btn');
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
        const probPercent = parseInt(probSlider.value);
        const initialTickets = parseInt(document.getElementById('current-tickets').value) || 0;
        const multiplier = parseFloat(document.getElementById('target-card-multiplier').value);
        const otherCards = parseFloat(document.getElementById('other-card-count').value);
        const urRate = parseFloat(document.getElementById('total-ur-rate').value) / 100;

        const pSpecific = (1 * multiplier) / ((numCards * multiplier) + otherCards) * urRate;

        let needs = cardState.map(s => Math.max(0, s.target - s.current));
        let totalNeeds = needs.reduce((a, b) => a + b, 0);

        if (totalNeeds === 0) {
            showResult(0, 0, probPercent);
            return;
        }

        const pulls = simulatePulls(pSpecific, numCards, needs, initialTickets, probPercent);
        
        let batches = Math.floor(pulls / 60);
        let singles = pulls % 60;
        let singlesCost = singles * 100;
        if (singlesCost >= 5000) { singlesCost = 5000; }
        const totalBM = batches * 5000 + singlesCost;

        showResult(totalBM, pulls, probPercent);
    });

    function simulatePulls(P_target, typesCount, needs, initialTickets, probPercent) {
        // Reduced to 2000 runs thanks to fixed seed, making it lightning fast
        const runs = 2000; 
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

    function showResult(bm, pulls, probPercent) {
        document.getElementById('result-title').innerHTML = `<span style="color:#f97316; font-size:1.8rem; font-weight:bold;">${bm.toLocaleString()} BM</span><br>あれば${probPercent}%の確率で揃います`;
        document.getElementById('result-pulls').textContent = pulls.toLocaleString();
        
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
