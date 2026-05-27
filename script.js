// --- 1. Animation Εμφάνισης Κειμένων (GSAP) ---
if (typeof gsap !== "undefined") {
    gsap.from(".hero-content > *", {
        y: 40,
        opacity: 0,
        duration: 1.2,
        stagger: 0.2,
        ease: "power3.out",
        delay: 0.5
    });

    gsap.from(".top-nav ul li", {
        y: -20,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.2
    });
}

// --- 2. Διαδραστικό Φόντο (Parallax & Ping-Pong Κύμα) ---
const canvas = document.getElementById('bg-canvas');
if (canvas) {
    const ctx = canvas.getContext('2d');

    let width, height;
    let points = [];
    let spacing = 50;
    let effectRadius = 180; 

    let mouse = { x: -1000, y: -1000, screenX: -1000, screenY: -1000 };
    let prevMouse = { screenX: -1000, screenY: -1000 };

    let charge = 0; 
    let stillFrames = 0; 

    // --- ΜΕΤΑΒΛΗΤΕΣ ΠΑΛΜΟΥ (WAVE PING-PONG) ---
    const travelTime = 5000; // Χρόνος μετάβασης (5 δευτερόλεπτα)
    const pauseTime = 1000;  // Χρόνος αναμονής στις άκρες (1 δευτερόλεπτο)
    const waveThickness = 400;  
    
    let wavePosition = -1000;   
    let waveDirection = 1; // 1 = Προς τα εμπρός, -1 = Επιστροφή

    const isHomePage = window.location.pathname.endsWith('index.html') || 
                       window.location.pathname.endsWith('/') ||
                       window.location.pathname === '';

    let scrollOffset = 0;
    const parallaxSpeed = isHomePage ? 0 : 0.4; 
    let scrollerElement;

    function getScroller() {
        return document.querySelector('.content-page') || window;
    }

    function updateScroll() {
        const scroller = getScroller();
        scrollOffset = (scroller === window) ? window.scrollY : scroller.scrollTop;
    }

    function getScrollHeight() {
        const el = document.querySelector('.content-page');
        return el ? el.scrollHeight : document.documentElement.scrollHeight;
    }

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        
        if (width <= 768) {
            spacing = 30;         
            effectRadius = 120;   
        } else {
            spacing = 50;         
            effectRadius = 180;
        }

        if (!scrollerElement && !isHomePage) {
            scrollerElement = getScroller();
            if (scrollerElement) {
                scrollerElement.addEventListener('scroll', updateScroll);
            }
        }
        
        updateScroll();
        initGrid(); 
    }
    window.addEventListener('resize', resize);

    // Mouse & Touch Events
    window.addEventListener('mousemove', (e) => {
        mouse.screenX = e.clientX;
        mouse.screenY = e.clientY;
    });
    window.addEventListener('mouseout', () => {
        mouse.screenX = -1000;
        mouse.screenY = -1000;
    });
    window.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
            mouse.screenX = e.touches[0].clientX;
            mouse.screenY = e.touches[0].clientY;
        }
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            mouse.screenX = e.touches[0].clientX;
            mouse.screenY = e.touches[0].clientY;
        }
    }, { passive: true });
    window.addEventListener('touchend', () => {
        mouse.screenX = -1000;
        mouse.screenY = -1000;
    }, { passive: true });

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
            let finalColorTarget = 0;

            // --- 1. ΕΦΕ ΠΟΝΤΙΚΙΟΥ ---
            if (mouse.x !== -1000) {
                let dxMouse = this.originX - mouse.x;
                let dyMouse = this.originY - mouse.y;
                let distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

                if (distMouse < effectRadius) {
                    let intensity = Math.pow((effectRadius - distMouse) / effectRadius, 2); 
                    let maxScaleAmount = 0.1 + (0.2 * charge); 
                    let currentScale = 1 + (intensity * maxScaleAmount); 

                    targetX = mouse.x + (dxMouse * currentScale);
                    targetY = mouse.y + (dyMouse * currentScale);
                    finalColorTarget = intensity * (0.15 + 0.85 * charge);
                }
            }

            // --- 2. ΕΦΕ ΠΑΛΜΟΥ (Από ΚΑΤΩ ΑΡΙΣΤΕΡΑ προς ΠΑΝΩ ΔΕΞΙΑ και τούμπαλιν) ---
            let dxWave = this.originX - 0;
            let dyWave = this.originY - height; 
            let distFromOrigin = Math.sqrt(dxWave * dxWave + dyWave * dyWave);
            let distWave = Math.abs(distFromOrigin - wavePosition);

            if (distWave < waveThickness) {
                let pulseIntensity = Math.pow((waveThickness - distWave) / waveThickness, 2);
                
                let dirX = dxWave / (distFromOrigin || 1);
                let dirY = dyWave / (distFromOrigin || 1);
                
                // Ο πολλαπλασιασμός με το waveDirection αντιστρέφει την κίνηση όταν επιστρέφει το κύμα
                targetX += dirX * 8 * pulseIntensity * waveDirection; 
                targetY += dirY * 8 * pulseIntensity * waveDirection;
                
                let pulseColorFactor = pulseIntensity * 0.1; 
                finalColorTarget = Math.max(finalColorTarget, pulseColorFactor);
            }

            // --- ΕΦΑΡΜΟΓΗ ΦΥΣΙΚΗΣ ---
            this.vx += (targetX - this.x) * this.springFactor;
            this.vy += (targetY - this.y) * this.springFactor;
            this.vx *= this.friction;
            this.vy *= this.friction;
            this.x += this.vx;
            this.y += this.vy;

            this.colorFactor += (finalColorTarget - this.colorFactor) * 0.05; 
        }
    }

    let cols, rows;

    function initGrid() {
        points = [];
        cols = Math.ceil(width / spacing) + 2; 
        let gridWidth = (cols - 1) * spacing; 
        let offsetX = (width - gridWidth) / 2 || 0; 

        let totalScrollableHeight = Math.max(0, getScrollHeight() - window.innerHeight);
        let virtualHeight = height + (totalScrollableHeight * parallaxSpeed);
        rows = Math.floor(virtualHeight / spacing) + (parallaxSpeed > 0 ? 4 : 1);

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                points.push(new Point((j * spacing) + offsetX, i * spacing));
            }
        }
    }

    function getColor(p1, p2) {
        let factor = (p1.colorFactor + p2.colorFactor) / 2;
        let theme = sessionStorage.getItem('themeOrigin');

        if (theme === 'light') {
            let a = 0.08 + (0.5 * factor); 
            return `rgba(0, 0, 0, ${a})`;
        } else {
            let r = Math.floor(255 + (150 - 255) * factor);
            let g = Math.floor(255 + (10 - 255) * factor);
            let b = Math.floor(255 + (40 - 255) * factor);
            let a = 0.08 + (0.62 * factor); 
            return `rgba(${r}, ${g}, ${b}, ${a})`;
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        // --- ΥΠΟΛΟΓΙΣΜΟΣ ΚΥΚΛΟΥ PING-PONG ---
        let now = Date.now();
        let maxDistance = Math.sqrt(width * width + height * height);
        
        // Συνολικός χρόνος για έναν πλήρη κύκλο (Εμπρός + Παύση + Πίσω + Παύση)
        let cycleTime = (travelTime + pauseTime) * 2; 
        let timeInCycle = now % cycleTime;
        let progress = 0;

        if (timeInCycle < travelTime) {
            // Φάση 1: Πηγαίνει προς τα εμπρός (Πάνω Δεξιά)
            progress = timeInCycle / travelTime;
            waveDirection = 1;
        } else if (timeInCycle < travelTime + pauseTime) {
            // Φάση 2: Παύση στο τέλος (κρυμμένο εκτός οθόνης)
            progress = 2; 
            waveDirection = 0;
        } else if (timeInCycle < travelTime * 2 + pauseTime) {
            // Φάση 3: Επιστρέφει (Κάτω Αριστερά)
            let timeReversing = timeInCycle - (travelTime + pauseTime);
            progress = 1 - (timeReversing / travelTime);
            waveDirection = -1; // Αλλάζει η κατεύθυνση ώθησης!
        } else {
            // Φάση 4: Παύση στην αρχή (κρυμμένο εκτός οθόνης)
            progress = -1; 
            waveDirection = 0;
        }

        // Μετατροπή του progress (0 έως 1) σε pixel απόσταση
        wavePosition = progress * (maxDistance + waveThickness * 2) - waveThickness;
        // ------------------------------------

        if (mouse.screenX !== -1000) {
            mouse.x = mouse.screenX;
            mouse.y = mouse.screenY + (scrollOffset * parallaxSpeed);
        } else {
            mouse.x = -1000;
            mouse.y = -1000;
        }

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
                if (stillFrames < 10) charge += 0.002;
                else if (stillFrames < 20) charge += 0.005;
                else if (stillFrames < 30) charge += 0.009;
                else charge -= 0.003;
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
    requestAnimationFrame(animate);
}

// --- ΠΛΟΗΓΗΣΗ ΜΕ SWIPE (ΓΙΑ ΚΙΝΗΤΑ/TABLETS) ---
const pagesList = [
    'index.html',
    'portfolio.html',
    'cv.html',
    'books.html',
    'Publications.html'
];

let currentPageName = window.location.pathname.split('/').pop();
if (currentPageName === '' || currentPageName === '/') {
    currentPageName = 'index.html';
}

let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;
const swipeThresholdX = 60; 
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
    if (currentIndex === -1) return;

    let distanceX = touchEndX - touchStartX;
    let distanceY = touchEndY - touchStartY;

    if (Math.abs(distanceY) < maxThresholdY) {
        if (distanceX < -swipeThresholdX && currentIndex < pagesList.length - 1) {
            window.location.href = pagesList[currentIndex + 1];
        } else if (distanceX > swipeThresholdX && currentIndex > 0) {
            window.location.href = pagesList[currentIndex - 1];
        }
    }
}



