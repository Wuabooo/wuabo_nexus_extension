const NEXUS_SERVER_URL = 'http://localhost:5556/import';

function checkBlender() {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');

    // We can't really do a POST check easily without side effects, 
    // so let's just try to reach the server with a dummy request or a GET if we added it.
    // For now, let's assume if the fetch doesn't fail, it's alive.
    fetch('http://localhost:5556/', { method: 'OPTIONS' })
    .then(() => {
        dot.className = 'dot online';
        text.innerText = 'Blender Online';
    })
    .catch(() => {
        dot.className = 'dot offline';
        text.innerText = 'Blender Offline';
    });
}

checkBlender();
setInterval(checkBlender, 5000);
