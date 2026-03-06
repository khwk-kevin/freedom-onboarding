export type ConversationPhase =
  | 'greeting'
  | 'context_collection'
  | 'class_selection'
  | 'name_selection'
  | 'description_selection'
  | 'inference_confirmation'
  | 'image_generation'
  | 'complete';

export interface PhaseDefinition {
  id: ConversationPhase;
  label: string;
  description: string;
  requiredFields: string[];
  nextPhase?: ConversationPhase;
}

export const PHASES: PhaseDefinition[] = [
  {
    id: 'greeting',
    label: 'Welcome',
    description: 'Introduction to AVA',
    requiredFields: [],
    nextPhase: 'context_collection',
  },
  {
    id: 'context_collection',
    label: 'Community Concept',
    description: 'What kind of community do you want to build?',
    requiredFields: ['context'],
    nextPhase: 'class_selection',
  },
  {
    id: 'class_selection',
    label: 'Community Class',
    description: 'Choose your community type',
    requiredFields: ['communityClass'],
    nextPhase: 'name_selection',
  },
  {
    id: 'name_selection',
    label: 'Community Name',
    description: 'Name your community',
    requiredFields: ['name'],
    nextPhase: 'description_selection',
  },
  {
    id: 'description_selection',
    label: 'Description',
    description: 'Describe your community',
    requiredFields: ['description'],
    nextPhase: 'inference_confirmation',
  },
  {
    id: 'inference_confirmation',
    label: 'Details',
    description: 'Confirm category, audience & type',
    requiredFields: ['category', 'targetAudience', 'type'],
    nextPhase: 'image_generation',
  },
  {
    id: 'image_generation',
    label: 'Visuals',
    description: 'Generate logo & banner',
    requiredFields: ['logo', 'banner'],
    nextPhase: 'complete',
  },
  {
    id: 'complete',
    label: 'Launch',
    description: 'Create your community',
    requiredFields: [],
  },
];

export function detectPhase(communityData: Record<string, unknown>): ConversationPhase {
  const hasField = (f: string) => !!communityData[f];

  if (!hasField('communityClass')) return 'context_collection';
  if (!hasField('name')) return 'name_selection';
  if (!hasField('description')) return 'description_selection';
  if (!hasField('category') || !hasField('targetAudience') || !hasField('type'))
    return 'inference_confirmation';
  if (!hasField('logo') || !hasField('banner')) return 'image_generation';
  return 'complete';
}

export function getPhaseProgress(communityData: Record<string, unknown>): number {
  const fields = ['communityClass', 'name', 'description', 'category', 'targetAudience', 'type', 'logo', 'banner'];
  const filled = fields.filter((f) => !!communityData[f]);
  return Math.round((filled.length / fields.length) * 100);
}
