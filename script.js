// ==========================================================================
// SCRIPT.JS - Κεντρική Λογική Σελίδας
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initThemeTransition();
    initAnimations();
    initSwipeNavigation();
    initScrollNavbar();
    initCanvasBackground();
	initLightbox();
});

// ==========================================================================
// 1. ΔΙΑΧΕΙΡΙΣΗ ΘΕΜΑΤΟΣ (Light / Dark Mode)
// ==========================================================================
function initThemeTransition() {
    // Διαβάζουμε το data-theme από το <body>
    const currentTheme = document.body.getAttribute('data-theme') || 'light';
    const prevTheme = sessionStorage.getItem('themeOrigin');

    // Εφαρμογή animations μετάβασης ανάλογα με την προηγούμενη σελίδα
    if (prevTheme === 'dark' && currentTheme === 'light') {
        document.body.classList.add('animate-bg');
    } else if (prevTheme === 'light' && currentTheme === 'dark') {
        document.body.classList.add('animate-bg-dark');
    }
    
    // Αποθήκευση του τρέχοντος θέματος
    sessionStorage.setItem('themeOrigin', currentTheme);
}

// ==========================================================================
// 2. ANIMATIONS (GSAP) ΚΑΙ ΟΜΑΛΗ ΕΜΦΑΝΙΣΗ
// ==========================================================================
function initAnimations() {
    const contentPage = document.querySelector('.content-page');
    
	// Ομαλή εμφάνιση περιεχομένου
    if (contentPage) {
        contentPage.style.opacity = "0";
        // Το 'load' περιμένει να φορτώσουν τα γραφικά πριν τρέξει το animation
        window.addEventListener('load', () => {
            contentPage.style.transition = "opacity 0.5s ease-in-out";
            contentPage.style.opacity = "1";
        });
        
        // Fallback: Αν για κάποιο λόγο το load αργήσει υπερβολικά, εμφανίζουμε τη σελίδα στα 1.5 δευτερόλεπτα
        setTimeout(() => {
            if (contentPage.style.opacity === "0") {
                contentPage.style.transition = "opacity 0.5s ease-in-out";
                contentPage.style.opacity = "1";
            }
        }, 1500);
    }

    // GSAP Εφέ
    if (typeof gsap !== "undefined") {
        if (document.querySelector('.hero-content')) {
            gsap.from(".hero-content > *", { y: 40, opacity: 0, duration: 1.2, stagger: 0.2, ease: "power3.out", delay: 0.5 });
        }
        gsap.from(".top-nav ul li", { y: -20, opacity: 0, duration: 1, stagger: 0.1, ease: "power3.out", delay: 0.2 });
        
        if (contentPage) {
            gsap.from(".page-title, .placeholder-text, .cv-section, .cv-header, .download-btn, .pub-category h2, .pub-list li", {
                y: 30, opacity: 0, duration: 1, stagger: 0.15, ease: "power3.out", delay: 0.4
            });
        }
    }
}

// ==========================================================================
// 3. ΠΛΟΗΓΗΣΗ ΜΕ SWIPE (ΓΙΑ ΚΙΝΗΤΑ/TABLETS)
// ==========================================================================
function initSwipeNavigation() {
    const pagesList = ['index.html', 'portfolio.html', 'cv.html', 'books.html', 'Publications.html'];
    let currentPageName = window.location.pathname.split('/').pop() || 'index.html';
    
    let touchStartX = 0, touchStartY = 0;
    const swipeThresholdX = 60, maxThresholdY = 50; 

    window.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
        let touchEndX = e.changedTouches[0].screenX;
        let touchEndY = e.changedTouches[0].screenY;
        
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
    }, { passive: true });
}

