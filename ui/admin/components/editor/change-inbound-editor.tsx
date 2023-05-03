import { Dialog } from "@common/components/dialog";
import { Field } from "@common/components/fields";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { styles } from "../../lib/styles";
import { serverRequest } from "../../lib/util";
import { AppContext } from "../app-context";

/**
 * 
 * @param {{ inbounds: V2RayConfigInbound[], user: string, currentInbound: string, dissmis: any, onEdit: Function, context: AppContext }} param0 
 * @returns 
 */
export function ChangeInboundEditor({ inbounds, currentInbound, user, onEdit, context, dissmis }) {
    let [inbound, setInbound] = useState(currentInbound);

    let ok = useCallback(async (/** @type {import("react").FormEvent} */ e) => {
        e?.preventDefault();

        let result = await serverRequest(context.server, '/change_user_inbound', {email: user, fromTag: currentInbound, toTag: inbound});
        if (result?.ok) {
            toast.success(`User inbound changed from "${currentInbound}" to "${inbound}"`);
            onEdit();
            dissmis();
        } else {
            toast.error(result?.error ?? 'Cannot save changes');
        }
    }, [onEdit, inbound, dissmis, context]);

    return <Dialog onClose={dissmis} onSubmit={ok} title="Change Inbound">
        <Field label="Inbound" className="flex-1" htmlFor="inbound" data={inbound} dataSetter={setInbound}>
            <select id="protocol" className={styles.input}>
                {inbounds?.map(x => <option key={x.tag} value={x.tag}>{x.tag} ({x.protocol})</option>)}
            </select>
        </Field>
        <div className="pt-3 border-t-[1px] mt-3 flex justify-end">
            <button onClick={ok} className={styles.button}>Change Inbound</button>
        </div>
    </Dialog>
}
