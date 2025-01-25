
const ENDPOINTS = {
  MACHINES:
    "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/Machines",
  TRAINING:
    "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/Records",
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

/** Returns the user's Cognito 'sub' (unique ID) from the access_token. */
function getUserSub() {
  const token = localStorage.getItem("access_token");
  if (!token) return null;
  const decoded = parseJwt(token);
  return decoded?.sub || null;
}

/** (Optional) used for greeting by name or username. */
function getTrainerName() {
  const token = localStorage.getItem("access_token");
  if (!token) return null;
  const decoded = parseJwt(token);
  return decoded?.name || decoded?.username || decoded?.email || null;
}

function displayUserInfo() {
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
      '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading machines...</div>';

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

async function createMachineCard(machine) {
  const div = document.createElement("div");
  div.className = "machine-card";

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
            required
          >
        </div>
        <div class="input-group">
          <label>Sets</label>
          <input
            type="number"
            class="set-input"
            min="1"
            required
          >
        </div>
        <div class="input-group">
          <label>Reps</label>
          <input
            type="number"
            class="rep-input"
            min="1"
            required
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

    // Basic numeric checks before API call
    if (!weight || weight <= 0) {
      showError("Please enter a valid weight");
      return;
    }
    if (!sets || sets < 1) {
      showError("Please enter valid sets");
      return;
    }
    if (!reps || reps < 1) {
      showError("Please enter valid reps");
      return;
    }

    await updateWorkout(
      machine.MachineID,
      weight,
      sets,
      reps,
      weightInput,
      setInput,
      repInput
    );
  });
}

async function updateWorkout(
  machineId,
  weight,
  sets,
  reps,
  weightInput,
  setInput,
  repInput
) {
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
      Repetitions: reps,
    };
    console.log(workoutData);

    const response = await fetch(ENDPOINTS.TRAINING, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(workoutData),
    });

    if (!response.ok) throw new Error("Failed to update workout");
    {
      await showSuccess("Workout updated successfully!");
    }
    // INSTEAD OF location.reload(), clear the inputs:
    weightInput.value = "";
    setInput.value = "";
    repInput.value = "";
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

  displayUserInfo();
  await loadMachines();

  document
    .getElementById("searchInput")
    ?.addEventListener("input", filterMachines);
  document
    .getElementById("filterType")
    ?.addEventListener("change", filterMachines);
  document
    .getElementById("filterTarget")
    ?.addEventListener("change", filterMachines);

  document.querySelector(".logOut")?.addEventListener("click", () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("id_token");
    window.location.href = "index.html";
  });
});

// ======================================================
// INITIALIZATION - Records Table
// ======================================================
document.addEventListener("DOMContentLoaded", function () {
  const table = new DataTable("#recordsTable", {
    paging: true,
    searching: true,
    lengthChange: false,
    info: false,
    order: [[2, "desc"]],
    columnDefs: [
      {
        targets: 4,
        orderable: false,
      },
    ],
  });

  const userSub = getUserSub();
  if (!userSub) {
    console.log("No user sub found. Please log in.");
    return;
  }
  console.log("User sub:", userSub);

  const trainingUrl = `${ENDPOINTS.TRAINING}?userId=${userSub}`;

  fetch(trainingUrl)
    .then((response) => response.json())
    .then((data) => {
      // בדיקה אם יש נתונים תחת 'records'
      if (data && data.records && Array.isArray(data.records)) {
        if (data.records.length > 0) {
          data.records.forEach((record) => {
            table.row
              .add([
                record.repetitions,
                record.set,
                record.timestamp,
                record.weight,
                '<a href="#" class="edit-action">✏️</a><a href="#" class="delete-action">🗑️</a>',
              ])
              .draw(false);
          });
        } else {
          console.log("No records available.");
          table.row.add(["No records available", "", "", "", ""]).draw(false);
        }
      } else {
        console.log("No 'records' found or invalid data format.");
        table.row.add(["Error fetching records", "", "", "", ""]).draw(false);
      }
    })
    .catch((error) => {
      console.error("Error fetching records:", error);
      table.row.add(["Error fetching data", "", "", "", ""]).draw(false);
    });

  // Handle Edit and Delete actions in a single event listener
  document
    .querySelector("#recordsTable")
    .addEventListener("click", function (event) {
      if (event.target.classList.contains("delete-action")) {
        const row = event.target.closest("tr");
        table.row(row).remove().draw();
      } else if (event.target.classList.contains("edit-action")) {
        const row = event.target.closest("tr");
        const data = table.row(row).data();

        // Fill the input fields with current data
        document.querySelector("#repetitionsInput").value = data[0];
        document.querySelector("#setInput").value = data[1];
        document.querySelector("#weightInput").value = data[3];

        document.querySelector("#addRecordBtn").style.display = "none";
        document.querySelector("#updateRecordBtn").style.display = "block";

        const updateBtn = document.querySelector("#updateRecordBtn");
        updateBtn.addEventListener("click", function handleUpdate() {
          const updatedRepetitions =
            document.querySelector("#repetitionsInput").value;
          const updatedSet = document.querySelector("#setInput").value;
          const updatedWeight = document.querySelector("#weightInput").value;

          table
            .row(row)
            .data([
              updatedRepetitions,
              updatedSet,
              data[2], // Keep the original timestamp
              updatedWeight,
              '<a href="#" class="edit-action">✏️</a><a href="#" class="delete-action">🗑️</a>',
            ])
            .draw();

          // Reset the input fields and toggle buttons
          document.querySelector("#repetitionsInput").value = "";
          document.querySelector("#setInput").value = "";
          document.querySelector("#weightInput").value = "";
          document.querySelector("#updateRecordBtn").style.display = "none";
          document.querySelector("#addRecordBtn").style.display = "block";

          // Remove the event listener after handling the update
          updateBtn.removeEventListener("click", handleUpdate);
        });
      }
    });

  // Handle Add Record action
  document
    .querySelector("#addRecordBtn")
    .addEventListener("click", function () {
      const newRepetitions = document.querySelector("#repetitionsInput").value;
      const newSet = document.querySelector("#setInput").value;
      const newWeight = document.querySelector("#weightInput").value;

      if (newRepetitions && newSet && newWeight) {
        const timestamp = new Date().toLocaleString(); // Get a more readable timestamp
        table.row
          .add([
            newRepetitions,
            newSet,
            timestamp,
            newWeight,
            '<a href="#" class="edit-action">✏️</a><a href="#" class="delete-action">🗑️</a>',
          ])
          .draw(false);

        // Clear the input fields
        document.querySelector("#repetitionsInput").value = "";
        document.querySelector("#setInput").value = "";
        document.querySelector("#weightInput").value = "";
      } else {
        alert("Please fill all fields to add a new record.");
      }
    });
});
