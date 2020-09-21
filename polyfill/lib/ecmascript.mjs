const IntlDateTimeFormat = globalThis.Intl.DateTimeFormat;
const MathAbs = Math.abs;
const MathCeil = Math.ceil;
const MathFloor = Math.floor;
const MathSign = Math.sign;
const MathTrunc = Math.trunc;
const NumberIsNaN = Number.isNaN;
const ObjectAssign = Object.assign;
const ObjectCreate = Object.create;

import bigInt from 'big-integer';
import Call from 'es-abstract/2019/Call.js';
import SpeciesConstructor from 'es-abstract/2019/SpeciesConstructor.js';
import ToInteger from 'es-abstract/2019/ToInteger.js';
import ToNumber from 'es-abstract/2019/ToNumber.js';
import ToPrimitive from 'es-abstract/2019/ToPrimitive.js';
import ToString from 'es-abstract/2019/ToString.js';
import Type from 'es-abstract/2019/Type.js';

import { GetIntrinsic } from './intrinsicclass.mjs';
import {
  GetSlot,
  HasSlot,
  EPOCHNANOSECONDS,
  TIMEZONE_ID,
  CALENDAR_ID,
  ISO_YEAR,
  ISO_MONTH,
  ISO_DAY,
  HOUR,
  MINUTE,
  SECOND,
  MILLISECOND,
  MICROSECOND,
  NANOSECOND,
  REF_ISO_YEAR,
  REF_ISO_DAY,
  CALENDAR,
  YEARS,
  MONTHS,
  WEEKS,
  DAYS,
  HOURS,
  MINUTES,
  SECONDS,
  MILLISECONDS,
  MICROSECONDS,
  NANOSECONDS
} from './slots.mjs';

const DAYMILLIS = 86400000;
const NS_MIN = bigInt(-86400).multiply(1e17);
const NS_MAX = bigInt(86400).multiply(1e17);
const YEAR_MIN = -271821;
const YEAR_MAX = 275760;
const BEFORE_FIRST_DST = bigInt(-388152).multiply(1e13); // 1847-01-01T00:00:00Z

import * as PARSE from './regex.mjs';

const ES2019 = {
  Call,
  SpeciesConstructor,
  ToInteger,
  ToNumber,
  ToPrimitive,
  ToString,
  Type
};

