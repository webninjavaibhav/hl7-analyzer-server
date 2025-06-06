/**
 * Controller for processing diagnostic files
 * Handles the parsing of HL7 ORU messages and calculation of abnormal results
 */
import { Request, Response } from 'express';
import { parseHL7ORU as processHL7File } from '../services/hl7Service';
import { loadAllData } from '../services/csvService';
import { processAbnormalResults } from '../services/abnormalResultsService';
import 'colors';

/**
 * Module-level state to track data initialization
 * Prevents redundant loading of CSV data
 */
let isDataInitialized = false;

/**
 * Ensures diagnostic data is loaded before processing
 * Loads CSV files containing reference ranges and diagnostic metrics
 * @returns Promise<void>
 */
async function ensureDataInitialized(): Promise<void> {
  if (!isDataInitialized) {
    await loadAllData();
    isDataInitialized = true;
    console.log('✓ Diagnostic data initialized successfully'.green);
  }
}

/**
 * Processes an HL7 ORU (Observation Result) file
 * Extracts patient information and test results
 * Calculates abnormal results based on reference ranges
 * 
 * @param req Express request object containing the uploaded file
 * @param res Express response object
 * @returns Promise<void>
 */
export async function processDiagnosticFile(req: Request, res: Response): Promise<void> {
  try {
    // Ensure diagnostic data is loaded
    await ensureDataInitialized();

    // Validate file presence
    if (!req.file?.buffer) {
      console.error('✗ No file uploaded or invalid format'.red);
      res.status(400).json({ 
        success: false,
        error: 'No file uploaded or invalid file format' 
      });
      return;
    }

    // Process HL7 file content
    console.log('⚡ Processing diagnostic file...'.cyan);
    const fileContent = req.file.buffer.toString('utf-8');
    const result = await processHL7File(fileContent);
    
    // Calculate abnormal results based on reference ranges
    const abnormalResults = processAbnormalResults(
      result.observations,
      result.patient.age || 0,
      result.patient.gender
    );
    
    // Calculate overall health score
    const totalTests = result.observations.length;
    const abnormalCount = abnormalResults.length;
    const normalCount = totalTests - abnormalCount;
    
    // Calculate health percentage (weighted more heavily for normal results)
    const healthScore = Math.round((normalCount / totalTests) * 100);
    
    // Determine health status and message based on score
    let healthStatus = 'Excellent';
    let healthMessage = 'Your test results indicate excellent overall health. Keep maintaining your healthy lifestyle!';
    
    if (healthScore < 60) {
      healthStatus = 'Poor';
      healthMessage = 'Your test results suggest some areas that need attention. We recommend scheduling a follow-up with your healthcare provider to discuss these results.';
    } else if (healthScore < 80) {
      healthStatus = 'Fair';
      healthMessage = 'Your test results show some areas for improvement. Consider discussing these results with your healthcare provider to develop a plan for better health.';
    } else if (healthScore < 90) {
      healthStatus = 'Good';
      healthMessage = 'Your test results indicate good overall health. Continue your healthy habits and regular check-ups.';
    }
    
    console.log(`✓ Processed ${result.observations.length} observations`.green);
    if (abnormalResults.length > 0) {
      console.log(`⚠ Found ${abnormalResults.length} abnormal results`.yellow);
    } else {
      console.log('✓ No abnormal results found'.green);
    }
    
    // Return success response with patient data, observations, abnormal results and health assessment
    res.status(200).json({
      success: true,
      message: `Processed results for patient ${result.patient.name}`,
      data: {
        patient: result.patient,
        observations: result.observations,
        abnormalResults,
        healthAssessment: {
          score: healthScore,
          status: healthStatus,
          message: healthMessage,
          totalTests,
          normalTests: normalCount,
          abnormalTests: abnormalCount
        }
      }
    });
  } catch (error) {
    // Log and handle errors
    console.error('✗ Error processing diagnostic file:'.red, error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to process diagnostic file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}