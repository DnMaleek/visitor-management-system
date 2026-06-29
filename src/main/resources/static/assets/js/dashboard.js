async function loadDashboard() {
    const data = await api("/admin/dashboard");

    document.getElementById("total").innerText = data.totalVisitors;
    document.getElementById("pending").innerText = data.pendingVisitors;
    document.getElementById("approved").innerText = data.approvedVisitors;
    document.getElementById("checked").innerText = data.checkedInVisitors;
}