# Email Automation with UiPath

## Project Overview

This project implements an automated email monitoring and processing system using UiPath for workflow automation. The system monitors specified Gmail accounts, extracts order information from incoming emails, and processes it through a backend API. What sets this project apart is its intelligent workflow configuration interface and advanced ML-powered processing capabilities.

## Architecture

The solution consists of several components:

1. **UiPath Email Automation Workflow**
   - Authenticates with Gmail using OAuth 2.0
   - Monitors inbox for new emails
   - Extracts email content and metadata
   - Formats data for backend processing
   - Sends structured data to the API

2. **Frontend Application**
   - Interactive Canvas Interface for Workflow Configuration
     - Drag-and-drop workflow builder for manufacturers
     - Visual representation of email processing pipeline
     - Real-time workflow validation and testing
     - Customizable nodes for different processing stages
   - Email Configuration Management
     - OAuth authentication with Gmail
     - Folder and subject pattern configuration
     - Polling interval settings
   - Workflow Visualization
     - Real-time status monitoring
     - Processing statistics and analytics
     - Error tracking and debugging
   - Order Management Dashboard
     - Processed orders overview
     - Special request handling
     - Order status tracking

3. **Backend API**
   - Receives email data from UiPath
   - ML-Powered Processing Pipeline
     - Email Parser Model: Extracts structured data from emails
     - BERT Model: Identifies and classifies special requests
   - Validates and processes orders
   - Stores data in database

## Workflow Process

1. **Authentication**
   - UiPath fetches an auth token for the specified email
   - OAuth 2.0 flow handles user permission and token exchange
   - Access tokens are stored securely for subsequent access

2. **Email Monitoring**
   - UiPath uses the auth token to access Gmail API
   - Retrieves latest emails from the configured folder (default: INBOX)
   - Filters emails based on configured subject patterns (optional)

3. **Data Extraction**
   - Email content is extracted and semi-structured
   - Metadata (From, To, Subject) is parsed
   - ML Models Process the Content:
     - Email Parser Model: Identifies products, quantities, and order details
     - BERT Model: Analyzes email content for special requests and exceptions
   - Structured data is prepared for order processing

4. **Backend Processing**
   - Structured email data is sent to the backend API
   - ML models process the content:
     - Parser identifies products and quantities
     - BERT model flags special requests for review
   - Orders are created in the database
   - Special requests are flagged for manual review

## Frontend Features

### Interactive Canvas Interface
- **Visual Workflow Builder**
  - Drag-and-drop interface for workflow configuration
  - Pre-built nodes for common operations
  - Custom node creation capabilities
  - Real-time validation and error checking

- **Node Types**
  - Email Configuration Node
  - Product Processing Node
  - Exception Handling Node
  - Invoice Generation Node
  - Price Adjustment Node
  - Notification Node

- **Workflow Management**
  - Save and load workflow configurations
  - Version control for workflows
  - Workflow templates
  - Export/Import capabilities

### ML Model Integration
- **Email Parser Model**
  - Extracts structured data from unstructured emails
  - Identifies product names and quantities
  - Handles various email formats and layouts
  - Continuous learning from new email patterns

- **BERT Model for Special Requests**
  - Natural language understanding for email content
  - Identifies special requests and exceptions
  - Classifies request types and priorities
  - Improves accuracy with training data

## Configuration

The system can be configured through the email configuration interface:

- **Email Address**: The Gmail account to monitor
- **Folder**: Which email folder to check (default: INBOX)
- **Subject Pattern**: Optional filter for specific email subjects
- **Polling Interval**: How frequently to check for new emails
- **Workflow Settings**: Configure processing rules and ML model parameters

## Technology Stack

- **UiPath**: Workflow automation platform
- **Gmail API**: Email access and monitoring
- **OAuth 2.0**: Secure authentication
- **Node.js**: Backend API and processing
- **Next.js**: Frontend framework
- **Supabase**: Database for token and order storage
- **TensorFlow**: ML model framework
- **BERT**: Natural language processing model
- **React Flow**: Canvas interface implementation

## Setup and Installation

1. **Prerequisites**
   - UiPath Studio installed
   - Node.js and npm installed
   - Gmail account with API access enabled
   - Python 3.8+ for ML models

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **ML Models Setup**
   ```bash
   cd ml_models
   pip install -r requirements.txt
   python setup_models.py
   ```

5. **UiPath Configuration**
   - Import the workflow package
   - Configure connection settings
   - Run the workflow

## Security Considerations

- OAuth tokens are stored securely in the database
- Access is limited to authorized email accounts only
- Refresh tokens are used to maintain access without user intervention
- Sensitive data is encrypted in transit and at rest
- ML model data is protected and access-controlled

## API Endpoints

- `POST /api/email/process`: Receives and processes email data from UiPath
- `GET /api/oauth2callback`: Handles OAuth token exchange
- `GET /api/gettokens`: Retrieves stored tokens for authentication
- `POST /api/ml/parse`: Email parsing endpoint
- `POST /api/ml/analyze`: Special request analysis endpoint

## Database Schema

The system utilizes several database tables:
- `oauth_tokens`: Stores authentication tokens for Gmail access
- `email_configurations`: Stores email monitoring settings
- `orders`: Stores processed orders from emails
- `order_items`: Stores line items for each order
- `workflow_configurations`: Stores canvas workflow settings
- `ml_model_data`: Stores ML model training and configuration data

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

[MIT License](LICENSE) 
