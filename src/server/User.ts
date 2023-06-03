import {
  type Server,
  type Socket,
} from "https://deno.land/x/socket_io@0.2.0/mod.ts";
import type Room from "./Room.ts";

import { customAlphabet } from "npm:nanoid";
import { generateSlug } from "npm:random-word-slugs";
import { Collection } from "npm:@discordjs/collection";

const generateId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);

function generateNick() {
  return generateSlug(2, {
    partsOfSpeech: ["adjective", "noun"],
    format: "kebab",
  });
}

export default class User {
  private readonly rooms: Collection<string, Room>;

  constructor(
    public readonly server: Server,
    public readonly socket: Socket,
    public readonly id: string = generateId(),
    public nick: string = generateNick(),
  ) {
    this.rooms = new Collection<string, Room>();
  }

  public get identity() {
    return `${this.nick} (${this.id})`;
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
