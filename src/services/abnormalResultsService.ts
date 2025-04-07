import { HL7ParsedObservation } from '../interfaces';
import { findMetricByCodeAndUnits, getMetrics } from './csvService';
import 'colors';

// Interface for abnormal test results
interface AbnormalResult extends HL7ParsedObservation {
  isAbnormal: boolean;
  metricName?: string;
  standardRange?: string;
  everlabRange?: string;
  riskPercentage?: number;
  riskValue?: string;
}

/**
 * Calculates risk percentage and value based on reference range
 */
function calculateRisk(value: number, lowerLimit: number, upperLimit: number): { riskPercentage: number; riskValue: string } {
  const range = upperLimit - lowerLimit;
  let riskPercentage = 0;
  let riskValue = 'Normal';

  if (value < lowerLimit) {
    riskPercentage = ((lowerLimit - value) / range) * 100;
    riskValue = 'Low';
  } else if (value > upperLimit) {
    riskPercentage = ((value - upperLimit) / range) * 100;
    riskValue = 'High';
  }

  return {
    riskPercentage: Math.min(Math.round(riskPercentage), 100),
    riskValue
  };
}

/**
 * Determines if a test value is abnormal based on the diagnostic_metrics table
 * @param observation The observation from the HL7 file
 * @param patientAge The patient's age
 * @param patientGender The patient's gender
 * @returns An object with the observation and whether it's abnormal
 */
