/********************
 * API ENDPOINTS
 ********************/
const machinesApiEndpoint =
  "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/Machines";
const trainingProgramApiEndpoint =
  "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/WorkingPlans";
const traineesApiEndpoint =
  "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/trainees";

/*******************************
 * GLOBAL VARIABLES
 *******************************/
let trainingProgram = []; // Array to store { machine, sets: [{ weight, reps }, ...] }
let selectedUserEmail = ""; // Store selected user email

// For handling sets of the *currently selected machine*
let currentSets = [];
let currentSetIndex = 0;

/*******************************
 * AUTH & TOKEN UTILITIES
 *******************************/
// Function to decode JWT
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

// Get Trainer Name from Access Token
function getTrainerName() {
  const accessToken = localStorage.getItem("access_token");
  if (!accessToken) {
    alert("No access token found. Please log in.");
    return null;
  }

  const decodedToken = parseJwt(accessToken);
  const trainerName = decodedToken.name || decodedToken.username; // Use 'name' or 'username'

  if (!trainerName) {
    alert("Trainer name not found in token.");
    return null;
  }
  return trainerName;
}

/*******************************
 * FETCH TRAINEES
 *******************************/
async function fetchTrainees() {
  try {
    const userPoolId = "us-east-1_gXjTPXbr6"; // Replace with your User Pool ID
    const groupName = "trainees"; // Replace with the name of your group

    const response = await fetch(
      `${traineesApiEndpoint}?UserPoolId=${userPoolId}&GroupName=${groupName}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch trainees");
    }

    const responseBody = await response.json();
    const trainees = JSON.parse(responseBody.body);

    console.log("Trainees fetched successfully:", trainees);

    // Render trainees to the HTML
    const traineesList = document.getElementById("trainees");
    trainees.forEach((trainee) => {
      const card = document.createElement("div");
      card.className = "trainee-card";
      card.setAttribute("data-email", trainee.email);

      card.innerHTML = `
        <div class="trainee-info">
          <h2>${trainee.username}</h2>
          <p>Email: ${trainee.email}</p>
        </div>
        <button class="create-program-btn" onclick="selectUser('${trainee.email}')">
          Create Training Program
        </button>
      `;

      traineesList.appendChild(card);
    });
  } catch (error) {
    console.error("Error fetching trainees:", error);
    alert("Failed to fetch trainees. Please try again later.");
  }
}

/*******************************
 * TRAINEE SEARCH FILTER
 *******************************/
document.getElementById("trainee-search").addEventListener("input", (event) => {
  const searchText = event.target.value.toLowerCase();
  const traineeCards = document.querySelectorAll(".trainee-card");

  traineeCards.forEach((card) => {
    const username = card.querySelector("h2").textContent.toLowerCase();
    const email = card.querySelector("p").textContent.toLowerCase();
    if (username.includes(searchText) || email.includes(searchText)) {
      card.style.display = ""; // Show the card
    } else {
      card.style.display = "none"; // Hide the card
    }
  });
});

/*******************************
 * FETCH MACHINES
 *******************************/
async function fetchMachines() {
  try {
    const response = await fetch(machinesApiEndpoint, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Failed to fetch machines.");

    const responseBody = await response.json();
    console.log("Raw Response Body:", responseBody);

    // Parse the nested body if it's a string
    const machines =
      typeof responseBody.body === "string"
        ? JSON.parse(responseBody.body)
        : responseBody.body;

    console.log("Parsed Machines:", machines);

    const machineSelect = document.getElementById("machine-select");

    machines.forEach((machine) => {
      const option = document.createElement("option");
      option.value = machine.Name; // Assuming machine has 'Name' property
      option.textContent = `${machine.Name} (${machine.Location})`;
      machineSelect.appendChild(option);
    });

    console.log("Machines fetched and populated successfully.");
  } catch (error) {
    console.error("Error fetching machines:", error);
    alert("Failed to load machines.");
  }
}

/*******************************
 * MACHINE SELECT HANDLER
 *******************************/
function machineSelected() {
  const machineSelect = document.getElementById("machine-select").value;
  const setsContainer = document.getElementById("sets-container");

  if (!machineSelect) {
    // No machine selected, hide sets section
    setsContainer.style.display = "none";
    return;
  }

  // If machine is already in trainingProgram, load its sets
  const existingMachine = trainingProgram.find(
    (item) => item.machine === machineSelect
  );
  if (existingMachine) {
    currentSets = [...existingMachine.sets]; // Load existing sets
  } else {
    // Otherwise start fresh
    currentSets = [];
  }

  // Show sets container
  setsContainer.style.display = "block";

  // Reset index to 0 and display
  currentSetIndex = 0;
  displayCurrentSet();
}

/*******************************
 * DISPLAY CURRENT SET
 *******************************/
function displayCurrentSet() {
  const setTitle = document.getElementById("set-title");
  const weightInput = document.getElementById("weight");
  const repsInput = document.getElementById("repetitions");

  if (currentSets.length === 0) {
    // If no sets, create a default empty set
    currentSets.push({ weight: "", reps: "" });
    currentSetIndex = 0;
  }

  // Ensure currentSetIndex is in range
  if (currentSetIndex < 0) currentSetIndex = 0;
  if (currentSetIndex > currentSets.length - 1) {
    currentSetIndex = currentSets.length - 1;
  }

  // Update set title
  setTitle.textContent = `Set ${currentSetIndex + 1} of ${currentSets.length}`;

  // Fill input fields from currentSets
  weightInput.value = currentSets[currentSetIndex].weight;
  repsInput.value = currentSets[currentSetIndex].reps;
}

/*******************************
 * NAVIGATE SETS (LEFT/RIGHT)
 *******************************/
function navigateSet(direction) {
  if (currentSets.length === 0) {
    alert("No sets to navigate. Please add a set first.");
    return;
  }

  if (direction === "prev") {
    if (currentSetIndex > 0) {
      currentSetIndex--;
      displayCurrentSet();
    }
  } else if (direction === "next") {
    if (currentSetIndex < currentSets.length - 1) {
      currentSetIndex++;
      displayCurrentSet();
    }
  }
}

/*******************************
 * ADD A NEW SET (WITH CONFIRMATION)
 *******************************/
function addNewSet() {
  Swal.fire({
    title: "Add Another Set?",
    text: "Are you sure you want to add a new set?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#3498db",
    cancelButtonColor: "#e74c3c",
    confirmButtonText: "Yes, Add Set",
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      // Add the new set
      currentSets.push({ weight: "", reps: "" });
      currentSetIndex = currentSets.length - 1;
      displayCurrentSet();
      Swal.fire("Set Added!", "A new set has been added.", "success");
    }
  });
}

function saveMachineSets() {
  const machineSelect = document.getElementById("machine-select");
  const machineName = machineSelect.value;

  if (!machineName) {
    Swal.fire("Error", "Please select a machine first.", "error");
    return;
  }

  if (currentSets.length === 0) {
    Swal.fire("Error", "No sets found for this machine.", "error");
    return;
  }

  Swal.fire({
    title: "Add Machine To Program?",
    text: `Are you sure you want to save this machine with its sets?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3498db",
    cancelButtonColor: "#e74c3c",
    confirmButtonText: "Yes, Save",
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      // Add machine to program
      const existingMachineIndex = trainingProgram.findIndex(
        (item) => item.machine === machineName
      );

      if (existingMachineIndex >= 0) {
        trainingProgram[existingMachineIndex].sets = [...currentSets];
      } else {
        trainingProgram.push({
          machine: machineName,
          sets: [...currentSets],
        });
      }

      updateProgramPreview();
    }
  });
}


