// ======================================================
    // ENDPOINTS & AUTH
    // ======================================================
    const ENDPOINTS = {
      MACHINES:
        "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/Machines",
      TRAINING:
        "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/Records",
    };

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
    // NOTIFICATIONS (SweetAlert2 helpers)
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
    // MACHINES (Optional)
    // ======================================================
    async function loadMachines() {
      const container = document.querySelector(".machines-container");
      if (!container) return; // If not on this page, skip

      try {
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

    async function displayMachines(machines) {
      const container = document.querySelector(".machines-container");
      if (!container) return;
      container.innerHTML = "";

      for (const machine of machines) {
        const card = await createMachineCard(machine);
        container.appendChild(card);
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

        await updateWorkout(machine.MachineID, weight, sets, reps);
        // Clear fields on success
        weightInput.value = "";
        setInput.value = "";
        repInput.value = "";
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
          Repetitions: reps,
        };

        const response = await fetch(ENDPOINTS.TRAINING, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(workoutData),
        });

        if (!response.ok) throw new Error("Failed to update workout");
        await showSuccess("Workout updated successfully!");
      } catch (error) {
        console.error("Error updating workout:", error);
        showError("Failed to update workout");
      }
    }

    // ======================================================
    // DATA TABLE (inline editing with DataTables)
    // ======================================================

    let dataTable; // We'll keep a reference to our DataTable

    // 1. Fetch and populate data
    async function fetchDataAndPopulateTable() {
      try {
        const userSub = getUserSub();
        if (!userSub) {
          console.error("User sub is missing");
          return;
        }

        const trainingUrl = `${ENDPOINTS.TRAINING}?userId=${userSub}`;
        const response = await fetch(trainingUrl);
        if (!response.ok) throw new Error("Failed to fetch training records");

        const data = await response.json();
        const body = typeof data.body === "string" ? JSON.parse(data.body) : data.body;
        const records = body.records;
        if (!Array.isArray(records)) throw new Error("Records data is not an array");

        // Initialize or clear DataTable
        if (!dataTable) {
          dataTable = $("#recordsTable").DataTable({
            // You can customize DataTables options here
            paging: true,
            searching: true,
            info: true,
          });
        } else {
          dataTable.clear();
        }

        // Add each record as a row. We store recordId in the <tr> dataset.
        records.forEach((record) => {
          const rowNode = dataTable
            .row.add([
              record.set,
              record.repetitions,
              Number(record.weight).toFixed(2),
              record.timestamp || "",
              `<button class="edit-btn">Edit</button>
               <button class="delete-btn">Delete</button>`,
            ])
            .draw(false)
            .node();

          // Attach the recordId to the row (so user never sees it)
          rowNode.dataset.recordId = record.recordId;
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    // 2. Handle inline Edit/Save and Delete with delegated events
    function setupDataTableEventListeners() {
      // Using delegated event listeners on the table body
      const tableBody = document.querySelector("#recordsTable tbody");

      // Inline Edit / Save
      tableBody.addEventListener("click", async (event) => {
        if (event.target.classList.contains("edit-btn")) {
          const btn = event.target;
          const row = btn.closest("tr");
          const recordId = row.dataset.recordId;
          const cells = row.querySelectorAll("td");

          // By default, our columns: 0->set, 1->reps, 2->weight, 3->timestamp, 4->actions
          const setCell = cells[0];
          const repsCell = cells[1];
          const weightCell = cells[2];
          // Timestamp is cell[3], read-only

          if (btn.textContent === "Edit") {
            // Switch to inline editing mode
            const setVal = setCell.textContent.trim();
            const repsVal = repsCell.textContent.trim();
            const weightVal = weightCell.textContent.trim();

            setCell.innerHTML = `<input class="edit-input" type="number" min="1" value="${setVal}">`;
            repsCell.innerHTML = `<input class="edit-input" type="number" min="1" value="${repsVal}">`;
            weightCell.innerHTML = `<input class="edit-input" type="number" step="0.5" min="0" value="${weightVal}">`;

            btn.textContent = "Save";
          } else {
            // "Save" mode -> collect inputs and PUT
            const newSetVal = setCell.querySelector("input").value;
            const newRepsVal = repsCell.querySelector("input").value;
            const newWeightVal = weightCell.querySelector("input").value;

            if (!newSetVal || !newRepsVal || !newWeightVal) {
              showError("Please fill valid numeric values");
              return;
            }

            const payload = {
              set: Number(newSetVal),
              repetitions: Number(newRepsVal),
              weight: Number(newWeightVal),
              // We do NOT send timestamp, the server handles it
            };

            try {
              // PUT /Records/{recordId}
              const response = await fetch(`${ENDPOINTS.TRAINING}/${recordId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              if (!response.ok) throw new Error("Failed to update record");

              await showSuccess("Record updated!");

              // Revert cells to text
              setCell.textContent = payload.set;
              repsCell.textContent = payload.repetitions;
              weightCell.textContent = payload.weight.toFixed(2);

              btn.textContent = "Edit";
            } catch (error) {
              console.error("Error updating record:", error);
              showError(error.message || "Error updating record");
            }
          }
        }

        // Delete
        if (event.target.classList.contains("delete-btn")) {
          const row = event.target.closest("tr");
          const recordId = row.dataset.recordId;
          await deleteRecord(recordId);
        }
      });
    }

    // 3. Deletion logic
    async function deleteRecord(recordId) {
      try {
        const confirmRes = await Swal.fire({
          icon: "warning",
          title: "Delete?",
          text: "Are you sure you want to delete this record?",
          showCancelButton: true,
          confirmButtonText: "Yes, delete it!",
          background: "#2d2d2d",
          color: "#ffffff",
        });
        if (!confirmRes.isConfirmed) return;

        const response = await fetch(`${ENDPOINTS.TRAINING}?recordId=${recordId}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete record");

        await showSuccess("Record deleted!");
        // Refresh the table data
        await fetchDataAndPopulateTable();
      } catch (error) {
        console.error("Error deleting record:", error);
        showError(error.message || "Failed to delete record");
      }
    }

    // ======================================================
    // PAGE LOAD
    // ======================================================
    document.addEventListener("DOMContentLoaded", async () => {
      // Redirect if not logged in
      if (!localStorage.getItem("access_token")) {
        window.location.href = "index.html";
        return;
      }

      displayUserInfo();
      await loadMachines(); // optional

      // Set up DataTable events for inline edit/delete
      setupDataTableEventListeners();

      // Fetch & populate data
      await fetchDataAndPopulateTable();

      // Hook up filters for machines (if used)
      document.getElementById("searchInput")?.addEventListener("input", filterMachines);
      document.getElementById("filterType")?.addEventListener("change", filterMachines);
      document.getElementById("filterTarget")?.addEventListener("change", filterMachines);

      // Logout handler
      document.querySelector(".logOut")?.addEventListener("click", () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("id_token");
        window.location.href = "index.html";
      });
    });