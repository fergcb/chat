import type Room from "./Room.ts";
import Server from "./Server.ts";
import type User from "./User.ts";
import { roll } from "npm:miniroll@0.2.2";

const prefix = "/";

function sendUsage(user: User, message: string) {
  user.emit("whisper", {
    message: `<bold,red:Usage::> <red,mono:${message}:>`,
  });
}

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
      sendUsage(sender, "/nick <name>");
    } else {
      sender.setNick(args[0]);
    }
  } else if (cmd === "join") {
    if (args.length !== 1) {
      sendUsage(sender, "/join <room>");
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
  } else if (cmd === "roll" || cmd === "r") {
    if (args.length !== 1) {
      sendUsage(sender, "/roll <dice>");
    } else {
      try {
        const rolled = roll(args[0]);
        room.emit("broadcast-message", {
          room: room.toJSON(),
          message:
            `<teal,bold:${sender.nick}:> rolled a <pink,underline:${rolled.result}:>`,
        });
      } catch (_) {
        sender.emit("whisper", {
          message: "Failed to roll dice. " +
            `Check that <red,bold,mono:${args[0]}:> is valid dice notation.`,
        });
      }
    }
  } else {
    return false;
  }

  return true;
}
