const ENDPOINTS = {
  MACHINES: "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/Machines",
  TRAINEES: "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/trainees",
  TRAINING: "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/WorkingPlans"
};

// Your existing parseJwt and other utility functions remain the same

function updateUserGreeting(username) {
  const greetingElement = document.querySelector('.user-greeting');
  greetingElement.textContent = `Hello, ${username}`;
}

function createMachineElement(machine) {
  const div = document.createElement('div');
  div.className = 'machine-card';
  
  const availabilityClass = machine.Availability === 'true' ? 'available' : 'unavailable';
  const availabilityText = machine.Availability === 'true' ? 'Available' : 'In Use';
  
  div.innerHTML = `
      <span class="machine-availability ${availabilityClass}">${availabilityText}</span>
      <div class="machine-header">
          <img src="${machine.ImageURL}" 
               alt="${machine.Name}" 
               class="machine-thumbnail"
               onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
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

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('access_token');
  if (!token) {
      window.location.href = 'index.html';
      return;
  }

  const username = getTrainerName();
  if (username) {
      document.querySelector('.user-greeting').textContent = `Hello, ${username}`;
  }

  try {
      const response = await fetch(ENDPOINTS.MACHINES);
      const data = await response.json();
      const machines = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
      
      const container = document.querySelector('.machines-container');
      container.innerHTML = '';
      
      machines.forEach(machine => {
          container.appendChild(createMachineElement(machine));
      });
      
      setupFilters(machines);
  } catch (error) {
      console.error('Error:', error);
      showError('Failed to load machines');
  }

  document.querySelector('.logOut').addEventListener('click', logout);
});

function logout() {
  localStorage.removeItem('access_token');
  showSuccess('Logged out successfully').then(() => {
      window.location.href = 'index.html';
  });
}
