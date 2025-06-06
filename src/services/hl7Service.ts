/**
 * Parses HL7 ORU (Observation Result) messages and extracts patient details and observations
 * @param fileContent Raw HL7 message content
 * @returns Object containing parsed patient details and observations
 */
import { HL7ParsedObservation } from '../interfaces';
import { formatDate, calculateAge } from '../utils/utils';

interface PatientDetails {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  age?: number;
}

export function parseHL7ORU(fileContent: string): { patient: PatientDetails; observations: HL7ParsedObservation[] } {
  // Validate if the file is a valid HL7 message
  if (!fileContent || typeof fileContent !== 'string') {
    throw new Error('Invalid file content: File content must be a non-empty string');
  }

  // Check for MSH segment which is mandatory in HL7 messages
  const hasMSHSegment = fileContent.includes('MSH|');
  if (!hasMSHSegment) {
    throw new Error('Invalid HL7 file: Missing MSH segment');
  }

  // Check for required segments
  const hasRequiredSegments = fileContent.includes('PID|') && 
                            (fileContent.includes('OBX|') || fileContent.includes('OBR|'));
  if (!hasRequiredSegments) {
    throw new Error('Invalid HL7 file: Missing required segments (PID and OBX/OBR)');
  }

  const lines = fileContent.split(/\r?\n/);
  const observations: HL7ParsedObservation[] = [];
  const patient: PatientDetails = {
    id: '',
    name: '',
    dateOfBirth: '',
    gender: ''
  };

  let currentDateTime = '';

  for (const line of lines) {
    const segments = line.split('|');
    const segmentType = segments[0];

    switch (segmentType) {
      case 'PID':
        parsePatientSegment(segments, patient);
        break;
      case 'OBR':
        currentDateTime = formatDate(segments[7], true);
        break;
      case 'OBX':
        const observation = parseObservationSegment(segments, currentDateTime);
        if (observation) {
          observations.push(observation);
        }
        break;
    }
  }

  // Validate parsed data
  if (!patient.id || !patient.name) {
    throw new Error('Invalid HL7 file: Missing required patient information');
  }

  if (observations.length === 0) {
    throw new Error('Invalid HL7 file: No valid observations found');
  }

  return { patient, observations };
}

/**
 * Parses PID segment to extract patient information
 */
function parsePatientSegment(segments: string[], patient: PatientDetails): void {
  patient.id = segments[3]?.split('^')[0] || '';
  patient.name = segments[5]?.replace('^', ' ') || '';
  const rawDOB = segments[7] || '';
  patient.dateOfBirth = formatDate(rawDOB);
  patient.age = calculateAge(rawDOB);
  patient.gender = segments[8] || '';
}

/**
 * Parses OBX segment to extract observation details
 */
function parseObservationSegment(segments: string[], currentDateTime: string): HL7ParsedObservation | null {
  const valueType = segments[2];
  const identifier = segments[3]?.split('^')[0];
  const name = segments[3]?.split('^')[1];
  let value = segments[5];
  const unit = segments[6]?.split('^')[0];
  const referenceRange = segments[7];

  if (!identifier || !name || !valueType) return null;

  if (valueType === 'SN' && value.includes('^')) {
    const parts = value.split('^');
    value = parts[1];
  }

  const numericValue = parseFloat(value.replace(/[<>]/g, ''));
  if (isNaN(numericValue)) return null;

  return {
    code: identifier,
    name,
    value: numericValue,
    unit,
    referenceRange,
    dateTime: currentDateTime,
  };
}