export const ES = ObjectAssign({}, ES2019, {
  IsTemporalAbsolute: (item) => HasSlot(item, EPOCHNANOSECONDS),
  IsTemporalTimeZone: (item) => HasSlot(item, TIMEZONE_ID),
  IsTemporalCalendar: (item) => HasSlot(item, CALENDAR_ID),
  IsTemporalDuration: (item) =>
    HasSlot(item, YEARS, MONTHS, DAYS, HOURS, MINUTES, SECONDS, MILLISECONDS, MICROSECONDS, NANOSECONDS),
  IsTemporalDate: (item) =>
    HasSlot(item, ISO_YEAR, ISO_MONTH, ISO_DAY) &&
    !HasSlot(item, HOUR, MINUTE, SECOND, MILLISECOND, MICROSECOND, NANOSECOND),
  IsTemporalTime: (item) =>
    HasSlot(item, HOUR, MINUTE, SECOND, MILLISECOND, MICROSECOND, NANOSECOND) &&
    !HasSlot(item, ISO_YEAR, ISO_MONTH, ISO_DAY),
  IsTemporalDateTime: (item) =>
    HasSlot(item, ISO_YEAR, ISO_MONTH, ISO_DAY, HOUR, MINUTE, SECOND, MILLISECOND, MICROSECOND, NANOSECOND),
  IsTemporalYearMonth: (item) => HasSlot(item, ISO_YEAR, ISO_MONTH, REF_ISO_DAY),
  IsTemporalMonthDay: (item) => HasSlot(item, ISO_MONTH, ISO_DAY, REF_ISO_YEAR),
  TemporalTimeZoneFromString: (stringIdent) => {
    const { zone, ianaName, offset } = ES.ParseTemporalTimeZoneString(stringIdent);
    const result = ES.GetCanonicalTimeZoneIdentifier(zone);
    if (offset && ianaName) {
      const ns = ES.ParseTemporalAbsolute(stringIdent);
      const offsetNs = ES.GetIANATimeZoneOffsetNanoseconds(ns, result);
      if (ES.FormatTimeZoneOffsetString(offsetNs) !== offset) {
        throw new RangeError(`invalid offset ${offset}[${ianaName}]`);
      }
    }
    return result;
  },
  FormatCalendarAnnotation: (calendar) => {
    if (calendar.id === 'iso8601') return '';
    return `[c=${calendar.id}]`;
  },
  ParseISODateTime: (isoString, { zoneRequired }) => {
    const regex = zoneRequired ? PARSE.absolute : PARSE.datetime;
    const match = regex.exec(isoString);
    if (!match) throw new RangeError(`invalid ISO 8601 string: ${isoString}`);
    let yearString = match[1];
    if (yearString[0] === '\u2212') yearString = `-${yearString.slice(1)}`;
    const year = ES.ToInteger(yearString);
    const month = ES.ToInteger(match[2] || match[4]);
    const day = ES.ToInteger(match[3] || match[5]);
    const hour = ES.ToInteger(match[6]);
    const minute = ES.ToInteger(match[7] || match[10]);
    let second = ES.ToInteger(match[8] || match[11]);
    if (second === 60) second = 59;
    const fraction = (match[9] || match[12]) + '000000000';
    const millisecond = ES.ToInteger(fraction.slice(0, 3));
    const microsecond = ES.ToInteger(fraction.slice(3, 6));
    const nanosecond = ES.ToInteger(fraction.slice(6, 9));
    /* TODO:
      1. If _month_ &lt; 1 or _month_ &gt; 12, then
        1. Throw a *RangeError* exception.
      1. Let _maxDay_ be ! DaysInMonth(_year_, _month_).
      1. If _day_ &lt; 1 or _day_ &gt; _maxDay_, then
        1. Throw a *RangeError* exception.
      1. If ! ValidateTime(_hour_, _minute_, _second_, _millisecond_, _microsecond_, _nanosecond_) is *false*, then
        1. Throw a *RangeError* exception.
    */
    const offsetSign = match[14] === '-' || match[14] === '\u2212' ? '-' : '+';
    const offset = `${offsetSign}${match[15] || '00'}:${match[16] || '00'}`;
    let ianaName = match[17];
    if (ianaName) {
      try {
        // Canonicalize name if it is an IANA link name or is capitalized wrong
        ianaName = ES.GetCanonicalTimeZoneIdentifier(ianaName).toString();
      } catch {
        // Not an IANA name, may be a custom ID, pass through unchanged
      }
    }
    const zone = match[13] ? 'UTC' : ianaName || offset;
    const calendar = match[18] || null;
    return {
      year,
      month,
      day,
      hour,
      minute,
      second,
      millisecond,
      microsecond,
      nanosecond,
      zone,
      ianaName,
      offset,
      calendar
    };
  },
  ParseTemporalAbsoluteString: (isoString) => {
    return ES.ParseISODateTime(isoString, { zoneRequired: true });
  },
  ParseTemporalDateTimeString: (isoString) => {
    return ES.ParseISODateTime(isoString, { zoneRequired: false });
  },
  ParseTemporalDateString: (isoString) => {
    return ES.ParseISODateTime(isoString, { zoneRequired: false });
  },
  ParseTemporalTimeString: (isoString) => {
    const match = PARSE.time.exec(isoString);
    let hour, minute, second, millisecond, microsecond, nanosecond;
    if (match) {
      hour = ES.ToInteger(match[1]);
      minute = ES.ToInteger(match[2] || match[5]);
      second = ES.ToInteger(match[3] || match[6]);
      if (second === 60) second = 59;
      const fraction = (match[4] || match[7]) + '000000000';
      millisecond = ES.ToInteger(fraction.slice(0, 3));
      microsecond = ES.ToInteger(fraction.slice(3, 6));
      nanosecond = ES.ToInteger(fraction.slice(6, 9));
    } else {
      ({ hour, minute, second, millisecond, microsecond, nanosecond } = ES.ParseISODateTime(isoString, {
        zoneRequired: false
      }));
    }
    return { hour, minute, second, millisecond, microsecond, nanosecond };
  },
  ParseTemporalYearMonthString: (isoString) => {
    const match = PARSE.yearmonth.exec(isoString);
    let year, month, calendar, refISODay;
    if (match) {
      let yearString = match[1];
      if (yearString[0] === '\u2212') yearString = `-${yearString.slice(1)}`;
      year = ES.ToInteger(yearString);
      month = ES.ToInteger(match[2]);
      calendar = match[3] || null;
    } else {
      ({ year, month, calendar, day: refISODay } = ES.ParseISODateTime(isoString, { zoneRequired: false }));
      // XXX: Why?
      if (!calendar) refISODay = undefined;
    }
    return { year, month, calendar, refISODay };
  },
  ParseTemporalMonthDayString: (isoString) => {
    const match = PARSE.monthday.exec(isoString);
    let month, day, calendar, refISOYear;
    if (match) {
      month = ES.ToInteger(match[1]);
      day = ES.ToInteger(match[2]);
    } else {
      ({ month, day, calendar, year: refISOYear } = ES.ParseISODateTime(isoString, { zoneRequired: false }));
      if (!calendar) refISOYear = undefined;
    }
    return { month, day, calendar, refISOYear };
  },
  ParseTemporalTimeZoneString: (stringIdent) => {
    try {
      const canonicalIdent = ES.GetCanonicalTimeZoneIdentifier(stringIdent);
      if (canonicalIdent) return { zone: canonicalIdent.toString() };
    } catch {
      // fall through
    }
    try {
      // Try parsing ISO string instead
      return ES.ParseISODateTime(stringIdent, { zoneRequired: true });
    } catch {
      throw new RangeError(`Invalid time zone: ${stringIdent}`);
    }
  },
  ParseTemporalDurationString: (isoString) => {
    const match = PARSE.duration.exec(isoString);
    if (!match) throw new RangeError(`invalid duration: ${isoString}`);
    if (match.slice(2).every((element) => element === undefined)) {
      throw new RangeError(`invalid duration: ${isoString}`);
    }
    const sign = match[1] === '-' || match[1] === '\u2212' ? -1 : 1;
    const years = ES.ToInteger(match[2]) * sign;
    const months = ES.ToInteger(match[3]) * sign;
    const weeks = ES.ToInteger(match[4]) * sign;
    const days = ES.ToInteger(match[5]) * sign;
    const hours = ES.ToInteger(match[6]) * sign;
    const minutes = ES.ToInteger(match[7]) * sign;
    const seconds = ES.ToInteger(match[8]) * sign;
    const fraction = match[9] + '000000000';
    const milliseconds = ES.ToInteger(fraction.slice(0, 3)) * sign;
    const microseconds = ES.ToInteger(fraction.slice(3, 6)) * sign;
    const nanoseconds = ES.ToInteger(fraction.slice(6, 9)) * sign;
    return { years, months, weeks, days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds };
  },
  ParseTemporalAbsolute: (isoString) => {
    const {
      year,
      month,
      day,
      hour,
      minute,
      second,
      millisecond,
      microsecond,
      nanosecond,
      offset,
      zone
    } = ES.ParseTemporalAbsoluteString(isoString);

    const DateTime = GetIntrinsic('%Temporal.DateTime%');

    const dt = new DateTime(year, month, day, hour, minute, second, millisecond, microsecond, nanosecond);
    const tz = ES.TimeZoneFrom(zone);

    const possibleAbsolutes = tz.getPossibleAbsolutesFor(dt);
    if (possibleAbsolutes.length === 1) return GetSlot(possibleAbsolutes[0], EPOCHNANOSECONDS);
    for (const absolute of possibleAbsolutes) {
      const possibleOffsetNs = tz.getOffsetNanosecondsFor(absolute);
      if (ES.FormatTimeZoneOffsetString(possibleOffsetNs) === offset) return GetSlot(absolute, EPOCHNANOSECONDS);
    }
    throw new RangeError(`'${isoString}' doesn't uniquely identify a Temporal.Absolute`);
  },
  RegulateDateTime: (year, month, day, hour, minute, second, millisecond, microsecond, nanosecond, overflow) => {
    switch (overflow) {
      case 'reject':
        ES.RejectDateTime(year, month, day, hour, minute, second, millisecond, microsecond, nanosecond);
        break;
      case 'constrain':
        ({ year, month, day, hour, minute, second, millisecond, microsecond, nanosecond } = ES.ConstrainDateTime(
          year,
          month,
          day,
          hour,
          minute,
          second,
          millisecond,
          microsecond,
          nanosecond
        ));
        break;
    }
    return { year, month, day, hour, minute, second, millisecond, microsecond, nanosecond };
  },
  RegulateDate: (year, month, day, overflow) => {
    switch (overflow) {
      case 'reject':
        ES.RejectDate(year, month, day);
        break;
      case 'constrain':
        ({ year, month, day } = ES.ConstrainDate(year, month, day));
        break;
    }
    return { year, month, day };
  },
  RegulateTime: (hour, minute, second, millisecond, microsecond, nanosecond, overflow) => {
    switch (overflow) {
      case 'reject':
        ES.RejectTime(hour, minute, second, millisecond, microsecond, nanosecond);
        break;
      case 'constrain':
        ({ hour, minute, second, millisecond, microsecond, nanosecond } = ES.ConstrainTime(
          hour,
          minute,
          second,
          millisecond,
          microsecond,
          nanosecond
        ));
        break;
    }
    return { hour, minute, second, millisecond, microsecond, nanosecond };
  },
  RegulateYearMonth: (year, month, overflow) => {
    const refISODay = 1;
    switch (overflow) {
      case 'reject':
        ES.RejectDate(year, month, refISODay);
        break;
      case 'constrain':
        ({ year, month } = ES.ConstrainDate(year, month));
        break;
    }
    return { year, month };
  },
  RegulateMonthDay: (month, day, overflow) => {
    const refISOYear = 1972;
    switch (overflow) {
      case 'reject':
        ES.RejectDate(refISOYear, month, day);
        break;
      case 'constrain':
        ({ month, day } = ES.ConstrainDate(refISOYear, month, day));
        break;
    }
    return { month, day };
  },
  ToTemporalDurationRecord: (item) => {
    if (ES.IsTemporalDuration(item)) {
      return {
        years: GetSlot(item, YEARS),
        months: GetSlot(item, MONTHS),
        weeks: GetSlot(item, WEEKS),
        days: GetSlot(item, DAYS),
        hours: GetSlot(item, HOURS),
        minutes: GetSlot(item, MINUTES),
        seconds: GetSlot(item, SECONDS),
        milliseconds: GetSlot(item, MILLISECONDS),
        microseconds: GetSlot(item, MICROSECONDS),
        nanoseconds: GetSlot(item, NANOSECONDS)
      };
    }
    return ES.ToRecord(item, [
      ['days', 0],
      ['hours', 0],
      ['microseconds', 0],
      ['milliseconds', 0],
      ['minutes', 0],
      ['months', 0],
      ['nanoseconds', 0],
      ['seconds', 0],
      ['weeks', 0],
      ['years', 0]
    ]);
  },
  RegulateDuration: (
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
    overflow
  ) => {
    for (const prop of [years, months, weeks, days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds]) {
      if (!Number.isFinite(prop)) throw new RangeError('infinite values not allowed as duration fields');
    }
    ES.RejectDurationSign(years, months, weeks, days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds);
    if (overflow === 'balance') {
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
      for (const prop of [
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
      ]) {
        if (!Number.isFinite(prop)) throw new RangeError('infinite values not allowed as duration fields');
      }
    }

    return { years, months, weeks, days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds };
  },
  ToLimitedTemporalDuration: (item, disallowedProperties = []) => {
    if (typeof item !== 'object' || item === null) {
      throw new TypeError('Unexpected type for duration');
    }
    const {
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
    } = ES.ToTemporalDurationRecord(item);
    const duration = ES.RegulateDuration(
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
      'reject'
    );
    for (const property of disallowedProperties) {
      if (duration[property] !== 0) {
        throw new RangeError(`invalid duration field ${property}`);
      }
    }
    return duration;
  },
  ToTemporalDurationOverflow: (options) => {
    options = ES.NormalizeOptionsObject(options);
    return ES.GetOption(options, 'overflow', ['constrain', 'balance'], 'constrain');
  },
  ToTemporalOverflow: (options) => {
    options = ES.NormalizeOptionsObject(options);
    return ES.GetOption(options, 'overflow', ['constrain', 'reject'], 'constrain');
  },
  ToTemporalDisambiguation: (options) => {
    options = ES.NormalizeOptionsObject(options);
    return ES.GetOption(options, 'disambiguation', ['compatible', 'earlier', 'later', 'reject'], 'compatible');
  },
  ToTemporalRoundingMode: (options) => {
    options = ES.NormalizeOptionsObject(options);
    return ES.GetOption(options, 'roundingMode', ['ceil', 'floor', 'trunc', 'nearest'], 'nearest');
  },
  ToTemporalRoundingIncrement: (options, dividend, inclusive) => {
    options = ES.NormalizeOptionsObject(options);
    let maximum = Infinity;
    if (dividend !== undefined) maximum = dividend;
    if (!inclusive && dividend !== undefined) maximum = dividend > 1 ? dividend - 1 : 1;
    const increment = ES.GetNumberOption(options, 'roundingIncrement', 1, maximum, 1);
    if (dividend !== undefined && dividend % increment !== 0) {
      throw new RangeError(`Rounding increment must divide evenly into ${dividend}`);
    }
    return increment;
  },
  ToLargestTemporalUnit: (options, fallback, disallowedStrings = []) => {
    const allowed = new Set([
      'years',
      'months',
      'weeks',
      'days',
      'hours',
      'minutes',
      'seconds',
      'milliseconds',
      'microseconds',
      'nanoseconds'
    ]);
    for (const s of disallowedStrings) {
      allowed.delete(s);
    }
    options = ES.NormalizeOptionsObject(options);
    return ES.GetOption(options, 'largestUnit', [...allowed], fallback);
  },
  ToSmallestTemporalUnit: (options, disallowedStrings = []) => {
    const singular = new Map([
      ['days', 'day'],
      ['hours', 'hour'],
      ['minutes', 'minute'],
      ['seconds', 'second'],
      ['milliseconds', 'millisecond'],
      ['microseconds', 'microsecond'],
      ['nanoseconds', 'nanosecond']
    ]);
    const allowed = new Set(['day', 'hour', 'minute', 'second', 'millisecond', 'microsecond', 'nanosecond']);
    for (const s of disallowedStrings) {
      allowed.delete(s);
    }
    const allowedValues = [...allowed];
    options = ES.NormalizeOptionsObject(options);
    let value = options.smallestUnit;
    if (value === undefined) throw new RangeError('smallestUnit option is required');
    value = ES.ToString(value);
    if (singular.has(value)) value = singular.get(value);
    if (!allowedValues.includes(value)) {
      throw new RangeError(`smallestUnit must be one of ${allowedValues.join(', ')}, not ${value}`);
    }
    return value;
  },
  ToSmallestTemporalDurationUnit: (options, fallback, disallowedStrings = []) => {
    const plural = new Map([
      ['year', 'years'],
      ['month', 'months'],
      ['week', 'weeks'],
      ['day', 'days'],
      ['hour', 'hours'],
      ['minute', 'minutes'],
      ['second', 'seconds'],
      ['millisecond', 'milliseconds'],
      ['microsecond', 'microseconds'],
      ['nanosecond', 'nanoseconds']
    ]);
    const allowed = new Set([
      'years',
      'months',
      'weeks',
      'days',
      'hours',
      'minutes',
      'seconds',
      'milliseconds',
      'microseconds',
      'nanoseconds'
    ]);
    for (const s of disallowedStrings) {
      allowed.delete(s);
    }
    const allowedValues = [...allowed];
    options = ES.NormalizeOptionsObject(options);
    let value = options.smallestUnit;
    if (value === undefined) return fallback;
    value = ES.ToString(value);
    if (plural.has(value)) value = plural.get(value);
    if (!allowedValues.includes(value)) {
      throw new RangeError(`smallestUnit must be one of ${allowedValues.join(', ')}, not ${value}`);
    }
    return value;
  },
  ValidateTemporalDifferenceUnits: (largestUnit, smallestUnit) => {
    const validUnits = [
      'years',
      'months',
      'weeks',
      'days',
      'hours',
      'minutes',
      'seconds',
      'milliseconds',
      'microseconds',
      'nanoseconds'
    ];
    if (validUnits.indexOf(largestUnit) > validUnits.indexOf(smallestUnit)) {
      throw new RangeError(`largestUnit ${largestUnit} cannot be smaller than smallestUnit ${smallestUnit}`);
    }
  },
  ToPartialRecord: (bag, fields) => {
    if (ES.Type(bag) !== 'Object') return false;
    let any;
    for (const property of fields) {
      const value = bag[property];
      if (value !== undefined) {
        any = any || {};
        if (property === 'calendar') {
          // FIXME: this is terrible
          any.calendar = ES.ToTemporalCalendar(value);
        } else if (property === 'era') {
          any.era = value;
        } else {
          any[property] = ES.ToInteger(value);
        }
      }
    }
    return any ? any : false;
  },
  ToRecord: (bag, fields) => {
    if (ES.Type(bag) !== 'Object') return false;
    const result = {};
    for (const fieldRecord of fields) {
      const [property, defaultValue] = fieldRecord;
      let value = bag[property];
      if (value === undefined) {
        if (fieldRecord.length === 1) {
          throw new TypeError(`required property '${property}' missing or undefined`);
        }
        value = defaultValue;
      }
      if (property === 'calendar') {
        // FIXME: this is terrible
        result.calendar = ES.ToTemporalCalendar(value);
      } else if (property === 'era') {
        result.era = ES.ToString(value);
      } else {
        result[property] = ES.ToInteger(value);
      }
    }
    return result;
  },
  // field access in the following operations is intentionally alphabetical
  ToTemporalDateRecord: (bag) => {
    // XXX Verify calendar is expected everywhere
    return ES.ToRecord(bag, [['calendar'], ['day'], ['era', undefined], ['month'], ['year']]);
  },
  ToTemporalDateTimeRecord: (bag) => {
    return ES.ToRecord(bag, [
      ['day'],
      ['era', undefined],
      ['hour', 0],
      ['microsecond', 0],
      ['millisecond', 0],
      ['minute', 0],
      ['month'],
      ['nanosecond', 0],
      ['second', 0],
      ['year']
    ]);
  },
  ToTemporalMonthDayRecord: (bag) => {
    return ES.ToRecord(bag, [['day'], ['month']]);
  },
  ToTemporalTimeRecord: (bag) => {
    return ES.ToRecord(bag, [
      ['hour', 0],
      ['microsecond', 0],
      ['millisecond', 0],
      ['minute', 0],
      ['nanosecond', 0],
      ['second', 0]
    ]);
  },
  ToTemporalYearMonthRecord: (bag) => {
    return ES.ToRecord(bag, [['era', undefined], ['month'], ['year']]);
  },
  CalendarFrom: (calendarLike) => {
    const TemporalCalendar = GetIntrinsic('%Temporal.Calendar%');
    let from = TemporalCalendar.from;
    if (from === undefined) {
      from = GetIntrinsic('%Temporal.Calendar.from%');
    }
    const calendar = ES.Call(from, TemporalCalendar, [calendarLike]);
    if (ES.Type(calendar) !== 'Object') {
      throw new TypeError('Temporal.Calendar.from should return an object');
    }
    return calendar;
  },
  ToTemporalCalendar: (calendarLike) => {
    if (ES.Type(calendarLike) === 'Object') {
      return calendarLike;
    }
    const identifier = ES.ToString(calendarLike);
    return ES.CalendarFrom(identifier);
  },
  CalendarToString: (calendar) => {
    let toString = calendar.toString;
    if (toString === undefined) {
      toString = GetIntrinsic('%Temporal.Calendar.prototype.toString%');
    }
    return ES.ToString(ES.Call(toString, calendar));
  },
  TimeZoneFrom: (temporalTimeZoneLike) => {
    const TemporalTimeZone = GetIntrinsic('%Temporal.TimeZone%');
    let from = TemporalTimeZone.from;
    if (from === undefined) {
      from = GetIntrinsic('%Temporal.TimeZone.from%');
    }
    return ES.Call(from, TemporalTimeZone, [temporalTimeZoneLike]);
  },
  ToTemporalTimeZone: (temporalTimeZoneLike) => {
    if (typeof temporalTimeZoneLike === 'object' && temporalTimeZoneLike) {
      return temporalTimeZoneLike;
    }
    const identifier = ES.ToString(temporalTimeZoneLike);
    return ES.TimeZoneFrom(identifier);
  },
  TemporalDateTimeToDate: (dateTime) => {
    const Date = GetIntrinsic('%Temporal.Date%');
    return new Date(
      GetSlot(dateTime, ISO_YEAR),
      GetSlot(dateTime, ISO_MONTH),
      GetSlot(dateTime, ISO_DAY),
      GetSlot(dateTime, CALENDAR)
    );
  },
  TemporalDateTimeToTime: (dateTime) => {
    const Time = GetIntrinsic('%Temporal.Time%');
    return new Time(
      GetSlot(dateTime, HOUR),
      GetSlot(dateTime, MINUTE),
      GetSlot(dateTime, SECOND),
      GetSlot(dateTime, MILLISECOND),
      GetSlot(dateTime, MICROSECOND),
      GetSlot(dateTime, NANOSECOND)
    );
  },
  GetOffsetNanosecondsFor: (timeZone, absolute) => {
    let getOffsetNanosecondsFor = timeZone.getOffsetNanosecondsFor;
    if (getOffsetNanosecondsFor === undefined) {
      getOffsetNanosecondsFor = GetIntrinsic('%Temporal.TimeZone.prototype.getOffsetNanosecondsFor%');
    }
    const offsetNs = ES.Call(getOffsetNanosecondsFor, timeZone, [absolute]);
    if (typeof offsetNs !== 'number') {
      throw new TypeError('bad return from getOffsetNanosecondsFor');
    }
    if (!Number.isInteger(offsetNs) || Math.abs(offsetNs) > 86400e9) {
      throw new RangeError('out-of-range return from getOffsetNanosecondsFor');
    }
    return offsetNs;
  },
  GetOffsetStringFor: (timeZone, absolute) => {
    let getOffsetStringFor = timeZone.getOffsetStringFor;
    if (getOffsetStringFor === undefined) {
      getOffsetStringFor = GetIntrinsic('%Temporal.TimeZone.prototype.getOffsetStringFor%');
    }
    return ES.ToString(ES.Call(getOffsetStringFor, timeZone, [absolute]));
  },
  GetTemporalDateTimeFor: (timeZone, absolute, calendar) => {
    let getDateTimeFor = timeZone.getDateTimeFor;
    if (getDateTimeFor === undefined) {
      getDateTimeFor = GetIntrinsic('%Temporal.TimeZone.prototype.getDateTimeFor%');
    }
    const dateTime = ES.Call(getDateTimeFor, timeZone, [absolute, calendar]);
    if (!ES.IsTemporalDateTime(dateTime)) {
      throw new TypeError('Unexpected result from getDateTimeFor');
    }
    return dateTime;
  },
  GetTemporalAbsoluteFor: (timeZone, dateTime, disambiguation) => {
    let getAbsoluteFor = timeZone.getAbsoluteFor;
    if (getAbsoluteFor === undefined) {
      getAbsoluteFor = GetIntrinsic('%Temporal.TimeZone.prototype.getAbsoluteFor%');
    }
    return ES.Call(getAbsoluteFor, timeZone, [dateTime, { disambiguation }]);
  },
  TimeZoneToString: (timeZone) => {
    let toString = timeZone.toString;
    if (toString === undefined) {
      toString = GetIntrinsic('%Temporal.TimeZone.prototype.toString%');
    }
    return ES.ToString(ES.Call(toString, timeZone));
  },
  ISOTimeZoneString: (timeZone, absolute) => {
    const name = ES.TimeZoneToString(timeZone);
    const offset = ES.GetOffsetStringFor(timeZone, absolute);

    if (name === 'UTC') {
      return 'Z';
    }

    if (name === offset) {
      return offset;
    }

    return `${offset}[${name}]`;
  },
  ISOYearString: (year) => {
    let yearString;
    if (year < 1000 || year > 9999) {
      let sign = year < 0 ? '-' : '+';
      let yearNumber = Math.abs(year);
      yearString = sign + `000000${yearNumber}`.slice(-6);
    } else {
      yearString = `${year}`;
    }
    return yearString;
  },
  ISODateTimePartString: (part) => `00${part}`.slice(-2),
  FormatSecondsStringPart: (seconds, millis, micros, nanos) => {
    if (!seconds && !millis && !micros && !nanos) return '';

    let parts = [];
    if (nanos) parts.unshift(`000${nanos || 0}`.slice(-3));
    if (micros || parts.length) parts.unshift(`000${micros || 0}`.slice(-3));
    if (millis || parts.length) parts.unshift(`000${millis || 0}`.slice(-3));
    let secs = `00${seconds}`.slice(-2);
    let post = parts.length ? `.${parts.join('')}` : '';
    return `:${secs}${post}`;
  },
  TemporalAbsoluteToString: (absolute, timeZone) => {
    const dateTime = ES.GetTemporalDateTimeFor(timeZone, absolute);
    const year = ES.ISOYearString(dateTime.year);
    const month = ES.ISODateTimePartString(dateTime.month);
    const day = ES.ISODateTimePartString(dateTime.day);
    const hour = ES.ISODateTimePartString(dateTime.hour);
    const minute = ES.ISODateTimePartString(dateTime.minute);
    const seconds = ES.FormatSecondsStringPart(
      dateTime.second,
      dateTime.millisecond,
      dateTime.microsecond,
      dateTime.nanosecond
    );
    const timeZoneString = ES.ISOTimeZoneString(timeZone, absolute);
    return `${year}-${month}-${day}T${hour}:${minute}${seconds}${timeZoneString}`;
  },
  TemporalDurationToString: (duration) => {
    function formatNumber(num) {
      if (num <= Number.MAX_SAFE_INTEGER) return num.toString(10);
      return bigInt(num).toString();
    }

    const years = GetSlot(duration, YEARS);
    const months = GetSlot(duration, MONTHS);
    const weeks = GetSlot(duration, WEEKS);
    const days = GetSlot(duration, DAYS);
    const hours = GetSlot(duration, HOURS);
    const minutes = GetSlot(duration, MINUTES);
    let seconds = GetSlot(duration, SECONDS);
    let ms = GetSlot(duration, MILLISECONDS);
    let µs = GetSlot(duration, MICROSECONDS);
    let ns = GetSlot(duration, NANOSECONDS);
    const sign = ES.DurationSign(years, months, weeks, days, hours, minutes, seconds, ms, µs, ns);

    const dateParts = [];
    if (years) dateParts.push(`${formatNumber(Math.abs(years))}Y`);
    if (months) dateParts.push(`${formatNumber(Math.abs(months))}M`);
    if (weeks) dateParts.push(`${formatNumber(Math.abs(weeks))}W`);
    if (days) dateParts.push(`${formatNumber(Math.abs(days))}D`);

    const timeParts = [];
    if (hours) timeParts.push(`${formatNumber(Math.abs(hours))}H`);
    if (minutes) timeParts.push(`${formatNumber(Math.abs(minutes))}M`);

    const secondParts = [];
    µs += Math.trunc(ns / 1000);
    ns %= 1000;
    ms += Math.trunc(µs / 1000);
    µs %= 1000;
    seconds += Math.trunc(ms / 1000);
    ms %= 1000;
    if (ns) secondParts.unshift(`${Math.abs(ns)}`.padStart(3, '0'));
    if (µs || secondParts.length) secondParts.unshift(`${Math.abs(µs)}`.padStart(3, '0'));
    if (ms || secondParts.length) secondParts.unshift(`${Math.abs(ms)}`.padStart(3, '0'));
    if (secondParts.length) secondParts.unshift('.');
    if (seconds || secondParts.length) secondParts.unshift(formatNumber(Math.abs(seconds)));
    if (secondParts.length) timeParts.push(`${secondParts.join('')}S`);
    if (timeParts.length) timeParts.unshift('T');
    if (!dateParts.length && !timeParts.length) return 'PT0S';
    return `${sign < 0 ? '-' : ''}P${dateParts.join('')}${timeParts.join('')}`;
  },

  GetCanonicalTimeZoneIdentifier: (timeZoneIdentifier) => {
    const offsetNs = parseOffsetString(timeZoneIdentifier);
    if (offsetNs !== null) return ES.FormatTimeZoneOffsetString(offsetNs);
    const formatter = new IntlDateTimeFormat('en-us', {
      timeZone: String(timeZoneIdentifier),
      hour12: false,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    });
    return formatter.resolvedOptions().timeZone;
  },
  GetIANATimeZoneOffsetNanoseconds: (epochNanoseconds, id) => {
    const {
      year,
      month,
      day,
      hour,
      minute,
      second,
      millisecond,
      microsecond,
      nanosecond
    } = ES.GetIANATimeZoneDateTimeParts(epochNanoseconds, id);
    const utc = ES.GetEpochFromParts(year, month, day, hour, minute, second, millisecond, microsecond, nanosecond);
    if (utc === null) throw new RangeError('Date outside of supported range');
    return +utc.minus(epochNanoseconds);
  },
  FormatTimeZoneOffsetString: (offsetNanoseconds) => {
    const sign = offsetNanoseconds < 0 ? '-' : '+';
    offsetNanoseconds = Math.abs(offsetNanoseconds);
    const offsetMinutes = Math.floor(offsetNanoseconds / 60e9);
    const offsetMinuteString = `00${offsetMinutes % 60}`.slice(-2);
    const offsetHourString = `00${Math.floor(offsetMinutes / 60)}`.slice(-2);
    return `${sign}${offsetHourString}:${offsetMinuteString}`;
  },
  GetEpochFromParts: (year, month, day, hour, minute, second, millisecond, microsecond, nanosecond) => {
    // Note: Date.UTC() interprets one and two-digit years as being in the
    // 20th century, so don't use it
    const legacyDate = new Date();
    legacyDate.setUTCHours(hour, minute, second, millisecond);
    legacyDate.setUTCFullYear(year, month - 1, day);
    const ms = legacyDate.getTime();
    if (Number.isNaN(ms)) return null;
    let ns = bigInt(ms).multiply(1e6);
    ns = ns.plus(bigInt(microsecond).multiply(1e3));
    ns = ns.plus(bigInt(nanosecond));
    if (ns.lesser(NS_MIN) || ns.greater(NS_MAX)) return null;
    return ns;
  },
  GetPartsFromEpoch: (epochNanoseconds) => {
    const { quotient, remainder } = bigInt(epochNanoseconds).divmod(1e6);
    let epochMilliseconds = +quotient;
    let nanos = +remainder;
    if (nanos < 0) {
      nanos += 1e6;
      epochMilliseconds -= 1;
    }
    const microsecond = Math.floor(nanos / 1e3) % 1e3;
    const nanosecond = nanos % 1e3;

    const item = new Date(epochMilliseconds);
    const year = item.getUTCFullYear();
    const month = item.getUTCMonth() + 1;
    const day = item.getUTCDate();
    const hour = item.getUTCHours();
    const minute = item.getUTCMinutes();
    const second = item.getUTCSeconds();
    const millisecond = item.getUTCMilliseconds();

    return { epochMilliseconds, year, month, day, hour, minute, second, millisecond, microsecond, nanosecond };
  },
  GetIANATimeZoneDateTimeParts: (epochNanoseconds, id) => {
    const { epochMilliseconds, millisecond, microsecond, nanosecond } = ES.GetPartsFromEpoch(epochNanoseconds);
    const { year, month, day, hour, minute, second } = ES.GetFormatterParts(id, epochMilliseconds);
    return ES.BalanceDateTime(year, month, day, hour, minute, second, millisecond, microsecond, nanosecond);
  },
  GetIANATimeZoneNextTransition: (epochNanoseconds, id) => {
    const uppercap = ES.SystemUTCEpochNanoSeconds() + 366 * DAYMILLIS * 1e6;
    let leftNanos = epochNanoseconds;
    let leftOffsetNs = ES.GetIANATimeZoneOffsetNanoseconds(leftNanos, id);
    let rightNanos = leftNanos;
    let rightOffsetNs = leftOffsetNs;
    while (leftOffsetNs === rightOffsetNs && bigInt(leftNanos).compare(uppercap) === -1) {
      rightNanos = bigInt(leftNanos).plus(2 * 7 * DAYMILLIS * 1e6);
      rightOffsetNs = ES.GetIANATimeZoneOffsetNanoseconds(rightNanos, id);
      if (leftOffsetNs === rightOffsetNs) {
        leftNanos = rightNanos;
      }
    }
    if (leftOffsetNs === rightOffsetNs) return null;
    const result = bisect(
      (epochNs) => ES.GetIANATimeZoneOffsetNanoseconds(epochNs, id),
      leftNanos,
      rightNanos,
      leftOffsetNs,
      rightOffsetNs
    );
    return result;
  },
  GetIANATimeZonePreviousTransition: (epochNanoseconds, id) => {
    const lowercap = BEFORE_FIRST_DST; // 1847-01-01T00:00:00Z
    let rightNanos = epochNanoseconds;
    let rightOffsetNs = ES.GetIANATimeZoneOffsetNanoseconds(rightNanos, id);
    let leftNanos = rightNanos;
    let leftOffsetNs = rightOffsetNs;
    while (rightOffsetNs === leftOffsetNs && bigInt(rightNanos).compare(lowercap) === 1) {
      leftNanos = bigInt(rightNanos).minus(2 * 7 * DAYMILLIS * 1e6);
      leftOffsetNs = ES.GetIANATimeZoneOffsetNanoseconds(leftNanos, id);
      if (rightOffsetNs === leftOffsetNs) {
        rightNanos = leftNanos;
      }
    }
    if (rightOffsetNs === leftOffsetNs) return null;
    const result = bisect(
      (epochNs) => ES.GetIANATimeZoneOffsetNanoseconds(epochNs, id),
      leftNanos,
      rightNanos,
      leftOffsetNs,
      rightOffsetNs
    );
    return result;
  },
  GetFormatterParts: (timeZone, epochMilliseconds) => {
    const formatter = new IntlDateTimeFormat('en-us', {
      timeZone,
      hour12: false,
      era: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    });
    // FIXME: can this use formatToParts instead?
    const datetime = formatter.format(new Date(epochMilliseconds));
    const [date, fullYear, time] = datetime.split(/,\s+/);
    const [month, day] = date.split(' ');
    const [year, era] = fullYear.split(' ');
    const [hour, minute, second] = time.split(':');
    return {
      year: era === 'BC' ? -year + 1 : +year,
      month: +month,
      day: +day,
      hour: hour === '24' ? 0 : +hour, // bugs.chromium.org/p/chromium/issues/detail?id=1045791
      minute: +minute,
      second: +second
    };
  },
  GetIANATimeZoneEpochValue: (id, year, month, day, hour, minute, second, millisecond, microsecond, nanosecond) => {
    let ns = ES.GetEpochFromParts(year, month, day, hour, minute, second, millisecond, microsecond, nanosecond);
    if (ns === null) throw new RangeError('DateTime outside of supported range');
    const dayNanos = bigInt(DAYMILLIS).multiply(1e6);
    let nsEarlier = ns.minus(dayNanos);
    if (nsEarlier.lesser(NS_MIN)) nsEarlier = ns;
    let nsLater = ns.plus(dayNanos);
    if (nsLater.greater(NS_MAX)) nsLater = ns;
    const earliest = ES.GetIANATimeZoneOffsetNanoseconds(nsEarlier, id);
    const latest = ES.GetIANATimeZoneOffsetNanoseconds(nsLater, id);
    const found = earliest === latest ? [earliest] : [earliest, latest];
    return found
      .map((offsetNanoseconds) => {
        const epochNanoseconds = bigInt(ns).minus(offsetNanoseconds);
        const parts = ES.GetIANATimeZoneDateTimeParts(epochNanoseconds, id);
        if (
          year !== parts.year ||
          month !== parts.month ||
          day !== parts.day ||
          hour !== parts.hour ||
          minute !== parts.minute ||
          second !== parts.second ||
          millisecond !== parts.millisecond ||
          microsecond !== parts.microsecond ||
          nanosecond !== parts.nanosecond
        ) {
          return undefined;
        }
        return epochNanoseconds;
      })
      .filter((x) => x !== undefined);
  },
  LeapYear: (year) => {
    if (undefined === year) return false;
    const isDiv4 = year % 4 === 0;
    const isDiv100 = year % 100 === 0;
    const isDiv400 = year % 400 === 0;
    return isDiv4 && (!isDiv100 || isDiv400);
  },
  DaysInMonth: (year, month) => {
    const DoM = {
      standard: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
      leapyear: [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    };
    return DoM[ES.LeapYear(year) ? 'leapyear' : 'standard'][month - 1];
  },
  DayOfWeek: (year, month, day) => {
    const m = month + (month < 3 ? 10 : -2);
    const Y = year - (month < 3 ? 1 : 0);

    const c = Math.floor(Y / 100);
    const y = Y - c * 100;
    const d = day;

    const pD = d;
    const pM = Math.floor(2.6 * m - 0.2);
    const pY = y + Math.floor(y / 4);
    const pC = Math.floor(c / 4) - 2 * c;

    const dow = (pD + pM + pY + pC) % 7;

    return dow + (dow <= 0 ? 7 : 0);
  },
  DayOfYear: (year, month, day) => {
    let days = day;
    for (let m = month - 1; m > 0; m--) {
      days += ES.DaysInMonth(year, m);
    }
    return days;
  },
  WeekOfYear: (year, month, day) => {
    let doy = ES.DayOfYear(year, month, day);
    let dow = ES.DayOfWeek(year, month, day) || 7;
    let doj = ES.DayOfWeek(year, 1, 1);

    const week = Math.floor((doy - dow + 10) / 7);

    if (week < 1) {
      if (doj === (ES.LeapYear(year) ? 5 : 6)) {
        return 53;
      } else {
        return 52;
      }
    }
    if (week === 53) {
      if ((ES.LeapYear(year) ? 366 : 365) - doy < 4 - dow) {
        return 1;
      }
    }

    return week;
  },
  DurationSign: (y, mon, w, d, h, min, s, ms, µs, ns) => {
    for (const prop of [y, mon, w, d, h, min, s, ms, µs, ns]) {
      if (prop !== 0) return prop < 0 ? -1 : 1;
    }
    return 0;
  },

  BalanceYearMonth: (year, month) => {
    if (!Number.isFinite(year) || !Number.isFinite(month)) throw new RangeError('infinity is out of range');
    month -= 1;
    year += Math.floor(month / 12);
    month %= 12;
    if (month < 0) month += 12;
    month += 1;
    return { year, month };
  },
  BalanceDate: (year, month, day) => {
    if (!Number.isFinite(day)) throw new RangeError('infinity is out of range');
    ({ year, month } = ES.BalanceYearMonth(year, month));
    let daysInYear = 0;
    let testYear = month > 2 ? year : year - 1;
    while (((daysInYear = ES.LeapYear(testYear) ? 366 : 365), day < -daysInYear)) {
      year -= 1;
      testYear -= 1;
      day += daysInYear;
    }
    testYear += 1;
    while (((daysInYear = ES.LeapYear(testYear) ? 366 : 365), day > daysInYear)) {
      year += 1;
      testYear += 1;
      day -= daysInYear;
    }

    while (day < 1) {
      ({ year, month } = ES.BalanceYearMonth(year, month - 1));
      day += ES.DaysInMonth(year, month);
    }
    while (day > ES.DaysInMonth(year, month)) {
      day -= ES.DaysInMonth(year, month);
      ({ year, month } = ES.BalanceYearMonth(year, month + 1));
    }

    return { year, month, day };
  },
  BalanceDateTime: (year, month, day, hour, minute, second, millisecond, microsecond, nanosecond) => {
    let deltaDays;
    ({ deltaDays, hour, minute, second, millisecond, microsecond, nanosecond } = ES.BalanceTime(
      hour,
      minute,
      second,
      millisecond,
      microsecond,
      nanosecond
    ));
    ({ year, month, day } = ES.BalanceDate(year, month, day + deltaDays));
    return { year, month, day, hour, minute, second, millisecond, microsecond, nanosecond };
  },
  BalanceTime: (hour, minute, second, millisecond, microsecond, nanosecond) => {
    if (
      !Number.isFinite(hour) ||
      !Number.isFinite(minute) ||
      !Number.isFinite(second) ||
      !Number.isFinite(millisecond) ||
      !Number.isFinite(microsecond) ||
      !Number.isFinite(nanosecond)
    ) {
      throw new RangeError('infinity is out of range');
    }

    microsecond += Math.floor(nanosecond / 1000);
    nanosecond = ES.NonNegativeModulo(nanosecond, 1000);

    millisecond += Math.floor(microsecond / 1000);
    microsecond = ES.NonNegativeModulo(microsecond, 1000);

    second += Math.floor(millisecond / 1000);
    millisecond = ES.NonNegativeModulo(millisecond, 1000);

    minute += Math.floor(second / 60);
    second = ES.NonNegativeModulo(second, 60);

    hour += Math.floor(minute / 60);
    minute = ES.NonNegativeModulo(minute, 60);

    let deltaDays = Math.floor(hour / 24);
    hour = ES.NonNegativeModulo(hour, 24);

    return { deltaDays, hour, minute, second, millisecond, microsecond, nanosecond };
  },
  BalanceDurationDate: (years, months, startYear, startMonth, startDay) => {
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    let { year, month } = ES.BalanceYearMonth(startYear + years, startMonth + months);
    while (startDay > ES.DaysInMonth(year, month)) {
      months -= 1;
      if (months < 0) {
        years -= 1;
        months += 12;
      }
      ({ year, month } = ES.BalanceYearMonth(startYear + years, startMonth + months));
    }
    return { year, month, years, months };
  },
  BalanceDuration: (days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds, largestUnit) => {
    const sign = ES.DurationSign(0, 0, 0, days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds);
    days *= sign;
    hours *= sign;
    minutes *= sign;
    seconds *= sign;
    milliseconds *= sign;
    microseconds *= sign;
    nanoseconds *= sign;

    let deltaDays;
    ({
      deltaDays,
      hour: hours,
      minute: minutes,
      second: seconds,
      millisecond: milliseconds,
      microsecond: microseconds,
      nanosecond: nanoseconds
    } = ES.BalanceTime(hours, minutes, seconds, milliseconds, microseconds, nanoseconds));
    days += deltaDays;

    switch (largestUnit) {
      case 'hours':
        hours += 24 * days;
        days = 0;
        break;
      case 'minutes':
        minutes += 60 * (hours + 24 * days);
        hours = days = 0;
        break;
      case 'seconds':
        seconds += 60 * (minutes + 60 * (hours + 24 * days));
        minutes = hours = days = 0;
        break;
      case 'milliseconds':
        milliseconds += 1000 * (seconds + 60 * (minutes + 60 * (hours + 24 * days)));
        seconds = minutes = hours = days = 0;
        break;
      case 'microseconds':
        microseconds += 1000 * (milliseconds + 1000 * (seconds + 60 * (minutes + 60 * (hours + 24 * days))));
        milliseconds = seconds = minutes = hours = days = 0;
        break;
      case 'nanoseconds':
        nanoseconds +=
          1000 * (microseconds + 1000 * (milliseconds + 1000 * (seconds + 60 * (minutes + 60 * (hours + 24 * days)))));
        microseconds = milliseconds = seconds = minutes = hours = days = 0;
        break;
      case 'years':
      case 'months':
      case 'weeks':
      case 'days':
        break;
      default:
        throw new Error('assert not reached');
    }

    days *= sign;
    hours *= sign;
    minutes *= sign;
    seconds *= sign;
    milliseconds *= sign;
    microseconds *= sign;
    nanoseconds *= sign;

    return { days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds };
  },

  ConstrainToRange: (value, min, max) => Math.min(max, Math.max(min, value)),
  ConstrainDate: (year, month, day) => {
    month = ES.ConstrainToRange(month, 1, 12);
    day = ES.ConstrainToRange(day, 1, ES.DaysInMonth(year, month));
    return { year, month, day };
  },
  ConstrainTime: (hour, minute, second, millisecond, microsecond, nanosecond) => {
    hour = ES.ConstrainToRange(hour, 0, 23);
    minute = ES.ConstrainToRange(minute, 0, 59);
    second = ES.ConstrainToRange(second, 0, 59);
    millisecond = ES.ConstrainToRange(millisecond, 0, 999);
    microsecond = ES.ConstrainToRange(microsecond, 0, 999);
    nanosecond = ES.ConstrainToRange(nanosecond, 0, 999);
    return { hour, minute, second, millisecond, microsecond, nanosecond };
  },
  ConstrainDateTime: (year, month, day, hour, minute, second, millisecond, microsecond, nanosecond) => {
    ({ year, month, day } = ES.ConstrainDate(year, month, day));
    ({ hour, minute, second, millisecond, microsecond, nanosecond } = ES.ConstrainTime(
      hour,
      minute,
      second,
      millisecond,
      microsecond,
      nanosecond
    ));
    return { year, month, day, hour, minute, second, millisecond, microsecond, nanosecond };
  },

  RejectToRange: (value, min, max) => {
    if (value < min || value > max) throw new RangeError(`value out of range: ${min} <= ${value} <= ${max}`);
  },
  RejectDate: (year, month, day) => {
    ES.RejectToRange(month, 1, 12);
    ES.RejectToRange(day, 1, ES.DaysInMonth(year, month));
  },
  RejectDateRange: (year, month, day) => {
    // Noon avoids trouble at edges of DateTime range (excludes midnight)
    ES.RejectDateTimeRange(year, month, day, 12, 0, 0, 0, 0, 0);
  },
  RejectTime: (hour, minute, second, millisecond, microsecond, nanosecond) => {
    ES.RejectToRange(hour, 0, 23);
    ES.RejectToRange(minute, 0, 59);
    ES.RejectToRange(second, 0, 59);
    ES.RejectToRange(millisecond, 0, 999);
    ES.RejectToRange(microsecond, 0, 999);
    ES.RejectToRange(nanosecond, 0, 999);
  },
  RejectDateTime: (year, month, day, hour, minute, second, millisecond, microsecond, nanosecond) => {
    ES.RejectDate(year, month, day);
    ES.RejectTime(hour, minute, second, millisecond, microsecond, nanosecond);
  },
  RejectDateTimeRange: (year, month, day, hour, minute, second, millisecond, microsecond, nanosecond) => {
    ES.RejectToRange(year, YEAR_MIN, YEAR_MAX);
    // Reject any DateTime 24 hours or more outside the Absolute range
    if (
      (year === YEAR_MIN &&
        null ==
          ES.GetEpochFromParts(year, month, day + 1, hour, minute, second, millisecond, microsecond, nanosecond - 1)) ||
      (year === YEAR_MAX &&
        null ==
          ES.GetEpochFromParts(year, month, day - 1, hour, minute, second, millisecond, microsecond, nanosecond + 1))
    ) {
      throw new RangeError('DateTime outside of supported range');
    }
  },
  RejectAbsoluteRange: (epochNanoseconds) => {
    if (epochNanoseconds.lesser(NS_MIN) || epochNanoseconds.greater(NS_MAX)) {
      throw new RangeError('Absolute outside of supported range');
    }
  },
  RejectYearMonthRange: (year, month) => {
    ES.RejectToRange(year, YEAR_MIN, YEAR_MAX);
    if (year === YEAR_MIN) {
      ES.RejectToRange(month, 4, 12);
    } else if (year === YEAR_MAX) {
      ES.RejectToRange(month, 1, 9);
    }
  },
  RejectDurationSign: (y, mon, w, d, h, min, s, ms, µs, ns) => {
    const sign = ES.DurationSign(y, mon, w, d, h, min, s, ms, µs, ns);
    for (const prop of [y, mon, w, d, h, min, s, ms, µs, ns]) {
      const propSign = Math.sign(prop);
      if (propSign !== 0 && propSign !== sign) throw new RangeError('mixed-sign values not allowed as duration fields');
    }
  },

  DifferenceDate: (y1, m1, d1, y2, m2, d2, largestUnit = 'days') => {
    let larger, smaller, sign;
    let comparison = 0;
    if (y1 !== y2) {
      comparison = y1 - y2;
    } else if (m1 !== m2) {
      comparison = m1 - m2;
    } else {
      comparison = d1 - d2;
    }
    if (comparison < 0) {
      smaller = { year: y1, month: m1, day: d1 };
      larger = { year: y2, month: m2, day: d2 };
      sign = 1;
    } else {
      smaller = { year: y2, month: m2, day: d2 };
      larger = { year: y1, month: m1, day: d1 };
      sign = -1;
    }
    let years = larger.year - smaller.year;
    let weeks = 0;
    let months, days;

    switch (largestUnit) {
      case 'years':
      case 'months': {
        months = larger.month - smaller.month;
        let year, month;
        ({ year, month, years, months } = ES.BalanceDurationDate(
          years,
          months,
          smaller.year,
          smaller.month,
          smaller.day
        ));
        days = ES.DayOfYear(larger.year, larger.month, larger.day) - ES.DayOfYear(year, month, smaller.day);
        if (days < 0) {
          months -= 1;
          ({ year, month, years, months } = ES.BalanceDurationDate(
            years,
            months,
            smaller.year,
            smaller.month,
            smaller.day
          ));
          days = ES.DayOfYear(larger.year, larger.month, larger.day) - ES.DayOfYear(year, month, smaller.day);
          if (larger.year > year) days += ES.LeapYear(year) ? 366 : 365;
        }
        if (largestUnit === 'months') {
          months += years * 12;
          years = 0;
        }
        break;
      }
      case 'weeks':
      case 'days':
        months = 0;
        days =
          ES.DayOfYear(larger.year, larger.month, larger.day) - ES.DayOfYear(smaller.year, smaller.month, smaller.day);
        while (years > 0) {
          days += ES.LeapYear(smaller.year + years - 1) ? 366 : 365;
          years -= 1;
        }
        if (largestUnit === 'weeks') {
          weeks = Math.floor(days / 7);
          days %= 7;
        }
        break;
      default:
        throw new Error('assert not reached');
    }
    years *= sign;
    months *= sign;
    weeks *= sign;
    days *= sign;
    return { years, months, weeks, days };
  },
  DifferenceTime: (h1, min1, s1, ms1, µs1, ns1, h2, min2, s2, ms2, µs2, ns2) => {
    let hours = h2 - h1;
    let minutes = min2 - min1;
    let seconds = s2 - s1;
    let milliseconds = ms2 - ms1;
    let microseconds = µs2 - µs1;
    let nanoseconds = ns2 - ns1;

    const sign = ES.DurationSign(0, 0, 0, 0, hours, minutes, seconds, milliseconds, microseconds, nanoseconds);
    hours *= sign;
    minutes *= sign;
    seconds *= sign;
    milliseconds *= sign;
    microseconds *= sign;
    nanoseconds *= sign;

    let deltaDays = 0;
    ({
      deltaDays,
      hour: hours,
      minute: minutes,
      second: seconds,
      millisecond: milliseconds,
      microsecond: microseconds,
      nanosecond: nanoseconds
    } = ES.BalanceTime(hours, minutes, seconds, milliseconds, microseconds, nanoseconds));

    deltaDays *= sign;
    hours *= sign;
    minutes *= sign;
    seconds *= sign;
    milliseconds *= sign;
    microseconds *= sign;
    nanoseconds *= sign;

    return { deltaDays, hours, minutes, seconds, milliseconds, microseconds, nanoseconds };
  },
  AddDate: (year, month, day, years, months, weeks, days, overflow) => {
    year += years;
    month += months;
    ({ year, month } = ES.BalanceYearMonth(year, month));
    ({ year, month, day } = ES.RegulateDate(year, month, day, overflow));
    days += 7 * weeks;
    day += days;
    ({ year, month, day } = ES.BalanceDate(year, month, day));
    return { year, month, day };
  },
  AddTime: (
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
  ) => {
    hour += hours;
    minute += minutes;
    second += seconds;
    millisecond += milliseconds;
    microsecond += microseconds;
    nanosecond += nanoseconds;
    let deltaDays = 0;
    ({ deltaDays, hour, minute, second, millisecond, microsecond, nanosecond } = ES.BalanceTime(
      hour,
      minute,
      second,
      millisecond,
      microsecond,
      nanosecond
    ));
    return { deltaDays, hour, minute, second, millisecond, microsecond, nanosecond };
  },
  SubtractDate: (year, month, day, years, months, weeks, days, overflow) => {
    days += 7 * weeks;
    day -= days;
    ({ year, month, day } = ES.BalanceDate(year, month, day));
    month -= months;
    year -= years;
    ({ year, month } = ES.BalanceYearMonth(year, month));
    ({ year, month, day } = ES.RegulateDate(year, month, day, overflow));
    return { year, month, day };
  },
  SubtractTime: (
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
  ) => {
    hour -= hours;
    minute -= minutes;
    second -= seconds;
    millisecond -= milliseconds;
    microsecond -= microseconds;
    nanosecond -= nanoseconds;
    let deltaDays = 0;
    ({ deltaDays, hour, minute, second, millisecond, microsecond, nanosecond } = ES.BalanceTime(
      hour,
      minute,
      second,
      millisecond,
      microsecond,
      nanosecond
    ));
    return { deltaDays, hour, minute, second, millisecond, microsecond, nanosecond };
  },
  DurationArithmetic: (
    y1,
    mon1,
    w1,
    d1,
    h1,
    min1,
    s1,
    ms1,
    µs1,
    ns1,
    y2,
    mon2,
    w2,
    d2,
    h2,
    min2,
    s2,
    ms2,
    µs2,
    ns2,
    overflow
  ) => {
    let years = y1 + y2;
    let months = mon1 + mon2;
    let weeks = w1 + w2;
    let days = d1 + d2;
    let hours = h1 + h2;
    let minutes = min1 + min2;
    let seconds = s1 + s2;
    let milliseconds = ms1 + ms2;
    let microseconds = µs1 + µs2;
    let nanoseconds = ns1 + ns2;

    const sign = ES.DurationSign(
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
    );
    years *= sign;
    months *= sign;
    weeks *= sign;
    days *= sign;
    hours *= sign;
    minutes *= sign;
    seconds *= sign;
    milliseconds *= sign;
    microseconds *= sign;
    nanoseconds *= sign;

    if (nanoseconds < 0) {
      microseconds += Math.floor(nanoseconds / 1000);
      nanoseconds = ES.NonNegativeModulo(nanoseconds, 1000);
    }
    if (microseconds < 0) {
      milliseconds += Math.floor(microseconds / 1000);
      microseconds = ES.NonNegativeModulo(microseconds, 1000);
    }
    if (milliseconds < 0) {
      seconds += Math.floor(milliseconds / 1000);
      milliseconds = ES.NonNegativeModulo(milliseconds, 1000);
    }
    if (seconds < 0) {
      minutes += Math.floor(seconds / 60);
      seconds = ES.NonNegativeModulo(seconds, 60);
    }
    if (minutes < 0) {
      hours += Math.floor(minutes / 60);
      minutes = ES.NonNegativeModulo(minutes, 60);
    }
    if (hours < 0) {
      days += Math.floor(hours / 24);
      hours = ES.NonNegativeModulo(hours, 24);
    }

    for (const prop of [months, weeks, days]) {
      if (prop < 0) throw new RangeError('mixed sign not allowed in duration fields');
    }

    years *= sign;
    months *= sign;
    weeks *= sign;
    days *= sign;
    hours *= sign;
    minutes *= sign;
    seconds *= sign;
    milliseconds *= sign;
    microseconds *= sign;
    nanoseconds *= sign;

    return ES.RegulateDuration(
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
      overflow
    );
  },
  RoundNumberToIncrement: (quantity, increment, mode) => {
    const quotient = quantity / increment;
    let round;
    switch (mode) {
      case 'ceil':
        round = MathCeil(quotient);
        break;
      case 'floor':
        round = MathFloor(quotient);
        break;
      case 'trunc':
        round = MathTrunc(quotient);
        break;
      case 'nearest':
        // "half away from zero"
        round = MathSign(quotient) * MathFloor(MathAbs(quotient) + 0.5);
        break;
    }
    return round * increment;
  },
  RoundTime: (hour, minute, second, millisecond, microsecond, nanosecond, increment, unit, roundingMode) => {
    let quantity = 0;
    switch (unit) {
      case 'day':
        quantity =
          (((second + millisecond * 1e-3 + microsecond * 1e-6 + nanosecond * 1e-9) / 60 + minute) / 60 + hour) / 24;
        break;
      case 'hour':
        quantity = ((second + millisecond * 1e-3 + microsecond * 1e-6 + nanosecond * 1e-9) / 60 + minute) / 60 + hour;
        break;
      case 'minute':
        quantity = (second + millisecond * 1e-3 + microsecond * 1e-6 + nanosecond * 1e-9) / 60 + minute;
        break;
      case 'second':
        quantity = second + millisecond * 1e-3 + microsecond * 1e-6 + nanosecond * 1e-9;
        break;
      case 'millisecond':
        quantity = millisecond + microsecond * 1e-3 + nanosecond * 1e-9;
        break;
      case 'microsecond':
        quantity = microsecond + nanosecond * 1e-3;
        break;
      case 'nanosecond':
        quantity = nanosecond;
        break;
    }
    const result = ES.RoundNumberToIncrement(quantity, increment, roundingMode);
    switch (unit) {
      case 'day':
        return { deltaDays: result, hour: 0, minute: 0, second: 0, millisecond: 0, microsecond: 0, nanosecond: 0 };
      case 'hour':
        return ES.BalanceTime(result, 0, 0, 0, 0, 0);
      case 'minute':
        return ES.BalanceTime(hour, result, 0, 0, 0, 0);
      case 'second':
        return ES.BalanceTime(hour, minute, result, 0, 0, 0);
      case 'millisecond':
        return ES.BalanceTime(hour, minute, second, result, 0, 0);
      case 'microsecond':
        return ES.BalanceTime(hour, minute, second, millisecond, result, 0);
      case 'nanosecond':
        return ES.BalanceTime(hour, minute, second, millisecond, microsecond, result);
    }
  },
  RoundDuration: (
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
    increment,
    unit,
    roundingMode,
    relativeTo
  ) => {
    const TemporalDate = GetIntrinsic('%Temporal.Date%');
    const TemporalDuration = GetIntrinsic('%Temporal.Duration%');
    let calendar;
    if (relativeTo) {
      if (!ES.IsTemporalDateTime(relativeTo)) throw new TypeError('starting point must be DateTime');
      calendar = GetSlot(relativeTo, CALENDAR);
    }
    switch (unit) {
      case 'years': {
        if (!calendar) throw new RangeError('A starting point is required for years rounding');

        // convert months and weeks to days by calculating difference(
        // relativeTo + years, relativeTo - { years, months, weeks })
        const yearsBefore = calendar.dateMinus(relativeTo, new TemporalDuration(years), {}, TemporalDate);
        const yearsMonthsWeeks = new TemporalDuration(years, months, weeks);
        const yearsMonthsWeeksBefore = calendar.dateMinus(relativeTo, yearsMonthsWeeks, {}, TemporalDate);
        const monthsWeeksInDays = ES.DifferenceDate(
          GetSlot(yearsMonthsWeeksBefore, ISO_YEAR),
          GetSlot(yearsMonthsWeeksBefore, ISO_MONTH),
          GetSlot(yearsMonthsWeeksBefore, ISO_DAY),
          GetSlot(yearsBefore, ISO_YEAR),
          GetSlot(yearsBefore, ISO_MONTH),
          GetSlot(yearsBefore, ISO_DAY),
          'days'
        );

        seconds += milliseconds * 1e-3 + microseconds * 1e-6 + nanoseconds * 1e-9;
        days += monthsWeeksInDays.days;
        days += ((seconds / 60 + minutes) / 60 + hours) / 24;

        const oneYear = new TemporalDuration(1);
        relativeTo = calendar.dateMinus(relativeTo, oneYear, {}, TemporalDate);
        const oneYearDays = calendar.daysInYear(relativeTo);
        years += days / oneYearDays;

        years = ES.RoundNumberToIncrement(years, increment, roundingMode);
        months = weeks = days = hours = minutes = seconds = milliseconds = microseconds = nanoseconds = 0;
        break;
      }
      case 'months': {
        if (!calendar) throw new RangeError('A starting point is required for months rounding');

        // convert weeks to days by calculating difference(relativeTo +
        //   { years, months }, relativeTo - { years, months, weeks })
        const yearsMonths = new TemporalDuration(years, months);
        const yearsMonthsBefore = calendar.dateMinus(relativeTo, yearsMonths, {}, TemporalDate);
        const yearsMonthsWeeks = new TemporalDuration(years, months, weeks);
        const yearsMonthsWeeksBefore = calendar.dateMinus(relativeTo, yearsMonthsWeeks, {}, TemporalDate);
        const weeksInDays = ES.DifferenceDate(
          GetSlot(yearsMonthsWeeksBefore, ISO_YEAR),
          GetSlot(yearsMonthsWeeksBefore, ISO_MONTH),
          GetSlot(yearsMonthsWeeksBefore, ISO_DAY),
          GetSlot(yearsMonthsBefore, ISO_YEAR),
          GetSlot(yearsMonthsBefore, ISO_MONTH),
          GetSlot(yearsMonthsBefore, ISO_DAY),
          'days'
        );

        seconds += milliseconds * 1e-3 + microseconds * 1e-6 + nanoseconds * 1e-9;
        days += weeksInDays.days;
        days += ((seconds / 60 + minutes) / 60 + hours) / 24;

        const oneMonth = new TemporalDuration(0, 1);
        relativeTo = calendar.dateMinus(relativeTo, oneMonth, {}, TemporalDate);
        const oneMonthDays = calendar.daysInMonth(relativeTo);
        months += days / oneMonthDays;

        months = ES.RoundNumberToIncrement(months, increment, roundingMode);
        weeks = days = hours = minutes = seconds = milliseconds = microseconds = nanoseconds = 0;
        break;
      }
      case 'weeks': {
        if (!calendar) throw new RangeError('A starting point is required for weeks rounding');
        seconds += milliseconds * 1e-3 + microseconds * 1e-6 + nanoseconds * 1e-9;
        days += ((seconds / 60 + minutes) / 60 + hours) / 24;

        const oneWeek = new TemporalDuration(0, 0, 1);
        relativeTo = calendar.dateMinus(relativeTo, oneWeek, {}, TemporalDate);
        const oneWeekDays = calendar.daysInWeek(relativeTo);
        weeks += days / oneWeekDays;

        weeks = ES.RoundNumberToIncrement(weeks, increment, roundingMode);
        days = hours = minutes = seconds = milliseconds = microseconds = nanoseconds = 0;
        break;
      }
      case 'days':
        seconds += milliseconds * 1e-3 + microseconds * 1e-6 + nanoseconds * 1e-9;
        days += ((seconds / 60 + minutes) / 60 + hours) / 24;
        days = ES.RoundNumberToIncrement(days, increment, roundingMode);
        hours = minutes = seconds = milliseconds = microseconds = nanoseconds = 0;
        break;
      case 'hours':
        seconds += milliseconds * 1e-3 + microseconds * 1e-6 + nanoseconds * 1e-9;
        hours += (minutes + seconds / 60) / 60;
        hours = ES.RoundNumberToIncrement(hours, increment, roundingMode);
        minutes = seconds = milliseconds = microseconds = nanoseconds = 0;
        break;
      case 'minutes':
        seconds += milliseconds * 1e-3 + microseconds * 1e-6 + nanoseconds * 1e-9;
        minutes += seconds / 60;
        minutes = ES.RoundNumberToIncrement(minutes, increment, roundingMode);
        seconds = milliseconds = microseconds = nanoseconds = 0;
        break;
      case 'seconds':
        seconds += milliseconds * 1e-3 + microseconds * 1e-6 + nanoseconds * 1e-9;
        seconds = ES.RoundNumberToIncrement(seconds, increment, roundingMode);
        milliseconds = microseconds = nanoseconds = 0;
        break;
      case 'milliseconds':
        milliseconds += microseconds * 1e-3 + nanoseconds * 1e-6;
        milliseconds = ES.RoundNumberToIncrement(milliseconds, increment, roundingMode);
        microseconds = nanoseconds = 0;
        break;
      case 'microseconds':
        microseconds += nanoseconds * 1e-3;
        microseconds = ES.RoundNumberToIncrement(microseconds, increment, roundingMode);
        nanoseconds = 0;
        break;
      case 'nanoseconds':
        nanoseconds = ES.RoundNumberToIncrement(nanoseconds, increment, roundingMode);
        break;
    }
    return { years, months, weeks, days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds };
  },

  AssertPositiveInteger: (num) => {
    if (!Number.isFinite(num) || Math.abs(num) !== num) throw new RangeError(`invalid positive integer: ${num}`);
    return num;
  },
  NonNegativeModulo: (x, y) => {
    let result = x % y;
    if (Object.is(result, -0)) return 0;
    if (result < 0) result += y;
    return result;
  },
  ToBigInt: (arg) => {
    if (bigInt.isInstance(arg)) {
      return arg;
    }

    const prim = ES.ToPrimitive(arg, Number);
    switch (typeof prim) {
      case 'undefined':
      case 'object':
      case 'number':
      case 'symbol':
        throw new TypeError(`cannot convert ${typeof arg} to bigint`);
      case 'string':
        if (!prim.match(/^\s*(?:[+-]?\d+\s*)?$/)) {
          throw new SyntaxError('invalid BigInt syntax');
        }
      // eslint: no-fallthrough: false
      case 'bigint':
        try {
          return bigInt(prim);
        } catch (e) {
          if (e instanceof Error && e.message.startsWith('Invalid integer')) throw new SyntaxError(e.message);
          throw e;
        }
      case 'boolean':
        if (prim) {
          return bigInt(1);
        } else {
          return bigInt(0);
        }
    }
  },

  // Note: This method returns values with bogus nanoseconds based on the previous iteration's
  // milliseconds. That way there is a guarantee that the full nanoseconds are always going to be
  // increasing at least and that the microsecond and nanosecond fields are likely to be non-zero.
  SystemUTCEpochNanoSeconds: (() => {
    let ns = Date.now() % 1e6;
    return () => {
      const ms = Date.now();
      const result = bigInt(ms).multiply(1e6).plus(ns);
      ns = ms % 1e6;
      return result;
    };
  })(),
  SystemTimeZone: () => {
    const fmt = new IntlDateTimeFormat('en-us');
    const TemporalTimeZone = GetIntrinsic('%Temporal.TimeZone%');
    return new TemporalTimeZone(ES.TemporalTimeZoneFromString(fmt.resolvedOptions().timeZone));
  },
  ComparisonResult: (value) => (value < 0 ? -1 : value > 0 ? 1 : value),
  NormalizeOptionsObject: (options) => {
    if (options === undefined) return ObjectCreate(null);
    if (ES.Type(options) === 'Object') return options;
    throw new TypeError(
      `Options parameter must be an object, not ${options === null ? 'null' : `a ${typeof options}`}`
    );
  },
  GetOption: (options, property, allowedValues, fallback) => {
    let value = options[property];
    if (value !== undefined) {
      value = ES.ToString(value);
      if (!allowedValues.includes(value)) {
        throw new RangeError(`${property} must be one of ${allowedValues.join(', ')}, not ${value}`);
      }
      return value;
    }
    return fallback;
  },
  GetNumberOption: (options, property, minimum, maximum, fallback) => {
    let value = options[property];
    if (value === undefined) return fallback;
    value = ES.ToNumber(value);
    if (NumberIsNaN(value) || value < minimum || value > maximum) {
      throw new RangeError(`${property} must be between ${minimum} and ${maximum}, not ${value}`);
    }
    return MathFloor(value);
  }
});

const OFFSET = new RegExp(`^${PARSE.offset.source}$`);

function parseOffsetString(string) {
  const match = OFFSET.exec(String(string));
  if (!match) return null;
  const sign = match[1] === '-' || match[1] === '\u2212' ? -1 : +1;
  const hours = +match[2];
  const minutes = +(match[3] || 0);
  return sign * (hours * 60 + minutes) * 60 * 1e9;
}
function bisect(getState, left, right, lstate = getState(left), rstate = getState(right)) {
  left = bigInt(left);
  right = bigInt(right);
  while (right.minus(left).greater(1)) {
    let middle = left.plus(right).divide(2);
    const mstate = getState(middle);
    if (mstate === lstate) {
      left = middle;
      lstate = mstate;
    } else if (mstate === rstate) {
      right = middle;
      rstate = mstate;
    } else {
      throw new Error(`invalid state in bisection ${lstate} - ${mstate} - ${rstate}`);
    }
  }
  return right;
}
