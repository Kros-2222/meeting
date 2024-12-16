// Function to handle when a new member joins the channel
let handleMemberJoined = async (MemberId) => {
    console.log('A new member has joined the room:', MemberId);

    // Add the new member to the DOM
    addMemberToDom(MemberId);

    // Retrieve the updated list of members and update the total count
    let members = await channel.getMembers();
    updateMemberTotal(members);

    // Get the display name of the new member and show a welcome message
    let {name} = await rtmClient.getUserAttributesByKeys(MemberId, ['name']);
    addBotMessageToDom(`Welcome to the room ${name}! 👋`);
};

// Function to add a member to the DOM
let addMemberToDom = async (MemberId) => {
    // Retrieve the name of the member
    let {name} = await rtmClient.getUserAttributesByKeys(MemberId, ['name']);

    // Create HTML for the member item
    let membersWrapper = document.getElementById('member__list');
    let memberItem = `<div class="member__wrapper" id="member__${MemberId}__wrapper">
                        <span class="green__icon"></span>
                        <p class="member_name">${name}</p>
                    </div>`;

    // Append the member item to the member list
    membersWrapper.insertAdjacentHTML('beforeend', memberItem);
};

// Function to update the total count of members
let updateMemberTotal = async (members) => {
    let total = document.getElementById('members__count');
    total.innerText = members.length;
};

// Function to handle when a member leaves the channel
let handleMemberLeft = async (MemberId) => {
    // Remove the member from the DOM
    removeMemberFromDom(MemberId);

    // Retrieve the updated list of members and update the total count
    let members = await channel.getMembers();
    updateMemberTotal(members);
};

// Function to remove a member from the DOM
let removeMemberFromDom = async (MemberId) => {
    let memberWrapper = document.getElementById(`member__${MemberId}__wrapper`);
    let name = memberWrapper.getElementsByClassName('member_name')[0].textContent;

    // Show a message that the member has left
    addBotMessageToDom(`${name} has left the room.`);

    // Remove the member item from the DOM
    memberWrapper.remove();
};

// Function to retrieve the current list of members and update the total count
let getMembers = async () => {
    let members = await channel.getMembers();
    updateMemberTotal(members);

    // Add each member to the DOM
    for (let i = 0; members.length > i; i++){
        addMemberToDom(members[i]);
    }
};

// Function to handle channel messages, including chat messages and user leave notifications
let handleChannelMessage = async (messageData, MemberId) => {
    console.log('A new message was received');
    let data = JSON.parse(messageData.text);

    if(data.type === 'chat'){
        // Add chat message to the DOM
        addMessageToDom(data.displayName, data.message);
    }

    if(data.type === 'user_left'){
        // Remove the video container of the leaving user and adjust display if in larger frame
        document.getElementById(`user-container-${data.uid}`).remove();

        if(userIdInDisplayFrame === `user-container-${uid}`){
            displayFrame.style.display = null;
    
            for(let i = 0; videoFrames.length > i; i++){
                videoFrames[i].style.height = '300px';
                videoFrames[i].style.width = '300px';
            }
        }
    }
};

// Function to send a chat message
let sendMessage = async (e) => {
    e.preventDefault();

    // Get the message from the form input
    let message = e.target.message.value;

    // Send the message to the channel
    channel.sendMessage({text:JSON.stringify({'type':'chat', 'message':message, 'displayName':displayName})});

    // Add the message to the DOM
    addMessageToDom(displayName, message);

    // Reset the form input
    e.target.reset();
};

// Function to add a chat message to the DOM
let addMessageToDom = (name, message) => {
    // Get the messages container
    let messagesWrapper = document.getElementById('messages');

    // Create HTML for the new message
    let newMessage = `<div class="message__wrapper">
                        <div class="message__body">
                            <strong class="message__author">${name}</strong>
                            <p class="message__text">${message}</p>
                        </div>
                    </div>`;

    // Append the new message to the messages container
    messagesWrapper.insertAdjacentHTML('beforeend', newMessage);

    // Scroll to the last message
    let lastMessage = document.querySelector('#messages .message__wrapper:last-child');
    if(lastMessage){
        lastMessage.scrollIntoView();
    }
};

// Function to add a bot message to the DOM
let addBotMessageToDom = (botMessage) => {
    // Get the messages container
    let messagesWrapper = document.getElementById('messages');

    // Create HTML for the new bot message
    let newMessage = `<div class="message__wrapper">
                        <div class="message__body__bot">
                            <strong class="message__author__bot">🤖 Mumble Bot</strong>
                            <p class="message__text__bot">${botMessage}</p>
                        </div>
                    </div>`;

    // Append the new bot message to the messages container
    messagesWrapper.insertAdjacentHTML('beforeend', newMessage);

    // Scroll to the last message
    let lastMessage = document.querySelector('#messages .message__wrapper:last-child');
    if(lastMessage){
        lastMessage.scrollIntoView();
    }
};

// Function to leave the channel and log out the RTM client when the window is closed or refreshed
let leaveChannel = async () => {
    await channel.leave();
    await rtmClient.logout();
};

// Add an event listener to handle leaving the channel before the window is closed or refreshed
window.addEventListener('beforeunload', leaveChannel);

// Get the message form element and add an event listener for form submission
let messageForm = document.getElementById('message__form');
messageForm.addEventListener('submit', sendMessage);
