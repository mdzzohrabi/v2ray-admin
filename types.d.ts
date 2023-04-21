interface V2RayConfig {
    log?: V2RayConfigLog,
    api?: V2RayConfigApi,
    dns?: V2RayConfigDns,
    routing?: V2RayConfigRouting,
    inbounds?: V2RayConfigInbound[],
    outbounds?: V2RayConfigOutbound[]
    policy?: V2RayConfigPolicy
    stats?: {}
    nodes?: V2RayNode[]
}

interface V2RayNode {
    apiKey?: string
    name?: string
}

interface V2RayConfigPolicy {
    levels?: { [userLevel: string]: V2RayConfigPolicyLevel }
    system?: V2RayConfigPolicySystem
}

interface V2RayConfigPolicySystem {
    statsInboundUplink?: boolean,
    statsInboundDownlink?: boolean
}

interface V2RayConfigPolicyLevel {
    handshake?: number,
    connIdle?: number,
    uplinkOnly?: number,
    downlinkOnly?: number,
    statsUserUplink?: boolean,
    statsUserDownlink?: boolean,
    bufferSize?: number
}

interface V2RayConfigInboundClient {
    id?: string
    email?: string
    level?: number
    deActiveDate?: string
    maxConnections?: number
    deActiveReason?: string
    expiredDate?: string
    billingStartDate?: string
    firstConnect?: string
    expireDays?: number
    createDate?: string
    fullName?: string
    mobile?: string
    emailAddress?: string
    private?: boolean
    free?: boolean
    quotaLimit?: number
    serverNode?: string
    serverNodeInbound?: string
}

interface V2RayConfigInboundSettings {
    clients?: V2RayConfigInboundClient[]
    accounts?: {user?: string, pass?: string}[]
    users?: {email?: string, level?: number, secret?: string}[]
    decryption?: string
}

interface V2RayConfigInboundStreamSettings {
    network?: string
    security?: string
    tcpSettings?: any
    tlsSettings?: {
        alpn?: string[]
        certificates?: {
            certificateFile?: string
            keyFile?: string
        }[]
    }
}

interface V2RayConfigInbound {
    /** Client Address (Custom) */
    address?: string
    /** Client Config Prefix (Custom) */
    configPrefix?: string
    listen?: string
    port?: number | string
    protocol?: string
    settings?: V2RayConfigInboundSettings
    streamSettings?: V2RayConfigInboundStreamSettings
    tag?: string,
    sniffing?: V2RayConfigInboundSiffingObject
    allocate?: any
    usersServerNode?: string
    mirrorInbound?: string
}

interface V2RayConfigInboundSiffingObject {
    enabled?: boolean
    destOverride?: ('http' | 'tls')[]
}

interface V2RayConfigOutbound {
    protocol?: string
    tag?: string
    settings?: V2RayConfigOutboundSettings
    sendThrough?: string
    streamSettings?: V2RayConfigStream
    proxySettings?: V2RayConfigProxy
    mux?: V2RayConfigMux
}

interface V2RayConfigOutboundSettings {
    servers?: V2RayConfigOutboundSettingsServer[]
    vnext?: V2RayConfigOutboundSettingsServerVNext[]
    redirect?: string
    // MTProto
    users?: { secret?: string }[]
    response?: { type?: string }
}

interface V2RayConfigOutboundSettingsServerVNext {
    address?: string
    port?: number
    users?: { id?: string, security?: string }[]
}

interface V2RayConfigOutboundSettingsServer {
    address?: string
    port?: number
    users?: { user?: string, pass?: string }[]
}

interface V2RayConfigProxy {
    tag?: string,
    transportLayer?: boolean
}

interface V2RayConfigMux {
    enabled?: boolean
    concurrency?: number
}

interface V2RayConfigStream {  
  transport: "tcp" | "udp",
  transportSettings: any,
  security: "none" | "auto" | 'tls',
  securitySettings: any
  network?: 'tcp' | 'kcp' | 'ws' | 'http' | 'domainsocket' | 'quic'
  tcpSettings?: HttpHeaderObject
}

interface HttpHeaderObject {
    header?: {
        type?: 'http' | 'none'
    }
    request?: {
        path?: string
        method?: string
        headers?: { [name: string]: string }
    }
    response?: any
}

interface V2RayConfigLog {
    logLevel?: "debug" | "info" | "warning" | "error" | "none"
    access?: string
    error?: string
}

interface V2RayConfigRouting {
    domainStrategy?: "AsIs" | "IPIfNonMatch" | "IPOnDemand",
    domainMatcher?: "linear" | "mph"
    rules?: V2RayConfigRoutingRule[]
    balancers?: V2RayConfigRoutingBalancer[]
}

