<?php
// File path for the JSON file
$file = 'registration_data.json';

// Check if form data is received via POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $phone = $_POST['phone'] ?? '';
    $password = $_POST['password'] ?? '';
    $action = $_POST['action'] ?? '';

    // Initialize user data array
    $users = [];

    // If the JSON file exists, read current data
    if (file_exists($file)) {
        $jsonData = file_get_contents($file);
        // Decode JSON data, handling invalid JSON by setting $users to an empty array
        $users = json_decode($jsonData, true);
        if ($users === null) {
            $users = [];
        }
    }

    // Function to find user by phone number
    function findUserByPhone($phone, $users) {
        foreach ($users as $user) {
            if ($user['phone'] === $phone) {
                return $user;
            }
        }
        return null;
    }

    // Function to generate a new unique ID (incrementing)
    function generateUserId($users) {
        if (empty($users)) {
            return 1; // Start with ID 1 if no users exist
        }
        // Get the max existing user ID and increment it
        $lastUser = end($users);
        return $lastUser['id'] + 1;
    }

    // Handle Sign In or Sign Up based on action
    if ($action === 'sign-in') {
        // Sign In: Check if the user exists and validate the password
        $user = findUserByPhone($phone, $users);

        if ($user) {
            // Verify password
            if (password_verify($password, $user['password'])) {
                // Return response with JWT
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Login successful!',
                    'userId' => $user['id'],
                    'balance' => $user['balance'],
                    'phone' => $user['phone']
                ]);
            } else {
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Incorrect password!'
                ]);
            }
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'User not found! Please sign up.'
            ]);
        }
    } elseif ($action === 'sign-up') {
        // Sign Up: Check if the user already exists
        $user = findUserByPhone($phone, $users);

        if ($user) {
            echo json_encode([
                'status' => 'error',
                'message' => 'User already exists! Please sign in.'
            ]);
        } else {
            // Generate a unique ID for the new user
            $newUserId = generateUserId($users);

            // Register the new user
            $newUser = [
                'id' => $newUserId,
                'phone' => $phone,
                'password' => password_hash($password, PASSWORD_DEFAULT),
                'balance' => 0,
            ];

            // Add the new user to the array
            $users[] = $newUser;

            // Save the updated data to the JSON file
            if (file_put_contents($file, json_encode($users, JSON_PRETTY_PRINT)) !== false) {
                // Return success response with JWT token
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Registration successful!',
                    'userId' => $newUserId,
                    'phone' => $phone,
                    'balance' => 0
                ]);
            } else {
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Error saving data!'
                ]);
            }
        }
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid action!'
        ]);
    }
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid request!'
    ]);
}
?>
