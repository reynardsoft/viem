import { signal } from "@preact/signals";
import { CVMUser, StoredUser } from "./types.ts";

let userIdsUsed = new Set<number>();

function getUnusedUserId() {
    let id = Date.now();
    while (userIdsUsed.has(id)) id++;
    userIdsUsed.add(id);
    return id;
}

export class UserStore {
    users = signal<StoredUser[]>([]);
    constructor() {
        console.log("UserStore",this.users);
    }
    get(name: string) {
        return this.users.value.find(u => u.name.value === name);
    }
    addUser(name: string, role: CVMUser["role"]) {
        let existing = this.get(name);
        if (existing) {
            console.warn("User already exists:", existing, "renaming the user instead...");
            existing.name.value = name;
            existing.role.value = role;
            return;
        }
        let id = getUnusedUserId();
        let user = {id, name: signal(name), role: signal(role), country: signal(null)};
        this.users.value = [...this.users.value, user];
        return user;
    }
    getOrAdd(name: string, role: CVMUser["role"] = 'guest') {
        let user = this.get(name);
        if (!user) user = this.addUser(name, role);
        return user!;
    }
    remUser(user: number) {
        let users = [...this.users.value];
        let idx = users.findIndex(u => user == u.id);
        if (idx >= 0) {
            users.splice(idx, 1);
            this.users.value = users;
        }
    }
}