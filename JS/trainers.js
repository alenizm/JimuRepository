/*******************************
 * API ENDPOINTS (example only)
 *******************************/
const MACHINES_API_ENDPOINT =
  "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/Machines";
const TRAINEES_API_ENDPOINT =
  "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/trainees";
const TRAINING_PROGRAM_API_ENDPOINT =
  "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/WorkingPlans";

// Example: Cognito details
const COGNITO_USER_POOL_ID = "us-east-1_gXjTPXbr6";
const COGNITO_GROUP_NAME = "trainees";

/*******************************
 * GLOBAL VARIABLES
 *******************************/
let selectedUserEmail = ""; // Email of the trainee we are building a program for
let trainingProgram = [];   // Array of objects: { machine, sets: [ { weight, reps }, ... ] }

// For handling sets of the *currently selected machine*
let currentSets = [];
let currentSetIndex = 0;

/*******************************
 * AUTH & TOKEN UTILITIES
 * (Optional) If your app uses JWT from Cognito
 *******************************/
function parseJwt(token) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(jsonPayload);
}

function getTrainerName() {
  const accessToken = localStorage.getItem("access_token");
  if (!accessToken) {
    Swal.fire("Error", "No access token found. Please log in.", "error");
    return null;
  }

  const decodedToken = parseJwt(accessToken);
  const trainerName = decodedToken.name || decodedToken.username;

  if (!trainerName) {
    Swal.fire("Error", "Trainer name not found in token.", "error");
    return null;
  }
  return trainerName;
}

/*******************************
 * ON PAGE LOAD
 *******************************/
document.addEventListener("DOMContentLoaded", () => {
  // Fetch data from server
  fetchMachines();
  fetchTrainees();

  // Handle logout
  document.getElementById("logout-btn").addEventListener("click", logout);

  // For demonstration, if you want to show or hide modal for debugging,
  // you can comment/uncomment as needed.
  // openProgramModal(); 
});

/*******************************
 * FETCH TRAINEES
 *******************************/
