export type BioColour = 'kelp' | 'coral' | 'amberglow' | 'lavender' | 'seafoam' | 'lily';

export const COLOUR_ORDER: BioColour[] = ['kelp', 'coral', 'amberglow', 'lavender', 'seafoam', 'lily'];

export const COLOUR_HEX: Record<BioColour, string> = {
  kelp:      '#2DD4BF',
  coral:     '#FB7185',
  amberglow: '#FBBF24',
  lavender:  '#C4B5FD',
  seafoam:   '#6EE7B7',
  lily:      '#F0ABFC',
};

export type MessageType =
  | 'new_idea'
  | 'builds_on'
  | 'contradicts'
  | 'restates'
  | 'steals'
  | 'question'
  | 'agreement'
  | 'disagreement_with_reason'
  | 'filler';

export interface Classification {
  type: MessageType;
  relates_to_message_ids: string[];
  original_speaker_if_steals: string | null;
  is_resolution_of_earlier_thread: string | null;
  weight: number;
}

export interface Participant {
  id: string;
  room_id: string;
  display_name: string;
  colour: BioColour;
  joined_at: string;
  last_active_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  participant_id: string;
  body: string;
  created_at: string;
  classification: Classification | null;
}

export interface UnresolvedThread {
  raised_at_message_id: string;
  raised_by: string;
  summary: string;
  minutes_since_raised: number;
}

export interface Room {
  id: string;
  created_at: string;
  ended_at: string | null;
  ended_by: string | null;
}

export interface MinutesDocument {
  session_summary: string;
  participants: Array<{
    name: string;
    airtime_percent: number;
    new_ideas_contributed: number;
    silent_minutes: number;
    was_developed_by_others: boolean;
  }>;
  decisions_recorded: Array<{
    decision: string;
    support: string;
    reservations: string | null;
  }>;
  unresolved_threads: Array<{
    thread: string;
    raised_by: string;
    at_timestamp: string;
  }>;
  patterns_worth_noting: string[];
  one_sentence_verdict: string;
}
