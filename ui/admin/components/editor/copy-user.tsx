import { Dialog } from "@common/components/dialog";
import { Field } from "@common/components/fields";
import { styles } from "@common/lib/styles";
import { serverRequest } from "../../lib/util";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { AppContext } from "../app-context";

/**
 * 
 * @param {{ inbounds: V2RayConfigInbound[], user: string, currentInbound: string, dissmis: any, onEdit: Function, context: AppContext }} param0 
 * @returns 
 */
export function CopyUserEditor({ inbounds, currentInbound, user, onEdit, context, dissmis }) {
    let [inbound, setInbound] = useState(currentInbound);
    let [email, setEmail] = useState(user);

    let ok = useCallback(async (/** @type {import("react").FormEvent} */ e) => {
        try {
            e?.preventDefault();

            let result = await serverRequest(context.server, '/copy_user', {email: user, newEmail: email, fromTag: currentInbound, toTag: inbound});
            if (result?.ok) {
                toast.success(`User copied from "${currentInbound}" to "${inbound}"`);
                onEdit();
                dissmis();
            } else {
                toast.error(result?.error ?? 'Cannot save changes');
            }
        } catch (err) {
            toast.error(err.message ?? 'Cannot save changes');
        }
    }, [onEdit, inbound, email, user, dissmis, context]);

    return <Dialog onClose={dissmis} onSubmit={ok} title="Copy User">
        <Field label="Inbound" className="flex-1" htmlFor="inbound" data={inbound} dataSetter={setInbound}>
            <select id="inbound" className={styles.input}>
                {inbounds?.map(x => <option key={x.tag} value={x.tag}>{x.tag} ({x.protocol})</option>)}
            </select>
        </Field>
        <Field label="Email" className="flex-1" htmlFor="email" data={email} dataSetter={setEmail}>
            <input id="email" className={styles.input} type={'text'}/>
        </Field>
        <div className="pt-3 border-t-[1px] mt-3 flex justify-end">
            <button onClick={ok} className={styles.button}>Copy User</button>
        </div>
    </Dialog>
}
