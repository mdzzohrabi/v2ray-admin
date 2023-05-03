import { UserPlusIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { FormEvent, useCallback, useContext, useState } from "react";
import toast from "react-hot-toast";
import { useUser } from "../lib/hooks";
import { styles } from "../lib/styles";
import { serverRequest } from "../lib/util";
import { AppContext } from "./app-context";
import { Dialog } from "@common/components/dialog";
import { Field, FieldsGroup } from "@common/components/fields";

export interface AddUserProps {
    onRefresh?: Function,
    setLoading?: Function,
    inbounds?: V2RayConfigInbound[],
    disabled?: boolean,
    className?: string
    horizontal?: boolean
    onClose?: Function
}

interface UserState {
    email?: string;
    fullName?: string;
    mobile?: string;
    emailAddress?: string;
    protocol?: string;
    free?: boolean;
    private?: boolean;
    quotaLimit?: number;
}

export function AddUser({ disabled = false, onRefresh, setLoading, inbounds, className = '', horizontal = true, onClose }: AddUserProps) {

    const context = useContext(AppContext);
    const router = useRouter();
    const {access} = useUser();

    let [user, setUser] = useState<UserState>({});

    const addUser = useCallback(async (e: FormEvent) => {
        e?.preventDefault();
        try {
            setLoading?.call(this, true);
            if (user.quotaLimit)
                user.quotaLimit = user.quotaLimit * 1024 * 1024 * 1024;
            let result = await serverRequest(context.server, '/user', {
                ...user
            });
            if (result.error) {
                toast.error(result.error);
            } else {
                setUser({});
                onRefresh?.call(this);
                toast.success("User added successful");
                onClose?.call(this);
            }
        }
        catch (err) {
            toast.error(err?.message);
        } finally {
            setLoading?.call(this, false);
        }

    }, [user, onRefresh]);

    let lastUserNumber = inbounds?.flatMap(x => x.settings['maxClientNumber']).reduce((a, b) => a > b ? a : b);

    return <Dialog onClose={onClose} title='Add User' onSubmit={addUser}>
        <FieldsGroup horizontal={false} className={className} containerClassName="items-center" data={user} dataSetter={setUser}>
            <div className="flex flex-row">
                <Field label={"Username"} htmlFor="email">
                    <input placeholder="user" pattern={access('isAdmin') ? undefined : '^user[a-z0-9_-]+'} disabled={disabled} className={styles.input} type="text" id="email"/>
                    <span className="text-xs">
                        Last User Number : <b>{lastUserNumber}</b>
                    </span>
                </Field>
                <Field label={"FullName"} className={'flex-1'} htmlFor="fullName">
                    <input placeholder="Full Name" disabled={disabled} className={styles.input} type="text" id="fullName"/>
                </Field>
            </div>
            <div className="flex flex-row">
                <Field label={"Inbound"} htmlFor="tag" className="flex-1">
                    <select disabled={disabled} id="tag" className={styles.input}>
                        <option key={"no-protocol"} value={undefined}>-</option>
                        {inbounds?.filter(x => (x.protocol == 'vmess' || x.protocol == 'vless') && !!x.tag).map(p => <option key={`inbound-${p.tag}-${p.protocol}`} value={p.tag}>{p.tag} ({p.protocol})</option>)}
                    </select>
                </Field>
                <Field label={"Bandwidth"} htmlFor="quotaLimit">
                    <input placeholder="5 GB" inputMode={"numeric"} disabled={disabled} className={styles.input} type="number" id="quotaLimit"/>
                </Field>
            </div>
            <Field label={"Mobile"} htmlFor="mobile">
                <input placeholder="09" inputMode={"tel"} disabled={disabled} className={styles.input} type="text" id="mobile"/>
            </Field>
            <Field label={"Email"} htmlFor="emailAddress">
                <input placeholder="Email" inputMode={"email"} disabled={disabled} className={styles.input} type="text" id="emailAddress"/>
            </Field>
            <div className="flex flex-row gap-x-4">
                {access('users', 'changePrivate') ?
                <Field htmlFor="private" horizontal label="Private">
                    <input type="checkbox" id="private"/>
                </Field>:null}
                {access('users', 'changeFree')?
                <Field htmlFor="free" horizontal label="Free">
                    <input type="checkbox" id="free"/>
                </Field>:null}
            </div>
            <div className="pt-2 flex">
                <button disabled={disabled} type="submit" className={styles.buttonItem}>
                    <UserPlusIcon className="w-4"/>
                    Add User
                </button>
            </div>
        </FieldsGroup>
    </Dialog>;
}