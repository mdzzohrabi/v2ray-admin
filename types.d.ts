
interface V2RayConfig {
    log?: V2RayConfigLog,
    api?: V2RayConfigApi,
    dns?: V2RayConfigDns,
    routing?: V2RayConfigRouting,
    inbounds?: V2RayConfigInbound[],
    outbounds?: V2RayConfigOutbound[]
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
}

interface V2RayConfigInboundSettings {
    clients?: V2RayConfigInboundClient[]
}

interface V2RayConfigInboundStreamSettings {
    network?: string
    security?: string
}

interface V2RayConfigInbound {
    listen?: string
    port?: number
    protocol?: string
    settings?: V2RayConfigInboundSettings
    streamSettings?: V2RayConfigInboundStreamSettings
    tag?: string,
    sniffing?: any
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
  security: "none" | "auto",
  securitySettings: any
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
    balancers?: any
}

interface V2RayConfigApi {
    tag?: string
    services: "HandlerService" | "LoggerService" | "StatsService" | "ObservatoryService"
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
    domains?: string[]
    ip?: string[]
    port?: string
    sourcePort?: string
    network?: "tcp" | "udp"
    user?: string[]
    inboundTag?: string[]
    protocol?: string
    attrs?: string
    outboundTag?: string
    balancerTag?: string
}

interface Transaction {
    id?: number
    user?: string
    remark?: string
    amount?: number
    createDate?: string
    creator?: string
}

interface V2RayDb {
    idCounter?: {
        transactions?: number
    },
    transactions?: Transaction[];
}

interface Change {
    action: 'set' | 'delete',
    value?: any,
    path?: string[]
}