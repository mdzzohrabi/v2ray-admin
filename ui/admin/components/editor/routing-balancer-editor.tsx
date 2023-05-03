import { Dialog } from "@common/components/dialog";
import { Collection, Field, FieldsGroup } from "@common/components/fields";
import { Table } from "@common/components/table";
import { deepCopy } from "@common/lib/util";
import classNames from "classnames";
import { useCallback, useState } from "react";
import { styles } from "../../lib/styles";

/**
 * 
 * @param {{ balancer: V2RayConfigRoutingBalancer, dissmis: any, onEdit: Function }} param0 
 * @returns 
 */
export function RoutingBalancerEditor({ balancer: balancerProp, dissmis, onEdit }) {
    let [balancer, setBalancer] = useState(deepCopy(balancerProp));
    let onSubmit = useCallback((/** @type {import("react").FormEvent} */ e) => {
        e?.preventDefault();
        onEdit(balancerProp, balancer);
        dissmis();
    }, [onEdit, balancer, dissmis]);

    return <Dialog onClose={dissmis} onSubmit={onSubmit} title="Routing Balancer">
        <FieldsGroup data={balancer} dataSetter={setBalancer}>
            <div className="flex flex-row">
                <Field htmlFor="tag" label="Tag">
                    <input type="text" id="tag" className={styles.input}/>
                </Field>
            </div>
            <Collection data={balancer.selector ?? []} dataSetter={selector => setBalancer({ ...balancer, selector })}>
                    {selectors => <>
                        <div className="flex flex-row items-center px-2">
                            <label className={classNames(styles.label, "flex-1")}>Selectors</label>
                            <div className="items-center">
                                <button type={"button"} onClick={() => selectors.addItem(null, '')} className={styles.addButtonSmall}>+ Add Selector</button>
                            </div>
                        </div>
                        <Table
                            rows={selectors.items ?? []}
                            columns={[ 'Tag', 'Action' ]}
                            cells={row => [
                                // Address
                                <Field htmlFor="selectorTag"><input type="text" id="selectorTag" className={styles.input} placeholder={""}/></Field>,
                                // Actions
                                <span className={styles.link} onClick={() => selectors.deleteItem(row)} >Delete</span>
                            ]}
                            rowContainer={(row, children) => <FieldsGroup data={row} dataSetter={selector => selectors.updateItem(row, selector)}>{children}</FieldsGroup>}
                        />                         
                    </> }
                    </Collection>
        </FieldsGroup>
        <div className="pt-3 border-t-[1px] mt-3 flex justify-end">
            <button onClick={dissmis} className={styles.button}>Cancel</button>
            <button onClick={onSubmit} className={styles.buttonPrimary}>Edit Balancer</button>
        </div>
    </Dialog>
}
