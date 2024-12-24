import { Copy } from "@common/components/copy";
import { DateView } from "@common/components/date-view";
import { Dialog, useDialog } from "@common/components/dialog";
import { Info, Infos, setInfoLocaleFn } from "@common/components/info";
import { Progress } from "@common/components/progress";
import { QRCode } from "@common/components/qrcode";
import { Size } from "@common/components/size";
import { styles } from "@common/lib/styles";
import { ArrowDownTrayIcon, ArrowLeftOnRectangleIcon, ClipboardDocumentIcon, ClipboardIcon, ExclamationTriangleIcon, LinkIcon, QrCodeIcon, QuestionMarkCircleIcon, Squares2X2Icon, UserIcon } from "@heroicons/react/24/outline";
import classNames from "classnames";
import Head from "next/head";
import { useRouter } from "next/router";
import { FormEvent, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { __ } from "../locale";
import type { V2RayConfigInboundClient } from "../../../types";

interface AccountInfoResponse {
     ok?: boolean
     error?: string
     configs?: any[]
     user?: V2RayConfigInboundClient
}

const className = {
    itemDownload: 'pointer hover:shadow-md px-3 py-3 rounded-lg border-[1px] hover:text-blue-700 hover:border-blue-500 duration-150 flex gap-x-2',
    card: "bg-white px-6 py-3 rounded-md self-center min-w-[90%] lg:min-w-[50%] w-full sm:w-auto sm:px-3 shadow-md",
    cardTitle: "flex gap-x-2 font-semibold pb-3 mb-3 border-b-[1px] border-b-gray-200"
}

setInfoLocaleFn(__);

export default function Index({ accountId: pAccountId }: { accountId?: string }) {
    const router = useRouter();
    const qAccountId = pAccountId ?? (router.query.id ? String(router.query.id) : '');
    let [account, setAccount] = useState<AccountInfoResponse>({});
    let [accountId, setAccountId] = useState<string>();

    let getAccount = useCallback(async (accountId?: string) => {
        let toastId = toast.loading(__(`Get account information ...`));
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
            router.push('/');
        }
        finally {
            toast.dismiss(toastId);
        }
    }, [setAccount]);

    const login = useCallback((e?: FormEvent) => {
        e?.preventDefault();
        router.push('/account/' + encodeURIComponent(accountId) + '?t=' + Math.round(Math.random() * 1000));
    }, [accountId]);

    const qrCodeDialog = useDialog((title: string, data: any, onClose?: Function) => {
        return <Dialog title={title} onClose={onClose} className='items-center justify-center flex'>
            <QRCode data={data}/>
        </Dialog>
    })

    useEffect(() => {
        if (!!qAccountId) {
            getAccount(qAccountId);
        }
        else {
            setAccountId('');
            setAccount({});
        }
    }, [qAccountId, getAccount, router.query.t]);

    const downloadCard = <div className={className.card}>
        <h1 className={className.cardTitle}>
            <Squares2X2Icon className="w-5"/>
            {__('Download Applications')}
        </h1>
        <div className="flex">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2">
                <a href="https://github.com/2dust/v2rayNG/releases/download/1.9.24/v2rayNG_1.9.24_arm64-v8a.apk" className={className.itemDownload}>
                    <ArrowDownTrayIcon className="w-5"/>
                    <span dangerouslySetInnerHTML={{ __html: __('Download V2RayNG for <b>Android</b>')}}/>
                </a>
                <a href="https://play.google.com/store/apps/details?id=com.github.kr328.clash&hl=en_US" className={className.itemDownload}>
                    <ArrowDownTrayIcon className="w-5"/>
                    <span dangerouslySetInnerHTML={{ __html: __('Download Clash for <b>Android</b>')}}/>
                </a>
                <a href="https://apps.apple.com/us/app/napsternetv/id1629465476" className={className.itemDownload}>
                    <ArrowDownTrayIcon className="w-5"/>
                    <span dangerouslySetInnerHTML={{ __html: __('Download NapsternetV for <b>iOS</b>')}}/>
                </a>
                <a href="https://apps.apple.com/us/app/fair-vpn/id1533873488" className={className.itemDownload}>
                    <ArrowDownTrayIcon className="w-5"/>
                    <span dangerouslySetInnerHTML={{ __html: __('Download FairVPN for <b>iOS</b>')}}/>
                </a>
            </div>
        </div>
    </div>;

    const isLogin = !!account?.user?.email;

    const userInfo = isLogin ? <div>
        <Infos className="grid lg:grid-cols-2 gap-x-4">
            <Info label={"Username"} className='py-2'>
                {account.user?.email}
            </Info>
            <Info label={"Status"} className="py-2">
                <span className={classNames("px-3 rounded-lg", {'bg-red-300': !!account?.user?.deActiveDate, 'bg-green-200': !account?.user?.deActiveDate})}>{__(account?.user?.deActiveDate ? 'De-Active' : 'Active')}</span>
            </Info>
            <Info label={"Expire Date"} className="py-2 font-bold">
                <DateView precision={true} full={false} popup={false} className="text-xs" date={account?.user['expireDate']}/>
            </Info>
            <Info label={"Account ID"} className="py-2">
                <Copy className="text-xs self-center" data={account?.user?.id}>{account?.user?.id}</Copy>
            </Info>
            <Info label={"First Connect"} className="py-2">
                <DateView precision={true} full={false} popup={false} className="text-xs" date={account?.user?.firstConnect}/>
            </Info>
            <Info label={"Last Connect"} className="py-2">
                <DateView precision={true} full={false} popup={false} className="text-xs" date={account.user['lastConnect']}/>
            </Info>
            <Info label={"Last Connect IP"} className="py-2">
                {account.user['lastConnectIP']}
            </Info>
            <Info label={"De-active Date"} className="py-2">
                <DateView precision={true} full={false} popup={false} className="text-xs" date={account?.user?.deActiveDate}/>
            </Info>
            <Info label={"De-active Reason"} className="py-2">
                {account?.user?.deActiveReason}
            </Info>
            <Info label={"Quota Usage"} className="py-2 font-bold">
                {account?.user?.quotaLimit > 0 ?
                <Progress title={<div style={{ direction: 'ltr' }}>
                    <Size size={account.user['quotaUsageAfterBilling']}/>/
                    <Size size={account?.user?.quotaLimit}/>
                </div>
            } className="flex-1" total={account?.user?.quotaLimit > 0 ? account?.user?.quotaLimit : account?.user['quotaUsageAfterBilling']} bars={[
                    {
                        title: __('Traffic Usage'),
                        value: account?.user['quotaUsageAfterBilling']
                    }
                ]} renderValue={x => <Size size={x}/>}/> :
                <>
                    <Size size={account.user['quotaUsageAfterBilling']}></Size>
                    /
                    {account?.user?.quotaLimit ? <Size size={account.user?.quotaLimit}></Size> : '∞'}
                </>}
            </Info>
        </Infos>
        <h1 className="font-semibold pt-3 mt-3 border-t-2 border-t-gray-200">{__('Subscription URL')}</h1>
        <div className="flex flex-col md:flex-row">
            <Infos className="flex-1">
                <Info label={'Url'} className={'py-2 items-center'}>
                    <div className="flex text-xs md:text-sm">
                        <Copy data={`${location.protocol}//${location.host}/api/configs/${account?.user?.id}`}>{(copy, isCopied, isLoading) =>
                            <button className={classNames(styles.buttonItem)} onClick={() => copy()}>
                                <ClipboardDocumentIcon className="w-4"/>
                                {__(isLoading ? 'Wait ...' : isCopied ? 'Copied !' : 'Copy')}
                            </button>
                        }</Copy>
                        <a className={styles.buttonItem} target={'_blank'} href={`${location.protocol}//${location.host}/api/configs/${account?.user?.id}`}>
                            <LinkIcon className="w-4"/>
                            {__('Open')}
                        </a>
                        <button className={styles.buttonItem} onClick={() => qrCodeDialog.show('Subscription Url', `${location.protocol}//${location.host}/api/configs/${account?.user?.id}`)}>
                            <QrCodeIcon className="w-4"/>
                            {__('QR Code')}
                        </button>
                    </div>
                </Info>
            </Infos>
        </div>
        <h1 className="font-semibold pt-3 mt-3 border-t-2 border-t-gray-200 items-center">
            <span className="whitespace-nowrap mb-3 gap-x-2 text-xs flex items-center bg-yellow-100 px-4 py-2 rounded-xl text-yellow-900">
                <ExclamationTriangleIcon className="w-5"/>
                {__('Please use subscription instead of copy configs directly')}
            </span>
            <div className="flex">
                <span className="flex-1">{__('Configs')}</span>
                <div>
                    <Copy data={account?.configs?.map(x => x.strConfig)?.join('\n')}>{(copy, isCopied) => <button onClick={() => copy()} className={classNames(styles.buttonItem, 'text-xs md:text-md')}>
                        <ClipboardIcon className="w-4"/>
                        {__(isCopied ? 'Copied !' : 'Copy All')}
                    </button>}</Copy>
                </div>
            </div>
        </h1>
        <div className="flex flex-col md:flex-row">
            <Infos className="flex-1">
                {account?.configs?.map(x => 
                <Info label={<div className="flex flex-col">
                    <div className="flex gap-x-2">
                        <span className="text-gray-700">{x.ps}</span>
                        <div className="flex gap-x-1">
                            <span className="rounded-lg bg-gray-200 text-black px-2 text-xs text-center items-center flex uppercase">{x.strConfig?.split(':')[0]}</span>
                            {x.tls == 'tls' ? <span className="rounded-lg bg-green-200 text-black px-2 text-xs text-center items-center flex">TLS</span> : null }
                        </div>
                    </div>
                    <span className="italic text-gray-400">{x.description ?? '-'}</span>
                </div>} className={'py-2 items-center'}>
                    <div className="flex text-xs md:text-sm">
                        <Copy data={x.strConfig}>{(copy, isCopied, isLoading) =>
                            <button className={styles.buttonItem} onClick={() => copy()}>
                                <ClipboardDocumentIcon className="w-4"/>
                                <span className="hidden sm:block">{__(isLoading ? 'Wait ...' : isCopied ? 'Copied !' : 'Copy')}</span>
                            </button>
                        }</Copy>
                        <button className={styles.buttonItem} onClick={() => qrCodeDialog.show('Config - ' + x.ps, x.strConfig)}>
                            <QrCodeIcon className="w-4"/>
                            <span className="hidden sm:block">{__('QR Code')}</span>
                        </button>
                    </div>
                </Info>)}
            </Infos>
        </div>
        
    </div> : null;

    const loginForm = <form onSubmit={login}>
        <div className="items-center flex justify-center">
            <div className="flex flex-col flex-1">
                <label htmlFor="accountId" className={classNames(styles.label, 'px-1')}>{__('Account ID')}</label>
                <input value={accountId} onChange={e => setAccountId(e.currentTarget.value)} className={classNames("px-2 text-center py-2 rounded-lg border-2 focus:outline-blue-500")} type="text" id="accountId" placeholder={__("Account ID")}/>
                <button type="submit" className="px-3 py-2 rounded-lg bg-slate-200 mt-2 duration-150 hover:shadow-md">{__('Login')}</button>
            </div>
        </div>
    </form>;


    return <div className="text-sm" style={{ direction: __('direction') }}>
        <Head>
            <title>{__('My Account')}</title>
        </Head>
        {!isLogin?
        <div className="flex flex-col items-center content-center justify-center h-screen w-screen gap-y-5">
            <div className={className.card}>
                <h1 className={className.cardTitle}>
                    <UserIcon className="w-5"/>
                    {__('Account Information')}
                </h1>
                {qAccountId ? __('Please Wait...') : loginForm}
            </div>            
            {downloadCard}
        </div>:
            <div className="grid grid-cols-1 py-4 px-0 gap-5 sm:px-[5%] md:px-[10%] 2xl:px-[25%]">
                <div className={className.card}>
                    <h1 className={className.cardTitle}>
                        <div className="flex flex-1 items-center gap-x-2">
                            <UserIcon className="w-5"/>
                            {__('Account Information')}
                        </div>
                        <div className="flex text-xs">
                            <button className={styles.buttonItem} onClick={() => router.push('/')}>
                                <ArrowLeftOnRectangleIcon className="w-4"/>
                                {__('Log out')}
                            </button>
                        </div>
                    </h1>
                    <div className="mb-4 pb-2 border-b-[1px] flex flex-row text-sm">
                        <Copy data={`${location.protocol}//${location.host}/api/configs/${account?.user?.id}`}>{(copy, isCopied, isLoading) =>
                            <button className={classNames(styles.buttonItem)} onClick={() => copy()}>
                                <ClipboardDocumentIcon className="w-4"/>
                                {__(isLoading ? 'Wait ...' : isCopied ? 'Copied !' : 'Copy Subscription Url')}
                            </button>
                        }</Copy>
                        <button className={styles.buttonItem} onClick={() => router.push('/how-to-use')}>
                            <QuestionMarkCircleIcon className="w-4"/>
                            {__('How to use')}
                        </button>
                    </div>
                    {userInfo}
                </div>
                {downloadCard}
            </div>
        }
    </div>;
}