// Get the element representing the container for chat messages
let messagesContainer = document.getElementById('messages');

// Automatically scroll the chat messages container to the bottom
messagesContainer.scrollTop = messagesContainer.scrollHeight;

// Get references to member-related elements in the UI
const memberContainer = document.getElementById('members__container');
const memberButton = document.getElementById('members__button');

// Get references to chat-related elements in the UI
const chatContainer = document.getElementById('messages__container');
const chatButton = document.getElementById('chat__button');

// Initialize flags to track the visibility of member and chat containers
let activeMemberContainer = false;
let activeChatContainer = false;

// Add an event listener for the member button to toggle the member container's visibility
memberButton.addEventListener('click', () => {
  if (activeMemberContainer) {
    memberContainer.style.display = 'none';
  } else {
    memberContainer.style.display = 'block';
  }

  // Toggle the active state of the member container
  activeMemberContainer = !activeMemberContainer;
});

// Add an event listener for the chat button to toggle the chat container's visibility
chatButton.addEventListener('click', () => {
  if (activeChatContainer) {
    chatContainer.style.display = 'none';
  } else {
    chatContainer.style.display = 'block';
  }

  // Toggle the active state of the chat container
  activeChatContainer = !activeChatContainer;
});

// Get references to video-related elements in the UI
let displayFrame = document.getElementById('stream__box');
let videoFrames = document.getElementsByClassName('video__container');
let userIdInDisplayFrame = null;

// Function to expand a video frame when clicked
let expandVideoFrame = (e) => {
  // Move the clicked video frame to the display frame
  let child = displayFrame.children[0];
  if(child){
    document.getElementById('streams__container').appendChild(child);
  }

  displayFrame.style.display = 'block';
  displayFrame.appendChild(e.currentTarget);
  userIdInDisplayFrame = e.currentTarget.id;

  // Adjust the size of other video frames
  for(let i = 0; videoFrames.length > i; i++){
    if(videoFrames[i].id != userIdInDisplayFrame){
      videoFrames[i].style.height = '100px';
      videoFrames[i].style.width = '100px';
    }
  }
};

// Add click event listeners to all video frames to expand them
for(let i = 0; videoFrames.length > i; i++){
  videoFrames[i].addEventListener('click', expandVideoFrame);
}

// Function to hide the display frame when clicked
let hideDisplayFrame = () => {
  userIdInDisplayFrame = null;
  displayFrame.style.display = null;

  // Move the video frame back to its original container
  let child = displayFrame.children[0];
  document.getElementById('streams__container').appendChild(child);

  // Reset the size of all video frames
  for(let i = 0; videoFrames.length > i; i++){
    videoFrames[i].style.height = '300px';
    videoFrames[i].style.width = '300px';
  }
};

// Add a click event listener to the display frame to hide it
displayFrame.addEventListener('click', hideDisplayFrame);

