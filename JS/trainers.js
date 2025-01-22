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
let trainingProgram = []; // Array to store machines and their sets
let selectedUserEmail = ""; // Store selected user email

// For handling the current machine's sets
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
        <button class="create-program-btn" onclick="selectUser('${trainee.email}')">Create Training Program</button>
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
 * ENABLE SET FIELDS AFTER MACHINE SELECT
 *******************************/
function enableSetFields() {
  const machineSelect = document.getElementById("machine-select");
  const setsContainer = document.getElementById("sets-container");
  const weightInput = document.getElementById("weight");
  const repetitionsInput = document.getElementById("repetitions");

  // If a machine is selected, allow set entry
  if (machineSelect.value !== "") {
    // Show the sets container
    setsContainer.style.display = "block";
    // Enable weight/reps
    weightInput.disabled = false;
    repetitionsInput.disabled = false;

    // Initialize currentSets and currentSetIndex fresh for this machine
    currentSets = [];
    currentSetIndex = 0;
  } else {
    // Hide the sets container
    setsContainer.style.display = "none";
    // Clear out any data
    weightInput.value = "";
    repetitionsInput.value = "";
    weightInput.disabled = true;
    repetitionsInput.disabled = true;
  }
}

/*******************************
 * ADD A SINGLE SET TO currentSets
 *******************************/
function addSet() {
  const machineSelect = document.getElementById("machine-select");
  if (!machineSelect.value) {
    alert("Please select a machine before adding a set.");
    return;
  }
  const weightValue = document.getElementById("weight").value;
  const repsValue = document.getElementById("repetitions").value;

  if (!weightValue || !repsValue) {
    alert("Please enter weight and repetitions.");
    return;
  }

  // Push the new set into currentSets
  currentSets.push({ weight: weightValue, reps: repsValue });

  // Clear the inputs for the next set
  document.getElementById("weight").value = "";
  document.getElementById("repetitions").value = "";

  alert("Set added to current machine. Don’t forget to click 'Add Machine To Program' to finalize.");
}

/*******************************
 * ADD MACHINE (AND ITS SETS) TO THE TRAINING PROGRAM
 *******************************/
function addMachineToProgram() {
  const machineSelect = document.getElementById("machine-select").value;
  if (!machineSelect) {
    alert("Please select a machine first.");
    return;
  }

  if (currentSets.length === 0) {
    alert("No sets added for this machine.");
    return;
  }

  // Check if the machine already exists in the program
  const existingMachine = trainingProgram.find(
    (item) => item.machine === machineSelect
  );

  if (existingMachine) {
    // Overwrite sets for the existing machine
    existingMachine.sets = [...currentSets];
  } else {
    // Add new machine + sets
    trainingProgram.push({ machine: machineSelect, sets: [...currentSets] });
  }

  // Reset for next machine selection
  document.getElementById("machine-select").value = "";
  enableSetFields(); // This will hide sets container again
  updateProgramPreview();
}

/*******************************
 * UPDATE PROGRAM PREVIEW
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
          <span>Set ${index + 1}: ${set.weight}kg, ${set.reps} reps</span>
          <button class="btn-delete" onclick="deleteSet('${program.machine}', ${index})">Delete</button>
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
 * DELETE A SET FROM PREVIEW
 *******************************/
function deleteSet(machineName, setIndex) {
  const machine = trainingProgram.find((item) => item.machine === machineName);
  if (machine) {
    machine.sets.splice(setIndex, 1);
    if (machine.sets.length === 0) {
      // Remove the machine entirely if no sets left
      trainingProgram = trainingProgram.filter(
        (item) => item.machine !== machineName
      );
    }
  }
  updateProgramPreview();
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
    alert("Add at least one machine and sets to the program before submitting.");
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
    TrainerName: trainerName, // Use the trainer's name
  };

  const queryParameters = {
    PlanDetails: JSON.stringify(trainingProgram), // Convert training program to JSON string
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
  // Reset any selections or fields
  document.getElementById("machine-select").value = "";
  enableSetFields(); // This will hide the sets container initially
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