// --- ΑΠΟΚΡΥΨΗ / ΕΜΦΑΝΙΣΗ NAVBAR ΚΑΤΑ ΤΟ SCROLL ---

// Ελέγχουμε αν είμαστε στην αρχική σελίδα (Home)
const isNavHomePage = window.location.pathname.endsWith('index.html') || 
                      window.location.pathname.endsWith('/') ||
                      window.location.pathname === '';

// Ο κώδικας θα εκτελεστεί μόνο αν ΔΕΝ βρισκόμαστε στην αρχική
if (!isNavHomePage) {
    const topNav = document.querySelector('.top-nav');
    // Το στοιχείο που κάνει το scroll στις υπόλοιπες σελίδες σου είναι το .content-page
    const pageScroller = document.querySelector('.content-page'); 
    let lastScrollY = 0;

    if (pageScroller && topNav) {
        pageScroller.addEventListener('scroll', () => {
            // Παίρνουμε την τρέχουσα θέση του scroll μέσα στο .content-page
            let currentScrollY = pageScroller.scrollTop;

            // Ελέγχουμε την κατεύθυνση του scroll
            if (currentScrollY > lastScrollY && currentScrollY > 50) {
                // Scroll προς τα ΚΑΤΩ: Κρύβουμε το μενού μετακινώντας το προς τα πάνω
                topNav.style.transform = "translateY(-100%)";
            } else {
                // Scroll προς τα ΠΑΝΩ (ή αν είμαστε στην κορυφή): Εμφανίζουμε το μενού
                topNav.style.transform = "translateY(0)";
            }

            // Αποθηκεύουμε την τρέχουσα θέση για την επόμενη σύγκριση
            // Το Math.max αποτρέπει προβλήματα με το "bounce" effect (overscroll) στα κινητά
            lastScrollY = Math.max(0, currentScrollY); 
        });
    }
}