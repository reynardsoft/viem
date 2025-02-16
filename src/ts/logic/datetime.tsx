import { Component, h } from "preact";

const units = {
    year: 24 * 60 * 60 * 365 * 1000,
    month: 24 * 60 * 60 * 365 * 1000 / 12,
    week: 24 * 60 * 60 * 7 * 1000,
    day: 24 * 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    minute: 60 * 1000,
    second: 1000,
} as Record<Intl.RelativeTimeFormatUnit, number>;
const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function getTimeDuration(elapsed: number, stopAt: keyof typeof units = "second") {
    if (Math.abs(elapsed) < units[stopAt]) return {
        units: Math.round(elapsed / units[stopAt]),
        unit: stopAt,
        remaining: units[stopAt] - Math.abs(elapsed),
    };
    for (const unitT in units) {
        let unit = unitT as keyof typeof units;
        if (Math.abs(elapsed) > units[unit] || unit == stopAt)
            return {
                units: Math.round(elapsed / units[unit]),
                unit: unit as Intl.RelativeTimeFormatUnit,
                remaining: units[unit] - (Math.abs(elapsed) % units[unit]),
            }
    }
    return {
        units: 0,
        unit: "second" as Intl.RelativeTimeFormatUnit,
        remaining: 0,
    }
}
type TimeDuration = ReturnType<typeof getTimeDuration>;

export function getTimeBetween(d1: Date | string, d2 = new Date()) {
    if (!(d1 instanceof Date)) d1 = new Date(d1);
    let diff = d1.getTime() - d2.getTime();
    return isNaN(diff) ? 0 : diff;
}


export class DateTime extends Component<{date: Date}> {
    timeout = null as ReturnType<typeof setTimeout> | null;
    render() {
        console.log("Updating time");
        let { date } = this.props;
        let elapsed = getTimeBetween(date);
        let duration = getTimeDuration(elapsed);
        let formatted = rtf.format(duration.units, duration.unit);
        console.log( duration.remaining, Math.abs(elapsed));
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(() => this.forceUpdate(), Math.min(0x7FFFFFFF, duration.remaining, Math.abs(elapsed)));
        return <time dateTime={date.toString()} title={date.toLocaleString()}>{formatted}</time>
    }
    componentWillUnmount() {
        if (this.timeout) clearTimeout(this.timeout);
    }
}
