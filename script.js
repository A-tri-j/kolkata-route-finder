const svg = document.getElementById("map");
const sourceSelect = document.getElementById("source");
const destSelect = document.getElementById("destination");
const output = document.getElementById("output");

// Theme Colors (Matching the Light UX)
const colors = {
    accent: "#4fd1c5", // Soft Cyan
    nodeCore: "#2d3748",
    nodeGlow: "rgba(79, 209, 197, 0.2)",
    roadLine: "#e2e8f0",
    text: "#718096"
};

let nodes = {
    Victoria: { x: 200, y: 260 },
    Howrah: { x: 80, y: 280 },
    Esplanade: { x: 260, y: 230 },
    ParkStreet: { x: 310, y: 270 },
    Maidan: { x: 240, y: 300 },
    Sealdah: { x: 330, y: 210 },
    CollegeStreet: { x: 300, y: 180 },
    ScienceCity: { x: 420, y: 300 },
    SaltLake: { x: 520, y: 240 },
    NewTown: { x: 620, y: 190 },
    EcoPark: { x: 650, y: 240 },
    Airport: { x: 700, y: 140 }
};

let graph = {};
let isPlacingNode = false;
let pendingNodeName = "";

/* --- Node Placement Logic --- */
function addNode() {
    const name = document.getElementById("nodeName").value.trim();
    if (!name) return alert("Please enter a node name first!");
    if (nodes[name]) return alert("Node already exists!");

    pendingNodeName = name;
    isPlacingNode = true;
    output.innerHTML = `<span style="color: ${colors.accent}; font-weight:700;">📍 Click on map to place "${name}"</span>`;
    document.getElementById("nodeName").value = "";
}

svg.addEventListener("click", (e) => {
    if (!isPlacingNode) return;

    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 800;
    const y = ((e.clientY - rect.top) / rect.height) * 500;

    nodes[pendingNodeName] = { x: Math.round(x), y: Math.round(y) };
    graph[pendingNodeName] = {};
    
    isPlacingNode = false;
    pendingNodeName = "";
    
    updateDropdowns();
    drawMap();
    output.innerHTML = "✅ Node added!";
});

/* --- Drawing & Rendering --- */
function drawMap() {
    svg.innerHTML = "";
    
    // 1. Draw Background Roads (Light Gray)
    for (let u in graph) {
        for (let v in graph[u]) {
            if (u < v) drawLine(u, v);
        }
    }
    
    // 2. Draw Interactive Nodes
    for (let node in nodes) {
        const { x, y } = nodes[node];
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

        // Subtle Halo
        const glow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        glow.setAttribute("cx", x); glow.setAttribute("cy", y); glow.setAttribute("r", 12);
        glow.setAttribute("fill", colors.nodeGlow);
        g.appendChild(glow);

        // Small Professional Core
        const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", 5);
        c.setAttribute("fill", colors.nodeCore);
        g.appendChild(c);

        // Modern Labels
        const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
        t.setAttribute("x", x + 12); t.setAttribute("y", y + 4);
        t.textContent = node;
        t.setAttribute("font-size", "11px");
        t.setAttribute("font-weight", "500");
        t.setAttribute("fill", colors.text);
        t.style.fontFamily = "'Inter', sans-serif";
        g.appendChild(t);
        
        svg.appendChild(g);
    }
    updateStartMarker();
}

function drawLine(u, v) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", nodes[u].x); line.setAttribute("y1", nodes[u].y);
    line.setAttribute("x2", nodes[v].x); line.setAttribute("y2", nodes[v].y);
    line.setAttribute("stroke", colors.roadLine);
    line.setAttribute("stroke-width", "2");
    line.setAttribute("stroke-linecap", "round");
    svg.appendChild(line);
}

function updateStartMarker() {
    const startNode = sourceSelect.value;
    if (!startNode || !nodes[startNode]) return;

    const oldMarker = document.getElementById("start-marker");
    if (oldMarker) oldMarker.remove();

    const { x, y } = nodes[startNode];
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "text");
    marker.textContent = "📍";
    marker.setAttribute("id", "start-marker");
    marker.setAttribute("x", x - 10); 
    marker.setAttribute("y", y - 10);
    marker.setAttribute("font-size", "20");
    svg.appendChild(marker);
}

/* --- Navigation & Animation --- */
function findPath() {
    const src = sourceSelect.value;
    const dst = destSelect.value;
    if (src === dst) return (output.innerHTML = "You are already there!");
    
    const result = dijkstra(src, dst);
    if (result.path.length === 0) {
        output.innerHTML = "❌ No connection found.";
        return;
    }
    
    // Update the result UI (Matches the new HTML placeholders)
    output.innerHTML = `${src} to ${dst}`;
    const distElement = document.getElementById("distance-val");
    if(distElement) distElement.innerText = `${result.distance} km`;

    animateRoute(result);
}

