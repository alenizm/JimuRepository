const ENDPOINTS = {
    MACHINES: "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/Machines",

 };
 
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
 
 function updateUserGreeting(username) {
    const greetingElement = document.querySelector('.user-greeting');
    if (greetingElement) {
        greetingElement.textContent = `Hello, ${username}`;
    }
 }
 
 function createMachineElement(machine) {
    const div = document.createElement('div');
    div.className = 'machine-card';
    
    const availabilityClass = machine.Availability === 'true' ? 'available' : 'unavailable';
    const availabilityText = machine.Availability === 'true' ? 'Available' : 'In Use';
    
    div.innerHTML = `
        <span class="machine-availability ${availabilityClass}">${availabilityText}</span>
        <div class="machine-header">
            <img src="${machine.ImageURL || 'images/placeholder.jpg'}" 
                alt="${machine.Name}" 
                class="machine-thumbnail"
                onerror="this.src='images/placeholder.jpg'; this.onerror=null;"
                loading="lazy">
            <div class="machine-title">
                <h2>${machine.Name}</h2>
                <p class="machine-type">
                    ${machine.Type} | ${machine.Brand} | ${machine.TargetBodyPart}
                </p>
            </div>
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
 
 function setupMachineCardListeners(cardElement, machine) {
    const saveButton = cardElement.querySelector('.save-button');
    const inputs = cardElement.querySelectorAll('input');
 
    inputs.forEach(input => {
        input.addEventListener('input', validateInput);
    });
 
    saveButton.addEventListener('click', () => {
        const workoutData = {
            UserID: getTrainerName(),
            MachineID: machine.MachineID,
            Weight: inputs[0].value,
            Repetitions: inputs[1].value,
            Set: inputs[2].value,
            Duration: inputs[3].value
        };
 
        if (validateWorkoutData(workoutData)) {
            saveWorkout(workoutData);
        }
    });
 }
 
 function validateInput(event) {
    const input = event.target;
    const value = parseFloat(input.value);
    if (isNaN(value) || value < 0) {
        input.value = '';
    }
 }
 
 function setupFilters(machines) {
    const types = new Set(machines.map(m => m.Type));
    const targets = new Set(machines.map(m => m.TargetBodyPart));
    
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
 
 async function saveWorkout(data) {
    try {
        const response = await fetch(ENDPOINTS.TRAINING, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
 
        if (!response.ok) throw new Error('Network response was not ok');
        
        await showSuccess('Workout saved successfully!');
        clearInputs(data.MachineID);
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to save workout');
    }
 }
 
 function clearInputs(machineId) {
    const machineCard = document.querySelector(`[data-machine-id="${machineId}"]`).closest('.machine-card');
    machineCard.querySelectorAll('input').forEach(input => input.value = '');
 }
 
 function validateWorkoutData(data) {
    const required = ['Weight', 'Repetitions', 'Set', 'Duration'];
    for (const field of required) {
        if (!data[field] || data[field] <= 0) {
            showError(`Please enter a valid ${field.toLowerCase()}`);
            return false;
        }
    }
    return true;
 }
 
 document.addEventListener('DOMContentLoaded', async () => {
    if (!localStorage.getItem('access_token')) {
        window.location.href = 'index.html';
        return;
    }
 
    try {
        document.querySelector('.machines-container').innerHTML = 
            '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
        
        const response = await fetch(ENDPOINTS.MACHINES);
        const data = await response.json();
        const machines = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
        
        const container = document.querySelector('.machines-container');
        container.innerHTML = '';
        
        if (!machines || machines.length === 0) {
            container.innerHTML = '<div class="no-machines">No machines available</div>';
            return;
        }
 
        machines.forEach(machine => {
            container.appendChild(createMachineElement(machine));
        });
        
        setupFilters(machines);
        
        const username = getTrainerName();
        if (username) {
            updateUserGreeting(username);
        }
 
        // Setup filter listeners
        document.getElementById('searchInput')?.addEventListener('input', filterMachines);
        document.getElementById('filterType')?.addEventListener('change', filterMachines);
        document.getElementById('filterTarget')?.addEventListener('change', filterMachines);
        document.querySelector('.logOut')?.addEventListener('click', logout);
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to load machines');
    }
 });
 
 function logout() {
    localStorage.removeItem('access_token');
    showSuccess('Logged out successfully').then(() => {
        window.location.href = 'index.html';
    });
 }