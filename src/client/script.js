import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";
// @deno-types="https://esm.sh/v124/@discordjs/collection@1.5.1/dist/index.d.ts"
import { Collection } from "https://esm.sh/@discordjs/collection@1.5.1";

const socket = io();

const $roomsList = document.querySelector("#roomsList");
const $usersList = document.querySelector("#usersList");
const $messageList = document.querySelector("#messages");
const $chatBox = document.querySelector("#chatBox");
const $textInput = document.querySelector("#textInput");

function createComponent(tag, { content = "", classes = [], children = [], html = '' }) {
  const el = document.createElement(tag);
  el.classList.add(...classes);
  if (content !== "") {
    el.textContent = content;
  } else if (children.length > 0) {
    children.forEach((child) => el.append(child));
  } else if (html !== "") {
    el.innerHTML = html
  }

  return el;
}

const colors = {
  'red': '#fa5252',
  'orange': '#ff922b',
  'yellow': '#fcc419',
  'green': '#94d82d',
  'teal': '#20c997',
  'cyan': '#22b8cf',
  'blue': '#228be6',
  'purple': '#be4bdb',
  'pink': '#e64980',
  'white': '#f8f9fa',
  'gray': '#868e96',
  'grey': '#868e96',
  'black': '#212529',
}

const miscStyles = {
  'bold': 'font-weight: 700',
  'italic': 'font-style: italic',
  'underline': 'text-decoration: underline',
}

function parseContent(content) {
  return content.replaceAll(/<([a-z]+(?:,[a-z]+)*):(.*?):>/g, (_, styles, text) => {
    styles = styles.split(',')
    const styleAttr = styles.flatMap(style => {
      if (style in colors) return [`color: ${colors[style]}`]
      else if (style in miscStyles) return [miscStyles[style]]
      else return []
    }).join('; ')
    console.log(styleAttr)
    return `<span style="${styleAttr}">${text}</span>`
  })
}

let me;
let currentRoom;
const rooms = new Collection();
const users = new Collection();

function updateUsers(newUsers) {
  users.clear();
  newUsers.forEach((user) => {
    users.set(user.id, user);
  });
  showUsers();
}

function showUsers() {
  $usersList.replaceChildren(
    ...Array.from(users.values()).map((user) =>
      createComponent("li", {
        classes: user.id === me.id ? ["me"] : [],
        children: [
          createComponent("span", { content: user.nick, classes: ["nick"] }),
          createComponent("span", { content: "(me)", classes: ["note"] }),
          createComponent("span", { content: `(${user.id})`, classes: ["id"] }),
        ],
      })
    ),
  );
}

function sweepRooms(newRooms) {
  rooms.sweep((room) =>
    !newRooms.some((existingRoom) => existingRoom.name === room.name)
  );
  showRooms();
}

function updateRoom(room, repaint = true) {
  room.messages = rooms.get(room.name)?.messages ?? [];
  rooms.set(room.name, room);
  if (room.name === currentRoom) updateUsers(room.users);
  if (repaint) showRooms();
}

function showRooms() {
  $roomsList.replaceChildren(
    ...Array.from(rooms.values()).map((room) =>
      createComponent("li", {
        classes: room.name === currentRoom ? ["current"] : [],
        children: [
          createComponent("span", { content: room.name, classes: ["name"] }),
          createComponent("span", {
            content: room.userCount,
            classes: ["userCount"],
          }),
        ],
      })
    ),
  );
}

function addMessage(room, message) {
  if (!rooms.has(room.name)) {
    console.log(`User is not connected to the room "${room.name}"`);
    return;
  }

  rooms.get(room.name).messages.push(message);

  if (room.name === currentRoom) showMessage(message);
}

function showMessage({ author, content }) {
  if (author !== undefined) {
    $messageList.appendChild(createComponent("div", {
      classes: ['message'],
      children: [
        createComponent("span", { classes: ["author"], content: author.nick }),
        createComponent("span", { classes: ["content"], html: parseContent(content) }),
      ],
    }));
  } else {
    $messageList.appendChild(createComponent("div", {
      classes: ['message', 'system'],
      html: parseContent(content),
    }));
  }
}

$chatBox.addEventListener("submit", (evt) => {
  evt.preventDefault();
  if ($textInput.value === undefined || $textInput.value === "") return;

  socket.emit("send-message", { message: $textInput.value, room: currentRoom });
  $textInput.value = "";
});

socket.on("sync-user", (user) => {
  me = user;
  sweepRooms(user.rooms);
});

socket.on("update-user", ({ user }) => {
  if (!users.has(user.id)) {
    console.log(`Unknown user ${user.identity}.`)
    return
  }

  users.set(user.id, user)

  showUsers()
})

socket.on("user-joined", ({ room, user }) => {
  if (user.id === me.id) currentRoom = room.name;
  updateRoom(room);
  addMessage(room, { content: `<teal,bold:${user.nick}:> <gray:(${user.id}):> joined the room.` })
});

socket.on("user-left", ({ room, user }) => {
  if (user.id === me.id && currentRoom === room.name) currentRoom = undefined;
  updateRoom(room);
  addMessage(room, { content: `<teal,bold:${user.nick}:> <gray:(${user.id}):> left the room.` })
});

socket.on("broadcast-message", ({ room, user, message }) => {
  addMessage(room, { author: user, content: message })
});

socket.on("whisper", ({ message }) => {
  addMessage(rooms.get(currentRoom), { content: message })
})
