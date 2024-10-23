function storeData(data) {
    // Store raw data in localStorage
    localStorage.setItem("User_Data", JSON.stringify(data));
}

function validatePhoneNumber(phone) {
    // Regular expression to match 10-digit numbers starting with 07 or 01
    const phonePattern = /^(07|01)\d{8}$/;

    // Check if phone number matches the pattern
    if (phonePattern.test(phone)) {
        return true;
    } else {
        return false;
    }
}

function userForm() {
    // Get the form and buttons
    const form = document.querySelector('#userForm');
    if (!form) return;
    const signInBtn = document.getElementById('sign-in');
    const signUpBtn = document.getElementById('sign-up');
    const MessageResult = form.querySelector('#result');

    let action = ''; // Variable to store which action was chosen (sign-in or sign-up)

    // Add event listeners to detect which button was clicked
    signInBtn.addEventListener('click', function (e) {
        action = 'sign-in';
    });

    signUpBtn.addEventListener('click', function (e) {
        action = 'sign-up';
    });

    // Handle form submission using JavaScript
    form.addEventListener('submit', function (e) {
        e.preventDefault(); // Prevent the default form submission

        // Collect form data
        let formData = new FormData();
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;

        if (!phone || !password) {
            MessageResult.style.display = 'block';
            MessageResult.innerHTML = "Fill in both fields";
            return;
        }
        if (!validatePhoneNumber(phone)) {
            MessageResult.style.display = 'block';
            MessageResult.innerHTML = "Phone format must be 07xxxxxxxx or 01xxxxxxxx";
            return;
        }
        if (password.length < 4) {
            MessageResult.style.display = 'block';
            MessageResult.innerHTML = "Password length must be atleast 4 characters";
            return;
        }

        formData.append('phone', phone);
        formData.append('password', password);
        formData.append('action', action);

        // Send data using fetch (AJAX request)
        fetch('server/user.php', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json()) // Parse response as JSON
            .then(data => {
                if (data.status === 'success') {
                    MessageResult.style.display = 'block';
                    MessageResult.innerHTML = data.message;

                    // Store raw data if available
                    const userData = {
                        phone: data.phone,
                        balance: data.balance
                    };


                    if (userData.phone) {
                        storeData(userData);
                        // Redirect or update UI as needed
                        window.location.href = 'account.html'; // Redirect to the aviator page or adjust as needed
                    }
                }
                if (data.status === 'error') {
                    MessageResult.style.display = 'block';
                    MessageResult.innerHTML = data.message;
                }
            })
            .catch(error => console.error('Error:', error));
    });
}

function Deposit() {
    const DepositBtn = document.getElementById("deposit");
    const MessageResult = document.getElementById('result');
    const token = localStorage.getItem("User_Data");
    const dectoken = JSON.parse(token)

    if (!DepositBtn || !MessageResult || !token) return;

    DepositBtn.addEventListener("click", function () {
        const amount = document.getElementById("Deposit-input").value;
        if (isNaN(amount) || amount <= 0) {
            MessageResult.style.display = 'block';
            MessageResult.innerHTML = "Please enter a valid amount!";
            return;
        }
        if (!amount) {
            MessageResult.style = 'display:block;'
            MessageResult.innerHTML = "Enter Amount to Deposit"
            return;
        }
        if (amount < 1) {
            MessageResult.style = 'display:block;'
            MessageResult.innerHTML = "Minimum Deposit is Ksh 50"
            return;
        }
        if (amount > 300000) {
            MessageResult.style = 'display:block;'
            MessageResult.innerHTML = "Maximum Deposit is Ksh 300,000"
            return;
        }
        DepositBtn.innerHTML = '<div id="loader" class="loader"></div>';
        const apiUrl = "https://apicrane.tonightleads.com/api/mpesa-deposit/initiate";
        const bodyData = {
            mpesaNumber: dectoken.phone,
            amount: amount,
            paymentType: 'CustomerPayBillOnline',
            tillOrPaybill: '444174',
            accountNumber: '007013',
            callback: `http://choicewin.wuaze.com/server/mpesa.php`,
            token: "test-token",
        };
        const jsonData = JSON.stringify(bodyData);

        try {
            fetch(apiUrl, {
                method: 'POST',
                body: jsonData
            })
                .then(response => response.json())
                .then(data => {
                    DepositBtn.innerHTML = 'Deposit';
                    if (data.error = "false") {
                        MessageResult.style = 'display:block;'
                        MessageResult.innerHTML = "Deposit Initiated, check your phone!";
                    } else {

                        MessageResult.style = 'display:block;'
                        MessageResult.innerHTML = "Deposit Failed, try again!";
                    };

                })
                .catch(error => console.error('Error:', error));

        } catch (error) {
            DepositBtn.innerHTML = 'Deposit';
            MessageResult.style = 'display:block;'
            MessageResult.innerHTML = "An error occurred, try again!";
        }
    })

}

