const APP_ID = "a6374e5c6f764cedae630849814f4426"// Agora App ID for video and voice communication

let uid = sessionStorage.getItem('uid')// Retrieve or generate a unique user ID for the session
if(!uid){
    uid = String(Math.floor(Math.random() * 10000))
    sessionStorage.setItem('uid', uid)
}

let token = null;// Initialize variables for token, Agora RTC client, RTM client, and channel
let client;

let rtmClient;
let channel;

const queryString = window.location.search// Parse room ID from the URL parameters or set a default value
const urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get('room')

if(!roomId){
    roomId = 'main'
}

let displayName = sessionStorage.getItem('display_name')// Retrieve or redirect user to the lobby if display name is not set
if(!displayName){
    window.location = 'lobby.html'
}
// Initialize arrays and flags for local and remote tracks
let localTracks = []
let remoteUsers = {}

let localScreenTracks;
let sharingScreen = false;

let joinRoomInit = async () => {// Function to initialize the Agora RTM and RTC clients, and join the channel
    rtmClient = await AgoraRTM.createInstance(APP_ID)// Create an instance of the Agora RTM client and login
    await rtmClient.login({uid,token})

    await rtmClient.addOrUpdateLocalUserAttributes({'name':displayName})// Set user attributes in the RTM channel

    channel = await rtmClient.createChannel(roomId)    // Create an instance of the RTM channel and join
    await channel.join()

    channel.on('MemberJoined', handleMemberJoined)   // Set up event handlers for RTM channel events
    channel.on('MemberLeft', handleMemberLeft)
    channel.on('ChannelMessage', handleChannelMessage)

    getMembers()    // Get the list of members and display a welcome message
    addBotMessageToDom(`Welcome to the room ${displayName}! 👋`)

    client = AgoraRTC.createClient({mode:'rtc', codec:'vp8'})// Create an instance of the Agora RTC client and join the channel
    await client.join(APP_ID, roomId, token, uid)

    client.on('user-published', handleUserPublished)  // Set up event handlers for RTC client events
    client.on('user-left', handleUserLeft)
}

let joinStream = async () => {// Function to initiate joining the video stream
    document.getElementById('join-btn').style.display = 'none'// Hide the join button and display stream actions
    document.getElementsByClassName('stream__actions')[0].style.display = 'flex'

    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks({}, {encoderConfig:{// Create local microphone and camera tracks with specified encoder configurations
        width:{min:640, ideal:1920, max:1920},
        height:{min:480, ideal:1080, max:1080}
    }})

    // Insert a video container for the local player
    let player = `<div class="video__container" id="user-container-${uid}"> 
                    <div class="video-player" id="user-${uid}"></div>
                 </div>`

    document.getElementById('streams__container').insertAdjacentHTML('beforeend', player)
    document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame)

    localTracks[1].play(`user-${uid}`)// Play and publish local audio and video tracks
    await client.publish([localTracks[0], localTracks[1]])
}

