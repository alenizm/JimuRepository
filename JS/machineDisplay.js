const ENDPOINTS = {
  MACHINES:
    "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/Machines",
  TRAINING:
    "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/Records",
};

// ======================================================
// AUTH & USER FUNCTIONS
// (Unchanged; same as your existing code)
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

function getUserSub() {
  const token = localStorage.getItem("access_token");
  if (!token) return null;
  const decoded = parseJwt(token);
  return decoded?.sub || null;
}

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
// NOTIFICATIONS (SweetAlert2)
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
// MACHINES (Unchanged from your code)
// ======================================================
async function loadMachines() {
  try {
    const container = document.querySelector(".machines-container");
    if (!container) return; // If there's no .machines-container on the page, skip

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
  if (!container) return;
  container.innerHTML = "";

  for (const machine of machines) {
    const card = await createMachineCard(machine);
    container.appendChild(card);
  }
}

function updateFilters(machines) {
  const typeSelect = document.getElementById("filterType");
  const targetSelect = document.getElementById("filterTarget");
  if (!typeSelect || !targetSelect) return;

  const types = [...new Set(machines.map((m) => m.Type))];
  const targets = [...new Set(machines.map((m) => m.TargetBodyPart))];

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
  const searchInput = document.getElementById("searchInput");
  const typeSelect = document.getElementById("filterType");
  const targetSelect = document.getElementById("filterTarget");
  if (!searchInput || !typeSelect || !targetSelect) return;

  const searchTerm = searchInput.value.toLowerCase();
  const selectedType = typeSelect.value;
  const selectedTarget = targetSelect.value;

  const cards = document.querySelectorAll(".machine-card");

  cards.forEach((card) => {
    const name = card.querySelector("h2").textContent.toLowerCase();
    const typeInfo = card.querySelector(".machine-type").textContent;

    const matchesSearch = name.includes(searchTerm);
    const matchesType = !selectedType || typeInfo.includes(selectedType);
    const matchesTarget =
      !selectedTarget || typeInfo.includes(selectedTarget);

    card.style.display =
      matchesSearch && matchesType && matchesTarget ? "flex" : "none";
  });
}

// ======================================================
// MACHINE WORKOUT UPDATE
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
    // Clear the inputs after success
    weightInput.value = "";
    setInput.value = "";
    repInput.value = "";
  } catch (error) {
    console.error("Error updating workout:", error);
    showError("Failed to update workout");
  }
}

// ======================================================
// DATA TABLE FOR USER RECORDS
// ======================================================

