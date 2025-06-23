// Water Town: Access for All - Modular Game Logic with Zone Types

const ZONE_TYPES = {
    URBAN: 'Urban',
    AGRICULTURAL: 'Agricultural',
    REMOTE: 'Remote'
};

const ZONE_CONFIG = [
    // 1-9, row by row
    { type: ZONE_TYPES.AGRICULTURAL }, // 1
    { type: ZONE_TYPES.REMOTE },       // 2
    { type: ZONE_TYPES.URBAN },        // 3
    { type: ZONE_TYPES.AGRICULTURAL }, // 4
    { type: ZONE_TYPES.AGRICULTURAL }, // 5
    { type: ZONE_TYPES.REMOTE },       // 6
    { type: ZONE_TYPES.REMOTE },       // 7
    { type: ZONE_TYPES.REMOTE },       // 8
    { type: ZONE_TYPES.URBAN }         // 9
};

function randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getPopulation(type) {
    if (type === ZONE_TYPES.URBAN) return randomInRange(5000, 7000);
    if (type === ZONE_TYPES.AGRICULTURAL) return randomInRange(2000, 3000);
    return randomInRange(500, 1200); // Remote
}

function getUpgrades(type) {
    if (type === ZONE_TYPES.URBAN) {
        return [
            { name: 'Build Treatment Plant', cost: 2500, access: 25 },
            { name: 'Lay Pipe Network', cost: 1500, access: 15 },
            { name: 'Awareness Campaign', cost: 500, access: 5 }
        ];
    }
    if (type === ZONE_TYPES.AGRICULTURAL) {
        return [
            { name: 'Build Well', cost: 1000, access: 10 },
            { name: 'Irrigation Efficiency Upgrade', cost: 1500, access: 15 },
            { name: 'Awareness Campaign', cost: 500, access: 5 }
        ];
    }
    // Remote
    return [
        { name: 'Install Water Tanks', cost: 800, access: 8 },
        { name: 'Build Small Well', cost: 1000, access: 10 },
        { name: 'Hygiene Education', cost: 500, access: 4 }
    ];
}

const NUM_REGIONS = 9;
const START_BUDGET = 10000;

let budget = START_BUDGET;
let zones = Array(NUM_REGIONS).fill(null).map((_, i) => {
    const type = ZONE_CONFIG[i].type;
    const population = getPopulation(type);
    const waterNeed = Math.round(population * 1.2);
    return {
        id: i,
        type,
        population,
        waterNeed,
        access: 10, // percent, start at 10%
        upgrades: getUpgrades(type),
        ownedUpgrades: []
    };
});

// --- DOM Elements ---
const waterBar = document.getElementById('water-progress-bar');
const waterPercent = document.getElementById('water-percentage');
const budgetDisplay = document.getElementById('budget');
const modal = document.getElementById('region-modal');
const closeModalBtn = document.getElementById('close-modal');
const regionTitle = document.getElementById('region-title');
const regionAccess = document.getElementById('region-access');
const regionActions = document.querySelector('.region-actions');
const winScreen = document.getElementById('win-screen');
const performanceSummary = document.getElementById('performance-summary');
const restartBtn = document.getElementById('restart-btn');
const confettiCanvas = document.getElementById('confetti-canvas');

let currentRegion = null;

// --- UI Update Functions ---
function updateUI() {
    // Global progress: percent of water users out of total population
    const totalPop = zones.reduce((sum, z) => sum + z.population, 0);
    const totalDelivered = zones.reduce((sum, z) => sum + Math.round(z.waterNeed * (z.access / 100)), 0);
    const percent = Math.round((totalDelivered / totalPop) * 100);
    waterBar.style.width = percent + '%';
    waterPercent.textContent = percent + '%';
    budgetDisplay.textContent = budget;
    // Show actual numbers below the bar
    const usersLabel = document.getElementById('water-users-label');
    if (usersLabel) {
        usersLabel.textContent = `${totalDelivered.toLocaleString()} / ${totalPop.toLocaleString()} people`;
    }
    // Update region overlays
    document.querySelectorAll('.zone-btn').forEach((btn, i) => {
        let access = zones[i].access;
        if (access >= 80) btn.setAttribute('data-access', '2'); // blue
        else if (access >= 30) btn.setAttribute('data-access', '1'); // yellow
        else btn.setAttribute('data-access', '0'); // gray
    });
    document.getElementById('month').textContent = month;
    document.getElementById('income').textContent = lastIncome;
    document.getElementById('maintenance').textContent = lastMaintenance;
}

