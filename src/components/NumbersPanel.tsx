import { Car, OfferType, Customer } from '../types/game';
import { calculatePayment, calculateOTDFromPayment } from '../utils/gameLogic';

interface NumbersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentCar: Car | null;
  customSellingPrice: number;
  setCustomSellingPrice: (val: number) => void;
  customOTDPrice: number;
  setCustomOTDPrice: (val: number) => void;
  makeOffer: (amount: number, type: OfferType) => void;
  showDealClosed: boolean;
  signDeal: () => void;
  downPayment: number;
  setDownPayment: (val: number) => void;
  paymentAPR: number;
  setPaymentAPR: (val: number) => void;
  paymentTerm: number;
  setPaymentTerm: (val: number) => void;
  customPayment: number;
  setCustomPayment: (val: number) => void;
  isMobile: boolean;
  customer: Customer | null;
  onCustomerUpdate: (customer: Customer) => void;
}

export function NumbersPanel({
  isOpen,
  onClose,
  currentCar,
  customSellingPrice,
  setCustomSellingPrice,
  customOTDPrice,
  setCustomOTDPrice,
  makeOffer,
  showDealClosed,
  signDeal,
  downPayment,
  setDownPayment,
  paymentAPR,
  setPaymentAPR,
  paymentTerm,
  setPaymentTerm,
  customPayment,
  setCustomPayment,
  isMobile,
  customer,
  onCustomerUpdate,
}: NumbersPanelProps) {
  if (!isOpen || !currentCar) return null;

  if (isMobile) {
    return (
      <>
        <div className="panel-backdrop" onClick={onClose} />
        <div className="side-panel">
             <div className="panel-header">
                <h3>Price Breakdown</h3>
                <button className="panel-close" onClick={onClose}>×</button>
            </div>
            <div className="panel-content">
                {/* Reuse the inner form content? */}
                {/* To avoid code duplication, I should extract the FORM part into a sub-component or just render it here. */}
                {/* For now, I will just copy the logic to ensure it works, but that defeats the purpose of "refactoring to reduce size". */}
                {/* I will extract just the content into a helper render function or sub component within this file? No, verify duplication. */}
                {/* The logic inside panel-content is HUGE. I MUST deduplicate it. */}
                <NumbersForm 
                    currentCar={currentCar}
                    customSellingPrice={customSellingPrice}
                    setCustomSellingPrice={setCustomSellingPrice}
                    customOTDPrice={customOTDPrice}
                    setCustomOTDPrice={setCustomOTDPrice}
                    makeOffer={makeOffer}
                    showDealClosed={showDealClosed}
                    signDeal={signDeal}
                    downPayment={downPayment}
                    setDownPayment={setDownPayment}
                    paymentAPR={paymentAPR}
                    setPaymentAPR={setPaymentAPR}
                    paymentTerm={paymentTerm}
                    setPaymentTerm={setPaymentTerm}
                    customPayment={customPayment}
                    setCustomPayment={setCustomPayment}
                    customer={customer}
                    onCustomerUpdate={onCustomerUpdate}
                />
            </div>
        </div>
      </>
    );
  }

  return (
    <div className="side-panel in-container">
         <div className="panel-header">
            <h3>Price Breakdown</h3>
            <button className="panel-close" onClick={onClose}>×</button>
        </div>
        <div className="panel-content">
            <NumbersForm 
                 currentCar={currentCar}
                 customSellingPrice={customSellingPrice}
                 setCustomSellingPrice={setCustomSellingPrice}
                 customOTDPrice={customOTDPrice}
                 setCustomOTDPrice={setCustomOTDPrice}
                 makeOffer={makeOffer}
                 showDealClosed={showDealClosed}
                 signDeal={signDeal}
                 downPayment={downPayment}
                 setDownPayment={setDownPayment}
                 paymentAPR={paymentAPR}
                 setPaymentAPR={setPaymentAPR}
                 paymentTerm={paymentTerm}
                 setPaymentTerm={setPaymentTerm}
                 customPayment={customPayment}
                 setCustomPayment={setCustomPayment}
                 customer={customer}
                 onCustomerUpdate={onCustomerUpdate}
            />
        </div>
    </div>
  );
}

