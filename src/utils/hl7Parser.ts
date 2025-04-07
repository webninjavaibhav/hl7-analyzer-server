/**
 * HL7 Parser Module
 * Handles parsing of HL7 messages into structured data
 */

/**
 * Creates a field object from HL7 field text
 * @param fieldText - Raw field text from HL7 message
 * @returns Object with methods to access field components
 */
function createField(fieldText: string) {
  if (!fieldText) {
    return {
      getComponent: () => '',
      getValue: () => ''
    };
  }

  const components = fieldText.split('^').map(c => c || '');
  
  return {
    getComponent: (index: number): string => components[index - 1] || '',
    getValue: (): string => components[0] || ''
  };
}

/**
 * Creates a segment object from HL7 segment text
 * @param segmentText - Raw segment text from HL7 message
 * @returns Object with methods to access segment fields
 */
function createSegment(segmentText: string) {
  const fields = segmentText.split(/(?<!\\)\|/).map(f => f || '');
  const segmentType = fields[0];
  
  return {
    getField: (index: number) => createField(fields[index] || ''),
    getSegmentType: (): string => segmentType
  };
}

/**
 * Creates a message object from HL7 message text
 * @param messageText - Raw HL7 message text
 * @returns Object with methods to access message segments
 */
export function createMessage(messageText: string) {
  const lines = messageText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  
  const segments = lines.map(line => {
    try {
      return createSegment(line);
    } catch (error) {
      console.error(`Error parsing segment: ${line.substring(0, 50)}...`, error);
      return {
        getField: () => createField(''),
        getSegmentType: () => 'UNKNOWN'
      };
    }
  });
  
  return {
    getSegment: (segmentType: string) => {
      return segments.find(segment => segment.getSegmentType() === segmentType);
    },
    
    getSegmentsAfter: (segmentType: string, afterSegment: ReturnType<typeof createSegment>) => {
      const startIndex = segments.indexOf(afterSegment) + 1;
      const result = [];
      
      for (let i = startIndex; i < segments.length; i++) {
        const segment = segments[i];
        if (segment.getSegmentType() === segmentType) {
          result.push(segment);
        } else if (segment.getSegmentType() === afterSegment.getSegmentType()) {
          break;
        }
      }
      
      return result;
    },
    
    getSegmentAfter: (segmentType: string, afterSegment: ReturnType<typeof createSegment>) => {
      const startIndex = segments.indexOf(afterSegment) + 1;
      return segments.slice(startIndex).find(segment => segment.getSegmentType() === segmentType);
    }
  };
}