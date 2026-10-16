// Client-side API Client & State Helper

const API = {
    getToken() {
        return localStorage.getItem("token");
    },
    getUser() {
        try {
            return JSON.parse(localStorage.getItem("user"));
        } catch {
            return null;
        }
    },
    setAuth(user, token) {
        localStorage.setItem("user", JSON.stringify(user));
        if (token) localStorage.setItem("token", token);
        localStorage.setItem("isLoggedIn", "true");
    },
    clearAuth() {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("isLoggedIn");
    },
    isLoggedIn() {
        return localStorage.getItem("isLoggedIn") === "true";
    },
    async request(url, options = {}) {
        const headers = {
            "Content-Type": "application/json",
            ...(options.headers || {})
        };
        const token = this.getToken();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, { ...options, headers });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || `Request failed with status ${response.status}`);
            }
            return data;
        } catch (err) {
            console.error(`API Error [${url}]:`, err);
            throw err;
        }
    },

    // Auth
    async login(email, password) {
        return await this.request("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password })
        });
    },
    async register(name, email, password) {
        return await this.request("/api/auth/register", {
            method: "POST",
            body: JSON.stringify({ name, email, password })
        });
    },

    // Applications
    async getApplications() {
        return await this.request("/api/applications");
    },
    async getApplication(id) {
        return await this.request(`/api/applications/${id}`);
    },
    async createApplication(data) {
        return await this.request("/api/applications", {
            method: "POST",
            body: JSON.stringify(data)
        });
    },
    async updateApplication(id, data) {
        return await this.request(`/api/applications/${id}`, {
            method: "PUT",
            body: JSON.stringify(data)
        });
    },
    async deleteApplication(id) {
        return await this.request(`/api/applications/${id}`, {
            method: "DELETE"
        });
    }
};

// UI Notifications
function showToast(message, type = "info") {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const icon = type === "success" ? "✓" : type === "error" ? "⚠" : "ℹ";
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "toastOut 0.25s ease-out forwards";
        setTimeout(() => toast.remove(), 250);
    }, 3200);
}

// Dark Mode Controller
function initDarkMode() {
    const isDark = localStorage.getItem("darkMode") === "enabled";
    if (isDark) {
        document.body.classList.add("dark");
        document.documentElement.setAttribute("data-theme", "dark");
    }
}

function toggleDarkMode() {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    if (isDark) {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("darkMode", "enabled");
    } else {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("darkMode", "disabled");
    }
    const btn = document.getElementById("darkToggleBtn");
    if (btn) btn.textContent = isDark ? "☀️" : "🌙";
}

// Execute dark mode on load immediately to avoid flash
initDarkMode();
