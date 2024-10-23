<?php

function handleMpesaCallback($jsonData) {
    // Decode JSON data
    $data = json_decode($jsonData, true);

    // Check if the data has the required keys
    if (!isset($data['Body']['stkCallback']['ResultCode'], $data['Body']['stkCallback']['CheckoutRequestID'])) {
        error_log('Required keys are missing in the callback data.');
        return; // Exit if required keys are not present
    }

    $resultCode = $data['Body']['stkCallback']['ResultCode'];
    $checkoutRequestId = $data['Body']['stkCallback']['CheckoutRequestID'];

    // Define file paths
    $depositDataFile = 'deposit_data.json';
    $registrationDataFile = 'registration_data.json';
    $transactionIdFile = 'transaction_id.json'; // To store the last used transaction ID

    // Read deposit data from file or initialize an empty array
    $depositData = file_exists($depositDataFile) ? json_decode(file_get_contents($depositDataFile), true) : [];

    // Read or initialize transaction ID
    $transactionId = file_exists($transactionIdFile) ? json_decode(file_get_contents($transactionIdFile), true)['last_transaction_id'] : 0;
    $transactionId++; // Increment the transaction ID

    // Extract CallbackMetadata if it exists
    $callbackMetadata = $data['Body']['stkCallback']['CallbackMetadata']['Item'] ?? [];
    $metadata = [];
    foreach ($callbackMetadata as $item) {
        $metadata[$item['Name']] = $item['Value'];
    }

    // Prepare new transaction data
    $phone = $metadata['PhoneNumber'] ?? 'unknown';
    $amount = $resultCode == 0 ? (int) ($metadata['Amount'] ?? 0) : 0;
    $status = $resultCode == 0 ? 'Completed' : 'Cancelled';
    $mpesaReceiptNumber = $metadata['MpesaReceiptNumber'] ?? 'unknown';

    $newTransaction = [
        'transaction_id' => $transactionId,
        'phone' => $phone,
        'amount' => $amount,
        'status' => $status,
        'mpesa_receipt_number' => $mpesaReceiptNumber
    ];

    // Append new transaction to deposit data
    $depositData[] = $newTransaction;

    // Write updated deposit data to file
    file_put_contents($depositDataFile, json_encode($depositData, JSON_PRETTY_PRINT));

    // Update registration data if transaction is successful
    if ($status === 'Completed') {
        // Read registration data from file or initialize an empty array
        $registrationData = file_exists($registrationDataFile) ? json_decode(file_get_contents($registrationDataFile), true) : [];

        // Format phone number
        $formattedPhone = formatPhoneNumber($phone);

        // Flag to track if the user was found and updated
        $userFound = false;

        // Update user balance based on formatted phone number
        foreach ($registrationData as &$user) {
            if ($user['phone'] === $formattedPhone) {
                $user['balance'] = isset($user['balance']) ? $user['balance'] + $amount : $amount;
                $userFound = true;
                break;
            }
        }

        // If user not found with formatted phone number, try with the original phone number
        if (!$userFound) {
            foreach ($registrationData as &$user) {
                if ($user['phone'] === $phone) {
                    $user['phone'] = $formattedPhone;
                    $user['balance'] = isset($user['balance']) ? $user['balance'] + $amount : $amount;
                    $userFound = true;
                    break;
                }
            }
        }

        // Optionally handle the case if the user is still not found
        if (!$userFound) {
            // Handle user not found case if needed (e.g., log an error or alert)
            error_log("User with phone number $phone not found in registration data.");
        }

        // Write updated registration data to file
        file_put_contents($registrationDataFile, json_encode($registrationData, JSON_PRETTY_PRINT));
    }

    // Update transaction ID file
    file_put_contents($transactionIdFile, json_encode(['last_transaction_id' => $transactionId], JSON_PRETTY_PRINT));
}

function formatPhoneNumber($phone) {
    // Check if phone number starts with 254
    if (substr($phone, 0, 3) === '254') {
        // Replace '254' with '0'
        return '0' . substr($phone, 3);
    }
    return $phone;
}

// Example usage
// Assuming you receive the raw POST data in $rawPostData
$rawPostData = file_get_contents('php://input');
handleMpesaCallback($rawPostData);

?>
