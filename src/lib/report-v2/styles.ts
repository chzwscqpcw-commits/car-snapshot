// Layout and type for every report page. Colours are NOT here: they're set
// inline from the theme, so the dark and print editions share all of this.
// Sizes follow the approved mockups (A4 at 96 px/in = 794 × 1123 px).

export const REPORT_CSS = `
@page { size: A4; margin: 0 }
* { box-sizing: border-box }
html, body { margin: 0; padding: 0 }
body { font-family: 'Geist', system-ui, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact }
h1, h2, p, dl, dd, ul, ol, figure, blockquote { margin: 0 }
.page { position: relative; width: 210mm; height: 297mm; overflow: hidden; page-break-after: always; break-after: page }
.page:last-child { page-break-after: auto; break-after: auto }
.pad { position: relative; height: 100%; display: flex; flex-direction: column; padding: 48px 56px 44px }
.body { flex-grow: 1; display: flex; flex-direction: column; min-height: 0 }
.grow { flex-grow: 1 }
.mono { font-family: 'Geist Mono', ui-monospace, monospace }
.small { font-size: 12px; letter-spacing: 0.08em }
.small-text { font-size: 13px; line-height: 1.45 }
.display { font-family: 'Instrument Serif', Georgia, serif; font-weight: 400 }
.label { font-size: 11px; letter-spacing: 0.1em }
.tag { font-size: 11px; letter-spacing: 0.08em }
.eyebrow { font-size: 13px; font-weight: 600; letter-spacing: 0.12em }
.underline { padding-bottom: 10px; border-bottom: 1px solid }
.section-top { margin-top: 30px }
.right { text-align: right; align-items: flex-end }
.stack-0 { display: flex; flex-direction: column }
.stack-2 { display: flex; flex-direction: column; gap: 2px }
.stack-6 { display: flex; flex-direction: column; gap: 6px }
.stack-10 { display: flex; flex-direction: column; gap: 10px }
.stack-14 { display: flex; flex-direction: column; gap: 14px }
.stack-16 { display: flex; flex-direction: column; gap: 16px }
.stack-24 { display: flex; flex-direction: column; gap: 24px }
.stack-32 { display: flex; flex-direction: column; gap: 32px }
.fill { flex-grow: 1 }

/* Page frame */
.runhead { display: flex; justify-content: space-between; font-size: 11px; letter-spacing: 0.1em }
.rule-tight { height: 1px; margin: 14px 0 40px }
.foot { position: relative; display: flex; justify-content: space-between; margin-top: 18px; font-size: 11px; letter-spacing: 0.06em }
.h-page { font-size: 64px; line-height: 1; text-wrap: balance }
.h-page em { font-style: italic }
.h-cont { font-size: 34px; line-height: 1.1; margin-bottom: 18px }
.h-page + .stack-0, .h-page + .stack-24 { margin-top: 28px }
.lede { font-size: 16px; line-height: 1.6; text-wrap: pretty }
.narrow { max-width: 560px; margin-top: 16px }

/* Cover */
.rule { height: 1px; margin-top: 18px }
.masthead { display: flex; justify-content: space-between; align-items: center }
.brand { display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: 15px; letter-spacing: 0.14em }
.hero { margin-top: 96px; display: flex; flex-direction: column; gap: 28px; position: relative }
.plate { align-self: flex-start; background: #F5C518; color: #111111; border-radius: 10px; padding: 14px 34px; font-weight: 700; font-size: 76px; letter-spacing: 0.06em; line-height: 1 }
.cover-title { margin: 0; font-size: 104px; line-height: 0.95; letter-spacing: -0.01em; max-width: 600px; text-wrap: balance }
.cover-title em { font-style: italic }
.deck { margin: 0; font-size: 19px; line-height: 1.55; max-width: 480px; text-wrap: pretty }
.contents { list-style: none; margin: 0 0 40px; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 40px; row-gap: 20px; max-width: 540px; position: relative }
.contents li { display: flex; gap: 14px; align-items: baseline }
.contents li .mono { font-size: 13px }
.contents li div { display: flex; flex-direction: column; gap: 3px }
.contents-title { font-family: 'Instrument Serif', Georgia, serif; font-size: 25px; line-height: 1.1 }
.contents-text { font-size: 13px; line-height: 1.4 }
.vitals { position: relative; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-top: 1px solid; border-bottom: 1px solid }
.vital { padding: 16px 0; display: flex; flex-direction: column; gap: 6px }
.vital-value { font-size: 20px; font-weight: 600 }
.vital-sub { font-size: 12px }

/* Verdict */
.verdict-top { display: flex; gap: 36px; align-items: center; margin-top: 4px }
.gauge { position: relative; width: 250px; height: 250px; flex-shrink: 0 }
.gauge svg { position: absolute; inset: 0 }
.gauge-label { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center }
.gauge-label .mono { font-size: 15px; margin-top: 14px }
.grade { font-size: 190px; line-height: 0.8 }
.section-gap { margin-top: 44px; display: flex; flex-direction: column }
.table-head { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 10px; border-bottom: 1px solid }
.score-row { display: grid; grid-template-columns: 210px 1fr 64px; gap: 18px; align-items: center; padding: 11px 0; border-bottom: 1px solid }
.score-name { display: flex; flex-direction: column; gap: 2px; font-size: 14px; font-weight: 500 }
.score-name span + span { font-size: 12px; font-weight: 400 }
.bar { height: 8px; border-radius: 4px; overflow: hidden }
.bar div { height: 8px; border-radius: 4px }
.score-pts { font-size: 14px; text-align: right }
.facts { display: grid; border-top: 1px solid }
.fact { padding: 18px 18px 0 0; display: flex; flex-direction: column; gap: 6px }
.fact-value { font-size: 40px; line-height: 1 }
.fact-text { font-size: 13px; line-height: 1.45 }

/* MOT story */
.h-mot { font-size: 60px }
.chart { margin-top: 30px; display: flex; flex-direction: column; gap: 10px }
.chart.tight { margin-top: 26px }
.chart figcaption { font-size: 12px; line-height: 1.5 }
.tests { margin-top: 30px; display: flex; flex-direction: column; flex-grow: 1 }
.h-cont + .tests { margin-top: 0 }
.test-row { display: grid; grid-template-columns: 22px 120px 1fr 90px; gap: 16px; padding: 14px 0; border-top: 1px solid; align-items: start }
.dot { width: 12px; height: 12px; border-radius: 6px; margin-top: 5px }
.test-when { display: flex; flex-direction: column; gap: 4px }
.test-date { font-size: 15px; font-weight: 600 }
.notes { display: flex; flex-direction: column; gap: 6px; font-size: 14px; line-height: 1.5 }
.note { display: flex; gap: 10px; align-items: baseline }
.note .tag { flex-shrink: 0; min-width: 64px }
.test-miles { font-size: 14px; text-align: right }
.pullquote { margin-top: auto; padding-top: 22px; border-top: 1px solid; display: flex; justify-content: space-between; gap: 32px; align-items: flex-end }
.pullquote p { font-style: italic; font-size: 28px; line-height: 1.18; max-width: 440px }
.due { display: flex; flex-direction: column; gap: 4px; text-align: right; flex-shrink: 0 }
.due-date { font-size: 22px; font-weight: 600 }

/* Money */
.value-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px }
.value-hero { font-size: 128px; line-height: 0.85 }
.value-hero-range { font-size: 84px }
.conf { font-size: 14px; font-weight: 600 }
.money-cols { display: grid; gap: 40px; margin-top: 40px }
.cost-hero { display: flex; align-items: baseline; gap: 10px; font-size: 14px }
.cost-hero .display { font-size: 60px; line-height: 1 }
.stack-bar { display: flex; height: 14px; border-radius: 7px; overflow: hidden; gap: 2px }
.stack-bar div { height: 14px }
.legend-row { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-bottom: 1px solid; font-size: 13px }
.legend-row i { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0 }
.legend-row span:nth-of-type(1) { flex-grow: 1 }
.budget-row { display: flex; justify-content: space-between; gap: 16px; padding: 8px 0; border-bottom: 1px solid; font-size: 14px }
.budget-name { font-size: 15px; font-weight: 600 }
.budget-total { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; font-size: 13px }
.budget-total .display { font-size: 30px; white-space: nowrap }
.budget-row .mono { white-space: nowrap }
.fine { font-size: 11px; line-height: 1.5 }

/* Details */
.spec-cols { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 40px }
.spec div { display: flex; justify-content: space-between; gap: 16px; padding: 6px 0; border-bottom: 1px solid; font-size: 13px }
.spec dd { font-weight: 500; text-align: right }
.card-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px; margin-top: 12px }
.card { padding-top: 12px; border-top: 1px solid; display: flex; flex-direction: column; gap: 4px }
.card-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; margin-bottom: 4px }
.card-title i { width: 8px; height: 8px; border-radius: 4px }
.card p { font-size: 13px; line-height: 1.45 }

/* Next steps */
.checklist { display: flex; flex-direction: column; gap: 10px }
.check-title { font-size: 30px; line-height: 1.1 }
.checklist ul { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 32px }
.checklist li { display: flex; gap: 10px; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid; font-size: 14px; line-height: 1.45 }
.box { width: 14px; height: 14px; border: 1.5px solid; border-radius: 3px; margin-top: 3px; flex-shrink: 0 }
.closing { margin-top: auto; display: flex; flex-direction: column }
/* Spilled onto a continuation page on its own: sit under the heading, not at the foot. */
.h-cont + .stack-24 > .closing:first-child { margin-top: 0 }
.history { display: flex; gap: 32px; align-items: center; padding: 24px 0; border-top: 1px solid; border-bottom: 1px solid; margin-bottom: 24px }
.history-text { flex: 1 }
.history-text p { font-size: 14px; line-height: 1.55 }
.history-title { font-size: 34px; line-height: 1.05 }
.history-link { font-size: 15px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 8px }
.qr { display: flex; flex-direction: column; align-items: center; gap: 8px; text-decoration: none; flex-shrink: 0 }
.qr svg { display: block; border-radius: 8px }
.qr span { font-size: 10px; letter-spacing: 0.12em }
.fineprint { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px }
.fineprint p { font-size: 12px; line-height: 1.5 }
.signoff { display: flex; justify-content: space-between; font-size: 11px; letter-spacing: 0.04em; margin-top: 18px }
`;
