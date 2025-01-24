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

 function displayUserInfo(pageType) {
    const idToken = localStorage.getItem("id_token");
    if (!idToken) {
        logout();
        return;
    }

    const payload = parseJwt(idToken);
    const username = payload.email || payload["cognito:username"];

    switch(pageType) {
        case "trainer":
            const trainerInfo = document.getElementById("trainer-info");
            if (trainerInfo) {
                trainerInfo.innerText = `Welcome back, ${username}`;
            }
            break;
        case "dashboard":
            const userGreeting = document.querySelector('.user-greeting');
            if (userGreeting) {
                userGreeting.innerHTML = `Welcome back, <strong>${username}</strong>`;
            }
            updateDashboardData(username);
            break;
    }
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
            await displayMachines(machines);
            updateFilters(machines);
        } else {
            container.innerHTML = '<p class="no-results">No machines found</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to load machines');
    }
 }
 
 async function getLastWorkout(machineId) {
    try {
        const userID = getTrainerName();
        if (!userID) return null;
 
        const response = await fetch(`${ENDPOINTS.TRAINING}?UserID=${userID}&MachineID=${machineId}`);
        if (!response.ok) throw new Error('Failed to fetch workout history');
        
        const data = await response.json();
        const records = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
        
        if (!records || records.length === 0) return null;
        
        return records.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp))[0];
    } catch (error) {
        console.error('Error fetching workout history:', error);
        return null;
    }
 }
 
 async function createMachineCard(machine) {
    const div = document.createElement('div');
    div.className = 'machine-card';
    
    const lastWorkout = await getLastWorkout(machine.MachineID);
    
    div.innerHTML = `
        <div class="machine-header">
            <div class="machine-image-container">
                <img src="${machine.ImageURL}" 
                     alt="${machine.Name}" 
                     class="machine-thumbnail"
                     onerror="this.src='images/placeholder.jpg'; this.onerror=null;"
                     loading="lazy">
            </div>
            <div class="machine-info">
                <h2>${machine.Name}</h2>
                <p class="machine-type">${machine.Type} | ${machine.Brand} | ${machine.TargetBodyPart}</p>
                ${lastWorkout ? 
                    `<div class="last-update">
                        <p>Last Update: ${new Date(lastWorkout.Timestamp).toLocaleDateString()}</p>
                        <p>Weight: ${lastWorkout.Weight}kg</p>
                    </div>` : 
                    '<div class="no-updates">No previous workouts recorded</div>'
                }
            </div>
        </div>
        <div class="workout-controls">
            <div class="input-group">
                <label>New Weight (kg)</label>
                <input type="number" class="weight-input" min="0" step="0.5" value="${lastWorkout?.Weight || ''}">
            </div>
            <button class="update-button" data-machine-id="${machine.MachineID}">
                <i class="fas fa-sync-alt"></i> Update Weight
            </button>
        </div>
    `;
 
    setupMachineCardListeners(div, machine);
    return div;
 }
 
 async function displayMachines(machines) {
    const container = document.querySelector('.machines-container');
    container.innerHTML = '';
    
    for (const machine of machines) {
        const card = await createMachineCard(machine);
        container.appendChild(card);
    }
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
    const updateButton = cardElement.querySelector('.update-button');
    const weightInput = cardElement.querySelector('.weight-input');
 
    updateButton.addEventListener('click', async () => {
        const weight = parseFloat(weightInput.value);
        if (!weight || weight <= 0) {
            showError('Please enter a valid weight');
            return;
        }
        await updateWeight(machine.MachineID, weight);
    });
 }
 
 async function updateWeight(machineId, weight) {
    try {
        const workoutData = {
            UserID: getTrainerName(),
            MachineID: machineId,
            Weight: weight,
            Repetitions: 0,
            Set: 0,
            Duration: 0
        };
 
        const response = await fetch(ENDPOINTS.TRAINING, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(workoutData)
        });
 
        if (!response.ok) throw new Error('Failed to update weight');
        
        await showSuccess('Weight updated successfully!');
        location.reload();
    } catch (error) {
        console.error('Error updating weight:', error);
        showError('Failed to update weight');
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