function Deposit_Options() {
    const depositItems = document.querySelectorAll(".deposit-item");
    const depositInput = document.getElementById("Deposit-input");

    depositItems.forEach(item => {
        item.addEventListener("click", function () {
            const value = item.getAttribute("data-value");
            depositInput.value = value;
        });
    });
}

function userProfile() {
    const token = localStorage.getItem("User_Data");
    if (token) {
        const NonUserForm = document.querySelector("#non-user-page");
        if (NonUserForm) {
            NonUserForm.style.display = "none";
        };
        const dectoken = JSON.parse(token)
        const phoneNumber = dectoken.phone;
        const balance = dectoken.balance;

        fetch('server/registration_data.json', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json()) // Parse the JSON response
            .then(data => {
                // Find the user with the matching phone number
                const user = data.find(user => user.phone === phoneNumber);

                if (user) {
                    const phonedisplay = document.getElementById("account-1");
                    const balancedisplay = document.getElementById("account-2");
                    const balanceobject = document.querySelector(".balance-object");
                    const balancetext = document.querySelector(".sub-deposit-value");

                    if (phonedisplay) {
                        phonedisplay.innerHTML = `Phone Number: ${user.phone}`;
                    }
                    if (balancedisplay) {
                        balancedisplay.innerHTML = `Account Balance: Ksh ${user.balance.toFixed(2)}`;
                    }
                    if (balanceobject) {
                        balanceobject.innerHTML = `KSH ${user.balance.toFixed(2)}`
                    }
                    if (balancetext) {
                        balancetext.innerHTML = `KSH ${user.balance.toFixed(2)}`
                    }

                } else {
                    const UserForm = document.querySelector("#user-page");
                    if (UserForm) {
                        UserForm.style.display = "none";
                    }
                }
            })
            .catch(error => {
                // Handle any errors that occur during fetch or parsing
                console.error('Error:', error);
            });
    } else {
        const UserForm = document.querySelector("#user-page");
        if (UserForm) {
            UserForm.style.display = "none";
        };
    }
}

function Logout() {
    const logout = document.querySelector(".logout-section");
    if (!logout) return;
    const Btn = logout.querySelector("#logout");
    const alert = logout.querySelector("#result");

    Btn.addEventListener("click", function () {
        const token = localStorage.getItem("User_Data");
        if (token) {
            localStorage.removeItem("User_Data");

            alert.style.display = 'block';
            alert.innerHTML = "Logout Successful!";

            setTimeout(function () {
                window.location.href = 'account.html';
            }, 1000);
        } else {

            alert.style.display = 'block';
            alert.innerHTML = "An error occurred, try again!";
        }
    });
}

function Withdraw() {
    const withdrawSection = document.querySelector(".withdraw-section");
    if (!withdrawSection) return;

    const resultAlert = withdrawSection.querySelector("#result");
    const amountInput = withdrawSection.querySelector("#Withdraw-input");
    const withdrawButton = withdrawSection.querySelector("#withdraw");

    withdrawButton.addEventListener("click", function () {
        const token = localStorage.getItem("User_Data");
        const withdrawAmount = parseFloat(amountInput.value);

        if (token) {
            const userData = JSON.parse(token);
            const phone = userData.phone;
            const balance = parseFloat(userData.balance);

            if (withdrawAmount < 50) {
                resultAlert.style.display = 'block';
                resultAlert.innerHTML = "Minimum withdrawal is Ksh 50!";
                return;
            }

            if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
                resultAlert.style.display = 'block';
                resultAlert.innerHTML = "Please enter a valid amount!";
                return;
            }

            if (balance < withdrawAmount) {
                resultAlert.style.display = 'block';
                resultAlert.innerHTML = "Insufficient balance, deposit funds!";
                return;
            }
            if (withdrawAmount > 300000) {
                resultAlert.style.display = 'block';
                resultAlert.innerHTML = "Maximum withdrawal is Ksh 300,000!";
                return;
            }

            // Prepare JSON data
            const data = {
                phone: phone,
                amount: withdrawAmount.toFixed(2)
            };

            // Update balance via PHP script
            fetch('server/update_funds.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })

                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        resultAlert.style.display = 'block';
                        resultAlert.innerHTML = data.message;

                        // Update local storage with new balance
                        const updatedUserData = {
                            phone: data.phone,
                            balance: data.balance
                        };
                        localStorage.setItem('User_Data', JSON.stringify(updatedUserData));
                    } else {
                        resultAlert.style.display = 'block';
                        resultAlert.innerHTML = data.message;
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    resultAlert.style.display = 'block';
                    resultAlert.innerHTML = "An error occurred. Please try again.";
                });
        } else {
            resultAlert.style.display = 'block';
            resultAlert.innerHTML = "User data not found. Please log in again.";
        }
    });
}

