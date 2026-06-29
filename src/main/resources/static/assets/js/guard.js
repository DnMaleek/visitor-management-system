function requireAuth() {
    const token = localStorage.getItem("token");

    if(!token) {
        location = "../../index.html"
    }
}

function requireRole () {
    const role = localStorage.getItem("role");

    if(!role) {
        alert("Access denied")

        location = "../../index.html"
    }
}