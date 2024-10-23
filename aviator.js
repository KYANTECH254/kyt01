// Game variables
let planeX = 0;
let planeY = 0;
let multiplier = 1;
let maxMultiplier = Math.floor(Math.random() * 100 + 1);  // Predefine the max multiplier (1 to 10000)
let isBetPlaced = false;
let betAmount;
let crashed = false;
let cashedOut = false;
let cashoutMultiplier = 0;
let gameInterval;
let isFloating = false; // Flag for wavy motion
let canvas, ctx;
let floatOffset = 0;
const floatSpeed = 0.5;  // Slow down the wavy motion
let stopHorizontalMovement = false;
const maxCanvasHeight = 0.25;  // 3/4 height of the canvas from bottom (1/4 from top)
let backgroundX = 0;  // Background position for simulating motion

// Dot variables
const dotSpacing = 20;
let verticalDots = [];
let horizontalDots = [];
let dotSpeed = 2;  // Speed at which dots move

// Variables for countdown and loader
let countdown = 10;
let countdownInterval;
const loaderRadius = 20; // Radius of the loader circle

// Load the plane image
let planeImage = new Image();
planeImage.src = 'assets/images/plane.png';

window.onload = () => {
    // Initialize Canvas
    canvas = document.getElementById('planeCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = 300;
    canvas.height = 250;

    // Initialize dots
    initializeDots();

    // Start waiting for bets
    startGameLoop();

    // Place bet button
    document.getElementById('betBtn').addEventListener('click', placeBet);

    // Cash out button
    if (isBetPlaced === false) {
        document.getElementById('cashoutBtn').style = 'display:none;'
    }
    document.getElementById('cashoutBtn').addEventListener('click', cashOut);
};

function initializeAviatorGame() {
    crashed = false;
    multiplier = 1;
    planeX = 0;  // Start from the left
    planeY = canvas.height;  // Start at the bottom
    maxMultiplier = Math.floor(Math.random() * 100 + 1);  // Predefine max multiplier for the round
    isFloating = false;
    stopHorizontalMovement = false;
    floatOffset = 0;
    backgroundX = 0;  // Reset the background position
    initializeDots();  // Reinitialize dots
    document.getElementById('result').innerText = "Playing round!";

    document.getElementById('cashoutBtn').disabled = false;
    document.getElementById('betBtn').disabled = true;
    if (isBetPlaced === false) {
        document.getElementById('cashoutBtn').style.display = 'none';
    }

    clearInterval(gameInterval);  // Stop waiting for bets message
    startPlaneFlight();  // Start plane flight
}

function placeBet() {
    betAmount = parseFloat(document.getElementById('betAmount').value);
    const token = localStorage.getItem("User_Data");

    if (token) {
        const userData = JSON.parse(token);
        const balance = parseFloat(userData.balance);

        if (isNaN(betAmount) || betAmount <= 0) {
            document.getElementById('result').innerText = "Please enter a valid amount!";
            return;
        }
        if (betAmount > balance) {
            document.getElementById('result').innerText = "Insufficient funds, deposit to Play!";
            return;
        }
        if (betAmount < 10) {
            document.getElementById('result').innerText = "Minimum stake is Ksh 10 to Play!";
            return;
        }
        if (betAmount > 20000) {
            document.getElementById('result').innerText = "Maximum stake is Ksh 20,000 to Play!";
            return;
        }

        // Prepare JSON data
        const data = {
            phone: userData.phone,
            amount: betAmount,
            operation: 'debit'
        };

        // Update balance via PHP script
        fetch('server/update_balance.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    userData.balance = data.new_balance;
                    localStorage.setItem('User_Data', JSON.stringify(userData));

                    // Proceed with game logic
                    isBetPlaced = true;
                    cashedOut = false;
                    document.getElementById('betBtn').disabled = true;
                    document.getElementById('cashoutBtn').style = 'display:block';
                    document.getElementById('result').innerText = "Bet placed: Ksh" + betAmount;
                } else {
                    document.getElementById('result').innerText = data.message;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('result').innerText = "An error occurred. Timed Out.";
            });
    } else {
        document.getElementById('result').innerText = "Login to Play!";
    }
}

