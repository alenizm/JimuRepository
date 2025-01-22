// Cognito Configuration
const cognitoDomain =
  "https://us-east-1gxjtpxbr6.auth.us-east-1.amazoncognito.com";
const clientId = "4stnvic28pb26ps8ihehcfn36a";
const redirectUri = "https://alenizm.github.io/JimuRepository/index.html"; // Redirect after login
const logoutUri = "https://alenizm.github.io/JimuRepository/index.html"; // Redirect after logout

// Cognito URLs
const cognitoLoginUrl = `${cognitoDomain}/login?client_id=${clientId}&response_type=token&scope=aws.cognito.signin.user.admin+email+openid+phone+profile&redirect_uri=${encodeURIComponent(
  redirectUri
)}`;
const cognitoLogoutUrl = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(
  logoutUri
)}`;

// Redirect to Cognito login
function redirectToLogin() {
  console.log("Redirecting to Cognito login...");
  window.location.href = cognitoLoginUrl;
}

// Logout and redirect to the index page
function logout() {
  console.log("Logging out...");
  localStorage.clear(); // Clear all stored tokens
  sessionStorage.setItem("loggedOut", "true"); // Set a logout flag
  window.location.href = "index.html"; // Redirect back to index.html after logout
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

  console.log("User groups:", groups);

  if (groups.includes("trainer")) {
    window.location.href = "trainers.html"; // Redirect trainers to their page
  } else if (groups.includes("trainees")) {
    window.location.href = "trainessNew.html"; // Redirect trainees to their page
  } else {
    alert("You are not authorized to access this application.");
    logout();
  }
}

// Handle session initialization without redirecting to login
function initializeSession() {
  const tokens = getTokensFromUrl();
  if (tokens.idToken) {
    console.log("Token found in URL. Initializing session...");
    localStorage.setItem("id_token", tokens.idToken);
    localStorage.setItem("access_token", tokens.accessToken);

    // Redirect based on the user's role
    redirectToRolePage(tokens.idToken);

    // Clear URL hash to clean up
    window.history.replaceState({}, document.title, window.location.pathname);
  } else {
    console.log("No tokens found in URL. Checking localStorage...");
    const idToken = localStorage.getItem("id_token");
    if (idToken) {
      redirectToRolePage(idToken);
    } else {
      console.log("No valid session. Waiting for user to log in...");
    }
  }
}

// Display user information
function displayUserInfo(pageType) {
  const idToken = localStorage.getItem("id_token");

  if (!idToken) {
    logout(); // Redirect to index.html if no token is found
    return;
  }

  const payload = parseJwt(idToken); // Decode the JWT to extract user information
  console.log("Displaying user info:", payload);

  if (pageType === "trainer") {
    // Display trainer-specific information
    const trainerInfo = document.getElementById("trainer-info");
    if (trainerInfo) {
      trainerInfo.innerText = `Hello, ${payload.email || payload.username}`;
    }
  } else if (pageType === "trainees") {
    // Display trainee-specific information
    const traineeInfo = document.getElementById("trainee-info");
    if (traineeInfo) {
      traineeInfo.innerText = `Hello, ${payload.email || payload.username}`;
    }
  }
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
    initializeSession();
  }

  if (window.location.pathname.includes("trainers.html")) {
    displayUserInfo("trainer");
  }

  if (window.location.pathname.includes("trainees.html")) {
    displayUserInfo("trainees");
  }
});
