import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";
// @deno-types="https://esm.sh/v124/@discordjs/collection@1.5.1/dist/index.d.ts"
import { Collection } from "https://esm.sh/@discordjs/collection@1.5.1";

const socket = io();

const $roomsList = document.querySelector("#roomsList");
const $usersList = document.querySelector("#usersList");
const $messageList = document.querySelector("#messages");
const $chatBox = document.querySelector("#chatBox");
const $textInput = document.querySelector("#textInput");

function createComponent(tag, { content = "", classes = [], children = [] }) {
  const el = document.createElement(tag);
  el.classList.add(...classes);
  el.textContent = content;
  children.forEach((child) => el.appendChild(child));
  return el;
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
        createComponent("span", { classes: ["content"], content }),
      ],
    }));
  } else {
    $messageList.appendChild(createComponent("div", {
      classes: ['message', 'system'],
      content,
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

socket.on("user-joined", ({ room, user }) => {
  if (user.id === me.id) currentRoom = room.name;
  updateRoom(room);
  addMessage(room, { content: `${user.identity} joined the room.` })
});

socket.on("user-left", ({ room, user }) => {
  if (user.id === me.id && currentRoom === room.name) currentRoom = undefined;
  updateRoom(room);
  addMessage(room, { content: `${user.identity} left the room.` })
});

socket.on("broadcast-message", ({ room, user, message }) => {
  addMessage(room, { author: user, content: message })
});
