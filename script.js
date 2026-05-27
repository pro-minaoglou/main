// --- 1. Animation Εμφάνισης Κειμένων (GSAP) ---
gsap.from(".hero-content > *", {
    y: 40,
    opacity: 0,
    duration: 1.2,
    stagger: 0.2,
    ease: "power3.out",
    delay: 0.5
});

// --- Animation Εμφάνισης Μενού (GSAP) ---
gsap.from(".top-nav ul li", {
    y: -20,
    opacity: 0,
    duration: 1,
    stagger: 0.1,
    ease: "power3.out",
    delay: 0.2
});


// --- 2. Διαδραστικό Φόντο (Μικρό Scale & Επαναφορά μετά από 1 δευτ.) ---
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let points = [];
const spacing = 50; 

let effectRadius = 180; 
let mouse = { x: -1000, y: -1000 };
let prevMouse = { x: -1000, y: -1000 };

let charge = 0; 
let stillFrames = 0; // Νέος μετρητής για τον χρόνο ακινησίας

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initGrid();
}
window.addEventListener('resize', resize);

window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
});

window.addEventListener('mouseout', () => {
    mouse.x = -1000;
    mouse.y = -1000;
});

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.originX = x; 
        this.originY = y; 
        this.vx = 0;
        this.vy = 0;
        this.friction = 0.82; 
        this.springFactor = 0.12; 
        this.colorFactor = 0; 
    }

    update() {
        let targetX = this.originX;
        let targetY = this.originY;
        let distMouse = 9999;

        if (mouse.x !== -1000) {
            let dxMouse = this.originX - mouse.x;
            let dyMouse = this.originY - mouse.y;
            distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

            if (distMouse < effectRadius) {
                let intensity = Math.pow((effectRadius - distMouse) / effectRadius, 2); 
                
                // Ακόμα μικρότερο μέγιστο scale (πολλαπλασιαστής 0.2 αντί για 0.4)
                let maxScaleAmount = 0.1 + (0.2 * charge); 
                let currentScale = 1 + (intensity * maxScaleAmount); 

                targetX = mouse.x + (dxMouse * currentScale);
                targetY = mouse.y + (dyMouse * currentScale);
            }
        }

        // Φυσική ελατηρίου
        this.vx += (targetX - this.x) * this.springFactor;
        this.vy += (targetY - this.y) * this.springFactor;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx;
        this.y += this.vy;

        // Υπολογισμός Χρώματος
        if (distMouse < effectRadius && mouse.x !== -1000) {
            let intensity = Math.pow((effectRadius - distMouse) / effectRadius, 2);
            let targetColorFactor = intensity * (0.15 + 0.85 * charge);
            this.colorFactor += (targetColorFactor - this.colorFactor) * 0.05; 
        } else {
            this.colorFactor += (0 - this.colorFactor) * 0.05; 
        }
    }
}

let cols, rows;

function initGrid() {
    points = [];
    cols = Math.floor(width / spacing) + 1;
    rows = Math.floor(height / spacing) + 1;

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            points.push(new Point(j * spacing, i * spacing));
        }
    }
}

function getColor(p1, p2) {
    let factor = (p1.colorFactor + p2.colorFactor) / 2;
    
    let r = Math.floor(255 + (150 - 255) * factor);
    let g = Math.floor(255 + (10 - 255) * factor);
    let b = Math.floor(255 + (40 - 255) * factor);
    
    let a = 0.08 + (0.62 * factor); 

    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    
    // --- Υπολογισμός Ακινησίας και "Ξεφουσκώματος" ---
    let mouseSpeed = 0;
    if (mouse.x !== -1000 && prevMouse.x !== -1000) {
        let dx = mouse.x - prevMouse.x;
        let dy = mouse.y - prevMouse.y;
        mouseSpeed = Math.sqrt(dx * dx + dy * dy);
    }
    prevMouse.x = mouse.x;
    prevMouse.y = mouse.y;

    if (mouse.x !== -1000) {
        if (mouseSpeed > 2) {
            // Αν το ποντίκι κινείται: μηδενισμός χρονομέτρου, το charge πέφτει (πάει στο μικρό εφέ)
            stillFrames = 0;
            charge -= 0.04; 
        } else {
            // Αν είναι ακίνητο, αυξάνουμε τα καρέ ακινησίας
            stillFrames++;
            
            // Σπάσιμο ανά 10 frames για απόλυτα ομαλό παλμό (Sine Wave Easing)

            // --- 1. Φάση Αύξησης / Φόρτισης (0 έως 50 frames) ---
            if (stillFrames < 10) {
                charge += 0.002;  // 0-10: Ελάχιστη εκκίνηση (Ease-in)
            } else if (stillFrames < 20) {
                charge += 0.005;  // 10-20: Απαλή επιτάχυνση
            } else if (stillFrames < 30) {
                charge += 0.009;  // 20-30: Μέγιστη ταχύτητα αύξησης (Κορυφή καμπύλης)
            } else if (stillFrames < 40) {
                charge += 0.005;  // 30-40: Απαλή επιβράδυνση
            } else if (stillFrames < 50) {
                charge += 0.002;  // 40-50: Ομαλό "φρενάρισμα" πριν σταματήσει (Ease-out)
            } 
            
            // --- 2. Φάση Μείωσης / Ξεφουσκώματος (50 frames και πάνω) ---
            else if (stillFrames < 60) {
                charge -= 0.002;  // 50-60: Ανεπαίσθητη έναρξη υποχώρησης (Ease-in)
            } else if (stillFrames < 70) {
                charge -= 0.005;  // 60-70: Σταδιακή επιτάχυνση καθόδου
            } else if (stillFrames < 80) {
                charge -= 0.009;  // 70-80: Μέγιστη ταχύτητα καθόδου
            } else if (stillFrames < 90) {
                charge -= 0.005;  // 80-90: Απαλή επιβράδυνση καθόδου
            } else if (stillFrames < 100) {
                charge -= 0.003;  // 90-100: Πολύ ομαλό σβήσιμο (Ease-out)
            } else {
                charge -= 0.001; // 100+: Σχεδόν στατική επιστροφή στην απόλυτη ηρεμία
            }
        }
    } else {
        // Αν το ποντίκι φύγει από την οθόνη
        stillFrames = 0;
        charge -= 0.05; 
    }
    
    // Κρατάμε το charge μεταξύ 0 (μικρό εφέ) και 1 (μέγιστο επιτρεπτό εφέ)
    charge = Math.max(0, Math.min(1, charge));
    // ------------------------------------------------

    ctx.lineWidth = 1.2; 

    points.forEach(p => p.update());

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            let index = i * cols + j;
            let p = points[index];

            if (j < cols - 1) {
                let rightPoint = points[index + 1];
                ctx.strokeStyle = getColor(p, rightPoint);
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(rightPoint.x, rightPoint.y);
                ctx.stroke();
            }

            if (i < rows - 1) {
                let bottomPoint = points[index + cols];
                ctx.strokeStyle = getColor(p, bottomPoint);
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(bottomPoint.x, bottomPoint.y);
                ctx.stroke();
            }
        }
    }

    requestAnimationFrame(animate);
}

resize();
animate();