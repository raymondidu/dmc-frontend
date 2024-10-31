// Countdown Timer
function startTimer(duration, display) {
    let timer = duration;
    const interval = setInterval(() => {
        const minutes = parseInt(timer / 60, 10);
        const seconds = parseInt(timer % 60, 10);

        const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
        const displaySeconds = seconds < 10 ? `0${seconds}` : seconds;

        display.textContent = `${displayMinutes}:${displaySeconds}`;

        if (--timer < 0) {
            clearInterval(interval);
            display.textContent = "00:00";
            handleTimerExpired();
        }
    }, 1000);
    return interval; // Return interval for cleanup if needed
}

// Copy button functionality
function setupCopyButton() {
    const copyBtn = document.querySelector('.copy-btn');
    const walletAddress = document.querySelector('.wallet-address');

    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(walletAddress.value);
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            copyBtn.style.backgroundColor = '#28a745';
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.backgroundColor = '#ff4d4d';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            handleCopyError();
        }
    });
}

// Handle timer expiration
function handleTimerExpired() {
    const payBtn = document.querySelector('.pay-btn');
    payBtn.disabled = true;
    payBtn.style.opacity = '0.5';
    alert("Time has elapsed. Please generate a new wallet address.");
    window.location.href = 'paymenttabs.html';
}

// Handle copy errors
function handleCopyError() {
    const copyBtn = document.querySelector('.copy-btn');
    copyBtn.textContent = 'Error!';
    copyBtn.style.backgroundColor = '#dc3545';
    
    setTimeout(() => {
        copyBtn.textContent = 'Copy';
        copyBtn.style.backgroundColor = '#ff4d4d';
    }, 2000);
}

// Payment verification function
async function verifyPayment() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const errorPopup = document.getElementById('errorPopup');

    try {
        // Get wallet address from storage
        const walletData = JSON.parse(sessionStorage.getItem('walletAddress'));
        const membershipData = JSON.parse(sessionStorage.getItem('membershipData'));
        
        if (!membershipData) {
            throw new Error('Membership Details not found');
        }

        // Show loading state
        if (loadingOverlay) loadingOverlay.classList.add('show');

        // Check transaction status
        const response = await fetch(`https://app.digitalmoney.club/api/v1/transaction/status/${encodeURIComponent(membershipData.email)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data) {
            throw new Error('Empty response from server');
        }

        // Check payment status
        if (data.status === true) {
            window.location.href = 'success.html';
        } else {
            throw new Error('Processing Pending Payment');
        }

    } catch (error) {
        console.error('Error checking payment status:', error);
        if (errorPopup) {
            const messageElement = errorPopup.querySelector('.error-message');
            if (messageElement) {
                const errorMessage = error.message === 'Processing Pending Payment' 
                    ? 'Processing Pending Payment' 
                    : 'Failed to verify payment status. Please try again.';
                
                messageElement.textContent = errorMessage;
                errorPopup.classList.add('show');
                setTimeout(() => errorPopup.classList.remove('show'), 3000);
            }
        }
    } finally {
        if (loadingOverlay) loadingOverlay.classList.remove('show');
    }
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get and display wallet data
    const walletData = JSON.parse(sessionStorage.getItem('walletAddress'));
    const membershipData = JSON.parse(sessionStorage.getItem('membershipData'));
    const requiredAmount = JSON.parse(sessionStorage.getItem('requiredAmount'));

    console.log(walletData, membershipData, requiredAmount);

    if (!walletData.message) {
        console.error('No wallet address found');
        window.location.href = 'paymenttabs.html';
        return;
    }

    // Set wallet address and amount
    const walletAddressInput = document.querySelector('.wallet-address');
    const amountDisplay = document.querySelector('.amount-value');
    
    walletAddressInput.value = walletData.message;
    
    // Update amount display using requiredAmount from sessionStorage
    if (amountDisplay && requiredAmount) {
        amountDisplay.textContent = `${requiredAmount} USDT`;
    }

    // Generate QR Code
    const qrContainer = document.querySelector('.qr-section');
    if (qrContainer) {
        // Remove existing image
        const oldQR = qrContainer.querySelector('.qr-code');
        if (oldQR) {
            oldQR.remove();
        }

        // Create new div for QR code
        const qrElement = document.createElement('div');
        qrElement.className = 'qr-code';
        qrContainer.appendChild(qrElement);

        // Generate QR code
        new QRCode(qrElement, {
            text: walletData.message,
            width: 200,
            height: 200,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
    }

    // Start 30-minute countdown
    const thirtyMinutes = 30 * 60;
    const display = document.querySelector('.timer');
    startTimer(thirtyMinutes, display);

    // Setup copy button
    setupCopyButton();

    // Setup payment verification button
    const payBtn = document.querySelector('.pay-btn');
    if (payBtn) {
        payBtn.addEventListener('click', verifyPayment);
    }
});