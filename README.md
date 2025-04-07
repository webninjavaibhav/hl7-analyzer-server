# Diagnostic Results Processor

A Node.js API for processing HL7 diagnostic results, identifying abnormal test values, and providing patient-specific analysis.

## Overview

This application processes HL7 ORU (Observation Result) messages containing diagnostic test results. It extracts patient information and test observations, then analyzes the results against reference ranges to identify abnormal values. The API provides a structured response with patient details, all observations, and a filtered list of abnormal results for medical professionals to review.

## Features

- **HL7 ORU Message Parsing**: Extracts patient information and test results from HL7 ORU messages
- **Reference Range Analysis**: Compares test values against standard and Everlab reference ranges
- **Abnormal Result Detection**: Identifies test results that fall outside normal ranges
- **Patient-Specific Analysis**: Considers patient age and gender when determining abnormal results
- **CSV Data Integration**: Uses diagnostic metrics from CSV files for reference range comparison

## API Endpoints

### Process Diagnostic File
```
POST /api/diagnostic/process
```

Upload an HL7 ORU file for processing. The API will return patient information, all observations, and abnormal results.

**Request:**
- Content-Type: multipart/form-data
- Body: file (HL7 ORU file)

**Response:**
```json
{
  "success": true,
  "message": "Processed results for patient [Patient Name]",
  "data": {
    "patient": {
      "id": "patient-id",
      "name": "Patient Name",
      "dateOfBirth": "YYYY-MM-DD",
      "gender": "M/F",
      "age": 45
    },
    "observations": [
      {
        "code": "test-code",
        "name": "Test Name",
        "value": 10.5,
        "unit": "unit",
        "referenceRange": "5-15",
        "dateTime": "YYYY-MM-DD HH:MM:SS"
      }
    ],
    "abnormalResults": [
      {
        "code": "test-code",
        "name": "Test Name",
        "value": 20.5,
        "unit": "unit",
        "referenceRange": "5-15",
        "dateTime": "YYYY-MM-DD HH:MM:SS",
        "isAbnormal": true,
        "metricName": "Metric Name",
        "standardRange": "5-15",
        "everlabRange": "4-16"
      }
    ]
  }
}
```

## Project Structure

- `src/controllers/`: Request handlers
- `src/routes/`: API route definitions
- `src/services/`: Business logic and data processing
- `src/interfaces/`: TypeScript interfaces
- `src/utils/`: Utility functions
- `src/config/`: Configuration files
- `src/middlewares/`: Express middlewares
- `diagnostics-files/`: CSV files with reference data

## Data Files

The application uses the following CSV files for reference data:

- `diagnostic_metrics.csv`: Contains reference ranges and diagnostic metrics
- `diagnostics.csv`: Contains diagnostic information
- `diagnostic_groups.csv`: Contains diagnostic group information
- `conditions.csv`: Contains condition information

## Technologies Used

- Node.js
- Express.js
- TypeScript
- CSV Parser
- Multer (for file uploads) 
- Colors (for console logging)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server Configuration
PORT=5057                    # Port number for the server to listen on
NODE_ENV=development         # Environment mode (development/production)

# API Configuration
API_BASE_URL=/api/v1        # Base URL for API endpoints
CORS_ORIGIN=*               # CORS allowed origins (all origins allowed)

# Logging Configuration
LOG_LEVEL=info              # Logging level (info/debug/error)
SHOW_ERRORS=true           # Whether to show detailed error messages
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```
3. Create a `.env` file in the root directory with the required environment variables
4. Build the application:
   ```
   npm run build
   ```
   or
   ```
   yarn build
   ```
5. Start the server:
   ```
   npm start
   ```
   or
   ```
   yarn start
   ```

For development:
```
npm run dev
```
or
```
yarn dev
```
