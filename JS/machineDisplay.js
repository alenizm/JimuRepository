// כתובת ה-API Gateway
const MACHINES_API_ENDPOINT = "https://<your-api-gateway-url>/machines";

// פונקציה למשיכת המידע של המכשירים
async function fetchMachines() {
  try {
    const response = await fetch(MACHINES_API_ENDPOINT, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Failed to fetch machines");

    const responseBody = await response.json();

    // בדיקה אם ה-body הוא מחרוזת JSON או אובייקט
    const machines =
      typeof responseBody.body === "string"
        ? JSON.parse(responseBody.body)
        : responseBody.body;

    console.log("Machines fetched:", machines);

    renderMachines(machines);
  } catch (error) {
    console.error("Error fetching machines:", error);
    Swal.fire("Error", "Failed to load machines.", "error");
  }
}

// פונקציה לרינדור המכשירים בעמוד
function renderMachines(machines) {
  const machinesContainer = document.querySelector(".machines-container");
  machinesContainer.innerHTML = ""; // ניקוי תוכן קודם

  machines.forEach((machine) => {
    const machineCard = document.createElement("div");
    machineCard.classList.add("machine-card");

    // טיפול במקרה שבו אין תמונה
    const imageSrc = machine.image && machine.image.trim() !== "" ? machine.image : "default-image.jpg";

    machineCard.innerHTML = `
      <img src="${imageSrc}" alt="${machine.name}" class="machine-image" onerror="this.src='default-image.jpg'">
      <div class="machine-details">
        <h2 class="machine-title">${machine.name || "Unnamed Machine"}</h2>
        <p class="machine-weight">Last Weight: ${machine.weight || "N/A"}</p>
        <button class="update-button" data-id="${machine.id}">Update Weight</button>
      </div>
    `;

    machinesContainer.appendChild(machineCard);
  });
}

// פונקציה לעדכון המשקל של מכשיר
async function updateMachineWeight(machineId, newWeight) {
  try {
    const updateResponse = await fetch(`${MACHINES_API_ENDPOINT}/${machineId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ weight: newWeight }),
    });

    if (!updateResponse.ok) throw new Error("Failed to update weight");

    console.log(`Machine ${machineId} updated to weight: ${newWeight}`);
    Swal.fire("Success!", "Weight updated successfully!", "success");

    // רענון נתוני המכשירים
    fetchMachines();
  } catch (error) {
    console.error("Error updating weight:", error);
    Swal.fire("Error", "Failed to update weight.", "error");
  }
}

// הוספת אירועי לחיצה לכפתורי "עדכון"
document.addEventListener("DOMContentLoaded", () => {
  fetchMachines(); // משיכת נתוני המכשירים בעת טעינת הדף

  const machinesContainer = document.querySelector(".machines-container");

  machinesContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("update-button")) {
      const machineId = e.target.getAttribute("data-id");
      Swal.fire({
        title: "Update Weight",
        input: "text",
        inputLabel: "Enter new weight (kg):",
        inputValidator: (value) => {
          if (!value || isNaN(value) || value <= 0) {
            return "Please enter a valid positive number";
          }
        },
        showCancelButton: true,
        confirmButtonText: "Update",
      }).then((result) => {
        if (result.isConfirmed) {
          const newWeight = result.value;
          updateMachineWeight(machineId, newWeight);
        }
      });
    }
  });
});