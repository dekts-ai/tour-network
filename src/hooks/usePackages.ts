"use client";

import { useState, useEffect } from 'react';
import api from '@/services/api';
import { PackagesResponse, Package, FilterOptions } from '@/types/package';

export const usePackages = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenants, setTenants] = useState<string[]>([]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await api.get<PackagesResponse>('/packages');
      
      if (response.data.code === 200) {
        // Flatten all packages from all tenants
        const allPackages = response.data.data.flatMap(tenant => 
          tenant.packages
            .filter(pkg => pkg.frontend_enabled === 1 && pkg.status === 'Active')
            .map(pkg => ({ ...pkg, tenant_id: tenant.tenant_id }))
        );
        
        // Extract unique tenants
        const uniqueTenants = [...new Set(response.data.data.map(tenant => tenant.tenant_id))];
        
        setPackages(allPackages);
        setFilteredPackages(allPackages);
        setTenants(uniqueTenants);
      } else {
        setError('Failed to fetch packages');
      }
    } catch (err) {
      setError('Error fetching packages');
      console.error('Error fetching packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (filters: FilterOptions) => {
    let filtered = [...packages];

    // Filter by tenant
    if (filters.tenant && filters.tenant !== 'all') {
      filtered = filtered.filter(pkg => (pkg as any).tenant_id === filters.tenant);
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(pkg => 
        pkg.name.toLowerCase().includes(searchLower) ||
        pkg.short_description.toLowerCase().includes(searchLower) ||
        pkg.long_description.toLowerCase().includes(searchLower)
      );
    }

    // Filter by duration
    if (filters.duration && filters.duration !== 'all') {
      switch (filters.duration) {
        case 'short':
          filtered = filtered.filter(pkg => pkg.hours <= 2);
          break;
        case 'medium':
          filtered = filtered.filter(pkg => pkg.hours > 2 && pkg.hours <= 6);
          break;
        case 'long':
          filtered = filtered.filter(pkg => pkg.hours > 6);
          break;
      }
    }

    // Filter by category
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(pkg => pkg.category_id === filters.category);
    }

    setFilteredPackages(filtered);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  return {
    packages: filteredPackages,
    loading,
    error,
    tenants,
    applyFilters,
    refetch: fetchPackages
  };
};