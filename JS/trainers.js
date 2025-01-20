// API Gateway Endpoint for the Lambda Function
const apiEndpoint = "https://75605lbiti.execute-api.us-east-1.amazonaws.com/dev/trainees"; // Replace with your API Gateway endpoint

// Function to fetch trainees using API Gateway
async function getTrainees() {
  try {
    // Show the loading spinner
    document.getElementById("loading").style.display = "block";

    // Specify User Pool ID and Group Name in the query string
    const userPoolId = "us-east-1_gXjTPXbr6"; // Replace with your User Pool ID
    const groupName = "trainees"; // Replace with the name of your group

    const response = await fetch(`${apiEndpoint}?UserPoolId=${userPoolId}&GroupName=${groupName}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Hide the loading spinner
    document.getElementById("loading").style.display = "none";

    if (!response.ok) {
      throw new Error("Failed to fetch trainees");
    }

    // Parse the response JSON
    const responseBody = await response.json();

    // Check if the response contains a valid array
    const trainees = Array.isArray(responseBody) ? responseBody : JSON.parse(responseBody.body);

    console.log("Trainees fetched successfully:", trainees);

    // Render trainees to the HTML
    const traineesList = document.getElementById("trainees");
    trainees.forEach((trainee) => {
      const card = document.createElement("div");
      card.className = "trainee-card";

      card.innerHTML = `
        <div class="trainee-info">
          <h2>${trainee.username}</h2>
          <p>Email: ${trainee.email}</p>
        </div>
        <button class="create-program-btn">Create Training Program</button>
      `;

      // Add event listener to the button
      card.querySelector(".create-program-btn").addEventListener("click", () => {
        createTrainingProgram(trainee.email, trainee.username);
      });

      traineesList.appendChild(card);
    });
  } catch (error) {
    console.error("Error fetching trainees:", error);
    alert("Failed to fetch trainees. Please try again later.");
  }
}

// Function to create a training program
function createTrainingProgram(email, username) {
  const program = prompt(`Enter a training program for ${username}:`);
  if (program) {
    console.log(`Training program for ${email}: ${program}`);
    alert(`Training program created for ${email}`);
    // Add API call to save the training program if needed
  } else {
    alert("No training program entered.");
  }
}

// Search function
function searchTrainees() {
  const searchTerm = document.getElementById("search").value.toLowerCase();
  const traineeCards = document.querySelectorAll(".trainee-card");

  traineeCards.forEach((card) => {
    const name = card.querySelector(".trainee-info h2").textContent.toLowerCase();
    if (name.includes(searchTerm)) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}

// Event Listener for Page Load
document.addEventListener("DOMContentLoaded", () => {
  const logoutButton = document.getElementById("logout-btn");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "index.html"; // Redirect to login page
    });
  }

  getTrainees(); // Fetch and display trainees
});
