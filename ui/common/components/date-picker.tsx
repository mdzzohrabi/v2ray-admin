import { styles } from "@common/lib/styles";
import classNames from "classnames";
import { useMemo, useState } from "react";
import { Field, FieldsGroup } from "./fields";
import { Select } from "./select";

export type DateTypes = string | number | Date

export interface DatePickerProps {
    locale?: string
    value?: Date
}

export function DatePicker({ locale }: DatePickerProps) {
    
    let isEn = location.search?.replace(/^\?/, '')?.split('&')?.map(x => x.split('='))?.some(x => x[0] == 'date' && x[1] == 'en');
    let dateLocale = locale ?? (isEn ? 'en-US' : 'fa-IR-u-nu-latn');
    let intl = new Intl.DateTimeFormat(dateLocale, { dateStyle: 'short' });    

    const [date, setDate] = useState({
        year: Number(new Intl.DateTimeFormat(dateLocale, { year: 'numeric' }).format(new Date())),
        month: Number(new Intl.DateTimeFormat(dateLocale, { month: 'numeric' }).format(new Date())),
        day: Number(new Intl.DateTimeFormat(dateLocale, { day: 'numeric' }).format(new Date()))
    });

    let currentYear = Number(new Intl.DateTimeFormat(dateLocale, { year: 'numeric' }).format(new Date()));

    const months = useMemo(() => new Array(12).fill(0).map((x, i) => i + 1), []);
    const days = useMemo(() => new Array(31).fill(0).map((x, i) => i + 1), []);
    const years = useMemo(() => new Array(10).fill(0).map((x, i) => currentYear - i), []);

    return <FieldsGroup data={date} dataSetter={setDate} className={classNames('flex flex-row items-center')}>
        <Field htmlFor="year" className="px-0">
            <Select id="year" className={classNames(styles.input, 'rounded-r-none border-r-0')} items={years} nullText='All Years'/>
        </Field>
        <div className="bg-slate-50 border-y-[1px] border-y-gray-200 items-center text-gray-400 select-none px-1 flex">/</div>
        <Field htmlFor="month" className="px-0">
            <Select id="month" className={classNames(styles.input, 'rounded-none border-x-0')} items={months} nullText='All Months'/>
        </Field>
        <span className="bg-slate-50 border-y-[1px] border-y-gray-200 items-center text-gray-400 select-none px-1 flex">/</span>
        <Field htmlFor="day" className="px-0">
            <Select id="day" className={classNames(styles.input, 'rounded-l-none border-l-0')} items={days} nullText={'All Days'}/>
        </Field>
    </FieldsGroup>
}