// ------------------------------------
// Cognito Configuration (unchanged except redirectUri):
// ------------------------------------
const cognitoDomain =
  "https://us-east-1gxjtpxbr6.auth.us-east-1.amazoncognito.com";
const clientId = "4stnvic28pb26ps8ihehcfn36a";

// 1) Use loading.html as the Cognito callback
const redirectUri = "https://alenizm.github.io/JimuRepository/loading.html";
const logoutUri = "https://alenizm.github.io/JimuRepository/index.html";

const cognitoLoginUrl = `${cognitoDomain}/login?client_id=${clientId}&response_type=token&scope=aws.cognito.signin.user.admin+email+openid+phone+profile&redirect_uri=${encodeURIComponent(
  redirectUri
)}`;
const cognitoLogoutUrl = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(
  logoutUri
)}`;

// ------------------------------------
// Basic Utility Functions
// ------------------------------------
function redirectToLogin() {
  console.log("Redirecting to Cognito login...");
  window.location.href = cognitoLoginUrl;
}

function logout() {
  console.log("Logging out...");
  localStorage.clear(); // Clear all stored tokens
  sessionStorage.setItem("loggedOut", "true"); // Set a logout flag
  window.location.href = "index.html"; // Redirect back to index.html after logout
}

function getTokensFromUrl() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  return {
    idToken: params.get("id_token"),
    accessToken: params.get("access_token"),
  };
}

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

// ------------------------------------
// Role-based Redirection
// ------------------------------------
function redirectToRolePage(idToken) {
  const payload = parseJwt(idToken);
  const groups = payload["cognito:groups"] || [];
  console.log("User groups:", groups);

  if (groups.includes("trainer")) {
    window.location.href = "trainers.html"; // Redirect trainers
  } else if (groups.includes("trainees")) {
    window.location.href = "trainessNew.html"; // Redirect trainees
  } else {
    alert("You are not authorized to access this application.");
    logout();
  }
}

// ------------------------------------
// Loading Page Logic
// ------------------------------------
// ------------------------------------
// Loading Page Logic
// ------------------------------------
function initializeSessionOnLoadingPage() {
  const tokens = getTokensFromUrl();

  // Helper to greet user if we can decode token
  function greetUserIfPossible(token) {
    const greetingEl = document.getElementById("loading-greeting");
    if (greetingEl && token) {
      const payload = parseJwt(token);
      const username = payload["cognito:username"] || payload.email || "User";
      greetingEl.textContent = `Hello, ${username}!`;
    }
  }

  if (tokens.idToken) {
    console.log("Token found in URL on loading page. Initializing session...");
    localStorage.setItem("id_token", tokens.idToken);
    localStorage.setItem("access_token", tokens.accessToken);

    // Clear URL hash
    window.history.replaceState({}, document.title, window.location.pathname);

    // Greet user
    greetUserIfPossible(tokens.idToken);

    // Fetch data and redirect once completed
    fetchDataAndRedirect(tokens.idToken);
  } else {
    // No token in URL, see if we have one in localStorage
    const idToken = localStorage.getItem("id_token");
    if (idToken) {
      console.log(
        "Session found in localStorage. Redirecting after short delay..."
      );
      greetUserIfPossible(idToken);

      // Fetch data and redirect once completed
      fetchDataAndRedirect(idToken);
    } else {
      // No tokens found anywhere, go back to index
      console.log("No valid session. Going back to index.");
      window.location.href = "index.html";
    }
  }
}

// Fetch Data Logic
async function fetchDataAndRedirect(idToken) {
  try {
    const response = await fetch(
      "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/Machines"
    ); // הכנס את ה-API שלך
    const data = await response.json();
    console.log("Fetched data:", data);

    // Once fetch is complete, redirect based on role
    redirectToRolePage(idToken);
  } catch (error) {
    console.error("Error during fetch:", error);
  }
}

// ------------------------------------
// Display user info on trainers/trainees pages
// ------------------------------------
function displayUserInfo(pageType) {
  const idToken = localStorage.getItem("id_token");
  if (!idToken) {
    logout(); // If no token, force logout / go to index
    return;
  }

  const payload = parseJwt(idToken);
  console.log("Displaying user info:", payload);

  if (pageType === "trainer") {
    const trainerInfo = document.getElementById("trainer-info");
    if (trainerInfo) {
      trainerInfo.innerText = `Hello, ${
        payload.email || payload["cognito:username"]
      }`;
    }
  } else if (pageType === "trainees") {
    const traineeInfo = document.getElementById("trainee-info");
    if (traineeInfo) {
      traineeInfo.innerText = `Hello, ${
        payload.email || payload["cognito:username"]
      }`;
    }
  }
}

// ------------------------------------
// DOMContentLoaded
// ------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // If we have a login button on index.html
  const loginButton = document.getElementById("login-btn");
  if (loginButton) {
    loginButton.addEventListener("click", redirectToLogin);
  }

  // If we have a logout button on any page
  const logoutButton = document.getElementById("logout-btn");
  if (logoutButton) {
    logoutButton.addEventListener("click", logout);
  }

  // If we are on loading.html
  if (window.location.pathname.includes("loading.html")) {
    initializeSessionOnLoadingPage();
  }

  // If on trainers page
  if (window.location.pathname.includes("trainers.html")) {
    displayUserInfo("trainer");
  }

  // If on trainees page
  if (window.location.pathname.includes("trainees.html")) {
    displayUserInfo("trainees");
  }
});
