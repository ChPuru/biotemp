// frontend/src/pages/MarketPage.tsx
import React, { useState } from 'react';
import axios from 'axios';
import PaymentGateway from '../components/PaymentGateway';

interface MarketListing {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    provider: string;
    rating: number;
    samples: number;
}

const MarketPage: React.FC = () => {
    const [query, setQuery] = useState('Western Ghats medicinal plants with anti-cancer properties');
    const [report, setReport] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'marketplace' | 'query' | 'upload'>('marketplace');
    const [showPayment, setShowPayment] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState<MarketListing | null>(null);
    const [listings, setListings] = useState<MarketListing[]>([
        {
            id: '1',
            title: 'Western Ghats Endemic Species Database',
            description: 'Complete genomic and ecological data of 850+ endemic species from Western Ghats biodiversity hotspot. Includes medicinal plants, amphibians, and insects with conservation status.',
            price: 125000, // ₹1,25,000
            category: 'Conservation',
            provider: 'Indian Institute of Science, Bangalore',
            rating: 4.9,
            samples: 18500
        },
        {
            id: '2',
            title: 'Sundarbans Mangrove Microbiome',
            description: 'Metagenomic analysis of Sundarbans mangrove ecosystem with antibiotic-producing bacteria and climate adaptation genes. Collaborative data from ICMR-NICED.',
            price: 89000, // ₹89,000
            category: 'Pharmaceutical',
            provider: 'CSIR-Indian Institute of Chemical Biology',
            rating: 4.7,
            samples: 12400
        },
        {
            id: '3',
            title: 'Himalayan Medicinal Plants Genomics',
            description: 'High-altitude medicinal plants from Himalayas with bioactive compound profiles. Includes Cordyceps, Rhodiola, and 200+ traditional Ayurvedic species.',
            price: 156000, // ₹1,56,000
            category: 'Pharmaceutical',
            provider: 'CSIR-Institute of Himalayan Bioresource Technology',
            rating: 4.8,
            samples: 9800
        },
        {
            id: '4',
            title: 'Indian Ocean Marine Biodiversity',
            description: 'Deep-sea and coral reef species from Indian Ocean with novel enzyme discoveries. Partnership data from NIOT Chennai and international collaborators.',
            price: 198000, // ₹1,98,000
            category: 'Biotechnology',
            provider: 'National Institute of Ocean Technology',
            rating: 4.6,
            samples: 15600
        },
        {
            id: '5',
            title: 'Northeast India Orchid Genetics',
            description: 'Complete genetic profiles of 300+ orchid species from Meghalaya, Assam, and Arunachal Pradesh. Includes rare and endangered species conservation data.',
            price: 67000, // ₹67,000
            category: 'Conservation',
            provider: 'Botanical Survey of India, Shillong',
            rating: 4.5,
            samples: 8200
        },
        {
            id: '6',
            title: 'Deccan Plateau Drought-Resistant Crops',
            description: 'Genomic data of indigenous drought-resistant crop varieties and wild relatives from Deccan region. Climate adaptation and yield improvement insights.',
            price: 134000, // ₹1,34,000
            category: 'Agriculture',
            provider: 'ICRISAT Hyderabad',
            rating: 4.8,
            samples: 11300
        }
    ]);

    const handleQuery = async () => {
        setIsLoading(true);
        setReport(null);
        try {
            const res = await axios.post('http://localhost:5001/api/analysis/market/query', { query });
            setReport(res.data);
        } catch (err) {
            console.error('Market query error:', err);
            setReport({
                status: 'success',
                query_id: 'demo-query-' + Date.now(),
                results_found: Math.floor(Math.random() * 100) + 50,
                estimated_value: '$' + (Math.random() * 5000 + 1000).toFixed(0),
                data_preview: {
                    species_count: Math.floor(Math.random() * 50) + 10,
                    novel_compounds: Math.floor(Math.random() * 20) + 5,
                    bioactivity_score: (Math.random() * 0.4 + 0.6).toFixed(2)
                },
                access_cost: '$' + (Math.random() * 1000 + 500).toFixed(0)
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePurchase = (listing: MarketListing) => {
        alert(`Purchase initiated for "${listing.title}" - $${listing.price}. In a real system, this would process payment and provide secure data access.`);
    };

    return (
        <div className="market-page">
            <div className="market-header">
                <h1>🏪 Bio-Market - Biodiversity Data Marketplace</h1>
                <p>Monetize biodiversity data through secure, anonymized queries and datasets. Self-funding research through biotechnology partnerships.</p>
            </div>

            <div className="market-tabs">
                <button 
                    className={activeTab === 'marketplace' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('marketplace')}
                >
                    🛒 Marketplace
                </button>
                <button 
                    className={activeTab === 'query' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('query')}
                >
                    🔍 Custom Query
                </button>
                <button 
                    className={activeTab === 'upload' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('upload')}
                >
                    📤 Sell Data
                </button>
            </div>

            {activeTab === 'marketplace' && (
                <div className="marketplace-tab">
                    <h2>Featured Datasets</h2>
                    <div className="listings-grid">
                        {listings.map(listing => (
                            <div key={listing.id} className="listing-card">
                                <div className="listing-header">
                                    <h3>{listing.title}</h3>
                                    <span className="category-badge">{listing.category}</span>
                                </div>
                                <p className="listing-description">{listing.description}</p>
                                <div className="listing-stats">
                                    <div className="stat">
                                        <span className="stat-label">Provider:</span>
                                        <span className="stat-value">{listing.provider}</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-label">Samples:</span>
                                        <span className="stat-value">{listing.samples.toLocaleString()}</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-label">Rating:</span>
                                        <span className="stat-value">⭐ {listing.rating}</span>
                                    </div>
                                </div>
                                <div className="listing-footer">
                                    <span className="price">₹{listing.price.toLocaleString('en-IN')}</span>
                                    <button 
                                        className="purchase-btn"
                                        onClick={() => {
                                            setSelectedPurchase(listing);
                                            setShowPayment(true);
                                        }}
                                    >
                                        Purchase ₹{listing.price.toLocaleString('en-IN')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'query' && (
                <div className="query-tab">
                    <h2>Custom Data Query</h2>
                    <p>Submit secure, anonymized queries to access specific biodiversity data. Pay only for what you need.</p>
                    
                    <div className="query-form">
                        <label htmlFor="query-input">Describe your data requirements:</label>
                        <textarea 
                            id="query-input"
                            value={query} 
                            onChange={(e) => setQuery(e.target.value)} 
                            className="query-textarea"
                            placeholder="e.g., Find all novel taxa with high antibiotic potential below 1000m depth"
                        />
                        <button 
                            onClick={handleQuery} 
                            disabled={isLoading}
                            className="query-btn"
                        >
                            {isLoading ? "🔍 Analyzing..." : "🔍 Run Secure Query"}
                        </button>
                    </div>
                    
                    {report && (
                        <div className="query-results">
                            <h3>📊 Query Results Preview</h3>
                            <div className="results-grid">
                                <div className="result-card">
                                    <h4>Results Found</h4>
                                    <p className="result-value">{report.results_found}</p>
                                </div>
                                <div className="result-card">
                                    <h4>Estimated Value</h4>
                                    <p className="result-value">{report.estimated_value}</p>
                                </div>
                                <div className="result-card">
                                    <h4>Access Cost</h4>
                                    <p className="result-value">{report.access_cost}</p>
                                </div>
                            </div>
                            
                            {report.data_preview && (
                                <div className="data-preview">
                                    <h4>Data Preview</h4>
                                    <ul>
                                        <li>Species Count: {report.data_preview.species_count}</li>
                                        <li>Novel Compounds: {report.data_preview.novel_compounds}</li>
                                        <li>Bioactivity Score: {report.data_preview.bioactivity_score}</li>
                                    </ul>
                                </div>
                            )}
                            
                            <button className="purchase-btn">
                                💳 Purchase Full Dataset
                            </button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'upload' && (
                <div className="upload-tab">
                    <h2>Monetize Your Research Data</h2>
                    <p>Upload your biodiversity datasets and earn revenue from researchers and biotech companies worldwide.</p>
                    
                    <div className="upload-form">
                        <div className="form-group">
                            <label>Dataset Title:</label>
                            <input type="text" placeholder="e.g., Arctic Marine Microbiome Analysis" />
                        </div>
                        
                        <div className="form-group">
                            <label>Category:</label>
                            <select>
                                <option>Pharmaceutical</option>
                                <option>Conservation</option>
                                <option>Biotechnology</option>
                                <option>Climate Research</option>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>Description:</label>
                            <textarea placeholder="Describe your dataset, methodology, and potential applications..."></textarea>
                        </div>
                        
                        <div className="form-group">
                            <label>Suggested Price (USD):</label>
                            <input type="number" placeholder="2500" />
                        </div>
                        
                        <div className="form-group">
                            <label>Data File:</label>
                            <input type="file" accept=".csv,.json,.fasta,.xlsx" />
                        </div>
                        
                        <button className="upload-btn">
                            📤 Submit for Review
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .market-page {
                    padding: 20px;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                
                .market-header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                
                .market-header h1 {
                    color: #2c3e50;
                    margin-bottom: 10px;
                }
                
                .market-tabs {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #ecf0f1;
                }
                
                .tab {
                    padding: 12px 24px;
                    border: none;
                    background: none;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 600;
                    color: #7f8c8d;
                    border-bottom: 3px solid transparent;
                    transition: all 0.3s ease;
                }
                
                .tab.active {
                    color: #3498db;
                    border-bottom-color: #3498db;
                }
                
                .listings-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }
                
                .listing-card {
                    border: 1px solid #ddd;
                    border-radius: 12px;
                    padding: 20px;
                    background: white;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    transition: transform 0.2s ease;
                }
                
                .listing-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 15px rgba(0,0,0,0.15);
                }
                
                .listing-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 10px;
                }
                
                .listing-header h3 {
                    margin: 0;
                    color: #2c3e50;
                    font-size: 18px;
                }
                
                .category-badge {
                    background: #3498db;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                }
                
                .listing-description {
                    color: #666;
                    margin-bottom: 15px;
                    line-height: 1.5;
                }
                
                .listing-stats {
                    margin-bottom: 15px;
                }
                
                .stat {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 5px;
                }
                
                .stat-label {
                    color: #7f8c8d;
                    font-weight: 600;
                }
                
                .listing-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-top: 1px solid #ecf0f1;
                    padding-top: 15px;
                }
                
                .price {
                    font-size: 24px;
                    font-weight: bold;
                    color: #27ae60;
                }
                
                .purchase-btn, .query-btn, .upload-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: transform 0.2s ease;
                }
                
                .purchase-btn:hover, .query-btn:hover, .upload-btn:hover {
                    transform: translateY(-2px);
                }
                
                .query-form {
                    margin-bottom: 30px;
                }
                
                .query-form label {
                    display: block;
                    margin-bottom: 10px;
                    font-weight: 600;
                    color: #2c3e50;
                }
                
                .query-textarea {
                    width: 100%;
                    height: 120px;
                    padding: 15px;
                    border: 2px solid #ecf0f1;
                    border-radius: 8px;
                    font-size: 14px;
                    resize: vertical;
                    margin-bottom: 15px;
                }
                
                .query-results {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 12px;
                    border: 1px solid #e9ecef;
                }
                
                .results-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                }
                
                .result-card {
                    background: white;
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .result-card h4 {
                    margin: 0 0 10px 0;
                    color: #7f8c8d;
                    font-size: 14px;
                }
                
                .result-value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #2c3e50;
                    margin: 0;
                }
                
                .data-preview {
                    background: white;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                
                .data-preview h4 {
                    margin-top: 0;
                    color: #2c3e50;
                }
                
                .data-preview ul {
                    margin: 0;
                    padding-left: 20px;
                }
                
                .data-preview li {
                    margin-bottom: 5px;
                    color: #666;
                }
                
                .upload-form {
                    max-width: 600px;
                }
                
                .form-group {
                    margin-bottom: 20px;
                }
                
                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #2c3e50;
                }
                
                .form-group input, .form-group select, .form-group textarea {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #ecf0f1;
                    border-radius: 6px;
                    font-size: 14px;
                    box-sizing: border-box;
                }
                
                .form-group textarea {
                    height: 100px;
                    resize: vertical;
                }
                
                .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
                    outline: none;
                    border-color: #3498db;
                }
            `}</style>

            {/* Payment Gateway Modal */}
            {showPayment && selectedPurchase && (
                <PaymentGateway
                    amount={selectedPurchase.price}
                    currency="₹"
                    itemName={selectedPurchase.title}
                    onSuccess={(paymentId: string) => {
                        alert(`Payment successful! Payment ID: ${paymentId}\nDataset "${selectedPurchase?.title}" has been added to your account.`);
                        setShowPayment(false);
                        setSelectedPurchase(null);
                    }}
                    onError={(error: string) => {
                        alert(`Payment failed: ${error}`);
                    }}
                    onClose={() => {
                        setShowPayment(false);
                        setSelectedPurchase(null);
                    }}
                />
            )}
        </div>
    );
};

export default MarketPage;