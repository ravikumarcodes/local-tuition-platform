function Fees() {
  return (
    <div className="fees-page">

      <div className="page-header">

        <div>
          <h1>Fees</h1>
          <p>Manage student fees and payments.</p>
        </div>

        <button className="primary-button">
          + Collect Fee
        </button>

      </div>


      {/* Fee Summary */}

      <div className="fee-summary-grid">

        <div className="fee-summary-card">
          <span>Total Fees</span>
          <h2>₹45,000</h2>
          <p>Monthly expected</p>
        </div>

        <div className="fee-summary-card">
          <span>Collected</span>
          <h2>₹32,500</h2>
          <p>Received this month</p>
        </div>

        <div className="fee-summary-card">
          <span>Pending</span>
          <h2>₹12,500</h2>
          <p>Yet to collect</p>
        </div>

        <div className="fee-summary-card">
          <span>Students</span>
          <h2>40</h2>
          <p>Active students</p>
        </div>

      </div>


      {/* Fee Records */}

      <div className="dashboard-card">

        <div className="card-header">

          <div>
            <h2>💰 Fee Records</h2>
            <p>Recent student fee payments.</p>
          </div>

          <span>June 2026</span>

        </div>


        <div className="fee-table">

          <div className="fee-table-row fee-table-heading">
            <span>Student</span>
            <span>Class</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Date</span>
          </div>


          <div className="fee-table-row">
            <span>Rahul</span>
            <span>8</span>
            <span>₹1,000</span>
            <span className="fee-status paid">Paid</span>
            <span>15 Jun</span>
          </div>


          <div className="fee-table-row">
            <span>Veer</span>
            <span>4</span>
            <span>₹800</span>
            <span className="fee-status pending">Pending</span>
            <span>-</span>
          </div>


          <div className="fee-table-row">
            <span>Hina</span>
            <span>7</span>
            <span>₹1,000</span>
            <span className="fee-status paid">Paid</span>
            <span>10 Jun</span>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Fees;