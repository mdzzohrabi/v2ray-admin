// @ts-check
import classNames from 'classnames';
import moment from 'jalali-moment';
import { useRouter } from 'next/router';
import React from 'react';
import { dateDiff } from '../lib/util';
import { Popup } from './popup';

/**
 * @typedef {{
 *      date: any,
 *      className?: string,
 *      containerClassName?: string
 * 		full?: boolean
 * 		precision?: boolean
 * 		locale?: string
 * 		options?: Intl.DateTimeFormatOptions
 * }} DateViewProps
 */

/**
 * Date view
 * @param {DateViewProps} param0
 */
export function DateView({ date, className = '', containerClassName ='', full = false, precision = false, locale = '', options = undefined }) {
    let router = useRouter();
    let isEN = (locale ?? router.query.date) == 'en';
    if (!date) return <>-</>;
    if (typeof date == 'string') date = date.replace(' ', ' ');
    date = date instanceof Date ? date : new Date(date);
    // return <>
    //     {isEN ? date.toLocaleString() : moment(date).locale('fa').format('YYYY/MM/DD hh:mm:ss a')}
    //     <span className='block text-gray-500 text-rtl'>{moment(date).locale('fa').fromNow()}</span>
    // </>;

    let intl = new Intl.DateTimeFormat(isEN ? 'en-US' : 'fa-IR-u-nu-latn', options ?? {
		timeStyle: 'medium',
		dateStyle: 'full'
	})

    let fromNow = precision ? dateDiff(date).text : moment(date).locale('fa').fromNow();
    let strDate = intl.format(date);// isEN ? date.toLocaleString() : moment(date).locale('fa').format('YYYY/MM/DD hh:mm:ss a');

    if (full) {
        return <Popup className={containerClassName} popup={<span dir='rtl'>{fromNow}</span>}>
            <span className={classNames('block text-gray-900 text-rtl', className)}>{strDate}</span>
        </Popup>
    }

    return <Popup popup={strDate} className={containerClassName}>
        <span className={classNames('block text-gray-500 text-rtl', className)}>{fromNow}</span>
    </Popup>;


}