function openRegionModal(regionIdx) {
    currentRegion = regionIdx;
    const zone = zones[regionIdx];
    document.getElementById('region-title').textContent = `Region ${regionIdx + 1}`;
    document.getElementById('region-type').textContent = zone.type;
    document.getElementById('region-pop').textContent = zone.population;
    document.getElementById('region-need').textContent = zone.waterNeed;
    document.getElementById('region-access').textContent = zone.access + '%';
    document.getElementById('region-delivered').textContent = Math.round(zone.waterNeed * (zone.access / 100));
    // Render upgrade buttons
    const regionActions = document.querySelector('.region-actions');
    regionActions.innerHTML = '';
    zone.upgrades.forEach((upg, idx) => {
        const btn = document.createElement('button');
        btn.innerHTML = `${upg.name}<br><span class="cost">$${upg.cost}</span>`;
        btn.disabled = budget < upg.cost || zone.access >= 100;
        btn.onclick = () => {
            if (budget >= upg.cost && zone.access < 100) {
                budget -= upg.cost;
                zone.access = Math.min(100, zone.access + upg.access);
                // Add upgrade to ownedUpgrades for maintenance
                const upgKey = getUpgradeKey(upg.name);
                if (upgKey && !zone.ownedUpgrades.includes(upgKey)) {
                    zone.ownedUpgrades.push(upgKey);
                }
                updateUI();
                openRegionModal(regionIdx);
                checkWin();
            }
        };
        regionActions.appendChild(btn);
    });
    modal.classList.remove('hidden');
}

function closeRegionModal() {
    modal.classList.add('hidden');
    currentRegion = null;
}

function showWinScreen() {
    winScreen.classList.remove('hidden');
    const totalPop = zones.reduce((sum, z) => sum + z.population, 0);
    performanceSummary.innerHTML = `<p>Final Budget: $${budget}</p><p>Total Population Reached: ${totalPop}</p>`;
    launchConfetti();
}

function hideWinScreen() {
    winScreen.classList.add('hidden');
    stopConfetti();
}

// --- Maintenance cost mapping ---
const maintenanceCosts = {
    well: 50,
    irrigation: 40,
    treatment: 100,
    pipes: 75,
    tanks: 30,
    awareness: 10,
    hygiene: 10
};

// --- Add month, income, and maintenance to UI ---
let day = 15;
let month = 1;
let year = 2025;
let lastIncome = 0;
let lastMaintenance = 0;
let gameLoop = null;
let gameRunning = false;

// Add UI elements for month, income, and maintenance
function ensureGameStatsUI() {
    let statPanel = document.querySelector('.stat-panel');
    if (!document.getElementById('month-row')) {
        const monthRow = document.createElement('div');
        monthRow.id = 'month-row';
        monthRow.style.marginBottom = '8px';
        monthRow.innerHTML = '<b>Month:</b> <span id="month">0</span>';
        statPanel.insertBefore(monthRow, statPanel.children[1]);
    }
    if (!document.getElementById('income-row')) {
        const incomeRow = document.createElement('div');
        incomeRow.id = 'income-row';
        incomeRow.style.marginBottom = '4px';
        incomeRow.innerHTML = '<b>Monthly Income:</b> $<span id="income">0</span>';
        statPanel.appendChild(incomeRow);
    }
    if (!document.getElementById('maintenance-row')) {
        const maintRow = document.createElement('div');
        maintRow.id = 'maintenance-row';
        maintRow.style.marginBottom = '4px';
        maintRow.innerHTML = '<b>Maintenance:</b> $<span id="maintenance">0</span>';
        statPanel.appendChild(maintRow);
    }
}
ensureGameStatsUI();

function totalAccessPercentage() {
    // Returns global water access as a percent (0-100), based on actual users vs total population
    const totalPop = zones.reduce((sum, z) => sum + z.population, 0);
    const totalDelivered = zones.reduce((sum, z) => sum + Math.round(z.waterNeed * (z.access / 100)), 0);
    return Math.round((totalDelivered / totalPop) * 100);
}