/*******************************
 * DELETE SET (FROM PREVIEW)
 *******************************/
function deleteSet(machineName, setIndex) {
  const machine = trainingProgram.find((m) => m.machine === machineName);
  if (!machine) return;

  // Remove the set from that machine
  machine.sets.splice(setIndex, 1);

  // If no sets left, remove the machine entirely
  if (machine.sets.length === 0) {
    trainingProgram = trainingProgram.filter((m) => m.machine !== machineName);
  }

  // ----- Keep the modal in sync if this is the currently selected machine -----
  const selectedMachine = document.getElementById("machine-select").value;
  if (machineName === selectedMachine) {
    // Re-sync currentSets with trainingProgram for this machine
    const updatedMachine = trainingProgram.find(
      (m) => m.machine === machineName
    );
    if (updatedMachine) {
      currentSets = [...updatedMachine.sets];
    } else {
      currentSets = []; // machine is fully removed
    }
    currentSetIndex = 0;
    // If there are still sets left, display them
    if (currentSets.length > 0) {
      displayCurrentSet();
    } else {
      // If no sets left, hide the container or let it auto-create a blank set
      document.getElementById("sets-container").style.display = "none";
    }
  }

  updateProgramPreview();
}

/*******************************
 * EDIT SET (FROM PREVIEW)
 *******************************/
