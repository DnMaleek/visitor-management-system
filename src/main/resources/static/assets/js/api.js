const API_URL = "http://localhost:8080/api";

/**
 * Central fetch helper.
 * - For list/action endpoints:  returns result.data  (the plain array / object)
 * - For auth endpoints:         callers should use  apiRaw()  to get the full ApiResponse
 */
async function api(endpoint, method = "GET", body = null) {
    const token = localStorage.getItem("token");

    const options = {
        method,
        headers: { "Content-Type": "application/json" },
    };

    if (token) options.headers.Authorization = `Bearer ${token}`;
    if (body)  options.body = JSON.stringify(body);

    const response = await fetch(API_URL + endpoint, options);
    const result   = await response.json();

    // Auto-unwrap ApiResponse { success, message, data }
    if (result && typeof result === "object" && "success" in result) {
        return result.data ?? result;
    }
    return result;
}

/** Returns the full ApiResponse object — used by auth.js */
async function apiRaw(endpoint, method = "GET", body = null) {
    const token = localStorage.getItem("token");

    const options = {
        method,
        headers: { "Content-Type": "application/json" },
    };

    if (token) options.headers.Authorization = `Bearer ${token}`;
    if (body)  options.body = JSON.stringify(body);

    const response = await fetch(API_URL + endpoint, options);
    return await response.json();
}