function initializeDots() {
    // Initialize vertical dots on the left side
    verticalDots = [];
    const verticalX = 20;  // Fixed X position for vertical dots
    for (let y = 0; y < canvas.height; y += dotSpacing) {
        verticalDots.push({ x: verticalX, y });
    }

    // Initialize horizontal dots
    horizontalDots = [];
    for (let x = 0; x < canvas.width; x += dotSpacing) {
        horizontalDots.push({ x, y: canvas.height - dotSpacing });
    }
}

function startPlaneFlight() {
    gameInterval = setInterval(gameLoop, 100);  // Run the game loop every 100ms
}

function cashOut() {
    if (isBetPlaced && !crashed && !cashedOut) {
        cashedOut = true;
        cashoutMultiplier = multiplier;
        isBetPlaced = false;

        document.getElementById('cashoutBtn').style = 'display:none;'
        document.getElementById('result').innerText = `You cashed out at multiplier x${cashoutMultiplier.toFixed(2)}!`;
        let currentCashout = (betAmount * cashoutMultiplier).toFixed(2);
        document.getElementById("alert").style = "display:block;"
        document.querySelector('.alert-message').innerText = `You won Ksh ${currentCashout}`;
        setTimeout(function () {
            document.getElementById("alert").style = "display:none;"
        }, 3000)
        document.getElementById('cashoutBtn').disabled = true;
        betAmount = 0;
        const token = localStorage.getItem("User_Data");
        if (token) {
            const userData = JSON.parse(token);

            // Prepare JSON data
            const data = {
                phone: userData.phone,
                amount: currentCashout,
                operation: 'credit'
            };

            // Update balance via PHP script
            fetch('server/update_balance.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        userData.balance = data.new_balance;
                        localStorage.setItem('User_Data', JSON.stringify(userData));

                    } else {
                        document.getElementById('result').innerText = data.message;
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    document.getElementById('result').innerText = "An error occurred. Timed Out.";
                });
        }
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const tolerance = 0.01;
    // Check if the product is approximately equal to 1,500,000
    if (Math.abs((multiplier * betAmount) - 1500000) < tolerance) {
        cashOut();
    }
    // Adjust multiplier increase speed based on the final multiplier
    let multiplierSpeed = Math.min(0.05 + (maxMultiplier - multiplier) / 1000, 1);
    if (maxMultiplier > 5000) multiplierSpeed += 0.1;  // Increase speed for larger odds

    // Update dot positions
    updateDots();

    // If the plane is not floating yet, move it diagonally
    if (!crashed && !isFloating) {
        multiplier += multiplierSpeed;

        // Move the plane diagonally to the right and up, limit upward movement to 3/4 of the canvas height
        if (!stopHorizontalMovement) {
            planeX += 2;  // Move the plane to the right
            planeY -= 2;  // Move the plane up
        }

        // If the planeY is greater than 1/4 of the canvas height from the top (meaning it has gone 3/4 of the canvas), start floating
        if (planeY <= canvas.height * maxCanvasHeight) {
            isFloating = true;
            stopHorizontalMovement = true;  // Stop horizontal movement once 3/4 of the height is reached
            planeY = canvas.height * maxCanvasHeight;  // Set the plane height to 3/4 of the canvas
        }
    } else if (!crashed && isFloating) {
        // Slow wavy motion when floating
        floatOffset = Math.sin(Date.now() / 500) * 10 * floatSpeed;  // Slow wavy movement
        planeY = canvas.height * maxCanvasHeight + floatOffset;  // Stay at 3/4 height with a wavy effect

        // The multiplier continues increasing at the same speed
        multiplier += multiplierSpeed;
    }

    // Check if the plane "flew away" after reaching the maxMultiplier
    if (multiplier >= maxMultiplier) {
        crashed = true;
        drawFlyAwayMultiplier(maxMultiplier)
        document.getElementById('cashoutBtn').disabled = true;
        // Animate plane flying away to the right
        animatePlaneFlyAway();

        // If the user didn't cash out before the plane flew away, they lose the bet
        if (!cashedOut && isBetPlaced) {
            document.getElementById('result').innerText = "You lost your stake!";
            isBetPlaced = false;
            document.getElementById('cashoutBtn').style = 'display:none;'
        }

        resetGame();
    }

    // Draw the moving background, dots, plane, and the multiplier
    drawBackground();  // Draw moving background
    drawDots();  // Draw the dots
    drawPlane(planeX, planeY);  // Draw at current position
    drawMultiplier(multiplier);

    // Update the cashout button text with current stake * multiplier
    if (isBetPlaced && !cashedOut) {
        let currentCashout = (betAmount * multiplier).toFixed(2);
        document.getElementById('cashoutBtn').innerText = "Cash Out (Ksh " + currentCashout + ")";
    }
}