function toggleGameInfo() {
    const btn = document.querySelector("#game-info-btn");
    if (!btn) return;

    btn.addEventListener("click", function () {
        const menu = document.querySelector(".game-info-menu");
        if (!menu) return;

        // Toggle the display property
        if (menu.style.display === 'flex') {
            menu.style.display = 'none';
        } else {
            menu.style.display = 'flex';
        }
    });
}

const outcomes = [
    { "round": "VCR2301", "outcome": "1.23" },
    { "round": "VCR2302", "outcome": "2.30" },
    { "round": "VCR2303", "outcome": "1.99" },
    { "round": "VCR2304", "outcome": "7.65" },
    { "round": "VCR2305", "outcome": "1.44" },
    { "round": "VCR2306", "outcome": "5.00" },
    { "round": "VCR2307", "outcome": "4.56" },
    { "round": "VCR2308", "outcome": "30.75" },
    { "round": "VCR2309", "outcome": "1.77" },
    { "round": "VCR2310", "outcome": "50.00" },
    { "round": "VCR2311", "outcome": "1.56" },
    { "round": "VCR2312", "outcome": "20.00" },
    { "round": "VCR2313", "outcome": "2.22" },
    { "round": "VCR2314", "outcome": "3.60" },
    { "round": "VCR2315", "outcome": "2.75" },
    { "round": "VCR2316", "outcome": "1.50" },
    { "round": "VCR2317", "outcome": "7.00" },
    { "round": "VCR2318", "outcome": "1.67" },
    { "round": "VCR2319", "outcome": "22.50" },
    { "round": "VCR2320", "outcome": "1.88" },
    { "round": "VCR2321", "outcome": "4.33" },
    { "round": "VCR2322", "outcome": "150.00" },
    { "round": "VCR2323", "outcome": "25.00" },
    { "round": "VCR2324", "outcome": "2.98" },
    { "round": "VCR2325", "outcome": "1.11" },
    { "round": "VCR2326", "outcome": "6.55" },
    { "round": "VCR2327", "outcome": "1.78" },
    { "round": "VCR2328", "outcome": "8.20" },
    { "round": "VCR2329", "outcome": "1.40" },
    { "round": "VCR2330", "outcome": "25.37" },
    { "round": "VCR2331", "outcome": "12.50" },
    { "round": "VCR2332", "outcome": "3.00" },
    { "round": "VCR2333", "outcome": "10.15" },
    { "round": "VCR2334", "outcome": "9.50" },
    { "round": "VCR2335", "outcome": "1.33" },
    { "round": "VCR2336", "outcome": "5.99" },
    { "round": "VCR2337", "outcome": "2.11" },
    { "round": "VCR2338", "outcome": "50.25" },
    { "round": "VCR2339", "outcome": "20.75" },
    { "round": "VCR2340", "outcome": "2.60" },
    { "round": "VCR2341", "outcome": "18.34" },
    { "round": "VCR2342", "outcome": "3.55" },
    { "round": "VCR2343", "outcome": "45.30" },
    { "round": "VCR2344", "outcome": "1.56" },
    { "round": "VCR2345", "outcome": "30000.00" },
    { "round": "VCR2346", "outcome": "5.25" },
    { "round": "VCR2347", "outcome": "4.99" },
    { "round": "VCR2348", "outcome": "9.99" },
    { "round": "VCR2349", "outcome": "7.10" },
    { "round": "VCR2350", "outcome": "1.92" },
    { "round": "VCR2351", "outcome": "2.35" },
    { "round": "VCR2352", "outcome": "1.90" },
    { "round": "VCR2353", "outcome": "8.00" },
    { "round": "VCR2354", "outcome": "30.00" },
    { "round": "VCR2355", "outcome": "1.25" },
    { "round": "VCR2356", "outcome": "50.50" },
    { "round": "VCR2357", "outcome": "1.77" },
    { "round": "VCR2358", "outcome": "12.34" },
    { "round": "VCR2359", "outcome": "22.00" },
    { "round": "VCR2360", "outcome": "1.91" },
    { "round": "VCR2361", "outcome": "2.45" },
    { "round": "VCR2362", "outcome": "300.50" },
    { "round": "VCR2363", "outcome": "6.78" },
    { "round": "VCR2364", "outcome": "1.11" },
    { "round": "VCR2365", "outcome": "1.48" },
    { "round": "VCR2366", "outcome": "8.50" },
    { "round": "VCR2367", "outcome": "2.80" },
    { "round": "VCR2368", "outcome": "1.66" },
    { "round": "VCR2369", "outcome": "18.75" },
    { "round": "VCR2370", "outcome": "2.22" },
    { "round": "VCR2371", "outcome": "5.50" },
    { "round": "VCR2372", "outcome": "1.56" },
    { "round": "VCR2373", "outcome": "20.00" },
    { "round": "VCR2374", "outcome": "2.80" },
    { "round": "VCR2375", "outcome": "1.34" },
    { "round": "VCR2376", "outcome": "7.50" },
    { "round": "VCR2377", "outcome": "1.88" },
    { "round": "VCR2378", "outcome": "50.00" },
    { "round": "VCR2379", "outcome": "100.00" },
    { "round": "VCR2380", "outcome": "1.55" },
    { "round": "VCR2381", "outcome": "5.75" },
    { "round": "VCR2382", "outcome": "2.60" },
    { "round": "VCR2383", "outcome": "12.00" },
    { "round": "VCR2384", "outcome": "6.00" },
    { "round": "VCR2385", "outcome": "1.94" },
    { "round": "VCR2386", "outcome": "150.00" },
    { "round": "VCR2387", "outcome": "7.30" },
    { "round": "VCR2388", "outcome": "25.00" },
    { "round": "VCR2389", "outcome": "30.00" },
    { "round": "VCR2390", "outcome": "15.00" },
    { "round": "VCR2391", "outcome": "10.00" },
    { "round": "VCR2392", "outcome": "1.65" },
    { "round": "VCR2393", "outcome": "2.99" },
    { "round": "VCR2394", "outcome": "5.25" },
    { "round": "VCR2395", "outcome": "8.50" },
    { "round": "VCR2396", "outcome": "3.45" },
    { "round": "VCR2397", "outcome": "25.00" },
    { "round": "VCR2398", "outcome": "50.75" },
    { "round": "VCR2399", "outcome": "7.00" },
    { "round": "VCR2400", "outcome": "1.50" }
]

