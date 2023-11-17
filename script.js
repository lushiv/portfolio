let notes = [];

function openForm() {
    document.getElementById("noteForm").style.display = "block";
}

function closeForm() {
    document.getElementById("noteForm").style.display = "none";
}

function saveNote() {
    const noteContent = document.getElementById("noteContent").value;
    const password = document.getElementById("password").value;

    // You can add more robust password validation here
    if (password === "Test@12345") {
        notes.push(noteContent);
        displayNotes();
        closeForm();
    } else {
        alert("Incorrect password. Try again.");
    }
}

function displayNotes() {
    const notesContainer = document.getElementById("notes-container");
    notesContainer.innerHTML = "";

    notes.forEach((note, index) => {
        const noteElement = document.createElement("div");
        noteElement.innerHTML = `<p>${note}</p><button onclick="deleteNote(${index})">Delete</button>`;
        notesContainer.appendChild(noteElement);
    });
}

function deleteNote(index) {
    notes.splice(index, 1);
    displayNotes();
}
