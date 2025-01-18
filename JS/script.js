// Cognito Configuration
const cognitoLoginUrl =
  "https://us-east-1gxjtpxbr6.auth.us-east-1.amazoncognito.com/login?client_id=4stnvic28pb26ps8ihehcfn36a&response_type=token&scope=aws.cognito.signin.user.admin+email+openid+phone+profile&redirect_uri=https%3A%2F%2Falenizm.github.io%2FJimuRepository%2Findex.html";

// Redirect to Cognito login
function redirectToLogin() {
  window.location.href = cognitoLoginUrl;
}

// Parse tokens from the URL hash
function getTokensFromUrl() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  return {
    idToken: params.get("id_token"),
    accessToken: params.get("access_token"),
  };
}

// Parse a JWT token to get user details
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

// Redirect user based on their role
function redirectToRolePage(idToken) {
  const payload = parseJwt(idToken);
  const groups = payload["cognito:groups"] || [];

  if (groups.includes("trainer")) {
    window.location.href = "trainers.html"; // Redirect trainers to their page
  } else if (groups.includes("trainees")) {
    window.location.href = "trainees.html"; // Redirect trainees to their page
  } else {
    alert("You are not authorized to access this application.");
    logout();
  }
}

// Handle tokens and redirect
function handleLoginRedirect() {
  const tokens = getTokensFromUrl();
  if (tokens.idToken) {
    // Save tokens in localStorage
    localStorage.setItem("id_token", tokens.idToken);
    localStorage.setItem("access_token", tokens.accessToken);

    // Redirect based on role
    redirectToRolePage(tokens.idToken);

    // Clear URL hash to clean up
    window.history.replaceState({}, document.title, window.location.pathname);
  } else {
    // If no tokens are available, redirect to login
    redirectToLogin();
  }
}

function logout() {
  // Cognito logout URL
  const cognitoLogoutUrl =
    "https://us-east-1gxjtpxbr6.auth.us-east-1.amazoncognito.com/logout?client_id=4stnvic28pb26ps8ihehcfn36a&logout_uri=https%3A%2F%2Falenizm.github.io%2FJimuRepository%2Findex.html";

  // Clear local storage to remove tokens
  localStorage.clear();

  // Redirect to Cognito logout endpoint to end session and then back to index.html
  window.location.href = cognitoLogoutUrl;
}


// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  const loginButton = document.getElementById("login-btn");
  if (loginButton) {
    loginButton.addEventListener("click", redirectToLogin);
  }

  const logoutButton = document.getElementById("logout-btn");
  if (logoutButton) {
    logoutButton.addEventListener("click", logout);
  }

  if (window.location.pathname.includes("index.html")) {
    handleLoginRedirect();
  }

  if (window.location.pathname.includes("trainers.html")) {
    displayUserInfo("trainer");
  }

  if (window.location.pathname.includes("trainees.html")) {
    displayUserInfo("trainee");
  }
});

// Display user information for trainers or trainees
function displayUserInfo(pageType) {
  const idToken = localStorage.getItem("id_token");
  if (!idToken) {
    logout();
    return;
  }

  const payload = parseJwt(idToken);

  if (pageType === "trainer") {
    document.getElementById("trainer-info").innerText = `Hello, ${payload.email}`;

    // Mock: Fetch trainees (replace with API call if necessary)
    const trainees = [
      { id: 1, name: "John Doe" },
      { id: 2, name: "Jane Smith" },
    ];

    const traineeList = document.getElementById("trainee-list");
    trainees.forEach((trainee) => {
      const li = document.createElement("li");
      li.innerText = trainee.name;
      traineeList.appendChild(li);
    });
  }

  if (pageType === "trainee") {
    document.getElementById("trainee-info").innerText = `Hello, ${payload.email}`;

    // Mock: Fetch machines (replace with API call if necessary)
    const machines = [
      { id: 1, name: "Treadmill" },
      { id: 2, name: "Bench Press" },
    ];

    const machineList = document.getElementById("machine-list");
    machines.forEach((machine) => {
      const li = document.createElement("li");
      li.innerText = machine.name;
      machineList.appendChild(li);
    });
  }
}