async function fetchTrainees() {
  try {
    const response = await fetch(
      `${TRAINEES_API_ENDPOINT}?UserPoolId=${COGNITO_USER_POOL_ID}&GroupName=${COGNITO_GROUP_NAME}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch trainees");

    const responseBody = await response.json();
    const trainees = JSON.parse(responseBody.body);

    console.log("Trainees fetched successfully:", trainees);

    const traineesList = document.getElementById("trainees");
    trainees.forEach((trainee) => {
      const card = document.createElement("div");
      card.className = "trainee-card";
      card.setAttribute("data-email", trainee.email);

      // Example: Show trainee's username or full name
      card.innerHTML = `
        <h3>${trainee.username}</h3>
        <p>Email: ${trainee.email}</p>
        <button onclick="selectUser('${trainee.email}')">Create Program</button>
      `;

      traineesList.appendChild(card);
    });
  } catch (error) {
    console.error("Error fetching trainees:", error);
    Swal.fire("Error", "Failed to fetch trainees. Please try again later.", "error");
  }
}

/*******************************
 * FETCH MACHINES
 *******************************/
async function fetchMachines() {
  try {
    const response = await fetch(MACHINES_API_ENDPOINT, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Failed to fetch machines");

    const responseBody = await response.json();
    // Some APIs return the data in .body as a string, so parse if needed
    const machines =
      typeof responseBody.body === "string"
        ? JSON.parse(responseBody.body)
        : responseBody.body;

    console.log("Machines fetched:", machines);

    const machineSelect = document.getElementById("machine-select");
    machines.forEach((machine) => {
      const option = document.createElement("option");
      // Here we assume each machine has "Name" and "Location"
      option.value = machine.Name;
      option.textContent = `${machine.Name} (${machine.Location})`;
      machineSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error fetching machines:", error);
    Swal.fire("Error", "Failed to load machines.", "error");
  }
}

/*******************************
 * FILTER TRAINEES (Search)
 *******************************/
function filterTrainees() {
  const searchTerm = document.getElementById("trainee-search").value.toLowerCase();
  const traineeCards = document.querySelectorAll(".trainee-card");

  traineeCards.forEach((card) => {
    const nameElement = card.querySelector("h3");
    const nameText = nameElement ? nameElement.textContent.toLowerCase() : "";

    // Show/hide based on whether the name includes the search term
    if (nameText.includes(searchTerm)) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}

/*******************************
 * SELECT A TRAINEE
 *******************************/
function selectUser(email) {
  selectedUserEmail = email;
  openProgramModal();
}

/*******************************
 * OPEN & CLOSE MODAL
 *******************************/
function openProgramModal() {
  document.getElementById("programModal").style.display = "flex";
}

function closeProgramModal() {
  document.getElementById("programModal").style.display = "none";
  // Optionally reset fields if you want a fresh start each time
  // trainingProgram = [];
  // selectedUserEmail = "";
  // updateProgramPreview();
}

/*******************************
 * LOGOUT HANDLER (Optional)
 *******************************/
function logout() {
  // Clear tokens if stored
  localStorage.removeItem("access_token");
  // Redirect to login or reload page
  window.location.href = "login.html";
}

/*******************************
 * MACHINE SELECT HANDLER
 *******************************/
function machineSelected() {
  const machineSelect = document.getElementById("machine-select").value;
  const setsContainer = document.getElementById("sets-container");

  if (!machineSelect) {
    setsContainer.style.display = "none";
    return;
  }

  // Check if this machine already exists in our trainingProgram
  const existingMachine = trainingProgram.find((item) => item.machine === machineSelect);

  // If so, use its sets; otherwise, start fresh
  currentSets = existingMachine ? [...existingMachine.sets] : [];
  currentSetIndex = 0;

  // Show the sets container
  setsContainer.style.display = "block";
  displayCurrentSet();
}

/*******************************
 * NAVIGATE SET (Previous / Next)
 *******************************/
function navigateSet(direction) {
  // First, ensure the current set data is updated before leaving
  updateCurrentSet("weight", document.getElementById("weight").value);
  updateCurrentSet("reps", document.getElementById("repetitions").value);

  if (direction === "prev" && currentSetIndex > 0) {
    currentSetIndex--;
  } else if (direction === "next") {
    // Move to next set only if we haven't reached the end
    if (currentSetIndex < currentSets.length - 1) {
      currentSetIndex++;
    } 
    // Or, if you want to automatically add a new set:
    // else { addNewSet(); }
  }

  displayCurrentSet();
}

/*******************************
 * DISPLAY CURRENT SET
 *******************************/
function displayCurrentSet() {
  // If no sets exist, start with one empty set
  if (currentSets.length === 0) {
    currentSets.push({ weight: "", reps: "" });
    currentSetIndex = 0;
  }

  // Fix any out-of-bounds index
  if (currentSetIndex < 0) currentSetIndex = 0;
  if (currentSetIndex >= currentSets.length) {
    currentSetIndex = currentSets.length - 1;
  }

  // Update UI
  const setTitle = document.getElementById("set-title");
  const weightInput = document.getElementById("weight");
  const repsInput = document.getElementById("repetitions");

  setTitle.textContent = `Set ${currentSetIndex + 1} of ${currentSets.length}`;
  weightInput.value = currentSets[currentSetIndex].weight;
  repsInput.value = currentSets[currentSetIndex].reps;
}

/*******************************
 * UPDATE CURRENT SET FIELDS
 *******************************/
function updateCurrentSet(field, value) {
  if (!currentSets[currentSetIndex]) return;
  if (field === "weight") {
    currentSets[currentSetIndex].weight = value;
  } else if (field === "reps") {
    currentSets[currentSetIndex].reps = value;
  }
}

/*******************************
 * ADD NEW SET
 *******************************/
function addNewSet() {
  // Update the current set before adding a new one
  updateCurrentSet("weight", document.getElementById("weight").value);
  updateCurrentSet("reps", document.getElementById("repetitions").value);

  // Confirmation (optional)
  Swal.fire({
    title: "Add Another Set?",
    text: "Are you sure you want to add a new set?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, Add Set",
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      currentSets.push({ weight: "", reps: "" });
      currentSetIndex = currentSets.length - 1;
      displayCurrentSet();
    }
  });
}

/*******************************
 * SAVE MACHINE SETS
 *******************************/
function saveMachineSets() {
  // Make sure current set is updated from the UI
  updateCurrentSet("weight", document.getElementById("weight").value);
  updateCurrentSet("reps", document.getElementById("repetitions").value);

  const machineSelect = document.getElementById("machine-select").value;
  if (!machineSelect) {
    Swal.fire("Error", "Please select a machine first.", "error");
    return;
  }

  Swal.fire({
    title: "Add Machine to Program?",
    text: "This will save the current sets for the selected machine.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, Save",
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      // Check if machine already in trainingProgram
      const existingIndex = trainingProgram.findIndex(
        (item) => item.machine === machineSelect
      );

      if (existingIndex >= 0) {
        trainingProgram[existingIndex].sets = [...currentSets];
      } else {
        trainingProgram.push({
          machine: machineSelect,
          sets: [...currentSets],
        });
      }

      updateProgramPreview();
      Swal.fire("Success", "Machine and sets added/updated!", "success");
    }
  });
}

/*******************************
 * UPDATE PROGRAM PREVIEW
 *******************************/
function updateProgramPreview() {
  const previewContainer = document.getElementById("program-preview");
  previewContainer.innerHTML = "";

  trainingProgram.forEach((entry) => {
    const { machine, sets } = entry;

    const programDiv = document.createElement("div");
    programDiv.className = "program-box";

    let setsHTML = "";
    sets.forEach((set, index) => {
      setsHTML += `
        <div class="set-info">
          <span>Set ${index + 1}: ${set.weight} kg, ${set.reps} reps</span>
          <button class="btn-delete" onclick="deleteSet('${machine}', ${index})">Delete</button>
          <button class="btn-edit" onclick="editSet('${machine}', ${index})">Edit</button>
        </div>
      `;
    });

    programDiv.innerHTML = `
      <h3>${machine}</h3>
      ${setsHTML}
    `;
    previewContainer.appendChild(programDiv);
  });
}

/*******************************
 * DELETE SET
 *******************************/
function deleteSet(machineName, setIndex) {
  // Find the machine object in trainingProgram
  const machineObj = trainingProgram.find((m) => m.machine === machineName);
  if (!machineObj) return;

  // Remove the set
  machineObj.sets.splice(setIndex, 1);

  // If no sets left, remove machine from the program
  if (machineObj.sets.length === 0) {
    trainingProgram = trainingProgram.filter((m) => m.machine !== machineName);
  }

  // If we are currently editing that machine, update the modal's current sets
  const selectedMachine = document.getElementById("machine-select").value;
  if (machineName === selectedMachine) {
    currentSets = machineObj.sets || [];
    currentSetIndex = 0;
    if (currentSets.length > 0) {
      displayCurrentSet();
    } else {
      document.getElementById("sets-container").style.display = "none";
    }
  }

  updateProgramPreview();
}

/*******************************
 * EDIT SET
 *******************************/
function editSet(machineName, setIndex) {
  // Re-open the modal if it's closed
  document.getElementById("programModal").style.display = "flex";

  // Switch the machine-select to the correct machine
  const machineSelect = document.getElementById("machine-select");
  machineSelect.value = machineName;

  // Re-load sets from trainingProgram
  machineSelected();

  // Jump to the set user wants to edit
  currentSetIndex = setIndex;
  displayCurrentSet();
}

/*******************************
 * SUBMIT PROGRAM
 *******************************/
async function submitProgram() {
  if (trainingProgram.length === 0) {
    Swal.fire("Error", "Add at least one machine and one set before submitting.", "error");
    return;
  }

  if (!selectedUserEmail) {
    Swal.fire("Error", "No user selected for the training program.", "error");
    return;
  }

  // (Optional) If using the trainer name from JWT
  const trainerName = getTrainerName();
  if (!trainerName) return;

  // Body payload for the API
  const bodyPayload = {
    UserEmail: selectedUserEmail,
    TrainerName: trainerName, // or some other field
  };

  // Some APIs want program details as query params or in the body
  // Adjust this as needed:
  const queryParams = {
    PlanDetails: JSON.stringify(trainingProgram),
  };

  // Construct final URL with query param
  const url = `${TRAINING_PROGRAM_API_ENDPOINT}?PlanDetails=${encodeURIComponent(
    queryParams.PlanDetails
  )}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyPayload),
    });

    if (!response.ok) {
      throw new Error("Failed to submit training program");
    }

    Swal.fire("Success", "Training program submitted successfully!", "success");
    // Clear everything if desired:
    trainingProgram = [];
    selectedUserEmail = "";
    updateProgramPreview();
    closeProgramModal();

  } catch (error) {
    console.error("Error submitting program:", error);
    Swal.fire("Error", "Failed to submit training program. Please try again.", "error");
  }
}
