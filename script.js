let users = [];
let editIndex = null;
let uploadedUsernames = [];

// Load users from Google Sheets CSV on page load
window.onload = function() {
    fetchCSV();
};

async function fetchCSV() {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfe7qHbNpU1WKD6akoidMCvKdVrNGmWpQvPfACUo_Cy7chp0bA3r0o_3W4xdlWGLxzpzHbx9SdJZ_0/pub?output=csv';
    const response = await fetch(csvUrl);
    const data = await response.text();
    parseCSV(data);
}

function parseCSV(data) {
    const rows = data.split('\n').map(row => row.split(','));
    // Assuming the first row contains headers
    const headers = rows[0];
    users = rows.slice(1).map(row => {
        const userObject = {};
        headers.forEach((header, index) => {
            userObject[header] = row[index]; // Create an object for each user
        });
        return userObject;
    });
    updateTable();
}

function saveData() {
    const brands = document.getElementById('brands').value;
    const date = document.getElementById('date').value;
    const username = document.getElementById('username').value;
    const status = document.getElementById('status').value;
    const bonusType = document.getElementById('bonus-type').value;
    const riskRemark = document.getElementById('risk-remark').value;
    const connection = document.getElementById('connection').value;
    const pic = document.getElementById('pic').value;

    if (!brands || !date || !username) {
        alert('Brands, Date, and Username are required fields.');
        return;
    }

    const existingUser = users.find(user => user.Username === username && user.Brands === brands);
    if (existingUser && editIndex === null) {
        alert('Username already exists with the same brand. Please choose a different username.');
        return;
    }

    let remarkOnPlayerProfile = '';
    if (bonusType && bonusType !== 'Normal Deposit' && bonusType !== 'Fraud') {
        remarkOnPlayerProfile += bonusType + ' - ';
    }
    if (riskRemark) {
        remarkOnPlayerProfile += riskRemark;
    }
    if (connection) {
        if (bonusType === 'Fraud' || (bonusType === 'Normal Deposit' && riskRemark.includes('Hedging'))) {
            remarkOnPlayerProfile += ` With UID (${connection})`;
        } else if (bonusType === 'Observation') {
            remarkOnPlayerProfile += ` (${connection})`;
        } else if (riskRemark === 'MAC') {
            remarkOnPlayerProfile += ` (${connection})`;
        } else {
            remarkOnPlayerProfile += ` MAC (${connection})`;
        }
    }

    const newUser = {
        Brands: brands,
        Date: date,
        Username: username,
        Status: status,
        BonusType: bonusType,
        RiskRemark: riskRemark,
        Connection: connection,
        PIC: pic,
        RemarkOnPlayerProfile: remarkOnPlayerProfile
    };

    if (editIndex !== null) {
        users[editIndex] = newUser;
        alert("User updated successfully!");
        editIndex = null;
    } else {
        users.push(newUser);
        alert("User saved successfully!");
    }

    updateTable();
    clearFormFields();
}

function updateTable() {
    const tableBody = document.querySelector('#summary-table tbody');
    tableBody.innerHTML = '';
    users.forEach((user, index) => {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${user.Brands}</td>
            <td>${user.Date}</td>
            <td>${user.Username}</td>
            <td>${user.Status}</td>
            <td>${user.BonusType}</td>
            <td>${user.RiskRemark}</td>
            <td>${user.Connection}</td>
            <td>${user.PIC}</td>
            <td>${user.RemarkOnPlayerProfile}</td>
            <td>
                <button onclick="editRow(${index})"><i class="fas fa-edit"></i></button>
                <button onclick="deleteRow(${index})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(newRow);
    });
}

function deleteRow(index) {
    users.splice(index, 1);
    updateTable();
    alert('Row deleted successfully!');
}

function editRow(index) {
    const user = users[index];
    document.getElementById('brands').value = user.Brands;
    document.getElementById('date').value = user.Date;
    document.getElementById('username').value = user.Username;
    document.getElementById('status').value = user.Status;
    document.getElementById('bonus-type').value = user.BonusType;
    document.getElementById('risk-remark').value = user.RiskRemark;
    document.getElementById('connection').value = user.Connection;
    document.getElementById('pic').value = user.PIC;
    editIndex = index;
}

function clearFormFields() {
    document.getElementById('brands').value = '';
    document.getElementById('date').value = '';
    document.getElementById('username').value = '';
    document.getElementById('status').value = '';
    document.getElementById('bonus-type').value = '';
    document.getElementById('risk-remark').value = '';
    document.getElementById('connection').value = '';
    document.getElementById('pic').value = '';
}

// Toggle Summary Section
function toggleSummary() {
    const container = document.getElementById('summary-container');
    container.style.display = container.style.display === 'none' || container.style.display === '' ? 'block' : 'none';
}

// Summary Reports Generation
function generateSummary() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    if (!startDate || !endDate) {
        alert('Please select both start and end dates.');
        return;
    }

    // Get filtered data
    const filteredData = users.filter(user => user.Date >= startDate && user.Date <= endDate);

    displayBrandSummary(filteredData);
}

