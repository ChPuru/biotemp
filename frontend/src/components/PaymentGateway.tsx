// frontend/src/components/PaymentGateway.tsx
import React, { useState } from 'react';

interface PaymentGatewayProps {
  amount: number;
  currency: string;
  itemName: string;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
}

const PaymentGateway: React.FC<PaymentGatewayProps> = ({
  amount,
  currency,
  itemName,
  onSuccess,
  onError,
  onClose
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [selectedBank, setSelectedBank] = useState('');

  const indianBanks = [
    'State Bank of India',
    'HDFC Bank',
    'ICICI Bank',
    'Axis Bank',
    'Kotak Mahindra Bank',
    'Punjab National Bank',
    'Bank of Baroda',
    'Canara Bank',
    'Union Bank of India',
    'Indian Bank'
  ];

  const processPayment = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock payment ID
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate success (90% success rate)
      if (Math.random() > 0.1) {
        onSuccess(paymentId);
      } else {
        throw new Error('Payment failed due to insufficient funds');
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUPIPayment = () => {
    if (!upiId || !upiId.includes('@')) {
      onError('Please enter a valid UPI ID');
      return;
    }
    processPayment();
  };

  const handleCardPayment = () => {
    if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.name) {
      onError('Please fill all card details');
      return;
    }
    if (cardDetails.number.length < 16) {
      onError('Please enter a valid card number');
      return;
    }
    processPayment();
  };

  const handleNetBankingPayment = () => {
    if (!selectedBank) {
      onError('Please select your bank');
      return;
    }
    processPayment();
  };

  return (
    <div className="payment-gateway-overlay">
      <div className="payment-gateway-modal">
        <div className="payment-header">
          <h2>Complete Payment</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="payment-summary">
          <h3>{itemName}</h3>
          <div className="amount">
            <span className="currency">{currency}</span>
            <span className="value">{amount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="payment-methods">
          <h4>Select Payment Method</h4>
          
          <div className="method-tabs">
            <button 
              className={`method-tab ${selectedMethod === 'upi' ? 'active' : ''}`}
              onClick={() => setSelectedMethod('upi')}
            >
              🏦 UPI
            </button>
            <button 
              className={`method-tab ${selectedMethod === 'card' ? 'active' : ''}`}
              onClick={() => setSelectedMethod('card')}
            >
              💳 Card
            </button>
            <button 
              className={`method-tab ${selectedMethod === 'netbanking' ? 'active' : ''}`}
              onClick={() => setSelectedMethod('netbanking')}
            >
              🏛️ Net Banking
            </button>
          </div>

          {selectedMethod === 'upi' && (
            <div className="payment-form">
              <h5>UPI Payment</h5>
              <div className="form-group">
                <label>UPI ID</label>
                <input
                  type="text"
                  placeholder="yourname@paytm / yourname@phonepe"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
              <button 
                className="pay-btn"
                onClick={handleUPIPayment}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : `Pay ₹${amount.toLocaleString('en-IN')}`}
              </button>
            </div>
          )}

          {selectedMethod === 'card' && (
            <div className="payment-form">
              <h5>Card Payment</h5>
              <div className="form-group">
                <label>Card Number</label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails({...cardDetails, number: e.target.value.replace(/\s/g, '')})}
                  maxLength={16}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                    maxLength={5}
                  />
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                    maxLength={3}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Cardholder Name</label>
                <input
                  type="text"
                  placeholder="Name on Card"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                />
              </div>
              <button 
                className="pay-btn"
                onClick={handleCardPayment}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : `Pay ₹${amount.toLocaleString('en-IN')}`}
              </button>
            </div>
          )}

          {selectedMethod === 'netbanking' && (
            <div className="payment-form">
              <h5>Net Banking</h5>
              <div className="form-group">
                <label>Select Your Bank</label>
                <select 
                  value={selectedBank} 
                  onChange={(e) => setSelectedBank(e.target.value)}
                >
                  <option value="">Choose Bank</option>
                  {indianBanks.map(bank => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>
              <button 
                className="pay-btn"
                onClick={handleNetBankingPayment}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : `Pay ₹${amount.toLocaleString('en-IN')}`}
              </button>
            </div>
          )}
        </div>

        <div className="security-info">
          <p>🔒 Your payment is secured with 256-bit SSL encryption</p>
          <p>💳 We support all major Indian banks and UPI providers</p>
        </div>
      </div>

      <style>{`
        .payment-gateway-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .payment-gateway-modal {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .payment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid #eee;
          padding-bottom: 15px;
        }

        .payment-header h2 {
          margin: 0;
          color: #333;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .payment-summary {
          text-align: center;
          margin-bottom: 25px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .payment-summary h3 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .amount {
          font-size: 28px;
          font-weight: bold;
          color: #2c3e50;
        }

        .currency {
          font-size: 20px;
          margin-right: 5px;
        }

        .payment-methods h4 {
          margin-bottom: 15px;
          color: #333;
        }

        .method-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .method-tab {
          flex: 1;
          padding: 12px;
          border: 2px solid #e9ecef;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .method-tab:hover {
          border-color: #007bff;
        }

        .method-tab.active {
          border-color: #007bff;
          background: #e3f2fd;
          color: #1976d2;
        }

        .payment-form {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .payment-form h5 {
          margin: 0 0 15px 0;
          color: #333;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-row {
          display: flex;
          gap: 15px;
        }

        .form-row .form-group {
          flex: 1;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: #555;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 12px;
          border: 2px solid #e9ecef;
          border-radius: 6px;
          font-size: 14px;
          box-sizing: border-box;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #007bff;
        }

        .pay-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .pay-btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .pay-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .security-info {
          text-align: center;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #eee;
        }

        .security-info p {
          margin: 5px 0;
          font-size: 12px;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default PaymentGateway;
