<?php

function updateBalance() {
    // Define file paths
    $registrationDataFile = 'registration_data.json';

    // Read POST data from PHP input
    $data = json_decode(file_get_contents('php://input'), true);

    // Check if required data is provided
    if (!isset($data['phone']) || !isset($data['amount']) || !isset($data['operation'])) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Phone number, amount, or operation not provided'
        ]);
        return;
    }

    $phone = htmlspecialchars($data['phone']);
    $amount = (float)$data['amount'];
    $operation = htmlspecialchars($data['operation']); // 'credit' or 'debit'

    // Validate data
    if ($amount <= 0) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid amount'
        ]);
        return;
    }

    if (!in_array($operation, ['credit', 'debit'])) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid operation'
        ]);
        return;
    }

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

    // Perform operation
    if ($operation === 'debit') {
        if ($currentBalance < $amount) {
            echo json_encode([
                'status' => 'error',
                'message' => 'Insufficient balance'
            ]);
            return;
        }
        $newBalance = $currentBalance - $amount;
    } elseif ($operation === 'credit') {
        $newBalance = $currentBalance + $amount;
    }

    // Update balance
    $registrationData[$userKey]['balance'] = $newBalance;

    // Write updated registration data to file with error handling
    $fileLock = fopen($registrationDataFile, 'c+');
    if (flock($fileLock, LOCK_EX)) {
        ftruncate($fileLock, 0);
        rewind($fileLock);
        if (fwrite($fileLock, json_encode($registrationData, JSON_PRETTY_PRINT)) !== false) {
            echo json_encode([
                'status' => 'success',
                'message' => 'Balance updated successfully',
                'new_balance' => $newBalance
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to write data to file'
            ]);
        }
        flock($fileLock, LOCK_UN);
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Unable to lock file for writing'
        ]);
    }
    fclose($fileLock);
}

// Execute the updateBalance function
updateBalance();
?>
