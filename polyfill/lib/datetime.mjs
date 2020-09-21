/* global __debug__ */

import { GetDefaultCalendar } from './calendar.mjs';
import { ES } from './ecmascript.mjs';
import { DateTimeFormat } from './intl.mjs';
import { GetIntrinsic, MakeIntrinsicClass } from './intrinsicclass.mjs';

import {
  ISO_YEAR,
  ISO_MONTH,
  ISO_DAY,
  HOUR,
  MINUTE,
  SECOND,
  MILLISECOND,
  MICROSECOND,
  NANOSECOND,
  CALENDAR,
  CreateSlots,
  GetSlot,
  SetSlot
} from './slots.mjs';

const ObjectAssign = Object.assign;

export class DateTime {
  constructor(
    isoYear,
    isoMonth,
    isoDay,
    hour = 0,
    minute = 0,
    second = 0,
    millisecond = 0,
    microsecond = 0,
    nanosecond = 0,
    calendar = GetDefaultCalendar()
  ) {
    isoYear = ES.ToInteger(isoYear);
    isoMonth = ES.ToInteger(isoMonth);
    isoDay = ES.ToInteger(isoDay);
    hour = ES.ToInteger(hour);
    minute = ES.ToInteger(minute);
    second = ES.ToInteger(second);
    millisecond = ES.ToInteger(millisecond);
    microsecond = ES.ToInteger(microsecond);
    nanosecond = ES.ToInteger(nanosecond);
    calendar = ES.ToTemporalCalendar(calendar);

    ES.RejectDateTime(isoYear, isoMonth, isoDay, hour, minute, second, millisecond, microsecond, nanosecond);
    ES.RejectDateTimeRange(isoYear, isoMonth, isoDay, hour, minute, second, millisecond, microsecond, nanosecond);

    CreateSlots(this);
    SetSlot(this, ISO_YEAR, isoYear);
    SetSlot(this, ISO_MONTH, isoMonth);
    SetSlot(this, ISO_DAY, isoDay);
    SetSlot(this, HOUR, hour);
    SetSlot(this, MINUTE, minute);
    SetSlot(this, SECOND, second);
    SetSlot(this, MILLISECOND, millisecond);
    SetSlot(this, MICROSECOND, microsecond);
    SetSlot(this, NANOSECOND, nanosecond);
    SetSlot(this, CALENDAR, calendar);

    if (typeof __debug__ !== 'undefined' && __debug__) {
      Object.defineProperty(this, '_repr_', {
        value: `${this[Symbol.toStringTag]} <${this}>`,
        writable: false,
        enumerable: false,
        configurable: false
      });
    }
  }
  get year() {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    return GetSlot(this, CALENDAR).year(this);
  }
  get month() {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    return GetSlot(this, CALENDAR).month(this);
  }
  get day() {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    return GetSlot(this, CALENDAR).day(this);
  }
  get hour() {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    return GetSlot(this, HOUR);
  }
  get minute() {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    return GetSlot(this, MINUTE);
  }
  get second() {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    return GetSlot(this, SECOND);
  }
  get millisecond() {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    return GetSlot(this, MILLISECOND);
  }
  get microsecond() {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    return GetSlot(this, MICROSECOND);
  }
  get nanosecond() {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    return GetSlot(this, NANOSECOND);
  }
  get calendar() {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    return GetSlot(this, CALENDAR);
  }
  get era() {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    return GetSlot(this, CALENDAR).era(this);
  }
  get dayOfWeek() {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    return GetSlot(this, CALENDAR).dayOfWeek(this);
  }
  get dayOfYear() {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    return GetSlot(this, CALENDAR).dayOfYear(this);
  }
  get weekOfYear() {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    return GetSlot(this, CALENDAR).weekOfYear(this);
  }
  get daysInWeek() {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    return GetSlot(this, CALENDAR).daysInWeek(this);
  }
  get daysInYear() {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    return GetSlot(this, CALENDAR).daysInYear(this);
  }
  get daysInMonth() {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    return GetSlot(this, CALENDAR).daysInMonth(this);
  }
  get monthsInYear() {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    return GetSlot(this, CALENDAR).monthsInYear(this);
  }
  get isLeapYear() {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    return GetSlot(this, CALENDAR).isLeapYear(this);
  }
  with(temporalDateTimeLike, options) {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    const overflow = ES.ToTemporalOverflow(options);
    let source;
    let calendar = temporalDateTimeLike.calendar;
    if (calendar) {
      const TemporalCalendar = GetIntrinsic('%Temporal.Calendar%');
      calendar = TemporalCalendar.from(calendar);
      source = new DateTime(
        GetSlot(this, ISO_YEAR),
        GetSlot(this, ISO_MONTH),
        GetSlot(this, ISO_DAY),
        GetSlot(this, HOUR),
        GetSlot(this, MINUTE),
        GetSlot(this, SECOND),
        GetSlot(this, MILLISECOND),
        GetSlot(this, MICROSECOND),
        GetSlot(this, NANOSECOND),
        calendar
      );
    } else {
      calendar = GetSlot(this, CALENDAR);
      source = this;
    }
    const props = ES.ToPartialRecord(temporalDateTimeLike, [
      'day',
      'era',
      'hour',
      'microsecond',
      'millisecond',
      'minute',
      'month',
      'nanosecond',
      'second',
      'year'
    ]);
    if (!props) {
      throw new RangeError('invalid date-time-like');
    }
    const fields = ES.ToTemporalDateTimeRecord(source);
    ObjectAssign(fields, props);
    const date = calendar.dateFromFields(fields, options, GetIntrinsic('%Temporal.Date%'));
    let year = GetSlot(date, ISO_YEAR);
    let month = GetSlot(date, ISO_MONTH);
    let day = GetSlot(date, ISO_DAY);
    let { hour, minute, second, millisecond, microsecond, nanosecond } = fields;
    ({ hour, minute, second, millisecond, microsecond, nanosecond } = ES.RegulateTime(
      hour,
      minute,
      second,
      millisecond,
      microsecond,
      nanosecond,
      overflow
    ));
    const Construct = ES.SpeciesConstructor(this, DateTime);
    const result = new Construct(
      year,
      month,
      day,
      hour,
      minute,
      second,
      millisecond,
      microsecond,
      nanosecond,
      calendar
    );
    if (!ES.IsTemporalDateTime(result)) throw new TypeError('invalid result');
    return result;
  }
  withCalendar(calendar) {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    const TemporalCalendar = GetIntrinsic('%Temporal.Calendar%');
    calendar = TemporalCalendar.from(calendar);
    const Construct = ES.SpeciesConstructor(this, DateTime);
    const result = new Construct(
      GetSlot(this, ISO_YEAR),
      GetSlot(this, ISO_MONTH),
      GetSlot(this, ISO_DAY),
      GetSlot(this, HOUR),
      GetSlot(this, MINUTE),
      GetSlot(this, SECOND),
      GetSlot(this, MILLISECOND),
      GetSlot(this, MICROSECOND),
      GetSlot(this, NANOSECOND),
      calendar
    );
    if (!ES.IsTemporalDateTime(result)) throw new TypeError('invalid result');
    return result;
  }
  plus(temporalDurationLike, options) {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    let duration = ES.ToLimitedTemporalDuration(temporalDurationLike);
    let { years, months, weeks, days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds } = duration;
    ES.RejectDurationSign(years, months, weeks, days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds);
    // For a negative duration, BalanceDuration() subtracts from days to make
    // all other units positive, so it's not needed to switch on the sign below
    ({ days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds } = ES.BalanceDuration(
      days,
      hours,
      minutes,
      seconds,
      milliseconds,
      microseconds,
      nanoseconds,
      'days'
    ));
    duration = { years, months, weeks, days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds };

    // Add the time part
    let { hour, minute, second, millisecond, microsecond, nanosecond } = this;
    let deltaDays = 0;
    ({ deltaDays, hour, minute, second, millisecond, microsecond, nanosecond } = ES.AddTime(
      hour,
      minute,
      second,
      millisecond,
      microsecond,
      nanosecond,
      hours,
      minutes,
      seconds,
      milliseconds,
      microseconds,
      nanoseconds
    ));
    duration.days += deltaDays;

    // Delegate the date part addition to the calendar
    const calendar = GetSlot(this, CALENDAR);
    const TemporalDate = GetIntrinsic('%Temporal.Date%');
    const datePart = new TemporalDate(
      GetSlot(this, ISO_YEAR),
      GetSlot(this, ISO_MONTH),
      GetSlot(this, ISO_DAY),
      calendar
    );
    const addedDate = calendar.datePlus(datePart, duration, options, TemporalDate);
    let year = GetSlot(addedDate, ISO_YEAR);
    let month = GetSlot(addedDate, ISO_MONTH);
    let day = GetSlot(addedDate, ISO_DAY);

    const Construct = ES.SpeciesConstructor(this, DateTime);
    const result = new Construct(
      year,
      month,
      day,
      hour,
      minute,
      second,
      millisecond,
      microsecond,
      nanosecond,
      calendar
    );
    if (!ES.IsTemporalDateTime(result)) throw new TypeError('invalid result');
    return result;
  }
  minus(temporalDurationLike, options) {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    let duration = ES.ToLimitedTemporalDuration(temporalDurationLike);
    let { years, months, weeks, days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds } = duration;
    ES.RejectDurationSign(years, months, weeks, days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds);
    // For a negative duration, BalanceDuration() subtracts from days to make
    // all other units positive, so it's not needed to switch on the sign below
    ({ days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds } = ES.BalanceDuration(
      days,
      hours,
      minutes,
      seconds,
      milliseconds,
      microseconds,
      nanoseconds,
      'days'
    ));
    duration = { years, months, weeks, days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds };

    // Subtract the time part
    let { hour, minute, second, millisecond, microsecond, nanosecond } = this;
    let deltaDays = 0;
    ({ deltaDays, hour, minute, second, millisecond, microsecond, nanosecond } = ES.SubtractTime(
      hour,
      minute,
      second,
      millisecond,
      microsecond,
      nanosecond,
      hours,
      minutes,
      seconds,
      milliseconds,
      microseconds,
      nanoseconds
    ));
    duration.days -= deltaDays;

    // Delegate the date part subtraction to the calendar
    const calendar = GetSlot(this, CALENDAR);
    const TemporalDate = GetIntrinsic('%Temporal.Date%');
    const datePart = new TemporalDate(
      GetSlot(this, ISO_YEAR),
      GetSlot(this, ISO_MONTH),
      GetSlot(this, ISO_DAY),
      calendar
    );
    const subtractedDate = calendar.dateMinus(datePart, duration, options, TemporalDate);
    let year = GetSlot(subtractedDate, ISO_YEAR);
    let month = GetSlot(subtractedDate, ISO_MONTH);
    let day = GetSlot(subtractedDate, ISO_DAY);

    const Construct = ES.SpeciesConstructor(this, DateTime);
    const result = new Construct(
      year,
      month,
      day,
      hour,
      minute,
      second,
      millisecond,
      microsecond,
      nanosecond,
      calendar
    );
    if (!ES.IsTemporalDateTime(result)) throw new TypeError('invalid result');
    return result;
  }
  difference(other, options) {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    if (!ES.IsTemporalDateTime(other)) throw new TypeError('invalid DateTime object');
    const calendar = GetSlot(this, CALENDAR);
    const otherCalendar = GetSlot(other, CALENDAR);
    if (calendar.id !== otherCalendar.id) {
      throw new RangeError(
        `cannot compute difference between dates of ${calendar.id} and ${otherCalendar.id} calendars`
      );
    }
    const smallestUnit = ES.ToSmallestTemporalDurationUnit(options, 'nanoseconds');
    let defaultLargestUnit = 'days';
    if (smallestUnit === 'years' || smallestUnit === 'months' || smallestUnit === 'weeks') {
      defaultLargestUnit = smallestUnit;
    }
    const largestUnit = ES.ToLargestTemporalUnit(options, defaultLargestUnit);
    ES.ValidateTemporalDifferenceUnits(largestUnit, smallestUnit);
    const roundingMode = ES.ToTemporalRoundingMode(options);
    const maximumIncrements = {
      years: undefined,
      months: undefined,
      weeks: undefined,
      days: undefined,
      hours: 24,
      minutes: 60,
      seconds: 60,
      milliseconds: 1000,
      microseconds: 1000,
      nanoseconds: 1000
    };
    const roundingIncrement = ES.ToTemporalRoundingIncrement(options, maximumIncrements[smallestUnit], false);

    let { deltaDays, hours, minutes, seconds, milliseconds, microseconds, nanoseconds } = ES.DifferenceTime(
      GetSlot(other, HOUR),
      GetSlot(other, MINUTE),
      GetSlot(other, SECOND),
      GetSlot(other, MILLISECOND),
      GetSlot(other, MICROSECOND),
      GetSlot(other, NANOSECOND),
      GetSlot(this, HOUR),
      GetSlot(this, MINUTE),
      GetSlot(this, SECOND),
      GetSlot(this, MILLISECOND),
      GetSlot(this, MICROSECOND),
      GetSlot(this, NANOSECOND)
    );
    let year = GetSlot(this, ISO_YEAR);
    let month = GetSlot(this, ISO_MONTH);
    let day = GetSlot(this, ISO_DAY) + deltaDays;
    ({ year, month, day } = ES.BalanceDate(year, month, day));

    const TemporalDate = GetIntrinsic('%Temporal.Date%');
    const adjustedDate = new TemporalDate(year, month, day, calendar);
    const otherDate = new TemporalDate(
      GetSlot(other, ISO_YEAR),
      GetSlot(other, ISO_MONTH),
      GetSlot(other, ISO_DAY),
      calendar
    );
    let dateLargestUnit = 'days';
    if (largestUnit === 'years' || largestUnit === 'months' || largestUnit === 'weeks') {
      dateLargestUnit = largestUnit;
    }
    const dateOptions = ObjectAssign({}, options, { largestUnit: dateLargestUnit });
    const dateDifference = calendar.dateDifference(otherDate, adjustedDate, dateOptions);

    let { years, months, weeks, days } = dateDifference;
    ({
      years,
      months,
      weeks,
      days,
      hours,
      minutes,
      seconds,
      milliseconds,
      microseconds,
      nanoseconds
    } = ES.RoundDuration(
      years,
      months,
      weeks,
      days,
      hours,
      minutes,
      seconds,
      milliseconds,
      microseconds,
      nanoseconds,
      roundingIncrement,
      smallestUnit,
      roundingMode,
      this
    ));
    ({ days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds } = ES.BalanceDuration(
      days,
      hours,
      minutes,
      seconds,
      milliseconds,
      microseconds,
      nanoseconds,
      largestUnit
    ));

    const Duration = GetIntrinsic('%Temporal.Duration%');
    return new Duration(years, months, weeks, days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds);
  }
  round(options) {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    if (options === undefined) throw new TypeError('options parameter is required');
    const smallestUnit = ES.ToSmallestTemporalUnit(options);
    const roundingMode = ES.ToTemporalRoundingMode(options);
    const maximumIncrements = {
      day: 1,
      hour: 24,
      minute: 60,
      second: 60,
      millisecond: 1000,
      microsecond: 1000,
      nanosecond: 1000
    };
    const roundingIncrement = ES.ToTemporalRoundingIncrement(options, maximumIncrements[smallestUnit], false);

    let year = GetSlot(this, ISO_YEAR);
    let month = GetSlot(this, ISO_MONTH);
    let day = GetSlot(this, ISO_DAY);
    let hour = GetSlot(this, HOUR);
    let minute = GetSlot(this, MINUTE);
    let second = GetSlot(this, SECOND);
    let millisecond = GetSlot(this, MILLISECOND);
    let microsecond = GetSlot(this, MICROSECOND);
    let nanosecond = GetSlot(this, NANOSECOND);
    let deltaDays = 0;
    ({ deltaDays, hour, minute, second, millisecond, microsecond, nanosecond } = ES.RoundTime(
      hour,
      minute,
      second,
      millisecond,
      microsecond,
      nanosecond,
      roundingIncrement,
      smallestUnit,
      roundingMode
    ));
    ({ year, month, day } = ES.BalanceDate(year, month, day + deltaDays));

    const Construct = ES.SpeciesConstructor(this, DateTime);
    const result = new Construct(
      year,
      month,
      day,
      hour,
      minute,
      second,
      millisecond,
      microsecond,
      nanosecond,
      GetSlot(this, CALENDAR)
    );
    if (!ES.IsTemporalDateTime(result)) throw new TypeError('invalid result');
    return result;
  }
  equals(other) {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    if (!ES.IsTemporalDateTime(other)) throw new TypeError('invalid Date object');
    for (const slot of [ISO_YEAR, ISO_MONTH, ISO_DAY, HOUR, MINUTE, SECOND, MILLISECOND, MICROSECOND, NANOSECOND]) {
      const val1 = GetSlot(this, slot);
      const val2 = GetSlot(other, slot);
      if (val1 !== val2) return false;
    }
    return GetSlot(this, CALENDAR).id === GetSlot(other, CALENDAR).id;
  }
  toString() {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    let year = ES.ISOYearString(GetSlot(this, ISO_YEAR));
    let month = ES.ISODateTimePartString(GetSlot(this, ISO_MONTH));
    let day = ES.ISODateTimePartString(GetSlot(this, ISO_DAY));
    let hour = ES.ISODateTimePartString(GetSlot(this, HOUR));
    let minute = ES.ISODateTimePartString(GetSlot(this, MINUTE));
    let seconds = ES.FormatSecondsStringPart(
      GetSlot(this, SECOND),
      GetSlot(this, MILLISECOND),
      GetSlot(this, MICROSECOND),
      GetSlot(this, NANOSECOND)
    );
    const calendar = ES.FormatCalendarAnnotation(GetSlot(this, CALENDAR));
    let resultString = `${year}-${month}-${day}T${hour}:${minute}${seconds}${calendar}`;
    return resultString;
  }
  toLocaleString(locales = undefined, options = undefined) {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    return new DateTimeFormat(locales, options).format(this);
  }
  valueOf() {
    throw new TypeError('use compare() or equals() to compare Temporal.DateTime');
  }

