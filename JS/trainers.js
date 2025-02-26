/*******************************
 * API ENDPOINTS
 *******************************/
const MACHINES_API_ENDPOINT =
  "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/Machines";
const TRAINEES_API_ENDPOINT =
  "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/trainees";
const TRAINING_PROGRAM_API_ENDPOINT =
  "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/WorkingPlans";
const TRINING_Plans_API_ENDPOINAT =
  "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/TrainerPlans";

// Cognito details
const COGNITO_USER_POOL_ID = "us-east-1_gXjTPXbr6";
const COGNITO_GROUP_NAME = "trainees";

/*******************************
 * GLOBAL VARIABLES
 *******************************/
let selectedUserEmail = "";
let selectedUserSub = ""; // Store the trainee's sub (UserID)

let trainingProgram = []; // [{ machine, sets: [{ weight, reps }, ...] }]
let currentSets = [];
let currentSetIndex = 0;
let username;

/********************************
 * user greeting by user name
 */
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
  username = payload.username || payload["cognito:username"];

  const userGreeting = document.querySelector(".user-greeting");
  if (userGreeting) {
    userGreeting.innerHTML = `Welcome back, <strong>${username}</strong>`;
  }
}

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

  displayUserInfo();

  document.querySelector(".logOut")?.addEventListener("click", () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("id_token");
    window.location.href = "index.html";
  });
});

/*******************************
 * FETCH TRAINEES
 *******************************/

function getAuthHeaders() {
  const accessToken = localStorage.getItem('access_token');
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };
}

