import classNames from "classnames";
import Head from "next/head";
import React, { FormEvent, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Copy } from "../components/copy";
import { DateView } from "../components/date-view";
import { Info, Infos } from "../components/info";
import { Size } from "../components/size";
import { styles } from "../lib/styles";
import { store, stored } from "../lib/util";

interface AccountInfoResponse {
     ok?: boolean
     error?: string
     configs?: string[]
     user?: V2RayConfigInboundClient
}

export default function Index() {
    let [account, setAccount] = useState<AccountInfoResponse>({});
    let [accountId, setAccountId] = useState<string>(stored('accountId'));

    let getAccount = useCallback(async (e?: FormEvent) => {
        e?.preventDefault();
        let toastId = toast.loading(`Get account information ...`);
        try {
            let result = await fetch('/api/account', {
                body: JSON.stringify({
                    id: accountId
                }),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            let account = await result.json();
            if (account.error) throw Error(account.error);
            setAccount(account);
        }
        catch (err) {
            toast.error(err.message);
        }
        finally {
            toast.dismiss(toastId);
        }
    }, [setAccount, accountId]);

    useEffect(() => {
        if (!!accountId)
            getAccount();
    }, []);

    useEffect(() => {
        store('accountId', accountId);
    }, [account]);

    return <div>
        <Head>
            <title>My Account</title>
        </Head>
        <div className="flex flex-col items-center content-center justify-center h-screen w-screen">

            <div className="bg-white px-3 py-3 rounded-lg self-center min-w-[90%] lg:min-w-[50%]">
                <h1 className="font-semibold pb-3 mb-3 border-b-2 border-b-gray-200">Account Information</h1>
                {!account?.user?.email ?
                    // Login
                    <form onSubmit={getAccount}>
                        <div className="items-center flex justify-center">
                            <div className="flex flex-col w-[90%] lg:w-3/4 xl:w-1/2">
                                <label htmlFor="accountId" className={classNames(styles.label, 'px-1')}>Account ID</label>
                                <input value={accountId} onChange={e => setAccountId(e.currentTarget.value)} className={classNames("px-2 py-2 rounded-lg border-2 focus:outline-blue-500")} type="text" id="accountId" placeholder="Account ID"/>
                                <button type="submit" className="px-3 py-2 rounded-lg bg-slate-200 mt-2 duration-150 hover:shadow-md">Login</button>
                            </div>
                        </div>
                    </form>:
                    // Information
                    <div>
                        <Infos>
                            <Info label={"Username"}>
                                {account.user?.email}
                            </Info>
                            <Info label={"Status"} className="py-2">
                                <span className={classNames("px-3 rounded-lg", {'bg-red-300': !!account?.user?.deActiveDate, 'bg-green-200': !account?.user?.deActiveDate})}>{account?.user?.deActiveDate ? 'De-Active' : 'Active'}</span>
                            </Info>
                            <Info label={"First Connect"} className="py-2">
                                <DateView precision={true} full={false} popup={false} className="text-sm" date={account?.user?.firstConnect}/>
                            </Info>
                            <Info label={"Quota Usage"} className="py-2">
                                <Size size={account.user['quotaUsageAfterBilling']}></Size>
                            </Info>
                            <Info label={"Last Connect"} className="py-2">
                                <DateView precision={true} full={false} popup={false} className="text-sm" date={account.user['lastConnect']}/>
                            </Info>
                            <Info label={"Last Connect IP"} className="py-2">
                                {account.user['lastConnectIP']}
                            </Info>
                            <Info label={"Expire Date"} className="py-2">
                                <DateView precision={true} full={false} popup={false} className="text-sm" date={account?.user['expireDate']}/>
                            </Info>
                            <Info label={"De-active Date"} className="py-2">
                                <DateView precision={true} full={false} popup={false} className="text-sm" date={account?.user?.deActiveDate}/>
                            </Info>
                            <Info label={"De-active Reason"} className="py-2">
                                {account?.user?.deActiveReason}
                            </Info>
                        </Infos>
                        <h1 className="font-semibold pt-3 mt-3 border-t-2 border-t-gray-200">Client Config</h1>
                        <Infos>
                            <Info label={'Subscribe Name'} className={'py-2 items-center'}>
                                iNetwork
                            </Info>
                            <Info label={'Subscribe Url'} className={'py-2 items-center'}>
                                <Copy data={`${location.protocol}//${location.host}/api/configs/${account?.user?.id}`}>
                                    Click to Copy
                                </Copy>
                                <a className="mx-2 px-2 border-2" target={'_blank'} href={`${location.protocol}//${location.host}/api/configs/${account?.user?.id}`}>Open</a>
                            </Info>
                        </Infos>
                        <div className="mt-2 pt-2 border-t-2">
                            <button className="bg-slate-200 rounded-lg px-8 py-2 hover:bg-blue-200 duration-150" onClick={() => { setAccountId(''); setAccount({}); }}>Log out</button>
                        </div>
                    </div>
                }
            </div>

            <div className="bg-white px-3 py-3 mt-4 rounded-lg self-center min-w-[90%] lg:min-w-[50%]">
                <h1 className="font-semibold pb-3 mb-3 border-b-2 border-b-gray-200">Download Applications</h1>
                <a href="v2rayNG_1.7.23.apk" className="pointer hover:shadow-md block px-3 py-3 rounded-lg border-[1px] hover:text-blue-700 hover:border-blue-500 duration-150">
                    Download V2RayNG for <b>Android</b>
                </a>
            </div>
            
        </div>
    </div>;
}