// ==========================================================================
// 4. ΑΠΟΚΡΥΨΗ / ΕΜΦΑΝΙΣΗ NAVBAR ΚΑΤΑ ΤΟ SCROLL
// ==========================================================================
function initScrollNavbar() {
    const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '';
    
    if (!isHomePage) {
        const topNav = document.querySelector('.top-nav');
        const pageScroller = document.querySelector('.content-page'); 

        if (pageScroller && topNav) {
            pageScroller.addEventListener('scroll', () => {
                let currentScrollY = pageScroller.scrollTop;
                
                // Αν είμαστε σχεδόν στην κορυφή της σελίδας (κάτω από 50px scroll), εμφάνισε το navbar
                if (currentScrollY < 50) {
                    topNav.style.transform = "translateY(0)";
                } else {
                    // Σε οποιοδήποτε άλλο σημείο της σελίδας, κράτα το κρυμμένο
                    topNav.style.transform = "translateY(-100%)";
                }
            });
        }
    }
}

// ==========================================================================
// 5. ΔΙΑΔΡΑΣΤΙΚΟ ΦΟΝΤΟ (CANVAS - Parallax & Wave)
// ==========================================================================
function initCanvasBackground() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height, points = [], spacing = 50, effectRadius = 180; 
    let mouse = { x: -1000, y: -1000, screenX: -1000, screenY: -1000 };
    let prevMouse = { screenX: -1000, screenY: -1000 };
    let charge = 0, stillFrames = 0; 
    
    const travelTime = 5000, pauseTime = 1000, waveThickness = 400;  
    let wavePosition = -1000, waveDirection = 1; 
    let scrollOffset = 0;
    
    const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '';
    const parallaxSpeed = isHomePage ? 0 : 0.4; 
    let scrollerElement;

    function getScroller() { return document.querySelector('.content-page') || window; }
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
        spacing = width <= 768 ? 30 : 50;         
        effectRadius = width <= 768 ? 120 : 180;

        if (!scrollerElement && !isHomePage) {
            scrollerElement = getScroller();
            if (scrollerElement) scrollerElement.addEventListener('scroll', updateScroll);
        }
        updateScroll();
        initGrid(); 
    }
    window.addEventListener('resize', resize);

    window.addEventListener('mousemove', (e) => { mouse.screenX = e.clientX; mouse.screenY = e.clientY; });
    window.addEventListener('mouseout', () => { mouse.screenX = -1000; mouse.screenY = -1000; });
    window.addEventListener('touchstart', (e) => { if (e.touches.length > 0) { mouse.screenX = e.touches[0].clientX; mouse.screenY = e.touches[0].clientY; } }, { passive: true });
    window.addEventListener('touchmove', (e) => { if (e.touches.length > 0) { mouse.screenX = e.touches[0].clientX; mouse.screenY = e.touches[0].clientY; } }, { passive: true });
    window.addEventListener('touchend', () => { mouse.screenX = -1000; mouse.screenY = -1000; }, { passive: true });

    class Point {
        constructor(x, y) {
            this.x = x; this.y = y; this.originX = x; this.originY = y; 
            this.vx = 0; this.vy = 0; this.friction = 0.82; this.springFactor = 0.12; this.colorFactor = 0; 
        }
        update() {
            let targetX = this.originX, targetY = this.originY, finalColorTarget = 0;

            if (mouse.x !== -1000) {
                let dxMouse = this.originX - mouse.x, dyMouse = this.originY - mouse.y;
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

            let dxWave = this.originX - 0, dyWave = this.originY - height; 
            let distFromOrigin = Math.sqrt(dxWave * dxWave + dyWave * dyWave);
            let distWave = Math.abs(distFromOrigin - wavePosition);

            if (distWave < waveThickness) {
                let pulseIntensity = Math.pow((waveThickness - distWave) / waveThickness, 2);
                targetX += (dxWave / (distFromOrigin || 1)) * 8 * pulseIntensity * waveDirection; 
                targetY += (dyWave / (distFromOrigin || 1)) * 8 * pulseIntensity * waveDirection;
                finalColorTarget = Math.max(finalColorTarget, pulseIntensity * 0.1);
            }

            this.vx += (targetX - this.x) * this.springFactor;
            this.vy += (targetY - this.y) * this.springFactor;
            this.vx *= this.friction; this.vy *= this.friction;
            this.x += this.vx; this.y += this.vy;
            this.colorFactor += (finalColorTarget - this.colorFactor) * 0.05; 
        }
    }

    let cols, rows;
    function initGrid() {
        points = [];
        cols = Math.ceil(width / spacing) + 2; 
        let gridWidth = (cols - 1) * spacing, offsetX = (width - gridWidth) / 2 || 0; 
        let virtualHeight = height + (Math.max(0, getScrollHeight() - window.innerHeight) * parallaxSpeed);
        rows = Math.floor(virtualHeight / spacing) + (parallaxSpeed > 0 ? 4 : 1);

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                points.push(new Point((j * spacing) + offsetX, i * spacing));
            }
        }
    }

    function getColor(p1, p2) {
        let factor = (p1.colorFactor + p2.colorFactor) / 2;
        let theme = document.body.getAttribute('data-theme') || 'light';

        if (theme === 'light') {
            return `rgba(0, 0, 0, ${0.08 + (0.5 * factor)})`;
        } else {
            let r = Math.floor(255 + (150 - 255) * factor);
            let g = Math.floor(255 + (10 - 255) * factor);
            let b = Math.floor(255 + (40 - 255) * factor);
            return `rgba(${r}, ${g}, ${b}, ${0.08 + (0.62 * factor)})`;
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        let timeInCycle = Date.now() % ((travelTime + pauseTime) * 2), progress = 0;

        if (timeInCycle < travelTime) { progress = timeInCycle / travelTime; waveDirection = 1; }
        else if (timeInCycle < travelTime + pauseTime) { progress = 2; waveDirection = 0; }
        else if (timeInCycle < travelTime * 2 + pauseTime) { progress = 1 - ((timeInCycle - (travelTime + pauseTime)) / travelTime); waveDirection = -1; }
        else { progress = -1; waveDirection = 0; }

        wavePosition = progress * (Math.sqrt(width * width + height * height) + waveThickness * 2) - waveThickness;

        mouse.x = mouse.screenX !== -1000 ? mouse.screenX : -1000;
        mouse.y = mouse.screenX !== -1000 ? mouse.screenY + (scrollOffset * parallaxSpeed) : -1000;

        let mouseSpeed = (mouse.screenX !== -1000 && prevMouse.screenX !== -1000) ? Math.hypot(mouse.screenX - prevMouse.screenX, mouse.screenY - prevMouse.screenY) : 0;
        prevMouse.screenX = mouse.screenX; prevMouse.screenY = mouse.screenY;

        if (mouse.screenX !== -1000) {
            if (mouseSpeed > 2) { stillFrames = 0; charge -= 0.04; }
            else { stillFrames++; charge += stillFrames < 10 ? 0.002 : (stillFrames < 20 ? 0.005 : (stillFrames < 30 ? 0.009 : -0.003)); }
        } else { stillFrames = 0; charge -= 0.05; }
        charge = Math.max(0, Math.min(1, charge));

        ctx.lineWidth = 1.2; ctx.save(); ctx.translate(0, -scrollOffset * parallaxSpeed);
        points.forEach(p => p.update());

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                let index = i * cols + j, p = points[index];
                if (j < cols - 1) {
                    ctx.strokeStyle = getColor(p, points[index + 1]);
                    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(points[index + 1].x, points[index + 1].y); ctx.stroke();
                }
                if (i < rows - 1) {
                    ctx.strokeStyle = getColor(p, points[index + cols]);
                    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(points[index + cols].x, points[index + cols].y); ctx.stroke();
                }
            }
        }
        ctx.restore(); requestAnimationFrame(animate);
    }
    resize(); requestAnimationFrame(animate);
}



