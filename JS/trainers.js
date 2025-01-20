// Configuration
const apiEndpoint = "https://75605lbiti.execute-api.us-east-1.amazonaws.com/dev/WorkingPlans"; // Replace with your API Gateway endpoint

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

// Function to create a training program
function createTrainingProgram(email, username) {
  const program = prompt(`Enter a training program for ${username}:`);
  if (program) {
    sendTrainingProgram(email, username, program);
  } else {
    alert("No training program entered.");
  }
}

// Function to get all trainees from the "trainees" group
async function getTrainees() {
  try {
    const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

    // List users in the "trainees" group
    const params = {
      UserPoolId: "us-east-1_gXjTPXbr6", // Replace with your User Pool ID
      GroupName: "trainees",
    };

    const result = await cognitoIdentityServiceProvider.listUsersInGroup(params).promise();
    const trainees = result.Users;

    console.log("Trainees:", trainees);

    // Render trainees to the HTML
    const traineesList = document.getElementById("trainees");
    trainees.forEach((user) => {
      const email = user.Attributes.find((attr) => attr.Name === "email").Value;
      const username = user.Username;

      // Create a trainee card
      const card = document.createElement("div");
      card.className = "trainee-card";

      card.innerHTML = `
        <div class="trainee-info">
          <h2>${username}</h2>
          <p>Email: ${email}</p>
        </div>
        <button class="create-program-btn">Create Training Program</button>
      `;

      // Add event listener to the button
      card.querySelector(".create-program-btn").addEventListener("click", () => {
        createTrainingProgram(email, username);
      });

      traineesList.appendChild(card);
    });
  } catch (error) {
    console.error("Error fetching trainees:", error);
    alert("Failed to fetch trainees. Please try again later.");
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
