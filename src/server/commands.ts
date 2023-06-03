import type Room from "./Room.ts";
import type User from "./User.ts";

const prefix = "/";

export function handleCommand(
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
      console.log("incorrect number of args");
      sender.emit("whisper", { message: "Usage: /nick <nickname>" });
    } else {
      sender.setNick(args[0]);
    }
  }

  return true;
}
