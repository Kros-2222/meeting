// Get the form element with the ID 'lobby__form'
let form = document.getElementById('lobby__form')

// Retrieve the display name from sessionStorage
let displayName = sessionStorage.getItem('display_name')

// Check if display name exists and pre-fill the form input
if(displayName){
    form.name.value = displayName
}

// Add an event listener for the form submission
form.addEventListener('submit', (e) => {
    // Prevent the default form submission behavior
    e.preventDefault()

    // Store the entered display name in sessionStorage
    sessionStorage.setItem('display_name', e.target.name.value)

    // Retrieve the invite code from the form's room input
    let inviteCode = e.target.room.value

    // If no invite code is provided, generate a random one
    if(!inviteCode){
        inviteCode = String(Math.floor(Math.random() * 10000))
    }

    // Redirect to the room.html page with the specified room parameter
    window.location = `room.html?room=${inviteCode}`
})
