import { describe, expect, it } from 'vitest';
import {
  AppointmentStatus,
  QueueStatus,
  EncounterStatus,
  PrescriptionStatus,
  LabOrderStatus,
  PurchaseOrderStatus,
  InvoiceStatus,
} from '../enums.js';
import {
  APPOINTMENT_TRANSITIONS,
  QUEUE_TRANSITIONS,
  ENCOUNTER_TRANSITIONS,
  PRESCRIPTION_TRANSITIONS,
  LAB_ORDER_TRANSITIONS,
  PURCHASE_ORDER_TRANSITIONS,
  INVOICE_TRANSITIONS,
  canTransition,
} from '../transitions.js';

describe('State Transition Tables (100% Coverage)', () => {
  it('validates Appointment transitions', () => {
    expect(
      canTransition(
        APPOINTMENT_TRANSITIONS,
        AppointmentStatus.SCHEDULED,
        AppointmentStatus.CONFIRMED,
      ),
    ).toBe(true);
    expect(
      canTransition(
        APPOINTMENT_TRANSITIONS,
        AppointmentStatus.SCHEDULED,
        AppointmentStatus.CHECKED_IN,
      ),
    ).toBe(true);
    expect(
      canTransition(
        APPOINTMENT_TRANSITIONS,
        AppointmentStatus.COMPLETED,
        AppointmentStatus.SCHEDULED,
      ),
    ).toBe(false);
  });

  it('validates Queue transitions', () => {
    expect(canTransition(QUEUE_TRANSITIONS, QueueStatus.WAITING, QueueStatus.CALLED)).toBe(true);
    expect(canTransition(QUEUE_TRANSITIONS, QueueStatus.CALLED, QueueStatus.IN_CONSULTATION)).toBe(
      true,
    );
    expect(canTransition(QUEUE_TRANSITIONS, QueueStatus.DONE, QueueStatus.WAITING)).toBe(false);
  });

  it('validates Encounter transitions (signed notes locked)', () => {
    expect(canTransition(ENCOUNTER_TRANSITIONS, EncounterStatus.OPEN, EncounterStatus.SIGNED)).toBe(
      true,
    );
    expect(canTransition(ENCOUNTER_TRANSITIONS, EncounterStatus.SIGNED, EncounterStatus.OPEN)).toBe(
      false,
    );
  });

  it('validates Prescription transitions', () => {
    expect(
      canTransition(PRESCRIPTION_TRANSITIONS, PrescriptionStatus.DRAFT, PrescriptionStatus.ISSUED),
    ).toBe(true);
    expect(
      canTransition(
        PRESCRIPTION_TRANSITIONS,
        PrescriptionStatus.ISSUED,
        PrescriptionStatus.DISPENSED,
      ),
    ).toBe(true);
    expect(
      canTransition(
        PRESCRIPTION_TRANSITIONS,
        PrescriptionStatus.DISPENSED,
        PrescriptionStatus.DRAFT,
      ),
    ).toBe(false);
  });

  it('validates LabOrder transitions', () => {
    expect(
      canTransition(LAB_ORDER_TRANSITIONS, LabOrderStatus.ORDERED, LabOrderStatus.SAMPLE_COLLECTED),
    ).toBe(true);
    expect(
      canTransition(LAB_ORDER_TRANSITIONS, LabOrderStatus.RESULTED, LabOrderStatus.VERIFIED),
    ).toBe(true);
    expect(
      canTransition(LAB_ORDER_TRANSITIONS, LabOrderStatus.VERIFIED, LabOrderStatus.ORDERED),
    ).toBe(false);
  });

  it('validates PurchaseOrder transitions', () => {
    expect(
      canTransition(
        PURCHASE_ORDER_TRANSITIONS,
        PurchaseOrderStatus.DRAFT,
        PurchaseOrderStatus.ORDERED,
      ),
    ).toBe(true);
    expect(
      canTransition(
        PURCHASE_ORDER_TRANSITIONS,
        PurchaseOrderStatus.ORDERED,
        PurchaseOrderStatus.RECEIVED,
      ),
    ).toBe(true);
    expect(
      canTransition(
        PURCHASE_ORDER_TRANSITIONS,
        PurchaseOrderStatus.RECEIVED,
        PurchaseOrderStatus.DRAFT,
      ),
    ).toBe(false);
  });

  it('validates Invoice transitions', () => {
    expect(canTransition(INVOICE_TRANSITIONS, InvoiceStatus.DRAFT, InvoiceStatus.ISSUED)).toBe(
      true,
    );
    expect(canTransition(INVOICE_TRANSITIONS, InvoiceStatus.ISSUED, InvoiceStatus.PAID)).toBe(true);
    expect(canTransition(INVOICE_TRANSITIONS, InvoiceStatus.PAID, InvoiceStatus.DRAFT)).toBe(false);
  });

  it('returns false for unknown/invalid transition tables', () => {
    expect(
      canTransition(
        {} as Record<AppointmentStatus, AppointmentStatus[]>,
        'UNKNOWN' as AppointmentStatus,
        'TARGET' as AppointmentStatus,
      ),
    ).toBe(false);
  });
});
