import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { Diagnostic, DiagnosticMetric, DiagnosticGroup, Condition } from '../interfaces';
import 'colors';

// In-memory data storage
let metrics: DiagnosticMetric[] = [];
let diagnostics: Diagnostic[] = [];
let diagnosticGroups: DiagnosticGroup[] = [];
let conditions: Condition[] = [];

/**
 * Parses a CSV file and returns its contents as an array of objects
 * @param filePath Path to the CSV file
 * @returns Promise resolving to array of parsed records
 */
async function parseCSV(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

/**
 * Loads diagnostic metrics from CSV file
 */
async function loadMetrics(): Promise<void> {
  const filePath = path.join(__dirname, '../../files/diagnostic_metrics.csv');
  const records = await parseCSV(filePath);
  
  metrics = records.map((record: any) => ({
    id: record.id || '',
    diagnostic_id: record.diagnostic_id || '',
    name: record.name,
    standard_lower: record.standard_lower ? parseFloat(record.standard_lower) : 0,
    standard_higher: record.standard_higher ? parseFloat(record.standard_higher) : 0,
    everlab_lower: record.everlab_lower ? parseFloat(record.everlab_lower) : 0,
    everlab_higher: record.everlab_higher ? parseFloat(record.everlab_higher) : 0,
    min_age: record.min_age ? parseInt(record.min_age) : undefined,
    max_age: record.max_age ? parseInt(record.max_age) : undefined,
    gender: record.gender || undefined,
    oru_sonic_codes: record.oru_sonic_codes ? record.oru_sonic_codes.split(';').map((c: string) => c.trim()).filter(Boolean) : [],
    oru_sonic_units: record.oru_sonic_units ? record.oru_sonic_units.split(';').map((u: string) => u.trim()).filter(Boolean) : [],
  }));
  
  console.log(`📊 Loaded ${metrics.length} diagnostic metrics`.cyan);
  
  // Log some sample metrics for debugging
  if (metrics.length > 0) {
    console.log('Sample metrics:'.cyan);
    for (let i = 0; i < Math.min(5, metrics.length); i++) {
      console.log(`- ${metrics[i].name}: codes=${metrics[i].oru_sonic_codes.join(',')}, units=${metrics[i].oru_sonic_units.join(',')}`);
    }
  }
}

/**
 * Loads diagnostics from CSV file
 */
async function loadDiagnostics(): Promise<void> {
  const filePath = path.join(__dirname, '../../files/diagnostics.csv');
  const records = await parseCSV(filePath);
  diagnostics = records.map((record: any) => ({
    id: record.id,
    name: record.name,
    description: record.description,
  }));
  console.log(`📋 Loaded ${diagnostics.length} diagnostics`.cyan);
}

/**
 * Loads diagnostic groups from CSV file
 */
async function loadDiagnosticGroups(): Promise<void> {
  const filePath = path.join(__dirname, '../../files/diagnostic_groups.csv');
  const records = await parseCSV(filePath);
  diagnosticGroups = records.map((record: any) => ({
    id: record.id,
    name: record.name,
    description: record.description,
  }));
  console.log(`📑 Loaded ${diagnosticGroups.length} diagnostic groups`.cyan);
}

/**
 * Loads conditions from CSV file
 */
async function loadConditions(): Promise<void> {
  const filePath = path.join(__dirname, '../../files/conditions.csv');
  const records = await parseCSV(filePath);
  conditions = records.map((record: any) => ({
    id: record.id,
    name: record.name,
    description: record.description,
  }));
  console.log(`🏥 Loaded ${conditions.length} conditions`.cyan);
}

/**
 * Loads all data from CSV files
 */
export async function loadAllData(): Promise<void> {
  console.log('\n📂 Loading diagnostic data...'.cyan);
  await Promise.all([
    loadMetrics(),
    loadDiagnostics(),
    loadDiagnosticGroups(),
    loadConditions(),
  ]);
  console.log('✓ All data loaded successfully\n'.green);
}

// Data access functions
export function getMetrics(): DiagnosticMetric[] {
  return metrics;
}

export function getDiagnostics(): Diagnostic[] {
  return diagnostics;
}

export function getDiagnosticGroups(): DiagnosticGroup[] {
  return diagnosticGroups;
}

export function getConditions(): Condition[] {
  return conditions;
}

/**
 * Finds a metric by code and units with fallback matching strategies
 * @param code Test code to match
 * @param units Units to match
 * @returns Matching metric or undefined
 */
export function findMetricByCodeAndUnits(code: string, units: string): DiagnosticMetric | undefined {
  console.log(`🔍 Looking for metric with code=${code}, units=${units}`.cyan);
  
  // Try exact match
  let match = metrics.find(metric => 
    metric.oru_sonic_codes.includes(code) && 
    metric.oru_sonic_units.includes(units)
  );
  if (match) {
    console.log(`✓ Found exact match: ${match.name}`.green);
    return match;
  }

  // Try code match with any unit
  match = metrics.find(metric => metric.oru_sonic_codes.includes(code));
  if (match) {
    console.log(`✓ Found code match: ${match.name}`.green);
    return match;
  }
  
  // Try unit match with any code
  match = metrics.find(metric => metric.oru_sonic_units.includes(units));
  if (match) {
    console.log(`✓ Found unit match: ${match.name}`.green);
    return match;
  }
  
  // Try partial code match
  match = metrics.find(metric => 
    metric.oru_sonic_codes.some(c => code.includes(c) || c.includes(code))
  );
  if (match) {
    console.log(`✓ Found partial code match: ${match.name}`.green);
    return match;
  }
  
  // Try partial unit match
  match = metrics.find(metric => 
    metric.oru_sonic_units.some(u => units.includes(u) || u.includes(units))
  );
  
  if (match) {
    console.log(`✓ Found partial unit match: ${match.name}`.green);
  } else {
    console.log('✗ No match found'.red);
  }
  
  return match;
}
