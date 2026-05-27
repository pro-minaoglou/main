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

// --- 2. Διαδραστικό Φόντο με Parallax Εφέ ---
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let points = [];
// const spacing = 50;
let spacing = 50;

let effectRadius = 180; 
let mouse = { x: -1000, y: -1000, screenX: -1000, screenY: -1000 };
let prevMouse = { screenX: -1000, screenY: -1000 };

let charge = 0; 
let stillFrames = 0; 

// --- ΕΛΕΓΧΟΣ ΣΕΛΙΔΑΣ ΓΙΑ ΤΟ PARALLAX (ΣΚΡΟΛΑΡΙΣΜΑ) ---
// Ελέγχει αν το URL ανήκει στην αρχική (index.html) ή στο κεντρικό path (/)
const isHomePage = window.location.pathname.endsWith('index.html') || 
                   window.location.pathname.endsWith('/') ||
                   window.location.pathname === '';

let scrollOffset = 0;
// Στη Home σελίδα απενεργοποιούμε το Parallax (ταχύτητα = 0), 
// ενώ στις υπόλοιπες σελίδες το αφήνουμε στο 0.4
const parallaxSpeed = isHomePage ? 0 : 0.4; 
let scrollerElement;

function getScroller() {
    return document.querySelector('.content-page') || window;
}

function getScrollHeight() {
    const el = document.querySelector('.content-page');
    return el ? el.scrollHeight : document.documentElement.scrollHeight;
}

function updateScroll() {
    const scroller = getScroller();
    scrollOffset = (scroller === window) ? window.scrollY : scroller.scrollTop;
}

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    
    // --- ΝΕΑ ΠΡΟΣΘΗΚΗ: Προσαρμογή πλέγματος για κινητά ---
    if (width <= 768) {
        spacing = 30;         // Πιο πυκνό/μικρό πλέγμα στα κινητά
        effectRadius = 120;   // Μικρότερη ακτίνα αλληλεπίδρασης
    } else {
        spacing = 50;         // Κανονικό μέγεθος για υπολογιστές
        effectRadius = 180;
    }
    // ------------------------------------------------------

    // Εντοπισμός του στοιχείου που κάνει scroll
    if (!scrollerElement && !isHomePage) {
        scrollerElement = getScroller();
        scrollerElement.addEventListener('scroll', updateScroll);
    }
    
    updateScroll();
    initGrid(); // Ξανασχεδιάζει το πλέγμα με το νέο spacing
}
window.addEventListener('resize', resize);

window.addEventListener('mousemove', (e) => {
    mouse.screenX = e.clientX;
    mouse.screenY = e.clientY;
});

window.addEventListener('mouseout', () => {
    mouse.screenX = -1000;
    mouse.screenY = -1000;
});



// --- ΠΡΟΣΘΗΚΗ ΓΙΑ ΥΠΟΣΤΗΡΙΞΗ ΟΘΟΝΩΝ ΑΦΗΣ (ΚΙΝΗΤΑ/TABLET) ---

window.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
        mouse.screenX = e.touches[0].clientX;
        mouse.screenY = e.touches[0].clientY;
    }
});

window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        mouse.screenX = e.touches[0].clientX;
        mouse.screenY = e.touches[0].clientY;
    }
});