interface V2RayConfigRoutingBalancer {
    tag?: string
    selector?: string[]
}

interface V2RayConfigApi {
    tag?: string
    services: ("HandlerService" | "LoggerService" | "StatsService" | "ObservatoryService")[]
}


interface V2RayConfigDns {
    tag?: string
    clientIp?: string
    queryStrategy?: "UseIP" | "UseIPv4" | "UseIPv6"
    disableCache?: boolean
    disableFallback?: boolean
    servers?: (string | V2RayConfigDnsServer)[]
    hosts?: { [host: string]: string | string[] }
}

interface V2RayConfigDnsServer {
    address?: string,
    port?: number,
    clientIp?: number,
    skipFallback?: boolean,
    domains?: string[],
    expectIPs: string[]
}
interface V2RayConfigRoutingRule {
    domainMatcher?: "linear" | "mph"
    type?: "field"
    domain?: string[]
    ip?: string[]
    source?: string
    port?: string
    sourcePort?: string
    network?: "tcp" | "udp"
    user?: string[]
    inboundTag?: string[]
    protocol?: string
    attrs?: string
    outboundTag?: string
    balancerTag?: string
    description?: string
}

interface Transaction {
    id?: string
    user?: string
    remark?: string
    amount?: number
    createDate?: string
    creator?: string
    serverNodeId?: string
    createdBy?: string
    createdById?: string
}

interface V2RayDb {
    idCounter?: {
        transactions?: number
    },
    transactions?: Transaction[];
    users?: User[];
}

interface User {
    user:? string
    token?: string
    isAdmin?: boolean
}

interface Change {
    action: 'set' | 'delete' | 'add',
    value?: any,
    path?: string[]
    prevValue?: any
}

interface TrafficUsages {
    [date: string]: { name: string, direction: string, type: string, traffic: number, server: string }[]
}

interface UserUsage {
    firstConnect?: string
    lastConnect?: string
    lastConnectNode?: string
    quotaUsage?: number
    quotaUsageAfterBilling?: number
    quotaUsage_local?: number
    quotaUsageUpdate?: string
    lastConnectIP?: string
}

interface UserUsages {
    [user?: string]: UserUsage
}

interface ServerNode {
    id?: string
    name?: string
    type?: 'client' | 'server'
    address?: string
    apiKey: string
    lastConnectDate?: string
    lastConnectIP?: string
    lastSyncDate?: string
    sync?: boolean
    syncConfig?: boolean
    readLastMinutesLogs?: boolean
    disabled?: boolean
    show_in_other_nodes?: boolean
    show_in_home?: boolean
}

interface CRUDAcl {
    add?: boolean
    list?: boolean
    edit?: boolean
    delete?: boolean
}

interface SystemAcls {
	isAdmin?: boolean;
	administrators?: boolean;
	transactions?: CRUDAcl;
	serverNodes?: CRUDAcl;
	trafficUsage?: { list?: boolean };
	logs?: { list?: boolean };
	users?: CRUDAcl & {
		deleteConnected?: boolean;
		renew?: boolean;
		active?: boolean;
		activeExpired?: boolean;
		subscribeUrl?: boolean;
		clientConfig?: boolean;
		freeUsers?: boolean;
		changeFree?: boolean;
		privateUsers?: boolean;
		changePrivate?: boolean;
		regenerateId?: boolean;
		changeInbound?: boolean;
		copyUser?: boolean;
		setFirstConnectionAsCreateDate?: boolean;
		dailyUsage?: boolean;
		logs?: boolean;
		changeExpireDays?: boolean
		changeMaxConnections?: boolean
		changeBandwidth?: boolean
        otherNodes?: boolean
	};
	config?: { list?: boolean; edit?: boolean };
	home?: {
		show?: boolean;
		traffics?: boolean;
		users?: boolean;
		servers?: boolean;
		transactions?: boolean;
	};
	allowedInbounds?: string[];
}

interface SystemUser {
    id?: string
    username?: string
    password?: string
    isActive?: boolean
    email?: string
    mobile?: string
    acls?: SystemAcls
    pricing?: SystemPricing
}

interface SystemPricing {
    newUserCost?: number
    renewUserCost?: number
}

interface SystemConfig extends SystemPricing {
    webPort?: boolean
}

interface LoginSession {
    token?: string
    username?: string
    userId?: string
    loginDate?: number
    lastRequestTime?: number
    isExpired?: boolean
    userAgent?: string
    lastRequestIP?: string
}

type AsyncGeneratorType<T extends AsyncGenerator<any>> = T extends AsyncGenerator<infer R> ? R : any;