function animateRoute(result) {
    const path = result.path;
    svg.querySelectorAll(".temp-anim, #animPath").forEach(el => el.remove());

    let dString = `M ${nodes[path[0]].x} ${nodes[path[0]].y}`;
    for (let i = 1; i < path.length; i++) dString += ` L ${nodes[path[i]].x} ${nodes[path[i]].y}`;

    // Elegant Cyan Path
    const animPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    animPath.setAttribute("d", dString);
    animPath.setAttribute("id", "animPath");
    animPath.setAttribute("fill", "none");
    animPath.setAttribute("stroke", colors.accent);
    animPath.setAttribute("stroke-width", "4");
    animPath.setAttribute("stroke-linejoin", "round");
    animPath.setAttribute("stroke-linecap", "round");
    svg.appendChild(animPath);

    // Car Animation
    const walker = document.createElementNS("http://www.w3.org/2000/svg", "text");
    walker.textContent = "🚗";
    walker.setAttribute("font-size", "20");
    walker.setAttribute("class", "temp-anim");

    const move = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
    move.setAttribute("dur", "2s");
    move.setAttribute("repeatCount", "1");
    move.setAttribute("fill", "freeze");
    move.setAttribute("rotate", "auto");

    const mpath = document.createElementNS("http://www.w3.org/2000/svg", "mpath");
    mpath.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#animPath");
    
    move.appendChild(mpath);
    walker.appendChild(move);
    svg.appendChild(walker);
}

/* --- Dijkstra Utility (Logical Core - No Changes) --- */
function dijkstra(start, end) {
    const dist = {}; const parent = {}; const visited = new Set();
    Object.keys(nodes).forEach(n => dist[n] = Infinity);
    dist[start] = 0;

    while (visited.size < Object.keys(nodes).length) {
        let u = null; let min = Infinity;
        for (let n in nodes) {
            if (!visited.has(n) && dist[n] < min) { min = dist[n]; u = n; }
        }
        if (u === null || u === end) break;
        visited.add(u);
        for (let v in graph[u]) {
            let alt = dist[u] + graph[u][v];
            if (alt < dist[v]) { dist[v] = alt; parent[v] = u; }
        }
    }
    const path = []; let cur = end;
    while (cur) { path.unshift(cur); cur = parent[cur]; }
    return { distance: dist[end], path: dist[end] === Infinity ? [] : path };
}

/* --- Initialization --- */
function updateDropdowns() {
    sourceSelect.innerHTML = "";
    destSelect.innerHTML = "";
    Object.keys(nodes).sort().forEach(n => {
        sourceSelect.add(new Option(n, n));
        destSelect.add(new Option(n, n));
    });
    sourceSelect.value = "Howrah";
    destSelect.value = "Airport";
}

sourceSelect.addEventListener("change", updateStartMarker);

function init() {
    for (let n in nodes) graph[n] = {};
    const roads = [
        ["Howrah", "Esplanade"], ["Esplanade", "Sealdah"], ["Esplanade", "Victoria"],
        ["Victoria", "Maidan"], ["Maidan", "ParkStreet"], ["Sealdah", "CollegeStreet"],
        ["ParkStreet", "ScienceCity"], ["ScienceCity", "SaltLake"], ["SaltLake", "NewTown"],
        ["NewTown", "EcoPark"], ["NewTown", "Airport"], ["ScienceCity", "Victoria"]
    ];
    roads.forEach(r => {
        const d = Math.round(Math.sqrt(Math.pow(nodes[r[0]].x-nodes[r[1]].x, 2) + Math.pow(nodes[r[0]].y-nodes[r[1]].y, 2))/10);
        graph[r[0]][r[1]] = d; graph[r[1]][r[0]] = d;
    });
    updateDropdowns();
    drawMap();
}
/* --- Add Connection Logic --- */
function addEdge() {
    const from = document.getElementById("fromNode").value.trim();
    const to = document.getElementById("toNode").value.trim();
    const w = parseInt(document.getElementById("weight").value);

    // 1. Validation
    if (!nodes[from] || !nodes[to]) {
        return alert("One or both nodes do not exist! Please add the nodes first.");
    }
    if (isNaN(w) || w <= 0) {
        return alert("Please enter a valid distance (number).");
    }

    // 2. Update the Logical Graph (Bi-directional)
    if (!graph[from]) graph[from] = {};
    if (!graph[to]) graph[to] = {};
    
    graph[from][to] = w;
    graph[to][from] = w;

    // 3. Clear inputs and feedback
    document.getElementById("fromNode").value = "";
    document.getElementById("toNode").value = "";
    document.getElementById("weight").value = "";

    // 4. Redraw the map to show the new line
    drawMap();
    output.innerHTML = `✅ Connected ${from} and ${to} (${w}km)`;
}

init();