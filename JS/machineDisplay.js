function parseJwt(token) {
  try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      return JSON.parse(jsonPayload);
  } catch (e) {
      console.error('Invalid token', e);
      return null;
  }
}

function getTrainerName() {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) {
      showError('No access token found. Please log in.');
      window.location.href = 'index.html';
      return null;
  }

  const decodedToken = parseJwt(accessToken);
  if (!decodedToken) {
      showError('Failed to decode token.');
      return null;
  }

  return decodedToken.name || decodedToken.username || decodedToken.sub || 
         decodedToken.preferred_username || decodedToken.email;
}

function showError(message) {
  Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      background: '#2d2d2d',
      color: '#ffffff',
      confirmButtonColor: '#4CAF50'
  });
}

function showSuccess(message) {
  Swal.fire({
      icon: 'success',
      title: 'Success',
      text: message,
      background: '#2d2d2d',
      color: '#ffffff',
      confirmButtonColor: '#4CAF50'
  });
}

function createMachineElement(machine) {
  const div = document.createElement('div');
  div.className = 'machine-card';
  
  div.innerHTML = `
      <div class="machine-header">
          <img src="${machine.ImageURL || 'placeholder-image.jpg'}" 
               alt="${machine.Name}" 
               class="machine-thumbnail"
               onerror="this.src='placeholder-image.jpg'">
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
          Save Workout
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
          UserID: userID,
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

function validateWorkoutData(data) {
  if (!data.Weight || !data.Repetitions || !data.Set || !data.Duration) {
      showError('Please fill in all fields');
      return false;
  }
  
  if (data.Weight < 0 || data.Repetitions < 1 || data.Set < 1 || data.Duration < 1) {
      showError('Please enter valid positive numbers');
      return false;
  }
  
  return true;
}

async function saveWorkout(data) {
  try {
      const response = await fetch('https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/Records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      const result = await response.json();
      showSuccess('Workout saved successfully!');
      
      // Clear inputs after successful save
      const machineCard = document.querySelector(`[data-machine-id="${data.MachineID}"]`).closest('.machine-card');
      machineCard.querySelectorAll('input').forEach(input => input.value = '');
  } catch (error) {
      console.error('Error:', error);
      showError('Failed to save workout');
  }
}

function logout() {
  localStorage.removeItem('access_token');
  showSuccess('Logged out successfully').then(() => {
      window.location.href = 'index.html';
  });
}

let userID = getTrainerName();

document.addEventListener('DOMContentLoaded', async () => {
  try {
      const response = await fetch('https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/Machines');
      const data = await response.json();
      const machines = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
      
      const container = document.querySelector('.machines-container');
      machines.forEach(machine => {
          container.appendChild(createMachineElement(machine));
      });
  } catch (error) {
      console.error('Error fetching machines:', error);
      showError('Failed to load machines');
  }

  document.querySelector('.logOut').addEventListener('click', logout);
});