  toAbsolute(temporalTimeZoneLike, options) {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    const timeZone = ES.ToTemporalTimeZone(temporalTimeZoneLike);
    const disambiguation = ES.ToTemporalDisambiguation(options);
    return ES.GetTemporalAbsoluteFor(timeZone, this, disambiguation);
  }
  toDate() {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    return ES.TemporalDateTimeToDate(this);
  }
  toYearMonth() {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    const YearMonth = GetIntrinsic('%Temporal.YearMonth%');
    const calendar = GetSlot(this, CALENDAR);
    const fields = ES.ToTemporalDateTimeRecord(this);
    return calendar.yearMonthFromFields(fields, {}, YearMonth);
  }
  toMonthDay() {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    const MonthDay = GetIntrinsic('%Temporal.MonthDay%');
    const calendar = GetSlot(this, CALENDAR);
    const fields = ES.ToTemporalDateTimeRecord(this);
    return calendar.monthDayFromFields(fields, {}, MonthDay);
  }
  toTime() {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    return ES.TemporalDateTimeToTime(this);
  }
  getFields() {
    const fields = ES.ToTemporalDateTimeRecord(this);
    if (!fields) throw new TypeError('invalid receiver');
    fields.calendar = GetSlot(this, CALENDAR);
    return fields;
  }
  getISOFields() {
    if (!ES.IsTemporalDateTime(this)) throw new TypeError('invalid receiver');
    return {
      isoYear: GetSlot(this, ISO_YEAR),
      isoMonth: GetSlot(this, ISO_MONTH),
      isoDay: GetSlot(this, ISO_DAY),
      hour: GetSlot(this, HOUR),
      minute: GetSlot(this, MINUTE),
      second: GetSlot(this, SECOND),
      millisecond: GetSlot(this, MILLISECOND),
      microsecond: GetSlot(this, MICROSECOND),
      nanosecond: GetSlot(this, NANOSECOND),
      calendar: GetSlot(this, CALENDAR)
    };
  }

