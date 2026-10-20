const canvas = document.getElementById('curtain-canvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('curtain-container');

let width, height;
let points = [];
let sticks = [];

// The text to display as beads on the strings
const quoteText = "What lies ahead may look dark and uncertain, but the only way to find light is to move forward through the darkness. You cannot change where you started, but you can decide where you are going—and that decision alone changes everything.";
const quoteChars = quoteText.split('').filter(c => c.trim() !== ''); // Remove spaces for better bead look

// Physics Configuration
const stringCount = 45; // Number of vertical strings
const pointsPerString = 30; // Points per string
const gravity = 0.4;
const friction = 0.96; // High friction for a soft, silky feel
const iterations = 5; // Verlet physics constraint iterations

// Interaction state
let mouse = { x: -1000, y: -1000, isDown: false, radius: 120, force: 4 };
let lastMouse = { x: -1000, y: -1000 };
let dragDistance = 0;
const openThreshold = window.innerWidth > 800 ? 800 : 400; // Threshold distance to fully open
let isOpened = false;

// Point class for Verlet integration
class Point {
    constructor(x, y, isPinned, stringIndex) {
        this.x = x;
        this.y = y;
        this.oldx = x;
        this.oldy = y;
        this.isPinned = isPinned;
        this.stringIndex = stringIndex;
        this.letter = null;
        this.fontSize = 10 + Math.random() * 8; // Varied sizes: 10px to 18px
        this.originalX = x; // Store to know which side to pull when opening
    }
}

// Stick class to constrain distance between points
class Stick {
    constructor(p1, p2, length) {
        this.p1 = p1;
        this.p2 = p2;
        this.length = length;
    }
    update() {
        let dx = this.p2.x - this.p1.x;
        let dy = this.p2.y - this.p1.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        let difference = this.length - distance;
        let percent = difference / distance / 2;
        let offsetX = dx * percent;
        let offsetY = dy * percent;

        if (!this.p1.isPinned) {
            this.p1.x -= offsetX;
            this.p1.y -= offsetY;
        }
        if (!this.p2.isPinned) {
            this.p2.x += offsetX;
            this.p2.y += offsetY;
        }
    }
}

    function init() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        points = [];
        sticks = [];
        
        // Appropriate whitespace on the sides (15% padding)
        const paddingX = width * 0.15;
        // No top padding, only bottom padding
        const paddingYBottom = height * 0.05; 
        const spacingX = (width - paddingX * 2) / (stringCount - 1);
        const spacingY = (height - paddingYBottom) / (pointsPerString - 1);

        let charIndex = 0;
        
        // Pre-calculate how many letters per string to distribute them perfectly evenly
        const baseCharsPerString = Math.floor(quoteChars.length / stringCount);
        const extraChars = quoteChars.length % stringCount;

        for (let i = 0; i < stringCount; i++) {
            let startX = paddingX + i * spacingX;
            
            // Distribute the remainder evenly across the strings
            let charsOnThisString = baseCharsPerString + (i < extraChars ? 1 : 0);
            
            let indicesForChars = [];
            while(indicesForChars.length < charsOnThisString) {
                let r = Math.floor(Math.random() * (pointsPerString - 4)) + 2; // Avoid very top and bottom
                if(indicesForChars.indexOf(r) === -1) indicesForChars.push(r);
            }

            for (let j = 0; j < pointsPerString; j++) {
                let p = new Point(startX, j * spacingY, j === 0, i);
            
            if (indicesForChars.includes(j) && charIndex < quoteChars.length) {
                p.letter = quoteChars[charIndex];
                charIndex++;
            }

            points.push(p);

            if (j > 0) {
                sticks.push(new Stick(points[points.length - 2], p, spacingY));
            }
        }
    }
}

