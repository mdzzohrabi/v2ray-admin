// @ts-check

const { DateUtil } = require("../lib/util");

/** @type {{ [name: string]: (user: import("../types").V2RayConfigInboundClient) => boolean }} */
const statusFilters = {
    'Active': u => !u.deActiveDate,
    'De-Active': u => !!u.deActiveDate,
    'Expired': u => (u.deActiveReason?.includes('Expired') ?? false),
    'Private': u => !!u.private,
    'Non-Private': u => !u.private,
    'Free': u => !!u.free,
    'Non-Free': u => !u.free,
    'Without FullName': u => !u.fullName,
    'With FullName': u => !!u.fullName,
    'Without Mobile': u => !u.mobile,
    'With Mobile': u => !!u.mobile,
    'Not Connected (1 Hour)': u => !u['lastConnect'] || (Date.now() - new Date(u['lastConnect']).getTime() >= 1000 * 60 * 60),
    'Not Connected (10 Hours)': u => !u['lastConnect'] || (Date.now() - new Date(u['lastConnect']).getTime() >= 1000 * 60 * 60 * 10),
    'Not Connected (1 Day)': u => !u['lastConnect'] || (Date.now() - new Date(u['lastConnect']).getTime() >= 1000 * 60 * 60 * 24),
    'Not Connected (1 Month)': u => !u['lastConnect'] || (Date.now() - new Date(u['lastConnect']).getTime() >= 1000 * 60 * 60 * 24 * 30),
    'Connected (1 Minutes)': u => !!u['lastConnect'] && (Date.now() - new Date(u['lastConnect']).getTime() <= 1000 * 60 * 1),
    'Connected (2 Minutes)': u => !!u['lastConnect'] && (Date.now() - new Date(u['lastConnect']).getTime() <= 1000 * 60 * 2),
    'Connected (5 Minutes)': u => !!u['lastConnect'] && (Date.now() - new Date(u['lastConnect']).getTime() <= 1000 * 60 * 5),
    'Connected (1 Hour)': u => !!u['lastConnect'] && (Date.now() - new Date(u['lastConnect']).getTime() <= 1000 * 60 * 60),
    'Connected (10 Hours)': u => !!u['lastConnect'] && (Date.now() - new Date(u['lastConnect']).getTime() <= 1000 * 60 * 60 * 10),
    'Connected (1 Day)': u => !!u['lastConnect'] && (Date.now() - new Date(u['lastConnect']).getTime() <= 1000 * 60 * 60 * 24),
    'Connected (1 Month)': u => !!u['lastConnect'] && (Date.now() - new Date(u['lastConnect']).getTime() <= 1000 * 60 * 60 * 24 * 30),
    'Recently Created (1 Hour)': u => !!u.createDate && (Date.now() - new Date(u.createDate).getTime() <= 1000 * 60 * 60),
    'Recently Created (10 Hours)': u => !!u.createDate && (Date.now() - new Date(u.createDate).getTime() <= 1000 * 60 * 60 * 10),
    'Recently Created (1 Day)': u => !!u.createDate && (Date.now() - new Date(u.createDate).getTime() <= 1000 * 60 * 60 * 24),
    'Recently Created (1 Month)': u => !!u.createDate && (Date.now() - new Date(u.createDate).getTime() <= 1000 * 60 * 60 * 24 * 30),
    'Expiring (6 Hours)': u => !u.deActiveDate && !!u.billingStartDate &&  ((new Date(u.billingStartDate).getTime() + ((u.expireDays ?? 30) * 24 * 60 * 60 * 1000)) - Date.now() <= 1000 * 60 * 60 * 6),
    'Expiring (24 Hours)': u => !u.deActiveDate && !!u.billingStartDate && ((new Date(u.billingStartDate).getTime() + ((u.expireDays ?? 30) * 24 * 60 * 60 * 1000)) - Date.now() <= 1000 * 60 * 60 * 24),
    'Expiring (3 Days)': u => !u.deActiveDate && !!u.billingStartDate &&   ((new Date(u.billingStartDate).getTime() + ((u.expireDays ?? 30) * 24 * 60 * 60 * 1000)) - Date.now() <= 1000 * 60 * 60 * 24 * 3),
    'Expiring (1 Week)': u => !u.deActiveDate && !!u.billingStartDate &&   ((new Date(u.billingStartDate).getTime() + ((u.expireDays ?? 30) * 24 * 60 * 60 * 1000)) - Date.now() <= 1000 * 60 * 60 * 24 * 7),
    'De-activated (6 Hours)': u => !!u.deActiveDate && (Date.now() - new Date(u.deActiveDate).getTime() <= 1000 * 60 * 60 * 6),
    'De-activated (24 Hours)': u => !!u.deActiveDate && (Date.now() - new Date(u.deActiveDate).getTime() <= 1000 * 60 * 60 * 24),
    'De-activated (3 Days)': u => !!u.deActiveDate && (Date.now() - new Date(u.deActiveDate).getTime() <= 1000 * 60 * 60 * 24 * 3),
    'De-activated (1 Week)': u => !!u.deActiveDate && (Date.now() - new Date(u.deActiveDate).getTime() <= 1000 * 60 * 60 * 24 * 7),
    'De-activated (1 Month)': u => !!u.deActiveDate && (Date.now() - new Date(u.deActiveDate).getTime() <= 1000 * 60 * 60 * 24 * 30),
    'Re-activated from Expire (1 Week)': u => !!u.billingStartDate && u.billingStartDate != u.firstConnect && (Date.now() - new Date(u.billingStartDate).getTime() <= 1000 * 60 * 60 * 24 * 7),
    'Unlimit Bandwidth': u => !u['quotaLimit'] || u['quotaLimit'] == 0,
    'Limited Bandwidth': u => (u['quotaLimit'] ?? 0) > 0,
};

module.exports = { statusFilters };