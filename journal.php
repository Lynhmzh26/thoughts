<?php
include 'config.php';
session_start();

if (!isset($_SESSION['username'])) {
    header('Location: login.php');
    exit();
}

// Get the user ID based on the logged-in username
$username = $_SESSION['username'];
$user_id_query = "SELECT id FROM users WHERE username='$username'";
$user_id_result = $conn->query($user_id_query);

if (!$user_id_result) {
    echo json_encode(['error' => 'Error fetching user ID: ' . $conn->error]);
    exit();
}

$user = $user_id_result->fetch_assoc();
$user_id = $user['id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    // Add a new entry
    if (isset($data['action']) && $data['action'] === 'add' && isset($data['entry'])) {
        $entry = $conn->real_escape_string($data['entry']);
        $sql = "INSERT INTO entries (text, user_id, created_at) VALUES ('$entry', '$user_id', NOW())";
        if ($conn->query($sql) === TRUE) {
            echo json_encode(['id' => $conn->insert_id, 'text' => $data['entry'], 'created_at' => date('Y-m-d H:i:s')]);
        } else {
            echo json_encode(['error' => 'Error: ' . $sql . "<br>" . $conn->error]);
        }
    }

    // Delete an entry
    if (isset($data['action']) && $data['action'] === 'delete' && isset($data['id'])) {
        $id = $conn->real_escape_string($data['id']);
        $sql = "DELETE FROM entries WHERE id='$id' AND user_id='$user_id'";
        if ($conn->query($sql) === TRUE) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['error' => 'Error: ' . $sql . "<br>" . $conn->error]);
        }
    }

    // Edit an entry
    if (isset($data['action']) && $data['action'] === 'edit' && isset($data['id']) && isset($data['entry'])) {
        $id = $conn->real_escape_string($data['id']);
        $entry = $conn->real_escape_string($data['entry']);
        $sql = "UPDATE entries SET text='$entry' WHERE id='$id' AND user_id='$user_id'";
        if ($conn->query($sql) === TRUE) {
            echo json_encode(['success' => true, 'text' => $data['entry']]);
        } else {
            echo json_encode(['error' => 'Error: ' . $sql . "<br>" . $conn->error]);
        }
    }

} else {
    // Handle GET requests for fetching entries
    $search = isset($_GET['search']) ? $conn->real_escape_string($_GET['search']) : '';
    $date = isset($_GET['date']) ? $conn->real_escape_string($_GET['date']) : '';

    $sql = "SELECT * FROM entries WHERE user_id='$user_id'";

    if ($date) {
        $sql .= " AND DATE(created_at) = '$date'";
    } elseif ($search) {
        $sql .= " AND text LIKE '%$search%'";
    }

    $sql .= " ORDER BY id DESC";

    $result = $conn->query($sql);

    if (!$result) {
        echo json_encode(['error' => 'Error: ' . $conn->error]);
        exit();
    }

    $entries = [];
    while ($row = $result->fetch_assoc()) {
        $entries[] = $row;
    }

    echo json_encode($entries);
}

$username = $_SESSION['username'];
$user_id_query = "SELECT id FROM users WHERE username='$username'";
$user_id_result = $conn->query($user_id_query);
$user = $user_id_result->fetch_assoc();
$user_id = $user['id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    // Send an entry to another user
    if (isset($data['action']) && $data['action'] === 'send' && isset($data['id']) && isset($data['recipient_username'])) {
        $entryId = $conn->real_escape_string($data['id']);
        $recipientUsername = $conn->real_escape_string($data['recipient_username']);

        // Get the recipient's user ID
        $recipientQuery = "SELECT id FROM users WHERE username='$recipientUsername'";
        $recipientResult = $conn->query($recipientQuery);

        if ($recipientResult->num_rows > 0) {
            $recipient = $recipientResult->fetch_assoc();
            $recipientId = $recipient['id'];

            // Check if the entry exists and belongs to the current user
            $entryQuery = "SELECT * FROM entries WHERE id='$entryId' AND user_id='$user_id'";
            $entryResult = $conn->query($entryQuery);

            if ($entryResult->num_rows > 0) {
                $entry = $entryResult->fetch_assoc();

                // Duplicate the entry for the recipient, including the sender's info
                $entryText = $conn->real_escape_string($entry['text']);
                $fromUser = $conn->real_escape_string($username);
                $duplicateEntryQuery = "INSERT INTO entries (text, user_id, sender_username) VALUES ('$entryText', '$recipientId', '$fromUser')";

                if ($conn->query($duplicateEntryQuery) === TRUE) {
                    echo json_encode(['success' => true]);
                } else {
                    echo json_encode(['error' => 'Failed to send entry.']);
                }
            } else {
                echo json_encode(['error' => 'Entry not found or access denied.']);
            }
        } else {
            echo json_encode(['error' => 'Recipient not found.']);
        }
    }

}

$conn->close();
?>
