import { Collection } from "npm:@discordjs/collection@1.5.1";
import type User from "./User.ts";
import type Server from "./Server.ts";
import { log } from "./logger.ts";

export default class Room {
  constructor(
    private readonly server: Server,
    public readonly name: string,
    public readonly users = new Collection<string, User>(),
  ) {}

  // deno-lint-ignore no-explicit-any
  public emit(event: string, ...args: any[]) {
    this.server.io.to(this.name).emit(event, ...args);
  }

  public addUser(user: User) {
    this.users.set(user.id, user);
    user.join(this);
    this.emit("user-joined", { room: this.toJSON(), user: user.toJSON() });
    log(`<cyan:${user.identity}:> joined room <yellow:${this.name}:>`);
  }

  public removeUser(user: User) {
    this.users.delete(user.id);
    user.leave(this);
    this.emit("user-left", { room: this.toJSON(), user: user.toJSON() });
    log(`<cyan:${user.identity}:> left room <yellow:${this.name}:>`);
  }

  public toJSON() {
    return {
      name: this.name,
      users: this.users.map((user) => ({
        id: user.id,
        nick: user.nick,
        identity: user.identity,
      })),
      userCount: this.users.size,
    };
  }
}
