document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const menuBtn = document.getElementById('menu-btn');
    const sideMenu = document.getElementById('side-menu');
    const menuOverlay = document.getElementById('menu-overlay');
    
    const currMinus = document.getElementById('curr-minus');
    const currPlus = document.getElementById('curr-plus');
    const currInput = document.getElementById('current-cards');
    
    const targetMinus = document.getElementById('target-minus');
    const targetPlus = document.getElementById('target-plus');
    const targetInput = document.getElementById('target-cards');
    
    const cardDisplay = document.getElementById('card-display');
    const targetCardCountInput = document.getElementById('target-card-count');
    const cardColors = ['assets/card_red.png', 'assets/card_blue.png', 'assets/card_green.png', 'assets/card_gray.png'];

    const probSlider = document.getElementById('probability-slider');
    const probVal = document.getElementById('prob-val');

    const calcBtn = document.getElementById('calculate-btn');
    const resultSec = document.getElementById('result-section');
    const resultTitle = document.getElementById('result-title');
    const resultBm = document.getElementById('result-bm');
    const resultPulls = document.getElementById('result-pulls');

    const supportBanner = document.getElementById('support-banner');
    const copyBtn = document.getElementById('copy-btn');
    const toast = document.getElementById('toast');

    // Menu Toggle
    function toggleMenu() {
        menuBtn.classList.toggle('open');
        sideMenu.classList.toggle('open');
        menuOverlay.classList.toggle('open');
    }
    menuBtn.addEventListener('click', toggleMenu);
    menuOverlay.addEventListener('click', toggleMenu);

    // Steppers
    function updateStepper(input, change, min) {
        let val = parseInt(input.value) + change;
        if(val >= min) {
            input.value = val;
        }
    }
    currMinus.addEventListener('click', () => updateStepper(currInput, -1, 0));
    currPlus.addEventListener('click', () => updateStepper(currInput, 1, 0));
    targetMinus.addEventListener('click', () => updateStepper(targetInput, -1, 1));
    targetPlus.addEventListener('click', () => updateStepper(targetInput, 1, 1));

    // Card Display Update
    function updateCards() {
        let count = parseInt(targetCardCountInput.value) || 2;
        if (count < 1) count = 1;
        if (count > 4) count = 4; // Max 4 colors available natively
        cardDisplay.innerHTML = '';
        for(let i=0; i<count; i++) {
            let img = document.createElement('img');
            img.src = cardColors[i % cardColors.length];
            img.className = 'card-img';
            cardDisplay.appendChild(img);
        }
    }
    targetCardCountInput.addEventListener('change', updateCards);
    updateCards();

    // Slider
    probSlider.addEventListener('input', (e) => {
        probVal.textContent = e.target.value;
    });

    // Template buttons
    document.querySelectorAll('.tmpl-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = parseInt(e.target.dataset.type);
            targetCardCountInput.value = type;
            updateCards();
        });
    });

    // Copy & Banner
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

    // Calculation Logic
    calcBtn.addEventListener('click', () => {
        const curr = parseInt(currInput.value);
        const target = parseInt(targetInput.value);
        const probPercent = parseInt(probSlider.value);
        
        const numTargets = parseInt(targetCardCountInput.value);
        const multiplier = parseFloat(document.getElementById('target-card-multiplier').value);
        const otherCards = parseFloat(document.getElementById('other-card-count').value);
        const urRate = parseFloat(document.getElementById('total-ur-rate').value) / 100;

        const neededCopies = target - curr;
        
        if (neededCopies <= 0) {
            showResult(0, 0, probPercent);
            showBanner();
            return;
        }

        // Probability of pulling ONE SPECIFIC target card
        // P = (1 * multiplier) / (numTargets * multiplier + otherCards) * urRate
        const pSpecific = (1 * multiplier) / ((numTargets * multiplier) + otherCards) * urRate;

        // Monte Carlo Simulation
        const pulls = simulatePulls(pSpecific, neededCopies, probPercent);
        
        // Convert pulls to BM (Assuming 60 pulls = 5000 BM, 1 pull = 100 BM)
        let batches = Math.floor(pulls / 60);
        let singles = pulls % 60;
        let singlesCost = singles * 100;
        if (singlesCost >= 5000) { singlesCost = 5000; } // Sometimes cheaper to buy a batch
        const totalBM = batches * 5000 + singlesCost;

        showResult(totalBM, pulls, probPercent);
        showBanner();
    });

    function simulatePulls(P_target, neededCopies, probPercent) {
        const runs = 10000;
        let results = new Int32Array(runs);
        
        for(let i=0; i<runs; i++) {
            let pulls = 0, copies = 0, tickets = 0;
            while(copies < neededCopies) {
                pulls++;
                if (Math.random() < P_target) { copies++; }
                // Ticket logic: 1 ticket per 40 pulls
                if (pulls % 40 === 0) tickets++;
                if (tickets === 10) {
                    copies++;
                    tickets = 0;
                }
            }
            results[i] = pulls;
        }
        
        results.sort();
        let idx = Math.floor(runs * (probPercent / 100));
        if (idx >= runs) idx = runs - 1;
        return results[idx];
    }

    function showResult(bm, pulls, probPercent) {
        resultTitle.textContent = `${probPercent}% の確率で揃うには`;
        resultBm.textContent = bm.toLocaleString();
        resultPulls.textContent = pulls.toLocaleString();
        
        resultSec.classList.remove('hidden');
        setTimeout(() => resultSec.classList.add('show'), 10);
        
        // Scroll to result
        setTimeout(() => {
            resultSec.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
    }

    function showBanner() {
        if (!supportBanner.classList.contains('show')) {
            supportBanner.classList.add('show');
        }
    }
});
