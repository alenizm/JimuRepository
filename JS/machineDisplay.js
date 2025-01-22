let selectedMachineId = null; // משתנה גלובלי לשמירת ה-ID

/*******************************
 * AUTH & TOKEN UTILITIES
 * (Optional) If your app uses JWT from Cognito
 *******************************/
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
const accessToken = localStorage.getItem("access_token");
console.log("Access Token:", accessToken); // בדוק את הערך של ה-token

function getTrainerName() {
  const accessToken = localStorage.getItem("access_token");
  if (!accessToken) {
    Swal.fire("Error", "No access token found. Please log in.", "error");
    return null;
  }

  const decodedToken = parseJwt(accessToken);
  if (!decodedToken) {
    Swal.fire(
      "Error",
      "Failed to decode token. Invalid token format.",
      "error"
    );
    return null;
  }

  // חיפוש שמות משתמשים אפשריים בטוקן
  const trainerName =
    decodedToken.name ||
    decodedToken.username ||
    decodedToken.sub ||
    decodedToken.preferred_username ||
    decodedToken.email;

  if (!trainerName) {
    Swal.fire("Error", "User ID not found in token.", "error");
    return null;
  }

  return trainerName;
}

let UserID = getTrainerName();
console.log("Trainer Name (UserID):", UserID);
fetch("https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/Machines")
  .then((response) => response.json())
  .then((data) => {
    console.log(data); // בדיקה בקונסול

    const listElement = document.querySelector(".list");

    const machines =
      typeof data.body === "string" ? JSON.parse(data.body) : data.body;

    machines.forEach((machine) => {
      const itemElement = document.createElement("div");
      itemElement.classList.add("item");

      const imageUrl = machine.ImageURL || "default-image.jpg"; // תמונה ברירת מחדל

      itemElement.innerHTML = `
        <img src="${imageUrl}" alt="${machine.Name}" />
        <div class="introduce">
            <div class="title">MACHINE SELECTION</div>
            <div class="topic">${machine.Name}</div>
            <div class="des">${machine.Description}</div>
            <button class="chooseMachine">More Info &#8599;</button>
        </div>
      `;

      listElement.appendChild(itemElement);

      const button = itemElement.querySelector(".chooseMachine");

      if (button) {
        button.addEventListener("click", () => {
          console.log("כפתור 1 נלחץ");

          // יצירת חלון קופץ
          const modal = document.createElement("div");
          modal.classList.add("modal");

          modal.innerHTML = `
            <div class="modal-content">
              <span class="close-button">&times;</span>
              <h2 class="modal-title">${machine.Name}</h2>
              <p class="modal-description">${machine.Description}</p>
              <table class="modal-table">
                <tr><td>Machine Name</td><td>${machine.Name}</td></tr>
                <tr><td>Type</td><td>${machine.Type}</td></tr>
                <tr><td>Brand</td><td>${machine.Brand}</td></tr>
                <tr><td>Target Body Part</td><td>${
                  machine.TargetBodyPart
                }</td></tr>
                <tr><td>Availability</td><td>${
                  machine.Availability === "true"
                    ? "Available"
                    : "Not Available"
                }</td></tr>
              </table>
               <button class="WorkoutButton" data-machine-id="${
                 machine.MachineID
               }">Define a personal workout.</button>
              <button class="backButton">Back</button>
            </div>
          `;

          document.body.appendChild(modal);

          // הפעלת אנימציה
          setTimeout(() => modal.classList.add("visible"), 10);

          const closeButton = modal.querySelector(".close-button");
          const backButton = modal.querySelector(".backButton");

          const closeModal = () => {
            modal.classList.remove("visible");
            setTimeout(() => modal.remove(), 300);
          };

          closeButton.addEventListener("click", closeModal);
          backButton.addEventListener("click", closeModal);

          // הוספת האזנה לכפתור "Define a personal workout"
          const button2 = modal.querySelector(".WorkoutButton");
          if (button2) {
            button2.addEventListener("click", () => {
              console.log("כפתור 2 נלחץ");

              // שליפת ה-MachineID מהמאפיין של כפתור האימון
              selectedMachineId = button2.getAttribute("data-machine-id"); // שמירת ה-ID

              console.log("Machine ID for workout:", selectedMachineId);

              // יצירת חלון קופץ נוסף להגדרת האימון
              const secondModal = document.createElement("div");
              secondModal.classList.add("modal");

              secondModal.innerHTML = `
              <div class="modal-content">
                <span class="close-button">&times;</span>
                <h2 class="modal-title">Define Your Personal Workout</h2>
                <p class="modal-description">Set the repetitions, weight, sets, and duration for your workout.</p>
                <table class="modal-table">
                  <tr>
                    <td>Repetitions:</td>
                    <td><input type="number" id="repetitions" name="repetitions" min="1" required></td>
                  </tr>
                  <tr>
                    <td>Sets:</td>
                    <td><input type="number" id="sets" name="sets" min="1" required></td>
                  </tr>
                  <tr>
                    <td>Weight (kg):</td>
                    <td><input type="number" id="weight" name="weight" min="1" required></td>
                  </tr>
                  <tr>
                    <td>Duration (minutes):</td>
                    <td><input type="number" id="duration" name="duration" min="1" required></td>
                  </tr>
                </table>
                <button type="submit" class="confirmButton">Click to confirm</button>
                <button class="backButton">Back</button>
              </div>
            `;

              document.body.appendChild(secondModal);

              // הפעלת אנימציה
              setTimeout(() => secondModal.classList.add("visible"), 10);

              const closeButton2 = secondModal.querySelector(".close-button");
              const backButton2 = secondModal.querySelector(".backButton");

              const closeModal2 = () => {
                secondModal.classList.remove("visible");
                setTimeout(() => secondModal.remove(), 300);
              };

              closeButton2.addEventListener("click", closeModal2);
              backButton2.addEventListener("click", closeModal2);
            });
          }
        });
      }
    });
  })
  .catch((error) => {
    console.error("Error fetching machines:", error);
  });

