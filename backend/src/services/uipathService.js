import { UIPATH_CLIENT_ID, UIPATH_CLIENT_SECRET, UIPATH_ACCOUNT_NAME } from '../config';

export class UiPathService {
  constructor() {
    this.authToken = null;
  }

  async authenticate() {
    const response = await fetch('https://cloud.uipath.com/identity_/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: UIPATH_CLIENT_ID,
        client_secret: UIPATH_CLIENT_SECRET,
        scope: 'OR.Administration OR.Execution OR.JobsWrite',
      }),
    });

    const data = await response.json();
    this.authToken = data.access_token;
  }

  async provisionRobot(email) {
    await this.authenticate();
    
    // 1. Create robot package with dynamic email parameter
    const packageResponse = await fetch('https://cloud.uipath.com/{org}/{tenant}/orchestrator_/odata/Processes', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        Name: `OrderProcessing_${Date.now()}`,
        Environment: {
          Name: 'Production',
          Type: 'Dev'
        },
        InputArguments: JSON.stringify({
          monitoredEmail: email,
          pollingInterval: 300
        })
      })
    });

    // 2. Upload pre-packaged workflow
    const packageData = await packageResponse.json();
    await this.uploadPackage(packageData.Id);

    // 3. Start robot job
    const jobResponse = await fetch('https://cloud.uipath.com/{org}/{tenant}/orchestrator_/odata/Jobs', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        startInfo: {
          ReleaseKey: packageData.Id,
          Strategy: 'Specific',
          RobotIds: [/* array of target robot IDs */],
          JobsCount: 0
        }
      })
    });

    return jobResponse.json();
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json',
      'X-UIPATH-OrganizationUnitId': UIPATH_ACCOUNT_NAME
    };
  }

  async uploadPackage(packageId) {
    // Implementation for uploading the actual .nupkg file
    // This would involve multipart/form-data upload
  }
} 