let switchToCamera = async () => {// Function to switch to the camera view
    // Insert a video container for the local camera player
    let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                 </div>`
    displayFrame.insertAdjacentHTML('beforeend', player)

    await localTracks[0].setMuted(true)// Mute audio and video tracks, update UI buttons
    await localTracks[1].setMuted(true)

    document.getElementById('mic-btn').classList.remove('active')
    document.getElementById('screen-btn').classList.remove('active')

    localTracks[1].play(`user-${uid}`) // Play local camera track and publish it
    await client.publish([localTracks[1]])
}

let handleUserPublished = async (user, mediaType) => {// Function to handle the publication of a remote user's track
    remoteUsers[user.uid] = user// Store information about remote users

    await client.subscribe(user, mediaType) // Subscribe to the remote user's track

    let player = document.getElementById(`user-container-${user.uid}`) // Check if the player for the remote user exists, if not, create one
     // Adjust the size of the video frame if it is currently displayed in a larger frame
    if(player === null){
        player = `<div class="video__container" id="user-container-${user.uid}">
                <div class="video-player" id="user-${user.uid}"></div>
            </div>`

        document.getElementById('streams__container').insertAdjacentHTML('beforeend', player)
        document.getElementById(`user-container-${user.uid}`).addEventListener('click', expandVideoFrame)
   
    }

    if(displayFrame.style.display){
        let videoFrame = document.getElementById(`user-container-${user.uid}`)
        videoFrame.style.height = '100px'
        videoFrame.style.width = '100px'
    }
    // Play the video or audio track based on the media type
    if(mediaType === 'video'){
        user.videoTrack.play(`user-${user.uid}`)
    }

    if(mediaType === 'audio'){
        user.audioTrack.play()
    }

}

let handleUserLeft = async (user) => {// Function to handle when a remote user leaves
    // Remove the remote user from the list
    delete remoteUsers[user.uid]
    let item = document.getElementById(`user-container-${user.uid}`)
    if(item){
        item.remove()
    }
    // If the remote user was in the larger display frame, reset the display
    if(userIdInDisplayFrame === `user-container-${user.uid}`){
        displayFrame.style.display = null
        
        let videoFrames = document.getElementsByClassName('video__container')

        for(let i = 0; videoFrames.length > i; i++){
            videoFrames[i].style.height = '300px'
            videoFrames[i].style.width = '300px'
        }
    }
}
// Function to toggle the local microphone state
let toggleMic = async (e) => {
    let button = e.currentTarget

    if(localTracks[0].muted){
        await localTracks[0].setMuted(false)
        button.classList.add('active')
    }else{
        await localTracks[0].setMuted(true)
        button.classList.remove('active')
    }
}
// Function to toggle the local camera state
let toggleCamera = async (e) => {
    let button = e.currentTarget

    if(localTracks[1].muted){
        await localTracks[1].setMuted(false)
        button.classList.add('active')
    }else{
        await localTracks[1].setMuted(true)
        button.classList.remove('active')
    }
}

let toggleScreen = async (e) => {// Function to toggle the local screen sharing
    let screenButton = e.currentTarget
    let cameraButton = document.getElementById('camera-btn')

    if(!sharingScreen){// Toggle between screen sharing and camera view
        sharingScreen = true

        screenButton.classList.add('active')
        cameraButton.classList.remove('active')
        cameraButton.style.display = 'none'

        localScreenTracks = await AgoraRTC.createScreenVideoTrack()// Create a screen video track and display it in the larger frame

        document.getElementById(`user-container-${uid}`).remove()
        displayFrame.style.display = 'block'

        let player = `<div class="video__container" id="user-container-${uid}">
                <div class="video-player" id="user-${uid}"></div>
            </div>`

        displayFrame.insertAdjacentHTML('beforeend', player)
        document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame)

        userIdInDisplayFrame = `user-container-${uid}`
        localScreenTracks.play(`user-${uid}`)

        await client.unpublish([localTracks[1]])// Unpublish the camera track and publish the screen track
        await client.publish([localScreenTracks])

        let videoFrames = document.getElementsByClassName('video__container')// Adjust the size of other video frames
        for(let i = 0; videoFrames.length > i; i++){
            if(videoFrames[i].id != userIdInDisplayFrame){
              videoFrames[i].style.height = '100px'
              videoFrames[i].style.width = '100px'
            }
          }


    }else{// Stop screen sharing and switch back to the camera view
        sharingScreen = false 
        cameraButton.style.display = 'block'
        document.getElementById(`user-container-${uid}`).remove()
        await client.unpublish([localScreenTracks])

        switchToCamera()
    }
}

let leaveStream = async (e) => {// Function to leave the video stream
    e.preventDefault()
    // Display the join button and hide stream actions
    document.getElementById('join-btn').style.display = 'block'
    document.getElementsByClassName('stream__actions')[0].style.display = 'none'

    for(let i = 0; localTracks.length > i; i++){// Stop and close local tracks
        localTracks[i].stop()
        localTracks[i].close()
    }
    // Unpublish local tracks
    await client.unpublish([localTracks[0], localTracks[1]])
    // Unpublish screen track if it exists
    if(localScreenTracks){
        await client.unpublish([localScreenTracks])
    }
    // Remove the local user's video container
    document.getElementById(`user-container-${uid}`).remove()
    // If the local user's video was in the larger display frame, reset the display
    if(userIdInDisplayFrame === `user-container-${uid}`){
        displayFrame.style.display = null

        for(let i = 0; videoFrames.length > i; i++){
            videoFrames[i].style.height = '300px'
            videoFrames[i].style.width = '300px'
        }
    }
    // Send a message indicating that the user has left the channel
    channel.sendMessage({text:JSON.stringify({'type':'user_left', 'uid':uid})})
}


// Event listeners for UI buttons
document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)
document.getElementById('screen-btn').addEventListener('click', toggleScreen)
document.getElementById('join-btn').addEventListener('click', joinStream)
document.getElementById('leave-btn').addEventListener('click', leaveStream)


joinRoomInit()// Call the function to initialize the room