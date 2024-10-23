<?php

function updateFunds() {
    // Define file paths
    $registrationDataFile = 'registration_data.json';
    
    // Get POST data
    $data = json_decode(file_get_contents('php://input'), true);

    // Check if required data is provided
    if (!isset($data['phone']) || !isset($data['amount'])) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Phone number or amount not provided'
        ]);
        return;
    }

    $phone = $data['phone'];
    $withdrawAmount = (float)$data['amount'];

    // Read registration data from file
    if (!file_exists($registrationDataFile)) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Registration data file not found'
        ]);
        return;
    }

    $registrationData = json_decode(file_get_contents($registrationDataFile), true);

    // Find user by phone number
    $userKey = array_search($phone, array_column($registrationData, 'phone'));

    if ($userKey === false) {
        echo json_encode([
            'status' => 'error',
            'message' => 'User not found'
        ]);
        return;
    }

    // Get user data
    $user = $registrationData[$userKey];
    $currentBalance = (float)$user['balance'];

    // Check if user has sufficient balance
    if ($currentBalance < $withdrawAmount) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Insufficient balance'
        ]);
        return;
    }

    // Deduct amount from balance
    $registrationData[$userKey]['balance'] = $currentBalance - $withdrawAmount;

    // Write updated registration data to file
    if (file_put_contents($registrationDataFile, json_encode($registrationData, JSON_PRETTY_PRINT))) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Withdrawal successful, it will be processed within 6 hours!',
            'phone' => $phone,
            'balance' => $registrationData[$userKey]['balance']
        ]);
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to update balance'
        ]);
    }
}

// Execute the updateFunds function
updateFunds();