function editSet(machineName, setIndex) {
  // Open the modal if it's not open already
  const modal = document.getElementById("programModal");
  if (modal.style.display === "none" || modal.style.display === "") {
    openProgramModal();
  }

  // Select the machine in the dropdown
  const machineSelect = document.getElementById("machine-select");
  machineSelect.value = machineName;

  // Load that machine's sets
  machineSelected(); // This will read from trainingProgram and place sets in currentSets

  // Navigate to the chosen set
  currentSetIndex = setIndex;
  displayCurrentSet();
}

/*******************************
 * PROGRAM PREVIEW
 *******************************/
function updateProgramPreview() {
  const previewContainer = document.getElementById("program-preview");
  previewContainer.innerHTML = "";

  trainingProgram.forEach((program) => {
    const programDiv = document.createElement("div");
    programDiv.className = "program-box";

    let setsHTML = "";
    program.sets.forEach((set, index) => {
      setsHTML += `
        <div class="set-info">
          <span>Set ${index + 1}: ${set.weight} kg, ${set.reps} reps</span>
          <button class="btn-delete" onclick="deleteSet('${program.machine}', ${index})">
            Delete
          </button>
          <button class="btn-edit" onclick="editSet('${program.machine}', ${index})">
            Edit
          </button>
        </div>
      `;
    });

    programDiv.innerHTML = `
      <h3>${program.machine}</h3>
      ${setsHTML}
    `;
    previewContainer.appendChild(programDiv);
  });
}

/*******************************
 * SELECT USER FOR TRAINING PROGRAM
 *******************************/
function selectUser(email) {
  selectedUserEmail = email;
  openProgramModal();
}

/*******************************
 * SUBMIT PROGRAM (POST)
 *******************************/
async function submitProgram() {
  if (trainingProgram.length === 0) {
    alert("Add at least one machine and at least one set before submitting.");
    return;
  }

  if (!selectedUserEmail) {
    alert("No user selected for the training program.");
    return;
  }

  const trainerName = getTrainerName();
  if (!trainerName) return;

  const bodyPayload = {
    UserEmail: selectedUserEmail,
    TrainerName: trainerName,
  };

  const queryParameters = {
    PlanDetails: JSON.stringify(trainingProgram),
  };

  try {
    const response = await fetch(
      `${trainingProgramApiEndpoint}?PlanDetails=${encodeURIComponent(
        queryParameters.PlanDetails
      )}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyPayload),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to submit training program.");
    }

    const result = await response.json();
    console.log("Program submitted successfully:", result);
    alert("Training program submitted successfully!");

    // Reset after submission
    trainingProgram = [];
    selectedUserEmail = "";
    updateProgramPreview();
    closeProgramModal();
  } catch (error) {
    console.error("Error submitting training program:", error);
    alert("Failed to submit training program. Please try again.");
  }
}

/*******************************
 * OPEN PROGRAM MODAL
 *******************************/
function openProgramModal() {
  document.getElementById("programModal").style.display = "flex";
  // Reset the dropdown so user picks a machine
  document.getElementById("machine-select").value = "";
  document.getElementById("sets-container").style.display = "none";
}

/*******************************
 * CLOSE PROGRAM MODAL
 *******************************/
function closeProgramModal() {
  document.getElementById("programModal").style.display = "none";
}

/*******************************
 * ON PAGE LOAD
 *******************************/
document.addEventListener("DOMContentLoaded", () => {
  fetchMachines();
  fetchTrainees();
});
