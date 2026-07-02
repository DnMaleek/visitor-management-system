function requireAuth() {
    const token = localStorage.getItem("token");

    if(!token) {
        location = "../../login.html"
    }
}

function requireRole () {
    const role = localStorage.getItem("role");

    if(!role) {
        alert("Access denied")

        location = "../../login.html"
    }
}