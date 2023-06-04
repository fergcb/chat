import type Room from "./Room.ts";
import Server from "./Server.ts";
import type User from "./User.ts";

const prefix = "/";

export function handleCommand(
  server: Server,
  room: Room,
  sender: User,
  message: string,
): boolean {
  if (!message.startsWith(prefix)) return false;

  const args = message.substring(prefix.length).split(/\s+/g);
  const cmd = args.shift();

  if (cmd === undefined || cmd === "") return false;

  if (cmd === "nick") {
    if (args.length !== 1) {
      sender.emit("whisper", { message: "Usage: /nick <nickname>" });
    } else {
      sender.setNick(args[0]);
    }
  } else if (cmd === "join") {
    if (args.length !== 1) {
      sender.emit("whisper", { message: "Usage: /join <room>" });
    } else {
      const name = args[0];
      try {
        const room = server.rooms.get(name) ?? server.createRoom(name);
        if (room!.users.some((user) => user.id === sender.id)) {
          sender.emit("whisper", {
            message: `You are already in <yellow,bold:${name}:>`,
          });
        } else {
          room!.addUser(sender);
        }
      } catch {
        sender.emit("whisper", {
          message: `Failed to create or join room <yellow,bold:${name}:>.`,
        });
      }
    }
  }

  return true;
}
