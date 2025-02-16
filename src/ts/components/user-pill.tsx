import { h } from "preact";
import { userIcons } from "ts/consts.ts";
import { StoredUser } from "ts/logic/cvm/types.ts";
import { GetFlagUrl } from "ts/logic/vexillology.ts";
import "./user-pill.scss";



export const UserPill = (props: {user: StoredUser}) => 
    <div class='user-pill' data-role={props.user.role}>
        <i class="material-symbols">{userIcons[props.user.role.value]}</i>
        <span>{props.user.name}</span>
        {props.user.country?.value && <img class="flag" width={18} src={GetFlagUrl(props.user.country.value)} />}
    </div>