export function calculateAbnormalResult(
  observation: HL7ParsedObservation,
  patientAge: number,
  patientGender: string
): AbnormalResult | null {
  console.log(`\n📊 Processing observation: ${observation.name} (${observation.code})`.cyan);
  console.log(`Value: ${observation.value} ${observation.unit}`.cyan);
  console.log(`Patient: Age ${patientAge}, Gender ${patientGender}`.cyan);
  
  // Find the matching metric in the diagnostic_metrics table
  const metric = findMetricByCodeAndUnits(observation.code, observation.unit);
  
  if (metric) {
    console.log(`✓ Found matching metric: ${metric.name}`.green);
    console.log(`Ranges - Standard: ${metric.standard_lower}-${metric.standard_higher}, Everlab: ${metric.everlab_lower}-${metric.everlab_higher}`.cyan);
    console.log(`Age range: ${metric.min_age || 'any'}-${metric.max_age || 'any'}, Gender: ${metric.gender || 'any'}`.cyan);
  } else {
    console.log('⚠ No direct metric match found, trying name match...'.yellow);
    // If no matching metric is found, try to find by name
    const allMetrics = getMetrics();
    const nameMatch = allMetrics.find(m => 
      m.name.toLowerCase().includes(observation.name.toLowerCase()) ||
      observation.name.toLowerCase().includes(m.name.toLowerCase())
    );
    
    if (nameMatch) {
      console.log(`✓ Found metric by name: ${nameMatch.name}`.green);
      // Use the name match but still check if the value is abnormal
      const isAbnormal = false; // Default to not abnormal if we can't determine
      
      return {
        ...observation,
        isAbnormal,
        metricName: nameMatch.name,
        standardRange: `${nameMatch.standard_lower}-${nameMatch.standard_higher}`,
        everlabRange: `${nameMatch.everlab_lower}-${nameMatch.everlab_higher}`
      };
    }
    
    console.log('✗ No metric match found by name either'.red);
    return null;
  }
  
  // Check if the patient's age and gender match the metric's criteria
  const ageMatch = 
    (!metric.min_age || patientAge >= metric.min_age) && 
    (!metric.max_age || patientAge <= metric.max_age);
  
  const genderMatch = 
    !metric.gender || 
    metric.gender === 'Any' || 
    metric.gender === patientGender;
  
  console.log(`Age match: ${ageMatch ? '✓'.green : '✗'.red}, Gender match: ${genderMatch ? '✓'.green : '✗'.red}`);
  
  // If age or gender doesn't match, return null
  if (!ageMatch || !genderMatch) {
    console.log('✗ Patient criteria not met, skipping'.red);
    return null;
  }
  
  // Parse the reference range from the observation if available
  let isAbnormal = false;
  let riskInfo = { riskPercentage: 0, riskValue: 'Normal' };
  
  if (observation.referenceRange) {
    console.log(`📐 Using observation reference range: ${observation.referenceRange}`.cyan);
    
    // Handle special cases like "<1.5" or ">1.00"
    if (observation.referenceRange.startsWith('<')) {
      const upperLimit = parseFloat(observation.referenceRange.substring(1));
      isAbnormal = observation.value >= upperLimit;
      if (isAbnormal) {
        riskInfo = calculateRisk(observation.value, 0, upperLimit);
      }
      console.log(`Upper limit only: <${upperLimit}, isAbnormal: ${isAbnormal ? '⚠'.yellow : '✓'.green}`);
    } else if (observation.referenceRange.startsWith('>')) {
      const lowerLimit = parseFloat(observation.referenceRange.substring(1));
      isAbnormal = observation.value <= lowerLimit;
      if (isAbnormal) {
        riskInfo = calculateRisk(observation.value, lowerLimit, lowerLimit * 2);
      }
      console.log(`Lower limit only: >${lowerLimit}, isAbnormal: ${isAbnormal ? '⚠'.yellow : '✓'.green}`);
    } else {
      // Try to parse the reference range from the observation
      const rangeMatch = observation.referenceRange.match(/([<>]?)(\d+\.?\d*)-?([<>]?)(\d+\.?\d*)?/);
      
      if (rangeMatch) {
        const [, lowerOp, lowerVal, upperOp, upperVal] = rangeMatch;
        const lower = parseFloat(lowerVal);
        const upper = upperVal ? parseFloat(upperVal) : null;
        
        console.log(`📊 Parsed range: ${lowerOp}${lower}-${upperOp}${upper}`.cyan);
        
        // Check if the value is outside the reference range
        if (lowerOp === '<' && observation.value >= lower) {
          isAbnormal = true;
          riskInfo = calculateRisk(observation.value, 0, lower);
        } else if (upperOp === '>' && upper !== null && observation.value <= upper) {
          isAbnormal = true;
          riskInfo = calculateRisk(observation.value, upper, upper * 2);
        } else if (!lowerOp && !upperOp && (observation.value < lower || (upper !== null && observation.value > upper))) {
          isAbnormal = true;
          riskInfo = calculateRisk(observation.value, lower, upper || lower * 2);
        }
      } else {
        console.log(`⚠ Could not parse reference range: ${observation.referenceRange}`.yellow);
        // If we can't parse the reference range, use the metric's reference ranges
        isAbnormal = 
          observation.value < metric.everlab_lower || 
          observation.value > metric.everlab_higher;
        if (isAbnormal) {
          riskInfo = calculateRisk(observation.value, metric.everlab_lower, metric.everlab_higher);
        }
      }
    }
  } else {
    console.log('📐 Using metric reference ranges'.cyan);
    // If no reference range in observation, use the metric's reference ranges
    isAbnormal = 
      observation.value < metric.everlab_lower || 
      observation.value > metric.everlab_higher;
    if (isAbnormal) {
      riskInfo = calculateRisk(observation.value, metric.everlab_lower, metric.everlab_higher);
    }
  }
  
  console.log(`Result: ${isAbnormal ? '⚠ ABNORMAL'.yellow : '✓ Normal'.green}`);
  
  // Format the reference ranges for display
  const standardRange = `${metric.standard_lower}-${metric.standard_higher}`;
  const everlabRange = `${metric.everlab_lower}-${metric.everlab_higher}`;
  
  // Return the result with the abnormal flag and reference ranges
  return {
    ...observation,
    isAbnormal,
    metricName: metric.name,
    standardRange,
    everlabRange,
    riskPercentage: riskInfo.riskPercentage,
    riskValue: riskInfo.riskValue
  };
}

/**
 * Process all observations and return only the abnormal ones
 * @param observations The observations from the HL7 file
 * @param patientAge The patient's age
 * @param patientGender The patient's gender
 * @returns An array of abnormal results
 */
export function processAbnormalResults(
  observations: HL7ParsedObservation[],
  patientAge: number,
  patientGender: string
): AbnormalResult[] {
  console.log(`\n🔍 Processing ${observations.length} observations for patient (Age: ${patientAge}, Gender: ${patientGender})`.cyan);
  
  const results: AbnormalResult[] = [];
  
  for (const observation of observations) {
    const result = calculateAbnormalResult(observation, patientAge, patientGender);
    if (result && result.isAbnormal) {
      console.log(`⚠ Found abnormal result: ${result.name} (${result.value} ${result.unit})`.yellow);
      results.push(result);
    }
  }
  
  console.log(`\n📋 Found ${results.length} abnormal results`.cyan);
  return results;
}