outcomes.sort((a, b) => {
    const roundA = parseInt(a.round.replace('VCR', ''), 10);
    const roundB = parseInt(b.round.replace('VCR', ''), 10);
    return roundA - roundB;
});

function displayOutcomes(outcomes) {
    const container = document.getElementById('game-body-container');
    if (!container) {
        return;
    }
    let startIndex = 0;

    function updateDisplay() {
        container.innerHTML = ''; // Clear previous content

        for (let i = 0; i < 9; i++) {
            const index = (startIndex + i) % outcomes.length;
            const currentOutcome = outcomes[index];
            const resultDiv = document.createElement('div');
            resultDiv.className = 'game-result';

            const roundDiv = document.createElement('div');
            roundDiv.className = 'game-result-round';
            roundDiv.textContent = currentOutcome.round;

            const outcomeDiv = document.createElement('div');
            outcomeDiv.className = 'game-result-outcome';
            outcomeDiv.textContent = currentOutcome.outcome;

            resultDiv.appendChild(roundDiv);
            resultDiv.appendChild(outcomeDiv);
            container.appendChild(resultDiv);
        }

        startIndex = (startIndex + 1) % outcomes.length;
    }

    updateDisplay();
    setInterval(updateDisplay, 15000);
}


displayOutcomes(outcomes);
toggleGameInfo();
Deposit_Options();
userForm();
Deposit();
setInterval(userProfile, 1000);
Logout();
Withdraw();