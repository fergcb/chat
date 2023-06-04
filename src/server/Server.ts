import { Server as IOServer } from "https://deno.land/x/socket_io@0.2.0/mod.ts";
import { Collection } from "https://esm.sh/@discordjs/collection@1.5.1";
import Room from "./Room.ts";

export default class Server {
  constructor(
    public readonly io: IOServer,
    public readonly rooms = new Collection<string, Room>(),
  ) {}

  public createRoom(name: string): Room {
    if (this.rooms.some((room) => room.name === name)) {
      throw Error(`Room already exists with name "${name}"`);
    }
    const room = new Room(this, name);
    this.rooms.set(room.name, room);
    return room;
  }
}
