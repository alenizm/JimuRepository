const ENDPOINTS = {
    MACHINES: "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/Machines",
    TRAINEES: "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/trainees",
    TRAINING: "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/WorkingPlans"
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
 
 async function loadMachines() {
    try {
        const container = document.querySelector('.machines-container');
        container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
        
        const response = await fetch(ENDPOINTS.MACHINES);
        if (!response.ok) throw new Error('Failed to fetch machines');
        
        const data = await response.json();
        const machines = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
        
        if (machines && machines.length > 0) {
            displayMachines(machines);
            updateFilters(machines);
        } else {
            container.innerHTML = '<p class="no-results">No machines found</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to load machines');
    }
 }
 
 function createMachineCard(machine) {
    const div = document.createElement('div');
    div.className = 'machine-card';
    
    div.innerHTML = `
        <div class="machine-image-container">
            <img src="${machine.ImageURL || 'images/placeholder.jpg'}" 
                alt="${machine.Name}" 
                class="machine-image"
                onerror="this.src='images/placeholder.jpg'; this.onerror=null;"
                loading="lazy">
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
    machines.forEach(machine => {
        container.appendChild(createMachineCard(machine));
    });
 }
 
 function updateFilters(machines) {
    const types = [...new Set(machines.map(m => m.Type))];
    const targets = [...new Set(machines.map(m => m.TargetBodyPart))];
    
    const typeSelect = document.getElementById('filterType');
    const targetSelect = document.getElementById('filterTarget');
    
    typeSelect.innerHTML = '<option value="">All Types</option>';
    targetSelect.innerHTML = '<option value="">All Target Areas</option>';
    
    types.forEach(type => {
        if(type) {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeSelect.appendChild(option);
        }
    });
    
    targets.forEach(target => {
        if(target) {
            const option = document.createElement('option');
            option.value = target;
            option.textContent = target;
            targetSelect.appendChild(option);
        }
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
            Weight: parseFloat(cardElement.querySelector('.weight-input').value) || 0,
            Repetitions: parseInt(cardElement.querySelector('.reps-input').value) || 0,
            Set: parseInt(cardElement.querySelector('.sets-input').value) || 0,
            Duration: parseInt(cardElement.querySelector('.duration-input').value) || 0
        };
        
        if (validateWorkoutData(workoutData)) {
            saveWorkout(workoutData);
            clearInputs(cardElement);
        }
    });
 }
 
 function clearInputs(cardElement) {
    cardElement.querySelectorAll('input').forEach(input => {
        input.value = '';
    });
 }
 
 function validateInput(e) {
    const input = e.target;
    const value = parseFloat(input.value);
    if (value < parseFloat(input.min)) {
        input.value = input.min;
    }
 }
 
 function validateWorkoutData(data) {
    if (data.Weight < 0 || data.Repetitions < 1 || data.Set < 1 || data.Duration < 1) {
        showError('Please enter valid workout data');
        return false;
    }
    return true;
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
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to save workout');
    }
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
 
 document.addEventListener('DOMContentLoaded', async () => {
    if (!localStorage.getItem('access_token')) {
        window.location.href = 'index.html';
        return;
    }
    
    await loadMachines();
    
    document.getElementById('searchInput')?.addEventListener('input', filterMachines);
    document.getElementById('filterType')?.addEventListener('change', filterMachines);
    document.getElementById('filterTarget')?.addEventListener('change', filterMachines);
    
    document.querySelector('.logOut')?.addEventListener('click', () => {
        localStorage.removeItem('access_token');
        window.location.href = 'index.html';
    });
 });