document.body.addEventListener("click", (event) => {
  if (event.target.classList.contains("confirmButton")) {
    // יצירת חלון קופץ לאישור
    const confirmationModal = document.createElement("div");
    confirmationModal.classList.add("modal");

    confirmationModal.innerHTML = `
        <div class="modal-content">
          <span class="close-button">&times;</span>
          <h2 class="modal-title">Confirmation</h2>
          <p class="modal-description">Are you sure these are your personal workout settings?</p>
          <div class="modal-buttons">
            <button class="confirm-yes">Yes</button>
            <button class="confirm-no">No</button>
          </div>
        </div>
      `;

    document.body.appendChild(confirmationModal);

    // הצגת המודל
    setTimeout(() => confirmationModal.classList.add("visible"), 10);

    const closeButton = confirmationModal.querySelector(".close-button");
    const confirmYes = confirmationModal.querySelector(".confirm-yes");
    const confirmNo = confirmationModal.querySelector(".confirm-no");

    const closeConfirmationModal = () => {
      confirmationModal.classList.remove("visible");
      setTimeout(() => confirmationModal.remove(), 300);
    };

    // מאזינים לכפתורים
    closeButton.addEventListener("click", closeConfirmationModal);
    confirmNo.addEventListener("click", closeConfirmationModal);

    confirmYes.addEventListener("click", () => {
      console.log("The user confirmed the workout settings.");
      closeConfirmationModal();
      sendWorkoutData(); // קריאה לפונקציה ששולחת את הנתונים
    });

    // פונקציה לשליחה ל-DynamoDB אחרי שהמשתמש מאשר את האימון
    const sendWorkoutData = () => {
      // אוספים את הערכים שהמשתמש הזין
      const repetitions = document.getElementById("repetitions").value;
      const sets = document.getElementById("sets").value;
      const weight = document.getElementById("weight").value;
      const duration = document.getElementById("duration").value; // שדה חדש

      // הדפסת הנתונים שהמשתמש הזין
      console.log("Repetitions:", repetitions);
      console.log("Sets:", sets);
      console.log("Weight:", weight);
      console.log("Duration:", duration); // הדפסת duration

      // יש לוודא שהערכים תקינים לפני שליחתם
      if (!repetitions || !sets || !weight || !duration) {
        alert("All fields must be filled in.");
        return;
      }

      // כתובת ה-API של Lambda
      const apiUrl =
        "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/Records";
      let UserID = getTrainerName();
      console.log("Trainer Name (UserID):", UserID);

      const payload = {
        UserID: UserID, // השתמש בשם המשתמש שנשלף מהטוקן
        MachineID: selectedMachineId, // משתמש ב-MachineID שנשמר קודם
        Repetitions: repetitions,
        Set: sets,
        Weight: weight,
        Duration: duration, // שליחה של duration
      };

      // הדפסת ה-payload לפני שליחתו
      console.log(
        "Sending the following payload to Lambda:",
        JSON.stringify(payload)
      );
      // המרת ה- payload ל-string
      const payloadString = JSON.stringify(payload);

      // שליחת הנתונים ל-Lambda
      fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: payloadString, // שלח את המחרוזת
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Response from Lambda:", data);
          alert("Workout has been added successfully!");
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("An error occurred while saving your workout.");
        });
    };
  }
});