// Internal component to share the form logic
function NumbersForm(props: Omit<NumbersPanelProps, 'isOpen' | 'onClose' | 'isMobile'> & { currentCar: Car }) {
    const {
        currentCar,
        customSellingPrice,
        setCustomSellingPrice,
        customOTDPrice,
        setCustomOTDPrice,
        makeOffer,
        showDealClosed,
        signDeal,
        downPayment,
        setDownPayment,
        paymentAPR,
        setPaymentAPR,
        paymentTerm,
        setPaymentTerm,
        customPayment,
        setCustomPayment,
        customer,
        onCustomerUpdate,
    } = props;

    const runCreditCheck = () => {
        if (!customer) return;
        // Simulate delay? For now instant
        onCustomerUpdate({
            ...customer,
            creditRevealed: true
        });
    };

    const getCreditStatus = (score: number) => {
        if (score >= 720) return { label: 'Excellent', color: '#2ecc71' };
        if (score >= 640) return { label: 'Fair', color: '#f39c12' };
        return { label: 'Poor', color: '#e74c3c' };
    };

    return (
        <div className="numbers-section">
          <div className="internal-info">
            <h4 style={{ color: '#f39c12', marginBottom: '8px', fontSize: '0.8rem' }}>Internal Info</h4>
            <div className="row">
              <span className="label">Invoice Cost:</span>
              <span className="value">${currentCar.invoice.toLocaleString()}</span>
            </div>
            <div className="row">
              <span className="label">Profit:</span>
              <span className={`value profit ${customSellingPrice - currentCar.invoice < 0 ? 'loss' : ''}`}>
                ${(customSellingPrice - currentCar.invoice).toLocaleString()}
              </span>
            </div>
            <div className="row">
              <span className="label">Profit (OTD):</span>
              <span className={`value profit ${Math.round((customOTDPrice - currentCar.fees) / 1.07) - currentCar.invoice < 0 ? 'loss' : ''}`}>
                ${(Math.round((customOTDPrice - currentCar.fees) / 1.07) - currentCar.invoice).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="price-breakdown">
            <div className="row">
              <span>Vehicle Price:</span>
              <span>${currentCar.price.toLocaleString()}</span>
            </div>
            <div className="row">
              <span>Tax (7%):</span>
              <span>${Math.round(customSellingPrice * 0.07).toLocaleString()}</span>
            </div>
            <div className="row">
              <span>Fees:</span>
              <span>${currentCar.fees.toLocaleString()}</span>
            </div>
            <div className="row total">
              <span>Out-the-Door:</span>
              <span>${(customSellingPrice + Math.round(customSellingPrice * 0.07) + currentCar.fees).toLocaleString()}</span>
            </div>
          </div>

          <div className="offer-section">
            <h4>Make Offer</h4>
            <div className="offer-row">
              <label>Selling Price:</label>
              <div className="input-group">
                <input
                  type="number"
                  value={customSellingPrice}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setCustomSellingPrice(val);
                    setCustomOTDPrice(val + Math.round(val * 0.07) + currentCar.fees);
                  }}
                />
              </div>
            </div>
            <div className="offer-row">
              <label>Out-the-Door:</label>
              <div className="input-group">
                <input
                  type="number"
                  value={customOTDPrice}
                  onChange={(e) => {
                    const otd = parseInt(e.target.value) || 0;
                    setCustomOTDPrice(otd);
                    // Back-calculate selling price from OTD
                    const sellingPrice = Math.round((otd - currentCar.fees) / 1.07);
                    setCustomSellingPrice(sellingPrice);
                  }}
                />
                <button className="green" onClick={() => makeOffer(customOTDPrice, 'otd')}>
                  Offer
                </button>
              </div>
            </div>
          </div>

          {showDealClosed && (
            <button className="sign-deal-btn" onClick={signDeal}>
              ✍️ SIGN HERE - SOLD!
            </button>
          )}

          <div className="payment-calculator">
            <h4>Payment Calculator</h4>
            
            {customer && customer.buyerType === 'payment' && (
                <div className="credit-section" style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Credit Status</span>
                        {customer.creditRevealed && (
                            <span style={{ 
                                color: getCreditStatus(customer.creditScore).color, 
                                fontWeight: 'bold' 
                            }}>
                                {customer.creditScore} ({getCreditStatus(customer.creditScore).label})
                            </span>
                        )}
                    </div>
                    
                    {!customer.creditRevealed ? (
                        <button 
                            className="blue" 
                            style={{ width: '100%', padding: '8px' }}
                            onClick={runCreditCheck}
                        >
                            Run Credit Application
                        </button>
                    ) : (
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                           {customer.creditScore < 550 ? (
                               downPayment >= 7500 ? (
                                   <span style={{ color: '#f39c12' }}>⚠️ Approved (High Down Exception)</span>
                               ) : (
                                   <span style={{ color: '#c0392b' }}>⚠️ Bank Declined: Score too low (&lt; $7,500 down).</span>
                               )
                           ) : customer.creditScore < 620 ? (
                               <span style={{ color: '#d35400' }}>⚠️ Subprime: Minimum 10% APR required.</span>
                           ) : (
                               <span style={{ color: '#27ae60' }}>✅ Approved for Tier 1 Rates.</span>
                           )}
                        </div>
                    )}
                </div>
            )}
            <div className="calc-grid">
              <div className="calc-field">
                <label>Down:</label>
                <input
                  type="number"
                  value={downPayment}
                  onChange={(e) => {
                    const dp = parseInt(e.target.value) || 0;
                    setDownPayment(dp);
                    setCustomPayment(calculatePayment(customOTDPrice, dp, paymentAPR, paymentTerm));
                  }}
                />
              </div>
              <div className="calc-field">
                <label>APR:</label>
                <input
                  type="number"
                  step="0.1"
                  value={paymentAPR}
                  onChange={(e) => {
                    const apr = parseFloat(e.target.value) || 0;
                    setPaymentAPR(apr);
                    setCustomPayment(calculatePayment(customOTDPrice, downPayment, apr, paymentTerm));
                  }}
                />
              </div>
              <div className="calc-field">
                <label>Months:</label>
                <select
                  value={paymentTerm}
                  onChange={(e) => {
                    const term = parseInt(e.target.value);
                    setPaymentTerm(term);
                    setCustomPayment(calculatePayment(customOTDPrice, downPayment, paymentAPR, term));
                  }}
                >
                  <option value="36">36</option>
                  <option value="48">48</option>
                  <option value="60">60</option>
                  <option value="72">72</option>
                  <option value="84">84</option>
                </select>
              </div>
            </div>
            <div className="offer-row">
              <label>Monthly Payment:</label>
              <div className="input-group">
                <input
                  type="number"
                  value={customPayment}
                  onChange={(e) => {
                    const payment = parseInt(e.target.value) || 0;
                    setCustomPayment(payment);
                    // Recalculate OTD and selling price based on new payment
                    const newOTD = calculateOTDFromPayment(payment, downPayment, paymentAPR, paymentTerm);
                    setCustomOTDPrice(newOTD);
                    setCustomSellingPrice(Math.round((newOTD - currentCar.fees) / 1.07));
                  }}
                />
                <button 
                  className="purple" 
                  onClick={() => makeOffer(customPayment, 'payment')}
                  disabled={customer?.buyerType === 'payment' && (!customer.creditRevealed || (customer.creditScore < 550 && downPayment < 7500))}
                  style={{ 
                    opacity: customer?.buyerType === 'payment' && (!customer.creditRevealed || (customer.creditScore < 550 && downPayment < 7500)) ? 0.5 : 1, 
                    cursor: customer?.buyerType === 'payment' && (!customer.creditRevealed || (customer.creditScore < 550 && downPayment < 7500)) ? 'not-allowed' : 'pointer' 
                  }}
                >
                  Offer
                </button>
              </div>
            </div>
            <div className="calculated-payment">
              Calculated: ${calculatePayment(customOTDPrice, downPayment, paymentAPR, paymentTerm)}/mo
              <br />
              <span className={`profit ${Math.round((customOTDPrice - currentCar.fees) / 1.07) - currentCar.invoice < 0 ? 'loss' : ''}`} style={{ color: 'inherit' }}>
                Payment Profit: ${(Math.round((customOTDPrice - currentCar.fees) / 1.07) - currentCar.invoice).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
    );
}
