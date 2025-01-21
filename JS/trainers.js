// API Gateway Endpoints
const machinesApiEndpoint = "https://75605lbiti.execute-api.us-east-1.amazonaws.com/dev/Machines"; // Replace with your endpoint
const trainingProgramApiEndpoint = "https://75605lbiti.execute-api.us-east-1.amazonaws.com/dev/WorkingPlans"; // Replace with your endpoint
const traineesApiEndpoint = "https://75605lbiti.execute-api.us-east-1.amazonaws.com/dev/trainees"; // Replace with your endpoint

let trainingProgram = []; // Array to store machines and their sets
let selectedUserEmail = ""; // Store selected user email
let currentSets = []; // Store the sets for the current machine
let currentSetIndex = 0; // Track the current set index

function enableSetFields() {
    const machineSelect = document.getElementById("machine-select");
    const weightInput = document.getElementById("weight");
    const repetitionsInput = document.getElementById("repetitions");

    // Enable or disable fields based on the machine selection
    if (machineSelect.value !== "") {
        weightInput.disabled = false;
        repetitionsInput.disabled = false;
    } else {
        weightInput.disabled = true;
        repetitionsInput.disabled = true;
    }
}


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

// Fetch Trainees from API
async function fetchTrainees() {
    try {
        const userPoolId = "us-east-1_gXjTPXbr6"; // Replace with your User Pool ID
        const groupName = "trainees"; // Replace with the name of your group

        const response = await fetch(`${traineesApiEndpoint}?UserPoolId=${userPoolId}&GroupName=${groupName}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

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

// Add Trainee Search Functionality
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

// Fetch Machines from API
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
        const parsedBody = typeof responseBody.body === "string"
            ? JSON.parse(responseBody.body)
            : responseBody.body;

        console.log("Parsed Body:", parsedBody);

        // Access the machines array
        const machines = parsedBody.machines || [];
        console.log("Machines Array:", machines);

        if (!Array.isArray(machines)) {
            throw new Error("Machines data is not in the expected array format.");
        }

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

// Add Machine to Program
function addMachineToProgram() {
    const machineName = document.getElementById("machine-select").value;
    if (!machineName) {
        alert("Select a machine.");
        return;
    }

    // Check if the machine already exists in the program
    const existingMachine = trainingProgram.find((item) => item.machine === machineName);
    if (existingMachine) {
        existingMachine.sets = [...currentSets];
    } else {
        trainingProgram.push({ machine: machineName, sets: [...currentSets] });
    }

    document.getElementById("sets-container").innerHTML = "";
    currentSets = [];
    currentSetIndex = 0;

    updateProgramPreview(); // Update the preview grid
}

// Enable Set Fields
document.getElementById("machine-select").addEventListener("change", () => {
    const machineSelect = document.getElementById("machine-select").value;
    const weightInput = document.querySelector("#sets-container input[type='number']");
    const repsInput = document.querySelector("#sets-container input[type='number']");

    if (machineSelect) {
        weightInput.disabled = false;
        repsInput.disabled = false;
    } else {
        weightInput.disabled = true;
        repsInput.disabled = true;
    }
});

// Update Program Preview
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

// Delete Set
function deleteSet(machineName, setIndex) {
    const machine = trainingProgram.find((item) => item.machine === machineName);
    if (machine) {
        machine.sets.splice(setIndex, 1);
        if (machine.sets.length === 0) {
            trainingProgram = trainingProgram.filter((item) => item.machine !== machineName);
        }
    }

    updateProgramPreview();
}

//add set
function addSet() {
    currentSets.push({ weight: "", reps: "" });
    navigateSet("next");
  }

// Select User for Training Program
function selectUser(email) {
    selectedUserEmail = email;
    openProgramModal();
}

// Navigate Between Sets
function navigateSet(direction) {
    const setsContainer = document.getElementById("sets-container");

    if (direction === "next") {
        if (currentSetIndex === currentSets.length - 1) {
            if (confirm("Do you want to add a new set?")) {
                currentSets.push({ weight: "", reps: "" });
                currentSetIndex++;
            } else {
                return;
            }
        } else if (currentSetIndex < currentSets.length - 1) {
            currentSetIndex++;
        }
    } else if (direction === "prev") {
        if (currentSetIndex > 0) {
            currentSetIndex--;
        }
    }

    setsContainer.innerHTML = "";
    if (currentSets[currentSetIndex]) {
        const set = currentSets[currentSetIndex];
        const setDiv = document.createElement("div");
        setDiv.className = "form-group";
        setDiv.innerHTML = `
      <h4>Set ${currentSetIndex + 1}</h4>
      <label for="weight-${currentSetIndex}">Weight (kg):</label>
      <input type="number" id="weight-${currentSetIndex}" value="${set.weight}" onchange="updateSet(${currentSetIndex}, 'weight', this.value)" />
      <label for="reps-${currentSetIndex}">Reps:</label>
      <input type="number" id="reps-${currentSetIndex}" value="${set.reps}" onchange="updateSet(${currentSetIndex}, 'reps', this.value)" />
    `;
        setsContainer.appendChild(setDiv);
    }
}

// Update Set Details
function updateSet(index, field, value) {
    currentSets[index][field] = value;
}

// Submit Program via POST
async function submitProgram() {
    if (trainingProgram.length === 0) {
        alert("Add at least one machine to the program.");
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
        TrainerName: trainerName, // Use the trainer's name instead of ID
    };

    const queryParameters = {
        PlanDetails: JSON.stringify(trainingProgram), // Convert training program to JSON string
    };

    try {
        const response = await fetch(
            `${trainingProgramApiEndpoint}?PlanDetails=${encodeURIComponent(queryParameters.PlanDetails)}`,
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

        // Reset program
        trainingProgram = [];
        selectedUserEmail = "";
        closeProgramModal();
    } catch (error) {
        console.error("Error submitting training program:", error);
        alert("Failed to submit training program. Please try again.");
    }
}

// Open the Modal
function openProgramModal() {
    document.getElementById("programModal").style.display = "flex";
    document.getElementById("machine-select").value = ""; // Reset machine select
    document.getElementById("sets-container").innerHTML = ""; // Clear sets
    currentSets = [{ weight: "", reps: "" }]; // Start with the first set
    currentSetIndex = 0;
    navigateSet(0);
}

// Close the Modal
function closeProgramModal() {
    document.getElementById("programModal").style.display = "none";
}

// Event Listener for Page Load
document.addEventListener("DOMContentLoaded", () => {
    fetchMachines();
    fetchTrainees();
});
