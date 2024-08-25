document.addEventListener('DOMContentLoaded', () => {
    const entriesContainer = document.getElementById('entries');
    const entryForm = document.getElementById('entryForm');
    const entryText = document.getElementById('entryText');
    const searchDate = document.getElementById('searchDate');
    const searchBtn = document.getElementById('searchBtn');

    const modal = document.getElementById('modal');
    const modalEntryText = document.getElementById('modalEntryText');
    const saveEditBtn = document.getElementById('saveEditBtn');
    const closeModal = document.querySelector('.close');

    const sendModal = document.getElementById('sendModal');
    const closeSendModal = document.querySelector('.closeSendModal');
    const sendForm = document.getElementById('sendForm');
    const recipientUsernameInput = document.getElementById('recipientUsername');

    let editingEntryId = null;
    let entryIdToSend = null;

    // Load entries
    function loadEntries(search = '', date = '') {
        entriesContainer.innerHTML = '';
        let query = '';

        if (date) {
            query = `?date=${encodeURIComponent(date)}`;
        } else if (search) {
            query = `?search=${encodeURIComponent(search)}`;
        }

        fetch(`journal.php${query}`)
            .then(response => response.json())
            .then(entries => {
                entries.forEach(entry => {
                    displayEntry(entry);
                });
            });
    }
    loadEntries();

    // Handle form submission
    entryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newEntry = entryText.value.trim();
        if (newEntry) {
            saveEntry(newEntry);
            entryText.value = '';
        }
    });

    // Search functionality
    searchBtn.addEventListener('click', () => {
        const dateValue = searchDate.value;
        loadEntries('', dateValue);
    });

    // Display an entry in the list
    function displayEntry(entry) {
        const entryDiv = document.createElement('div');
        entryDiv.classList.add('entry');
        entryDiv.innerHTML = `
            <p>${entry.text}</p>
            <p class="timestamp">Created on: ${new Date(entry.created_at).toLocaleString()}</p>
            ${entry.sender_username ? `<p class="sender">Sent by: ${entry.sender_username}</p>` : ''}
            <button class="editBtn" data-id="${entry.id}">Edit</button>
            <button class="deleteBtn" data-id="${entry.id}">Delete</button>
            <button class="viewBtn" data-id="${entry.id}">View</button>
            <button class="sendBtn" data-id="${entry.id}">Send</button>
        `;
        entriesContainer.prepend(entryDiv); // Add to the top
    
        // Attach event listeners to the buttons
        entryDiv.querySelector('.editBtn').addEventListener('click', () => openEditModal(entry));
        entryDiv.querySelector('.deleteBtn').addEventListener('click', () => deleteEntry(entry.id));
        entryDiv.querySelector('.viewBtn').addEventListener('click', () => openViewModal(entry.text));
        entryDiv.querySelector('.sendBtn').addEventListener('click', () => openSendModal(entry.id));
    }
    


    // Save a new entry
    function saveEntry(text) {
        fetch('journal.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'add', entry: text })
        })
        .then(response => response.json())
        .then(entry => {
            if (!entry.error) {
                displayEntry(entry);
            }
        });
    }

    // Delete an entry with confirmation alert
    function deleteEntry(id) {
        if (confirm('Are you sure you want to delete this entry?')) {
            fetch('journal.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'delete', id: id })
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    document.querySelector(`[data-id='${id}']`).closest('.entry').remove();
                    alert('Entry successfully deleted.');
                }
            });
        }
    }

    // Open edit modal
    function openEditModal(entry) {
        editingEntryId = entry.id;
        modalEntryText.value = entry.text;
        modal.style.display = 'block';
    }

    // Open view modal
    function openViewModal(text) {
        modalEntryText.value = text;
        modalEntryText.readOnly = true;
        saveEditBtn.style.display = 'none';
        modal.style.display = 'block';
    }

    // Save edited entry with confirmation alert
    saveEditBtn.addEventListener('click', () => {
        const updatedText = modalEntryText.value.trim();
        if (updatedText) {
            fetch('journal.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'edit', id: editingEntryId, entry: updatedText })
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    document.querySelector(`[data-id='${editingEntryId}']`).closest('.entry').querySelector('p').textContent = result.text;
                    modal.style.display = 'none';
                    alert('Changes saved successfully.');
                }
            });
        }
    });

    

    // Function to open the Send Modal
    function openSendModal(entryId) {
        entryIdToSend = entryId;
        recipientUsernameInput.value = '';
        sendModal.style.display = 'block';
    }

    // Handle Send Form Submission
    sendForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const recipientUsername = recipientUsernameInput.value.trim();
        if (recipientUsername && entryIdToSend) {
            fetch('journal.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'send',
                    id: entryIdToSend,
                    recipient_username: recipientUsername
                })
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert('Entry sent successfully.');
                } else if (result.error) {
                    alert('Error: ' + result.error);
                }
                sendModal.style.display = 'none';
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while sending the entry.');
                sendModal.style.display = 'none';
            });
        }
    });

    // Close Send Modal
    closeSendModal.addEventListener('click', () => {
        sendModal.style.display = 'none';
    });

    // Close Send Modal when clicking outside of it
    window.addEventListener('click', (e) => {
        if (e.target == sendModal) {
            sendModal.style.display = 'none';
        }
    });

    // Close modal
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
        saveEditBtn.style.display = 'inline-block';
        modalEntryText.readOnly = false;
    });

    // Close modal when clicking outside of it
    window.addEventListener('click', (e) => {
        if (e.target == modal) {
            modal.style.display = 'none';
            saveEditBtn.style.display = 'inline-block';
            tryText.readOnly = false;
        }
    });
});
