// Cognito Configuration
const cognitoDomain = "https://us-east-1gxjtpxbr6.auth.us-east-1.amazoncognito.com";
const clientId = "4stnvic28pb26ps8ihehcfn36a";

// 1) Change callback to your new loading page
const redirectUri = "https://alenizm.github.io/JimuRepository/loading.html"; 
const logoutUri = "https://alenizm.github.io/JimuRepository/index.html"; 

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

// This function determines the user role and redirects accordingly
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

/**
 * 2) We only run initializeSession on the loading page (where the user lands after Cognito).
 *    - Extract tokens from URL
 *    - Store them
 *    - Clear the hash
 *    - Then do a small delay before final redirect
 */
function initializeSessionOnLoadingPage() {
  const tokens = getTokensFromUrl();
  if (tokens.idToken) {
    console.log("Token found in URL on loading page. Initializing session...");
    localStorage.setItem("id_token", tokens.idToken);
    localStorage.setItem("access_token", tokens.accessToken);

    // Clear URL hash to clean up
    window.history.replaceState({}, document.title, window.location.pathname);

    // Optional: Show a short delay on loading page before redirecting
    setTimeout(() => {
      redirectToRolePage(tokens.idToken);
    }, 3000); // 3 second delay
  } else {
    // No token in the URL: check if we have an existing session
    const idToken = localStorage.getItem("id_token");
    if (idToken) {
      console.log("Session found in localStorage. Redirecting based on token.");
      setTimeout(() => {
        redirectToRolePage(idToken);
      }, 3000);
    } else {
      // No tokens found anywhere, send user back to index or prompt login
      console.log("No valid session. Going back to index.");
      window.location.href = "index.html";
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

  /**
   * 3) If we are on loading.html, we run initializeSessionOnLoadingPage().
   *    If we are on trainers.html or trainees.html, we display the user info.
   */
  if (window.location.pathname.includes("loading.html")) {
    initializeSessionOnLoadingPage();
  }

  if (window.location.pathname.includes("trainers.html")) {
    displayUserInfo("trainer");
  }

  if (window.location.pathname.includes("trainees.html")) {
    displayUserInfo("trainees");
  }
});