  static from(item, options = undefined) {
    const overflow = ES.ToTemporalOverflow(options);
    const TemporalCalendar = GetIntrinsic('%Temporal.Calendar%');
    let result;
    if (ES.Type(item) === 'Object') {
      if (ES.IsTemporalDateTime(item)) {
        const year = GetSlot(item, ISO_YEAR);
        const month = GetSlot(item, ISO_MONTH);
        const day = GetSlot(item, ISO_DAY);
        const hour = GetSlot(item, HOUR);
        const minute = GetSlot(item, MINUTE);
        const second = GetSlot(item, SECOND);
        const millisecond = GetSlot(item, MILLISECOND);
        const microsecond = GetSlot(item, MICROSECOND);
        const nanosecond = GetSlot(item, NANOSECOND);
        const calendar = GetSlot(item, CALENDAR);
        result = new this(year, month, day, hour, minute, second, millisecond, microsecond, nanosecond, calendar);
      } else {
        let calendar = item.calendar;
        if (calendar === undefined) calendar = GetDefaultCalendar();
        calendar = TemporalCalendar.from(calendar);
        const fields = ES.ToTemporalDateTimeRecord(item);
        const TemporalDate = GetIntrinsic('%Temporal.Date%');
        const date = calendar.dateFromFields(fields, options, TemporalDate);
        let year = GetSlot(date, ISO_YEAR);
        let month = GetSlot(date, ISO_MONTH);
        let day = GetSlot(date, ISO_DAY);

        if (overflow === 'constrain') {
          // Special case to determine if the date was clipped by dateFromFields
          // and therefore the time possibly needs to be clipped too
          try {
            calendar.dateFromFields(fields, { overflow: 'reject' }, TemporalDate);
          } catch {
            // Date was clipped
            if (year === 275760 && month === 9 && day === 13) {
              // Clipped at end of range
              day += 1;
            } else if (year === -271821 && month === 4 && day === 19) {
              // Clipped at beginning of range
              day -= 1;
            }
            ({ year, month, day } = ES.BalanceDate(year, month, day));
          }
        }

        let { hour, minute, second, millisecond, microsecond, nanosecond } = fields;
        ({ hour, minute, second, millisecond, microsecond, nanosecond } = ES.RegulateTime(
          hour,
          minute,
          second,
          millisecond,
          microsecond,
          nanosecond,
          overflow
        ));
        result = new this(year, month, day, hour, minute, second, millisecond, microsecond, nanosecond, calendar);
      }
    } else {
      let {
        year,
        month,
        day,
        hour,
        minute,
        second,
        millisecond,
        microsecond,
        nanosecond,
        calendar
      } = ES.ParseTemporalDateTimeString(ES.ToString(item));
      if (!calendar) calendar = GetDefaultCalendar();
      calendar = TemporalCalendar.from(calendar);
      result = new this(year, month, day, hour, minute, second, millisecond, microsecond, nanosecond, calendar);
    }
    if (!ES.IsTemporalDateTime(result)) throw new TypeError('invalid result');
    return result;
  }
  static compare(one, two) {
    if (!ES.IsTemporalDateTime(one) || !ES.IsTemporalDateTime(two)) throw new TypeError('invalid DateTime object');
    for (const slot of [ISO_YEAR, ISO_MONTH, ISO_DAY, HOUR, MINUTE, SECOND, MILLISECOND, MICROSECOND, NANOSECOND]) {
      const val1 = GetSlot(one, slot);
      const val2 = GetSlot(two, slot);
      if (val1 !== val2) return ES.ComparisonResult(val1 - val2);
    }
    const cal1 = GetSlot(one, CALENDAR).id;
    const cal2 = GetSlot(two, CALENDAR).id;
    return ES.ComparisonResult(cal1 < cal2 ? -1 : cal1 > cal2 ? 1 : 0);
  }
}
DateTime.prototype.toJSON = DateTime.prototype.toString;

MakeIntrinsicClass(DateTime, 'Temporal.DateTime');
