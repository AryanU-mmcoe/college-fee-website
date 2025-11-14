async function generateReceipt() {
    const prn = document.getElementById("prn").value.trim();

    if (!prn) {
        alert("Enter PRN!");
        return;
    }

    const url = "https://raw.githubusercontent.com/AryanU-mmcoe/college-fee-website/main/students.json";

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data[prn]) {
            alert("Student Not Found!");
            return;
        }

        const s = data[prn];
        const remaining = s.totalFees - s.feesPaid;

        const receipt = document.getElementById("receipt");
        receipt.style.display = "block";

        receipt.innerHTML = `
            <h3>MMCOE – Fee Receipt</h3>
            <p><b>Name:</b> ${s.name}</p>
            <p><b>PRN:</b> ${s.prn}</p>
            <p><b>Date of Birth:</b> ${s.dob}</p>
            <p><b>Branch:</b> ${s.branch}</p>
            <p><b>Class:</b> ${s.class}</p>
            <p><b>Total Fees:</b> ₹${s.totalFees}</p>
            <p><b>Fees Paid:</b> ₹${s.feesPaid}</p>
            <p><b>Remaining:</b> ₹${remaining}</p>

            <div class="actions">
                <button class="small-btn" onclick="window.print()">Print</button>
                <button class="small-btn" onclick="downloadPDF()">Download PDF</button>
            </div>
        `;
    } catch (err) {
        alert("Error loading student data");
        console.error(err);
    }
}


// PDF DOWNLOAD
function downloadPDF() {
    const element = document.getElementById("receipt");

    const opt = {
        margin:       10,
        filename:     'MMCOE_Fee_Receipt.pdf',
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save();
}