// 1. Populate the table with existing records
function populateTable(records) {
  const tableBody = document.getElementById("data-table-body");
  if (!tableBody) return;

  // Clear existing rows
  tableBody.innerHTML = "";

  // Populate the table with records
  records.forEach((record) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${record.recordId}</td>
      <td>${record.set}</td>
      <td>${record.repetitions}</td>
      <td>${Number(record.weight).toFixed(2)}</td>
      <td>${record.timestamp}</td>
      <td>
        <button class="edit-btn" data-recordid="${record.recordId}">Edit</button>
        <button class="delete-btn" data-recordid="${record.recordId}">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// 2. Hook up Edit & Delete buttons
function setupEventListeners(records) {
  document.addEventListener("click", async (event) => {
    // EDIT:
    if (event.target.classList.contains("edit-btn")) {
      const recordId = event.target.getAttribute("data-recordid");
      const record = records.find((r) => r.recordId === recordId);
      if (record) {
        // Populate form fields
        document.getElementById("record-id-input").value = record.recordId;
        document.getElementById("set-input").value = record.set;
        document.getElementById("repetitions-input").value =
          record.repetitions;
        document.getElementById("weight-input").value = record.weight;
        document.getElementById("timestamp-input").value = record.timestamp
          ? record.timestamp.replace(" ", "T") // if your timestamp is "YYYY-MM-DD HH:MM"
          : "";
      }
    }

    // DELETE:
    if (event.target.classList.contains("delete-btn")) {
      const recordId = event.target.getAttribute("data-recordid");
      await deleteRecord(recordId);
    }
  });
}

// 3. Add or Update record (form submission)
async function handleRecordFormSubmit(event) {
  event.preventDefault();
  const userSub = getUserSub();
  if (!userSub) {
    showError("User ID not found in token");
    return;
  }

  // Grab the form fields
  const recordId = document.getElementById("record-id-input").value.trim();
  const setVal = document.getElementById("set-input").value.trim();
  const repetitionsVal =
    document.getElementById("repetitions-input").value.trim();
  const weightVal = document.getElementById("weight-input").value.trim();
  const timestampVal =
    document.getElementById("timestamp-input").value.trim(); // "YYYY-MM-DDTHH:mm"

  // Basic validations
  if (!setVal || !repetitionsVal || !weightVal) {
    showError("Please fill in all required fields (Set, Reps, Weight)");
    return;
  }

  // Construct the payload
  const payload = {
    UserID: userSub,
    set: Number(setVal),
    repetitions: Number(repetitionsVal),
    weight: Number(weightVal),
    timestamp: timestampVal || new Date().toISOString(), // fallback to "now"
  };

  try {
    if (recordId) {
      // EDIT (PUT or PATCH to /Records/{recordId})
      payload.recordId = recordId;
      const response = await fetch(`${ENDPOINTS.TRAINING}/${recordId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to update record");

      await showSuccess("Record updated successfully!");
    } else {
      // ADD (POST to /Records)
      const response = await fetch(ENDPOINTS.TRAINING, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to add record");

      await showSuccess("Record added successfully!");
    }

    // Clear the form
    document.getElementById("record-id-input").value = "";
    document.getElementById("set-input").value = "";
    document.getElementById("repetitions-input").value = "";
    document.getElementById("weight-input").value = "";
    document.getElementById("timestamp-input").value = "";

    // Re-fetch the table data
    await fetchDataAndPopulateTable();
  } catch (error) {
    console.error("Error adding/updating record:", error);
    showError(error.message || "Failed to add/update record");
  }
}

// 4. Delete record
async function deleteRecord(recordId) {
  try {
    // Confirm deletion (optional)
    const confirmRes = await Swal.fire({
      icon: "warning",
      title: "Delete?",
      text: `Are you sure you want to delete record #${recordId}?`,
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      background: "#2d2d2d",
      color: "#ffffff",
    });
    if (!confirmRes.isConfirmed) return;

    // Make delete request
    const response = await fetch(`${ENDPOINTS.TRAINING}/${recordId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete record");

    await showSuccess("Record deleted successfully!");
    // Re-fetch data to update the table
    await fetchDataAndPopulateTable();
  } catch (error) {
    console.error("Error deleting record:", error);
    showError(error.message || "Failed to delete record");
  }
}

// 5. Fetch records from API and populate
async function fetchDataAndPopulateTable() {
  try {
    const userSub = getUserSub(); // Get user sub (unique ID)
    if (!userSub) {
      console.error("User sub is missing");
      return;
    }

    const trainingUrl = `${ENDPOINTS.TRAINING}?userId=${userSub}`;
    const response = await fetch(trainingUrl);
    if (!response.ok) throw new Error("Failed to fetch training records");

    const data = await response.json(); // Parse the response JSON
    const body =
      typeof data.body === "string" ? JSON.parse(data.body) : data.body;

    // The API might return { records: [ ... ] }
    const records = body.records;
    if (!Array.isArray(records))
      throw new Error("Records data is not an array");

    console.log("Records fetched:", records);

    // Populate the table and set up event listeners for new data
    populateTable(records);
    setupEventListeners(records);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// ======================================================
// INITIALIZATION
// ======================================================
document.addEventListener("DOMContentLoaded", async () => {
  // If not logged in, redirect
  if (!localStorage.getItem("access_token")) {
    window.location.href = "index.html";
    return;
  }

  // Display user info (optional)
  displayUserInfo();

  // Load machines (if you have .machines-container on this page)
  await loadMachines();

  // Initialize the records table
  await fetchDataAndPopulateTable();

  // Hook up filters for machines
  document.getElementById("searchInput")?.addEventListener("input", filterMachines);
  document.getElementById("filterType")?.addEventListener("change", filterMachines);
  document.getElementById("filterTarget")?.addEventListener("change", filterMachines);

  // Logout button
  document.querySelector(".logOut")?.addEventListener("click", () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("id_token");
    window.location.href = "index.html";
  });

  // Handle form submit (Add/Edit)
  const recordForm = document.getElementById("record-form");
  if (recordForm) {
    recordForm.addEventListener("submit", handleRecordFormSubmit);
  }
});