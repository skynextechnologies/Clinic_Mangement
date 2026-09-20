'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PERMISSIONS, PRODUCT_NAME } from '@clinicos/shared';

import { useCan } from '../../hooks/use-can';

interface NavItem {
  title: string;
  href: string;
  icon: string;
  permission?: string;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

export function SidebarNav({
  isCollapsed,
  onCloseMobile,
}: {
  isCollapsed?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();

  const navGroups: NavGroup[] = [
    {
      groupTitle: 'Overview',
      items: [
        {
          title: 'Dashboard',
          href: '/dashboard',
          icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
        },
      ],
    },
    {
      groupTitle: 'Front Desk',
      items: [
        {
          title: 'Patients',
          href: '/patients',
          icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
          permission: PERMISSIONS.PATIENTS_READ,
        },
        {
          title: 'Appointments',
          href: '/appointments',
          icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
          permission: PERMISSIONS.APPOINTMENTS_READ,
        },
        {
          title: 'Queue',
          href: '/queue',
          icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
          permission: PERMISSIONS.QUEUE_READ,
        },
      ],
    },
    {
      groupTitle: 'Clinical',
      items: [
        {
          title: 'Consultations',
          href: '/consultations',
          icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
          permission: PERMISSIONS.ENCOUNTERS_READ,
        },
        {
          title: 'Prescriptions',
          href: '/prescriptions',
          icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
          permission: PERMISSIONS.PRESCRIPTIONS_READ,
        },
        {
          title: 'Lab Orders',
          href: '/lab',
          icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
          permission: PERMISSIONS.LAB_READ,
        },
      ],
    },
    {
      groupTitle: 'Billing & Pharmacy',
      items: [
        {
          title: 'Invoices',
          href: '/invoices',
          icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
          permission: PERMISSIONS.INVOICES_READ,
        },
        {
          title: 'Inventory',
          href: '/inventory',
          icon: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
          permission: PERMISSIONS.INVENTORY_READ,
        },
      ],
    },
    {
      groupTitle: 'Admin',
      items: [
        {
          title: 'Account Security',
          href: '/security',
          icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
        },
        {
          title: 'Audit Logs',
          href: '/audit',
          icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
          permission: PERMISSIONS.AUDIT_READ,
        },
      ],
    },
  ];

  return (
    <aside
      className={`h-full bg-card border-r border-border flex flex-col transition-all duration-200 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-border space-x-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg shadow-sm">
          C
        </div>
        {!isCollapsed && (
          <span className="text-base font-bold tracking-tight text-foreground">{PRODUCT_NAME}</span>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.permission || useCan(item.permission),
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.groupTitle} className="space-y-1">
              {!isCollapsed && (
                <h3 className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {group.groupTitle}
                </h3>
              )}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      className={`flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      } ${isCollapsed ? 'justify-center px-0' : 'space-x-3'}`}
                      title={isCollapsed ? item.title : undefined}
                    >
                      <svg
                        className="h-4 w-4 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.75}
                          d={item.icon}
                        />
                      </svg>
                      {!isCollapsed && <span>{item.title}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