// ==========================================================================
// 6. IMAGE MODAL / LIGHTBOX (Λειτουργία Μεγέθυνσης Εικόνων)
// ==========================================================================
function initLightbox() {
    const modal = document.getElementById("image-modal");
    const modalImg = document.getElementById("expanded-img");
    const closeModalBtn = document.querySelector(".close-modal");
    
    // Αν δεν υπάρχει το modal στη σελίδα (π.χ. στην αρχική), σταματάμε εδώ
    if (!modal || !modalImg) return; 

    // Βρίσκουμε όλες τις εικόνες των βιβλίων
    const bookImages = document.querySelectorAll(".book-image img");

    // Προσθέτουμε τη λειτουργία του κλικ σε κάθε εικόνα
    bookImages.forEach(img => {
        img.addEventListener("click", function(event) {
            event.stopPropagation();        // Αποτρέπει συγκρούσεις με άλλα κλικ
            modal.style.display = "block";  // Εμφανίζουμε το μαύρο φόντο
            modalImg.src = this.src;        // Φέρνουμε τη μεγάλη εικόνα
        });
    });

    // Κλείσιμο του modal όταν πατηθεί το 'X'
    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });
    }

    // Κλείσιμο του modal αν ο χρήστης κάνει κλικ στο μαύρο φόντο
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
}



