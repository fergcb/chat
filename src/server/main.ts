import { serve } from "https://deno.land/std@0.150.0/http/server.ts";
import { Server as IOServer } from "https://deno.land/x/socket_io@0.2.0/mod.ts";
import {
  Application,
  Context,
  send,
} from "https://deno.land/x/oak@v12.5.0/mod.ts";
import Server from "./Server.ts";
import User from "./User.ts";
import Room from "./Room.ts";
import { log } from "./logger.ts";
import { handleCommand } from "./commands.ts";

const app = new Application();
const io = new IOServer();
const server = new Server(io);

app.use(async (ctx: Context) => {
  return await send(ctx, ctx.request.url.pathname, {
    root: "src/client",
    index: "index.html",
  });
});

const world = new Room(server, "world");
server.rooms.set("world", world);

io.on("connection", (socket) => {
  const user = new User(server, socket);
  log(`<cyan:${user.identity}:> connected.`);

  world.addUser(user);
  user.sync();

  socket.on("disconnect", () => {
    user.disconnect();
    log(`<cyan:${user.identity}:> disconnected.`);
  });

  socket.on("send-message", ({ message, room: roomName }) => {
    log(`<cyan:${user.identity}:> in <yellow:${roomName}:>: ${message}`);
    if (!server.rooms.has(roomName)) {
      log("<yellow:${roomName}:> doesn't exist.");
      return;
    }

    const room = server.rooms.get(roomName)!;

    handleCommand(server, room, user, message) ||
      room.emit("broadcast-message", {
        user: user.toJSON(),
        message,
        room: room.toJSON(),
      });
  });
});

const handler = io.handler(async (req) => {
  return await app.handle(req) || new Response(null, { status: 500 });
});

await serve(handler, {
  port: 3000,
  onListen({ hostname, port }) {
    log(`Listening on <green:http://${hostname}:${port}:>`);
  },
});
