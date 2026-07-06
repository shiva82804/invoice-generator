// Indian States & Union Territories with their GST State Codes
        const STATES = [
            { code: "01", name: "Jammu & Kashmir" },
            { code: "02", name: "Himachal Pradesh" },
            { code: "03", name: "Punjab" },
            { code: "04", name: "Chandigarh" },
            { code: "05", name: "Uttarakhand" },
            { code: "06", name: "Haryana" },
            { code: "07", name: "Delhi" },
            { code: "08", name: "Rajasthan" },
            { code: "09", name: "Uttar Pradesh" },
            { code: "10", name: "Bihar" },
            { code: "11", name: "Sikkim" },
            { code: "12", name: "Arunachal Pradesh" },
            { code: "13", name: "Nagaland" },
            { code: "14", name: "Manipur" },
            { code: "15", name: "Mizoram" },
            { code: "16", name: "Tripura" },
            { code: "17", name: "Meghalaya" },
            { code: "18", name: "Assam" },
            { code: "19", name: "West Bengal" },
            { code: "20", name: "Jharkhand" },
            { code: "21", name: "Odisha" },
            { code: "22", name: "Chhattisgarh" },
            { code: "23", name: "Madhya Pradesh" },
            { code: "24", name: "Gujarat" },
            { code: "26", name: "Dadra & Nagar Haveli and Daman & Diu" },
            { code: "27", name: "Maharashtra" },
            { code: "29", name: "Karnataka" },
            { code: "30", name: "Goa" },
            { code: "31", name: "Lakshadweep" },
            { code: "32", name: "Kerala" },
            { code: "33", name: "Tamil Nadu" },
            { code: "34", name: "Puducherry" },
            { code: "35", name: "Andaman & Nicobar Islands" },
            { code: "36", name: "Telangana" },
            { code: "37", name: "Andhra Pradesh" },
            { code: "38", name: "Ladakh" }
        ];

        // App State
        let invoiceItems = [];

        // Initialize Elements
        document.addEventListener("DOMContentLoaded", () => {
            populateStateDropdowns();
            setupEventListeners();
            loadFromLocalStorage();
            
            // Set default dates
            const today = new Date().toISOString().split('T')[0];
            document.getElementById("invoice-date").value = today;
            
            // Add one default empty item if none loaded
            if (invoiceItems.length === 0) {
                addNewItem();
            } else {
                renderItemCards();
            }
            
            calculateAndUpdateInvoice();
        });

        // Populate all State selectors
        function populateStateDropdowns() {
            const supplierSelect = document.getElementById("supplier-state");
            const customerSelect = document.getElementById("customer-state");
            const placeOfSupplySelect = document.getElementById("place-of-supply");

            const selectElements = [supplierSelect, customerSelect, placeOfSupplySelect];
            
            selectElements.forEach(select => {
                // Clear options first
                select.innerHTML = '<option value="" disabled selected>Select State</option>';
                
                STATES.forEach(state => {
                    const option = document.createElement("option");
                    option.value = state.name;
                    option.textContent = `${state.code} - ${state.name}`;
                    option.dataset.code = state.code;
                    select.appendChild(option);
                });
            });
        }

        // Setup all form & action event listeners
        function setupEventListeners() {
            // State dropdown changes -> update state code
            document.getElementById("supplier-state").addEventListener("change", (e) => {
                const selectedOption = e.target.options[e.target.selectedIndex];
                const code = selectedOption.dataset.code;
                document.getElementById("supplier-state-code").value = code;
                
                // Auto-fill place of supply to match supplier state by default
                const placeOfSupplySelect = document.getElementById("place-of-supply");
                if (!placeOfSupplySelect.value) {
                    placeOfSupplySelect.value = e.target.value;
                }
                
                // Auto-update first 2 digits of Supplier GSTIN if empty/partially filled
                const gstinInput = document.getElementById("supplier-gstin");
                if (gstinInput.value.length <= 2) {
                    gstinInput.value = code;
                }
                
                saveToLocalStorage();
                calculateAndUpdateInvoice();
            });

            document.getElementById("customer-state").addEventListener("change", (e) => {
                const selectedOption = e.target.options[e.target.selectedIndex];
                const code = selectedOption.dataset.code;
                document.getElementById("customer-state-code").value = code;
                
                // Auto-update place of supply to match customer state
                const placeOfSupplySelect = document.getElementById("place-of-supply");
                placeOfSupplySelect.value = e.target.value;
                
                calculateAndUpdateInvoice();
            });

            // Add item button
            document.getElementById("add-item-btn").addEventListener("click", () => {
                addNewItem();
                calculateAndUpdateInvoice();
            });

            // Form inputs real-time sync with preview
            const formInputs = [
                "supplier-name", "supplier-dealer-desc", "supplier-address", "supplier-gstin", 
                "supplier-phone", "customer-billing-address", "customer-shipping-address", "customer-state",
                "invoice-number", "invoice-date", "place-of-supply", "reverse-charge", "tax-calculation-mode",
                "bank-name", "account-name", "account-number", "account-type", 
                "ifsc-code", "bank-branch", "bank-phone", "upi-id", "terms-text", 
                "signature-name", "signature-title"
            ];

            formInputs.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener("input", () => {
                        saveToLocalStorage();
                        calculateAndUpdateInvoice();
                    });
                    element.addEventListener("change", () => {
                        saveToLocalStorage();
                        calculateAndUpdateInvoice();
                    });
                }
            });

            // Action Buttons
            document.getElementById("load-sample-btn").addEventListener("click", loadSampleData);
            document.getElementById("reset-btn").addEventListener("click", resetForm);
            document.getElementById("print-invoice-btn").addEventListener("click", () => window.print());
            document.getElementById("download-pdf-btn").addEventListener("click", downloadPDF);
        }

        // Add a new empty product/service item
        function addNewItem() {
            const newItem = {
                id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                description: "",
                hsn: "",
                qty: 1,
                unit: "Nos",
                rate: 0,
                discount: 0,
                gstRate: 18 // Default GST rate is 18% in India
            };
            invoiceItems.push(newItem);
            renderItemCards();
        }

        // Remove an item
        function removeItem(id) {
            if (invoiceItems.length <= 1) {
                alert("At least one item is required in the invoice.");
                return;
            }
            invoiceItems = invoiceItems.filter(item => item.id !== id);
            renderItemCards();
            calculateAndUpdateInvoice();
        }

        // Update individual item fields in the state
        function updateItemField(id, field, value) {
            const item = invoiceItems.find(item => item.id === id);
            if (item) {
                if (field === 'qty' || field === 'rate' || field === 'discount' || field === 'gstRate') {
                    item[field] = parseFloat(value) || 0;
                } else {
                    item[field] = value;
                }
                calculateAndUpdateInvoice();
            }
        }

        // Render inputs cards for all products/services in editor panel
        function renderItemCards() {
            const container = document.getElementById("items-list-container");
            container.innerHTML = "";

            invoiceItems.forEach((item, index) => {
                const card = document.createElement("div");
                card.className = "item-form-card";
                card.innerHTML = `
                    <div class="item-card-header">
                        <span class="item-index">Item #${index + 1}</span>
                        <button type="button" class="remove-item-btn" data-id="${item.id}" title="Remove Item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                    <div class="form-grid">
                        <div class="form-group col-span-2">
                            <label>Description of Goods *</label>
                            <input type="text" class="item-desc" data-id="${item.id}" value="${item.description}" placeholder="E.g. AUTO SOFT AS 2" required>
                        </div>
                        <div class="form-group">
                            <label>HSN Code *</label>
                            <input type="text" class="item-hsn" data-id="${item.id}" value="${item.hsn}" placeholder="E.g. 8421" required>
                        </div>
                        <div class="form-group">
                            <label>Unit</label>
                            <select class="item-unit" data-id="${item.id}">
                                <option value="Nos" ${item.unit === 'Nos' ? 'selected' : ''}>Nos</option>
                                <option value="Pcs" ${item.unit === 'Pcs' ? 'selected' : ''}>Pcs</option>
                                <option value="Hours" ${item.unit === 'Hours' ? 'selected' : ''}>Hours</option>
                                <option value="Days" ${item.unit === 'Days' ? 'selected' : ''}>Days</option>
                                <option value="Box" ${item.unit === 'Box' ? 'selected' : ''}>Box</option>
                                <option value="Kgs" ${item.unit === 'Kgs' ? 'selected' : ''}>Kgs</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Quantity *</label>
                            <input type="number" step="any" min="0.001" class="item-qty" data-id="${item.id}" value="${item.qty}" required>
                        </div>
                        <div class="form-group">
                            <label>Rate/Price (Excl. Tax) *</label>
                            <input type="number" step="any" min="0" class="item-rate" data-id="${item.id}" value="${item.rate}" required>
                        </div>
                        <div class="form-group">
                            <label>Discount (%)</label>
                            <input type="number" step="any" min="0" max="100" class="item-disc" data-id="${item.id}" value="${item.discount}">
                        </div>
                        <div class="form-group">
                            <label>GST Rate *</label>
                            <select class="item-gst" data-id="${item.id}">
                                <option value="18" ${item.gstRate === 18 ? 'selected' : ''}>18%</option>
                                <option value="12" ${item.gstRate === 12 ? 'selected' : ''}>12%</option>
                                <option value="5" ${item.gstRate === 5 ? 'selected' : ''}>5%</option>
                                <option value="28" ${item.gstRate === 28 ? 'selected' : ''}>28%</option>
                                <option value="0" ${item.gstRate === 0 ? 'selected' : ''}>0%</option>
                            </select>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });

            // Bind event listeners to new cards
            container.querySelectorAll(".remove-item-btn").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    const id = e.currentTarget.dataset.id;
                    removeItem(id);
                });
            });

            const bindFieldClass = (className, field) => {
                container.querySelectorAll(`.${className}`).forEach(input => {
                    input.addEventListener("input", (e) => {
                        updateItemField(e.target.dataset.id, field, e.target.value);
                    });
                });
            };

            bindFieldClass("item-desc", "description");
            bindFieldClass("item-hsn", "hsn");
            bindFieldClass("item-unit", "unit");
            bindFieldClass("item-qty", "qty");
            bindFieldClass("item-rate", "rate");
            bindFieldClass("item-disc", "discount");
            bindFieldClass("item-gst", "gstRate");
        }

        // Custom Indian format rounding to integer and ending in "/-"
        function formatIndianInvoiceCurrency(amount) {
            let val = Math.round(parseFloat(amount) || 0);
            let strAmount = val.toString();
            
            // Indian Comma placement format (last 3 digits, then every 2 digits)
            let lastThree = strAmount.substring(strAmount.length - 3);
            let otherNumbers = strAmount.substring(0, strAmount.length - 3);
            if (otherNumbers !== '') {
                lastThree = ',' + lastThree;
            }
            let formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
            
            return formatted + "/-";
        }

        function convertNumberToWords(amount) {
            const num = Math.round(parseFloat(amount) || 0);
            if (num === 0) return "Zero Rupees Only";

            const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
            const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

            function convertLessThanOneThousand(n) {
                if (n < 20) return units[n];
                const digit = n % 10;
                if (n < 100) return tens[Math.floor(n / 10)] + (digit ? " " + units[digit] : "");
                const hundred = Math.floor(n / 100);
                const rest = n % 100;
                return units[hundred] + " Hundred" + (rest ? " and " + convertLessThanOneThousand(rest) : "");
            }

            let word = "";
            let remaining = num;

            // Crore (1,00,00,000)
            if (remaining >= 10000000) {
                const crore = Math.floor(remaining / 10000000);
                word += convertLessThanOneThousand(crore) + " Crore ";
                remaining %= 10000000;
            }

            // Lakh (1,00,000)
            if (remaining >= 100000) {
                const lakh = Math.floor(remaining / 100000);
                word += convertLessThanOneThousand(lakh) + " Lakh ";
                remaining %= 100000;
            }

            // Thousand (1,000)
            if (remaining >= 1000) {
                const thousand = Math.floor(remaining / 1000);
                word += convertLessThanOneThousand(thousand) + " Thousand ";
                remaining %= 1000;
            }

            // Hundreds and remaining
            if (remaining > 0) {
                word += convertLessThanOneThousand(remaining);
            }

            return word.trim() + " Rupees Only";
        }

        // Master Function: Runs calculation rules and updates A4 sheet layout
        function calculateAndUpdateInvoice() {
            // 1. Gather all inputs from forms
            const sName = document.getElementById("supplier-name").value || "Supplier Business Name";
            const sDealerDesc = document.getElementById("supplier-dealer-desc").value || "";
            const sAddress = document.getElementById("supplier-address").value || "";
            const sGstin = document.getElementById("supplier-gstin").value.toUpperCase() || "-";
            const sPhone = document.getElementById("supplier-phone").value || "-";
            
            const sStateSelect = document.getElementById("supplier-state");
            const sStateCode = sStateSelect.selectedIndex > 0 ? sStateSelect.options[sStateSelect.selectedIndex].dataset.code : "";
            
            const cStateSelect = document.getElementById("customer-state");
            const cStateCode = cStateSelect.selectedIndex > 0 ? cStateSelect.options[cStateSelect.selectedIndex].dataset.code : "";
            
            const bankName = document.getElementById("bank-name").value || "-";
            const accountName = document.getElementById("account-name").value || "-";
            const accountNo = document.getElementById("account-number").value || "-";
            const accountType = document.getElementById("account-type").value || "-";
            const ifscCode = document.getElementById("ifsc-code").value.toUpperCase() || "-";
            const bankBranch = document.getElementById("bank-branch").value || "-";
            
            const cBillingDetails = document.getElementById("customer-billing-address").value || "";
            const cShippingDetails = document.getElementById("customer-shipping-address").value.trim();
            
            const invNo = document.getElementById("invoice-number").value || "-";
            const invDateVal = document.getElementById("invoice-date").value;
            const revCharge = document.getElementById("reverse-charge").value || "NO";
            const taxMode = document.getElementById("tax-calculation-mode").value || "inclusive";
            const upiId = document.getElementById("upi-id").value || "-";
            
            const sigNameVal = document.getElementById("signature-name").value || "";
            const sigTitleVal = document.getElementById("signature-title").value || "Authorised Signatory";

            // Format Dates nicely (DD-MM-YYYY)
            const formatDate = (dateStr) => {
                if (!dateStr) return "-";
                const dateParts = dateStr.split('-');
                if (dateParts.length === 3) {
                    return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                }
                return dateStr;
            };
            const invDateFormatted = formatDate(invDateVal);

            // 2. Render Supplier static fields in Preview Sheet
            document.getElementById("p-supplier-name").textContent = sName;
            
            let supplierHTML = sAddress.replace(/\n/g, "<br>") + "<br>";
            if (sPhone) supplierHTML += `Ph.No : ${sPhone}<br>`;
            if (sGstin) supplierHTML += `<strong>GSTIN : ${sGstin}</strong><br>`;
            if (sDealerDesc) supplierHTML += `<strong>${sDealerDesc}</strong>`;
            document.getElementById("p-supplier-address-details").innerHTML = supplierHTML;
            
            document.getElementById("p-invoice-number").textContent = invNo;
            document.getElementById("p-invoice-date").textContent = invDateFormatted;
            document.getElementById("p-reverse-charge").textContent = revCharge;

            // Parse Customer Billing Info
            const parseCustomerDetails = (text) => {
                const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
                let name = "-";
                let mobile = "-";
                let email = "-";
                let gstin = "URP";
                let addressLines = [];

                if (lines.length > 0) {
                    name = lines[0];
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i];
                        const lineUpper = line.toUpperCase();
                        
                        if (lineUpper.includes("GSTIN") || lineUpper.includes("GST")) {
                            const match = line.match(/[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}/i);
                            gstin = match ? match[0].toUpperCase() : line.replace(/gstin\s*:\s*/i, "").trim().toUpperCase();
                        }
                        else if (lineUpper.includes("PH.NO") || lineUpper.includes("PHONE") || lineUpper.includes("MOBILE") || lineUpper.includes("MOB")) {
                            mobile = line.replace(/(ph\.no|phone|mobile|mob)\s*:\s*/i, "").trim();
                        }
                        else if (line.includes("@")) {
                            email = line.replace(/email\s*:\s*/i, "").trim();
                        }
                        else {
                            addressLines.push(line);
                        }
                    }
                }
                
                let address = addressLines.join(", ") || "-";
                return { name, address, mobile, email, gstin };
            };

            const parsedCust = parseCustomerDetails(cBillingDetails);
            const shippingSource = cShippingDetails || cBillingDetails;
            const parsedShipping = parseCustomerDetails(shippingSource);
            const customerStateText = cStateSelect.selectedIndex > 0 ? cStateSelect.value : "-";

            const buildCustomerAddressHTML = (parsed) => {
                let html = `<strong>${parsed.name}</strong><br>`;
                if (parsed.address && parsed.address !== "-") {
                    html += parsed.address.replace(/,\s*/g, ",<br>") + "<br>";
                }
                if (parsed.mobile && parsed.mobile !== "-") {
                    html += `Mobile: ${parsed.mobile}<br>`;
                }
                if (parsed.email && parsed.email !== "-") {
                    html += `Email: ${parsed.email}<br>`;
                }
                if (parsed.gstin) {
                    html += `<strong>GSTIN : ${parsed.gstin}</strong>`;
                }
                return html;
            };

            // Populate Billing Address
            document.getElementById("p-customer-address-details").innerHTML = buildCustomerAddressHTML(parsedCust);

            // Populate Shipping Address (same as billing when shipping field is blank)
            document.getElementById("p-place-of-supply-display").innerHTML = buildCustomerAddressHTML(parsedShipping);

            // Determine GST Type (CGST + SGST vs IGST)
            let isIntraState = true;
            if (sStateCode !== "" && cStateCode !== "") {
                isIntraState = (sStateCode === cStateCode);
            }
            
            // 3. Render Table Headers dynamically
            const tableHead = document.getElementById("p-table-head");
            if (isIntraState) {
                tableHead.innerHTML = `
                    <th style="width: 5%; text-align: center;">SL. NO.</th>
                    <th style="width: 35%; text-align: left;">PRODUCT</th>
                    <th style="width: 10%; text-align: center;">HSN CODE</th>
                    <th style="width: 10%; text-align: right;">PRICE</th>
                    <th style="width: 10%; text-align: center;">QTY / NOS.</th>
                    <th style="width: 8%; text-align: right;">CGST</th>
                    <th style="width: 8%; text-align: right;">SGST</th>
                    <th style="width: 8%; text-align: right;">GST</th>
                    <th style="width: 12%; text-align: right;">AMOUNT (RS)</th>
                `;
            } else {
                tableHead.innerHTML = `
                    <th style="width: 5%; text-align: center;">SL. NO.</th>
                    <th style="width: 40%; text-align: left;">PRODUCT</th>
                    <th style="width: 10%; text-align: center;">HSN CODE</th>
                    <th style="width: 10%; text-align: right;">PRICE</th>
                    <th style="width: 10%; text-align: center;">QTY / NOS.</th>
                    <th style="width: 10%; text-align: right;">IGST</th>
                    <th style="width: 10%; text-align: right;">GST</th>
                    <th style="width: 12%; text-align: right;">AMOUNT (RS)</th>
                `;
            }

            // 4. Math Calculations & Row Renderings
            let totalTaxable = 0;
            let totalCgst = 0;
            let totalSgst = 0;
            let totalIgst = 0;
            let totalInvoice = 0;

            const tableBody = document.getElementById("p-items-tbody");
            tableBody.innerHTML = "";

            invoiceItems.forEach((item, index) => {
                const qty = item.qty || 0;
                const rate = item.rate || 0;
                const discountPct = item.discount || 0;
                const gstRate = item.gstRate || 0;
                const hsn = item.hsn || "";

                let taxableValue = 0;
                let cgstAmount = 0;
                let sgstAmount = 0;
                let igstAmount = 0;
                let taxAmount = 0;
                let totalRowValue = 0;
                let displayRate = 0;

                if (taxMode === "inclusive") {
                    // GST is inclusive, calculate backwards from price
                    totalRowValue = qty * rate * (1 - discountPct / 100);
                    taxableValue = totalRowValue / (1 + gstRate / 100);
                    taxAmount = totalRowValue - taxableValue;
                    displayRate = rate / (1 + gstRate / 100);
                } else {
                    // GST is exclusive, add on top of rate
                    const rawTotal = qty * rate;
                    const discountAmount = rawTotal * (discountPct / 100);
                    taxableValue = rawTotal - discountAmount;
                    taxAmount = taxableValue * (gstRate / 100);
                    totalRowValue = taxableValue + taxAmount;
                    displayRate = rate;
                }

                if (isIntraState) {
                    cgstAmount = taxAmount / 2;
                    sgstAmount = taxAmount / 2;
                    totalCgst += cgstAmount;
                    totalSgst += sgstAmount;
                } else {
                    igstAmount = taxAmount;
                    totalIgst += igstAmount;
                }

                totalTaxable += taxableValue;
                totalInvoice += totalRowValue;

                // Render main item row
                const row = document.createElement("tr");
                const qtyText = (item.unit && item.unit.toLowerCase() === 'nos') ? `${qty}no's` : `${qty} ${item.unit || ''}`;
                
                if (isIntraState) {
                    row.innerHTML = `
                        <td style="text-align: center;">${index + 1}</td>
                        <td style="text-align: left;"><strong>${item.description || 'Description'}</strong></td>
                        <td style="text-align: center;">${hsn}</td>
                        <td style="text-align: right;">${formatIndianInvoiceCurrency(displayRate)}</td>
                        <td style="text-align: center;">${qtyText}</td>
                        <td style="text-align: right;">${formatIndianInvoiceCurrency(cgstAmount)}</td>
                        <td style="text-align: right;">${formatIndianInvoiceCurrency(sgstAmount)}</td>
                        <td style="text-align: right;">${formatIndianInvoiceCurrency(taxAmount)}</td>
                        <td style="text-align: right; font-weight: bold;">${formatIndianInvoiceCurrency(totalRowValue)}</td>
                    `;
                } else {
                    row.innerHTML = `
                        <td style="text-align: center;">${index + 1}</td>
                        <td style="text-align: left;"><strong>${item.description || 'Description'}</strong></td>
                        <td style="text-align: center;">${hsn}</td>
                        <td style="text-align: right;">${formatIndianInvoiceCurrency(displayRate)}</td>
                        <td style="text-align: center;">${qtyText}</td>
                        <td style="text-align: right;">${formatIndianInvoiceCurrency(igstAmount)}</td>
                        <td style="text-align: right;">${formatIndianInvoiceCurrency(taxAmount)}</td>
                        <td style="text-align: right; font-weight: bold;">${formatIndianInvoiceCurrency(totalRowValue)}</td>
                    `;
                }
                tableBody.appendChild(row);
            });

            // 5. Add filler rows to maintain vertical grid lines to a minimum of 8 rows
            const minRows = 8;
            const currentItemCount = invoiceItems.length;
            if (currentItemCount < minRows) {
                const fillerCount = minRows - currentItemCount;
                for (let i = 0; i < fillerCount; i++) {
                    const fillerRow = document.createElement("tr");
                    fillerRow.className = "filler-row";
                    if (isIntraState) {
                        fillerRow.innerHTML = `
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                        `;
                    } else {
                        fillerRow.innerHTML = `
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                        `;
                    }
                    tableBody.appendChild(fillerRow);
                }
            }

            // 6. Append single TOTAL Row
            const rowTotal = document.createElement("tr");
            rowTotal.className = "total-row";
            if (isIntraState) {
                rowTotal.innerHTML = `
                    <td colspan="8" style="text-align: left; font-weight: 800; text-transform: uppercase;">TOTAL</td>
                    <td style="text-align: right; font-weight: 800;">${formatIndianInvoiceCurrency(totalInvoice)}</td>
                `;
            } else {
                rowTotal.innerHTML = `
                    <td colspan="7" style="text-align: left; font-weight: 800; text-transform: uppercase;">TOTAL</td>
                    <td style="text-align: right; font-weight: 800;">${formatIndianInvoiceCurrency(totalInvoice)}</td>
                `;
            }
            tableBody.appendChild(rowTotal);

            // 7. Populate Terms list
            const termsContainer = document.getElementById("p-terms-list");
            termsContainer.innerHTML = "";
            const termsVal = document.getElementById("terms-text").value || "";
            const termsLines = termsVal.split("\n").map(line => line.trim()).filter(Boolean);
            termsLines.forEach(line => {
                const li = document.createElement("li");
                li.textContent = line;
                termsContainer.appendChild(li);
            });

            // 8. Bank Details Display
            document.getElementById("p-bank-acc-name").textContent = accountName;
            document.getElementById("p-bank-acc-no").textContent = accountNo;
            document.getElementById("p-bank-acc-type").textContent = accountType;
            document.getElementById("p-bank-name").textContent = bankName;
            document.getElementById("p-bank-branch").textContent = bankBranch;
            document.getElementById("p-bank-ifsc").textContent = ifscCode;
        }

        // Download PDF using html2pdf.js
        function downloadPDF(e) {
            e.preventDefault();
            
            const element = document.getElementById('invoice-sheet');
            const invoiceNumber = document.getElementById("invoice-number").value || "Draft";
            
            const opt = {
                margin:       0, // Zero margin to match exact A4 layout dimensions
                filename:     `Invoice_${invoiceNumber.replace(/\//g, '-')}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { 
                    scale: 2, 
                    useCORS: true, 
                    letterRendering: true,
                    scrollY: 0, 
                    scrollX: 0,
                    onclone: (clonedDoc) => {
                        const sheet = clonedDoc.getElementById('invoice-sheet');
                        if (sheet) {
                            sheet.style.boxShadow = 'none';
                            sheet.style.border = 'none';
                            sheet.style.margin = '0';
                        }
                    }
                },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak:    { mode: 'legacy' }
            };
            
            // Add small visual loading state
            const btn = document.getElementById("download-pdf-btn");
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = `<svg class="spinner" width="16" height="16" viewBox="0 0 50 50" style="animation: rotate 1s linear infinite; margin-right: 8px;"><circle class="path" cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" style="stroke-linecap: round; animation: dash 1.5s ease-in-out infinite;"></circle></svg> Generating...`;
            
            // CSS keyframes styling injection for spinner if not present
            if (!document.getElementById("spinner-styles")) {
                const style = document.createElement("style");
                style.id = "spinner-styles";
                style.innerHTML = `
                    @keyframes rotate { 100% { transform: rotate(360deg); } }
                    @keyframes dash { 0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; } 50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; } 100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; } }
                `;
                document.head.appendChild(style);
            }

            // Run html2pdf
            html2pdf().set(opt).from(element).save().then(() => {
                btn.disabled = false;
                btn.innerHTML = originalHTML;
            }).catch(err => {
                console.error(err);
                alert("Error exporting PDF. Please use the Print option instead.");
                btn.disabled = false;
                btn.innerHTML = originalHTML;
            });
        }

        // Load pre-configured sample data for instant demo matching provided image
        function loadSampleData() {
            // Supplier
            document.getElementById("supplier-name").value = "SS WATER MANAGEMENT";
            document.getElementById("supplier-dealer-desc").value = "AUTHORIZED DEALER FOR ION EXCHANGE INDIA LTD";
            document.getElementById("supplier-address").value = "H.No.6-32/12/1,Sai Aishwarya Colony,\nRoad No 8, Parvathapur,Medipally,Medchal";
            document.getElementById("supplier-gstin").value = "36DIYPG8223A1Z5";
            document.getElementById("supplier-phone").value = "9581826599";
            
            const supplierState = document.getElementById("supplier-state");
            supplierState.value = "Telangana";
            document.getElementById("supplier-state-code").value = "36";

            // Customer / Billing Details Text Area
            document.getElementById("customer-billing-address").value = "Mr.G Vidya sagar\nSenior advocate\nH No 1-8-475\nSri Venkateshwara swamy temple lane\nChikkadpalli\nHydrabad\n500020\nPh.No : 9848602522";
            
            const customerState = document.getElementById("customer-state");
            customerState.value = "Telangana";
            document.getElementById("customer-state-code").value = "36";

            // Meta
            document.getElementById("invoice-number").value = "01";
            document.getElementById("invoice-date").value = "2026-04-04";
            document.getElementById("reverse-charge").value = "NO";
            document.getElementById("tax-calculation-mode").value = "inclusive";

            // Place of Supply: Telangana (intra-state split CGST/SGST)
            const placeOfSupply = document.getElementById("place-of-supply");
            placeOfSupply.value = "Telangana";
            
            // Bank Details
            document.getElementById("bank-name").value = "AXIS BANK";
            document.getElementById("account-name").value = "SS WATER MANAGEMENT";
            document.getElementById("account-number").value = "925020030002346";
            document.getElementById("account-type").value = "Current Account";
            document.getElementById("ifsc-code").value = "UTIB0000008";
            document.getElementById("bank-branch").value = "Begumpet";
            document.getElementById("bank-phone").value = "9581826599";
            document.getElementById("upi-id").value = "8790513762-2@ybl";

            // Terms
            document.getElementById("terms-text").value = "GOODS ONCE SOLD WILL NOT BE TAKEN BACK OR EXCHANGED\nONE YEAR WARRANTY FROM THE DATE OF INSTALLATION.\nCONSUMABLES NOT COVERED UNDER WARRANTY.\nInterest at the rate of 24% will be charged if the payment is not received within 15 days from the date of Delivery Challan.";

            // Signatures
            document.getElementById("signature-name").value = "G.Ranjith";
            document.getElementById("signature-title").value = "Proprietor";

            // Items
            invoiceItems = [
                {
                    id: 'item_1',
                    description: "AUTO SOFT AS 2",
                    hsn: "8421",
                    qty: 1,
                    unit: "Nos",
                    rate: 46610,
                    discount: 0,
                    gstRate: 18
                }
            ];

            renderItemCards();
            saveToLocalStorage();
            calculateAndUpdateInvoice();
        }

        // Reset Form fields and clear state
        function resetForm() {
            if (confirm("Are you sure you want to clear the invoice form?")) {
                // Clear Local Storage
                localStorage.removeItem("gst_supplier_profile_target");
                
                // Clear forms
                document.getElementById("invoice-form").reset();
                
                // Reset states
                populateStateDropdowns();
                document.getElementById("supplier-state-code").value = "";
                document.getElementById("customer-state-code").value = "";
                
                // Set date
                const today = new Date().toISOString().split('T')[0];
                document.getElementById("invoice-date").value = today;

                // Clear items and insert one empty item
                invoiceItems = [];
                addNewItem();
                
                calculateAndUpdateInvoice();
            }
        }

        // Safely check if localStorage is accessible (prevents crash on file:// protocol)
        function isStorageAvailable() {
            try {
                localStorage.setItem("__test_storage__", "test");
                localStorage.removeItem("__test_storage__");
                return true;
            } catch (e) {
                return false;
            }
        }

        // Save Supplier details, Bank details, and Terms in Local Storage
        function saveToLocalStorage() {
            try {
                if (!isStorageAvailable()) return;
                const profile = {
                    name: document.getElementById("supplier-name").value,
                    dealerDesc: document.getElementById("supplier-dealer-desc").value,
                    address: document.getElementById("supplier-address").value,
                    gstin: document.getElementById("supplier-gstin").value,
                    phone: document.getElementById("supplier-phone").value,
                    state: document.getElementById("supplier-state").value,
                    stateCode: document.getElementById("supplier-state-code").value,
                    
                    bankName: document.getElementById("bank-name").value,
                    accountName: document.getElementById("account-name").value,
                    accountNo: document.getElementById("account-number").value,
                    accountType: document.getElementById("account-type").value,
                    ifscCode: document.getElementById("ifsc-code").value,
                    bankBranch: document.getElementById("bank-branch").value,
                    bankPhone: document.getElementById("bank-phone").value,
                    upiId: document.getElementById("upi-id").value,
                    
                    reverseCharge: document.getElementById("reverse-charge").value,
                    taxMode: document.getElementById("tax-calculation-mode").value,
                    
                    terms: document.getElementById("terms-text").value,
                    sigName: document.getElementById("signature-name").value,
                    sigTitle: document.getElementById("signature-title").value
                };

                localStorage.setItem("gst_supplier_profile_target", JSON.stringify(profile));
            } catch (e) {
                console.warn("Storage save failed:", e);
            }
        }

        // Load Supplier details from Local Storage on Startup
        function loadFromLocalStorage() {
            try {
                if (!isStorageAvailable()) return;
                const profileStr = localStorage.getItem("gst_supplier_profile_target");
                if (!profileStr) return;

                const profile = JSON.parse(profileStr);
                
                if (profile.name) document.getElementById("supplier-name").value = profile.name;
                if (profile.dealerDesc) document.getElementById("supplier-dealer-desc").value = profile.dealerDesc;
                if (profile.address) document.getElementById("supplier-address").value = profile.address;
                if (profile.gstin) document.getElementById("supplier-gstin").value = profile.gstin;
                if (profile.phone) document.getElementById("supplier-phone").value = profile.phone;
                
                if (profile.state) {
                    document.getElementById("supplier-state").value = profile.state;
                    document.getElementById("supplier-state-code").value = profile.stateCode || "";
                }
                
                if (profile.bankName) document.getElementById("bank-name").value = profile.bankName;
                if (profile.accountName) document.getElementById("account-name").value = profile.accountName;
                if (profile.accountNo) document.getElementById("account-number").value = profile.accountNo;
                if (profile.accountType) document.getElementById("account-type").value = profile.accountType;
                if (profile.ifscCode) document.getElementById("ifsc-code").value = profile.ifscCode;
                if (profile.bankBranch) document.getElementById("bank-branch").value = profile.bankBranch;
                if (profile.bankPhone) document.getElementById("bank-phone").value = profile.bankPhone;
                if (profile.upiId) document.getElementById("upi-id").value = profile.upiId;
                
                if (profile.reverseCharge) document.getElementById("reverse-charge").value = profile.reverseCharge;
                if (profile.taxMode) document.getElementById("tax-calculation-mode").value = profile.taxMode;
                
                if (profile.terms) document.getElementById("terms-text").value = profile.terms;
                if (profile.sigName) document.getElementById("signature-name").value = profile.sigName;
                if (profile.sigTitle) document.getElementById("signature-title").value = profile.sigTitle;
                
            } catch (e) {
                console.warn("Storage load failed:", e);
            }
        }