function update() {
    // Apply gravity, friction, and mouse interaction
    for (let p of points) {
        if (p.isPinned) {
            // If the curtain is opening, pull the pinned points to the sides
            if (isOpened) {
                if (p.originalX < width / 2) {
                    p.x -= (p.x - (-width * 0.5)) * 0.02; // Slide left off-screen
                } else {
                    p.x += ((width * 1.5) - p.x) * 0.02; // Slide right off-screen
                }
            }
            continue;
        }

        let vx = (p.x - p.oldx) * friction;
        let vy = (p.y - p.oldy) * friction;

        p.oldx = p.x;
        p.oldy = p.y;
        p.x += vx;
        p.y += vy;
        p.y += gravity;

        // Mouse interaction (pushing the beads)
        let radius = mouse.isDown ? mouse.radius * 1.5 : mouse.radius; // Larger area when dragging
        let force = mouse.isDown ? mouse.force * 2 : mouse.force; // Stronger push when dragging

        let dx = p.x - mouse.x;
        let dy = p.y - mouse.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < radius) {
            let angle = Math.atan2(dy, dx);
            let push = (radius - dist) / radius * force;
            p.x += Math.cos(angle) * push;
            p.y += Math.sin(angle) * push;
        }
    }

    // Resolve constraints
    for (let i = 0; i < iterations; i++) {
        for (let stick of sticks) {
            stick.update();
        }
    }
}

function render() {
    ctx.clearRect(0, 0, width, height);

    // Draw strings
    ctx.beginPath();
    for (let stick of sticks) {
        ctx.moveTo(stick.p1.x, stick.p1.y);
        ctx.lineTo(stick.p2.x, stick.p2.y);
    }
    ctx.strokeStyle = '#E0E0DB'; // Very soft line color
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw beads (letters)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let p of points) {
        if (p.letter) {
            // Draw a tiny background circle for the bead to hide the string behind it
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.fontSize * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = '#F7F7F4'; // Match background
            ctx.fill();

            // Draw the letter
            ctx.fillStyle = '#111111'; // Deep black for better contrast
            ctx.font = `${p.fontSize}px 'Helvetica Neue', Helvetica, Arial, sans-serif`;
            ctx.fillText(p.letter, p.x, p.y);
        }
    }
}

function loop() {
    update();
    render();
    if (!isOpened || points[0].x > -width) { // Stop rendering if fully offscreen
        requestAnimationFrame(loop);
    }
}

// Event Listeners
window.addEventListener('resize', () => {
    if(!isOpened) init();
});

function handleInteraction(e) {
    let clientX = e.clientX || (e.touches && e.touches[0].clientX);
    let clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    if (clientX !== undefined && clientY !== undefined) {
        mouse.x = clientX;
        mouse.y = clientY;

        if (mouse.isDown && !isOpened) {
            let dx = mouse.x - lastMouse.x;
            let dy = mouse.y - lastMouse.y;
            dragDistance += Math.sqrt(dx * dx + dy * dy);

            // Hide instruction once started dragging
            document.getElementById('instruction').style.opacity = '0';

            if (dragDistance > openThreshold) {
                openCurtain();
            }
        }
        lastMouse.x = mouse.x;
        lastMouse.y = mouse.y;
    }
}

let canStartLearning = false;

function openCurtain() {
    isOpened = true;
    document.body.classList.add('opened');
    setTimeout(() => {
        canStartLearning = true;
        document.body.classList.add('learning');
        setTimeout(() => {
            container.style.display = 'none';
        }, 1500);
    }, 1000); // Prevent accidental clicks right after dragging
}

// Mouse Events
container.addEventListener('mousedown', (e) => {
    mouse.isDown = true;
    lastMouse.x = e.clientX;
    lastMouse.y = e.clientY;
});
container.addEventListener('mousemove', handleInteraction);
container.addEventListener('mouseup', () => { mouse.isDown = false; });
container.addEventListener('mouseleave', () => { 
    mouse.isDown = false;
    mouse.x = -1000;
    mouse.y = -1000;
});

// Touch Events
container.addEventListener('touchstart', (e) => {
    mouse.isDown = true;
    lastMouse.x = e.touches[0].clientX;
    lastMouse.y = e.touches[0].clientY;
});
container.addEventListener('touchmove', handleInteraction);
container.addEventListener('touchend', () => { mouse.isDown = false; });

// Click to open curtain or start learning
document.addEventListener('click', (e) => {
    if (!isOpened) {
        openCurtain();
    } else if (canStartLearning && !document.body.classList.contains('learning')) {
        document.body.classList.add('learning');
    }
});

// Start
init();
loop();