function calculateMonthlyIncome() {
    const baseIncome = 2000;
    const bonus = totalAccessPercentage() * 10;
    return Math.floor(baseIncome + bonus);
}

function calculateTotalMaintenance() {
    let total = 0;
    zones.forEach(zone => {
        if (zone.ownedUpgrades) {
            zone.ownedUpgrades.forEach(upgKey => {
                total += maintenanceCosts[upgKey] || 0;
            });
        }
    });
    return total;
}

// --- Time tracking for day/month/year ---
function updateGameDateUI() {
    const dateBox = document.getElementById('game-date');
    if (dateBox) {
        dateBox.textContent = `Day ${day}, Month ${month}, Year ${year}`;
    }
}

// Update time on each game tick
function gameTick() {
    month++;
    if (month > 12) {
        month = 1;
        year++;
    }
    // day always 15th
    lastIncome = calculateMonthlyIncome();
    lastMaintenance = calculateTotalMaintenance();
    budget += lastIncome - lastMaintenance;
    updateUI();
    updateGameDateUI();
    checkLoseCondition();
}

function startGame() {
    if (!gameRunning) {
        gameLoop = setInterval(gameTick, 10000);
        gameRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
    }
}
function pauseGame() {
    if (gameRunning) {
        clearInterval(gameLoop);
        gameRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }
}
function restartGame() {
    pauseGame();
    // Reset all state
    budget = START_BUDGET;
    month = 1;
    year = 2025;
    day = 15;
    lastIncome = 0;
    lastMaintenance = 0;
    zones = Array(NUM_REGIONS).fill(null).map((_, i) => {
        const type = ZONE_CONFIG[i].type;
        const population = getPopulation(type);
        const waterNeed = Math.round(population * 1.2);
        return {
            id: i,
            type,
            population,
            waterNeed,
            access: 10, // percent, start at 10%
            upgrades: getUpgrades(type),
            ownedUpgrades: []
        };
    });
    updateUI();
    hideWinScreen();
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

// --- Patch: Track upgrades per zone for maintenance ---
// Add ownedUpgrades array to each zone
zones.forEach(zone => {
    if (!zone.ownedUpgrades) zone.ownedUpgrades = [];
});

// --- Patch: When an upgrade is purchased, add its key to ownedUpgrades ---
function getUpgradeKey(upgName) {
    // Map upgrade name to key for maintenanceCosts
    const map = {
        'Build Well': 'well',
        'Irrigation Efficiency Upgrade': 'irrigation',
        'Build Treatment Plant': 'treatment',
        'Lay Pipe Network': 'pipes',
        'Install Water Tanks': 'tanks',
        'Awareness Campaign': 'awareness',
        'Hygiene Education': 'hygiene',
        'Build Small Well': 'well' // treat as well
    };
    return map[upgName] || '';
}

// Patch openRegionModal to add maintenance tracking
const originalOpenRegionModal = openRegionModal;
openRegionModal = function(regionIdx) {
    currentRegion = regionIdx;
    const zone = zones[regionIdx];
    document.getElementById('region-title').textContent = `Region ${regionIdx + 1}`;
    document.getElementById('region-type').textContent = zone.type;
    document.getElementById('region-pop').textContent = zone.population;
    document.getElementById('region-need').textContent = zone.waterNeed;
    document.getElementById('region-access').textContent = zone.access + '%';
    document.getElementById('region-delivered').textContent = Math.round(zone.waterNeed * (zone.access / 100));
    // Render upgrade buttons
    const regionActions = document.querySelector('.region-actions');
    regionActions.innerHTML = '';
    zone.upgrades.forEach((upg, idx) => {
        const btn = document.createElement('button');
        btn.innerHTML = `${upg.name}<br><span class="cost">$${upg.cost}</span>`;
        btn.disabled = budget < upg.cost || zone.access >= 100;
        btn.onclick = () => {
            if (budget >= upg.cost && zone.access < 100) {
                budget -= upg.cost;
                zone.access = Math.min(100, zone.access + upg.access);
                // Add upgrade to ownedUpgrades for maintenance
                const upgKey = getUpgradeKey(upg.name);
                if (upgKey && !zone.ownedUpgrades.includes(upgKey)) {
                    zone.ownedUpgrades.push(upgKey);
                }
                updateUI();
                openRegionModal(regionIdx);
                checkWin();
            }
        };
        regionActions.appendChild(btn);
    });
    modal.classList.remove('hidden');
};

// --- Patch updateUI to show month, income, and maintenance ---
const originalUpdateUI = updateUI;
updateUI = function() {
    originalUpdateUI();
    document.getElementById('month').textContent = month;
    document.getElementById('income').textContent = lastIncome;
    document.getElementById('maintenance').textContent = lastMaintenance;
    updateGameDateUI();
};

// --- Game Control Buttons ---
let gameLoop = null;
let gameRunning = false;

const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const restartBtnMenu = document.getElementById('restart-btn-menu');

function startGame() {
    if (!gameRunning) {
        gameLoop = setInterval(gameTick, 10000);
        gameRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
    }
}
function pauseGame() {
    if (gameRunning) {
        clearInterval(gameLoop);
        gameRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }
}
function restartGame() {
    pauseGame();
    // Reset all state
    budget = START_BUDGET;
    month = 1;
    year = 2025;
    day = 15;
    lastIncome = 0;
    lastMaintenance = 0;
    zones = Array(NUM_REGIONS).fill(null).map((_, i) => {
        const type = ZONE_CONFIG[i].type;
        const population = getPopulation(type);
        const waterNeed = Math.round(population * 1.2);
        return {
            id: i,
            type,
            population,
            waterNeed,
            access: 10, // percent, start at 10%
            upgrades: getUpgrades(type),
            ownedUpgrades: []
        };
    });
    updateUI();
    hideWinScreen();
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

startBtn.onclick = startGame;
pauseBtn.onclick = pauseGame;
restartBtnMenu.onclick = restartGame;

// --- Integrate with win/lose logic ---
function checkLoseCondition() {
    if (budget < 0) {
        alert("You’ve run out of money! Try again with better planning.");
        pauseGame();
    }
}
// Patch win screen to pause game
const originalShowWinScreen = showWinScreen;
showWinScreen = function() {
    originalShowWinScreen();
    pauseGame();
};

// --- Adam's note: All main logic is wrapped in DOMContentLoaded to ensure proper initialization ---
window.addEventListener('DOMContentLoaded', function() {
    // All code below is now inside this event to ensure DOM is ready

    // Attach click handlers to all zone buttons to open region modal
    const zoneBtns = document.querySelectorAll('.zone-btn');
    zoneBtns.forEach((btn, i) => {
        btn.onclick = function() {
            openRegionModal(i);
        };
    });

    // Modal close button handler
    const closeModalBtn = document.getElementById('close-modal');
    closeModalBtn.addEventListener('click', closeRegionModal);

    // Initial UI
    updateUI();
    updateGameDateUI();

    let gameLoop = null;
    let gameRunning = false;

    function startGame() {
        if (!gameRunning) {
            gameLoop = setInterval(gameTick, 10000);
            gameRunning = true;
            startBtn.disabled = true;
            pauseBtn.disabled = false;
        }
    }
    function pauseGame() {
        if (gameRunning) {
            clearInterval(gameLoop);
            gameRunning = false;
            startBtn.disabled = false;
            pauseBtn.disabled = true;
        }
    }
    function restartGame() {
        pauseGame();
        // Reset all state
        budget = START_BUDGET;
        month = 1;
        year = 2025;
        day = 15;
        lastIncome = 0;
        lastMaintenance = 0;
        zones = Array(NUM_REGIONS).fill(null).map((_, i) => {
            const type = ZONE_CONFIG[i].type;
            const population = getPopulation(type);
            const waterNeed = Math.round(population * 1.2);
            return {
                id: i,
                type,
                population,
                waterNeed,
                access: 10, // percent, start at 10%
                upgrades: getUpgrades(type),
                ownedUpgrades: []
            };
        });
        updateUI();
        hideWinScreen();
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }

    startBtn.onclick = startGame;
    pauseBtn.onclick = pauseGame;
    restartBtnMenu.onclick = restartGame;
});
// adam
