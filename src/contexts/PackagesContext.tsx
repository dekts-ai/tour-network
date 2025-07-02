"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Package } from '@/types/package';

interface PackageWithTenant extends Package {
  tenant_id: string;
}

interface PackagesContextType {
  packages: PackageWithTenant[];
  setPackages: (packages: PackageWithTenant[]) => void;
  getPackageById: (tenantId: string, packageId: string) => PackageWithTenant | null;
}

const PackagesContext = createContext<PackagesContextType | undefined>(undefined);

export function PackagesProvider({ children }: { children: ReactNode }) {
  const [packages, setPackages] = useState<PackageWithTenant[]>([]);

  const getPackageById = (tenantId: string, packageId: string): PackageWithTenant | null => {
    return packages.find(pkg => 
      pkg.tenant_id === tenantId && pkg.id.toString() === packageId
    ) || null;
  };

  return (
    <PackagesContext.Provider value={{ packages, setPackages, getPackageById }}>
      {children}
    </PackagesContext.Provider>
  );
}

export function usePackagesContext() {
  const context = useContext(PackagesContext);
  if (context === undefined) {
    throw new Error('usePackagesContext must be used within a PackagesProvider');
  }
  return context;
}