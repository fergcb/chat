import { type Socket } from "https://deno.land/x/socket_io@0.2.0/mod.ts";
import type Server from "./Server.ts";
import type Room from "./Room.ts";

import { customAlphabet } from "npm:nanoid@4.0.2";
import { generateSlug } from "npm:random-word-slugs@0.1.7";
import { Collection } from "npm:@discordjs/collection@1.5.1";

const generateId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);

function generateNick() {
  return generateSlug(2, {
    partsOfSpeech: ["adjective", "noun"],
    format: "kebab",
  });
}

export default class User {
  public readonly rooms: Collection<string, Room>;

  constructor(
    private readonly server: Server,
    private readonly socket: Socket,
    public readonly id: string = generateId(),
    public nick: string = generateNick(),
  ) {
    this.rooms = new Collection<string, Room>();
  }

  public get identity() {
    return `${this.nick} (${this.id})`;
  }

  // deno-lint-ignore no-explicit-any
  public emit(event: string, ...args: any[]) {
    this.socket.emit(event, ...args);
  }

  public join(room: Room) {
    this.rooms.set(room.name, room);
    this.socket.join(room.name);
    this.sync();
  }

  public leave(room: Room) {
    this.rooms.delete(room.name);
    this.socket.leave(room.name);
    this.sync();
  }

  public sync() {
    this.socket.emit("sync-user", this.toJSON());
  }

  public disconnect() {
    this.rooms.forEach((room) => room.removeUser(this));
  }

  public setNick(newNick: string) {
    const oldNick = this.nick;
    this.nick = newNick;
    this.rooms.forEach((room) => {
      room.emit("broadcast-message", {
        room: room.toJSON(),
        message:
          `<teal,bold:${oldNick}:> <gray:(${this.id}):> set their nickname to <teal,bold:${newNick}:>`,
      });
      room.users.forEach((user) =>
        user.emit("update-user", { user: this.toJSON() })
      );
    });
  }

  public toJSON() {
    return {
      id: this.id,
      nick: this.nick,
      identity: this.identity,
      rooms: this.rooms.map((room) => ({
        name: room.name,
        userCount: room.users.size,
      })),
    };
  }
}
