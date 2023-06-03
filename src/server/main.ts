import { serve } from "https://deno.land/std@0.150.0/http/server.ts";
import { Server } from "https://deno.land/x/socket_io@0.2.0/mod.ts";
import {
  Application,
  Context,
  send,
} from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { Collection } from "npm:@discordjs/collection";
import User from "./User.ts";
import Room from "./Room.ts";
import { log } from "./logger.ts";
import { handleCommand } from "./commands.ts";

const app = new Application();
const server = new Server();

app.use(async (ctx: Context) => {
  return await send(ctx, ctx.request.url.pathname, {
    root: "src/client",
    index: "index.html",
  });
});

const rooms = new Collection<string, Room>();

const world = new Room(server, "world");
rooms.set("world", world);

server.on("connection", (socket) => {
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
    if (!rooms.has(roomName)) {
      log("<yellow:${roomName}:> doesn't exist.");
      return;
    }

    const room = rooms.get(roomName)!;

    handleCommand(room, user, message) || room.emit("broadcast-message", {
      user: user.toJSON(),
      message,
      room: room.toJSON(),
    });
  });
});

const handler = server.handler(async (req) => {
  return await app.handle(req) || new Response(null, { status: 500 });
});

await serve(handler, {
  port: 3000,
  onListen({ hostname, port }) {
    log(`Listening on <green:http://${hostname}:${port}:>`);
  },
});
