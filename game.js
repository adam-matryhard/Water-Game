// Water Town: Access for All - Starter Game Logic

// Initial water accessibility percentage
let waterAccessibility = 50; // percent
// Initial player budget
let budget = 1000;

// Get DOM elements for UI updates
const waterBar = document.getElementById('water-progress-bar'); // Progress bar element
const waterPercent = document.getElementById('water-percentage'); // Percentage text
const budgetDisplay = document.getElementById('budget'); // Budget display
const buildWellBtn = document.getElementById('build-well'); // Build Well button
const runCampaignBtn = document.getElementById('run-campaign'); // Awareness Campaign button

// Update the UI to reflect current game state
function updateUI() {
    waterBar.style.width = waterAccessibility + '%'; // Set progress bar width
    waterPercent.textContent = waterAccessibility + '%'; // Update percentage text
    budgetDisplay.textContent = budget; // Update budget display
}

// Handle Build Well button click
buildWellBtn.addEventListener('click', () => {
    // Only allow if enough budget and not at max accessibility
    if (budget >= 300 && waterAccessibility < 100) {
        budget -= 300; // Deduct cost
        waterAccessibility = Math.min(100, waterAccessibility + 15); // Increase accessibility
        updateUI(); // Refresh UI
    }
});

// Handle Run Awareness Campaign button click
runCampaignBtn.addEventListener('click', () => {
    // Only allow if enough budget and not at max accessibility
    if (budget >= 100 && waterAccessibility < 100) {
        budget -= 100; // Deduct cost
        waterAccessibility = Math.min(100, waterAccessibility + 5); // Increase accessibility
        updateUI(); // Refresh UI
    }
});

// Initial UI update on page load
updateUI();

// Remove legacy code from game.js (all logic is now in script.js)
