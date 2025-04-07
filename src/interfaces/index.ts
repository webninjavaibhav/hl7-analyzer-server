/**
 * Interface representing a diagnostic metric with reference ranges and test codes.
 * Used to define standard and Everlab-specific reference ranges for diagnostic tests.
 */
export interface DiagnosticMetric {
  /** Unique identifier for the metric */
  id: string;
  /** Reference to the associated diagnostic */
  diagnostic_id: string;
  /** Name of the metric */
  name: string;
  /** Standard lower reference range */
  standard_lower: number;
  /** Standard higher reference range */
  standard_higher: number;
  /** Everlab lower reference range */
  everlab_lower: number;
  /** Everlab higher reference range */
  everlab_higher: number;
  /** Minimum age for this metric (optional) */
  min_age?: number;
  /** Maximum age for this metric (optional) */
  max_age?: number;
  /** Gender specification (optional) */
  gender?: string;
  /** Array of ORU Sonic test codes */
  oru_sonic_codes: string[];
  /** Array of ORU Sonic units */
  oru_sonic_units: string[];
}

/**
 * Interface representing a diagnostic test.
 * Contains basic information about a medical test or procedure.
 */
export interface Diagnostic {
  /** Unique identifier for the diagnostic */
  id: string;
  /** Name of the diagnostic */
  name: string;
  /** Optional description of the diagnostic */
  description?: string;
}

/**
 * Interface representing a group of related diagnostics.
 * Used to organize and categorize related diagnostic tests.
 */
export interface DiagnosticGroup {
  /** Unique identifier for the group */
  id: string;
  /** Name of the diagnostic group */
  name: string;
  /** Optional description of the group */
  description?: string;
}

/**
 * Interface representing a medical condition.
 * Contains information about specific medical conditions or diagnoses.
 */
export interface Condition {
  /** Unique identifier for the condition */
  id: string;
  /** Name of the condition */
  name: string;
  /** Optional description of the condition */
  description?: string;
}

/**
 * Interface representing a test result with reference ranges.
 * Contains the actual test value and its interpretation against reference ranges.
 */
export interface TestResult {
  /** Test code identifier */
  code: string;
  /** Numeric test value */
  value: number;
  /** Units of measurement */
  units: string;
  /** Optional reference range for the test */
  referenceRange?: {
    lower: number;
    higher: number;
  };
  /** Flag indicating if result is outside reference range */
  isAbnormal: boolean;
  /** Optional associated diagnostic metric */
  metric?: DiagnosticMetric;
}

/**
 * Interface representing a processed ORU (Observation Result) message.
 * Contains patient information and associated test results from HL7 messages.
 */
export interface ProcessedORUResult {
  /** Patient identifier */
  patientId: string;
  /** Patient name */
  patientName: string;
  /** Date and time of the test */
  dateTime: string;
  /** Array of test results */
  results: TestResult[];
}

/**
 * Interface representing a parsed HL7 observation.
 * Contains the raw data extracted from an HL7 message observation segment.
 */
export interface HL7ParsedObservation {
  /** Observation code */
  code: string;
  /** Observation name */
  name: string;
  /** Numeric value */
  value: number;
  /** Unit of measurement */
  unit: string;
  /** Optional reference range string */
  referenceRange?: string;
  /** Date and time of observation */
  dateTime: string;
}
