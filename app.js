/* Tariff data and charge engine.
   Every rate is copied from the published tariff files listed in `source`.
   All rates are naira per container per day, excluding 7.5% VAT.
   A schedule is a list of day bands. `ends` holds the last day of each band (null = no end),
   `rates` holds the daily rate for that band. The first band is the free time (rate 0). */
var CC = (function () {
  var DAY = 86400000;

  function t(r2, r3, r4) { return [0, r2, r3, r4]; }
  var STORAGE_ENDS = [5, 8, 13, null];

  var TERMINALS = {
    apm: {
      name: 'APM Terminals, Apapa', effective: '16 Feb 2026', ends: STORAGE_ENDS,
      source: 'APM Terminals tariff, storage tariff effective 16 Feb 2026',
      types: [
        { id: 'dry', label: 'Dry', sizes: { 20: t(6804, 33264, 45360), 40: t(13608, 66528, 90720), 45: t(20412, 99792, 136080) } },
        { id: 'reefer', label: 'Reefer', sizes: { 20: t(14364, 40824, 52920), 40: t(21168, 74088, 98280) } },
        { id: 'oog', label: 'Out of gauge', sizes: { 20: t(54432, 266112, 362880), 40: t(108864, 532224, 725760) } },
        { id: 'imdg', label: 'Hazardous (IMDG)', sizes: { 20: t(13608, 66528, 90720), 40: t(27216, 125496, 181440) } },
        { id: 'flat', label: 'Flat rack', sizes: { 20: t(13608, 66528, 90720), 40: t(27216, 125496, 181440) } }
      ]
    },
    tict: {
      name: 'TICT, Tin Can', effective: '16 Feb 2026', ends: STORAGE_ENDS,
      source: 'TICT tariff, full import container storage charges effective 16 Feb 2026',
      types: [
        { id: 'dry', label: 'Dry', sizes: { 20: t(6804, 33264, 45360), 40: t(13608, 66528, 90720), 45: t(15309, 74844, 102060) } },
        { id: 'flat', label: 'Flat rack', sizes: { 20: t(30618, 149688, 204120), 40: t(61236, 299376, 408240) } },
        { id: 'open', label: 'Open top', sizes: { 20: t(30618, 149688, 204120), 40: t(61236, 299376, 408240) } },
        { id: 'haz', label: 'Hazardous', sizes: { 20: t(13608, 66528, 90720), 40: t(27216, 133056, 181440) } },
        { id: 'hazflat', label: 'Hazardous flat rack', sizes: { 20: t(37422, 182952, 249480), 40: t(74844, 365904, 498960) } },
        { id: 'oog', label: 'Out of gauge', sizes: { 20: t(54432, 266112, 362880), 40: t(108864, 532224, 725760) } },
        { id: 'hazoog', label: 'Hazardous out of gauge', sizes: { 20: t(61236, 299376, 408240), 40: t(122472, 598752, 831480) } },
        { id: 'reefer', label: 'Reefer', sizes: { 20: t(14364, 40824, 52920), 40: t(21168, 74088, 98280) } },
        { id: 'hazreefer', label: 'Hazardous reefer', sizes: { 20: t(28728, 81648, 105840), 40: t(42336, 148176, 196560) } },
        { id: 'hazopen', label: 'Hazardous open top', sizes: { 20: t(45927, 224532, 306180), 40: t(91854, 449064, 612360) } }
      ]
    },
    lft: {
      name: 'Lekki Freeport Terminal', effective: '16 Feb 2026', ends: STORAGE_ENDS,
      source: 'Lekki Freeport Terminal tariff, section 4.1 storage charges for imports, effective 16 Feb 2026',
      types: [
        { id: 'dry', label: 'Dry', sizes: { 20: t(6600, 32340, 44100), 40: t(13200, 64680, 88200), 45: t(15309, 74844, 102060) } },
        { id: 'flat', label: 'Flat rack', sizes: { 20: t(13335.84, 65197.44, 88905.6), 40: t(27216, 125494, 181880) } },
        { id: 'oog', label: 'Out of gauge', sizes: { 20: t(54432, 266112, 362880), 40: t(108864, 532224, 725760) } },
        { id: 'imdg', label: 'Hazardous (IMDG)', sizes: { 20: t(13608, 66528, 90720), 40: t(27216, 125496, 181440) } },
        { id: 'reefer', label: 'Reefer', sizes: { 20: t(13645.8, 38782.8, 50274), 40: t(20109.6, 70383.6, 93366) } },
        { id: 'open', label: 'Open top', sizes: { 20: t(53343.36, 260789.76, 355622.4), 40: t(106686.72, 521579.52, 711244.8) } }
      ]
    },
    ptml: {
      name: 'PTML, Tin Can', effective: '16 May 2026', ends: STORAGE_ENDS,
      source: 'PTML terminal tariff handbook, effective 16 May 2026, and the PTML import tariff report',
      types: [
        { id: 'dry', label: 'Dry, box or high cube', sizes: { 20: t(6600, 33000, 45000), 40: t(13200, 66000, 90000) } },
        { id: 'flat', label: 'Flat rack, open top or tank', sizes: { 20: t(13200, 66000, 90000), 40: t(26400, 132000, 180000) } },
        { id: 'reefer', label: 'Reefer', sizes: { 20: t(6600, 33000, 45000), 40: t(13200, 66000, 90000) } },
        { id: 'haz', label: 'Hazardous', sizes: { 20: t(13200, 66000, 90000), 40: t(26400, 132000, 180000) } }
      ]
    }
  };

  var G_ENDS = [7, 12, 19, null];
  function g(r2, r3, r4) { return [0, r2, r3, r4]; }
  var COMBINED_STD = [7, 12, 17, 24, null];
  var COMBINED_REEFER = [5, 8, null];

  var LINES = {
    grimaldi: {
      name: 'Grimaldi Agency Nigeria', effective: '16 Nov 2026', ends: G_ENDS,
      source: 'Grimaldi import tariff, effective from 16 Nov 2026 (the same rates are used in the PTML handbook worked example)',
      types: [
        { id: 'dry', label: 'Dry box', sizes: { 20: g(10200, 13600, 17000), 40: g(15400, 21200, 25400) } },
        { id: 'flat', label: 'Flat rack, open top or tank', sizes: { 20: g(14400, 17800, 22000), 40: g(21000, 27600, 33000) } },
        { id: 'reefer', label: 'Reefer', sizes: { 20: g(58000, 58000, 58000), 40: g(116000, 116000, 116000) } },
        { id: 'haz', label: 'Hazardous', sizes: { 20: g(10200, 13600, 17000), 40: g(15400, 21200, 25400) } }
      ]
    },
    combined: {
      name: 'Combined demurrage and detention schedule', effective: '15 Nov 2023', ends: COMBINED_STD,
      source: 'Nigeria import combined demurrage and detention schedule, Apapa and Tin Can, effective 15 Nov 2023 (the file does not name the carrier)',
      types: [
        { id: 'std', label: 'Standard container', ends: COMBINED_STD, sizes: { 20: [0, 9425, 12325, 15225, 18125], 40: [0, 13775, 18850, 22475, 26100] } },
        { id: 'special', label: 'Special (tank, open top, flat and similar)', ends: COMBINED_STD, sizes: { 20: [0, 9425, 12325, 15225, 18125], 40: [0, 13775, 18850, 22475, 26100] } },
        { id: 'reefer', label: 'Reefer', ends: COMBINED_REEFER, sizes: { 20: [0, 14500, 65250], 40: [0, 29000, 123250] } }
      ]
    }
  };

  function findType(src, id) {
    for (var i = 0; i < src.types.length; i++) if (src.types[i].id === id) return src.types[i];
    return null;
  }

  /* Build a schedule {ends, rates, shift} for a tariff entry, or null if that size is not in the tariff. */
  function schedule(src, typeId, size, extraFree) {
    var ty = findType(src, typeId);
    if (!ty || !ty.sizes[size]) return null;
    return { ends: ty.ends || src.ends, rates: ty.sizes[size], shift: extraFree || 0 };
  }

  /* Build a flat schedule from the user's own free days and daily rate. */
  function custom(freeDays, rate, extraFree) {
    return { ends: [freeDays, null], rates: [0, rate], shift: extraFree || 0 };
  }

  /* Rate charged on a given day, where day 1 is the landing day. */
  function rateOn(s, day) {
    var d = day - s.shift;
    if (d < 1) return 0;
    for (var i = 0; i < s.ends.length; i++) {
      if (s.ends[i] === null || d <= s.ends[i]) return s.rates[i];
    }
    return 0;
  }

  /* Total charged for days 1 to `day`. */
  function through(s, day) {
    var sum = 0;
    for (var d = 1; d <= day; d++) sum += rateOn(s, d);
    return sum;
  }

  /* Last free day, counting the extended free time. */
  function lastFreeDay(s) { return s.ends[0] + s.shift; }

  /* First later day on which the daily rate is higher than on `day`. */
  function nextRise(s, day) {
    var r = rateOn(s, day);
    for (var d = day + 1; d <= day + 400; d++) {
      var nr = rateOn(s, d);
      if (nr > r) return { day: d, rate: nr };
    }
    return null;
  }

  /* Rows for the dated rate card: first day, last day, rate, total at the end of the band. */
  function bands(s) {
    var rows = [];
    var from = 1;
    for (var i = 0; i < s.ends.length; i++) {
      var to = s.ends[i] === null ? null : s.ends[i] + s.shift;
      rows.push({ from: from, to: to, rate: s.rates[i], endTotal: to === null ? null : through(s, to) });
      if (to === null) break;
      from = to + 1;
    }
    return rows;
  }

  /* Working days from fromMs to toMs inclusive. Sundays never count. Saturdays count only if sixDay is true. */
  function workDaysBetween(fromMs, toMs, sixDay) {
    var n = 0;
    for (var ms = fromMs; ms <= toMs; ms += DAY) {
      var w = new Date(ms).getUTCDay();
      if (w !== 0 && (sixDay || w !== 6)) n++;
    }
    return n;
  }

  var api = {
    DAY: DAY, TERMINALS: TERMINALS, LINES: LINES,
    findType: findType, schedule: schedule, custom: custom,
    rateOn: rateOn, workDaysBetween: workDaysBetween, through: through, lastFreeDay: lastFreeDay, nextRise: nextRise, bands: bands
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  return api;
})();

(function () {
  'use strict';

  /* Set formEndpoint to the URL your form service gives you (for example a Formspree
     or Netlify Forms address). While it is empty, the join form sends nothing and
     offers the visitor a copy of their answers instead. */
  var CONFIG = { formEndpoint: '' };

  var DAY = 86400000;
  var ICON = {
    red: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="6.2"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5"/></svg>',
    amber: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2l6.3 11H1.7z"/><path d="M8 6.5v3.2M8 11.6v.1"/></svg>',
    green: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6.2"/><path d="M5 8.2l2.2 2.2L11 6.2"/></svg>',
    neutral: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="6.2"/><path d="M8 4.6V8l2.2 1.4"/></svg>'
  };

  function $(id) { return document.getElementById(id); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(offsetDays) {
    var d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return null;
    var ms = Date.UTC(+m[1], +m[2] - 1, +m[3]);
    return isNaN(ms) ? null : ms;
  }
  function fmtDate(ms) {
    return new Date(ms).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  }
  function fmtMoney(n) { return '₦' + Math.round(n).toLocaleString('en-US'); }
  function whole(s) {
    var t = String(s == null ? '' : s).replace(/[,\s]/g, '');
    return /^\d+$/.test(t) ? parseInt(t, 10) : null;
  }
  function days(n) { return n === 1 ? '1 day' : n + ' days'; }
  function chip(kind, text) { return '<span class="chip chip-' + kind + '">' + ICON[kind] + text + '</span>'; }

  /* ---------- Clock calculator (two clocks: terminal storage and line demurrage) ---------- */
  function shortDate(ms) {
    return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  }
  function dayLabel(from, to) { return to === null ? 'Day ' + from + ' onwards' : (from === to ? 'Day ' + from : 'Days ' + from + ' to ' + to); }
  function dateRange(land, from, to) {
    var a = land + (from - 1) * DAY;
    return to === null ? 'from ' + shortDate(a) : (from === to ? shortDate(a) : shortDate(a) + ' to ' + shortDate(land + (to - 1) * DAY));
  }
  function rateText(r) { return r === 0 ? 'Free' : fmtMoney(r); }

  function initCalc() {
    var form = $('calc');
    if (!form) return;
    var f = {
      land: $('c-land'), today: $('c-today'), gate: $('c-gate'), size: $('c-size'), wk: $('c-wk'),
      term: $('c-term'), ttype: $('c-ttype'), text: $('c-text'), tcust: $('c-tcust'), tcfree: $('c-tcfree'), tcrate: $('c-tcrate'),
      line: $('c-line'), ltype: $('c-ltype'), lext: $('c-lext'), lcust: $('c-lcust'), lcfree: $('c-lcfree'), lcrate: $('c-lcrate')
    };
    var err = $('calc-error'), out = $('calc-out');

    function option(v, label) { var o = document.createElement('option'); o.value = v; o.textContent = label; return o; }
    function fillSources(select, data, otherLabel) {
      Object.keys(data).forEach(function (k) { select.appendChild(option(k, data[k].name + ' (' + data[k].effective + ')')); });
      select.appendChild(option('custom', otherLabel));
    }
    function fillTypes(select, data, key) {
      var keep = select.value;
      select.innerHTML = '';
      if (key === 'custom') return;
      data[key].types.forEach(function (t) { select.appendChild(option(t.id, t.label)); });
      if (keep) select.value = keep;
      if (!select.value && select.options.length) select.selectedIndex = 0;
    }
    function syncSource(selectEl, typeEl, custEl, data) {
      var isCustom = selectEl.value === 'custom';
      custEl.hidden = !isCustom;
      typeEl.parentNode.hidden = isCustom;
      if (!isCustom) fillTypes(typeEl, data, selectEl.value);
    }

    fillSources(f.term, CC.TERMINALS, 'Other terminal (enter your own)');
    fillSources(f.line, CC.LINES, 'Other shipping line (enter your own)');
    f.land.value = ymd(-6);
    f.today.value = ymd(0);
    f.gate.value = ymd(3);
    f.size.value = '40';
    f.wk.value = '5';
    f.term.value = 'apm';
    f.line.value = 'grimaldi';
    f.text.value = '0';
    f.lext.value = '0';
    f.tcfree.value = '5';
    f.tcrate.value = '';
    f.lcfree.value = '7';
    f.lcrate.value = '';
    syncSource(f.term, f.ttype, f.tcust, CC.TERMINALS);
    syncSource(f.line, f.ltype, f.lcust, CC.LINES);
    f.ttype.value = 'dry';
    f.ltype.value = 'dry';

    /* Returns {sched, sub} or {missing, sub} or {invalid:true}. */
    function build(kind) {
      var term = kind === 'terminal';
      var sel = term ? f.term : f.line, tySel = term ? f.ttype : f.ltype;
      var extEl = term ? f.text : f.lext;
      var data = term ? CC.TERMINALS : CC.LINES;
      var extTxt = extEl.value.trim();
      var ext = extTxt === '' ? 0 : whole(extTxt);
      if (ext === null) return { invalid: true };
      var size = parseInt(f.size.value, 10);
      if (sel.value === 'custom') {
        var cf = whole(term ? f.tcfree.value : f.lcfree.value), cr = whole(term ? f.tcrate.value : f.lcrate.value);
        if (cf === null || cr === null) return { invalid: true };
        return { sched: CC.custom(cf, cr, ext), sub: 'Your own free days and flat daily rate' };
      }
      var src = data[sel.value];
      var ty = CC.findType(src, tySel.value);
      var s = CC.schedule(src, tySel.value, size, ext);
      var label = src.name + ' · ' + (ty ? ty.label : '') + ' · ' + size + ' ft';
      if (!s) return { missing: true, sub: label, src: src };
      return { sched: s, sub: label + ' · tariff effective ' + src.effective, src: src };
    }

    function elapsedDay(land, today) { return Math.round((today - land) / DAY) + 1; }

    function clockCard(title, b, land, today, sixDay) {
      var head = '<h3>' + title + '</h3><p class="muted small">' + b.sub + '</p>';
      if (b.missing) {
        return '<section class="clock">' + head + '<p class="notice notice-amber">This tariff has no rate for that size. Choose another size, or pick "Other" and enter your own rate.</p></section>';
      }
      var s = b.sched, e = elapsedDay(land, today);
      var lastFree = CC.lastFreeDay(s), left = lastFree - e;
      var workLeft = (e >= 1 && left >= 0) ? CC.workDaysBetween(today, land + (lastFree - 1) * DAY, sixDay) : null;
      var headline, status;
      if (e < 1) { headline = 'Not landed yet'; status = chip('neutral', 'Waiting'); }
      else if (left > 2 && workLeft > 1) { headline = days(left) + ' free left'; status = chip('green', 'On track'); }
      else if (left > 0) { headline = days(left) + ' free left'; status = chip('amber', 'At risk'); }
      else if (left === 0) { headline = 'Last free day is today'; status = chip('amber', 'At risk'); }
      else { headline = days(-left) + ' over'; status = chip('red', 'Charges running'); }

      var lines = '';
      if (e >= 1) {
        lines += '<p>Today is day <strong>' + e + '</strong>. Rate today: <strong>' + rateText(CC.rateOn(s, e)) + '</strong>' + (CC.rateOn(s, e) ? ' a day' : '') + '</p>';
        lines += '<p>Charged so far: <strong>' + fmtMoney(CC.through(s, e)) + '</strong></p>';
        if (workLeft !== null) {
          var calLeft = left + 1;
          lines += '<p>Working days left, counting today: <strong>' + workLeft + '</strong> of ' + calLeft + ' calendar days</p>';
          if (workLeft < calLeft) lines += '<p class="notice notice-amber">Weekends take ' + (calLeft - workLeft) + ' of the ' + calLeft + ' days you have left. Paperwork and gate release usually cannot happen on them.</p>';
        }
        var rise = CC.nextRise(s, e);
        if (rise) {
          var inDays = rise.day - e, txt, urgent;
          if (left >= 0) {
            txt = 'Charges start on <strong>' + fmtDate(land + lastFree * DAY) + '</strong> at ' + fmtMoney(CC.rateOn(s, lastFree + 1)) + ' a day.';
            urgent = left <= 2;
          } else {
            txt = 'Rate rises to <strong>' + fmtMoney(rise.rate) + ' a day</strong> on <strong>' + fmtDate(land + (rise.day - 1) * DAY) + '</strong> (in ' + days(inDays) + ').';
            urgent = inDays <= 2;
          }
          lines += (urgent ? '<p class="notice notice-amber">' + txt + '</p>' : '<p class="muted">' + txt + '</p>');
        }
      } else {
        lines += '<p class="muted">The clock starts on the landing date.</p>';
      }
      return '<section class="clock">' + head +
        '<div class="headline-row"><span class="headline">' + headline + '</span>' + status + '</div>' + lines + '</section>';
    }

    function rateCard(title, b, land, today) {
      if (!b.sched) return '';
      var s = b.sched, e = elapsedDay(land, today), rows = '';
      CC.bands(s).forEach(function (r) {
        var now = e >= r.from && (r.to === null || e <= r.to);
        rows += '<tr' + (now ? ' class="now"' : '') + '><td>' + dayLabel(r.from, r.to) + (now ? ' <span class="chip chip-neutral">Today</span>' : '') + '</td><td>' + dateRange(land, r.from, r.to) + '</td><td class="num">' + (r.rate === 0 ? 'Free' : fmtMoney(r.rate) + ' a day') + '</td><td class="num">' + (r.endTotal === null ? '' : fmtMoney(r.endTotal)) + '</td></tr>';
      });
      return '<div class="stack"><h3 style="font-size:1rem">' + title + '</h3><div class="table-scroll"><table><thead><tr><th>Days</th><th>Dates</th><th class="num">Rate</th><th class="num">Total at end</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
    }

    function render() {
      var land = parseDate(f.land.value), today = parseDate(f.today.value), gate = parseDate(f.gate.value);
      var t = build('terminal'), l = build('line');
      var sixDay = f.wk.value === '6';
      if (land === null || today === null || gate === null || t.invalid || l.invalid) {
        err.hidden = false; out.hidden = true; return;
      }
      err.hidden = true; out.hidden = false;

      var gd = Math.max(0, elapsedDay(land, gate));
      var parts = [], total = 0, note = '';
      [['Terminal storage', t], ['Line demurrage', l]].forEach(function (p) {
        if (!p[1].sched) { note = ' The total leaves out ' + p[0].toLowerCase() + ', which has no rate for this size.'; return; }
        var cost = CC.through(p[1].sched, gd), n = 0;
        for (var d = 1; d <= gd; d++) if (CC.rateOn(p[1].sched, d) > 0) n++;
        total += cost;
        parts.push('<tr><td>' + p[0] + '</td><td class="num">' + n + '</td><td class="num"><strong>' + fmtMoney(cost) + '</strong></td></tr>');
      });
      var vat = Math.round(total * 0.075);

      out.innerHTML =
        '<div class="clocks">' + clockCard('Terminal storage', t, land, today, sixDay) + clockCard('Line demurrage', l, land, today, sixDay) + '</div>' +
        '<section class="clock">' +
          '<h3>If the container leaves on ' + fmtDate(gate) + '</h3>' +
          '<p class="muted small">Day ' + gd + ' counting the landing day as day 1.' + note + '</p>' +
          '<div class="table-scroll"><table><thead><tr><th>Charge</th><th class="num">Days charged</th><th class="num">Amount</th></tr></thead><tbody>' + parts.join('') +
          '<tr><td><strong>Total, without VAT</strong></td><td></td><td class="num"><strong>' + fmtMoney(total) + '</strong></td></tr>' +
          '<tr><td>With 7.5% VAT</td><td></td><td class="num">' + fmtMoney(total + vat) + '</td></tr></tbody></table></div>' +
        '</section>' +
        '<div class="grid grid-2">' + rateCard('Storage rate card, with your dates', t, land, today) + rateCard('Demurrage rate card, with your dates', l, land, today) + '</div>';
    }

    f.term.addEventListener('change', function () { syncSource(f.term, f.ttype, f.tcust, CC.TERMINALS); render(); });
    f.line.addEventListener('change', function () { syncSource(f.line, f.ltype, f.lcust, CC.LINES); render(); });
    form.addEventListener('input', render);
    form.addEventListener('change', render);
    form.addEventListener('submit', function (e) { e.preventDefault(); render(); });
    render();
  }


  /* ---------- Clear-order ranking ---------- */
  function initRank() {
    var host = $('rank-rows'), outEl = $('rank-out');
    if (!host) return;
    var termKeys = Object.keys(CC.TERMINALS), lineKeys = Object.keys(CC.LINES);
    var rows = [
      { name: 'Container A', land: ymd(-11), term: 'apm', line: 'grimaldi', size: '40' },
      { name: 'Container B', land: ymd(-4), term: 'apm', line: 'grimaldi', size: '40' },
      { name: 'Container C', land: ymd(-3), term: 'ptml', line: 'grimaldi', size: '20' },
      { name: 'Container D', land: ymd(-7), term: 'tict', line: 'grimaldi', size: '40' }
    ];

    function opts(keys, data, sel) {
      return keys.map(function (k) { return '<option value="' + k + '"' + (k === sel ? ' selected' : '') + '>' + data[k].name + '</option>'; }).join('');
    }
    function sizeOpts(sel) {
      return ['20', '40', '45'].map(function (s) { return '<option value="' + s + '"' + (s === sel ? ' selected' : '') + '>' + s + ' ft</option>'; }).join('');
    }
    host.innerHTML = rows.map(function (r, i) {
      return '<fieldset class="rank-card"><legend>Container ' + (i + 1) + '</legend>' +
        '<div class="field"><label for="k' + i + '-name">Name</label><input id="k' + i + '-name" type="text" value="' + r.name + '"></div>' +
        '<div class="field"><label for="k' + i + '-land">Landing date</label><input id="k' + i + '-land" type="date" value="' + r.land + '"></div>' +
        '<div class="field"><label for="k' + i + '-term">Terminal</label><select id="k' + i + '-term">' + opts(termKeys, CC.TERMINALS, r.term) + '</select></div>' +
        '<div class="field"><label for="k' + i + '-line">Shipping line</label><select id="k' + i + '-line">' + opts(lineKeys, CC.LINES, r.line) + '</select></div>' +
        '<div class="field"><label for="k' + i + '-size">Size</label><select id="k' + i + '-size">' + sizeOpts(r.size) + '</select></div>' +
        '</fieldset>';
    }).join('');

    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

    function evaluate(i, today) {
      var name = $('k' + i + '-name').value.trim() || 'Container ' + (i + 1);
      var land = parseDate($('k' + i + '-land').value);
      var tk = $('k' + i + '-term').value, lk = $('k' + i + '-line').value, size = parseInt($('k' + i + '-size').value, 10);
      if (land === null) return { name: name, invalid: true };
      var s1 = CC.schedule(CC.TERMINALS[tk], 'dry', size, 0), s2 = CC.schedule(CC.LINES[lk], 'dry', size, 0);
      if (!s1 || !s2) return { name: name, missing: true };
      var e = Math.round((today - land) / DAY) + 1;
      if (e < 1) return { name: name, notLanded: true };
      var hold = CC.rateOn(s1, e + 1) + CC.rateOn(s2, e + 1);
      var clocks = [['Storage', s1], ['Demurrage', s2]].map(function (c) {
        var left = CC.lastFreeDay(c[1]) - e;
        var rise = CC.nextRise(c[1], e);
        return { label: c[0], left: left, rate: CC.rateOn(c[1], e), rise: rise };
      });
      var next = null;
      clocks.forEach(function (c) {
        if (c.rise && (next === null || c.rise.day < next.day)) next = { day: c.rise.day, rate: c.rise.rate, label: c.label };
      });
      var status = clocks.map(function (c) {
        if (c.left < 0) return c.label + ' running at ' + fmtMoney(c.rate) + ' a day';
        if (c.left === 0) return c.label + ' charges start tomorrow';
        return c.label + ' charges start in ' + days(c.left + 1);
      }).join('. ');
      return { name: name, e: e, hold: hold, status: status, next: next, land: land };
    }

    function render() {
      var today = parseDate($('c-today') ? $('c-today').value : ymd(0));
      if (today === null) today = parseDate(ymd(0));
      var list = [];
      for (var i = 0; i < rows.length; i++) list.push(evaluate(i, today));
      var ok = list.filter(function (x) { return x.hold !== undefined; });
      ok.sort(function (a, b) {
        if (b.hold !== a.hold) return b.hold - a.hold;
        var ad = a.next ? a.next.day : 1e9, bd = b.next ? b.next.day : 1e9;
        return ad - bd;
      });
      var other = list.filter(function (x) { return x.hold === undefined; });

      var html = '';
      if (ok.length) {
        var top = ok[0];
        html += '<div class="notice notice-amber"><strong>Clear first: ' + esc(top.name) + '.</strong> ' +
          (top.hold > 0 ? 'Holding it one more day costs ' + fmtMoney(top.hold) + '.' : 'It reaches its first charge soonest.') + '</div>';
        html += '<div class="table-scroll"><table><thead><tr><th>Order</th><th>Container</th><th class="num">Cost of one more day</th><th>Where each clock stands</th><th>Next change</th></tr></thead><tbody>';
        ok.forEach(function (x, idx) {
          var nextTxt = x.next ? fmtDate(x.land + (x.next.day - 1) * DAY) + ': ' + x.next.label.toLowerCase() + ' at ' + fmtMoney(x.next.rate) + ' a day' : 'No further change';
          html += '<tr><td><strong>' + (idx + 1) + '</strong></td><td><strong>' + esc(x.name) + '</strong><div class="fine">Day ' + x.e + '</div></td><td class="num"><strong>' + (x.hold ? fmtMoney(x.hold) : 'Free') + '</strong></td><td>' + x.status + '</td><td>' + nextTxt + '</td></tr>';
        });
        html += '</tbody></table></div>';
      }
      other.forEach(function (x) {
        var why = x.invalid ? 'needs a landing date' : (x.missing ? 'has no rate for that size in these tariffs' : 'has not landed yet');
        html += '<p class="muted small">' + esc(x.name) + ' ' + why + ' and is left out of the order.</p>';
      });
      outEl.innerHTML = html;
    }

    host.addEventListener('input', render);
    host.addEventListener('change', render);
    var todayEl = $('c-today');
    if (todayEl) { todayEl.addEventListener('input', render); }
    render();
  }

  /* ---------- Join form ---------- */
  function initJoin() {
    var form = $('join');
    if (!form) return;
    var errBox = $('join-error'), done = $('join-done'), fallback = $('join-fallback');
    var copyBox = $('join-copy'), copyBtn = $('join-copy-btn'), copyMsg = $('join-copy-msg');

    function val(id) { var el = $(id); return el ? el.value.trim() : ''; }

    function collect() {
      return {
        name: val('f-name'),
        role: val('f-role'),
        company: val('f-co'),
        phone: val('f-ph'),
        containersPerMonth: val('f-n'),
        linesAndTerminals: val('f-l'),
        lastExtraCharge: val('f-q'),
        consent: $('f-c').checked
      };
    }

    function asText(d) {
      return [
        'Container Clock pilot',
        'Name: ' + d.name,
        'Role: ' + d.role,
        'Company: ' + (d.company || '-'),
        'Phone or WhatsApp: ' + d.phone,
        'Containers per month: ' + (d.containersPerMonth || '-'),
        'Shipping lines and terminals: ' + (d.linesAndTerminals || '-'),
        'Last extra charge and cause: ' + (d.lastExtraCharge || '-'),
        'Agreed to storage of these details: yes'
      ].join('\n');
    }

    function fail(msg, fieldId) {
      ['f-name', 'f-role', 'f-ph', 'f-c'].forEach(function (id) { $(id).removeAttribute('aria-invalid'); });
      errBox.textContent = msg;
      errBox.hidden = false;
      if (fieldId) { $(fieldId).setAttribute('aria-invalid', 'true'); $(fieldId).focus(); }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = collect();
      if (!d.name) return fail('Enter your name.', 'f-name');
      if (!d.role) return fail('Choose your role.', 'f-role');
      if (!/^[+0-9 ()-]{7,}$/.test(d.phone)) return fail('Enter a valid phone or WhatsApp number.', 'f-ph');
      if (!d.consent) return fail('Tick the box to agree to storage of your details.', 'f-c');
      errBox.hidden = true;

      if (CONFIG.formEndpoint) {
        var btn = $('join-submit');
        btn.disabled = true;
        btn.textContent = 'Sending';
        fetch(CONFIG.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(d)
        }).then(function (res) {
          if (!res.ok) throw new Error('bad status');
          form.hidden = true;
          done.hidden = false;
          done.focus();
        }).catch(function () {
          btn.disabled = false;
          btn.textContent = 'Join the pilot';
          fail('Your details were not sent. Check your connection and try again.');
        });
        return;
      }

      form.hidden = true;
      copyBox.value = asText(d);
      fallback.hidden = false;
      fallback.focus();
    });

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var text = copyBox.value;
        function selectFallback() {
          copyBox.focus();
          copyBox.select();
          copyMsg.textContent = 'Press and hold, then choose Copy.';
        }
        try {
          navigator.clipboard.writeText(text).then(function () {
            copyMsg.textContent = 'Copied.';
          }, selectFallback);
        } catch (e) { selectFallback(); }
      });
    }
  }

  /* ---------- Page switching (one-file copy only) ---------- */
  function initRouter() {
    var pages = document.querySelectorAll('[data-page]');
    if (!pages.length) return;
    var links = document.querySelectorAll('[data-nav]');
    var known = {};
    Array.prototype.forEach.call(pages, function (p) { known[p.getAttribute('data-page')] = true; });

    function show() {
      var slug = (location.hash || '').replace('#', '') || 'home';
      if (!known[slug]) slug = 'home';
      Array.prototype.forEach.call(pages, function (p) { p.hidden = p.getAttribute('data-page') !== slug; });
      Array.prototype.forEach.call(links, function (a) {
        if (a.getAttribute('data-nav') === slug) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
      window.scrollTo(0, 0);
    }
    window.addEventListener('hashchange', show);
    show();
  }

  function start() { initCalc(); initRank(); initJoin(); initRouter(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