window.addEventListener('touchend', () => {
    // Όταν ο χρήστης σηκώνει το δάχτυλο, το εφέ εξαφανίζεται (όπως στο mouseout)
    mouse.screenX = -1000;
    mouse.screenY = -1000;
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
                let maxScaleAmount = 0.1 + (0.2 * charge); 
                let currentScale = 1 + (intensity * maxScaleAmount); 

                targetX = mouse.x + (dxMouse * currentScale);
                targetY = mouse.y + (dyMouse * currentScale);
            }
        }

        this.vx += (targetX - this.x) * this.springFactor;
        this.vy += (targetY - this.y) * this.springFactor;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx;
        this.y += this.vy;

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
    
    // 1. Προσθέτουμε επιπλέον στήλες για να καλύπτουν σίγουρα όλη την οθόνη (+2 για περιθώριο)
    cols = Math.ceil(width / spacing) + 2; 
    
    // 2. Υπολογίζουμε το συνολικό πλάτος του νέου πλέγματος
    let gridWidth = (cols - 1) * spacing; 
    
    // 3. Βρίσκουμε ακριβώς πόσο πρέπει να το μετατοπίσουμε (offset) για να κεντραριστεί
    let offsetX = (width - gridWidth) / 2;

    // Υπολογισμός ύψους / γραμμών (παραμένει ίδιος)
    let totalScrollableHeight = Math.max(0, getScrollHeight() - window.innerHeight);
    let virtualHeight = height + (totalScrollableHeight * parallaxSpeed);
    rows = Math.floor(virtualHeight / spacing) + (parallaxSpeed > 0 ? 4 : 1);

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            // 4. Εφαρμόζουμε το offsetX στη θέση j * spacing
            points.push(new Point((j * spacing) + offsetX, i * spacing));
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
    
    // --- Υπολογισμός Εικονικής Θέσης Ποντικιού στο πλέγμα ---
    if (mouse.screenX !== -1000) {
        mouse.x = mouse.screenX;
        mouse.y = mouse.screenY + (scrollOffset * parallaxSpeed);
    } else {
        mouse.x = -1000;
        mouse.y = -1000;
    }

    // --- Υπολογισμός Ακινησίας ---
    let mouseSpeed = 0;
    if (mouse.screenX !== -1000 && prevMouse.screenX !== -1000) {
        let dx = mouse.screenX - prevMouse.screenX;
        let dy = mouse.screenY - prevMouse.screenY;
        mouseSpeed = Math.sqrt(dx * dx + dy * dy);
    }
    prevMouse.screenX = mouse.screenX;
    prevMouse.screenY = mouse.screenY;

    if (mouse.screenX !== -1000) {
        if (mouseSpeed > 2) {
            stillFrames = 0;
            charge -= 0.04; 
        } else {
            stillFrames++;
            
            if (stillFrames < 10) { charge += 0.002; }
            else if (stillFrames < 20) { charge += 0.005; }
            else if (stillFrames < 30) { charge += 0.009; }
            else if (stillFrames < 40) { charge += 0.005; }
            else if (stillFrames < 50) { charge += 0.002; }
            else if (stillFrames < 60) { charge -= 0.002; }
            else if (stillFrames < 70) { charge -= 0.005; }
            else if (stillFrames < 80) { charge -= 0.009; }
            else if (stillFrames < 90) { charge -= 0.005; }
            else if (stillFrames < 100) { charge -= 0.003; }
            else { charge -= 0.001; }
        }
    } else {
        stillFrames = 0;
        charge -= 0.05; 
    }
    
    charge = Math.max(0, Math.min(1, charge));

    ctx.lineWidth = 1.2; 

    ctx.save();
    ctx.translate(0, -scrollOffset * parallaxSpeed);

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

    ctx.restore(); 

    requestAnimationFrame(animate);
}

resize();
window.addEventListener('load', resize); 
animate();




// --- ΠΛΟΗΓΗΣΗ ΜΕ SWIPE (ΓΙΑ ΚΙΝΗΤΑ/TABLETS) ---

// 1. Ορίζουμε τη σειρά των σελίδων ακριβώς όπως είναι στο μενού
const pagesList = [
    'index.html',
    'portfolio.html',
    'cv.html',
    'books.html',
    'Publications.html'
];

// 2. Βρίσκουμε ποια είναι η τρέχουσα σελίδα από το URL
let currentPageName = window.location.pathname.split('/').pop();
// Αν το URL τελειώνει σε '/' (π.χ. root domain), θεωρούμε ότι είναι η αρχική
if (currentPageName === '' || currentPageName === '/') {
    currentPageName = 'index.html';
}

// Μεταβλητές για την καταγραφή της θέσης αφής
let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;

// Ελάχιστη απόσταση σε pixels για να θεωρηθεί η κίνηση ως "swipe" (αποφυγή τυχαίων αγγιγμάτων)
const swipeThresholdX = 60; 
// Μέγιστη επιτρεπτή κάθετη απόσταση (για να μην αλλάζει σελίδα αν ο χρήστης απλά σκρολάρει προς τα κάτω)
const maxThresholdY = 50; 

window.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

window.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipeGesture();
}, { passive: true });

function handleSwipeGesture() {
    let currentIndex = pagesList.indexOf(currentPageName);
    
    // Αν για κάποιο λόγο η σελίδα δεν υπάρχει στη λίστα, δεν κάνουμε τίποτα
    if (currentIndex === -1) return;

    let distanceX = touchEndX - touchStartX;
    let distanceY = touchEndY - touchStartY;

    // Ελέγχουμε αν το swipe ήταν κυρίως οριζόντιο και όχι κάθετο σκρολάρισμα
    if (Math.abs(distanceY) < maxThresholdY) {
        
        // Swipe Left (το δάχτυλο πήγε αριστερά) -> Επόμενη σελίδα
        if (distanceX < -swipeThresholdX) {
            if (currentIndex < pagesList.length - 1) {
                window.location.href = pagesList[currentIndex + 1];
            }
        }
        
        // Swipe Right (το δάχτυλο πήγε δεξιά) -> Προηγούμενη σελίδα
        else if (distanceX > swipeThresholdX) {
            if (currentIndex > 0) {
                window.location.href = pagesList[currentIndex - 1];
            }
        }
    }
}