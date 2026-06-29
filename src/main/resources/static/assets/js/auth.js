async function login() {
    const username = document.getElementById("name").value;
    const password = document.getElementById("password").value;

    const result = await api("auth/login", "POST", {name:username, password:password});

    if(result.success) {
        localStorage.setItem("token", result.data.token);

        localStorage.setItem("username", result.data.username);

        localStorage.setItem("role", result.data.role);

        redirectUser(result.data.role);

    } else {
        document.getElementById("error").innerText = result.message;
    }
}

function redirectUser(role){

    switch(role){

    case "ADMIN":

        location="/pages/admin/dashboard.html";
        break;

    case "HOST":

        location="/pages/host/pending.html";
        break;

    case "SECURITY_GUARD":

        location="/pages/security/register.html";
        break;
    }

}