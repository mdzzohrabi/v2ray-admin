import { Copy } from "@common/components/copy";
import { DateView } from "@common/components/date-view";
import { useDialog } from "@common/components/dialog";
import { Editable } from "@common/components/editable";
import { Field, FieldsGroup } from "@common/components/fields";
import { Info, Infos } from "@common/components/info";
import { Loading } from "@common/components/loading";
import { MultiSelect } from "@common/components/multi-select";
import { Popup } from "@common/components/popup";
import { PopupMenu } from "@common/components/popup-menu";
import { Select } from "@common/components/select";
import { Size } from "@common/components/size";
import { Table } from "@common/components/table";
import { usePrompt, useStoredState } from "@common/lib/hooks";
import { DateUtil } from "@common/lib/util";
import { ArrowPathIcon, ArrowSmallLeftIcon, ArrowSmallRightIcon, ArrowsUpDownIcon, ArrowUpTrayIcon, BoltIcon, BoltSlashIcon, CalendarDaysIcon, ClockIcon, CurrencyDollarIcon, DevicePhoneMobileIcon, DocumentDuplicateIcon, DocumentPlusIcon, DocumentTextIcon, EyeIcon, EyeSlashIcon, FireIcon, FolderMinusIcon, FolderPlusIcon, PlusIcon, QrCodeIcon, RssIcon, TrashIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import classNames from "classnames";
import ExportJsonExcel from 'js-export-excel';
import Head from "next/head";
import { useRouter } from "next/router";
import { Fragment, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from "react-hot-toast";
import { V2RayConfigInbound, SystemUser, V2RayConfigInboundClient } from "../../../types";
import { AddUser } from "../components/add-user";
import { AppContext } from "../components/app-context";
import { ClientConfig } from "../components/client-config";
import { Container } from "../components/container";
import { ClientCancelDialog } from "../components/dialog/client-cancel-dialog";
import { UserNodesDialog } from "../components/dialog/user-nodes";
import { ChangeInboundEditor } from "../components/editor/change-inbound-editor";
import { CopyUserEditor } from "../components/editor/copy-user";
import { FieldServerNodes } from "../components/field-server-nodes";
import { ServerNode } from "../components/server-node";
import { useContextSWR, useUser } from "../lib/hooks";
import { styles } from "../lib/styles";
import { serverRequest } from "../lib/util";

export default function UsersPage() {

    let context = useContext(AppContext);
    let router = useRouter();
    let initStatusFilter: string[] = [];
    let initInboundsFilter: string[] = [];

    let {access} = useUser();

    let [view, setView] = useStoredState('users-view', {
        sortColumn: '',
        sortAsc: true,
        fullTime: false,
        precision: true,
        showId: false,
        filter: '',
        statusFilter: initStatusFilter,
        page: 1,
        limit: 20,
        inbounds: initInboundsFilter
    });

    let [collapsed, setCollapsed] = useState({});

    let {data: inboundsResponse, mutate: refreshInbounds, isValidating: isLoading} = useContextSWR<V2RayConfigInbound[]>('/inbounds',
    {
        view
    });

    let inbounds = useMemo(() => inboundsResponse?.filter(x => x.protocol == 'vmess' || x.protocol == 'vless').map(x => {
        return x;
    }) ?? [], [inboundsResponse]);

    const showQRCode = useCallback(async (tag, user) => {
        let config = await serverRequest(context.server, '/client_config?tag=' + tag, user).then(data => data.config)
        let link = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=` + encodeURIComponent(config);
        window.open(link);
    }, [router]);

    const setActive = useCallback(async (tag, user, active) => {
        let result = await serverRequest(context.server, '/active', {email: user.email, tag, active});
        if (result?.ok) {
            toast.success('Changes made successful');
            refreshInbounds();
        } else {
            toast.error(result?.error ?? 'Cannot save changes');
        }
    }, [router]);

    const removeUser = useCallback(async (protocol, tag, user) => {
        let result = await serverRequest(context.server, '/remove_user', {email: user.email, tag, protocol});
        if (result?.ok) {
            toast.success('User removed');
            refreshInbounds();
        } else {
            toast.error(result?.error ?? 'Cannot remove user');
        }
    }, [router]);

    const setMaxConnection = useCallback(async (tag, user, value) => {
        let result = await serverRequest(context.server, '/max_connections', {email: user.email, tag, value});
        if (result?.ok) {
            toast.success('Max connection changed');
            refreshInbounds();
        } else {
            toast.error(result?.error ?? 'Cannot change user settings');
        }
    }, [router]);

    const setExpireDays = useCallback(async (tag, user, value) => {
        let result = await serverRequest(context.server, '/expire_days', {email: user.email, tag, value});
        if (result?.ok) {
            toast.success('Expire days changed');
            refreshInbounds();
        } else {
            toast.error(result?.error ?? 'Cannot change user settings');
        }
    }, [router]);

    const addDays = useCallback(async (tag, user, days) => {
        let result = await serverRequest(context.server, '/add_days', {email: user.email, days, tag});
        if (result?.ok) {
            toast.success(`${days} days added to user ${user.email}`);
            refreshInbounds();
        } else {
            toast.error(result?.error ?? 'Cannot change user expire days');
        }
    }, [router]);

    const setUsername = useCallback(async (tag, user, value) => {
        let result = await serverRequest(context.server, '/change_username', {email: user.email, tag, value});
        if (result?.ok) {
            toast.success('Username changed');
            refreshInbounds();
        } else {
            toast.error(result?.error ?? 'Cannot change user settings');
        }
    }, [router]);

    const setInfo = useCallback(async (tag, user, prop, value) => {
        let result = await serverRequest(context.server, '/set_info', {email: user.email, tag, value, prop});
        if (result?.ok) {
            toast.success(prop + ' changed for user "'+user.email+'"');
            refreshInbounds();
        } else {
            toast.error(result?.error ?? 'Cannot change user '+ prop);
        }
    }, [router]);


    const reGenerateId = useCallback(async (tag, user) => {
        let result = await serverRequest(context.server, '/regenerate_id', {email: user.email, tag});
        if (result?.ok) {
            toast.success('ID generated');
            refreshInbounds();
        } else {
            toast.error(result?.error ?? 'Cannot generate new id');
        }
    }, [router]);

    let headClass = styles.tableHead;

    // This line is only for fix tailwind bug that cannot resolve classNames from useCallback elements
    let el = <div className={"ring-1 ring-black ring-opacity-20 whitespace-nowrap text-sm shadow-lg bg-white flex rounded-lg pointer-events-auto px-3 py-2"}>
    <span className="flex-1 self-center mr-3"></span>

    <button className="rounded-lg duration-150 hover:shadow-md bg-slate-100 px-2 py-1 ml-1">Cancel</button>
    <button className="rounded-lg duration-150 hover:shadow-md bg-blue-400 px-2 py-1 ml-1 hover:bg-blue-600">OK</button>
    </div>

    const {data: statusFilters} = useContextSWR<string[]>('/status_filters');

    const prompt = usePrompt();

    const changeInboundDialog = useDialog((context, inbounds, currentInbound, user, onEdit, onClose = null) => <ChangeInboundEditor context={context} inbounds={inbounds} currentInbound={currentInbound} user={user} onEdit={onEdit} dissmis={onClose}/>);

    const copyUserDialog = useDialog((context, inbounds, currentInbound, user, onEdit, onClose = null) => <CopyUserEditor context={context} inbounds={inbounds} currentInbound={currentInbound} user={user} onEdit={onEdit} dissmis={onClose}/>);

    const clientConfigDialog = useDialog((user, tag, onClose = null) => <ClientConfig
        onClose={onClose}
        user={user}
        tag={tag}
    />)

    const clientCancelDialog = useDialog((user: V2RayConfigInboundClient, onClose?: Function) => <ClientCancelDialog user={user} onClose={onClose}/>)

    const exportExcel = useCallback(() => {
        console.log('Export Excel');
        let excel = new ExportJsonExcel({
            fileName: 'V2Ray-Clients',
            datas: [
                {
                    sheetData: inbounds?.flatMap(x => x.settings?.clients?.map(u => {
                        let {billingStartDate, createDate, email, emailAddress, mobile, maxConnections, firstConnect, free, fullName, id, deActiveDate, deActiveReason, expireDays, expiredDate } = u;
                        return {
                            protocol: x.protocol,
                            free: free ? 'Free' : 'Paid', 
                            email,
                            fullName,
                            emailAddress, 
                            mobile, 
                            createDate: createDate ? new Date(createDate) : null,
                            firstConnect : firstConnect ? new Date(firstConnect) : null, 
                            expireDays, 
                            expireDate: DateUtil.addDays(billingStartDate, expireDays ?? 30),
                            billingStartDate : billingStartDate ? new Date(billingStartDate) : null, 
                            maxConnections,
                            id, 
                            deActiveDate: deActiveDate ? new Date(deActiveDate) : null, 
                            deActiveReason, 
                            expiredDate: expiredDate ? new Date(expiredDate) : null
                        }
                    })),
                    sheetName: 'Clients',
                    sheetHeader: [
                        'Protocol',
                        'Free',
                        'Username',
                        'Full Name',
                        'Email Address',
                        'Mobile',
                        'Create Date',
                        'First Connect',
                        'Expire Days',
                        'Expire Date',
                        'Billing Start Date',
                        'Max Connections',
                        'ID',
                        'De-active Date',
                        'De-active Reason',
                        'Expired Date'
                    ]
                }
            ]
        })
        excel.saveExcel();
    }, [inbounds]);
    
    let maxUsers = inbounds?.map(x => x.settings ? x.settings['totalClients'] : 0).reduce((a, b) => a > b ? a : b, 0) ?? 0;
    let totalPages = Number( Math.ceil( maxUsers / view.limit ) ) || 1;

    let addUserDialog = useDialog((onClose?: Function) => <AddUser horizontal={false} onClose={onClose} onRefresh={refreshInbounds} disabled={isLoading} inbounds={inbounds ?? []}/>);

    const { data: admins } = useContextSWR<SystemUser[]>('/system/users?fields=username');

    const userNodesDialog = useDialog((user: V2RayConfigInboundClient, onClose?: Function) => <UserNodesDialog user={user} onClose={onClose}/>);

return <Container>
        <Head>
            <title>Users</title>
        </Head>
        <FieldsGroup data={view} horizontal dataSetter={setView} className="py-2 px-2" containerClassName="flex-col gap-y-2">
            <div className="flex flex-row">
                <FieldServerNodes/>
                <Field label="Inbounds" htmlFor="inbounds">
                    <MultiSelect id="inbounds" className={styles.input} valueMember='tag' displayMember={x => `${x.tag} (${x.protocol})`} items={inbounds ?? []}/>
                </Field>
                <Field label="Status" htmlFor="statusFilter">
                    <MultiSelect items={statusFilters} id={'statusFilter'}/>
                </Field>
                <Field label="Created By" htmlFor="createdBy">
                    <Select allowNull={true} nullText={'All Admins'} items={admins} displayMember='username' valueMember='username' id={'createdBy'}/>
                </Field>
                <Field label="Filter" htmlFor="filter">
                    <input type={"text"} id="filter" className={styles.input}/>
                </Field>
                <div className="flex flex-row flex-1 place-content-end">
                    {access('users', 'add') ? <button className={styles.buttonItem} onClick={() => addUserDialog.show()}><PlusIcon className="w-4"/> Add User</button> : null}
                    <button className={styles.buttonItem} onClick={() => refreshInbounds()}><ArrowPathIcon className="w-4"/> Reload</button>
                    <button className={styles.buttonItem} onClick={exportExcel}><ArrowUpTrayIcon className="w-4"/> Export Excel</button>
                </div>
            </div>
            <div className="flex flex-row">
                <Field label="Page" htmlFor="page">
                    <select id="page" className={styles.input}>
                        {[...new Array(totalPages)].map((x, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                    </select>
                </Field>
                <Field label="Limit" htmlFor="limit">
                    <select id="limit" className={styles.input}>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                        <option value={300}>300</option>
                        <option value={400}>400</option>
                        <option value={500}>500</option>
                    </select>
                </Field>
                <Field label="Sort" htmlFor="sortColumn">
                    <select id="sortColumn" className={styles.input}>
                        <option value="-">-</option>
                        <option value="id">ID</option>
                        <option value="email">Username</option>
                        <option value="fullName">FullName</option>
                        <option value="mobile">Mobile</option>
                        <option value="emailAddress">Email</option>
                        <option value="maxConnections">Max Connections</option>
                        <option value="expireDays">Expire Days</option>
                        <option value="expireDate">Expire Date</option>
                        <option value="billingStartDate">Billing Start Date</option>
                        <option value="createDate">Create Date</option>
                        <option value="deActiveDate">De-active Date</option>
                        <option value="deActiveReason">De-active Reason</option>
                        <option value="firstConnect">First Connect</option>
                        <option value="lastConnect">Last Connect</option>
                        <option value="quotaUsage">Bandwidth Usage (Monthly)</option>
                        <option value="quotaUsageAfterBilling">Bandwidth Usage (After Billing)</option>
                        <option value="quotaLimit">Bandwidth Limit</option>
                    </select>
                </Field>
                <Field label="Order" htmlFor="sort-order">
                    <select value={view?.sortAsc ? "asc" : "desc"} id="sort-order" className={styles.input} onChange={e => setView({ ...view, sortAsc: e.currentTarget.value == "asc" })}>
                        <option value={"asc"}>ASC</option>
                        <option value={"desc"}>DESC</option>
                    </select>
                </Field>
                <Field htmlFor="fullTime" label="Full Time">
                    <input type={"checkbox"} id="fullTime"/>
                </Field>
                <Field label="Show ID" htmlFor="showId">
                    <input type={"checkbox"} id="showId"/>
                </Field>
                <Field label="Precision Date" htmlFor="precision">
                    <input type="checkbox" id="precision"/>
                </Field>
            </div>
        </FieldsGroup>
        <Loading isLoading={isLoading}/>
        <div className="">
            <Table
                columns={[
                    'User',
                    'Infos',
                    'Dates',
                    'Actions'
                ]}

                rows={inbounds?.flatMap(x => {
                    let clients = (x.settings?.clients ?? []);
                    return clients.map(u => ({ ...u, inbound: x }));
                })}
                groupBy={u => u.inbound ?? {}}
                group={(i: V2RayConfigInbound, isCollapsed, setCollapsed) => {

                    let settings = i.settings ?? {};
                    let totalUsers = settings['totalClients'] ?? 0;
                    let totalActiveUsers = settings['totalActiveClients'] ?? 0;
                    let totalFiltered = settings['totalFiltered'] ?? 0;
                    let totalActiveFiltered = settings['totalActiveFiltered'] ?? 0;
                    let from = settings['from'] ?? 0;
                    let to = settings['to'] ?? 0;
                    
                    return <td onClick={() => setCollapsed(!isCollapsed)} colSpan={5} className="uppercase group bg-slate-100 px-4 py-3 cursor-pointer sticky top-[1.9rem] z-10 border-b-[1px]">
                        <div className="flex flex-row items-center gap-x-2">
                            <span className={classNames("font-bold group-hover:text-gray-600 duration-200 ease-in-out w-6 text-center py-0 inline-block rounded-full text-md select-none", {
                                'text-gray-300': isCollapsed,
                                'text-gray-600': !isCollapsed
                            })}>{isCollapsed ? <FolderPlusIcon className="w-6"/> : <FolderMinusIcon className="w-6"/>}</span>
                            <span className="uppercase font-bold">{i.tag}</span>
                            <div className="text-xs gap-x-1 flex flex-1">
                                <span className="inline-block border-[1px] px-2 rounded-lg border-slate-400 text-slate-500 uppercase">{i.protocol} - {i.streamSettings?.network}</span>
                                <span className="ease-in-out duration-200 inline-block px-2 rounded-lg border-[1px] border-orange-700 text-orange-900 group-hover:bg-orange-700 group-hover:text-white">Filtered {totalFiltered} / Active {totalActiveFiltered}</span>
                                <span className="ease-in-out duration-200 inline-block px-2 rounded-lg group-hover:bg-green-800 group-hover:text-white border-[1px] border-green-800 text-green-900">Total {totalUsers} / Active {totalActiveUsers}</span>
                                <span className="opacity-0 group-hover:opacity-100 ease-in-out duration-200 inline-block px-2 rounded-lg bg-slate-600 text-white">Max Client Number : {settings['maxClientNumber']}</span>
                            </div>
                            <div className="flex gap-x-2 items-center">
                                <span className="ease-in-out duration-200 inline-block px-2 rounded-lg border-[1px] group-hover:bg-stone-600 group-hover:text-white border-stone-600 text-stone-900">From {from} To {to}</span>
                                {/* <div className="p-1 rounded-full border-[1px] border-slate-400">
                                    <ArrowSmallLeftIcon  className="w-4"/>
                                </div>
                                <div className="p-1 rounded-full border-[1px] border-slate-400">
                                    <ArrowSmallRightIcon  className="w-4"/>
                                </div> */}
                            </div>
                        </div>
                    </td>
                }}
                cells={u => {

                    const {showId, precision, fullTime} = view;
                    const i = u.inbound;

                    return [
                        // User
                        <div className="flex flex-row">
                            <div className="items-center flex">
                                <span className={classNames("rounded-full aspect-square inline-block w-3", { 'bg-red-600': !!u.deActiveDate, 'bg-green-600': !u.deActiveDate })}></span>
                            </div>
                            <div className="flex-1">
                                <div className="flex flex-row">
                                    <Editable editable={(!u.firstConnect && access('users', 'edit')) || access('isAdmin')} className={"font-semibold inline-block"} onEdit={value => setUsername(i.tag, u, value)} value={u.email}>{u.email}</Editable>
                                    {u.private?<span className="ml-2 text-xs px-2 py-0 rounded-lg bg-gray-100 text-gray-500 cursor-default">Private</span>:null}
                                    {u.free?<span className="ml-2 text-xs px-2 py-0 rounded-lg bg-green-100 text-green-500 cursor-default">Free</span>:null}
                                </div>
                                <Editable editable={access('users', 'edit')} className="text-gray-600 inline-block" onEdit={value => setInfo(i.tag, u, 'fullName', value)} value={u.fullName}>{u.fullName ?? '-'}</Editable>
                                <Infos className="mt-2">
                                    {showId ? <>
                                        <Info className="ml-3" label={"ID"}>
                                            <Editable editable={access('users', 'regenerateId')} onEdit={newId => setInfo(i.tag, u, 'id', newId)} value={u.id}>{u.id}</Editable>
                                        </Info>
                                        <Info className="ml-3" label={"Flow"}>
                                            <Editable editable={access('users', 'edit')} editor={(value, onChange) => <Select value={value} onChange={e => onChange(e)} items={[
                                                'none',
                                                'xtls-rprx-vision'
                                            ]}>
                                            </Select>} onEdit={flow => setInfo(i.tag, u, 'flow', flow)} value={u.flow}>{u.flow ?? '-'}</Editable>
                                        </Info>
                                    </>
                                    :null}
                                    <Info label={u.deActiveReason ? "De-active reason" : null} className="ml-2">
                                        <Popup popup={u.deActiveReason?.length ?? 0 > 30 ? u.deActiveReason : null}>
                                            <Editable onEdit={value => setInfo(i.tag, u, 'deActiveReason', value)} value={u.deActiveReason}>{(u.deActiveReason?.length ?? 0) > 30 ? u.deActiveReason?.substring(0,30) + '...' : (u.deActiveReason ? u.deActiveReason : '-')}</Editable>
                                        </Popup>
                                    </Info>
                                </Infos>
                            </div>
                        </div>,
                        // Infos
                        <Infos>
                            <Info label={"Mobile"}>
                                <Editable editable={access('users', 'edit')} onEdit={value => setInfo(i.tag, u, 'mobile', value)} value={u.mobile}>{u.mobile ?? 'N/A'}</Editable>
                            </Info>
                            <Info label={"Email"}>
                                <Editable editable={access('users', 'edit')} onEdit={value => setInfo(i.tag, u, 'emailAddress', value)} value={u.emailAddress}>{u.emailAddress ?? 'N/A'}</Editable>
                            </Info>
                            <Info label={'Max Connections'}>
                                <Editable editable={access('users', 'changeMaxConnections')} onEdit={value => setMaxConnection(i.tag, u, value)} value={u.maxConnections}>{u.maxConnections}</Editable>
                            </Info>
                            <Info label={'Expire Days'}>
                                <Editable editable={access('users', 'changeExpireDays')} onEdit={value => setExpireDays(i.tag, u, value)} value={u.expireDays}>{u.expireDays}</Editable>
                            </Info>
                            <Info label={'Bandwidth (This Month)'}>
                                <Editable input={{
                                    type: 'number',
                                    placeholder: '1'
                                }} editable={access('users', 'changeBandwidth')} onEdit={value => setInfo(i.tag, u, 'quotaLimit', value * 1024 * 1024 * 1024)} value={u.quotaLimit} postfix={'GB'}>
                                    <Size size={u['quotaUsage'] ?? 0}/> / {u.quotaLimit && u.quotaLimit > 0 ? <Size size={u.quotaLimit ?? 0}/> : '∞' }
                                </Editable>
                            </Info>
                            <Info label={'Bandwidth (After Billing Date)'}>
                                <Size size={u['quotaUsageAfterBilling'] ?? 0}/>
                            </Info>
                            <Info label={'Last Connected IP'}>
                                {u['lastConnectIP'] ?? '-'}
                                {u['lastConnectIP'] ? <a target={'_blank'} className={classNames(styles.link, 'pl-1')} href={`https://whatismyipaddress.com/ip/${u['lastConnectIP']}`}>(Info)</a> : null}
                            </Info>
                            <Info label={'Last Connect Node'}>
                                <ServerNode serverId={u['lastConnectNode']}/>
                            </Info>
                            <Info label={'Created By'}>
                                {u.createdBy ?? '-'}
                            </Info>
                        </Infos>,
                        // Dates
                        <div className="flex flex-col xl:flex-row">
                            <Infos className="flex-1 grid md:grid-cols-2 gap-x-4">
                                <Info label={'Create'}>
                                    <DateView precision={precision} full={fullTime} date={u.createDate}/>
                                </Info>
                                <Info label={'Billing'}>
                                    <DateView precision={precision} full={fullTime} date={u.billingStartDate} removeFullMonths={!u.deActiveDate}/>
                                </Info>
                                <Info label={'DeActived'}>
                                    <DateView precision={precision} full={fullTime} date={u.deActiveDate}/>
                                </Info>
                                <Info label={'Until Expire'}>
                                    <DateView precision={precision} full={fullTime} date={u['expireDate']}/>
                                </Info>
                                <Info label={'Expired'}>
                                    <DateView precision={precision} full={fullTime} date={u.expiredDate}/>
                                </Info>
                                <Info label={'First Connect'}>
                                    <DateView precision={precision} full={fullTime} date={u.firstConnect}/>
                                </Info>
                                <Info label={'Last Connect'}>
                                    <DateView precision={precision} full={fullTime} date={u['lastConnect']}/>
                                </Info>
                                {u['quotaUsageUpdate'] ? <Info label={'Bandwidth Update'}>
                                    <DateView precision={precision} full={fullTime} date={u['quotaUsageUpdate']}/>
                                </Info> : null }
                                <Info label={'First Subscription Update'}>
                                    <DateView precision={precision} full={fullTime} date={u['subscription']?.firstUpdate}/>
                                </Info>
                                <Info label={'Last Subscription Update'}>
                                    <DateView precision={precision} full={fullTime} date={u['subscription']?.lastUpdate}/>
                                </Info>
                            </Infos>
                        </div>,
                        // Actions
                        <PopupMenu>
                            <PopupMenu.Item action={() => window.open(i.clientPanelUrl + '/account/' + u.id)} visible={!!i.clientPanelUrl && access('users', 'subscribeUrl')} icon={<UserCircleIcon className="w-4"/>}>
                                Open Client Panel
                            </PopupMenu.Item> 
                            <PopupMenu.Item visible={!!i.clientPanelUrl && access('users', 'subscribeUrl')} icon={<RssIcon className="w-4"/>}>
                                <Copy className="block text-inherit" notifyText={`User "${u.email}" subscription url copied`} data={i.clientPanelUrl + `/api/configs/${u.id}`}>
                                    Copy Subscription Url
                                </Copy>
                            </PopupMenu.Item> 
                            <PopupMenu.Item visible={access('users', 'clientConfig')} icon={<DevicePhoneMobileIcon className="w-4"/>} action={() => clientConfigDialog.show(u, i.tag)}>
                                Client Config
                            </PopupMenu.Item>
                            <PopupMenu.Item visible={access('users', 'clientConfig')} icon={<QrCodeIcon className="w-4"/>} action={() => showQRCode(i.tag, u)}>
                                QR Code
                            </PopupMenu.Item>
                            <PopupMenu.Item icon={<DocumentDuplicateIcon className="w-4"/>}>
                                <Copy className="block text-inherit" notifyText={`User "${u.email}" ID copied`} data={u.id}>
                                    Copy User ID
                                </Copy>
                            </PopupMenu.Item>
                            <PopupMenu.Item visible={access('users', 'clientConfig')} icon={<DocumentDuplicateIcon className="w-4"/>}>
                                <Copy className="block text-inherit" notifyText={`User "${u.email}" client config copied`} data={() => serverRequest(context.server, '/client_config?tag=' + i.tag, u).then(data => data.config)}>
                                    Copy Config
                                </Copy>
                            </PopupMenu.Item>
                            <PopupMenu.Item icon={u.deActiveDate?<BoltIcon className="w-4"/>:<BoltSlashIcon className="w-4"/>} visible={access('users', 'active') && (!u.deActiveReason?.includes('Expired') || access('users', 'activeExpired'))} action={() => prompt(`Change user ${u.email} ${u.deActiveDate?'active':'de-active'} ?`, u.deActiveDate?'Active':'De-active', () => setActive(i.tag, u, u.deActiveDate ? true : false))}>
                                {u.deActiveDate? 'Active User' : 'De-Active User'}
                            </PopupMenu.Item>
                            <PopupMenu.Item icon={<TrashIcon className="w-4"/>} visible={(access('users', 'delete') && (!u.firstConnect || access('users', 'deleteConnected')))} action={() => prompt(`Delete user ${u.email} ?`, `Delete`,() => removeUser(i.protocol, i.tag, u))}>
                                Remove User
                            </PopupMenu.Item>
                            <PopupMenu.Item visible={access('users', 'regenerateId')} icon={<FireIcon className="w-4"/>} action={() => prompt(`Generate ID for ${u.email} ?`, `Generate`, () => reGenerateId(i.tag, u))}>
                                ReGenerate ID
                            </PopupMenu.Item>
                            <PopupMenu.Item visible={access('users', 'renew')} icon={<PlusIcon className="w-4"/>} action={() => prompt(`Add 1 Months to Expire Days for user "${u.email}" ?`, `Add Expire Days`, () => addDays(i.tag, u, 30))}>
                                +1 Months
                            </PopupMenu.Item>
                            <PopupMenu.Item visible={access('transactions', 'list')} action={() => router.push(`/transactions?user=${u.email}`)} icon={<CurrencyDollarIcon className="w-4"/>}>
                                Transactions
                            </PopupMenu.Item>
                            <PopupMenu.Item visible={access('users', 'dailyUsage')} icon={<CalendarDaysIcon className="w-4"/>} action={() => router.push(`/usages?user=${u.email}`)}>
                                Daily Usages
                            </PopupMenu.Item>
                            <PopupMenu.Item icon={<DocumentTextIcon className="w-4"/>} visible={access('users', 'logs')} action={() => router.push(`/logs?all=1&filter=`+u.email)}>
                                Logs
                            </PopupMenu.Item>
                            <PopupMenu.Item icon={<ClockIcon className="w-4"/>} visible={access('users', 'setFirstConnectionAsCreateDate')} action={() => prompt(`Set first connect date as create date for user "${u.email}" ?`, `Set Create Date`, () => setInfo(i.tag, u, 'createDate', u.firstConnect))}>
                                Set First Connect as Create Date
                            </PopupMenu.Item>
                            <PopupMenu.Item icon={u.private?<EyeIcon className="w-4"/>:<EyeSlashIcon className="w-4"/>} visible={access('users', 'changePrivate')} action={() => prompt(`Set user "${u.email}" ${u.private?"public":"private"}?`, `Change Private`, () => setInfo(i.tag, u, 'private', !u.private))}>
                                Set {u.private?'Public':'Private'}
                            </PopupMenu.Item>
                            <PopupMenu.Item icon={<CurrencyDollarIcon className="w-4"/>} visible={access('users', 'changeFree')} action={() => prompt(`Set user "${u.email}" as ${u.free?"Non-free":"Free"}?`, `Free/Paid`, () => setInfo(i.tag, u, 'free', !u.free))}>
                                Set {u.free?'Non-Free':'Free'}
                            </PopupMenu.Item>
                            <PopupMenu.Item visible={access('users', 'changeInbound')} icon={<ArrowsUpDownIcon className="w-4"/>} action={() => changeInboundDialog.show(context, inbounds, i.tag, u.email, () => refreshInbounds())}>
                                Change Inbound
                            </PopupMenu.Item>
                            <PopupMenu.Item icon={<DocumentPlusIcon className="w-4"/>} visible={access('users', 'copyUser')} action={() => copyUserDialog.show(context, inbounds, i.tag, u.email, () => refreshInbounds())}>
                                Copy User
                            </PopupMenu.Item>
                            <PopupMenu.Item icon={<DocumentPlusIcon className="w-4"/>} visible={access('users', 'otherNodes')} action={() => userNodesDialog.show(u)}>
                                View in other Servers
                            </PopupMenu.Item>
                            <PopupMenu.Item icon={<DocumentPlusIcon className="w-4"/>} visible={access('users', 'traffics')} action={() => router.push(`/usages/traffic?user=${u.email}`)}>
                                Traffic Usage
                            </PopupMenu.Item>
                            <PopupMenu.Item icon={<DocumentPlusIcon className="w-4"/>} visible={access('users', 'cancel')} action={() => clientCancelDialog.show(u)}>
                                Cancel and De-active
                            </PopupMenu.Item>
                        </PopupMenu>
                    ];
                }}
            />
        </div>
    </Container>
    
}