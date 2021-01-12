
const socket = io()
const $MessageForm = document.querySelector('#message-form')
const $MessageFormInput = document.querySelector('input')
const $MessageFormButton = document.querySelector('button')
const $LocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')


const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const { username,room } = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}


socket.on('message',(message) => {
    const html = Mustache.render(messageTemplate,{
        username: message.username,
        message : message.message,
        createdAt : moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('sendLocationMessage',(url) => {
    const html = Mustache.render(locationTemplate,{
        username : url.username,
        url : url.url,
        createdAt: moment(url.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

$MessageForm.addEventListener('submit',(e) =>{
    e.preventDefault()
    $MessageFormButton.setAttribute('disabled','disabled')
    socket.emit('sendMessage',e.target.elements.message.value,(error) => {
        $MessageFormButton.removeAttribute('disabled')
        $MessageFormInput.focus()
        if(error){
            return console.log(error)
        }
        console.log('Message delivered!')
    })
    e.target.elements.message.value=""
})

$LocationButton.addEventListener('click',(e) => {
    e.preventDefault()

    $LocationButton.setAttribute('disabled','disabled')

    if(!navigator.geolocation){
        return alert('Your browser does not support geolocation')
    }

    navigator.geolocation.getCurrentPosition((position) =>{
        socket.emit('sendLocation',{
            latitude : position.coords.latitude,
            longitude :position.coords.longitude},(message) => {
                console.log(message)
                $LocationButton.removeAttribute('disabled')
            })
    })
})

socket.emit('join', { username,room },(error) =>{
    if(error){
        alert(error)
        location.href='/'
    }
})

socket.on('roomData',({room,users}) => {
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})
