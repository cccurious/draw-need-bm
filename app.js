document.addEventListener('DOMContentLoaded', () => {
    const cardColors = ['assets/card_red.png', 'assets/card_blue.png', 'assets/card_green.png', 'assets/card_gray.png'];
    
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
            
            // Current Row
            const currRow = document.createElement('div');
            currRow.className = 'card-row';
            currRow.innerHTML = `
                <img src="${colorSrc}" alt="Card">
                <div class="stepper">
                    <button class="stepper-btn" data-idx="${i}" data-type="curr" data-val="-1">-</button>
                    <input type="number" value="${state.current}" readonly>
                    <button class="stepper-btn" data-idx="${i}" data-type="curr" data-val="1">+</button>
                </div>
            `;
            currContainer.appendChild(currRow);

            // Target Row
            const targetRow = document.createElement('div');
            targetRow.className = 'card-row';
            targetRow.innerHTML = `
                <img src="${colorSrc}" alt="Card">
                <div class="stepper">
                    <button class="stepper-btn" data-idx="${i}" data-type="target" data-val="-1">-</button>
                    <input type="number" value="${state.target}" readonly>
                    <button class="stepper-btn" data-idx="${i}" data-type="target" data-val="1">+</button>
                </div>
            `;
            targetContainer.appendChild(targetRow);
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

    calcBtn.addEventListener('click', () => {
        const probPercent = parseInt(probSlider.value);
        const initialTickets = parseInt(document.getElementById('current-tickets').value) || 0;
        const multiplier = parseFloat(document.getElementById('target-card-multiplier').value);
        const otherCards = parseFloat(document.getElementById('other-card-count').value);
        const urRate = parseFloat(document.getElementById('total-ur-rate').value) / 100;

        // P(Specific Target Card) = (1 * multiplier) / (numCards * multiplier + otherCards) * urRate
        const pSpecific = (1 * multiplier) / ((numCards * multiplier) + otherCards) * urRate;

        // Gather needed copies
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
        const runs = 10000;
        let results = new Int32Array(runs);
        
        for(let i = 0; i < runs; i++) {
            let pulls = 0;
            let tickets = initialTickets;
            let currentNeeds = [...needs];
            
            while(true) {
                // Check if we reached goal using available tickets
                let totalDeficit = currentNeeds.reduce((a, b) => a + b, 0);
                let availableExchanges = Math.floor(tickets / 10);
                
                if (totalDeficit <= availableExchanges) {
                    break; // Completed!
                }
                
                pulls++;
                
                // Which card did we pull?
                if (Math.random() < (P_target * typesCount)) {
                    let typeIdx = Math.floor(Math.random() * typesCount);
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
