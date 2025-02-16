import { CVMUserRole } from "./logic/cvm/types.ts";

export const userIcons = {
    guest: "supervised_user_circle",
    user: "account_circle",
    moderator: "shield_person",
    admin: "person_4"
} satisfies Record<CVMUserRole, string>;