// Συνάρτηση για την αυτόματη φόρτωση των δημοσιεύσεων
async function loadPublications() {
    try {
        // 1. Ζητάμε το αρχείο data.md
        const response = await fetch('data.md');
        if (!response.ok) throw new Error("Δεν βρέθηκε το data.md");
        
        const text = await response.text();
        
        // Αντιστοιχία των τίτλων του MD με τα IDs των <ul> στο HTML
        const sectionMap = {
            'Δημοσιεύσεις σε Διεθνή Περιοδικά': 'journals-list',
            'Βιβλία και κεφάλαια σε βιβλία': 'books-list',
            'Δημοσιεύσεις σε Διεθνή Συνέδρια': 'conferences-list'
        };

        let currentSectionId = null;
        let currentPubText = '';
        
        // 2. Χωρίζουμε το αρχείο ανά γραμμή
        const lines = text.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim(); // Καθαρίζουμε κενά και tabs (&#x09;)
            
            if (!line) continue; // Αγνοούμε τις κενές γραμμές
            
            // Ελέγχουμε αν η γραμμή είναι τίτλος κατηγορίας
            if (sectionMap[line]) {
                currentSectionId = sectionMap[line];
                continue;
            }
            
            if (currentSectionId) {
                // Ελέγχουμε αν η γραμμή είναι το Link (ξεκινάει με http)
                if (line.startsWith('http')) {
                    const ul = document.getElementById(currentSectionId);
                    if (ul && currentPubText) {
                        const li = document.createElement('li');
                        
                        // Μετατρέπουμε το markdown **bold** σε HTML <strong>bold</strong>
                        // και διορθώνουμε τυχόν escaped χαρακτήρες όπως το \&
                        let formattedText = currentPubText
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\\&/g, '&'); 
                            
                        // Φτιάχνουμε τη δομή του <li>
                        li.innerHTML = `${formattedText} <a href="${line}" target="_blank" class="cv-link-btn">☍</a>`;
                        ul.appendChild(li);
                        
                        // Καθαρίζουμε το κείμενο για την επόμενη εγγραφή
                        currentPubText = ''; 
                    }
                } else {
                    // Αν δεν είναι link, είναι η περιγραφή της δημοσίευσης
                    currentPubText = line;
                }
            }
        }
    } catch (error) {
        console.error("Σφάλμα κατά τη φόρτωση του data.md:", error);
    }
}

// Εκτέλεση της συνάρτησης όταν φορτώσει η σελίδα
document.addEventListener('DOMContentLoaded', loadPublications);