// ------------------------------------
// Cognito Configuration
// ------------------------------------
const cognitoDomain = "https://us-east-1gxjtpxbr6.auth.us-east-1.amazoncognito.com";
const clientId = "4stnvic28pb26ps8ihehcfn36a";
const redirectUri = "https://alenizm.github.io/JimuRepository/loading.html";
const logoutUri = "https://alenizm.github.io/JimuRepository/index.html";

const cognitoLoginUrl = `${cognitoDomain}/login?client_id=${clientId}&response_type=token&scope=aws.cognito.signin.user.admin+email+openid+phone+profile&redirect_uri=${encodeURIComponent(redirectUri)}`;
const cognitoLogoutUrl = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;

// ------------------------------------
// API Endpoints
// ------------------------------------
const ENDPOINTS = {
    MACHINES: "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/Machines",
    TRAINEES: "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/trainees",
    TRAINING: "https://75605lbiti.execute-api.us-east-1.amazonaws.com/prod/WorkingPlans"
};

// ------------------------------------
// Utility Functions
// ------------------------------------
function redirectToLogin() {
    console.log("Redirecting to Cognito login...");
    window.location.href = cognitoLoginUrl;
}

function logout() {
    console.log("Logging out...");
    localStorage.clear();
    sessionStorage.setItem("loggedOut", "true");
    window.location.href = "index.html";
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
        window.location.href = "trainers.html";
    } else if (groups.includes("trainees")) {
        window.location.href = "dashboard.html"; // Updated to new dashboard
    } else {
        alert("You are not authorized to access this application.");
        logout();
    }
}

// ------------------------------------
// Loading Page Logic
// ------------------------------------
function initializeSessionOnLoadingPage() {
    const tokens = getTokensFromUrl();

    function greetUserIfPossible(token) {
        const greetingEl = document.getElementById("loading-greeting");
        if (greetingEl && token) {
            const payload = parseJwt(token);
            const username = payload["cognito:username"] || payload.email || "User";
            greetingEl.textContent = `Hello, ${username}!`;
        }
    }

    if (tokens.idToken) {
        console.log("Token found in URL. Initializing session...");
        localStorage.setItem("id_token", tokens.idToken);
        localStorage.setItem("access_token", tokens.accessToken);
        window.history.replaceState({}, document.title, window.location.pathname);
        greetUserIfPossible(tokens.idToken);
        fetchDataAndRedirect(tokens.idToken);
    } else {
        const idToken = localStorage.getItem("id_token");
        if (idToken) {
            console.log("Session found in localStorage. Redirecting...");
            greetUserIfPossible(idToken);
            fetchDataAndRedirect(idToken);
        } else {
            console.log("No valid session. Returning to index.");
            window.location.href = "index.html";
        }
    }
}

async function fetchDataAndRedirect(idToken) {
    try {
        const response = await fetch(ENDPOINTS.MACHINES);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        const machines = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
        if (!machines) throw new Error('No data received');
        
        redirectToRolePage(idToken);
    } catch (error) {
        console.error("Error during fetch:", error);
        showError('Failed to fetch data. Please try again.');
    }
}

// ------------------------------------
// User Info Display
// ------------------------------------
function displayUserInfo(pageType) {
    const idToken = localStorage.getItem("id_token");
    if (!idToken) {
        logout();
        return;
    }

    const payload = parseJwt(idToken);
    const username = payload.email || payload["cognito:username"];

    switch(pageType) {
        case "trainer":
            const trainerInfo = document.getElementById("trainer-info");
            if (trainerInfo) {
                trainerInfo.innerText = `Hello, ${username}`;
            }
            break;
        case "dashboard":
            const userGreeting = document.querySelector('.user-greeting');
            if (userGreeting) {
                userGreeting.textContent = `Hello, ${username}`;
            }
            updateDashboardData(username);
            break;
    }
}

async function updateDashboardData(username) {
    try {
        const machinesResponse = await fetch(ENDPOINTS.MACHINES);
        const machinesData = await machinesResponse.json();
        
        const container = document.querySelector('.machines-container');
        if (container) {
            container.innerHTML = '';
            const machines = typeof machinesData.body === 'string' ? 
                JSON.parse(machinesData.body) : machinesData.body;
            
            machines.forEach(machine => {
                container.appendChild(createMachineElement(machine));
            });
            
            setupFilters(machines);
        }
    } catch (error) {
        console.error("Dashboard update error:", error);
        showError('Failed to load dashboard data');
    }
}

// ------------------------------------
// Event Listeners
// ------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    const loginButton = document.getElementById("login-btn");
    if (loginButton) {
        loginButton.addEventListener("click", redirectToLogin);
    }

    const logoutButton = document.querySelector(".logOut");
    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }

    if (window.location.pathname.includes("loading.html")) {
        initializeSessionOnLoadingPage();
    } else if (window.location.pathname.includes("trainers.html")) {
        displayUserInfo("trainer");
    } else if (window.location.pathname.includes("dashboard.html")) {
        displayUserInfo("dashboard");
    }
});

// ------------------------------------
// Error Handling
// ------------------------------------
function showError(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message,
            background: '#2d2d2d',
            color: '#ffffff',
            confirmButtonColor: '#4CAF50'
        });
    } else {
        alert(message);
    }
}