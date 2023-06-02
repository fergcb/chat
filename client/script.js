const socket = io()

const $userList = document.querySelector('#usersList')
const $messageList = document.querySelector('#messages')
const $chatBox = document.querySelector('#chatBox')
const $textInput = document.querySelector('#textInput')

$chatBox.addEventListener('submit', (evt) => {
  evt.preventDefault()
  if ($textInput.value === undefined || $textInput.value === '') return

  socket.emit('send-message', $textInput.value)
  $textInput.value = ''
})

function syncUsers(users) {
  console.log(users)
  $userList.replaceChildren(...users.map(({ nick, id }) => {
    const $user = document.createElement('li')
    $user.classList.add('user')
    $user.textContent = `${nick} (${id})`
    return $user
  }))
}

socket.on('user-join', ({ user, users }) => {
  const $message = document.createElement('div')
  $message.classList.add('message', 'system')
  $message.textContent = `${user.nick} (${user.id}) joined the room.`
  $messageList.appendChild($message)
  $messageList.scrollTo(0, $messageList.scrollHeight)
  syncUsers(users)
})

socket.on('user-leave', ({ user, users }) => {
  const $message = document.createElement('div')
  $message.classList.add('message', 'system')
  $message.textContent = `${user.nick} (${id}) left the room.`
  $messageList.appendChild($message)
  $messageList.scrollTo(0, $messageList.scrollHeight)
  syncUsers(users)
})

socket.on('broadcast-message', ({ message, user }) => {
  const $user = document.createElement('span')
  $user.classList.add('user')
  $user.textContent = user.nick

  const $content = document.createElement('span')
  $content.classList.add('content')
  $content.textContent = message

  const $message = document.createElement('div')
  $message.classList.add('message')
  $message.appendChild($user)
  $message.appendChild($content)

  $messageList.appendChild($message)
  $messageList.scrollTo(0, $messageList.scrollHeight)
})

socket.on('set-nick', ({ oldNick, newNick, user, users }) => {
  const $message = document.createElement('div')
  $message.classList.add('message', 'system')
  $message.textContent = `${oldNick} (${user.id}) changed their nickname to ${newNick}.`
  $messageList.appendChild($message)
  $messageList.scrollTo(0, $messageList.scrollHeight)
  syncUsers(users)
})
