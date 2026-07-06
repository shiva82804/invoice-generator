# Invoice Generator Test Report

Date: 2026-07-06

## Scope

Tested the static invoice generator files:

- `index.html`
- `app.js`
- `style.css`

The requested in-app browser tab was open at `file:///T:/New%20folder%20(4)/index.html`, but the browser automation bridge blocked control of `file://` pages. Because of that, this report is based on local source/runtime checks rather than live browser clicks.

## Summary

Overall status: **Mostly passed, with browser/PDF download verification blocked**

The core invoice generation logic is present and internally consistent. The app has wired controls for supplier/customer details, state selection, product items, sample data, reset, print, and PDF download. Calculation checks for intrastate GST, interstate IGST, discounts, multiple items, and zero quantity matched expected totals.

## Tests Performed

### 1. JavaScript Syntax

Status: **Passed**

- `node --check app.js` passed.
- Extracted the inline `<script>` from `index.html` and parsed it with Node. It passed.

### 2. DOM Contract

Status: **Passed**

- HTML IDs found: 50.
- Form/control elements found: 31.
- JavaScript element references checked: 50 in `app.js`, 50 in inline script.
- Missing references: only `spinner-styles`, which is intentionally created dynamically during PDF generation.

### 3. Event Wiring

Status: **Passed**

Confirmed handlers for:

- Supplier state change
- Customer state change
- Add item
- Load sample data
- Reset form
- Print invoice
- Download PDF

### 4. Calculation Logic

Status: **Passed**

Checked cases:

- Intrastate GST: `55000 + 18% = 64900`, split into CGST `4950` and SGST `4950`.
- Interstate discounted item: `2 * 1000 - 10% + 18% IGST = 2124`.
- Multiple items with mixed GST rates.
- Zero quantity item returns zero totals.

### 5. Product Item Features

Status: **Passed by code inspection**

- Default item is created on startup.
- Add item creates a new product card.
- Item fields update invoice state.
- Remove item is blocked when only one item remains.

### 6. State/GST Features

Status: **Passed by code inspection**

- State dropdowns are populated from the Indian GST state-code list.
- Supplier state updates supplier state code.
- Customer state updates customer state code.
- Place of supply is auto-filled from supplier state when empty.
- Intrastate vs interstate tax table switches between CGST/SGST and IGST.

### 7. Sample Data

Status: **Passed by code inspection**

Sample data fills supplier, customer, invoice, bank, terms, signature, and product details, then re-renders invoice preview.

### 8. Reset

Status: **Passed with note**

- Reset asks for confirmation.
- Clears form fields.
- Clears local storage profile key.
- Resets state selectors and date.
- Recreates one empty item.

Note: in active inline code, localStorage operations are guarded for `file://`. In external `app.js`, localStorage is not guarded, but `app.js` is not loaded by `index.html`.

### 9. Print

Status: **Passed by code inspection**

The Print Invoice button calls `window.print()`. Live print-dialog testing was not performed because browser control was blocked for the `file://` page.

### 10. PDF Export

Status: **Passed by code inspection, live download blocked**

Confirmed:

- `html2pdf.js` CDN script is included.
- Download button calls `downloadPDF`.
- PDF export uses A4 dimensions.
- Cloned invoice content is wrapped and scaled with `scaleToFit` before rendering.
- Invoice preview no longer hides overflow globally; overflow is hidden only inside the PDF clone after scaling.

Live PDF download could not be tested through the in-app browser due the browser automation policy blocking the `file://` page.

## Issues / Risks Found

### Medium: Live browser testing blocked

The requested in-app browser test could not be performed because automation rejected the `file://` URL. This means final visual/PDF output still needs a manual browser confirmation or a served HTTP version of the app.

### Low: Duplicate active/inactive code

`index.html` contains inline CSS and JS, while `style.css` and `app.js` also contain copies. The active page does not link `style.css` or `app.js`, so future edits can easily drift.

### Low: External `app.js` localStorage guard is weaker

The inline script checks localStorage availability safely for `file://`; external `app.js` does not. This is low risk while `app.js` is not loaded, but it can become an issue if the project later switches to external scripts.

## Recommendation

For final acceptance, open the page manually and verify:

- Load Sample Data
- Download PDF
- Confirm the generated PDF is one page and not clipped
- Print preview

The code-level checks indicate the invoice logic and the recent PDF scaling fix are in place.
