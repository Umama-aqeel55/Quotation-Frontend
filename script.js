document.addEventListener('DOMContentLoaded', () => {
    const quotationSectionsContainer = document.getElementById('quotationSectionsContainer');
    const addSectionBtn = document.getElementById('addSectionBtn');
    const subTotalSpan = document.getElementById('subTotal');
    const gstAmountSpan = document.getElementById('gstAmount');
    const totalAmountSpan = document.getElementById('totalAmount');

    const dateInput = document.getElementById('dateInput');
    const quotationNumberInput = document.getElementById('quotationNumberInput');
    const sloganInput = document.getElementById('slogan');
    const companyAddressTextarea = document.getElementById('companyAddress');
    const companyPhoneInput = document.getElementById('companyPhone');

    const documentTypeSelect = document.getElementById('documentTypeSelect');
    const customerNameSelect = document.getElementById('customerNameSelect');
    const customerAddressInput = document.getElementById('customerAddressInput');
    const customerCellNoInput = document.getElementById('customerCellNoInput');
    const remarksTextarea = document.getElementById('remarks');

    const companyNameDisplay = document.getElementById('companyNameDisplay');
    const companyNameInput = document.getElementById('companyNameInput');

    const newQuotationBtn = document.getElementById('newQuotationBtn');
    const generatePdfBtn = document.getElementById('generatePdfBtn');
    const quotationContent = document.getElementById('quotationContent');

    const LOCAL_STORAGE_KEY = 'quotationData';
    const GST_RATE = 0.18;

    let sectionCounter = 0;


    function collectQuotationData() {
        const data = {
            documentType: documentTypeSelect.value,
            companyName: companyNameInput.value,
            slogan: sloganInput.value,
            companyAddress: companyAddressTextarea.value,
            companyPhone: companyPhoneInput.value,
            date: dateInput.value,
            quotationNumber: quotationNumberInput.value,
            customerName: customerNameSelect.value, // Get value from select
            customerAddress: customerAddressInput.value,
            customerCellNo: customerCellNoInput.value,
            remarks: remarksTextarea.value,
            sections: []
        };

        document.querySelectorAll('.quotation-section').forEach(sectionDiv => {
            const section = {
                title: sectionDiv.querySelector('.section-title-input').value,
                items: []
            };
            sectionDiv.querySelectorAll('.section-items-table tbody tr').forEach(itemRow => {
                section.items.push({
                    description: itemRow.querySelector('.item-description-input').value,
                    oem: itemRow.querySelector('.item-oem-input').value,
                    spec: itemRow.querySelector('.item-spec-input').value,
                    quantity: itemRow.querySelector('.item-quantity-input').value,
                    unitPrice: itemRow.querySelector('.item-unit-price-input').value,
                });
            });
            data.sections.push(section);
        });
        return data;
    }

    function populateQuotationData(data) {
        quotationSectionsContainer.innerHTML = '';
        sectionCounter = 0;

        documentTypeSelect.value = data.documentType || "QUOTATION";
        companyNameInput.value = data.companyName || "LASERS ENGARVERS (Pvt) Ltd.";
        companyNameDisplay.textContent = companyNameInput.value;
        sloganInput.value = data.slogan || "Where Quality not compromised";
        companyAddressTextarea.value = data.companyAddress || `Address, P.No.SA 06 ST-18 33I/C Korangi\nCity, Karachi`;
        companyPhoneInput.value = data.companyPhone || "00923312551094 / 00923323905847";
        dateInput.value = data.date || new Date().toISOString().split('T')[0];
        quotationNumberInput.value = data.quotationNumber || '';
        customerNameSelect.value = data.customerName || ''; 
        customerAddressInput.value = data.customerAddress || '';
        customerCellNoInput.value = data.customerCellNo || '';
        remarksTextarea.value = data.remarks || '';

        if (data.sections && data.sections.length > 0) {
            data.sections.forEach(sectionData => {
                const newSectionDiv = addNewSection(sectionData.title, false, false);
                const sectionTbody = newSectionDiv.querySelector('.section-items-table tbody');
                if (sectionData.items && sectionData.items.length > 0) {
                    sectionData.items.forEach(itemData => {
                        addNewItemRow(sectionTbody, itemData, false);
                    });
                } else {
                    addNewItemRow(sectionTbody, {}, false);
                }
            });
        } else {
            addNewSection('Product Details', true, false);
            const initialSectionTbody = quotationSectionsContainer.querySelector('.section-items-table tbody');
            if (initialSectionTbody && initialSectionTbody.children.length > 0) {
                const firstItemRow = initialSectionTbody.children[0];
                firstItemRow.querySelector('.item-description-input').value = 'Fabrication of Mechanical Enclosure PR-03616';
                firstItemRow.querySelector('.item-oem-input').value = 'Vendor';
                firstItemRow.querySelector('.item-spec-input').value = 'Dimension: (HxWxD): (1151 x 2024 x 447)mm.\nMaterial: MS 1020\nPowder Coated: Mate Black';
                firstItemRow.querySelector('.item-quantity-input').value = '1';
                firstItemRow.querySelector('.item-unit-price-input').value = '951087';
            }
        }
        addInputListenersToAllFields();
        updateOverallTotals();
    }

    function saveQuotationData() {
        const data = collectQuotationData();
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        console.log('Quotation data saved to local storage.');
    }

    function loadQuotationData() {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                populateQuotationData(data);
                console.log('Quotation data loaded from local storage.');
                return true;
            } catch (e) {
                console.error("Error parsing saved data from local storage:", e);
                return false;
            }
        }
        return false;
    }

    // --- Core Quotation Builder Functions ---

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    function updateOverallTotals() {
        let totalSubAmount = 0;
        document.querySelectorAll('.item-amount-output').forEach(input => {
            const amount = parseFloat(input.value.replace(/[^0-9.-]+/g, ""));
            if (!isNaN(amount)) {
                totalSubAmount += amount;
            }
        });

        const gst = totalSubAmount * GST_RATE;
        const finalTotal = totalSubAmount + gst;

        subTotalSpan.textContent = formatCurrency(totalSubAmount);
        gstAmountSpan.textContent = formatCurrency(gst);
        totalAmountSpan.textContent = formatCurrency(finalTotal);
    }

    function updateItemAmount(itemRow, triggerSave = true) {
        const quantityInput = itemRow.querySelector('.item-quantity-input');
        const unitPriceInput = itemRow.querySelector('.item-unit-price-input');
        const amountOutput = itemRow.querySelector('.item-amount-output');

        const quantity = parseFloat(quantityInput.value) || 0;
        const unitPrice = parseFloat(unitPriceInput.value) || 0;

        const amount = quantity * unitPrice;
        amountOutput.value = formatCurrency(amount);

        updateOverallTotals();
        if (triggerSave) saveQuotationData();
    }

    function addNewItemRow(tbody, initialData = {}, triggerSave = true) {
        const newRow = document.createElement('tr');
        const rowId = `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        newRow.setAttribute('data-row-id', rowId);

        const sNo = tbody.children.length + 1;

        newRow.innerHTML = `
            <td class="col-sno-item" data-label="S. No.">${sNo}</td>
            <td class="col-desc-item" data-label="DESCRIPTION"><textarea class="item-description-input" placeholder="Item Description">${initialData.description || ''}</textarea></td>
            <td class="col-oem-item" data-label="OEM"><input type="text" class="item-oem-input" placeholder="OEM" value="${initialData.oem || ''}"></td>
            <td class="col-spec-item" data-label="Specifications"><textarea class="item-spec-input" placeholder="Specifications / Part Number">${initialData.spec || ''}</textarea></td>
            <td class="col-qty-item" data-label="Quantity"><input type="number" class="item-quantity-input" value="${initialData.quantity || '1'}" min="0"></td>
            <td class="col-price-item" data-label="Unit Price"><input type="number" class="item-unit-price-input" value="${initialData.unitPrice || '0'}" min="0"></td>
            <td class="col-amount-item" data-label="Amount"><input type="text" class="item-amount-output" value="${formatCurrency((initialData.quantity || 0) * (initialData.unitPrice || 0))}" readonly></td>
            <td class="col-action-item"><button class="delete-item-btn"><i class="fas fa-trash-alt"></i></button></td>
        `;

        tbody.appendChild(newRow);

        const quantityInput = newRow.querySelector('.item-quantity-input');
        const unitPriceInput = newRow.querySelector('.item-unit-price-input');
        const deleteBtn = newRow.querySelector('.delete-item-btn');
        const descriptionInput = newRow.querySelector('.item-description-input');
        const oemInput = newRow.querySelector('.item-oem-input');
        const specInput = newRow.querySelector('.item-spec-input');

        quantityInput.addEventListener('input', () => updateItemAmount(newRow));
        unitPriceInput.addEventListener('input', () => updateItemAmount(newRow));
        descriptionInput.addEventListener('input', saveQuotationData);
        oemInput.addEventListener('input', saveQuotationData);
        specInput.addEventListener('input', saveQuotationData);

        deleteBtn.addEventListener('click', () => {
            newRow.remove();
            updateOverallTotals();
            reindexSno(tbody);
            saveQuotationData();
        });

        updateItemAmount(newRow, false);
        if (triggerSave) saveQuotationData();
        return newRow;
    }

    function reindexSno(tbody) {
        Array.from(tbody.children).forEach((row, index) => {
            row.querySelector('.col-sno-item').textContent = index + 1;
        });
    }

    function addNewSection(sectionTitle = 'New Section Title', triggerAddDefaultItem = true, triggerSave = true) {
        sectionCounter++;
        const sectionId = `section-${sectionCounter}`;

        const newSectionDiv = document.createElement('div');
        newSectionDiv.classList.add('quotation-section');
        newSectionDiv.setAttribute('data-section-id', sectionId);

        newSectionDiv.innerHTML = `
            <div class="section-header-bar">
                <input type="text" class="section-title-input" value="${sectionTitle}" placeholder="Enter Section Title">
                <div class="section-buttons">
                    <button class="add-item-btn"><i class="fas fa-plus"></i> Add Item</button>
                    <button class="delete-section-btn"><i class="fas fa-trash-alt"></i> Delete Section</button>
                </div>
            </div>
            <table class="section-items-table">
                <thead>
                    <tr>
                        <th class="col-sno-item">S. No.</th>
                        <th class="col-desc-item">DESCRIPTION</th>
                        <th class="col-oem-item">OEM</th>
                        <th class="col-spec-item">Specifications / Part Number</th>
                        <th class="col-qty-item">Quantity</th>
                        <th class="col-price-item">Unit Price</th>
                        <th class="col-amount-item">Amount</th>
                        <th class="col-action-item"></th>
                    </tr>
                </thead>
                <tbody>
                    </tbody>
            </table>
        `;
        quotationSectionsContainer.appendChild(newSectionDiv);

        const addItemBtn = newSectionDiv.querySelector('.add-item-btn');
        const deleteSectionBtn = newSectionDiv.querySelector('.delete-section-btn');
        const sectionTbody = newSectionDiv.querySelector('.section-items-table tbody');
        const sectionTitleInput = newSectionDiv.querySelector('.section-title-input');

        addItemBtn.addEventListener('click', () => addNewItemRow(sectionTbody));
        deleteSectionBtn.addEventListener('click', () => {
            newSectionDiv.remove();
            updateOverallTotals();
            saveQuotationData();
        });
        sectionTitleInput.addEventListener('input', saveQuotationData);

        if (triggerAddDefaultItem) {
            addNewItemRow(sectionTbody, {}, false);
        }
        if (triggerSave) saveQuotationData();
        return newSectionDiv;
    }

    function addInputListenersToAllFields() {
        const inputsToListen = [
            documentTypeSelect, sloganInput, companyAddressTextarea, companyPhoneInput,
            dateInput, quotationNumberInput,
            customerNameSelect, customerAddressInput, customerCellNoInput, // customerNameSelect here
            remarksTextarea
        ];

        inputsToListen.forEach(input => {
            input.removeEventListener('input', saveQuotationData);
            input.removeEventListener('change', saveQuotationData);
            
            if (input.tagName === 'SELECT' || input.type === 'date') {
                input.addEventListener('change', saveQuotationData);
            } else {
                input.addEventListener('input', saveQuotationData);
            }
        });
    }


    addSectionBtn.addEventListener('click', () => addNewSection());

    newQuotationBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to start a new quotation? All unsaved changes will be lost.')) {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            populateQuotationData({});
            console.log('Started a new blank quotation.');
        }
    });

    companyNameDisplay.addEventListener('dblclick', () => {
        companyNameDisplay.style.display = 'none';
        companyNameInput.style.display = 'inline-block';
        companyNameInput.focus();
        companyNameInput.select();
    });

    companyNameInput.addEventListener('blur', () => {
        companyNameDisplay.textContent = companyNameInput.value;
        companyNameDisplay.style.display = 'block';
        companyNameInput.style.display = 'none';
        saveQuotationData();
    });

    companyNameInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            companyNameInput.blur();
        }
    });

    generatePdfBtn.addEventListener('click', () => {
        const inputsAndSelectsToHide = document.querySelectorAll(
            '.input-field, textarea.input-field, .document-type-select, #customerNameSelect' // Added #customerNameSelect specifically
        );
        const buttonsToHide = document.querySelectorAll(
            '.button-container button, .delete-item-btn, .section-buttons'
        );

        const originalStates = [];

        inputsAndSelectsToHide.forEach(element => {
            originalStates.push({
                element: element,
                originalDisplay: element.style.display,
                originalTagName: element.tagName,
                originalValue: element.value
            });

            if (element.tagName === 'SELECT') {
                const textSpan = document.createElement('span');
                textSpan.className = 'temp-pdf-text';
                textSpan.textContent = element.options[element.selectedIndex].textContent;
                element.parentNode.insertBefore(textSpan, element.nextSibling);
                element.style.display = 'none';
            } else {
                const textSpan = document.createElement('span');
                textSpan.className = 'temp-pdf-text';
                textSpan.textContent = element.value;
                element.parentNode.insertBefore(textSpan, element.nextSibling);
                element.style.display = 'none';
            }
        });

        if (companyNameInput.style.display !== 'none') {
            originalStates.push({
                element: companyNameInput,
                originalDisplay: companyNameInput.style.display,
                originalTagName: companyNameInput.tagName,
                originalValue: companyNameInput.value
            });
            companyNameInput.style.display = 'none';
            companyNameDisplay.textContent = companyNameInput.value;
            companyNameDisplay.style.display = 'block';
        }

        buttonsToHide.forEach(btn => {
            originalStates.push({
                element: btn,
                originalDisplay: btn.style.display
            });
            btn.style.display = 'none';
        });

        const options = {
            margin: [10, 10, 10, 10],
            filename: `${documentTypeSelect.value}_${quotationNumberInput.value || 'New'}_${dateInput.value}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, logging: true, dpi: 192, letterRendering: true, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(options).from(quotationContent).save().then(() => {
            originalStates.forEach(state => {
                state.element.style.display = state.originalDisplay || '';
                const tempTextSpan = state.element.parentNode.querySelector('.temp-pdf-text');
                if (tempTextSpan) {
                    tempTextSpan.remove();
                }
            });

            if (companyNameDisplay.style.display === 'block' && companyNameInput.style.display === 'none') {
                 const wasInputActive = originalStates.some(s => s.element === companyNameInput && s.originalDisplay !== 'none');
                 if (wasInputActive) {
                    companyNameDisplay.style.display = 'none';
                    companyNameInput.style.display = 'inline-block';
                 }
            }
        });
    });

    if (!loadQuotationData()) {
        populateQuotationData({});
    }

    updateOverallTotals();
    addInputListenersToAllFields();
});