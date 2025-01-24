const MACHINES_API_ENDPOINT =
  "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/Machines";
const TRAINEES_API_ENDPOINT =
  "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/trainees";

// Authentication
function parseJwt(token) {
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(atob(base64).split("").map(c => 
            "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Invalid token", e);
        return null;
    }
}

function getTrainerName() {
    const token = localStorage.getItem("access_token");
    if (!token) return null;
    const decoded = parseJwt(token);
    return decoded?.name || decoded?.username || decoded?.email || null;
}

// Machine Loading and Display
async function loadMachines() {
    try {
        const response = await fetch(MACHINES_API_ENDPOINT);
        if (!response.ok) throw new Error('Failed to fetch machines');
        
        const machines = await response.json();
        displayMachines(machines);
        updateFilters(machines);
    } catch (error) {
        showError('Failed to load machines');
    }
}

function createMachineCard(machine) {
    const div = document.createElement('div');
    div.className = 'machine-card';
    
    div.innerHTML = `
        <div class="machine-image-container">
            <img src="${machine.ImageUrl}" alt="${machine.Name}" class="machine-image">
        </div>
        <div class="machine-info">
            <h2>${machine.Name}</h2>
            <p class="machine-type">
                ${machine.Type} | ${machine.Brand} | ${machine.TargetBodyPart}
            </p>
        </div>
        <div class="workout-inputs">
            <div class="input-group">
                <label>Weight (kg)</label>
                <input type="number" class="weight-input" min="0" step="0.5">
            </div>
            <div class="input-group">
                <label>Reps</label>
                <input type="number" class="reps-input" min="1">
            </div>
            <div class="input-group">
                <label>Sets</label>
                <input type="number" class="sets-input" min="1">
            </div>
            <div class="input-group">
                <label>Duration (min)</label>
                <input type="number" class="duration-input" min="1">
            </div>
        </div>
        <button class="save-button" data-machine-id="${machine.MachineID}">
            <i class="fas fa-save"></i> Save Workout
        </button>
    `;

    setupMachineCardListeners(div, machine);
    return div;
}

function displayMachines(machines) {
    const container = document.querySelector('.machines-container');
    container.innerHTML = '';
    
    if (machines.length === 0) {
        container.innerHTML = '<p class="no-results">No machines found</p>';
        return;
    }
    
    machines.forEach(machine => {
        container.appendChild(createMachineCard(machine));
    });
}

// Filters
function updateFilters(machines) {
    const types = [...new Set(machines.map(m => m.Type))];
    const targets = [...new Set(machines.map(m => m.TargetBodyPart))];
    
    const typeSelect = document.getElementById('filterType');
    const targetSelect = document.getElementById('filterTarget');
    
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeSelect.appendChild(option);
    });
    
    targets.forEach(target => {
        const option = document.createElement('option');
        option.value = target;
        option.textContent = target;
        targetSelect.appendChild(option);
    });
}

function filterMachines() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const selectedType = document.getElementById('filterType').value;
    const selectedTarget = document.getElementById('filterTarget').value;
    
    const cards = document.querySelectorAll('.machine-card');
    
    cards.forEach(card => {
        const name = card.querySelector('h2').textContent.toLowerCase();
        const type = card.querySelector('.machine-type').textContent;
        
        const matchesSearch = name.includes(searchTerm);
        const matchesType = !selectedType || type.includes(selectedType);
        const matchesTarget = !selectedTarget || type.includes(selectedTarget);
        
        card.style.display = matchesSearch && matchesType && matchesTarget ? 'block' : 'none';
    });
}

// Event Listeners
function setupMachineCardListeners(cardElement, machine) {
    const saveButton = cardElement.querySelector('.save-button');
    const inputs = cardElement.querySelectorAll('input');
    
    inputs.forEach(input => {
        input.addEventListener('input', validateInput);
    });
    
    saveButton.addEventListener('click', () => {
        const workoutData = {
            machineId: machine.MachineID,
            weight: parseFloat(cardElement.querySelector('.weight-input').value) || 0,
            reps: parseInt(cardElement.querySelector('.reps-input').value) || 0,
            sets: parseInt(cardElement.querySelector('.sets-input').value) || 0,
            duration: parseInt(cardElement.querySelector('.duration-input').value) || 0
        };
        
        if (validateWorkoutData(workoutData)) {
            saveWorkout(workoutData);
        }
    });
}

// Validation
function validateInput(e) {
    const input = e.target;
    const value = parseFloat(input.value);
    if (value < parseFloat(input.min)) {
        input.value = input.min;
    }
}

function validateWorkoutData(data) {
    if (data.weight < 0 || data.reps < 1 || data.sets < 1) {
        showError('Please enter valid workout data');
        return false;
    }
    return true;
}

// API Calls
async function saveWorkout(data) {
    try {
        const response = await fetch(ENDPOINTS.TRAINING, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Network response was not ok');
        
        await showSuccess('Workout saved successfully!');
    } catch (error) {
        showError('Failed to save workout');
    }
}

// Notifications
function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        background: '#2d2d2d',
        color: '#ffffff'
    });
}

function showSuccess(message) {
    return Swal.fire({
        icon: 'success',
        title: 'Success',
        text: message,
        background: '#2d2d2d',
        color: '#ffffff'
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadMachines();
    
    // Setup search and filter listeners
    document.getElementById('searchInput').addEventListener('input', filterMachines);
    document.getElementById('filterType').addEventListener('change', filterMachines);
    document.getElementById('filterTarget').addEventListener('change', filterMachines);
    
    // Setup logout
    document.querySelector('.logOut').addEventListener('click', () => {
        localStorage.removeItem('access_token');
        window.location.href = 'login.html';
    });
});