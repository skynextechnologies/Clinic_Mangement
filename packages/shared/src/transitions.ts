import {
  AppointmentStatus,
  QueueStatus,
  EncounterStatus,
  PrescriptionStatus,
  LabOrderStatus,
  PurchaseOrderStatus,
  InvoiceStatus,
} from './enums.js';

export const APPOINTMENT_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  [AppointmentStatus.SCHEDULED]: [
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.CHECKED_IN,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.CONFIRMED]: [
    AppointmentStatus.CHECKED_IN,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.CHECKED_IN]: [AppointmentStatus.IN_CONSULTATION, AppointmentStatus.CANCELLED],
  [AppointmentStatus.IN_CONSULTATION]: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED],
  [AppointmentStatus.COMPLETED]: [],
  [AppointmentStatus.CANCELLED]: [],
  [AppointmentStatus.NO_SHOW]: [],
};

export const QUEUE_TRANSITIONS: Record<QueueStatus, QueueStatus[]> = {
  [QueueStatus.WAITING]: [QueueStatus.CALLED, QueueStatus.SKIPPED],
  [QueueStatus.CALLED]: [QueueStatus.IN_CONSULTATION, QueueStatus.SKIPPED, QueueStatus.WAITING],
  [QueueStatus.IN_CONSULTATION]: [QueueStatus.DONE],
  [QueueStatus.DONE]: [],
  [QueueStatus.SKIPPED]: [QueueStatus.WAITING, QueueStatus.CALLED],
};

export const ENCOUNTER_TRANSITIONS: Record<EncounterStatus, EncounterStatus[]> = {
  [EncounterStatus.OPEN]: [EncounterStatus.SIGNED],
  [EncounterStatus.SIGNED]: [],
};

export const PRESCRIPTION_TRANSITIONS: Record<PrescriptionStatus, PrescriptionStatus[]> = {
  [PrescriptionStatus.DRAFT]: [PrescriptionStatus.ISSUED, PrescriptionStatus.CANCELLED],
  [PrescriptionStatus.ISSUED]: [
    PrescriptionStatus.PARTIALLY_DISPENSED,
    PrescriptionStatus.DISPENSED,
    PrescriptionStatus.CANCELLED,
  ],
  [PrescriptionStatus.PARTIALLY_DISPENSED]: [
    PrescriptionStatus.DISPENSED,
    PrescriptionStatus.CANCELLED,
  ],
  [PrescriptionStatus.DISPENSED]: [],
  [PrescriptionStatus.CANCELLED]: [],
};

export const LAB_ORDER_TRANSITIONS: Record<LabOrderStatus, LabOrderStatus[]> = {
  [LabOrderStatus.ORDERED]: [LabOrderStatus.SAMPLE_COLLECTED, LabOrderStatus.CANCELLED],
  [LabOrderStatus.SAMPLE_COLLECTED]: [LabOrderStatus.IN_PROCESS, LabOrderStatus.CANCELLED],
  [LabOrderStatus.IN_PROCESS]: [LabOrderStatus.RESULTED, LabOrderStatus.CANCELLED],
  [LabOrderStatus.RESULTED]: [LabOrderStatus.VERIFIED, LabOrderStatus.CANCELLED],
  [LabOrderStatus.VERIFIED]: [],
  [LabOrderStatus.CANCELLED]: [],
};

export const PURCHASE_ORDER_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  [PurchaseOrderStatus.DRAFT]: [PurchaseOrderStatus.ORDERED, PurchaseOrderStatus.CANCELLED],
  [PurchaseOrderStatus.ORDERED]: [
    PurchaseOrderStatus.PARTIALLY_RECEIVED,
    PurchaseOrderStatus.RECEIVED,
    PurchaseOrderStatus.CANCELLED,
  ],
  [PurchaseOrderStatus.PARTIALLY_RECEIVED]: [
    PurchaseOrderStatus.RECEIVED,
    PurchaseOrderStatus.CANCELLED,
  ],
  [PurchaseOrderStatus.RECEIVED]: [],
  [PurchaseOrderStatus.CANCELLED]: [],
};

export const INVOICE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  [InvoiceStatus.DRAFT]: [InvoiceStatus.ISSUED, InvoiceStatus.VOID],
  [InvoiceStatus.ISSUED]: [InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID, InvoiceStatus.VOID],
  [InvoiceStatus.PARTIALLY_PAID]: [InvoiceStatus.PAID],
  [InvoiceStatus.PAID]: [],
  [InvoiceStatus.VOID]: [],
};

export function canTransition<T extends string>(
  table: Record<T, T[]>,
  current: T,
  target: T,
): boolean {
  const allowed = table[current];
  return allowed ? allowed.includes(target) : false;
}
