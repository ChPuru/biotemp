import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Send error to monitoring service
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In production, send to error monitoring service
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Example: send to your error monitoring service
    // fetch('/api/log-error', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorData)
    // });

    console.error('Error logged:', errorData);
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-container">
            <h2>🚨 Something went wrong</h2>
            <p>We apologize for the inconvenience. An unexpected error occurred in the BioMapper application.</p>
            
            <div className="error-actions">
              <button 
                onClick={this.handleRetry}
                className="retry-button"
              >
                🔄 Try Again
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="reload-button"
              >
                🔃 Reload Page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <div className="error-info">
                  <h4>Error:</h4>
                  <pre>{this.state.error?.toString()}</pre>
                  
                  <h4>Component Stack:</h4>
                  <pre>{this.state.errorInfo?.componentStack}</pre>
                  
                  <h4>Stack Trace:</h4>
                  <pre>{this.state.error?.stack}</pre>
                </div>
              </details>
            )}
          </div>

          <style>{`
            .error-boundary {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 400px;
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            
            .error-container {
              background: white;
              border-radius: 12px;
              padding: 30px;
              max-width: 600px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
              text-align: center;
            }
            
            .error-container h2 {
              color: #e74c3c;
              margin-bottom: 15px;
              font-size: 24px;
            }
            
            .error-container p {
              color: #666;
              margin-bottom: 25px;
              line-height: 1.6;
            }
            
            .error-actions {
              display: flex;
              gap: 15px;
              justify-content: center;
              margin-bottom: 25px;
            }
            
            .retry-button, .reload-button {
              padding: 12px 24px;
              border: none;
              border-radius: 6px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
            }
            
            .retry-button {
              background: #27ae60;
              color: white;
            }
            
            .retry-button:hover {
              background: #229954;
              transform: translateY(-2px);
            }
            
            .reload-button {
              background: #3498db;
              color: white;
            }
            
            .reload-button:hover {
              background: #2980b9;
              transform: translateY(-2px);
            }
            
            .error-details {
              text-align: left;
              margin-top: 20px;
              border: 1px solid #ddd;
              border-radius: 6px;
              padding: 15px;
              background: #f8f9fa;
            }
            
            .error-details summary {
              cursor: pointer;
              font-weight: 600;
              color: #e74c3c;
              margin-bottom: 10px;
            }
            
            .error-info h4 {
              color: #2c3e50;
              margin: 15px 0 5px 0;
              font-size: 14px;
            }
            
            .error-info pre {
              background: #2c3e50;
              color: #ecf0f1;
              padding: 10px;
              border-radius: 4px;
              overflow-x: auto;
              font-size: 12px;
              white-space: pre-wrap;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
