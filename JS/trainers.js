/*******************************
 * API ENDPOINTS
 *******************************/
const MACHINES_API_ENDPOINT =
  "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/Machines";
const TRAINEES_API_ENDPOINT =
  "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/trainees";
const TRAINING_PROGRAM_API_ENDPOINT =
  "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/WorkingPlans";

// Cognito details
const COGNITO_USER_POOL_ID = "us-east-1_gXjTPXbr6";
const COGNITO_GROUP_NAME = "trainees";

/*******************************
 * GLOBAL VARIABLES
 *******************************/
let selectedUserEmail = ""; 
let selectedUserSub = "";   // Store the trainee's sub (UserID)

let trainingProgram = [];   // [{ machine, sets: [{ weight, reps }, ...] }]

// For handling sets of the *currently selected machine*
let currentSets = [];
let currentSetIndex = 0;

/*******************************
 * AUTH & TOKEN UTILITIES
 *******************************/

// Decode JWT
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

// Get trainer's Cognito sub (unique user ID) from the JWT
function getTrainerSub() {
  const accessToken = localStorage.getItem("access_token");
  if (!accessToken) {
    Swal.fire("Error", "No access token found. Please log in.", "error");
    return null;
  }
  const decodedToken = parseJwt(accessToken);
  return decodedToken.sub;
}

/*******************************
 * ON PAGE LOAD
 *******************************/
document.addEventListener("DOMContentLoaded", () => {
  // Fetch from server
  fetchMachines();
  fetchTrainees();

  // Logout button
  document.getElementById("logout-btn").addEventListener("click", logout);
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
      card.setAttribute("data-sub", trainee.sub);

      card.innerHTML = `
        <h3>${trainee.username}</h3>
        <p>Email: ${trainee.email}</p>
        <!-- Pass both email and sub to selectUser() -->
        <button onclick="selectUser('${trainee.email}', '${trainee.sub}')">Create Program</button>
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
    const machines =
      typeof responseBody.body === "string"
        ? JSON.parse(responseBody.body)
        : responseBody.body;

    console.log("Machines fetched:", machines);

    const machineSelect = document.getElementById("machine-select");
    machines.forEach((machine) => {
      const option = document.createElement("option");
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
    card.style.display = nameText.includes(searchTerm) ? "block" : "none";
  });
}

/*******************************
 * SELECT A TRAINEE
 *******************************/
function selectUser(email, sub) {
  selectedUserEmail = email;
  selectedUserSub = sub; // Store the trainee's Cognito sub (UserID)
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
}

/*******************************
 * LOGOUT HANDLER (Optional)
 *******************************/
function logout() {
  // Clear tokens if stored
  localStorage.removeItem("access_token");
  // Redirect
  window.location.href = "index.html";
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

  // Check if this machine already in trainingProgram
  const existingMachine = trainingProgram.find(
    (item) => item.machine === machineSelect
  );

  // If so, use its sets; else start fresh
  currentSets = existingMachine ? [...existingMachine.sets] : [];
  currentSetIndex = 0;
  setsContainer.style.display = "block";
  displayCurrentSet();
}

/*******************************
 * NAVIGATE SET
 *******************************/
function navigateSet(direction) {
  // Save current inputs before moving
  updateCurrentSet("weight", document.getElementById("weight").value);
  updateCurrentSet("reps", document.getElementById("repetitions").value);

  if (direction === "prev" && currentSetIndex > 0) {
    currentSetIndex--;
  } else if (direction === "next") {
    if (currentSetIndex < currentSets.length - 1) {
      currentSetIndex++;
    }
    // else { addNewSet(); } // optional auto-add
  }

  displayCurrentSet();
}

/*******************************
 * DISPLAY CURRENT SET
 *******************************/
function displayCurrentSet() {
  if (currentSets.length === 0) {
    currentSets.push({ weight: "", reps: "" });
    currentSetIndex = 0;
  }
  if (currentSetIndex < 0) currentSetIndex = 0;
  if (currentSetIndex >= currentSets.length) {
    currentSetIndex = currentSets.length - 1;
  }

  document.getElementById("set-title").textContent = 
    `Set ${currentSetIndex + 1} of ${currentSets.length}`;
    
  document.getElementById("weight").value = currentSets[currentSetIndex].weight;
  document.getElementById("repetitions").value = currentSets[currentSetIndex].reps;
}

/*******************************
 * UPDATE CURRENT SET
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
  updateCurrentSet("weight", document.getElementById("weight").value);
  updateCurrentSet("reps", document.getElementById("repetitions").value);

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
      const existingIndex = trainingProgram.findIndex(
        (item) => item.machine === machineSelect
      );

      if (existingIndex >= 0) {
        trainingProgram[existingIndex].sets = [...currentSets];
      } else {
        trainingProgram.push({ machine: machineSelect, sets: [...currentSets] });
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
  const machineObj = trainingProgram.find((m) => m.machine === machineName);
  if (!machineObj) return;

  machineObj.sets.splice(setIndex, 1);

  // If no sets left, remove machine entirely
  if (machineObj.sets.length === 0) {
    trainingProgram = trainingProgram.filter((m) => m.machine !== machineName);
  }

  // If we're currently editing that machine
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

  // Switch the machine-select
  const machineSelect = document.getElementById("machine-select");
  machineSelect.value = machineName;

  machineSelected(); // Reload sets
  currentSetIndex = setIndex;
  displayCurrentSet();
}

/*******************************
 * SUBMIT PROGRAM
 *******************************/
async function submitProgram() {
  // Must have at least one machine + sets
  if (trainingProgram.length === 0) {
    Swal.fire("Error", "Add at least one machine and one set before submitting.", "error");
    return;
  }
  // Must have a selected user
  if (!selectedUserEmail || !selectedUserSub) {
    Swal.fire("Error", "No user selected for the training program.", "error");
    return;
  }

  // Trainer's sub from localStorage token
  const trainerSub = getTrainerSub();
  if (!trainerSub) return;

  // Body payload for the API
  const bodyPayload = {
    UserEmail: selectedUserEmail,  // The trainee's email
    UserID: selectedUserSub,       // The trainee's sub
    TrainerID: trainerSub,          // The trainer's sub
    PlanDetails : trainingProgram
  };



  // Build URL
  const url = `${TRAINING_PROGRAM_API_ENDPOINT}}`;

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

    // Clear everything
    trainingProgram = [];
    selectedUserEmail = "";
    selectedUserSub = "";
    updateProgramPreview();
    closeProgramModal();

  } catch (error) {
    console.error("Error submitting program:", error);
    Swal.fire("Error", "Failed to submit training program. Please try again.", "error");
  }
}
