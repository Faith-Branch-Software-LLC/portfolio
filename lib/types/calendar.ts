export interface NormalizedEvent {
  id: string;
  title: string;
  startIso: string;
  endIso: string;
  allDay: boolean;
  calendarName: string;
  calendarColor: string;
  location?: string;
  description?: string;
  url?: string;
  meetingUrl?: string;
  googleEventId?: string;
  appleHref?: string;
}

export interface AppleCalendarSetting {
  color?: string;
  enabled?: boolean;
  order?: number;
}

export interface GoogleCalendarSetting {
  color?: string;
  enabled?: boolean;
}

export interface GoogleCalendarInfo {
  id: string;
  name: string;
  googleColor: string;
  color: string;
  enabled: boolean;
}

export interface AppleCalendarInfo {
  name: string;
  url: string;
  color: string;
  enabled: boolean;
  order: number;
}

export interface CacheEntry {
  integrationId: string;
  name: string;
  type: 'GOOGLE_CALENDAR' | 'APPLE_CALENDAR';
  events: NormalizedEvent[];
  cachedAt: string;
}