// Function to draw the moving background
function drawBackground() {
    ctx.fillStyle = "black";  // Red background color
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Function to draw the dots
function drawDots() {
    ctx.fillStyle = "white";

    // Draw vertical dots
    verticalDots.forEach(dot => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 5, 5, Math.PI * 2);  // Draw dot with radius 5
        ctx.fill();
    });

    // Draw horizontal dots
    horizontalDots.forEach(dot => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 5, 5, Math.PI * 2);  // Draw dot with radius 5
        ctx.fill();
    });
}

function updateDots() {
    // Move vertical dots down
    verticalDots.forEach(dot => {
        dot.y += dotSpeed;
        if (dot.y > canvas.height) {
            dot.y = -5;  // Reset to the top
        }
    });

    // Move horizontal dots to the right
    horizontalDots.forEach(dot => {
        dot.x += dotSpeed;
        if (dot.x > canvas.width) {
            dot.x = -5;  // Reset to the left
        }
    });
}

// Function to draw the plane using the image
function drawPlane(x, y) {
    ctx.drawImage(planeImage, x, y, 100, 60);
}

// Function to draw the increasing multiplier on the canvas
function drawMultiplier(multiplier) {
    ctx.fillStyle = "white";
    ctx.font = "45px Poppins";
    ctx.fillText("x " + multiplier.toFixed(2), 100, 100);
}

function drawFlyAwayMultiplier(multiplier) {
    ctx.fillStyle = "red";
    ctx.font = "35px Poppins";
    ctx.fillText("Flew Away x" + multiplier.toFixed(2), 100, 100);
}

// Animate the plane flying off to the right when it reaches maxMultiplier
function animatePlaneFlyAway() {
    let flyAwayInterval = setInterval(() => {
        planeX += 5;  // Move the plane faster to the right
        if (planeX > canvas.width) {
            clearInterval(flyAwayInterval);  // Stop animation when the plane is off the screen
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawPlane(planeX, planeY);
    }, 50);
}

// Reset the game after each round
function resetGame() {
    setTimeout(() => {
        clearInterval(gameInterval);
        document.getElementById('cashoutBtn').disabled = true;
        document.getElementById('betBtn').disabled = false;
        startGameLoop();
    }, 5000);
}

// Function to draw the loader and countdown
function drawLoaderAndCountdown() {
    // Clear the area where the loader and countdown will be drawn
    ctx.clearRect(60, 120, 200, 50); // Adjust the area based on your layout

    // Draw the loader
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(150, 140, loaderRadius, 0, 2 * Math.PI * (countdown / 10), false);
    ctx.stroke();

    // Draw the countdown
    ctx.fillStyle = 'red';
    ctx.font = '20px Poppins';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(countdown, 150, 140);
}

// Function to start the countdown and loader animation
function startCountdown() {
    // Clear any existing countdown interval
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    // Reset countdown to 10
    countdown = 10;

    // Start a new countdown interval
    countdownInterval = setInterval(function () {
        drawLoaderAndCountdown();
        countdown--;

        if (countdown < 0) {
            clearInterval(countdownInterval);
            initializeAviatorGame();
        }
    }, 1000);
}

// Function to start the game loop with loader and countdown
function startGameLoop() {
    drawPlane(0, 180);
    const token = localStorage.getItem("User_Data");

    if (token) {
        document.getElementById('result').innerText = "Waiting for bets...";
        ctx.fillStyle = "red";
        ctx.font = "20px Poppins";
        ctx.fillText("Waiting for bets...", 80, 100);

        // Start the countdown and loader animation
        startCountdown();
    } else {
        document.getElementById('result').innerText = "Login to Play!";
        ctx.fillStyle = "red";
        ctx.font = "20px Poppins";
        ctx.fillText("Login to Play!", 80, 100);
    }
}
