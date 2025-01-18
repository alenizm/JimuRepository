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

// Redirect based on user role
function redirectToRolePage(idToken) {
  const payload = parseJwt(idToken);
  const groups = payload["cognito:groups"] || [];

  if (groups.includes("Trainer")) {
    window.location.href = "trainers.html"; // Redirect trainers to their page
  } else if (groups.includes("Trainee")) {
    window.location.href = "trainees.html"; // Redirect trainees to their page
  } else {
    alert("You are not authorized to access this application.");
    logout();
  }
}

// Handle tokens and redirect
function handleDashboard() {
  const tokens = getTokensFromUrl();
  if (tokens.idToken) {
    // Save tokens in localStorage
    localStorage.setItem("id_token", tokens.idToken);
    localStorage.setItem("access_token", tokens.accessToken);

    // Redirect based on user role
    redirectToRolePage(tokens.idToken);

    // Clear URL hash to clean up
    window.history.replaceState({}, document.title, window.location.pathname);
  } else {
    const idToken = localStorage.getItem("id_token");
    if (idToken) {
      redirectToRolePage(idToken);
    } else {
      // If no tokens are available, redirect to login
      redirectToLogin();
    }
  }
}

// Redirect to Cognito login
function redirectToLogin() {
  const cognitoLoginUrl =
    "https://us-east-1gxjtpxbr6.auth.us-east-1.amazoncognito.com/login?client_id=4stnvic28pb26ps8ihehcfn36a&response_type=token&scope=aws.cognito.signin.user.admin+email+openid+phone+profile&redirect_uri=https%3A%2F%2Falenizm.github.io%2FJimuRepository%2F";
  window.location.href = cognitoLoginUrl;
}

// Logout function
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// Event Listener
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("index.html")) {
    const tokens = getTokensFromUrl();
    if (tokens.idToken) {
      localStorage.setItem("id_token", tokens.idToken);
      localStorage.setItem("access_token", tokens.accessToken);
      redirectToRolePage(tokens.idToken);
    }
  }
});
