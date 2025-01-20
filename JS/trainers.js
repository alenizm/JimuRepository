// API Gateway Endpoint for the Lambda Function
const apiEndpoint = "https://75605lbiti.execute-api.us-east-1.amazonaws.com/dev/trainees"; // Replace with your API Gateway endpoint

// Function to send a POST request with the training program
async function sendTrainingProgram(email, username, programDetails) {
  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        username: username,
        trainingProgram: programDetails,
      }),
    });

    const result = await response.json();
    if (response.ok) {
      alert(`Training program sent successfully to ${email}`);
    } else {
      console.error("Error sending training program:", result);
      alert("Failed to send training program. Please try again.");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred while sending the training program.");
  }
}

// Function to fetch trainees using API Gateway
async function getTrainees() {
  try {
    // Specify User Pool ID and Group Name in the query string
    const userPoolId = "us-east-1_gXjTPXbr6"; // Replace with your User Pool ID
    const groupName = "trainees"; // Replace with the name of your group

    const response = await fetch(`${apiEndpoint}?UserPoolId=${userPoolId}&GroupName=${groupName}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      

    if (!response.ok) {
      throw new Error("Failed to fetch trainees");
    }

    const trainees = await response.json();

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
    sendTrainingProgram(email, username, program);
  } else {
    alert("No training program entered.");
  }
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