// Display the brand summary report
function displayBrandSummary(data) {
    const brandSummariesContainer = document.getElementById('brand-summaries');
    brandSummariesContainer.innerHTML = ''; // Clear previous summaries
    const summaryData = {};

    // Collect counts for each brand and bonus type
    data.forEach(user => {
        if (!summaryData[user.Brands]) {
            summaryData[user.Brands] = {};
        }
        if (!summaryData[user.Brands][user.BonusType]) {
            summaryData[user.Brands][user.BonusType] = 0;
        }
        summaryData[user.Brands][user.BonusType]++;
    });

    // Prepare for rendering summary
    const brands = Object.keys(summaryData);
    const bonusTypes = new Set();

    // Collect all bonus types across brands
    brands.forEach(brand => {
        Object.keys(summaryData[brand]).forEach(bonusType => {
            bonusTypes.add(bonusType);
        });
    });

    // Create an array from the set of bonus types
    const bonusTypesArray = Array.from(bonusTypes);

    // Create the header row for the brand summary
    let summaryHtml = '<h3>Bonus Type: ';
    bonusTypesArray.forEach(type => {
        summaryHtml += `<strong>${type}</strong> `;
    });
    summaryHtml += '</h3>';
    summaryHtml += '<table><tr><th>Brand</th>';

    // Add brands in table header
    brands.forEach(brand => {
        summaryHtml += `<th>${brand}</th>`;
    });
    summaryHtml += '</tr>';

    // Create the rows for each bonus type
    bonusTypesArray.forEach(bonusType => {
        summaryHtml += `<tr><td>${bonusType}</td>`;
        brands.forEach(brand => {
            const count = summaryData[brand][bonusType] || 0;
            summaryHtml += `<td>${count}</td>`;
        });
        summaryHtml += '</tr>';
    });

    // Add grand totals
    summaryHtml += '<tr><td><strong>Grand Total:</strong></td>';
    brands.forEach(brand => {
        const grandTotal = bonusTypesArray.reduce((sum, type) => {
            return sum + (summaryData[brand][type] || 0);
        }, 0);
        summaryHtml += `<td>${grandTotal}</td>`;
    });
    summaryHtml += '</tr>';
    summaryHtml += '</table>';

    // Insert summary HTML into the container
    brandSummariesContainer.innerHTML = summaryHtml;
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        uploadedUsernames = content.split('\n').map(name => name.trim()).filter(name => name);
        const usernameOutput = document.getElementById('uploaded-usernames-output');
        usernameOutput.innerHTML = uploadedUsernames.join('<br>');
        populateMassDropdowns();
        document.getElementById('uploaded-usernames-section').style.display = 'block';
    };
    reader.readAsText(file);
}

function populateMassDropdowns() {
    const riskRemarkSelect = document.getElementById('mass-remark');
    const picSelect = document.getElementById('mass-pic');
    const brandSelect = document.getElementById('mass-brands');

    const riskRemarks = [
        "Suspicious Activity Identified",
        "Suspicious Activity Identified - Fund In / Fund Out",
        "Hedging Betting Pattern Cross Brands",
        "Hedging Betting Pattern",
        "Suspicious Activity detected by the game provider, indicating a potential fixed game.",
        "Suspicious Activity: identical games and repeated betting patterns / Self-Dealing",
        "Suspicious Activity: detected by the game provider, indicating a potential group betting arbitrage players.",
        "Suspicious Activity: Play With Excluded Games",
        "Suspicious Activity detected: identical games and repeated betting patterns"
    ];
    riskRemarks.forEach(remark => {
        const option = document.createElement('option');
        option.value = remark;
        option.text = remark;
        riskRemarkSelect.appendChild(option);
    });

    const picOptions = ["Chad", "Buth", "Dara", "Jita"];
    picOptions.forEach(pic => {
        const option = document.createElement('option');
        option.value = pic;
        option.text = pic;
        picSelect.appendChild(option);
    });

    const brands = [
        "CX BDT", "CX INR", "CX PKR", "CX NPR", "CX USD", "CX LKR", "CX AED", 
        "BJ BDT", "BJ INR", "BJ PKR", "BJ NPR", "BJ PHP", "BJ VND", "BJ THB", "BJ MMK",
        "MP BDT", "MP INR", "MP PKR", "MP NPR", "DP BDT", "KV BDT", "HB BDT", "JB BDT",
        "SB BDT", "SLB BDT", "JW BDT", "JW INR", "BJD BDT", "BN BDT"
    ];
    brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        option.text = brand;
        brandSelect.appendChild(option);
    });
}

function submitUsernames() {
    const action = document.getElementById('mass-action').value;
    const status = document.getElementById('mass-status').value;
    const massRemark = document.getElementById('mass-remark').value;
    const massPIC = document.getElementById('mass-pic').value;
    const massBrand = document.getElementById('mass-brands').value;
    const bonusType = document.getElementById('bonus-type').value; 

    if (!massBrand || !status || !massRemark || !massPIC || !bonusType) {
        alert('Please select a brand, status, risk remark, PIC, and bonus type.');
        return;
    }

    if (action === 'Add') {
        uploadedUsernames.forEach(username => {
            const newUser = {
                Brands: massBrand,
                Date: new Date().toLocaleDateString(),
                Username: username,
                Status: status,
                BonusType: bonusType,
                RiskRemark: massRemark,
                Connection: document.getElementById('connection').value,
                PIC: massPIC,
                RemarkOnPlayerProfile: generateRemarkOnPlayerProfile(status)
            };
            users.push(newUser);
        });
        alert('Usernames added successfully!');
    } else if (action === 'Remove') {
        uploadedUsernames.forEach(username => {
            const index = users.findIndex(user => user.Username === username);
            if (index !== -1) {
                users.splice(index, 1);
            }
        });
        alert('Usernames removed successfully!');
    }

    updateTable();
    document.getElementById('uploaded-usernames-section').style.display = 'none';
}

function generateRemarkOnPlayerProfile(status) {
    const connection = document.getElementById('connection').value;
    let remark = "Status: " + status;
    if (connection) {
        remark += ` - Connection: ${connection}`;
    }
    return remark;
}

function clearUploadedUsernames() {
    uploadedUsernames = [];
    document.getElementById('uploaded-usernames-output').innerHTML = '';
    document.getElementById('uploaded-usernames-section').style.display = 'none';
}