async function fetchTrainees() {
  try {
    const response = await fetch(
      `${TRAINEES_API_ENDPOINT}?UserPoolId=${COGNITO_USER_POOL_ID}&GroupName=${COGNITO_GROUP_NAME}`,
      {
        method: "GET",
        headers: getAuthHeaders()
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
        <p>Email:<br>${trainee.email}</p>
        <button onclick="selectUser('${trainee.email}', '${trainee.sub}')">Create Program</button>
      `;
      traineesList.appendChild(card);
    });
  } catch (error) {
    console.error("Error fetching trainees:", error);
    Swal.fire(
      "Error",
      "Failed to fetch trainees. Please try again later.",
      "error"
    );
  }
}

/*******************************
 * FETCH MACHINES
 *******************************/
async function fetchMachines() {
  try {
    const response = await fetch(MACHINES_API_ENDPOINT, {
      method: "GET",
      headers: getAuthHeaders()
    });

    if (!response.ok) throw new Error("Failed to fetch machines");

    const responseBody = await response.json();
    const machines =
      typeof responseBody.body === "string"
        ? JSON.parse(responseBody.body)
        : responseBody.body;

    console.log("Machines fetched:", machines);

    const machineSelect = document.getElementById("machine-select");
    // machineSelect has default <option value="">-- Select a Machine --</option>
    machines.forEach((machine) => {
      const option = document.createElement("option");
      option.value = machine.Name;
      option.textContent = machine.Name;
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
  const searchTerm = document
    .getElementById("trainee-search")
    .value.toLowerCase();
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
  // Reset the program state for a new trainee
  resetProgram();

  selectedUserEmail = email;
  selectedUserSub = sub;
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
  // Also reset the program on close
  resetProgram();
}

/*******************************
 * LOGOUT HANDLER (Optional)
 *******************************/
function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("id_token");
  window.location.href = "index.html";
}

/*******************************
 * RESET PROGRAM
 *******************************/
function resetProgram() {
  trainingProgram = [];
  currentSets = [];
  currentSetIndex = 0;

  // Clear selected user
  selectedUserEmail = "";
  selectedUserSub = "";

  // Clear preview
  updateProgramPreview();

  // Reset machine <select>
  const machineSelect = document.getElementById("machine-select");
  if (machineSelect) {
    machineSelect.value = "";
  }

  // Hide sets container
  const setsContainer = document.getElementById("sets-container");
  if (setsContainer) {
    setsContainer.style.display = "none";
  }
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

  // Check if this machine is already in trainingProgram
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
  // Update current set fields before navigating
  updateCurrentSet("weight", document.getElementById("weight").value);
  updateCurrentSet("reps", document.getElementById("repetitions").value);

  if (direction === "prev" && currentSetIndex > 0) {
    currentSetIndex--;
  } else if (direction === "next") {
    if (currentSetIndex < currentSets.length - 1) {
      currentSetIndex++;
    }
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
  if (currentSetIndex < 0) {
    currentSetIndex = 0;
  }
  if (currentSetIndex >= currentSets.length) {
    currentSetIndex = currentSets.length - 1;
  }

  document.getElementById("set-title").textContent = `Set ${currentSetIndex + 1
    } of ${currentSets.length}`;

  document.getElementById("weight").value = currentSets[currentSetIndex].weight;
  document.getElementById("repetitions").value =
    currentSets[currentSetIndex].reps;
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
  const form = document.getElementById("sets-form");
  // Check if required fields are valid
  if (!form.checkValidity()) {
    form.reportValidity(); // This triggers the browser's default validation UI
    return;
  }

  // Update the current set data
  updateCurrentSet("weight", document.getElementById("weight").value);
  updateCurrentSet("reps", document.getElementById("repetitions").value);

  Swal.fire({
    title: "Add Another Set?",
    text: "Are you sure you want to add a new set?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, Add",
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
  const form = document.getElementById("sets-form");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // Update current set with user input
  updateCurrentSet("weight", document.getElementById("weight").value);
  updateCurrentSet("reps", document.getElementById("repetitions").value);

  const machineName = document.getElementById("machine-select").value;

  if (!machineName) {
    Swal.fire("Error", "Please select a machine first.", "error");
    return;
  }

  Swal.fire({
    title: "Save Sets for Machine?",
    text: "This will save or update the current sets for the selected machine.",
    icon: "info",
    showCancelButton: true,
    confirmButtonText: "Save",
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      const existingIndex = trainingProgram.findIndex(
        (item) => item.machine === machineName
      );

      if (existingIndex >= 0) {
        trainingProgram[existingIndex].sets = [...currentSets];
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
 * UPDATE PROGRAM PREVIEW
 *******************************/
function updateProgramPreview() {
  const previewContainer = document.getElementById("program-preview");
  if (!previewContainer) return;
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

  // If no sets remain, remove that machine from the program
  if (machineObj.sets.length === 0) {
    trainingProgram = trainingProgram.filter((m) => m.machine !== machineName);

    const machineSelect = document.getElementById("machine-select");
    if (machineSelect.value === machineName) {
      machineSelect.value = "";
      currentSets = [];
      currentSetIndex = 0;
      document.getElementById("sets-container").style.display = "none";
    }
  } else {
    // If we're currently editing that machine, update currentSets
    if (machineName === document.getElementById("machine-select").value) {
      currentSets = machineObj.sets;
      currentSetIndex = 0;
      displayCurrentSet();
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

  machineSelected(); // Reload the sets
  currentSetIndex = setIndex;
  displayCurrentSet();
}

/*******************************
 * SUBMIT PROGRAM (with confirmation & loading state)
 *******************************/

async function submitProgram() {
  // Must have at least one machine + at least one set
  if (trainingProgram.length === 0) {
    Swal.fire(
      "Error",
      "Add at least one machine and one set before submitting.",
      "error"
    );
    return;
  }

  // Must have a selected user
  if (!selectedUserEmail || !selectedUserSub) {
    Swal.fire("Error", "No user selected for this training program.", "error");
    return;
  }

  // Get trainer's sub from localStorage
  const trainerSub = getTrainerSub();
  if (!trainerSub) return;

  // Build the request payload
  const bodyPayload = {
    TrainerName: username,
    UserEmail: selectedUserEmail,
    UserID: selectedUserSub,
    TrainerID: trainerSub,
    PlanDetails: trainingProgram,
  };

  // Prompt confirmation before actually sending
  Swal.fire({
    title: "Submit Training Program?",
    text: "Are you sure you want to submit this program?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, Submit",
    cancelButtonText: "Cancel",
  }).then(async (result) => {
    if (result.isConfirmed) {
      // Show a loading state while the fetch is in progress
      Swal.fire({
        title: "Submitting Program...",
        text: "Please wait while we submit the training program.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        const response = await fetch(TRAINING_PROGRAM_API_ENDPOINT, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(bodyPayload)
        });

        if (!response.ok) {
          throw new Error("Failed to submit training program");
        }

        // Close the loading alert
        Swal.close();

        // Show success message
        Swal.fire(
          "Success",
          "Training program submitted successfully!",
          "success"
        ).then(() => {
          // Reset everything on success
          closeProgramModal();

          // Fetch and update the plans in the table
          fetchPlans(); // This will update the table with the latest training programs
        });
      } catch (error) {
        console.error("Error submitting program:", error);
        Swal.fire(
          "Error",
          "Failed to submit training program. Please try again.",
          "error"
        );
      }
    }
  });
}

/*******************************
 * FETCH PLANS
 *******************************/
async function fetchPlans() {
  const trainerName = getTrainerName();
  if (!trainerName) {
    console.error("TrainerName is missing");
    Swal.fire("Error", "TrainerName is missing", "error");
    return;
  }

  const url = `${TRINING_Plans_API_ENDPOINAT}`;
  console.log("Fetching plans from URL:", url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        body: JSON.stringify({
          TrainerName: trainerName
        }),
      }),
    });

    if (!response.ok) throw new Error("Failed to fetch training plans");

    const result = await response.json();
    console.log(result);
    // Parse the result body
    const plans = JSON.parse(result.body).data;
    console.log("Plans fetched successfully:", plans);

    if (plans && Array.isArray(plans)) {
      populateTable(plans);
    } else {
      console.error("Plans data is missing or malformed");
      Swal.fire("Error", "Plans data is missing or malformed.", "error");
    }

    return plans;
  } catch (error) {
    console.error("Error fetching data:", error);
    Swal.fire(
      "Error",
      "Failed to fetch training plans. Please try again later.",
      "error"
    );
    return [];
  }
}

/*******************************
 * POPULATE TABLE
 *******************************/
function populateTable(data) {
  const tableBody = document.getElementById("trainer-table-body");
  tableBody.innerHTML = "";

  // Structure to group data by Email -> PlanID
  const groupedData = {};

  data.forEach((item) => {
    const traineeEmail = item.UserEmail?.S || "No email";
    const planId = item.PlanID?.S || "No PlanID";

    // Ensure structure
    if (!groupedData[traineeEmail]) {
      groupedData[traineeEmail] = {};
    }
    if (!groupedData[traineeEmail][planId]) {
      groupedData[traineeEmail][planId] = [];
    }

    // Gather machines/sets under this plan
    if (item.PlanDetails && Array.isArray(item.PlanDetails.L)) {
      item.PlanDetails.L.forEach((plan) => {
        // Get the machine name
        const machine = plan.M?.machine?.S || "No machine";

        // Retrieve the array of sets
        const setsArray = plan.M?.sets?.L || [];

        // Push each set with all info into groupedData
        setsArray.forEach((set, index) => {
          const weight = set.M?.weight?.S || "No weight";
          const reps = set.M?.reps?.S || "No reps";

          groupedData[traineeEmail][planId].push({
            machine,
            // We'll use index+1 for a "Set #"
            setNumber: index + 1,
            weight,
            reps,
          });
        });
      });
    }
  });

  // Now build rows: one row per (email, planId)
  Object.keys(groupedData).forEach((email) => {
    Object.keys(groupedData[email]).forEach((planId) => {
      const machineSets = groupedData[email][planId];

      // Build the HTML for all machines/sets in this plan
      let planDetailsHTML = "";
      machineSets.forEach((entry) => {
        planDetailsHTML += `
          <div>
            <strong>Machine:</strong> ${entry.machine}<br>
            <strong>Set ${entry.setNumber} - Weight x Reps:</strong>
              ${entry.weight} x ${entry.reps}
          </div>
          <hr>
        `;
      });

      // Create a single row for this plan
      const row = document.createElement("tr");
      row.setAttribute("data-plan-id", planId);

      row.innerHTML = `
        <td>${email}</td>
        <td>${planDetailsHTML}</td>
        <td>
          <button 
            class="delete-btn" 
            onclick="deletePlanById('${planId}')"
          >
            Delete
          </button>
        </td>
      `;

      tableBody.appendChild(row);
    });
  });

  // Initialize DataTables (if you're using it)
  $("#trainer-table").DataTable();
}

/*******************************
 * DELETE SPECIFIC PLAN
 *******************************/
async function deletePlanById(planId) {
  try {
    // 1) Confirm deletion
    const confirmRes = await Swal.fire({
      icon: "warning",
      title: "Delete this plan?",
      text: "Are you sure you want to delete this training plan?",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      background: "#2d2d2d",
      color: "#ffffff",
    });
    if (!confirmRes.isConfirmed) return;

    // 2) Send DELETE request with the planId
    const response = await fetch(TRINING_Plans_API_ENDPOINAT, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        PlanID: planId
      }),
    });

    if (!response.ok) throw new Error("Failed to delete the training plan");

    // 3) Remove the row from the table
    const row = document.querySelector(`tr[data-plan-id="${planId}"]`);
    if (row) {
      row.remove();
    }

    // 4) Success message
    await Swal.fire("Deleted!", "The training plan has been deleted.", "success");
  } catch (error) {
    console.error("Error deleting plan:", error);
    Swal.fire(
      "Error",
      error.message || "Failed to delete the training plan",
      "error"
    );
  }
}

// Fetch plans on initial load
fetchPlans();
