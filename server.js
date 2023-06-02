import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { customAlphabet } from 'nanoid'
import { generateSlug } from 'random-word-slugs'

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10)
const generateId = (existing) => {
  let id
  do {
    id = nanoid()
  } while (existing.includes(id))
  return id
}

const app = express()
const server = createServer(app)
const io = new Server(server)

app.use(express.static('./client'))

const users = new Map()

io.on('connection', (socket) => {
  const user = {
    id: generateId(Array.from(users.keys())),
    nick: generateSlug(2, { partsOfSpeech: ['adjective', 'noun'], format: 'kebab' })
  }
  users.set(user.id, user)

  console.log(`User ${user.id} connected.`)
  io.emit('user-join', { user, users: Array.from(users.values()) })

  socket.on('disconnect', () => {
    console.log(`User ${user.id} disconnected.`)
    users.delete(user.id)
    io.emit('user-leave', { user, users: Array.from(users.values()) })
  })

  socket.on('send-message', (message) => {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] ${user.id}: ${message}`)

    if (message.startsWith('/nick')) {
      const newNick = message.substr(5).trim()
      const oldNick = user.nick
      user.nick = newNick
      users.set(user.id, user)
      io.emit('set-nick', { newNick, oldNick, user, users: Array.from(users.values()) })
      return
    }

    io.emit('broadcast-message', { message, user })
  })
})

server.listen(3000, () => {
  console.log('listening on *:3000')
})
