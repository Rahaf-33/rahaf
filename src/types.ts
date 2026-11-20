export type Role = 'principal' | 'teacher' | 'safety' | 'admin';

export type EmergencyType = 'fire' | 'external_threat' | 'evacuation' | 'medical';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type Attendance = 'present' | 'absent' | 'late';
/** Identity-level safety status: only set by a teacher's (or staff) explicit confirmation — never by camera counts. */
export type SafetyStatus = 'unverified' | 'safe' | 'needs_help' | 'not_found';

export type ZoneKind = 'classroom' | 'lab' | 'library' | 'admin' | 'service' | 'corridor' | 'stairs' | 'hall' | 'clinic';
export type ZoneStatus = 'normal' | 'evacuating' | 'cleared' | 'needs_check' | 'danger';

export interface Floor {
  id: string;
  name: string;
  level: number;
}

export interface Zone {
  id: string;
  name: string;
  floorId: string;
  kind: ZoneKind;
  /** svg rect inside a 1000x520 floor viewBox */
  x: number;
  y: number;
  w: number;
  h: number;
  classId?: string;
  capacity: number;
}

export interface Exit {
  id: string;
  name: string;
  floorId: string;
  x: number;
  y: number;
  assemblyPointId: string;
  kind: 'main' | 'emergency' | 'stairs';
}

export interface AssemblyPoint {
  id: string;
  name: string;
  description: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  grade: string;
  floorId: string;
  zoneId: string;
  teacherId: string;
  assemblyPointId: string;
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  classId: string;
  phone: string;
}

export interface Student {
  id: string;
  name: string;
  classId: string;
  attendance: Attendance;
  safety: SafetyStatus;
  note?: string;
  confirmedAt?: number;
  confirmedBy?: string;
  medicalNote?: string;
}

export type SensorKind = 'camera' | 'smoke' | 'heat' | 'occupancy' | 'door';
export interface Sensor {
  id: string;
  name: string;
  kind: SensorKind;
  zoneId?: string;
  assemblyPointId?: string;
  online: boolean;
  battery: number;
  /** sensor reading during emergency mode (count for camera/occupancy, value for smoke/heat) */
  reading: number;
  triggered: boolean;
}

export interface SafetyProcedure {
  id: string;
  type: EmergencyType;
  title: string;
  steps: string[];
  roles: { role: Role; action: string }[];
  /** reference to the approving entity – placeholder until the school replaces it with the official document */
  source: string;
  version: string;
}

export interface AIAnalysis {
  type: EmergencyType;
  confidence: number;
  severity: Severity;
  scores: Record<EmergencyType, number>;
  matched: { term: string; type: EmergencyType | 'severity'; weight: number }[];
  location?: string;
  procedureId: string;
  reasoning: string[];
  requiresHumanReview: boolean;
}

export interface Alert {
  id: string;
  title: string;
  text: string;
  source: 'demo' | 'manual';
  sourceLabel: string;
  type: EmergencyType;
  severity: Severity;
  receivedAt: number;
  status: 'new' | 'acknowledged' | 'activated' | 'dismissed' | 'closed';
  analysis: AIAnalysis;
  location?: string;
}

export type LogCategory = 'alert' | 'emergency' | 'sensor' | 'teacher' | 'zone' | 'case' | 'system' | 'notification' | 'manual';
export interface LogEntry {
  id: string;
  at: number;
  category: LogCategory;
  level: 'info' | 'success' | 'warning' | 'critical';
  actor: string;
  message: string;
}

export interface Notification {
  id: string;
  at: number;
  title: string;
  body: string;
  audience: Role[];
  level: 'info' | 'success' | 'warning' | 'critical';
  read: boolean;
  link?: string;
  /** when targeted at a specific teacher */
  teacherId?: string;
}

export type HelpType = 'first_aid' | 'evacuation_assist' | 'missing_student' | 'zone_check' | 'other';
export interface Case {
  id: string;
  createdAt: number;
  title: string;
  description: string;
  classId?: string;
  zoneId?: string;
  studentId?: string;
  helpType: HelpType;
  priority: 'p1' | 'p2' | 'p3';
  status: 'open' | 'in_progress' | 'resolved';
  assignee?: string;
  source: string;
  resolvedAt?: number;
}

export interface ProgressPoint {
  t: number; // seconds from start
  safe: number;
  unverified: number;
  help: number;
  observed: number;
}

export interface EmergencyState {
  active: boolean;
  simulation: boolean;
  alertId?: string;
  type?: EmergencyType;
  severity?: Severity;
  startedAt?: number;
  endedAt?: number;
  tick: number;
  speed: number;
  paused: boolean;
  progress: ProgressPoint[];
  firstConfirmationAt?: number;
  allZonesClearedAt?: number;
}

export interface EmergencyRecord {
  id: string;
  type: EmergencyType;
  severity: Severity;
  title: string;
  startedAt: number;
  endedAt: number;
  simulation: boolean;
  totalPresent: number;
  confirmedSafe: number;
  unverified: number;
  needsHelp: number;
  casesOpened: number;
  firstConfirmationSec?: number;
  zonesClearedSec?: number;
  log: LogEntry[];
  progress: ProgressPoint[];
  classes: { classId: string; name: string; present: number; observed: number; confirmed: number; unverified: number; help: number }[];
}

export interface SchoolInfo {
  name: string;
  district: string;
  principal: string;
  safetyOfficer: string;
  phone: string;
  address: string;
  shift: string;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  title: string;
  teacherId?: string;
}
