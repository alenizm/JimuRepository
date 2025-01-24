const ENDPOINTS = {
    MACHINES: "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/Machines",
    TRAINING: "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/Records"
  };
  
  // ======================================================
  // AUTH & USER FUNCTIONS
  // ======================================================
  function parseJwt(token) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("Invalid token", e);
      return null;
    }
  }
  
  /**
   * Returns the user's Cognito 'sub' (unique ID) from the access_token.
   */
  function getUserSub() {
    const token = localStorage.getItem("access_token");
    if (!token) return null;
    const decoded = parseJwt(token);
    return decoded?.sub || null;
  }
  
  /**
   * Optional: used for greeting the trainer by name or username.
   */
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
    const username = payload.username || payload["cognito:username"];
  
    const userGreeting = document.querySelector(".user-greeting");
    if (userGreeting) {
      userGreeting.innerHTML = `Welcome back, <strong>${username}</strong>`;
    }
  }
  
  // ======================================================
  // MACHINE LOADING & DISPLAY
  // ======================================================
  async function loadMachines() {
    try {
      const container = document.querySelector(".machines-container");
      container.innerHTML =
        '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
  
      const response = await fetch(ENDPOINTS.MACHINES);
      if (!response.ok) throw new Error("Failed to fetch machines");
  
      const data = await response.json();
      const machines =
        typeof data.body === "string" ? JSON.parse(data.body) : data.body;
  
      if (machines && machines.length > 0) {
        await displayMachines(machines);
        updateFilters(machines);
      } else {
        container.innerHTML = '<p class="no-results">No machines found</p>';
      }
    } catch (error) {
      console.error("Error:", error);
      showError("Failed to load machines");
    }
  }
  
  /* 
  // COMMENTING OUT getLastWorkout logic
  async function getLastWorkout(machineId) {
    try {
      const userSub = getUserSub();
      if (!userSub) return null;
  
      const response = await fetch(
        `${ENDPOINTS.TRAINING}?UserID=${userSub}&MachineID=${machineId}`
      );
      if (!response.ok) throw new Error("Failed to fetch workout history");
  
      const data = await response.json();
      const records =
        typeof data.body === "string" ? JSON.parse(data.body) : data.body;
  
      if (!records || records.length === 0) return null;
  
      return records.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp))[0];
    } catch (error) {
      console.error("Error fetching workout history:", error);
      return null;
    }
  }
  */
  
  async function createMachineCard(machine) {
    const div = document.createElement("div");
    div.className = "machine-card";
  
    // Comment out lastWorkout fetch and usage:
    // const lastWorkout = await getLastWorkout(machine.MachineID);
  
    div.innerHTML = `
      <div class="machine-header">
        <div class="machine-image-container">
          <img
            src="${machine.ImageURL}"
            alt="${machine.Name}"
            class="machine-thumbnail"
            onerror="this.src='images/placeholder.jpg'; this.onerror=null;"
          >
        </div>
        <div class="machine-info">
          <h2>${machine.Name}</h2>
          <p class="machine-type">
            ${machine.Type} | ${machine.TargetBodyPart}
          </p>
          <!-- 
            // lastWorkout logic commented out:
            ${
              /* lastWorkout
                ? `<div class="last-update">
                     <p>Last Update: ${new Date(lastWorkout.Timestamp).toLocaleDateString()}</p>
                     <p>Weight: ${lastWorkout.Weight}kg | Sets: ${lastWorkout.Set} | Reps: ${lastWorkout.Repetitions}</p>
                   </div>`
                : '<div class="no-updates">first time?</div>'
              */ ""
            }
          -->
        </div>
      </div>
      <div class="workout-controls">
        <div class="input-group">
          <label>Weight (kg)</label>
          <input
            type="number"
            class="weight-input"
            min="0"
            step="0.5"
            /* value="${lastWorkout?.Weight || ''}" */
            value=""
          >
        </div>
        <div class="input-group">
          <label>Sets</label>
          <input
            type="number"
            class="set-input"
            min="1"
            /* value="${lastWorkout?.Set || ''}" */
            value=""
          >
        </div>
        <div class="input-group">
          <label>Reps</label>
          <input
            type="number"
            class="rep-input"
            min="1"
            /* value="${lastWorkout?.Repetitions || ''}" */
            value=""
          >
        </div>
        <button class="update-button" data-machine-id="${machine.MachineID}">
          <i class="fas fa-sync-alt"></i> Update
        </button>
      </div>
    `;
  
    setupMachineCardListeners(div, machine);
    return div;
  }
  
  async function displayMachines(machines) {
    const container = document.querySelector(".machines-container");
    container.innerHTML = "";
  
    for (const machine of machines) {
      const card = await createMachineCard(machine);
      container.appendChild(card);
    }
  }
  
  // ======================================================
  // FILTERS & SEARCH
  // ======================================================
  function updateFilters(machines) {
    const types = [...new Set(machines.map((m) => m.Type))];
    const targets = [...new Set(machines.map((m) => m.TargetBodyPart))];
  
    const typeSelect = document.getElementById("filterType");
    const targetSelect = document.getElementById("filterTarget");
  
    typeSelect.innerHTML = '<option value="">All Types</option>';
    targetSelect.innerHTML = '<option value="">All Target Areas</option>';
  
    types.forEach((type) => {
      if (type) {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type;
        typeSelect.appendChild(option);
      }
    });
  
    targets.forEach((target) => {
      if (target) {
        const option = document.createElement("option");
        option.value = target;
        option.textContent = target;
        targetSelect.appendChild(option);
      }
    });
  }
  
  function filterMachines() {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase();
    const selectedType = document.getElementById("filterType").value;
    const selectedTarget = document.getElementById("filterTarget").value;
  
    const cards = document.querySelectorAll(".machine-card");
  
    cards.forEach((card) => {
      const name = card.querySelector("h2").textContent.toLowerCase();
      const typeInfo = card.querySelector(".machine-type").textContent;
  
      const matchesSearch = name.includes(searchTerm);
      const matchesType = !selectedType || typeInfo.includes(selectedType);
      const matchesTarget = !selectedTarget || typeInfo.includes(selectedTarget);
  
      card.style.display =
        matchesSearch && matchesType && matchesTarget ? "flex" : "none";
    });
  }
  
  // ======================================================
  // EVENT LISTENERS
  // ======================================================
  function setupMachineCardListeners(cardElement, machine) {
    const updateButton = cardElement.querySelector(".update-button");
    const weightInput = cardElement.querySelector(".weight-input");
    const setInput = cardElement.querySelector(".set-input");
    const repInput = cardElement.querySelector(".rep-input");
  
    updateButton.addEventListener("click", async () => {
      const weight = parseFloat(weightInput.value);
      const sets = parseInt(setInput.value);
      const reps = parseInt(repInput.value);
  
      if (!weight || weight <= 0) {
        showError("Please enter a valid weight");
        return;
      }
      if (!sets || sets < 0) {
        showError("Please enter valid sets");
        return;
      }
      if (!reps || reps < 0) {
        showError("Please enter valid reps");
        return;
      }
  
      await updateWorkout(machine.MachineID, weight, sets, reps);
    });
  }
  
  async function updateWorkout(machineId, weight, sets, reps) {
    try {
      const userSub = getUserSub();
      if (!userSub) {
        showError("User ID not found in token");
        return;
      }
  
      const workoutData = {
        UserID: userSub,
        MachineID: machineId,
        Weight: weight,
        Set: sets,
        Repetitions: reps
      };
  
      const response = await fetch(ENDPOINTS.TRAINING, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workoutData)
      });
  
      if (!response.ok) throw new Error("Failed to update workout");
  
      await showSuccess("Workout updated successfully!");
      location.reload();
    } catch (error) {
      console.error("Error updating workout:", error);
      showError("Failed to update workout");
    }
  }
  
  // ======================================================
  // NOTIFICATIONS
  // ======================================================
  function showError(message) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: message,
      background: "#2d2d2d",
      color: "#ffffff",
    });
  }
  
  function showSuccess(message) {
    return Swal.fire({
      icon: "success",
      title: "Success",
      text: message,
      background: "#2d2d2d",
      color: "#ffffff",
    });
  }
  
  // ======================================================
  // INITIALIZATION
  // ======================================================
  document.addEventListener("DOMContentLoaded", async () => {
    if (!localStorage.getItem("access_token")) {
      window.location.href = "index.html";
      return;
    }
  
    displayUserInfo("dashboard");
    await loadMachines();
  
    document.getElementById("searchInput")?.addEventListener("input", filterMachines);
    document.getElementById("filterType")?.addEventListener("change", filterMachines);
    document.getElementById("filterTarget")?.addEventListener("change", filterMachines);
  
    document.querySelector(".logOut")?.addEventListener("click", () => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("id_token");
      window.location.href = "index.html";
    });
  });
  